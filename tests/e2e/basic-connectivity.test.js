
// Setup des mocks pour les routes
// Mocks complets des autres modèles
jest.mock('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com',
    save: jest.fn().mockResolvedValue(true)
  }),
  create: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com',
    save: jest.fn().mockResolvedValue(true)
  }),
  findOne: jest.fn().mockResolvedValue(null),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
}));

jest.mock('../../models/Object', () => ({
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue({
    _id: 'obj123',
    title: 'Test Object',
    owner: 'user123'
  }),
  create: jest.fn().mockResolvedValue({
    _id: 'obj123',
    title: 'Test Object',
    owner: 'user123',
    save: jest.fn().mockResolvedValue(true)
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
}));

jest.mock('../../models/Trade', () => ({
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'trade123',
    requester: 'user123',
    receiver: 'user456',
    status: 'pending'
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
}));

// Tests E2E
// Mock User déjà défini ci-dessus
// jest.mock('../../models/User'('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com'
  }),
  create: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    save: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('../../models/Object', () => ({
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'obj123',
    title: 'Test Object',
    save: jest.fn().mockResolvedValue(true)
  })
}));

/**
 * 🧪 TEST E2E SIMPLE - VÉRIFICATION BASIQUE
 * Test de base pour valider la configuration E2E
 */

const request = require('supertest');
const app = require('../../app');

describe('🚀 TESTS E2E BASIQUES', () => {
  
  describe('📍 Connectivité API', () => {
    test('E2E-BASIC-001: API répond sur endpoint test', async () => {
      const response = await request(app)
        .get('/api/auth/test-connection')
        .expect(200);

      expect(response.body.message).toContain('Connectivité');
      expect(response.body.server).toBe('CADOK Backend');
    });

    test('E2E-BASIC-002: Endpoint inexistant retourne 404', async () => {
      await request(app)
        .get('/api/endpoint-inexistant')
        .expect(404);
    });
  });

  describe('📝 Authentification Basique', () => {
    test('E2E-BASIC-003: Accès endpoint protégé sans token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    test('E2E-BASIC-004: Inscription utilisateur simple', async () => {
      const userData = {
        firstName: 'TestBasic',
        lastName: 'E2E',
        email: `test.basic.${Date.now()}@cadok.com`,
        password: 'BasicPass123!',
        city: 'TestCity',
        zipCode: '12345'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });
  });

  describe('📦 API Objets Basique', () => {
    let userToken;

    beforeAll(async () => {
      // Création utilisateur test
      const userData = {
        firstName: 'ObjectTest',
        lastName: 'E2E',
        email: `object.test.${Date.now()}@cadok.com`,
        password: 'ObjectPass123!',
        city: 'TestCity'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      userToken = registerResponse.body.token;
    });

    test('E2E-BASIC-005: Consultation liste objets publique', async () => {
      const response = await request(app)
        .get('/api/objects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('E2E-BASIC-006: Création objet simple', async () => {
      const objectData = {
        title: 'Objet Test E2E Basic',
        description: 'Description test basique',
        category: 'Test',
        condition: 'Bon état',
        estimatedValue: 20
      };

      const response = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(objectData)
        .expect(200);

      expect(response.body.title).toBe(objectData.title);
      expect(response.body.owner).toBeDefined();
    });
  });
});

module.exports = {
  testSuiteName: 'CADOK Basic E2E Tests',
  totalBasicTests: 6
};
