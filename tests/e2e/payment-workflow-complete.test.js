/**
 * VRAI TEST E2E - Système de paiement et abonnements
 * Test des plans Premium, validation Stripe, upgrade/downgrade
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const PaymentMethod = require('../../models/PaymentMethod');

describe('💳 WORKFLOW E2E COMPLET - SYSTÈME DE PAIEMENT', () => {
  
  let testUser, testToken, userId;
  let subscriptionId, paymentMethodId;

  beforeEach(async () => {
    // Nettoyage des données existantes - VERSION FORCÉE
    const mongoose = require('mongoose');
    const { connectToDatabase } = require('../../db');
    
    // S'assurer que la connexion DB est établie
    await connectToDatabase();
    
    // Nettoyer avec plus de robustesse
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.collection('users').deleteMany({
          email: { $regex: /payment_.*@cadok\.com/ }
        });
        console.log('🧹 Utilisateurs payment nettoyés');
      } catch (error) {
        console.warn('⚠️ Nettoyage partiel échoué:', error.message);
      }
    }
    
    // Créer un utilisateur pour les tests de paiement
    const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const userData = {
      pseudo: 'PaymentUser_' + uniqueId,
      email: `payment_${uniqueId}@cadok.com`,
      password: 'PaymentTest123!',
      firstName: 'Marie',
      lastName: 'Payment',
      city: 'Marseille',
      zipCode: '13001'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    expect(registerResponse.status).toBe(201);
    userId = registerResponse.body.user.id;
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    testToken = loginResponse.body.token;
    testUser = registerResponse.body.user;
  });

  test('🎯 WORKFLOW PAIEMENT COMPLET: Plans → Méthode → Abonnement → Upgrade', async () => {
    
    // ===== PHASE 1: RÉCUPÉRATION DES PLANS DISPONIBLES =====
    console.log('📋 PHASE 1: Récupération des plans disponibles...');
    
    const plansResponse = await request(app)
      .get('/api/subscription/plans')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(plansResponse.status).toBe(200);
    expect(plansResponse.body).toHaveProperty('success', true);
    expect(plansResponse.body).toHaveProperty('plans');
    expect(plansResponse.body.plans.length).toBeGreaterThan(0);
    
    const freePlan = plansResponse.body.plans.find(plan => plan.name === 'free');
    const premiumPlan = plansResponse.body.plans.find(plan => plan.name === 'premium');
    const proPlan = plansResponse.body.plans.find(plan => plan.name === 'pro');
    
    expect(freePlan).toBeTruthy();
    expect(premiumPlan).toBeTruthy();
    expect(proPlan).toBeTruthy();
    
    console.log('✅ Plans récupérés:');
    console.log(`   - Free: ${freePlan.price}€`);
    console.log(`   - Premium: ${premiumPlan.price}€`);
    console.log(`   - Pro: ${proPlan.price}€`);

    // ===== PHASE 2: AJOUT D'UNE MÉTHODE DE PAIEMENT =====
    console.log('💳 PHASE 2: Ajout d\'une méthode de paiement...');
    
    const paymentMethodResponse = await request(app)
      .post('/api/payment/methods')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        type: 'card',
        cardData: {
          number: '4242424242424242', // Carte test Stripe
          expMonth: 12,
          expYear: 2025,
          cvc: '123'
        },
        billingAddress: {
          line1: '123 rue de Test',
          city: 'Marseille',
          postalCode: '13001',
          country: 'FR'
        }
      });
    
    expect(paymentMethodResponse.status).toBe(201);
    expect(paymentMethodResponse.body).toHaveProperty('success', true);
    expect(paymentMethodResponse.body).toHaveProperty('paymentMethod');
    
    paymentMethodId = paymentMethodResponse.body.paymentMethod.id;
    console.log('✅ Méthode de paiement ajoutée:', paymentMethodId);
    
    // Vérifier en base de données
    const paymentMethodInDB = await PaymentMethod.findById(paymentMethodId);
    expect(paymentMethodInDB).toBeTruthy();
    expect(paymentMethodInDB.userId.toString()).toBe(userId);
    expect(paymentMethodInDB.type).toBe('card');

    // ===== PHASE 3: SOUSCRIPTION AU PLAN PREMIUM =====
    console.log('⬆️ PHASE 3: Souscription au plan Premium...');
    
    const subscribeResponse = await request(app)
      .post('/api/subscription/subscribe')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        planName: 'premium',
        paymentMethodId: paymentMethodId
      });
    
    expect(subscribeResponse.status).toBe(201);
    expect(subscribeResponse.body).toHaveProperty('success', true);
    expect(subscribeResponse.body).toHaveProperty('subscription');
    expect(subscribeResponse.body.subscription.plan).toBe('premium');
    expect(subscribeResponse.body.subscription.status).toBe('active');
    
    subscriptionId = subscribeResponse.body.subscription._id;
    console.log('✅ Abonnement Premium créé:', subscriptionId);
    
    // Vérifier en base de données
    const subscriptionInDB = await Subscription.findById(subscriptionId);
    expect(subscriptionInDB).toBeTruthy();
    expect(subscriptionInDB.userId.toString()).toBe(userId);
    expect(subscriptionInDB.plan).toBe('premium');
    expect(subscriptionInDB.status).toBe('active');

    // ===== PHASE 4: VÉRIFICATION DES FONCTIONNALITÉS PREMIUM =====
    console.log('🌟 PHASE 4: Test des fonctionnalités Premium...');
    
    // Tester création d'objets avec limite Premium (50 au lieu de 10)
    const premiumObjectResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Objet Premium Test',
        description: 'Test avec abonnement Premium actif',
        category: 'Électronique',
        condition: 'Excellent état',
        estimatedValue: 300,
        available: true,
        isPremiumFeature: true // Fonctionnalité Premium
      });
    
    expect(premiumObjectResponse.status).toBe(201);
    expect(premiumObjectResponse.body).toHaveProperty('success', true);
    console.log('✅ Fonctionnalité Premium accessible');
    
    // Tester recherche avancée (Premium)
    const advancedSearchResponse = await request(app)
      .get('/api/objects/search/advanced?minValue=100&maxValue=500&condition=Excellent état&distance=50')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(advancedSearchResponse.status).toBe(200);
    console.log('✅ Recherche avancée accessible (Premium)');

    // ===== PHASE 5: UPGRADE VERS LE PLAN PRO =====
    console.log('🚀 PHASE 5: Upgrade vers le plan Pro...');
    
    const upgradeResponse = await request(app)
      .post('/api/subscription/upgrade')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        newPlan: 'pro'
      });
    
    expect(upgradeResponse.status).toBe(200);
    expect(upgradeResponse.body).toHaveProperty('success', true);
    expect(upgradeResponse.body.subscription.plan).toBe('pro');
    
    console.log('✅ Upgrade vers Pro réussi');
    
    // Vérifier en base de données
    const upgradedSubscriptionInDB = await Subscription.findById(subscriptionId);
    expect(upgradedSubscriptionInDB.plan).toBe('pro');

    // ===== PHASE 6: TEST DES FONCTIONNALITÉS PRO =====
    console.log('💼 PHASE 6: Test des fonctionnalités Pro...');
    
    // Tester analytics (Pro uniquement)
    const analyticsResponse = await request(app)
      .get('/api/analytics/user-stats')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body).toHaveProperty('success', true);
    console.log('✅ Analytics Pro accessible');
    
    // Tester export de données (Pro uniquement)
    const exportResponse = await request(app)
      .get('/api/export/user-data')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(exportResponse.status).toBe(200);
    console.log('✅ Export de données Pro accessible');

    // ===== PHASE 7: HISTORIQUE DES PAIEMENTS =====
    console.log('📊 PHASE 7: Vérification historique des paiements...');
    
    const paymentsHistoryResponse = await request(app)
      .get('/api/payment/history')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(paymentsHistoryResponse.status).toBe(200);
    expect(paymentsHistoryResponse.body).toHaveProperty('success', true);
    expect(paymentsHistoryResponse.body).toHaveProperty('payments');
    expect(paymentsHistoryResponse.body.payments.length).toBeGreaterThan(0);
    
    console.log('✅ Historique des paiements récupéré');

    // ===== PHASE 8: DOWNGRADE VERS FREE =====
    console.log('⬇️ PHASE 8: Downgrade vers le plan Free...');
    
    const downgradeResponse = await request(app)
      .post('/api/subscription/downgrade')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        newPlan: 'free',
        reason: 'Test E2E downgrade'
      });
    
    expect(downgradeResponse.status).toBe(200);
    expect(downgradeResponse.body).toHaveProperty('success', true);
    
    console.log('✅ Downgrade vers Free réussi');
    
    // Vérifier que les fonctionnalités Premium/Pro ne sont plus accessibles
    const premiumAccessAfterDowngrade = await request(app)
      .get('/api/objects/search/advanced?minValue=100&maxValue=500')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(premiumAccessAfterDowngrade.status).toBe(403);
    console.log('✅ Fonctionnalités Premium bloquées après downgrade');

    console.log('🎉 WORKFLOW PAIEMENT E2E COMPLET RÉUSSI!');
    console.log('📊 Résumé des paiements:');
    console.log(`   - Utilisateur: ${testUser.email}`);
    console.log(`   - Méthode de paiement: Carte **** 4242`);
    console.log(`   - Parcours: Free → Premium → Pro → Free`);
    console.log(`   - Abonnement ID: ${subscriptionId}`);
    
  }, 90000); // Timeout de 90 secondes pour le workflow complet

  test('🛡️ WORKFLOW E2E - Sécurité et gestion d\'erreurs paiements', async () => {
    
    // Test: Souscription sans méthode de paiement
    console.log('🔒 Test: Souscription sans méthode de paiement...');
    
    const noPaymentMethodResponse = await request(app)
      .post('/api/subscription/subscribe')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        planName: 'premium'
        // Pas de paymentMethodId
      });
    
    expect(noPaymentMethodResponse.status).toBe(400);
    console.log('✅ Souscription sans paiement correctement rejetée');
    
    // Test: Upgrade sans abonnement actif
    console.log('🔒 Test: Upgrade sans abonnement...');
    
    const noSubscriptionUpgradeResponse = await request(app)
      .post('/api/subscription/upgrade')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        newPlan: 'pro'
      });
    
    expect(noSubscriptionUpgradeResponse.status).toBe(404);
    console.log('✅ Upgrade sans abonnement correctement rejeté');
    
    // Test: Accès fonctionnalités Premium sans abonnement
    console.log('🔒 Test: Accès Premium sans abonnement...');
    
    const unauthorizedPremiumResponse = await request(app)
      .get('/api/objects/search/advanced?minValue=100')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(unauthorizedPremiumResponse.status).toBe(403);
    console.log('✅ Accès Premium non autorisé correctement bloqué');
    
    // Test: Carte de paiement invalide
    console.log('🔒 Test: Carte de paiement invalide...');
    
    const invalidCardResponse = await request(app)
      .post('/api/payment/methods')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        type: 'card',
        cardData: {
          number: '4000000000000002', // Carte déclinée
          expMonth: 12,
          expYear: 2025,
          cvc: '123'
        }
      });
    
    expect(invalidCardResponse.status).toBe(400);
    console.log('✅ Carte invalide correctement rejetée');
    
  }, 45000);

  test('📊 WORKFLOW E2E - Test complet des limites par plan', async () => {
    
    console.log('📈 Test des limites par plan...');
    
    // Vérifier les limites Free (par défaut)
    const freeLimitsResponse = await request(app)
      .get('/api/subscription/limits')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(freeLimitsResponse.status).toBe(200);
    expect(freeLimitsResponse.body.plan).toBe('free');
    expect(freeLimitsResponse.body.limits.maxObjects).toBe(10);
    expect(freeLimitsResponse.body.limits.maxTrades).toBe(5);
    expect(freeLimitsResponse.body.limits.advancedSearch).toBe(false);
    
    console.log('✅ Limites Free vérifiées');
    
    // Créer une méthode de paiement pour tester les upgrades
    const paymentMethodResponse = await request(app)
      .post('/api/payment/methods')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        type: 'card',
        cardData: {
          number: '4242424242424242',
          expMonth: 12,
          expYear: 2025,
          cvc: '123'
        }
      });
    
    const paymentMethodId = paymentMethodResponse.body.paymentMethod.id;
    
    // Upgrade vers Premium et vérifier les nouvelles limites
    await request(app)
      .post('/api/subscription/subscribe')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        planName: 'premium',
        paymentMethodId: paymentMethodId
      });
    
    const premiumLimitsResponse = await request(app)
      .get('/api/subscription/limits')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(premiumLimitsResponse.status).toBe(200);
    expect(premiumLimitsResponse.body.plan).toBe('premium');
    expect(premiumLimitsResponse.body.limits.maxObjects).toBe(50);
    expect(premiumLimitsResponse.body.limits.maxTrades).toBe(25);
    expect(premiumLimitsResponse.body.limits.advancedSearch).toBe(true);
    
    console.log('✅ Limites Premium vérifiées');
    
    // Upgrade vers Pro et vérifier les limites illimitées
    await request(app)
      .post('/api/subscription/upgrade')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        newPlan: 'pro'
      });
    
    const proLimitsResponse = await request(app)
      .get('/api/subscription/limits')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(proLimitsResponse.status).toBe(200);
    expect(proLimitsResponse.body.plan).toBe('pro');
    expect(proLimitsResponse.body.limits.maxObjects).toBe(-1); // Illimité
    expect(proLimitsResponse.body.limits.maxTrades).toBe(-1); // Illimité
    expect(proLimitsResponse.body.limits.analytics).toBe(true);
    expect(proLimitsResponse.body.limits.export).toBe(true);
    
    console.log('✅ Limites Pro vérifiées (illimitées)');
    
  }, 60000);

});
