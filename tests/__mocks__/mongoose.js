// Mock mongoose complet
const mockSchema = {
  index: jest.fn(),
  pre: jest.fn(),
  post: jest.fn(),
  methods: {},
  statics: {},
  virtual: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn()
  }))
};

const mockModel = {
  find: jest.fn(() => ({
    populate: jest.fn(() => ({
      exec: jest.fn(() => Promise.resolve([]))
    })),
    exec: jest.fn(() => Promise.resolve([]))
  })),
  findById: jest.fn(() => ({
    populate: jest.fn(() => ({
      exec: jest.fn(() => Promise.resolve({}))
    })),
    exec: jest.fn(() => Promise.resolve({}))
  })),
  findOne: jest.fn(() => ({
    populate: jest.fn(() => ({
      exec: jest.fn(() => Promise.resolve({}))
    })),
    exec: jest.fn(() => Promise.resolve({}))
  })),
  create: jest.fn(() => Promise.resolve({})),
  findByIdAndUpdate: jest.fn(() => Promise.resolve({})),
  findByIdAndDelete: jest.fn(() => Promise.resolve({})),
  deleteMany: jest.fn(() => Promise.resolve({ deletedCount: 0 })),
  countDocuments: jest.fn(() => Promise.resolve(0)),
  aggregate: jest.fn(() => Promise.resolve([])),
  save: jest.fn(() => Promise.resolve())
};

const mongoose = {
  Schema: jest.fn(() => mockSchema),
  model: jest.fn(() => mockModel),
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(() => Promise.resolve()),
  connection: {
    readyState: 1,
    on: jest.fn(),
    once: jest.fn(),
    close: jest.fn(() => Promise.resolve())
  },
  Types: {
    ObjectId: jest.fn((id) => id || '507f1f77bcf86cd799439011')
  }
};

// Types pour les schémas
mongoose.Schema.Types = {
  ObjectId: mongoose.Types.ObjectId,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  Array: Array,
  Mixed: Object
};

module.exports = mongoose;