const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const auth = require('../middlewares/auth');

/**
 * @route POST /api/payments/create-payment-intent
 * @desc Créer un Payment Intent pour un abonnement
 * @access Private
 */
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { plan, paymentMethodId } = req.body;
    
    if (!plan || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Plan et méthode de paiement requis'
      });
    }

    const result = await paymentService.createSubscriptionPayment(
      req.user.id,
      plan,
      paymentMethodId
    );

    if (result.success) {
      res.json({
        success: true,
        clientSecret: result.clientSecret,
        status: result.status
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Erreur création Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du paiement'
    });
  }
});

/**
 * @route POST /api/payments/create-subscription
 * @desc Créer un abonnement récurrent Stripe
 * @access Private
 */
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { plan, paymentMethodId } = req.body;
    
    console.log('=== DÉBUT CRÉATION ABONNEMENT ===');
    console.log('Plan demandé:', plan);
    console.log('PaymentMethodId:', paymentMethodId);
    console.log('User ID:', req.user.id);
    
    // Récupérer l'utilisateur complet pour avoir son email
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    console.log('✅ Utilisateur trouvé:', user.email);
    
    const result = await paymentService.createRecurringSubscription(
      req.user.id,
      plan,
      paymentMethodId,
      user.email
    );
    
    console.log('Résultat service:', result);

    if (result.success) {
      // Mettre à jour l'utilisateur avec les informations Stripe
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        stripeCustomerId: result.stripeCustomerId,
        stripeSubscriptionId: result.stripeSubscriptionId,
        subscriptionEndDate: result.currentPeriodEnd
      });

      res.json({
        success: true,
        subscription: {
          id: result.stripeSubscriptionId,
          status: result.status,
          currentPeriodEnd: result.currentPeriodEnd
        }
      });
    } else {
      console.log('❌ Échec service:', result.error);
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE création abonnement:');
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'abonnement'
    });
  }
});

/**
 * @route POST /api/payments/cancel-subscription
 * @desc Annuler un abonnement
 * @access Private
 */
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Aucun abonnement actif trouvé'
      });
    }

    const result = await paymentService.cancelSubscription(user.stripeSubscriptionId);

    if (result.success) {
      // Mettre à jour le statut dans la base de données
      await User.findByIdAndUpdate(req.user.id, {
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date(),
        subscriptionEndDate: result.cancelAt
      });

      res.json({
        success: true,
        message: 'Abonnement annulé avec succès',
        cancelAt: result.cancelAt
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation'
    });
  }
});

/**
 * @route POST /api/payments/webhook
 * @desc Webhook Stripe pour gérer les événements de paiement
 * @access Public (mais sécurisé par signature Stripe)
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Signature Stripe manquante'
      });
    }

    const result = await paymentService.handleWebhook(req.body, signature);

    if (result.success) {
      res.json({ received: true });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur traitement webhook'
    });
  }
});

/**
 * @route GET /api/payments/history
 * @desc Obtenir l'historique des paiements d'un utilisateur
 * @access Private
 */
router.get('/history', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('payments subscriptionHistory');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      payments: user.payments || [],
      subscriptionHistory: user.subscriptionHistory || []
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route GET /api/payments/plans
 * @desc Obtenir la liste des plans disponibles avec prix
 * @access Public
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 2,
        currency: 'EUR',
        period: 'month',
        features: [
          '10 objets maximum',
          '5 échanges maximum',
          'Support prioritaire',
          'Recherche avancée'
        ],
        limits: { maxObjects: 10, maxTrades: 5 }
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 5,
        currency: 'EUR',
        period: 'month',
        features: [
          'Objets illimités',
          'Échanges illimités',
          'Support prioritaire 24/7',
          'Recherche avancée'
        ],
        limits: { maxObjects: 'unlimited', maxTrades: 'unlimited' }
      }
    ];

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Erreur récupération plans:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/payments/validate-payment
 * @desc Valider un paiement après confirmation côté client
 * @access Private
 */
router.post('/validate-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, plan } = req.body;
    
    if (!paymentIntentId || !plan) {
      return res.status(400).json({
        success: false,
        message: 'ID de paiement et plan requis'
      });
    }

    // Récupérer le Payment Intent depuis Stripe pour vérifier son statut
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Mettre à jour l'abonnement de l'utilisateur
      const User = require('../models/User');
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
          subscriptionPlan: plan,
          subscriptionStatus: 'active',
          lastPaymentDate: new Date(),
          $push: {
            payments: {
              amount: paymentIntent.amount / 100, // Convertir de centimes en euros
              currency: paymentIntent.currency,
              status: 'success',
              paymentIntentId,
              date: new Date()
            }
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Paiement validé avec succès',
        user: {
          subscriptionPlan: updatedUser.subscriptionPlan,
          subscriptionStatus: updatedUser.subscriptionStatus
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Le paiement n\'a pas été confirmé'
      });
    }
  } catch (error) {
    console.error('Erreur validation paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la validation'
    });
  }
});

/**
 * @route POST /api/payments/payment-methods
 * @desc Ajouter une nouvelle méthode de paiement
 * @access Private
 */
router.post('/payment-methods', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'ID de méthode de paiement requis'
      });
    }

    const result = await paymentService.addPaymentMethod(req.user.id, paymentMethodId);

    if (result.success) {
      res.json({
        success: true,
        paymentMethod: result.paymentMethod,
        message: 'Méthode de paiement ajoutée avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur ajout méthode de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout de la méthode de paiement'
    });
  }
});

/**
 * @route GET /api/payments/payment-methods
 * @desc Obtenir les méthodes de paiement d'un utilisateur
 * @access Private
 */
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const result = await paymentService.getPaymentMethods(req.user.id);

    if (result.success) {
      res.json({
        success: true,
        paymentMethods: result.paymentMethods
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur récupération méthodes de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des méthodes de paiement'
    });
  }
});

/**
 * @route DELETE /api/payments/payment-methods/:paymentMethodId
 * @desc Supprimer une méthode de paiement
 * @access Private
 */
router.delete('/payment-methods/:paymentMethodId', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    
    const result = await paymentService.removePaymentMethod(req.user.id, paymentMethodId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur suppression méthode de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de la méthode de paiement'
    });
  }
});

/**
 * @route PUT /api/payments/payment-methods/:paymentMethodId/default
 * @desc Définir une méthode de paiement par défaut
 * @access Private
 */
router.put('/payment-methods/:paymentMethodId/default', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    
    const result = await paymentService.setDefaultPaymentMethod(req.user.id, paymentMethodId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur définition méthode par défaut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la définition de la méthode par défaut'
    });
  }
});

/**
 * @route PUT /api/payments/payment-methods/:paymentMethodId
 * @desc Mettre à jour une méthode de paiement
 * @access Private
 */
router.put('/payment-methods/:paymentMethodId', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const updateData = req.body;
    
    const result = await paymentService.updatePaymentMethod(req.user.id, paymentMethodId, updateData);

    if (result.success) {
      res.json({
        success: true,
        paymentMethod: result.paymentMethod,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour méthode de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la méthode de paiement'
    });
  }
});

module.exports = router;
