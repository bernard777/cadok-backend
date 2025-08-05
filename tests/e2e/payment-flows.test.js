/**
 * 💳 TESTS E2E PAIEMENTS & SUBSCRIPTIONS CADOK
 * Tests complets pour Stripe et système premium
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');

describe('💳 TESTS E2E PAIEMENTS CADOK', () => {
  let userToken;
  let userId;
  let subscriptionId;

  beforeAll(async () => {
    // Utilisateur test pour paiements
    const user = await User.create({
      firstName: 'PaymentUser',
      lastName: 'Test',
      email: 'payment.test@cadok.com',
      password: 'PaymentPass123!',
      city: 'Paris'
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'payment.test@cadok.com', password: 'PaymentPass123!' });

    userToken = login.body.token;
    userId = user._id;
  });

  describe('📋 Plans & Pricing', () => {
    test('PAY-E2E-001: Consultation plans disponibles', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const basicPlan = response.body.find(p => p.name === 'basic');
      const premiumPlan = response.body.find(p => p.name === 'premium');
      
      expect(basicPlan).toBeDefined();
      expect(premiumPlan).toBeDefined();
      expect(premiumPlan.price).toBeGreaterThan(basicPlan.price);
    });

    test('PAY-E2E-002: Détails plan spécifique', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans/premium')
        .expect(200);

      expect(response.body.name).toBe('premium');
      expect(response.body.features).toBeDefined();
      expect(response.body.limits).toBeDefined();
    });
  });

  describe('💰 Création Payment Intent', () => {
    test('PAY-E2E-003: Création intent paiement premium', async () => {
      const paymentData = {
        planType: 'premium',
        billingCycle: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.clientSecret).toBeDefined();
      expect(response.body.amount).toBe(999); // 9.99€ en centimes
      expect(response.body.currency).toBe('eur');
    });

    test('PAY-E2E-004: Intent paiement avec métadonnées', async () => {
      const paymentData = {
        planType: 'basic',
        billingCycle: 'yearly',
        promoCode: 'BETA2025'
      };

      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.userId).toBe(userId.toString());
      expect(response.body.metadata.planType).toBe('basic');
    });
  });

  describe('🔄 Gestion Subscriptions', () => {
    test('PAY-E2E-005: Création subscription', async () => {
      const subscriptionData = {
        planType: 'premium',
        paymentMethodId: 'pm_card_visa', // Test payment method
        billingCycle: 'monthly'
      };

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body.subscription).toBeDefined();
      expect(response.body.subscription.status).toBe('active');
      expect(response.body.subscription.plan).toBe('premium');

      subscriptionId = response.body.subscription._id;
    });

    test('PAY-E2E-006: Consultation subscription active', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.plan).toBe('premium');
      expect(response.body.status).toBe('active');
      expect(response.body.limits).toBeDefined();
    });

    test('PAY-E2E-007: Modification subscription', async () => {
      const updateData = {
        planType: 'basic',
        prorationBehavior: 'create_prorations'
      };

      const response = await request(app)
        .patch(`/api/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.plan).toBe('basic');
      expect(response.body.scheduledChanges).toBeDefined();
    });
  });

  describe('🏷️ Codes Promo & Réductions', () => {
    test('PAY-E2E-008: Application code promo valide', async () => {
      const response = await request(app)
        .post('/api/payments/apply-promo')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ promoCode: 'BETA2025', planType: 'premium' })
        .expect(200);

      expect(response.body.discount).toBeDefined();
      expect(response.body.newAmount).toBeLessThan(999);
    });

    test('PAY-E2E-009: Code promo invalide', async () => {
      await request(app)
        .post('/api/payments/apply-promo')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ promoCode: 'INVALID_CODE', planType: 'premium' })
        .expect(400);
    });
  });

  describe('📊 Usage & Limites', () => {
    test('PAY-E2E-010: Vérification limites plan', async () => {
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.currentUsage).toBeDefined();
      expect(response.body.limits).toBeDefined();
      expect(response.body.remainingQuota).toBeDefined();
    });

    test('PAY-E2E-011: Test dépassement limites', async () => {
      // Simulation création multiple objets pour test limites
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .post('/api/objects')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              title: `Test Object ${i}`,
              description: 'Test limite subscription',
              category: 'Test'
            })
        );
      }

      const responses = await Promise.all(promises);
      const limitExceeded = responses.some(r => r.status === 402);
      
      // Doit avoir au moins une réponse 402 (Payment Required)
      expect(limitExceeded).toBe(true);
    });
  });

  describe('🔄 Annulation & Remboursements', () => {
    test('PAY-E2E-012: Annulation subscription', async () => {
      const response = await request(app)
        .post('/api/payments/cancel-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'testing', feedback: 'E2E test cancellation' })
        .expect(200);

      expect(response.body.status).toBe('canceled');
      expect(response.body.canceledAt).toBeDefined();
    });

    test('PAY-E2E-013: Réactivation après annulation', async () => {
      const reactivationData = {
        planType: 'basic',
        paymentMethodId: 'pm_card_visa'
      };

      const response = await request(app)
        .post('/api/payments/reactivate-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reactivationData)
        .expect(200);

      expect(response.body.status).toBe('active');
      expect(response.body.plan).toBe('basic');
    });
  });

  describe('📋 Historique & Facturation', () => {
    test('PAY-E2E-014: Historique paiements', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].amount).toBeDefined();
        expect(response.body[0].status).toBeDefined();
        expect(response.body[0].date).toBeDefined();
      }
    });

    test('PAY-E2E-015: Téléchargement facture', async () => {
      const response = await request(app)
        .get('/api/payments/invoice/latest')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.invoiceUrl).toBeDefined();
      expect(response.body.invoiceNumber).toBeDefined();
    });
  });

  describe('⚠️ Gestion Erreurs Paiement', () => {
    test('PAY-E2E-016: Carte déclinée', async () => {
      const paymentData = {
        planType: 'premium',
        paymentMethodId: 'pm_card_chargeDeclined'
      };

      await request(app)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(402);
    });

    test('PAY-E2E-017: Gestion 3D Secure', async () => {
      const paymentData = {
        planType: 'premium',
        paymentMethodId: 'pm_card_authenticationRequired'
      };

      const response = await request(app)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.requiresAction).toBe(true);
      expect(response.body.clientSecret).toBeDefined();
    });
  });
});

module.exports = {
  testSuiteName: 'CADOK Payments E2E Tests',
  totalPaymentTests: 17,
  paymentAreas: [
    'Plans & Pricing',
    'Payment Intent Creation',
    'Subscription Management',
    'Promo Codes & Discounts',
    'Usage & Limits',
    'Cancellation & Refunds',
    'Billing & Invoicing',
    'Payment Error Handling'
  ]
};
