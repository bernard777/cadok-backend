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
  async createRecurringSubscription(userId, plan, paymentMethodId) {
    try {
      // Créer ou récupérer le client Stripe
      let customer = await this.getOrCreateCustomer(userId);
      
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
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: this.getStripePriceId(plan),
        }],
        default_payment_method: paymentMethodId,
        metadata: {
          userId: userId.toString(),
          plan
        }
      });

      return {
        success: true,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      console.error('Erreur abonnement Stripe:', error);
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
  async getOrCreateCustomer(userId) {
    try {
      // Chercher un client existant
      const existingCustomers = await this.stripe.customers.list({
        metadata: { userId: userId.toString() },
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Créer un nouveau client
      const customer = await this.stripe.customers.create({
        metadata: { userId: userId.toString() }
      });

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
}

module.exports = new PaymentService();
