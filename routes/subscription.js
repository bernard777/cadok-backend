const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const auth = require('../middlewares/auth');

// @route   GET /api/subscriptions/current
// @desc    Obtenir l'abonnement actuel de l'utilisateur
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user.id }).populate('user', 'email pseudo');
    
    if (!subscription) {
      subscription = new Subscription({
        user: req.user.id,
        plan: 'free'
      });
      await subscription.save();
      await subscription.populate('user', 'email pseudo');
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/subscriptions/plans
// @desc    Obtenir les plans disponibles
// @access  Public
router.get('/plans', (req, res) => {
  const plans = {
    free: {
      name: 'Gratuit',
      price: 0,
      currency: 'EUR',
      period: 'forever',
      features: ['3 objets maximum', '2 échanges maximum', 'Support communautaire'],
      limits: { maxObjects: 3, maxTrades: 2 }
    },
    basic: {
      name: 'Basic',
      price: 2,
      currency: 'EUR',
      period: 'month',
      features: ['10 objets maximum', '5 échanges maximum', 'Support prioritaire', 'Recherche avancée'],
      limits: { maxObjects: 10, maxTrades: 5 }
    },
    premium: {
      name: 'Premium',
      price: 5,
      currency: 'EUR',
      period: 'month',
      features: ['Objets illimités', 'Échanges illimités', 'Support prioritaire 24/7', 'Recherche avancée', 'Mise en avant des objets', 'Statistiques détaillées'],
      limits: { maxObjects: 'unlimited', maxTrades: 'unlimited' }
    }
  };
  
  res.json(plans);
});

// @route   POST /api/subscriptions/upgrade
// @desc    Mettre à niveau l'abonnement
// @access  Private
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;
    
    console.log('📋 Demande de changement d\'abonnement:', { 
      userId: req.user.id, 
      nouveauPlan: plan, 
      paymentMethod: paymentMethod ? 'fourni' : 'non fourni' 
    });
    
    if (!['basic', 'premium'].includes(plan)) {
      console.log('❌ Plan invalide:', plan);
      return res.status(400).json({ message: 'Plan invalide' });
    }
    
    let subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription) {
      console.log('🆕 Création d\'un nouvel abonnement');
      subscription = new Subscription({ user: req.user.id });
    } else {
      console.log('📝 Abonnement existant:', { 
        planActuel: subscription.plan, 
        statut: subscription.status 
      });
    }
    
    // Calculer la date de fin selon le plan
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    const monthlyPrice = plan === 'basic' ? 2 : 5;
    
    subscription.plan = plan;
    subscription.status = 'active';
    subscription.endDate = endDate;
    subscription.monthlyPrice = monthlyPrice;
    
    if (paymentMethod) {
      subscription.paymentMethod = paymentMethod;
    }
    
    // Ajouter un paiement fictif
    subscription.payments.push({
      amount: monthlyPrice,
      status: 'success',
      transactionId: `txn_${Date.now()}`
    });
    
    console.log('💾 Sauvegarde de l\'abonnement:', {
      plan: subscription.plan,
      status: subscription.status,
      endDate: subscription.endDate,
      monthlyPrice: subscription.monthlyPrice
    });
    
    await subscription.save();
    
    console.log('✅ Abonnement sauvegardé avec succès');
    
    res.json({
      message: `Abonnement mis à niveau vers ${plan}`,
      subscription
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à niveau:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Annuler l'abonnement
// @access  Private
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Aucun abonnement trouvé' });
    }
    
    if (subscription.plan === 'free') {
      return res.status(400).json({ message: 'Impossible d\'annuler un abonnement gratuit' });
    }
    
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    
    await subscription.save();
    
    res.json({
      message: 'Abonnement annulé avec succès',
      subscription
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/subscriptions/usage
// @desc    Obtenir les statistiques d'utilisation
// @access  Private
router.get('/usage', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Aucun abonnement trouvé' });
    }
    
    // Compter les objets et échanges de l'utilisateur
    const Object = require('../models/Object');
    const Trade = require('../models/Trade');
    
    const [objectsCount, tradesCount] = await Promise.all([
      Object.countDocuments({ owner: req.user.id }),
      Trade.countDocuments({ 
        $or: [
          { fromUser: req.user.id },
          { toUser: req.user.id }
        ]
      })
    ]);
    
    const limits = subscription.getLimits();
    
    res.json({
      current: {
        objects: objectsCount,
        trades: tradesCount
      },
      limits,
      plan: subscription.plan,
      isActive: subscription.isActive(),
      premiumFeatures: subscription.premiumFeatures
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/subscriptions
// @desc    Obtenir tous les abonnements (Admin)
// @access  Private (Admin uniquement)
router.get('/', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin (à implémenter selon votre logique)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Accès refusé' });
    // }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const subscriptions = await Subscription.find()
      .populate('user', 'email pseudo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Subscription.countDocuments();
    
    res.json({
      subscriptions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
