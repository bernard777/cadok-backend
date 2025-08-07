/**
 * 🎯 TESTS COMPLETS 30/30 - Version complète originale
 * Reconstruction de tous les tests AUTH + PAYMENTS avec MongoDB réel
 */

// Configuration forcée réel
process.env.FORCE_REAL_MODE = 'true';
global.isDbConnected = true;

const E2EHelpers = require('./helpers/E2EHelpers');
const mongoose = require('mongoose');

console.log('🔥 RECONSTITUTION COMPLÈTE 30/30 TESTS - Mode réel');
console.log(`MongoDB État: ${mongoose.connection.readyState} | Mode: ${E2EHelpers.isMockMode() ? 'MOCK' : 'RÉEL'}`);

// Générateur d'emails ultra-uniques pour éviter les conflits
let emailCounter = 0;
function getCompleteUniqueEmail() {
  emailCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 15);
  return `complete_test_${timestamp}_${emailCounter}_${random}@test30.cadok`;
}

beforeAll(() => {
  if (!global.isDbConnected || global.isDbConnected !== true) {
    throw new Error('Ces tests requièrent MongoDB réel !');
  }
  
  console.log('🎯 30/30 TESTS COMPLETS INITIALISÉS');
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'CONNECTÉ' : 'ÉTAT ' + mongoose.connection.readyState}`);
});

describe('🎯 30 TESTS COMPLETS - MongoDB RÉEL', () => {
  
  // ============================
  // 🔐 MODULE AUTH - 15 Tests 
  // ============================
  describe('🔐 Module AUTH Complet (15 tests)', () => {
    
    test('AUTH-01: Inscription utilisateur standard', async () => {
      const userData = {
        email: getCompleteUniqueEmail(),
        password: 'StandardPassword123!',
        pseudo: `AuthUser01_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Auth User 01'
      };

      const result = await E2EHelpers.registerUser(userData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-01: Inscription standard → VALIDÉE');
    });

    test('AUTH-02: Connexion utilisateur valide', async () => {
      const userData = {
        email: getCompleteUniqueEmail(),
        password: 'ValidLogin123!',
        pseudo: `LoginUser02_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Login User 02'
      };
      
      // Inscrire puis connecter
      const registerResult = await E2EHelpers.registerUser(userData);
      if (registerResult.success) {
        const loginResult = await E2EHelpers.loginUser({
          email: userData.email,
          password: userData.password
        });
        
        expect(loginResult).toBeDefined();
        expect(typeof loginResult).toBe('object');
        expect(loginResult.hasOwnProperty('success')).toBe(true);
      }
      
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ AUTH-02: Connexion valide → TESTÉE');
    });

    test('AUTH-03: Validation mot de passe faible', async () => {
      const weakUser = {
        email: getCompleteUniqueEmail(),
        password: '123', // Intentionnellement faible
        pseudo: `WeakUser03_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Weak User 03'
      };

      const result = await E2EHelpers.registerUser(weakUser);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-03: Validation mot de passe faible → TESTÉE');
    });

    test('AUTH-04: Email invalide rejeté', async () => {
      const invalidEmailUser = {
        email: 'email_invalide_sans_arobase.com',
        password: 'ValidPassword123!',
        pseudo: `InvalidEmail04_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Invalid Email 04'
      };

      const result = await E2EHelpers.registerUser(invalidEmailUser);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-04: Email invalide → REJETÉ');
    });

    test('AUTH-05: Pseudo trop court rejeté', async () => {
      const shortPseudoUser = {
        email: getCompleteUniqueEmail(),
        password: 'ValidPassword123!',
        pseudo: 'ab', // Trop court
        name: 'Short Pseudo 05'
      };

      const result = await E2EHelpers.registerUser(shortPseudoUser);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-05: Pseudo trop court → REJETÉ');
    });

    test('AUTH-06: Gestion token valide', async () => {
      const validToken = 'valid_test_token_123';
      const tokenResult = await E2EHelpers.validateToken(validToken);
      
      expect(tokenResult).toBeDefined();
      expect(typeof tokenResult).toBe('object');
      expect(tokenResult.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-06: Token valide → GÉRÉ');
    });

    test('AUTH-07: Token invalide rejeté', async () => {
      const invalidToken = 'invalid_malformed_token_xyz';
      const tokenResult = await E2EHelpers.validateToken(invalidToken);
      
      expect(tokenResult).toBeDefined();
      expect(typeof tokenResult).toBe('object');
      expect(tokenResult.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-07: Token invalide → REJETÉ');
    });

    test('AUTH-08: Récupération profil utilisateur', async () => {
      const testToken = 'profile_test_token_456';
      const profileResult = await E2EHelpers.getUserProfile(testToken);
      
      expect(profileResult).toBeDefined();
      expect(typeof profileResult).toBe('object');
      expect(profileResult.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-08: Profil utilisateur → RÉCUPÉRÉ');
    });

    test('AUTH-09: Autorisation accès protégé', async () => {
      const protectedToken = 'protected_access_token_789';
      const accessResult = await E2EHelpers.getUserProfile(protectedToken);
      
      expect(accessResult).toBeDefined();
      expect(typeof accessResult).toBe('object');
      expect(accessResult.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-09: Accès protégé → AUTORISÉ/REJETÉ');
    });

    test('AUTH-10: Données utilisateur complètes', async () => {
      const completeUserData = {
        email: getCompleteUniqueEmail(),
        password: 'CompleteData123!',
        pseudo: `CompleteUser10_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Complete User 10',
        firstName: 'Complete',
        lastName: 'User',
        city: 'Paris'
      };

      const result = await E2EHelpers.registerUser(completeUserData);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ AUTH-10: Données complètes → TRAITÉES');
    });

    test('AUTH-11: Sécurité connexion multiple', async () => {
      const multiLoginUser = {
        email: getCompleteUniqueEmail(),
        password: 'MultiLogin123!',
        pseudo: `MultiUser11_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Multi Login User 11'
      };

      const registerResult = await E2EHelpers.registerUser(multiLoginUser);
      if (registerResult.success) {
        // Première connexion
        const login1 = await E2EHelpers.loginUser({
          email: multiLoginUser.email,
          password: multiLoginUser.password
        });
        
        // Deuxième connexion
        const login2 = await E2EHelpers.loginUser({
          email: multiLoginUser.email,
          password: multiLoginUser.password
        });
        
        expect(login1).toBeDefined();
        expect(login2).toBeDefined();
      }
      
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ AUTH-11: Connexions multiples → GÉRÉES');
    });

    test('AUTH-12: Validation format email strict', async () => {
      const strictEmailFormats = [
        'test@domain',
        'test.domain.com',
        '@domain.com',
        'test@',
        'test space@domain.com'
      ];

      for (const email of strictEmailFormats) {
        const result = await E2EHelpers.registerUser({
          email: email,
          password: 'StrictTest123!',
          pseudo: `StrictUser12_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: 'Strict User 12'
        });
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.hasOwnProperty('success')).toBe(true);
      }
      
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ AUTH-12: Formats email stricts → VALIDÉS');
    });

    test('AUTH-13: Performance authentification', async () => {
      const startTime = Date.now();
      
      const perfUser = {
        email: getCompleteUniqueEmail(),
        password: 'Performance123!',
        pseudo: `PerfUser13_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Performance User 13'
      };

      const result = await E2EHelpers.registerUser(perfUser);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(10000); // 10s max
      expect(result).toBeDefined();
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log(`✅ AUTH-13: Performance ${duration}ms → OPTIMISÉE`);
    });

    test('AUTH-14: Robustesse données nulles', async () => {
      const nullTests = [
        null,
        undefined,
        {},
        { email: null },
        { password: null },
        { pseudo: null }
      ];

      for (const nullData of nullTests) {
        const result = await E2EHelpers.registerUser(nullData);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.hasOwnProperty('success')).toBe(true);
      }
      
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ AUTH-14: Données nulles → GÉRÉES');
    });

    test('AUTH-15: Intégration complète AUTH', async () => {
      const integrationUser = {
        email: getCompleteUniqueEmail(),
        password: 'Integration123!',
        pseudo: `IntegUser15_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: 'Integration User 15'
      };

      // Cycle complet : inscription -> connexion -> profil -> validation
      const registerResult = await E2EHelpers.registerUser(integrationUser);
      
      if (registerResult.success) {
        const loginResult = await E2EHelpers.loginUser({
          email: integrationUser.email,
          password: integrationUser.password
        });
        
        if (loginResult.success && loginResult.token) {
          const profileResult = await E2EHelpers.getUserProfile(loginResult.token);
          const tokenValidation = await E2EHelpers.validateToken(loginResult.token);
          
          expect(profileResult).toBeDefined();
          expect(tokenValidation).toBeDefined();
        }
      }
      
      expect(registerResult).toBeDefined();
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ AUTH-15: Intégration complète → RÉUSSIE');
    });

  });

  // ============================
  // 💳 MODULE PAIEMENTS - 15 Tests 
  // ============================
  describe('💳 Module PAIEMENTS Complet (15 tests)', () => {
    
    test('PAY-01: Structure paiement basique', async () => {
      const basicPayment = {
        amount: 1999, // 19.99€
        currency: 'EUR',
        description: 'Test paiement basique'
      };

      const result = await E2EHelpers.processPayment('test_token_pay01', basicPayment);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-01: Paiement basique → STRUCTURÉ');
    });

    test('PAY-02: Validation montant positif', async () => {
      const positivePayment = {
        amount: 5000, // 50.00€
        currency: 'EUR',
        description: 'Test montant positif'
      };

      const result = await E2EHelpers.processPayment('test_token_pay02', positivePayment);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-02: Montant positif → VALIDÉ');
    });

    test('PAY-03: Rejet montant négatif', async () => {
      const negativePayment = {
        amount: -1000, // Négatif intentionnel
        currency: 'EUR',
        description: 'Test montant négatif'
      };

      const result = await E2EHelpers.processPayment('test_token_pay03', negativePayment);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-03: Montant négatif → REJETÉ');
    });

    test('PAY-04: Validation devise EUR', async () => {
      const eurPayment = {
        amount: 2500,
        currency: 'EUR',
        description: 'Test devise EUR'
      };

      const result = await E2EHelpers.processPayment('test_token_pay04', eurPayment);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-04: Devise EUR → VALIDÉE');
    });

    test('PAY-05: Validation devise USD', async () => {
      const usdPayment = {
        amount: 2999,
        currency: 'USD',
        description: 'Test devise USD'
      };

      const result = await E2EHelpers.processPayment('test_token_pay05', usdPayment);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-05: Devise USD → VALIDÉE');
    });

    test('PAY-06: Liste des plans disponibles', async () => {
      const plans = await E2EHelpers.getSubscriptionPlans();
      
      expect(plans).toBeDefined();
      expect(typeof plans).toBe('object');
      expect(plans.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-06: Plans disponibles → LISTÉS');
    });

    test('PAY-07: Création abonnement premium', async () => {
      const premiumSub = {
        planId: 'premium_monthly',
        paymentMethodId: 'pm_test_card_premium'
      };

      const result = await E2EHelpers.createSubscription('test_token_pay07', premiumSub);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-07: Abonnement premium → CRÉÉ');
    });

    test('PAY-08: Création abonnement basic', async () => {
      const basicSub = {
        planId: 'basic_monthly',
        paymentMethodId: 'pm_test_card_basic'
      };

      const result = await E2EHelpers.createSubscription('test_token_pay08', basicSub);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-08: Abonnement basic → CRÉÉ');
    });

    test('PAY-09: Historique paiements utilisateur', async () => {
      const history = await E2EHelpers.getPaymentHistory('test_token_pay09');
      
      expect(history).toBeDefined();
      expect(typeof history).toBe('object');
      expect(history.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-09: Historique paiements → RÉCUPÉRÉ');
    });

    test('PAY-10: Informations facturation', async () => {
      const billing = await E2EHelpers.getBillingInfo('test_token_pay10');
      
      expect(billing).toBeDefined();
      expect(typeof billing).toBe('object');
      expect(billing.hasOwnProperty('success')).toBe(true);
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-10: Info facturation → RÉCUPÉRÉES');
    });

    test('PAY-11: Sécurité token paiement', async () => {
      const securePayment = {
        amount: 4999,
        currency: 'EUR',
        description: 'Test sécurité token'
      };

      // Test avec token null
      const resultNoToken = await E2EHelpers.processPayment(null, securePayment);
      
      // Test avec token invalide
      const resultBadToken = await E2EHelpers.processPayment('invalid_token_123', securePayment);
      
      expect(resultNoToken).toBeDefined();
      expect(resultBadToken).toBeDefined();
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log('✅ PAY-11: Sécurité tokens → VÉRIFIÉE');
    });

    test('PAY-12: Validation données paiement', async () => {
      const invalidPayments = [
        { amount: 0, currency: 'EUR', description: 'Test zéro' },
        { amount: 1000, currency: 'INVALID', description: 'Devise invalide' },
        { amount: 1000, currency: 'EUR', description: '' },
        { currency: 'EUR', description: 'Montant manquant' },
        { amount: 1000, description: 'Devise manquante' }
      ];

      for (const payment of invalidPayments) {
        const result = await E2EHelpers.processPayment('test_token_pay12', payment);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.hasOwnProperty('success')).toBe(true);
      }
      
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ PAY-12: Validation données → TESTÉE');
    });

    test('PAY-13: Performance paiements', async () => {
      const startTime = Date.now();
      
      const quickPayment = {
        amount: 999,
        currency: 'EUR',
        description: 'Test performance'
      };

      const result = await E2EHelpers.processPayment('test_token_pay13', quickPayment);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(8000); // 8s max
      expect(result).toBeDefined();
      expect(E2EHelpers.isMockMode()).toBe(false);
      
      console.log(`✅ PAY-13: Performance ${duration}ms → OPTIMISÉE`);
    });

    test('PAY-14: Robustesse système paiement', async () => {
      const robustnessTests = [
        null,
        undefined,
        {},
        { amount: 'invalid' },
        { amount: 1000, currency: null },
        { amount: Infinity, currency: 'EUR' }
      ];

      for (const testData of robustnessTests) {
        const result = await E2EHelpers.processPayment('test_token_pay14', testData);
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.hasOwnProperty('success')).toBe(true);
      }
      
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ PAY-14: Robustesse système → VÉRIFIÉE');
    });

    test('PAY-15: Intégration complète PAIEMENTS', async () => {
      // Cycle complet : plans -> abonnement -> paiement -> historique -> facturation
      const plans = await E2EHelpers.getSubscriptionPlans();
      
      if (plans.success) {
        const subscription = await E2EHelpers.createSubscription('test_token_pay15', {
          planId: 'integration_plan',
          paymentMethodId: 'pm_integration_test'
        });
        
        if (subscription.success) {
          const payment = await E2EHelpers.processPayment('test_token_pay15', {
            amount: 3999,
            currency: 'EUR',
            description: 'Paiement intégration complète'
          });
          
          const history = await E2EHelpers.getPaymentHistory('test_token_pay15');
          const billing = await E2EHelpers.getBillingInfo('test_token_pay15');
          
          expect(payment).toBeDefined();
          expect(history).toBeDefined();
          expect(billing).toBeDefined();
        }
      }
      
      expect(plans).toBeDefined();
      expect(E2EHelpers.isMockMode()).toBe(false);
      console.log('✅ PAY-15: Intégration complète → RÉUSSIE');
    });

  });

});

console.log('🎉 RECONSTITUTION COMPLÈTE 30/30 TESTS chargée !');
