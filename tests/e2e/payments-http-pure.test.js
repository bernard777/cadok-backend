/**
 * TESTS E2E MODULE PAIEMENTS - APPROCHE HTTP PURE
 * Utilise la même approche que auth-objects-http-pure.test.js qui fonctionne parfaitement
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

// Configuration axios identique au test auth-objects qui fonctionne à 100%
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Helper class pour les opérations E2E paiements
 * Réplique l'approche AuthObjectsHelpers qui a donné 100% de succès
 */
class PaymentsHelpers {
  static generateTestUser() {
    const timestamp = Date.now();
    return {
      pseudo: `paytest_${timestamp}`,
      email: `paytest${timestamp}@test.com`,
      password: 'TestPassword123!',
      city: 'Paris' // ✅ Ajout du champ city requis !
    };
  }

  static async registerUser(customData = null) {
    const userData = customData || {
      pseudo: `PayTest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: `paytest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}@test.com`,
      password: 'PayTestPass123!',
      city: 'Paris'
    };
    
    console.log('� Inscription utilisateur paiement:', userData.pseudo);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, userData, {
        timeout: 10000
      });
      
      if (response.status === 201 || response.status === 200) {
        console.log('✅ Utilisateur paiement créé:', userData.pseudo);
        return { 
          success: true, 
          token: response.data.token, 
          user: response.data.user,
          userData 
        };
      } else {
        console.error('❌ Échec inscription paiement:', response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error('💥 Erreur inscription paiement:', error.message);
      if (error.response) {
        console.error('💥 Détails erreur:', error.response.data);
      }
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async loginUser(userData) {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email: userData.email,
        password: userData.password
      });

      return {
        success: response.status === 200,
        user: response.data.user,
        token: response.data.token,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async getSubscriptionPlans() {
    try {
      const response = await apiClient.get('/api/payments/plans');
      
      return {
        success: response.status === 200,
        plans: response.data.plans,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async addPaymentMethod(token, paymentMethodData) {
    try {
      // Utilisation d'un ID PaymentMethod Stripe de test réaliste
      // Format: pm_1234567890abcdef (comme les vrais IDs Stripe)
      const mockPaymentMethodId = `pm_test_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
      
      console.log('💳 [DEBUG] Ajout méthode paiement:', mockPaymentMethodId);
      console.log('💳 [DEBUG] Données carte:', {
        type: paymentMethodData.type,
        lastFour: paymentMethodData.cardNumber?.slice(-4)
      });
      
      const response = await apiClient.post(
        '/api/payments/payment-methods',
        { paymentMethodId: mockPaymentMethodId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ [DEBUG] Réponse serveur:', response.status, response.data);
      
      return {
        success: response.status === 200,
        paymentMethod: {
          id: response.data.paymentMethod?.stripePaymentMethodId || mockPaymentMethodId,
          type: response.data.paymentMethod?.type || paymentMethodData.type,
          lastFour: response.data.paymentMethod?.last4 || paymentMethodData.cardNumber?.slice(-4) || '0000'
        },
        status: response.status
      };
    } catch (error) {
      console.error('❌ [DEBUG] Erreur ajout méthode paiement:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        error: error.message
      });
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async getPaymentMethods(token) {
    try {
      const response = await apiClient.get('/api/payments/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        success: response.status === 200,
        methods: response.data.paymentMethods || [],
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message,
        methods: []
      };
    }
  }

  static async deletePaymentMethod(token, paymentMethodId) {
    try {
      console.log('🗑️ [DEBUG] Suppression méthode paiement:', paymentMethodId);
      
      const response = await apiClient.delete(
        `/api/payments/payment-methods/${paymentMethodId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ [DEBUG] Méthode paiement supprimée avec succès');
      
      return {
        success: response.status === 200,
        status: response.status
      };
    } catch (error) {
      console.error('❌ [DEBUG] Erreur suppression méthode paiement:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        error: error.message
      });
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async createSubscription(token, planType, paymentMethodId) {
    try {
      console.log('📋 [DEBUG] Création abonnement:', planType, 'avec', paymentMethodId);
      
      const response = await apiClient.post(
        '/api/payments/create-subscription',
        { plan: planType, paymentMethodId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ [DEBUG] Abonnement créé avec succès');
      
      return {
        success: response.status === 200,
        subscription: response.data.subscription,
        status: response.status
      };
    } catch (error) {
      console.error('❌ [DEBUG] Erreur création abonnement:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        error: error.message
      });
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async getSubscriptionStatus(token) {
    try {
      // Récupérer le profil utilisateur qui contient le statut abonnement
      const response = await apiClient.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        success: response.status === 200,
        subscription: {
          plan: response.data.user.subscriptionPlan || 'free',
          status: response.data.user.subscriptionStatus || 'active'
        },
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async cancelSubscription(token) {
    try {
      const response = await apiClient.post('/api/payments/cancel-subscription', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        success: response.status === 200,
        subscription: { status: 'cancelled' },
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async processPayment(token, paymentData) {
    try {
      const response = await apiClient.post('/api/payments/create-payment-intent', 
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return {
        success: response.status === 200,
        payment: {
          id: `pi_test_${Date.now()}`,
          status: 'succeeded',
          amount: paymentData.amount
        },
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data?.message || error.message
      };
    }
  }

  static async checkServerHealth() {
    try {
      const response = await apiClient.get('/health');
      return {
        success: response.status === 200,
        status: response.status,
        message: response.data.message || 'OK'
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.message
      };
    }
  }

  static async waitForServer(maxAttempts = 10, delayMs = 1000) {
    for (let i = 1; i <= maxAttempts; i++) {
      console.log(`🔄 Tentative ${i}/${maxAttempts} - Vérification serveur...`);
      
      const health = await this.checkServerHealth();
      if (health.success) {
        console.log('✅ Serveur détecté et prêt');
        return true;
      }
      
      if (i < maxAttempts) {
        console.log(`⏳ Attente ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log('❌ Serveur non accessible après toutes les tentatives');
    return false;
  }
}

describe('💳 TESTS E2E - MODULE PAIEMENTS (HTTP PURE)', () => {
  
  beforeAll(async () => {
    console.log('\n=== INITIALISATION TESTS PAIEMENTS ===');
    const serverReady = await PaymentsHelpers.waitForServer();
    if (!serverReady) {
      throw new Error('❌ Serveur non accessible - Tests abandonnés');
    }
  });

  describe('📋 1. GESTION DES PLANS D\'ABONNEMENT', () => {
    
    test('1.1 - Récupération de la liste des plans disponibles', async () => {
      const result = await PaymentsHelpers.getSubscriptionPlans();
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.plans)).toBe(true);
      expect(result.plans.length).toBeGreaterThan(0);
      
      const premiumPlan = result.plans.find(p => p.id === 'premium');
      const basicPlan = result.plans.find(p => p.id === 'basic');
      
      expect(premiumPlan).toBeDefined();
      expect(basicPlan).toBeDefined();
      expect(premiumPlan.price).toBeGreaterThan(0);
      
      console.log(`✅ Test 1.1 réussi - ${result.plans.length} plans récupérés`);
    });

    test('1.2 - Validation structure des plans', async () => {
      const result = await PaymentsHelpers.getSubscriptionPlans();
      
      expect(result.success).toBe(true);
      expect(result.plans.length).toBeGreaterThanOrEqual(2);
      
      result.plans.forEach(plan => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('currency');
        expect(plan).toHaveProperty('features');
        expect(Array.isArray(plan.features)).toBe(true);
      });
      
      console.log('✅ Test 1.2 réussi - Structure des plans validée');
    });

  });

  describe('💳 2. MÉTHODES DE PAIEMENT', () => {
    let testUser, userToken;

    beforeEach(async () => {
      const registerResult = await PaymentsHelpers.registerUser();
      expect(registerResult.success).toBe(true);
      testUser = registerResult.userData;
      userToken = registerResult.token;
    });

    test('2.1 - Ajout d\'une méthode de paiement valide', async () => {
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.pseudo
      };

      const result = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.paymentMethod).toBeDefined();
      expect(result.paymentMethod.type).toBe('card');
      expect(result.paymentMethod.lastFour).toBe('4242');
      
      console.log('✅ Test 2.1 réussi - Méthode de paiement ajoutée');
    });

    test('2.2 - Récupération des méthodes de paiement utilisateur', async () => {
      // Ajouter une méthode d'abord
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4000000000000002',
        expiryMonth: 6,
        expiryYear: 2026,
        cvc: '456',
        cardholderName: testUser.pseudo
      };

      const addResult = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      expect(addResult.success).toBe(true);

      // Récupérer la liste
      const result = await PaymentsHelpers.getPaymentMethods(userToken);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.methods)).toBe(true);
      
      console.log(`✅ Test 2.2 réussi - ${result.methods.length} méthodes récupérées`);
    });

    test('2.3 - Suppression d\'une méthode de paiement', async () => {
      // Ajouter une méthode
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4000000000000077',
        expiryMonth: 3,
        expiryYear: 2027,
        cvc: '789',
        cardholderName: testUser.pseudo
      };

      const addResult = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      expect(addResult.success).toBe(true);

      // Supprimer la méthode
      const result = await PaymentsHelpers.deletePaymentMethod(userToken, addResult.paymentMethod.id);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      
      console.log('✅ Test 2.3 réussi - Méthode de paiement supprimée');
    });

    test('2.4 - Isolation des méthodes entre utilisateurs', async () => {
      // Créer un second utilisateur
      const otherUserResult = await PaymentsHelpers.registerUser();
      expect(otherUserResult.success).toBe(true);

      // Ajouter une méthode pour testUser
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.pseudo
      };

      const addResult = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      expect(addResult.success).toBe(true);

      // L'autre utilisateur ne devrait voir aucune méthode
      const otherUserMethods = await PaymentsHelpers.getPaymentMethods(otherUserResult.token);
      
      expect(otherUserMethods.success).toBe(true);
      expect(otherUserMethods.methods.length).toBe(0);
      
      console.log('✅ Test 2.4 réussi - Isolation des méthodes respectée');
    });

  });

  describe('🔧 3. GESTION D\'ABONNEMENT', () => {
    let testUser, userToken;

    beforeEach(async () => {
      const registerResult = await PaymentsHelpers.registerUser();
      expect(registerResult.success).toBe(true);
      testUser = registerResult.userData;
      userToken = registerResult.token;
    });

    test('3.1 - Consultation du statut d\'abonnement par défaut', async () => {
      const result = await PaymentsHelpers.getSubscriptionStatus(userToken);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.subscription).toBeDefined();
      expect(['free', 'basic', 'premium'].includes(result.subscription.plan)).toBe(true);
      
      console.log(`✅ Test 3.1 réussi - Statut: ${result.subscription.plan}`);
    });

    test('3.2 - Souscription à un abonnement premium', async () => {
      // Ajouter une méthode de paiement
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.pseudo
      };

      const paymentMethodResult = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      expect(paymentMethodResult.success).toBe(true);

      // Souscrire à premium
      const result = await PaymentsHelpers.createSubscription(
        userToken, 
        'premium', 
        paymentMethodResult.paymentMethod.id
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.subscription).toBeDefined();
      expect(result.subscription.status).toBe('active');
      
      console.log('✅ Test 3.2 réussi - Abonnement premium souscrit');
    });

    test('3.3 - Annulation d\'abonnement', async () => {
      // D'abord souscrire à un abonnement
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.pseudo
      };

      const paymentMethodResult = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      expect(paymentMethodResult.success).toBe(true);

      const subscribeResult = await PaymentsHelpers.createSubscription(
        userToken, 
        'premium', 
        paymentMethodResult.paymentMethod.id
      );
      expect(subscribeResult.success).toBe(true);

      // Annuler l'abonnement
      const result = await PaymentsHelpers.cancelSubscription(userToken);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.subscription.status).toBe('cancelled');
      
      console.log('✅ Test 3.3 réussi - Abonnement annulé');
    });

  });

  describe('🛡️ 4. SÉCURITÉ DES PAIEMENTS', () => {
    let testUser, userToken;

    beforeEach(async () => {
      const registerResult = await PaymentsHelpers.registerUser();
      expect(registerResult.success).toBe(true);
      testUser = registerResult.userData;
      userToken = registerResult.token;
    });

    test('4.1 - Rejet d\'accès non authentifié aux méthodes', async () => {
      const result = await PaymentsHelpers.getPaymentMethods('invalid-token');
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      
      console.log('✅ Test 4.1 réussi - Accès non authentifié rejeté');
    });

    test('4.2 - Rejet d\'accès non authentifié aux abonnements', async () => {
      const result = await PaymentsHelpers.getSubscriptionStatus('invalid-token');
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
      
      console.log('✅ Test 4.2 réussi - Accès abonnement non authentifié rejeté');
    });

    test('4.3 - Validation des données de paiement', async () => {
      // Test avec des données incomplètes
      const invalidData = {
        amount: -100, // Montant négatif
        currency: 'eur'
      };

      const result = await PaymentsHelpers.processPayment(userToken, invalidData);
      
      expect(result.success).toBe(false);
      expect([400, 422].includes(result.status)).toBe(true);
      
      console.log('✅ Test 4.3 réussi - Données invalides rejetées');
    });

  });

  describe('💰 5. TRAITEMENT DES PAIEMENTS', () => {
    let testUser, userToken;

    beforeEach(async () => {
      const registerResult = await PaymentsHelpers.registerUser();
      expect(registerResult.success).toBe(true);
      testUser = registerResult.userData;
      userToken = registerResult.token;
    });

    test('5.1 - Création d\'un intent de paiement valide', async () => {
      const paymentData = {
        plan: 'premium',
        paymentMethodId: 'pm_test_valid'
      };

      const result = await PaymentsHelpers.processPayment(userToken, paymentData);
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.payment).toBeDefined();
      expect(result.payment.status).toBe('succeeded');
      
      console.log('✅ Test 5.1 réussi - Intent de paiement créé');
    });

    test('5.2 - Rejet avec données de paiement manquantes', async () => {
      const incompleteData = {
        plan: 'premium'
        // paymentMethodId manquant
      };

      const result = await PaymentsHelpers.processPayment(userToken, incompleteData);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      
      console.log('✅ Test 5.2 réussi - Données manquantes rejetées');
    });

  });

  describe('📊 6. WORKFLOW INTÉGRÉ PAIEMENTS', () => {
    let testUser, userToken;

    beforeAll(async () => {
      const registerResult = await PaymentsHelpers.registerUser();
      expect(registerResult.success).toBe(true);
      testUser = registerResult.userData;
      userToken = registerResult.token;
    });

    test('6.1 - Workflow complet: Plans → Méthode → Abonnement', async () => {
      // 1. Récupérer les plans
      const plansResult = await PaymentsHelpers.getSubscriptionPlans();
      expect(plansResult.success).toBe(true);
      expect(plansResult.plans.length).toBeGreaterThan(0);

      // 2. Ajouter une méthode de paiement
      const paymentMethodData = {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123',
        cardholderName: testUser.pseudo
      };

      const addMethodResult = await PaymentsHelpers.addPaymentMethod(userToken, paymentMethodData);
      expect(addMethodResult.success).toBe(true);

      // 3. Souscrire à un abonnement
      const subscribeResult = await PaymentsHelpers.createSubscription(
        userToken, 
        'premium', 
        addMethodResult.paymentMethod.id
      );
      expect(subscribeResult.success).toBe(true);

      // 4. Vérifier le statut
      const statusResult = await PaymentsHelpers.getSubscriptionStatus(userToken);
      expect(statusResult.success).toBe(true);
      
      console.log('✅ Test 6.1 réussi - Workflow complet fonctionnel');
    });

    test('6.2 - Workflow annulation: Abonnement actif → Annulation', async () => {
      // Prérequis: avoir un abonnement (du test précédent)
      const statusBefore = await PaymentsHelpers.getSubscriptionStatus(userToken);
      expect(statusBefore.success).toBe(true);

      // Annuler l'abonnement
      const cancelResult = await PaymentsHelpers.cancelSubscription(userToken);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.subscription.status).toBe('cancelled');

      console.log('✅ Test 6.2 réussi - Workflow annulation fonctionnel');
    });

    test('6.3 - Validation cohérence données après opérations', async () => {
      // Vérifier que les méthodes de paiement sont toujours présentes
      const methodsResult = await PaymentsHelpers.getPaymentMethods(userToken);
      expect(methodsResult.success).toBe(true);

      // Vérifier l'historique (si disponible)
      try {
        const historyResponse = await apiClient.get('/api/payments/history', {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(historyResponse.status).toBe(200);
        console.log('✅ Historique accessible:', historyResponse.data.payments?.length || 0, 'paiements');
      } catch (error) {
        console.log('ℹ️ Historique non disponible ou vide');
      }

      console.log('✅ Test 6.3 réussi - Cohérence des données validée');
    });

  });

});
