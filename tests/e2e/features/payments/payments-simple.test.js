/**
 * TEST PAYMENTS SIMPLIFIÉ EN MODE MOCK
 * Version allégée pour contourner les problèmes Jest
 */

const E2EHelpers = require('../../helpers/E2EHelpers');

// Forcer le mode mock dès le début
global.isDbConnected = () => false;

describe('💳 PAYMENTS - MODE MOCK SIMPLE', () => {
  
  let testUser;

  beforeEach(async () => {
    testUser = await E2EHelpers.registerUser();
    expect(testUser.success).toBe(true);
  });

  describe('📋 Plans de base', () => {
    test('Récupération des plans', async () => {
      const plansResult = await E2EHelpers.getSubscriptionPlans();
      
      expect(plansResult.success).toBe(true);
      expect(Array.isArray(plansResult.plans)).toBe(true);
      expect(plansResult.plans.length).toBeGreaterThan(0);
      
      const freePlan = plansResult.plans.find(p => p.type === 'free');
      const premiumPlan = plansResult.plans.find(p => p.type === 'premium');
      
      expect(freePlan).toBeDefined();
      expect(premiumPlan).toBeDefined();
    }, 10000);

    test('Détails plan premium', async () => {
      const planDetails = await E2EHelpers.getSubscriptionPlan('premium');
      
      expect(planDetails.success).toBe(true);
      expect(planDetails.plan).toBeDefined();
      expect(planDetails.plan.type).toBe('premium');
    }, 10000);
  });

  describe('💳 Méthodes paiement', () => {
    test('Ajout carte valide', async () => {
      const cardData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: 'Test User'
      };

      const result = await E2EHelpers.addPaymentMethod(testUser.token, cardData);
      
      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBeDefined();
      expect(result.paymentMethod.lastFour).toBe('4242');
    }, 10000);

    test('Rejet carte invalide', async () => {
      const invalidCard = {
        type: 'card',
        cardNumber: '123456',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: 'Test User'
      };

      const result = await E2EHelpers.addPaymentMethod(testUser.token, invalidCard);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    }, 10000);
  });

  describe('🔧 Abonnements', () => {
    test('Souscription premium', async () => {
      const result = await E2EHelpers.subscribeToplan(testUser.token, 'premium', 'pm_test');
      
      expect(result.success).toBe(true);
      expect(result.subscription.plan).toBe('premium');
      expect(result.subscription.status).toBe('active');
    }, 10000);

    test('Statut abonnement', async () => {
      const result = await E2EHelpers.getSubscriptionStatus(testUser.token);
      
      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(['free', 'premium', 'basic'].includes(result.subscription.plan)).toBe(true);
    }, 10000);
  });

  describe('💰 Paiements', () => {
    test('Paiement valide', async () => {
      const paymentData = {
        amount: 1999,
        currency: 'eur',
        description: 'Test'
      };

      const result = await E2EHelpers.processPayment(testUser.token, paymentData);
      
      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('succeeded');
      expect(result.payment.amount).toBe(1999);
    }, 10000);

    test('Rejet montant négatif', async () => {
      const invalidPayment = {
        amount: -100,
        currency: 'eur',
        description: 'Test invalide'
      };

      const result = await E2EHelpers.processPayment(testUser.token, invalidPayment);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    }, 10000);
  });

});
