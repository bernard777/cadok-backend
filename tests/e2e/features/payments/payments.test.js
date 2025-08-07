/**
 * FEATURE E2E - SYSTÈME DE PAIEMENTS
 * Tests isolés pour abonnements, méthodes de paiement, et sécurité
 */

const E2EHelpers = require('../../helpers/E2EHelpers');

describe('💳 FEATURE E2E - SYSTÈME DE PAIEMENTS', () => {
  
  let testUser;

  beforeEach(async () => {
    // Utilisateur dédié pour cette feature
    const result = await E2EHelpers.registerUser();
    expect(result.success).toBe(true);
    testUser = result;
  });

  afterEach(async () => {
    await E2EHelpers.cleanupTestData();
  });

  describe('📋 Plans d\'abonnement', () => {
    
    test('Récupération de la liste des plans disponibles', async () => {
      const plansResult = await E2EHelpers.getSubscriptionPlans();
      
      expect(plansResult.success).toBe(true);
      expect(Array.isArray(plansResult.plans)).toBe(true);
      expect(plansResult.plans.length).toBeGreaterThan(0);
      
      // Vérifier qu'il y a au moins un plan gratuit et un premium
      const freePlan = plansResult.plans.find(p => p.type === 'free');
      const premiumPlan = plansResult.plans.find(p => p.type === 'premium');
      
      expect(freePlan).toBeDefined();
      expect(premiumPlan).toBeDefined();
      expect(premiumPlan.price).toBeGreaterThan(0);
      
      console.log('✅ Plans récupérés:', plansResult.plans.length);
    });

    test('Détails d\'un plan spécifique', async () => {
      const planDetails = await E2EHelpers.getSubscriptionPlan('premium');
      
      expect(planDetails.success).toBe(true);
      expect(planDetails.plan).toBeDefined();
      expect(planDetails.plan.type).toBe('premium');
      expect(planDetails.plan.features).toBeDefined();
      expect(Array.isArray(planDetails.plan.features)).toBe(true);
      
      console.log('✅ Détails plan premium récupérés');
    });

  });

  describe('💳 Méthodes de paiement', () => {
    
    test('Ajout d\'une méthode de paiement (simulation)', async () => {
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242', // Numéro de test Stripe
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.user.pseudo
      };

      const addResult = await E2EHelpers.addPaymentMethod(testUser.token, paymentMethodData);
      
      expect(addResult.success).toBe(true);
      expect(addResult.paymentMethod).toBeDefined();
      expect(addResult.paymentMethod.type).toBe('card');
      expect(addResult.paymentMethod.lastFour).toBe('4242');
      
      console.log('✅ Méthode de paiement ajoutée:', addResult.paymentMethod.id);
    });

    test('Récupération des méthodes de paiement utilisateur', async () => {
      // D'abord ajouter une méthode
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4000000000000002', // Autre carte test
        expiryMonth: 6,
        expiryYear: 2026,
        cvc: '456',
        cardholderName: testUser.user.pseudo
      };

      await E2EHelpers.addPaymentMethod(testUser.token, paymentMethodData);

      // Puis récupérer la liste
      const methodsResult = await E2EHelpers.getPaymentMethods(testUser.token);
      
      expect(methodsResult.success).toBe(true);
      expect(Array.isArray(methodsResult.methods)).toBe(true);
      expect(methodsResult.methods.length).toBeGreaterThan(0);
      
      console.log('✅ Méthodes de paiement récupérées:', methodsResult.methods.length);
    });

    test('Suppression d\'une méthode de paiement', async () => {
      // Ajouter une méthode
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4000000000000077',
        expiryMonth: 3,
        expiryYear: 2027,
        cvc: '789',
        cardholderName: testUser.user.pseudo
      };

      const addResult = await E2EHelpers.addPaymentMethod(testUser.token, paymentMethodData);
      expect(addResult.success).toBe(true);

      // Supprimer la méthode
      const deleteResult = await E2EHelpers.deletePaymentMethod(testUser.token, addResult.paymentMethod.id);
      
      expect(deleteResult.success).toBe(true);
      console.log('✅ Méthode de paiement supprimée');
    });

  });

  describe('🔧 Gestion d\'abonnement', () => {
    
    test('Souscription à un abonnement premium', async () => {
      // D'abord ajouter une méthode de paiement
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.user.pseudo
      };

      const paymentMethod = await E2EHelpers.addPaymentMethod(testUser.token, paymentMethodData);
      expect(paymentMethod.success).toBe(true);

      // Souscrire à premium
      const subscribeResult = await E2EHelpers.subscribeToplan(testUser.token, 'premium', paymentMethod.paymentMethod.id);
      
      expect(subscribeResult.success).toBe(true);
      expect(subscribeResult.subscription).toBeDefined();
      expect(subscribeResult.subscription.plan).toBe('premium');
      expect(subscribeResult.subscription.status).toBe('active');
      
      console.log('✅ Abonnement premium souscrit:', subscribeResult.subscription.id);
    });

    test('Consultation du statut d\'abonnement', async () => {
      const statusResult = await E2EHelpers.getSubscriptionStatus(testUser.token);
      
      expect(statusResult.success).toBe(true);
      expect(statusResult.subscription).toBeDefined();
      // Par défaut, devrait être 'free'
      expect(['free', 'premium', 'basic'].includes(statusResult.subscription.plan)).toBe(true);
      
      console.log('✅ Statut abonnement:', statusResult.subscription.plan);
    });

    test('Annulation d\'abonnement premium', async () => {
      // Souscrire d'abord
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.user.pseudo
      };

      const paymentMethod = await E2EHelpers.addPaymentMethod(testUser.token, paymentMethodData);
      expect(paymentMethod.success).toBe(true);

      const subscribeResult = await E2EHelpers.subscribeToplan(testUser.token, 'premium', paymentMethod.paymentMethod.id);
      expect(subscribeResult.success).toBe(true);

      // Annuler
      const cancelResult = await E2EHelpers.cancelSubscription(testUser.token);
      
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.subscription.status).toBe('cancelled');
      
      console.log('✅ Abonnement annulé avec succès');
    });

  });

  describe('🛡️ Sécurité des paiements', () => {
    
    test('Rejet de carte invalide', async () => {
      const invalidCardData = {
        type: 'card',
        cardNumber: '1234567890123456', // Numéro invalide
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.user.pseudo
      };

      const addResult = await E2EHelpers.addPaymentMethod(testUser.token, invalidCardData);
      
      expect(addResult.success).toBe(false);
      expect(addResult.status).toBe(400);
      console.log('✅ Carte invalide correctement rejetée');
    });

    test('Rejet de carte expirée', async () => {
      const expiredCardData = {
        type: 'card',
        cardNumber: '4000000000000002',
        expiryMonth: 12,
        expiryYear: 2020, // Expirée
        cvc: '123',
        cardholderName: testUser.user.pseudo
      };

      const addResult = await E2EHelpers.addPaymentMethod(testUser.token, expiredCardData);
      
      expect(addResult.success).toBe(false);
      expect(addResult.status).toBe(400);
      console.log('✅ Carte expirée correctement rejetée');
    });

    test('Protection contre accès non autorisé aux méthodes de paiement', async () => {
      // Créer un autre utilisateur
      const otherUser = await E2EHelpers.registerUser();
      expect(otherUser.success).toBe(true);

      // Ajouter une méthode pour testUser
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.user.pseudo
      };

      const addResult = await E2EHelpers.addPaymentMethod(testUser.token, paymentMethodData);
      expect(addResult.success).toBe(true);

      // Tenter d'accéder avec l'autre utilisateur
      const unauthorizedAccess = await E2EHelpers.getPaymentMethods(otherUser.token);
      
      // Ne devrait pas voir les méthodes de testUser
      expect(unauthorizedAccess.success).toBe(true);
      expect(unauthorizedAccess.methods.length).toBe(0);
      
      console.log('✅ Isolation des méthodes de paiement respectée');
    });

  });

  describe('💰 Simulation de paiements', () => {
    
    test('Paiement ponctuel réussi', async () => {
      const paymentData = {
        amount: 1999, // 19.99€ en centimes
        currency: 'eur',
        description: 'Test paiement E2E',
        paymentMethodType: 'card'
      };

      const paymentResult = await E2EHelpers.processPayment(testUser.token, paymentData);
      
      expect(paymentResult.success).toBe(true);
      expect(paymentResult.payment).toBeDefined();
      expect(paymentResult.payment.status).toBe('succeeded');
      expect(paymentResult.payment.amount).toBe(paymentData.amount);
      
      console.log('✅ Paiement ponctuel réussi:', paymentResult.payment.id);
    });

    test('Paiement échoue avec montant invalide', async () => {
      const invalidPaymentData = {
        amount: -100, // Montant négatif
        currency: 'eur',
        description: 'Test paiement invalide',
        paymentMethodType: 'card'
      };

      const paymentResult = await E2EHelpers.processPayment(testUser.token, invalidPaymentData);
      
      expect(paymentResult.success).toBe(false);
      expect(paymentResult.status).toBe(400);
      console.log('✅ Montant invalide correctement rejeté');
    });

  });

});
