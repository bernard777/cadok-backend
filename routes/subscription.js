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
    } else {
      // Vérifier et appliquer les changements programmés
      if (subscription.applyScheduledChanges()) {
        await subscription.save();
      }
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
  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      price: 0,
      currency: 'EUR',
      period: 'forever',
      features: ['3 objets maximum', '2 échanges maximum', 'Support communautaire'],
      limits: { maxObjects: 3, maxTrades: 2 },
      recommended: false
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 2,
      currency: 'EUR',
      period: 'month',
      features: ['10 objets maximum', '5 échanges maximum', 'Support prioritaire', 'Recherche avancée'],
      limits: { maxObjects: 10, maxTrades: 5 },
      recommended: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 5,
      currency: 'EUR',
      period: 'month',
      features: ['Objets illimités', 'Échanges illimités', 'Support prioritaire 24/7', 'Recherche avancée', 'Fonctionnalités exclusives'],
      limits: { maxObjects: 'unlimited', maxTrades: 'unlimited' },
      recommended: true
    }
  ];
  
  res.json(plans);
});

// @route   POST /api/subscriptions/upgrade
// @desc    Mettre à niveau l'abonnement
// @access  Private
router.post('/upgrade', auth, async (req, res) => {
  try {
    console.log('🔄 Upgrade request received:', req.body);
    console.log('👤 User from auth:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('❌ Utilisateur non authentifié');
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    
    const { plan, paymentMethod } = req.body;
    
    if (!plan) {
      console.log('❌ Plan manquant');
      return res.status(400).json({ message: 'Plan requis' });
    }
    
    if (!['free', 'basic', 'premium'].includes(plan)) {
      console.log('❌ Plan invalide:', plan);
      return res.status(400).json({ message: 'Plan invalide' });
    }
    
    console.log('✅ Plan valide:', plan);
    
    let subscription = await Subscription.findOne({ user: req.user.id });
    console.log('📋 Subscription trouvé:', subscription ? 'Oui' : 'Non');
    
    if (!subscription) {
      console.log('🆕 Création nouvel abonnement');
      subscription = new Subscription({ user: req.user.id });
    }

    const currentPlan = subscription.plan || 'free';
    const newPlan = plan;

    // Logique de transition selon les bonnes pratiques
    if (currentPlan === newPlan) {
      return res.status(400).json({ message: 'Vous êtes déjà sur ce plan' });
    }

    const planHierarchy = { free: 0, basic: 1, premium: 2 };
    const isUpgrade = planHierarchy[newPlan] > planHierarchy[currentPlan];
    const isDowngrade = planHierarchy[newPlan] < planHierarchy[currentPlan];

    // Calculer la date de fin selon le plan
    const endDate = new Date();
    let monthlyPrice = 0; // Initialiser la variable
    
    if (newPlan === 'free') {
      // Retour au plan gratuit - immédiat mais conserve les bénéfices jusqu'à la fin de la période
      if (subscription.endDate && subscription.endDate > new Date()) {
        subscription.scheduledPlan = 'free';
        subscription.scheduledChangeDate = subscription.endDate;
        await subscription.save();
        return res.json({
          message: `Votre abonnement sera rétrogradé vers le plan gratuit le ${subscription.endDate.toLocaleDateString()}`,
          subscription: await subscription.populate('user', 'email pseudo'),
          scheduled: true
        });
      } else {
        subscription.plan = 'free';
        subscription.status = 'active';
        subscription.endDate = null;
        subscription.monthlyPrice = 0;
        monthlyPrice = 0; // Plan gratuit
      }
    } else {
      // Plans payants
      endDate.setMonth(endDate.getMonth() + 1);
      monthlyPrice = newPlan === 'basic' ? 2 : 5; // Définir le prix ici
      
      subscription.plan = newPlan;
      subscription.status = 'active';
      subscription.endDate = endDate;
      subscription.monthlyPrice = monthlyPrice;
      subscription.scheduledPlan = null;
      subscription.scheduledChangeDate = null;
    }
    
    if (paymentMethod) {
      subscription.paymentMethod = paymentMethod;
    }
    
    // Ajouter un paiement fictif seulement pour les plans payants
    if (monthlyPrice > 0) {
      subscription.payments.push({
        amount: monthlyPrice,
        status: 'success',
        transactionId: `txn_${Date.now()}`
      });
    }
    
    await subscription.save();
    console.log('✅ Subscription sauvé avec succès');
    
    res.json({
      success: true,
      message: `Abonnement mis à niveau vers ${plan}`,
      subscription
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à niveau:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    
    if (subscription.plan === 'free' && !subscription.scheduledPlan) {
      return res.status(400).json({ message: 'Impossible d\'annuler un abonnement gratuit' });
    }
    
    // Cas 1: Annulation d'un changement programmé vers gratuit
    if (subscription.scheduledPlan === 'free' && subscription.scheduledChangeDate) {
      subscription.scheduledPlan = null;
      subscription.scheduledChangeDate = null;
      subscription.autoRenew = false;
      
      await subscription.save();
      
      return res.json({
        success: true,
        message: 'Changement programmé annulé. Votre abonnement continuera jusqu\'à la fin de la période en cours.',
        subscription,
        action: 'scheduled_change_cancelled'
      });
    }
    
    // Cas 2: Annulation d'un abonnement actif
    if (subscription.plan !== 'free') {
      // Programmer la fin à la date d'expiration
      if (subscription.endDate && subscription.endDate > new Date()) {
        subscription.scheduledPlan = 'free';
        subscription.scheduledChangeDate = subscription.endDate;
        subscription.autoRenew = false;
        
        await subscription.save();
        
        return res.json({
          success: true,
          message: `Abonnement annulé. Vous conserverez les bénéfices jusqu'au ${subscription.endDate.toLocaleDateString()}`,
          subscription,
          action: 'cancellation_scheduled'
        });
      } else {
        // Fin immédiate si pas de date d'expiration
        subscription.plan = 'free';
        subscription.status = 'cancelled';
        subscription.autoRenew = false;
        subscription.endDate = null;
        subscription.monthlyPrice = 0;
        
        await subscription.save();
        
        return res.json({
          message: 'Abonnement annulé immédiatement',
          subscription,
          action: 'immediate_cancellation'
        });
      }
    }
    
    res.json({
      message: 'Abonnement annulé avec succès',
      subscription
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/subscriptions/cancel-scheduled
// @desc    Annuler un changement programmé
// @access  Private
router.post('/cancel-scheduled', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Aucun abonnement trouvé' });
    }
    
    if (!subscription.scheduledPlan || !subscription.scheduledChangeDate) {
      return res.status(400).json({ message: 'Aucun changement programmé à annuler' });
    }
    
    const scheduledPlan = subscription.scheduledPlan;
    
    // Annuler le changement programmé
    subscription.scheduledPlan = null;
    subscription.scheduledChangeDate = null;
    subscription.autoRenew = true; // Réactiver le renouvellement automatique
    
    await subscription.save();
    
    res.json({
      message: `Changement programmé vers "${scheduledPlan}" annulé avec succès`,
      subscription: await subscription.populate('user', 'email pseudo'),
      action: 'scheduled_change_cancelled'
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du changement programmé:', error);
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
      // ✅ CORRECTION: Compter seulement les échanges RÉUSSIS pour les quotas
      Trade.countDocuments({ 
        $or: [
          { fromUser: req.user.id },
          { toUser: req.user.id }
        ],
        status: 'completed' // ✅ Seulement les échanges complétés comptent pour les quotas
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
