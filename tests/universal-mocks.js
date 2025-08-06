// Mocks universels pour tous les tests
const mongoose = require('mongoose');

// Mock mongoose connection
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  connection: {
    close: jest.fn().mockResolvedValue(true)
  },
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || 'test-id-123')
  }
}));

// Mock MongoMemoryServer
jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: jest.fn().mockResolvedValue({
      getUri: jest.fn().mockReturnValue('mongodb://localhost:27017/test'),
      stop: jest.fn().mockResolvedValue(true)
    })
  }
}));

// Mocks des modèles principaux
jest.mock('../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com'
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'user123',
    save: jest.fn().mockResolvedValue(true)
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

jest.mock('../models/Object', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'object123',
    title: 'Test Object',
    owner: 'user123'
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'object123',
    save: jest.fn().mockResolvedValue(true)
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

jest.mock('../models/Trade', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'trade123',
    requester: 'user123',
    receiver: 'user456'
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'trade123',
    save: jest.fn().mockResolvedValue(true)
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

// Mocks des services externes
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendNotification: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/paymentService', () => ({
  processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'tx123' }),
  refundPayment: jest.fn().mockResolvedValue({ success: true })
}));

module.exports = {};
