const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Subscription = require('../../models/Subscription');
const User = require('../../models/User');

jest.setTimeout(30000)
describe('Subscription System - Smoke Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  })
afterEach(async () => {
    await Subscription.deleteMany({});
    await User.deleteMany({});
  })
it('should create and validate subscription system is not broken', async () => {
    // Test que le modèle Subscription fonctionne
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      pseudo: 'testuser',
      city: 'Test City'
    });

    const subscription = await Subscription.create({
      user: user._id,
      plan: 'premium',
      status: 'active',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      monthlyPrice: 5.00,
      payments: [{
        amount: 5.00,
        status: 'success',
        transactionId: 'test123'
      }]
    });

    expect(subscription.plan).toBe('premium');
    expect(subscription.isPremium()).toBe(true);
    expect(subscription.isActive()).toBe(true);
  });
});
