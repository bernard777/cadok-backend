/**
 * Configuration globale pour tous les tests CADOK
 * Setup avancé pour les nouveaux tests critiques
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Configuration globale pour les tests
global.console = {
  ...console,
  log: process.env.DEBUG ? console.log : jest.fn(),
  warn: process.env.DEBUG ? console.warn : jest.fn(), 
  error: process.env.DEBUG ? console.error : jest.fn()
};

// Augmenter le timeout pour les tests complexes
jest.setTimeout(60000);

// Mock des variables d'environnement
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_characters_long';
process.env.WEBHOOK_SECRET = 'test_webhook_secret_key_for_validation';

// Configuration MongoDB en mémoire
let mongoServer;

beforeAll(async () => {
  // Démarrer MongoDB en mémoire pour les tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Nettoyer après tous les tests
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  // Nettoyer les collections après chaque test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock global des services externes
jest.mock('qrcode', () => ({
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-qr-data'))
}));

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn(),
    fillColor: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    end: jest.fn(),
    on: jest.fn((event, callback) => {
      if (event === 'end') setTimeout(callback, 0);
    })
  }));
});

// Mock du système de fichiers pour les tests
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  createWriteStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
    on: jest.fn(),
    end: jest.fn()
  }),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('test file content')
}));

// Mock des APIs externes
global.mockColissimoAPI = {
  createLabel: jest.fn().mockResolvedValue({
    trackingNumber: 'CP202501234567',
    labelUrl: 'https://api-colissimo.com/labels/CP202501234567.pdf'
  })
};

global.mockMondialRelayAPI = {
  findNearestPickupPoints: jest.fn().mockResolvedValue([
    {
      id: 'MR123',
      name: 'Tabac des Acacias',
      address: '25 Rue des Acacias, 69001 Lyon',
      distance: 0.5
    }
  ])
};

global.mockChronopostAPI = {
  createExpressLabel: jest.fn().mockResolvedValue({
    trackingNumber: 'CH202501234567',
    service: 'Chrono13'
  })
};

// Utilitaires de test globaux
global.testUtils = {
  createMockUser: (id = 'user123', overrides = {}) => ({
    _id: id,
    firstName: 'Test',
    lastName: 'User', 
    email: 'test@example.com',
    city: 'Paris',
    ...overrides
  }),
  
  createMockTrade: (id = 'trade123', overrides = {}) => ({
    _id: id,
    status: 'accepted',
    type: 'simple',
    fromUser: global.testUtils.createMockUser('user1'),
    toUser: global.testUtils.createMockUser('user2'),
    save: jest.fn().mockResolvedValue(true),
    ...overrides
  }),
  
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  expectToMatchPattern: (value, pattern) => {
    expect(value).toMatch(new RegExp(pattern));
  }
};

// Configuration des mocks de cryptographie pour les tests de sécurité
global.mockCrypto = {
  randomBytes: jest.fn().mockReturnValue(Buffer.from('0123456789abcdef')),
  createCipher: jest.fn(),
  createDecipher: jest.fn(),
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked_hash')
  })
};
