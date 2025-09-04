/**
 * Setup pour tests unitaires avec mocks complets
 * 🎯 Isolation totale - Aucune dépendance externe
 */

// ===== CONFIGURATION GLOBALE =====

// Variables d'environnement pour tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_unit_tests';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars_long';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_mock';

// Mock console pour debug conditionnel
global.console = {
  ...console,
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  warn: process.env.DEBUG_TESTS ? console.warn : jest.fn(),
  error: process.env.DEBUG_TESTS ? console.error : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn()
};

// ===== UTILITAIRES GLOBAUX DÉFINIS EN PREMIER =====
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'mock_user_id', role: 'user' },
  ...overrides
});

global.createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockNext = () => jest.fn();

// ===== MOCK WINSTON (défini très tôt) =====
jest.mock('winston', () => {
  const winston = {
    createLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      child: jest.fn().mockReturnThis()
    }),
    addColors: jest.fn(),
    format: {
      combine: jest.fn().mockReturnValue({}),
      timestamp: jest.fn().mockReturnValue({}),
      errors: jest.fn().mockReturnValue({}),
      json: jest.fn().mockReturnValue({}),
      printf: jest.fn().mockReturnValue({}),
      colorize: jest.fn().mockReturnValue({}),
      simple: jest.fn().mockReturnValue({})
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  };
  return winston;
});

jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation(() => ({
    name: 'dailyRotateFile',
    level: 'info'
  }));
});

// ===== MOCKS MONGOOSE =====
const createMockModel = (name) => {
  const mockDocument = {
    _id: `mock_${name.toLowerCase()}_id`,
    save: jest.fn(),
    remove: jest.fn().mockResolvedValue(true),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    toObject: jest.fn(),
    toJSON: jest.fn(),
    populate: jest.fn()
  };

  // Résoudre la référence circulaire après création
  mockDocument.save.mockResolvedValue(mockDocument);
  mockDocument.toObject.mockReturnValue(mockDocument);
  mockDocument.toJSON.mockReturnValue(mockDocument);
  mockDocument.populate.mockResolvedValue(mockDocument);

  const mockModel = jest.fn().mockImplementation((data = {}) => ({
    ...mockDocument,
    ...data,
    _id: data._id || mockDocument._id
  }));

  // Méthodes statiques
  mockModel.find = jest.fn().mockResolvedValue([mockDocument]);
  mockModel.findById = jest.fn().mockResolvedValue(mockDocument);
  mockModel.findOne = jest.fn().mockResolvedValue(mockDocument);
  mockModel.findOneAndUpdate = jest.fn().mockResolvedValue(mockDocument);
  mockModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockDocument);
  mockModel.create = jest.fn().mockResolvedValue(mockDocument);
  mockModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  mockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
  mockModel.countDocuments = jest.fn().mockResolvedValue(1);
  mockModel.aggregate = jest.fn().mockResolvedValue([]);
  mockModel.exists = jest.fn().mockResolvedValue({ _id: mockDocument._id });

  return mockModel;
};

jest.mock('mongoose', () => {
  // Définir createMockModel dans le scope du mock
  const createMockModel = (name) => {
    const mockDocument = {
      _id: `mock_${name.toLowerCase()}_id`,
      save: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue(true),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      toObject: jest.fn().mockReturnValue({}),
      toJSON: jest.fn().mockReturnValue({}),
      populate: jest.fn().mockResolvedValue()
    };

    // Résoudre la référence circulaire
    mockDocument.save.mockResolvedValue(mockDocument);
    mockDocument.toObject.mockReturnValue(mockDocument);
    mockDocument.toJSON.mockReturnValue(mockDocument);
    mockDocument.populate.mockResolvedValue(mockDocument);

    const mockModel = jest.fn().mockImplementation((data = {}) => ({
      ...mockDocument,
      ...data,
      _id: data._id || mockDocument._id
    }));

    // Méthodes statiques
    mockModel.find = jest.fn().mockResolvedValue([mockDocument]);
    mockModel.findById = jest.fn().mockResolvedValue(mockDocument);
    mockModel.findOne = jest.fn().mockResolvedValue(mockDocument);
    mockModel.findOneAndUpdate = jest.fn().mockResolvedValue(mockDocument);
    mockModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockDocument);
    mockModel.create = jest.fn().mockResolvedValue(mockDocument);
    mockModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
    mockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
    mockModel.countDocuments = jest.fn().mockResolvedValue(1);
    mockModel.aggregate = jest.fn().mockResolvedValue([]);
    mockModel.exists = jest.fn().mockResolvedValue({ _id: mockDocument._id });

    return mockModel;
  };

  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    index: jest.fn(),
    virtual: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    plugin: jest.fn()
  }));

  // Cache des modèles mockés dans le scope du mock
  const modelCache = new Map();

  return {
    Schema: mockSchema,
    model: jest.fn().mockImplementation((name) => {
      if (modelCache.has(name)) {
        return modelCache.get(name);
      }
      const mockModel = createMockModel(name);
      modelCache.set(name, mockModel);
      return mockModel;
    }),
    modelCache, // Expose le cache pour les tests
    connect: jest.fn().mockResolvedValue({ connection: { readyState: 1 } }),
    disconnect: jest.fn().mockResolvedValue(),
    connection: {
      readyState: 1,
      collections: {},
      db: {
        dropDatabase: jest.fn().mockResolvedValue(),
        collection: jest.fn().mockReturnValue({
          drop: jest.fn().mockResolvedValue(),
          insertMany: jest.fn().mockResolvedValue(),
          deleteMany: jest.fn().mockResolvedValue()
        })
      },
      close: jest.fn().mockResolvedValue()
    },
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id || 'mock_object_id'),
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true)
      }
    },
    startSession: jest.fn().mockResolvedValue({
      withTransaction: jest.fn().mockImplementation((callback) => callback()),
      abortTransaction: jest.fn().mockResolvedValue(),
      commitTransaction: jest.fn().mockResolvedValue(),
      endSession: jest.fn().mockResolvedValue(),
      startTransaction: jest.fn().mockResolvedValue()
    })
  };
});

// ===== MOCKS DES SERVICES EXTERNES =====

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_jwt_token'),
  verify: jest.fn().mockReturnValue({ id: 'mock_user_id', role: 'user' }),
  decode: jest.fn().mockReturnValue({ id: 'mock_user_id' })
}));

// Mock BCrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('mock_hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('mock_salt')
}));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://mock.cloudinary.com/image.jpg',
        public_id: 'mock_public_id'
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}));

// Mock Email Service (conditionnel)
try {
  jest.mock('nodemailer', () => ({
    createTransporter: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock_message_id' })
    })
  }));
} catch (error) {
  // Module nodemailer non installé - ignorer
}

// Mock Socket.IO
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis()
  }))
}));

// Mock File System
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue('mock file content'),
    writeFile: jest.fn().mockResolvedValue(),
    unlink: jest.fn().mockResolvedValue(),
    mkdir: jest.fn().mockResolvedValue()
  },
  createWriteStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn()
  }),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  writeFileSync: jest.fn()
}));

// ===== MOCK DES MODÈLES CADOK =====
jest.doMock('../models/User', () => createMockModel('User'));
jest.doMock('../models/Object', () => createMockModel('Object'));
jest.doMock('../models/Trade', () => createMockModel('Trade'));
jest.doMock('../models/Notification', () => createMockModel('Notification'));
jest.doMock('../models/Category', () => createMockModel('Category'));
jest.doMock('../models/Message', () => createMockModel('Message'));

// ===== SETUP ET TEARDOWN =====
beforeAll(async () => {
  console.log('🧪 [UNIT TESTS] Setup complet avec mocks');
});

afterAll(async () => {
  console.log('🧹 [UNIT TESTS] Nettoyage terminé');
});

beforeEach(() => {
  // Reset sélectif - on évite de reset les mocks de modules externes
  // qui doivent rester stables entre les tests
  // jest.clearAllMocks(); // ⚠️ Désactivé car casse les mocks mongoose
});

afterEach(() => {
  // Nettoyage sélectif après chaque test
  // jest.resetAllMocks(); // ⚠️ Désactivé car casse les mocks mongoose
});

// ===== MOCKS SUPPLEMENTAIRES =====

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn().mockImplementation((input) => {
    // Simulation basique de sanitization
    if (typeof input === 'string') {
      return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    return input;
  })
}));

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn().mockReturnValue({
    isLength: jest.fn().mockReturnThis(),
    isEmail: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis()
  }),
  param: jest.fn().mockReturnValue({
    isMongoId: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis()
  }),
  query: jest.fn().mockReturnValue({
    isInt: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis()
  }),
  validationResult: jest.fn().mockReturnValue({
    isEmpty: jest.fn().mockReturnValue(true),
    array: jest.fn().mockReturnValue([])
  })
}));

console.log('✅ [UNIT TESTS] Setup avec mocks complets configuré');

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  createLogger: jest.fn().mockReturnThis()
};

module.exports = {
  createMockModel,
  mockLogger
};
