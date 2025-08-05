/**
 * 🧪 TESTS E2E CADOK - PARCOURS UTILISATEUR COMPLET
 * Tests End-to-End pour valider tous les flux critiques
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Object = require('../../models/Object');
const Trade = require('../../models/Trade');

describe('🚀 TESTS E2E CADOK - PARCOURS COMPLETS', () => {
  let server;
  let userToken1, userToken2;
  let userId1, userId2;
  let objectId1, objectId2;
  let tradeId;

  beforeAll(async () => {
    // Démarrage du serveur de test
    server = app.listen(0);
    
    // Nettoyage base de données
    await User.deleteMany({});
    await Object.deleteMany({});
    await Trade.deleteMany({});
  });

  afterAll(async () => {
    await server.close();
    await mongoose.connection.close();
  });

  describe('📝 PARCOURS 1: Inscription → Connexion → Profil', () => {
    test('E2E-001: Inscription complète utilisateur 1', async () => {
      const userData = {
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice.e2e@cadok.com',
        password: 'Password123!',
        city: 'Paris',
        zipCode: '75001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);

      userToken1 = response.body.token;
      userId1 = response.body.user._id;
    });

    test('E2E-002: Inscription complète utilisateur 2', async () => {
      const userData = {
        firstName: 'Bob',
        lastName: 'Dupont',
        email: 'bob.e2e@cadok.com',
        password: 'Password123!',
        city: 'Lyon',
        zipCode: '69001'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      userToken2 = response.body.token;
      userId2 = response.body.user._id;
    });

    test('E2E-003: Connexion et récupération profil', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice.e2e@cadok.com',
          password: 'Password123!'
        })
        .expect(200);

      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body.firstName).toBe('Alice');
      expect(profileResponse.body.email).toBe('alice.e2e@cadok.com');
    });
  });

  describe('📦 PARCOURS 2: Création Objets → Publication', () => {
    test('E2E-004: Création objet utilisateur 1', async () => {
      const objectData = {
        title: 'Livre JavaScript E2E',
        description: 'Livre de programmation pour tests E2E',
        category: 'Livres',
        condition: 'Bon état',
        estimatedValue: 25,
        images: ['test-image-1.jpg']
      };

      const response = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken1}`)
        .send(objectData)
        .expect(201);

      expect(response.body.title).toBe(objectData.title);
      expect(response.body.owner).toBe(userId1);
      
      objectId1 = response.body._id;
    });

    test('E2E-005: Création objet utilisateur 2', async () => {
      const objectData = {
        title: 'Jeu Échecs E2E',
        description: 'Jeu d\'échecs pour tests E2E',
        category: 'Jeux',
        condition: 'Excellent état',
        estimatedValue: 30,
        images: ['test-image-2.jpg']
      };

      const response = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken2}`)
        .send(objectData)
        .expect(201);

      objectId2 = response.body._id;
    });

    test('E2E-006: Recherche et consultation objets', async () => {
      const searchResponse = await request(app)
        .get('/api/objects?search=JavaScript')
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);
      expect(searchResponse.body[0].title).toContain('JavaScript');

      const detailResponse = await request(app)
        .get(`/api/objects/${objectId1}`)
        .expect(200);

      expect(detailResponse.body.title).toBe('Livre JavaScript E2E');
    });
  });

  describe('🔄 PARCOURS 3: Proposition Troc → Négociation → Acceptation', () => {
    test('E2E-007: Proposition de troc', async () => {
      const tradeData = {
        fromObjectId: objectId2,
        toObjectId: objectId1,
        message: 'Échange mon jeu d\'échecs contre votre livre JavaScript'
      };

      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${userToken2}`)
        .send(tradeData)
        .expect(201);

      expect(response.body.fromUser).toBe(userId2);
      expect(response.body.toUser).toBe(userId1);
      expect(response.body.status).toBe('pending');

      tradeId = response.body._id;
    });

    test('E2E-008: Consultation proposition par destinataire', async () => {
      const response = await request(app)
        .get(`/api/trades/${tradeId}`)
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(response.body.status).toBe('pending');
      expect(response.body.fromUser._id).toBe(userId2);
    });

    test('E2E-009: Acceptation du troc', async () => {
      const response = await request(app)
        .patch(`/api/trades/${tradeId}/accept`)
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(response.body.status).toBe('accepted');
    });

    test('E2E-010: Vérification notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken2}`)
        .expect(200);

      const tradeNotification = response.body.find(
        notif => notif.type === 'trade_accepted'
      );
      expect(tradeNotification).toBeDefined();
    });
  });

  describe('🔒 PARCOURS 4: Sécurité → Livraison → Finalisation', () => {
    test('E2E-011: Analyse sécurité du troc', async () => {
      const response = await request(app)
        .get(`/api/trades/${tradeId}/security-analysis`)
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(response.body.riskLevel).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
    });

    test('E2E-012: Soumission preuves photos', async () => {
      const photoData = {
        photos: ['proof-photo-1.jpg', 'proof-photo-2.jpg'],
        proofType: 'object_condition'
      };

      const response = await request(app)
        .post(`/api/trades/${tradeId}/submit-photos`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(photoData)
        .expect(200);

      expect(response.body.message).toContain('Preuves soumises');
    });

    test('E2E-013: Confirmation expédition', async () => {
      const shipmentData = {
        trackingNumber: 'TRACK123E2E',
        carrier: 'La Poste',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post(`/api/trades/${tradeId}/confirm-shipment`)
        .set('Authorization', `Bearer ${userToken1}`)
        .send(shipmentData)
        .expect(200);

      expect(response.body.message).toContain('Expédition confirmée');
    });

    test('E2E-014: Confirmation réception', async () => {
      const deliveryData = {
        condition: 'conforme',
        rating: 5,
        comment: 'Parfait état, merci !'
      };

      const response = await request(app)
        .post(`/api/trades/${tradeId}/confirm-delivery`)
        .set('Authorization', `Bearer ${userToken2}`)
        .send(deliveryData)
        .expect(200);

      expect(response.body.status).toBe('completed');
    });
  });

  describe('💳 PARCOURS 5: Système Premium', () => {
    test('E2E-015: Consultation plans subscription', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some(plan => plan.name === 'premium')).toBe(true);
    });

    test('E2E-016: Création intent paiement', async () => {
      const paymentData = {
        planType: 'premium',
        amount: 999 // 9.99€ en centimes
      };

      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${userToken1}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.client_secret).toBeDefined();
    });
  });

  describe('📊 PARCOURS 6: Statistiques & Analytics', () => {
    test('E2E-017: Statistiques utilisateur', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(response.body.totalTrades).toBeGreaterThanOrEqual(1);
      expect(response.body.totalObjects).toBeGreaterThanOrEqual(1);
    });

    test('E2E-018: Historique complet activité', async () => {
      const response = await request(app)
        .get('/api/trades?status=all')
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].status).toBe('completed');
    });
  });

  describe('🔍 PARCOURS 7: Recherche Avancée', () => {
    test('E2E-019: Recherche multi-critères', async () => {
      const response = await request(app)
        .get('/api/objects?category=Livres&condition=Bon état&maxValue=50')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    test('E2E-020: Feed personnalisé', async () => {
      const response = await request(app)
        .get('/api/objects/feed')
        .set('Authorization', `Bearer ${userToken1}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

module.exports = {
  testSuiteName: 'CADOK E2E Tests',
  totalScenarios: 20,
  criticalPaths: [
    'User Registration & Authentication',
    'Object Creation & Management', 
    'Trade Proposal & Negotiation',
    'Security & Delivery Process',
    'Payment & Subscription System',
    'Analytics & Statistics',
    'Advanced Search & Feed'
  ]
};
