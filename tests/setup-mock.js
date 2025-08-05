/**
 * Setup simplifié pour tests sans MongoDB Memory Server
 */

// Configuration globale pour les tests
global.console = {
  ...console,
  log: process.env.DEBUG ? console.log : jest.fn(),
  warn: process.env.DEBUG ? console.warn : jest.fn(), 
  error: process.env.DEBUG ? console.error : jest.fn()
};

// Timeout pour les tests complexes
jest.setTimeout(30000);

// Variables d'environnement pour les tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_characters_long';
process.env.WEBHOOK_SECRET = 'test_webhook_secret_key_for_validation';

// Mock de mongoose global pour éviter les connexions DB
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    index: jest.fn(),
    virtual: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis()
  }));

  const mockModel = jest.fn().mockImplementation((data = {}) => {
    const instance = {
      ...data,
      _id: data._id || 'mock_id_' + Math.random().toString(36).substr(2, 9),
      save: jest.fn().mockResolvedValue(instance),
      remove: jest.fn().mockResolvedValue(true),
      deleteOne: jest.fn().mockResolvedValue(true),
      toObject: jest.fn().mockReturnValue(data),
      toJSON: jest.fn().mockReturnValue(data)
    };
    return instance;
  });

  // Méthodes statiques du modèle
  mockModel.find = jest.fn().mockResolvedValue([]);
  mockModel.findById = jest.fn().mockResolvedValue(null);
  mockModel.findOne = jest.fn().mockResolvedValue(null);
  mockModel.create = jest.fn().mockResolvedValue({});
  mockModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  mockModel.countDocuments = jest.fn().mockResolvedValue(0);
  mockModel.aggregate = jest.fn().mockResolvedValue([]);

  return {
    Schema: mockSchema,
    model: jest.fn().mockReturnValue(mockModel),
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    connection: {
      collections: {},
      db: {
        dropDatabase: jest.fn().mockResolvedValue()
      }
    },
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id || 'mock_object_id_' + Math.random().toString(36).substr(2, 9))
    },
    models: {}
  };
});

// Mock des APIs externes
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: { success: true } }),
  post: jest.fn().mockResolvedValue({ data: { success: true } }),
  put: jest.fn().mockResolvedValue({ data: { success: true } }),
  delete: jest.fn().mockResolvedValue({ data: { success: true } })
}));

// Mock des modules de chiffrement
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockImplementation((size) => ({
    toString: jest.fn().mockReturnValue('mock_random_' + 'x'.repeat(size))
  })),
  createCipher: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('encrypted'),
    final: jest.fn().mockReturnValue('data')
  }),
  createDecipher: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('decrypted'),
    final: jest.fn().mockReturnValue('data')
  })
}));

// Setup et teardown simplifiés
beforeAll(async () => {
  console.log('🧪 Setup tests avec mocks');
});

afterAll(async () => {
  console.log('🧹 Nettoyage tests terminé');
});

afterEach(async () => {
  // Reset des mocks après chaque test
  jest.clearAllMocks();
});

console.log('✅ Setup simplifié configuré - Tests prêts');
