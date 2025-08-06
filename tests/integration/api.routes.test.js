const mongoose = require('mongoose');
/**
 * 🧪 TESTS API ROUTES - ENDPOINTS CRITIQUES
 * Tests d'intégration pour toutes les routes API principales
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Trade = require('../../models/Trade');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000)
describe('🚀 API Routes - Tests d\'Intégration', () => {
  let testUser1, testUser2;
  let authToken1, authToken2
beforeEach(async () => {
    // Créer utilisateurs test
    testUser1 = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
      firstName: 'Alice',
      lastName: 'Test',
      email: 'alice@api.test',
      password: 'password123',
      city: 'Paris',
      zipCode: '75001'
    });
    await testUser1.save()
testUser2 = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
      firstName: 'Bob',
      lastName: 'Test',
      email: 'bob@api.test',
      password: 'password123',
      city: 'Lyon',
      zipCode: '69000'
    });
    await testUser2.save();
    
    // Générer tokens d'authentification
    authToken1 = jwt.sign(
      { id: testUser1._id, email: testUser1.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    authToken2 = jwt.sign(
      { id: testUser2._id, email: testUser2.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  })
describe('🔐 Authentification Routes', () => {
    
    test('POST /api/auth/register - Doit créer un nouvel utilisateur', async () => {
      const userData = {
        firstName: 'Nouveau',
        lastName: 'Utilisateur',
        email: 'nouveau@test.com',
        password: 'password123',
        city: 'Marseille',
        zipCode: '13000'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    })
test('POST /api/auth/login - Doit authentifier un utilisateur existant', async () => {
      const loginData = {
        email: testUser1.email,
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.id).toBe(testUser1._id.toString());
    })
test('POST /api/auth/login - Doit rejeter des identifiants incorrects', async () => {
      const loginData = {
        email: testUser1.email,
        password: 'motdepasseincorrect'
      };
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    })
test('GET /api/auth/profile - Doit récupérer le profil utilisateur', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(testUser1._id.toString());
    });
  })
describe('🔄 Trades Routes', () => {
    
    test('POST /api/trades - Doit créer un nouveau troc', async () => {
      const tradeData = {
        toUser: testUser2._id,
        offeredObject: {
          title: 'Livre API Test',
          description: 'Livre pour test API',
          category: 'Livres',
          estimatedValue: 15
        },
        requestedObject: {
          title: 'Jeu API Test',
          description: 'Jeu pour test API',
          category: 'Jeux',
          estimatedValue: 20
        },
        type: 'bidirectional'
      };
      
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(tradeData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.trade).toBeDefined();
      expect(response.body.trade.fromUser).toBe(testUser1._id.toString());
      expect(response.body.trade.status).toBe('pending');
    })
test('GET /api/trades - Doit récupérer les trocs de l\'utilisateur', async () => {
      // Créer un troc test
      const testTrade = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Test Object' },
        requestedObject: { title: 'Requested Object' },
        status: 'pending'
      });
      await testTrade.save();
      
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.trades)).toBe(true);
      expect(response.body.trades.length).toBeGreaterThan(0);
    })
test('PUT /api/trades/:id/accept - Doit accepter un troc', async () => {
      const testTrade = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Accept Test' },
        requestedObject: { title: 'Accept Request' },
        status: 'pending'
      });
      await testTrade.save();
      
      const response = await request(app)
        .put(`/api/trades/${testTrade._id}/accept`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.trade.status).toBe('accepted');
    })
test('PUT /api/trades/:id/reject - Doit rejeter un troc', async () => {
      const testTrade = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Reject Test' },
        requestedObject: { title: 'Reject Request' },
        status: 'pending'
      });
      await testTrade.save();
      
      const response = await request(app)
        .put(`/api/trades/${testTrade._id}/reject`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.trade.status).toBe('rejected');
    })
test('DELETE /api/trades/:id - Doit supprimer un troc', async () => {
      const testTrade = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Delete Test' },
        requestedObject: { title: 'Delete Request' },
        status: 'pending'
      });
      await testTrade.save();
      
      const response = await request(app)
        .delete(`/api/trades/${testTrade._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Vérifier que le troc est supprimé
      const deletedTrade = await Trade.findById(testTrade._id);
      expect(deletedTrade).toBeNull();
    });
  })
describe('📍 Pickup Points Routes', () => {
    
    test('GET /api/pickup-points - Doit récupérer les points relais', async () => {
      const response = await request(app)
        .get('/api/pickup-points?zipCode=75001')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.pickupPoints)).toBe(true);
    })
test('GET /api/pickup-points/nearby - Doit trouver les points relais à proximité', async () => {
      const response = await request(app)
        .get('/api/pickup-points/nearby?lat=48.8566&lng=2.3522&radius=5000')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.pickupPoints)).toBe(true);
    })
test('POST /api/pickup-points/:id/reserve - Doit réserver un point relais', async () => {
      // Créer un point relais test
      const PickupPoint = require('../../models/PickupPoint');
      const testPickupPoint = new PickupPoint({
        name: 'Test Point API',
        address: '123 Test Street',
        city: 'Paris',
        zipCode: '75001',
        provider: 'MondiaPolis',
        providerId: 'API_TEST_001'
      });
      await testPickupPoint.save();
      
      const response = await request(app)
        .post(`/api/pickup-points/${testPickupPoint._id}/reserve`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ tradeId: new mongoose.Types.ObjectId() })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.reservation).toBeDefined();
    });
  })
describe('💰 Payment Routes', () => {
    
    test('POST /api/payments/create-intent - Doit créer une intention de paiement', async () => {
      const paymentData = {
        amount: 500, // 5€
        currency: 'eur',
        description: 'Test payment'
      };
      
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(paymentData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.clientSecret).toBeDefined();
    })
test('GET /api/payments/history - Doit récupérer l\'historique des paiements', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
  })
describe('📋 Categories Routes', () => {
    
    test('GET /api/categories - Doit récupérer toutes les catégories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.categories)).toBe(true);
    })
test('GET /api/categories/:id/objects - Doit récupérer les objets d\'une catégorie', async () => {
      // Créer une catégorie test
      const Category = require('../../models/Category');
      const testCategory = new Category({
        name: 'Test Category API',
        description: 'Catégorie pour test API'
      });
      await testCategory.save();
      
      const response = await request(app)
        .get(`/api/categories/${testCategory._id}/objects`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.objects)).toBe(true);
    });
  })
describe('🔍 Search Routes', () => {
    
    test('GET /api/search - Doit rechercher des objets', async () => {
      const response = await request(app)
        .get('/api/search?q=livre&category=Livres')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
    })
test('GET /api/search/advanced - Doit effectuer une recherche avancée', async () => {
      const searchParams = new URLSearchParams({
        query: 'jeu',
        category: 'Jeux',
        minValue: '10',
        maxValue: '50',
        city: 'Paris'
      });
      
      const response = await request(app)
        .get(`/api/search/advanced?${searchParams}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  })
describe('🛡️ Security & Validation', () => {
    
    test('Doit rejeter les requêtes sans token', async () => {
      const response = await request(app)
        .get('/api/trades')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    })
test('Doit rejeter les tokens invalides', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    })
test('Doit valider les données d\'entrée', async () => {
      const invalidTradeData = {
        // Données manquantes/invalides
        toUser: 'invalid-id',
        offeredObject: {},
        requestedObject: {}
      };
      
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(invalidTradeData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    })
test('Doit limiter le taux de requêtes', async () => {
      const promises = [];
      
      // Envoyer beaucoup de requêtes rapidement
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${authToken1}`)
        );
      }
      
      const responses = await Promise.all(promises);
      
      // Au moins une requête doit être limitée
      const limitedResponses = responses.filter(r => r.status === 429);
      expect(limitedResponses.length).toBeGreaterThan(0);
    });
  })
describe('📊 Performance & Monitoring', () => {
    
    test('Les réponses doivent être rapides', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/categories')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(500); // Moins de 500ms
    })
test('Doit retourner les headers appropriés', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);
      
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['x-powered-by']).toBeDefined();
    });
  })
describe('🔄 Error Handling', () => {
    
    test('Doit gérer les erreurs 404', async () => {
      const response = await request(app)
        .get('/api/inexistant')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    })
test('Doit gérer les erreurs serveur', async () => {
      // Mock d'une erreur de base de données
      const originalFind = Trade.find;
      Trade.find = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Restaurer la méthode originale
      Trade.find = originalFind;
    });
  });
});
