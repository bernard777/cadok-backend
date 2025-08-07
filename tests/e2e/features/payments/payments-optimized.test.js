/**
 * 🧪 TEST PAYMENTS OPTIMISÉ - MODE RÉEL/MOCK
 * Tests E2E avec MongoDB réel quand disponible, sinon mock
 */

const E2EHelpers = require('../../helpers/E2EHelpers');

describe('💳 PAYMENTS E2E OPTIMISÉ', () => {
  
  let testUser;
  const testTimeout = 15000;

  beforeEach(async () => {
    console.log('🔧 Setup utilisateur test...');
    testUser = await E2EHelpers.registerUser();
    expect(testUser.success).toBe(true);
    console.log('✅ Utilisateur créé:', testUser.user?.pseudo || 'mock');
  }, testTimeout);

  afterEach(async () => {
    console.log('🧹 Cleanup test...');
    try {
      await E2EHelpers.cleanupTestData();
    } catch (error) {
      console.warn('⚠️ Erreur cleanup:', error.message);
    }
  }, 10000);

  describe('📋 Plans d\'abonnement', () => {
    test('Récupération liste des plans', async () => {
      console.log('🧪 Test récupération plans...');
      
      const result = await E2EHelpers.getSubscriptionPlans();
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.plans)).toBe(true);
      expect(result.plans.length).toBeGreaterThan(0);
      
      // Vérifier plans obligatoires
      const freePlan = result.plans.find(p => p.type === 'free');
      const premiumPlan = result.plans.find(p => p.type === 'premium');
      
      expect(freePlan).toBeDefined();
      expect(premiumPlan).toBeDefined();
      expect(premiumPlan.price).toBeGreaterThan(0);
      
      console.log('✅ Plans récupérés:', result.plans.length);
    }, testTimeout);

    test('Détails plan premium', async () => {
      console.log('🧪 Test détails plan premium...');
      
      const result = await E2EHelpers.getSubscriptionPlan('premium');
      
      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan.type).toBe('premium');
      expect(result.plan.features).toBeDefined();
      
      console.log('✅ Détails premium OK');
    }, testTimeout);

    test('Plan inexistant retourne erreur', async () => {
      console.log('🧪 Test plan inexistant...');
      
      const result = await E2EHelpers.getSubscriptionPlan('nonexistent');
      
      expect(result.success).toBe(false);
      
      console.log('✅ Plan inexistant correctement rejeté');
    }, testTimeout);
  });

  describe('💳 Méthodes de paiement', () => {
    test('Ajout carte Visa valide', async () => {
      console.log('🧪 Test ajout carte valide...');
      
      const cardData = {
        type: 'card',
        cardNumber: '4242424242424242', // Carte test Stripe
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.user?.pseudo || 'Test User'
      };

      const result = await E2EHelpers.addPaymentMethod(testUser.token, cardData);
      
      expect(result.success).toBe(true);
      expect(result.paymentMethod).toBeDefined();
      expect(result.paymentMethod.type).toBe('card');
      expect(result.paymentMethod.lastFour).toBe('4242');
      
      console.log('✅ Carte ajoutée:', result.paymentMethod.id);
    }, testTimeout);

    test('Rejet carte avec numéro invalide', async () => {
      console.log('🧪 Test carte invalide...');
      
      const invalidCard = {
        type: 'card',
        cardNumber: '1234567890123456', // Numéro invalide
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: 'Test User'
      };

      const result = await E2EHelpers.addPaymentMethod(testUser.token, invalidCard);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      
      console.log('✅ Carte invalide rejetée');
    }, testTimeout);

    test('Rejet carte expirée', async () => {
      console.log('🧪 Test carte expirée...');
      
      const expiredCard = {
        type: 'card',
        cardNumber: '4000000000000002',
        expiryMonth: 12,
        expiryYear: 2020, // Expirée
        cvc: '123',
        cardholderName: 'Test User'
      };

      const result = await E2EHelpers.addPaymentMethod(testUser.token, expiredCard);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      
      console.log('✅ Carte expirée rejetée');
    }, testTimeout);

    test('Récupération méthodes utilisateur', async () => {
      console.log('🧪 Test récupération méthodes...');
      
      // D'abord ajouter une méthode
      const cardData = {
        type: 'card',
        cardNumber: '4000000000000077',
        expiryMonth: 6,
        expiryYear: 2026,
        cvc: '456',
        cardholderName: 'Test User'
      };

      await E2EHelpers.addPaymentMethod(testUser.token, cardData);

      // Puis récupérer
      const result = await E2EHelpers.getPaymentMethods(testUser.token);
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.methods)).toBe(true);
      
      console.log('✅ Méthodes récupérées:', result.methods.length);
    }, testTimeout);
  });

  describe('🔧 Gestion abonnements', () => {
    test('Statut initial utilisateur', async () => {
      console.log('🧪 Test statut initial...');
      
      const result = await E2EHelpers.getSubscriptionStatus(testUser.token);
      
      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(['free', 'premium', 'basic'].includes(result.subscription.plan)).toBe(true);
      
      console.log('✅ Statut initial:', result.subscription.plan);
    }, testTimeout);

    test('Souscription abonnement premium', async () => {
      console.log('🧪 Test souscription premium...');
      
      // D'abord ajouter méthode de paiement
      const cardData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: 'Test User'
      };

      const paymentResult = await E2EHelpers.addPaymentMethod(testUser.token, cardData);
      expect(paymentResult.success).toBe(true);

      // Puis souscrire
      const result = await E2EHelpers.subscribeToplan(
        testUser.token, 
        'premium', 
        paymentResult.paymentMethod.id
      );
      
      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.subscription.plan).toBe('premium');
      expect(result.subscription.status).toBe('active');
      
      console.log('✅ Abonnement premium souscrit');
    }, testTimeout);

    test('Annulation abonnement', async () => {
      console.log('🧪 Test annulation abonnement...');
      
      // Souscrire d'abord
      const cardData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: 'Test User'
      };

      const paymentResult = await E2EHelpers.addPaymentMethod(testUser.token, cardData);
      const subscribeResult = await E2EHelpers.subscribeToplan(
        testUser.token, 
        'premium', 
        paymentResult.paymentMethod.id
      );
      
      expect(subscribeResult.success).toBe(true);

      // Puis annuler
      const result = await E2EHelpers.cancelSubscription(testUser.token);
      
      expect(result.success).toBe(true);
      expect(result.subscription.status).toBe('cancelled');
      
      console.log('✅ Abonnement annulé');
    }, testTimeout);
  });

  describe('💰 Paiements ponctuels', () => {
    test('Paiement réussi', async () => {
      console.log('🧪 Test paiement réussi...');
      
      const paymentData = {
        amount: 1999, // 19,99€ en centimes
        currency: 'eur',
        description: 'Test paiement E2E optimisé'
      };

      const result = await E2EHelpers.processPayment(testUser.token, paymentData);
      
      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.payment.status).toBe('succeeded');
      expect(result.payment.amount).toBe(paymentData.amount);
      
      console.log('✅ Paiement traité:', result.payment.id);
    }, testTimeout);

    test('Rejet montant négatif', async () => {
      console.log('🧪 Test montant négatif...');
      
      const invalidPayment = {
        amount: -500,
        currency: 'eur',
        description: 'Montant négatif'
      };

      const result = await E2EHelpers.processPayment(testUser.token, invalidPayment);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      
      console.log('✅ Montant négatif rejeté');
    }, testTimeout);

    test('Rejet montant zéro', async () => {
      console.log('🧪 Test montant zéro...');
      
      const zeroPayment = {
        amount: 0,
        currency: 'eur',
        description: 'Montant zéro'
      };

      const result = await E2EHelpers.processPayment(testUser.token, zeroPayment);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      
      console.log('✅ Montant zéro rejeté');
    }, testTimeout);
  });

  describe('🛡️ Sécurité', () => {
    test('Isolation des méthodes de paiement entre utilisateurs', async () => {
      console.log('🧪 Test isolation utilisateurs...');
      
      // Créer second utilisateur
      const otherUser = await E2EHelpers.registerUser();
      expect(otherUser.success).toBe(true);

      // Ajouter méthode pour premier utilisateur
      const cardData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: 'Test User 1'
      };

      await E2EHelpers.addPaymentMethod(testUser.token, cardData);

      // Vérifier que le second utilisateur ne voit pas les méthodes du premier
      const otherUserMethods = await E2EHelpers.getPaymentMethods(otherUser.token);
      
      expect(otherUserMethods.success).toBe(true);
      expect(otherUserMethods.methods.length).toBe(0);
      
      console.log('✅ Isolation respectée');
    }, testTimeout);
  });

});
