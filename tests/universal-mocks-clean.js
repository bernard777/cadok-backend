// Mocks universels pour tous les tests
const mongoose = require('mongoose');

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

// Mock Winston
jest.mock('winston', () => ({
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

// Helper pour créer des modèles avec sessions
const createMockModel = (defaultDoc = {}) => {
  const mockDocument = {
    _id: 'mock_id',
    save: jest.fn(),
    remove: jest.fn().mockResolvedValue(true),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    toObject: jest.fn(),
    toJSON: jest.fn(),
    populate: jest.fn(),
    ...defaultDoc
  };

  // Référence circulaire
  mockDocument.save.mockResolvedValue(mockDocument);
  mockDocument.toObject.mockReturnValue(mockDocument);
  mockDocument.toJSON.mockReturnValue(mockDocument);
  mockDocument.populate.mockResolvedValue(mockDocument);

  const mockModel = jest.fn().mockImplementation((data = {}) => ({
    ...mockDocument,
    ...data
  }));

  // Méthodes avec support session
  mockModel.find = jest.fn().mockImplementation(() => ({
    session: jest.fn().mockResolvedValue([mockDocument]),
    exec: jest.fn().mockResolvedValue([mockDocument])
  }));
  
  mockModel.findById = jest.fn().mockImplementation(() => ({
    session: jest.fn().mockResolvedValue(mockDocument),
    exec: jest.fn().mockResolvedValue(mockDocument)
  }));
  
  mockModel.findOne = jest.fn().mockImplementation(() => ({
    session: jest.fn().mockResolvedValue(mockDocument),
    exec: jest.fn().mockResolvedValue(mockDocument)
  }));

  // Autres méthodes Mongoose
  mockModel.findOneAndUpdate = jest.fn().mockResolvedValue(mockDocument);
  mockModel.findByIdAndUpdate = jest.fn().mockImplementation(() => ({
    session: jest.fn().mockResolvedValue(mockDocument)
  }));
  mockModel.findByIdAndDelete = jest.fn().mockImplementation(() => ({
    session: jest.fn().mockResolvedValue(mockDocument)
  }));
  mockModel.create = jest.fn().mockResolvedValue(mockDocument);
  mockModel.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  mockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
  mockModel.countDocuments = jest.fn().mockResolvedValue(1);

  return mockModel;
};

// Mock mongoose avec sessions complètes
jest.mock('mongoose', () => {
  const MockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn(),
    post: jest.fn(),
    index: jest.fn(),
    virtual: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    plugin: jest.fn()
  }));

  MockSchema.Types = {
    ObjectId: jest.fn().mockImplementation((id) => id || 'mock_object_id')
  };

  return {
    Schema: MockSchema,
    model: jest.fn().mockImplementation((name) => createMockModel()),
    connect: jest.fn().mockResolvedValue({ connection: { readyState: 1 } }),
    disconnect: jest.fn().mockResolvedValue(),
    connection: {
      readyState: 1,
      close: jest.fn().mockResolvedValue()
    },
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id || 'mock_object_id'),
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true)
      }
    },
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(),
      abortTransaction: jest.fn().mockResolvedValue(),
      endSession: jest.fn().mockResolvedValue(),
      withTransaction: jest.fn().mockImplementation((callback) => callback())
    })
  };
});

// Mocks des modèles spécifiques
jest.mock('../models/User', () => createMockModel({
  _id: 'user123',
  pseudo: 'TestUser',
  email: 'test@example.com'
}));

jest.mock('../models/Object', () => createMockModel({
  _id: 'obj123',
  title: 'Test Object',
  owner: 'user123',
  status: 'available'
}));

jest.mock('../models/Trade', () => createMockModel({
  _id: 'trade123',
  fromUser: 'user1',
  toUser: 'user2',
  status: 'pending',
  requestedObjects: ['obj1'],
  offeredObjects: ['obj2']
}));

jest.mock('../models/Message', () => createMockModel({
  _id: 'msg123',
  content: 'Test message',
  sender: 'user1'
}));

// Mock DOMPurify
jest.mock('dompurify', () => jest.fn().mockImplementation(() => ({
  sanitize: jest.fn().mockImplementation((input) => {
    if (typeof input === 'string') {
      return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    return input;
  })
})));

// Mock JSDOM
jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: {}
  }))
}));

// Mock express-validator
jest.mock('express-validator', () => {
  const createChain = () => ({
    isLength: jest.fn().mockReturnThis(),
    isEmail: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    custom: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    isMongoId: jest.fn().mockReturnThis(),
    isInt: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isFloat: jest.fn().mockReturnThis(),
    isNumeric: jest.fn().mockReturnThis(),
    isAlphanumeric: jest.fn().mockReturnThis()
  });

  return {
    body: jest.fn().mockReturnValue(createChain()),
    param: jest.fn().mockReturnValue(createChain()),
    query: jest.fn().mockReturnValue(createChain()),
    validationResult: jest.fn().mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    })
  };
});

// Mock des services externes
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendNotification: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/paymentService', () => ({
  processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'tx123' }),
  refundPayment: jest.fn().mockResolvedValue({ success: true })
}));

module.exports = {};
