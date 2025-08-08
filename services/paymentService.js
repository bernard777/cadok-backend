const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  /**
   * Créer un Payment Intent pour un abonnement
   */
  async createSubscriptionPayment(userId, plan, paymentMethodId) {
    try {
      // Mode test: Simulation pour éviter les appels Stripe
      if (process.env.NODE_ENV === 'test') {
        console.log('🧪 [PAYMENT SERVICE] Mode test - Simulation création payment intent');
        console.log('- userId:', userId);
        console.log('- plan:', plan);
        console.log('- paymentMethodId:', paymentMethodId);
        
        const planConfig = this.getPlanConfig(plan);
        
        const mockPaymentIntent = {
          id: `pi_test_${Date.now()}`,
          status: 'succeeded',
          amount: planConfig.price * 100,
          currency: 'eur',
          client_secret: `pi_test_${Date.now()}_secret_test`,
          metadata: {
            userId: userId.toString(),
            plan,
            type: 'subscription'
          }
        };

        console.log('✅ [PAYMENT SERVICE] Payment Intent simulé:', mockPaymentIntent.id);
        
        return {
          success: true,
          paymentIntent: mockPaymentIntent,
          clientSecret: mockPaymentIntent.client_secret,
          status: mockPaymentIntent.status
        };
      }

      const planConfig = this.getPlanConfig(plan);
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: planConfig.price * 100, // Convertir en centimes
        currency: 'eur',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          userId: userId.toString(),
          plan,
          type: 'subscription'
        }
      });

      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Erreur paiement Stripe:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Créer un abonnement récurrent Stripe
   */
  async createRecurringSubscription(userId, plan, paymentMethodId, userEmail = null) {
    try {
      console.log('🔄 Service: Début createRecurringSubscription');
      console.log('- userId:', userId);
      console.log('- plan:', plan);
      console.log('- paymentMethodId:', paymentMethodId);
      console.log('- userEmail:', userEmail);

      // Mode test: Simulation complète pour éviter les appels Stripe
      if (process.env.NODE_ENV === 'test') {
        console.log('🧪 [PAYMENT SERVICE] Mode test - Simulation création abonnement');
        
        const mockSubscription = {
          id: `sub_test_${Date.now()}`,
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // +30 jours
          plan: {
            id: `price_test_${plan}`,
            nickname: plan
          },
          customer: `cus_test_${userId}`,
          default_payment_method: paymentMethodId,
          metadata: {
            userId: userId.toString(),
            plan
          }
        };

        console.log('✅ [PAYMENT SERVICE] Abonnement simulé créé:', mockSubscription.id);
        
        // Retourner la structure attendue par la route
        return {
          success: true,
          stripeSubscriptionId: mockSubscription.id,
          stripeCustomerId: mockSubscription.customer,
          status: mockSubscription.status,
          currentPeriodEnd: new Date(mockSubscription.current_period_end * 1000)
        };
      }
      
      // Créer ou récupérer le client Stripe
      let customer = await this.getOrCreateCustomer(userId, userEmail);
      console.log('✅ Service: Client Stripe créé/récupéré:', customer.id);
      
      // Attacher la méthode de paiement au client
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Définir comme méthode de paiement par défaut
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Créer l'abonnement Stripe
      const priceId = this.getStripePriceId(plan);
      console.log('💰 Price ID utilisé:', priceId);
      
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: priceId,
        }],
        default_payment_method: paymentMethodId,
        metadata: {
          userId: userId.toString(),
          plan
        }
      });
      
      console.log('✅ Service: Abonnement créé:', subscription.id);
      console.log('📅 Current period end:', subscription.current_period_end);

      return {
        success: true,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000) : 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours par défaut
      };
    } catch (error) {
      console.error('❌ ERREUR Service Stripe:');
      console.error('- Message:', error.message);
      console.error('- Type:', error.type);
      console.error('- Code:', error.code);
      console.error('- Stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Annuler un abonnement Stripe
   */
  async cancelSubscription(stripeSubscriptionId) {
    try {
      // Mode test: Simulation pour éviter les appels Stripe
      if (process.env.NODE_ENV === 'test') {
        console.log('🧪 [PAYMENT SERVICE] Mode test - Simulation annulation abonnement');
        console.log('- subscriptionId:', stripeSubscriptionId);
        
        return {
          success: true,
          cancelAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // +30 jours
        };
      }

      const subscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      return {
        success: true,
        cancelAt: new Date(subscription.cancel_at * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Créer ou récupérer un client Stripe
   */
  async getOrCreateCustomer(userId, userEmail = null) {
    try {
      console.log('🔍 Recherche client existant...');
      
      // Chercher un client existant par email s'il est fourni
      let existingCustomers = { data: [] };
      if (userEmail) {
        existingCustomers = await this.stripe.customers.list({
          email: userEmail,
          limit: 1
        });
        console.log('Clients trouvés par email:', existingCustomers.data.length);
      }

      if (existingCustomers.data.length > 0) {
        console.log('✅ Client existant trouvé:', existingCustomers.data[0].id);
        return existingCustomers.data[0];
      }

      console.log('🆕 Création nouveau client Stripe...');

      // Créer un nouveau client
      const customerData = {
        metadata: { userId: userId.toString() }
      };
      
      // Ajouter l'email si fourni
      if (userEmail) {
        customerData.email = userEmail;
      }
      
      const customer = await this.stripe.customers.create(customerData);

      return customer;
    } catch (error) {
      throw new Error(`Erreur création client Stripe: ${error.message}`);
    }
  }

  /**
   * Configuration des plans
   */
  getPlanConfig(plan) {
    const configs = {
      basic: { 
        price: 2, 
        stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
        name: 'Basic'
      },
      premium: { 
        price: 5, 
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
        name: 'Premium'
      }
    };
    
    if (!configs[plan]) {
      throw new Error(`Plan non supporté: ${plan}`);
    }
    
    return configs[plan];
  }

  /**
   * Obtenir l'ID du prix Stripe pour un plan
   */
  getStripePriceId(plan) {
    const config = this.getPlanConfig(plan);
    return config.stripePriceId;
  }

  /**
   * Traiter un webhook Stripe
   */
  async handleWebhook(body, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('Webhook Stripe reçu:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleSubscriptionPayment(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;

        default:
          console.log(`Événement Stripe non géré: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur webhook Stripe:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gérer un paiement réussi
   */
  async handlePaymentSuccess(paymentIntent) {
    const { userId, plan } = paymentIntent.metadata;
    
    if (userId && plan) {
      // Mettre à jour l'abonnement dans la base de données
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: plan,
        subscriptionStatus: 'active'
      });
      
      console.log(`Abonnement ${plan} activé pour l'utilisateur ${userId}`);
    }
  }

  /**
   * Gérer un échec de paiement
   */
  async handlePaymentFailed(paymentIntent) {
    const { userId } = paymentIntent.metadata;
    
    if (userId) {
      // Notifier l'utilisateur de l'échec
      console.log(`Échec de paiement pour l'utilisateur ${userId}`);
      // Ici, vous pourriez envoyer une notification push ou email
    }
  }

  /**
   * Gérer un paiement d'abonnement réussi
   */
  async handleSubscriptionPayment(invoice) {
    // Prolonger l'abonnement
    console.log('Paiement d\'abonnement réussi:', invoice.id);
  }

  /**
   * Gérer une annulation d'abonnement
   */
  async handleSubscriptionCanceled(subscription) {
    const { userId } = subscription.metadata;
    
    if (userId) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: 'free',
        subscriptionStatus: 'cancelled'
      });
      
      console.log(`Abonnement annulé pour l'utilisateur ${userId}`);
    }
  }

  /**
   * Ajouter une nouvelle méthode de paiement
   */
  async addPaymentMethod(userId, paymentMethodId) {
    try {
      const User = require('../models/User');
      
      // Récupérer l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      let paymentMethod;
      
      // 🧪 MODE TEST : Simuler la méthode de paiement
      if (process.env.NODE_ENV === 'test' && paymentMethodId.startsWith('pm_test_')) {
        console.log('🧪 [PAYMENT SERVICE] Mode test détecté - Simulation PaymentMethod');
        paymentMethod = {
          id: paymentMethodId,
          type: 'card',
          card: {
            last4: '4242',
            brand: 'visa',
            exp_month: 12,
            exp_year: 2025
          }
        };
      } else {
        // Mode production : Récupérer la méthode de paiement depuis Stripe
        paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      }
      
      if (!paymentMethod || !paymentMethod.card) {
        throw new Error('Méthode de paiement invalide');
      }

      // Obtenir ou créer le client Stripe (sauf en mode test)
      let customer;
      if (process.env.NODE_ENV === 'test') {
        console.log('🧪 [PAYMENT SERVICE] Mode test - Simulation client Stripe');
        customer = { id: `cus_test_${userId}` };
      } else {
        customer = await this.getOrCreateCustomer(userId, user.email);
        // Attacher la méthode de paiement au client
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id,
        });
      }

      // Créer l'objet méthode de paiement pour la base de données
      const newPaymentMethod = {
        stripePaymentMethodId: paymentMethodId,
        type: paymentMethod.type,
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expiryMonth: paymentMethod.card.exp_month,
        expiryYear: paymentMethod.card.exp_year,
        isDefault: user.paymentMethods.length === 0, // Premier = défaut
        createdAt: new Date()
      };

      // Ajouter la méthode de paiement à l'utilisateur
      await User.findByIdAndUpdate(userId, {
        $push: { paymentMethods: newPaymentMethod },
        stripeCustomerId: customer.id
      });

      return {
        success: true,
        paymentMethod: newPaymentMethod
      };
    } catch (error) {
      console.error('Erreur ajout méthode de paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les méthodes de paiement d'un utilisateur
   */
  async getPaymentMethods(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId).select('paymentMethods stripeCustomerId');
      
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return {
        success: true,
        paymentMethods: user.paymentMethods || []
      };
    } catch (error) {
      console.error('Erreur récupération méthodes de paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Supprimer une méthode de paiement
   */
  async removePaymentMethod(userId, paymentMethodId) {
    try {
      const User = require('../models/User');
      
      // Récupérer l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Trouver la méthode de paiement
      const paymentMethod = user.paymentMethods.find(
        pm => pm.stripePaymentMethodId === paymentMethodId
      );

      if (!paymentMethod) {
        throw new Error('Méthode de paiement non trouvée');
      }

      // Détacher de Stripe si l'utilisateur a un ID client (sauf en mode test)
      if (user.stripeCustomerId && process.env.NODE_ENV !== 'test') {
        await this.stripe.paymentMethods.detach(paymentMethodId);
      } else if (process.env.NODE_ENV === 'test') {
        console.log('🧪 [PAYMENT SERVICE] Mode test - Simulation détachement PaymentMethod');
      }

      // Supprimer de la base de données
      await User.findByIdAndUpdate(userId, {
        $pull: { paymentMethods: { stripePaymentMethodId: paymentMethodId } }
      });

      // Si c'était la méthode par défaut, définir une nouvelle par défaut
      if (paymentMethod.isDefault && user.paymentMethods.length > 1) {
        const remainingMethods = user.paymentMethods.filter(
          pm => pm.stripePaymentMethodId !== paymentMethodId
        );
        
        if (remainingMethods.length > 0) {
          await User.findOneAndUpdate(
            { 
              _id: userId,
              'paymentMethods.stripePaymentMethodId': remainingMethods[0].stripePaymentMethodId
            },
            { 
              $set: { 'paymentMethods.$.isDefault': true } 
            }
          );
        }
      }

      return {
        success: true,
        message: 'Méthode de paiement supprimée avec succès'
      };
    } catch (error) {
      console.error('Erreur suppression méthode de paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Définir une méthode de paiement par défaut
   */
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    try {
      const User = require('../models/User');
      
      // Récupérer l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier que la méthode de paiement existe
      const paymentMethodExists = user.paymentMethods.some(
        pm => pm.stripePaymentMethodId === paymentMethodId
      );

      if (!paymentMethodExists) {
        throw new Error('Méthode de paiement non trouvée');
      }

      // Retirer le statut par défaut de toutes les méthodes
      await User.findByIdAndUpdate(userId, {
        $set: { 'paymentMethods.$[].isDefault': false }
      });

      // Définir la nouvelle méthode par défaut
      await User.findOneAndUpdate(
        { 
          _id: userId,
          'paymentMethods.stripePaymentMethodId': paymentMethodId
        },
        { 
          $set: { 'paymentMethods.$.isDefault': true } 
        }
      );

      // Mettre à jour dans Stripe aussi
      if (user.stripeCustomerId) {
        await this.stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return {
        success: true,
        message: 'Méthode de paiement par défaut mise à jour'
      };
    } catch (error) {
      console.error('Erreur définition méthode par défaut:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mettre à jour une méthode de paiement (par exemple, la date d'expiration)
   */
  async updatePaymentMethod(userId, paymentMethodId, updateData) {
    try {
      const User = require('../models/User');
      
      // Récupérer les données fraîches depuis Stripe
      const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (!stripePaymentMethod || !stripePaymentMethod.card) {
        throw new Error('Méthode de paiement non trouvée dans Stripe');
      }

      // Mettre à jour dans la base de données avec les données Stripe
      const updateFields = {
        'paymentMethods.$.last4': stripePaymentMethod.card.last4,
        'paymentMethods.$.brand': stripePaymentMethod.card.brand,
        'paymentMethods.$.expiryMonth': stripePaymentMethod.card.exp_month,
        'paymentMethods.$.expiryYear': stripePaymentMethod.card.exp_year
      };

      await User.findOneAndUpdate(
        { 
          _id: userId,
          'paymentMethods.stripePaymentMethodId': paymentMethodId
        },
        { 
          $set: updateFields
        }
      );

      return {
        success: true,
        message: 'Méthode de paiement mise à jour',
        paymentMethod: {
          stripePaymentMethodId: paymentMethodId,
          last4: stripePaymentMethod.card.last4,
          brand: stripePaymentMethod.card.brand,
          expiryMonth: stripePaymentMethod.card.exp_month,
          expiryYear: stripePaymentMethod.card.exp_year
        }
      };
    } catch (error) {
      console.error('Erreur mise à jour méthode de paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PaymentService();
