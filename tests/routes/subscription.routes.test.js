const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let authToken;

describe('Subscription Routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    
    // Créer un utilisateur de test
    testUser = new User({
      pseudo: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      city: 'Paris'
    });
    await testUser.save();
    
    // Créer un token d'authentification
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/subscriptions/current', () => {
    it('should get current subscription for authenticated user', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.user._id).toBe(testUser._id.toString());
      expect(response.body.plan).toBe('free');
      expect(response.body.status).toBe('active');
    });

    it('should create free subscription if none exists', async () => {
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.plan).toBe('free');
      
      // Vérifier que l'abonnement a été créé en base
      const subscription = await Subscription.findOne({ user: testUser._id });
      expect(subscription).toBeTruthy();
      expect(subscription.plan).toBe('free');
    });

    it('should return existing subscription', async () => {
      // Créer un abonnement premium
      const subscription = new Subscription({
        user: testUser._id,
        plan: 'premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlyPrice: 5
      });
      await subscription.save();
      
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.plan).toBe('premium');
      expect(response.body.monthlyPrice).toBe(5);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/subscriptions/current')
        .expect(401);
    });
  });

  describe('GET /api/subscriptions/plans', () => {
    it('should return all available plans', async () => {
      const response = await request(app)
        .get('/api/subscriptions/plans')
        .expect(200);
      
      expect(response.body).toHaveProperty('free');
      expect(response.body).toHaveProperty('basic');
      expect(response.body).toHaveProperty('premium');
      
      expect(response.body.free.price).toBe(0);
      expect(response.body.basic.price).toBe(2);
      expect(response.body.premium.price).toBe(5);
      
      expect(response.body.free.limits.maxObjects).toBe(3);
      expect(response.body.basic.limits.maxObjects).toBe(10);
      expect(response.body.premium.limits.maxObjects).toBe('unlimited');
    });

    it('should not require authentication', async () => {
      await request(app)
        .get('/api/subscriptions/plans')
        .expect(200);
    });
  });

  describe('POST /api/subscriptions/upgrade', () => {
    it('should upgrade to basic plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan: 'basic',
          paymentMethod: {
            type: 'stripe',
            customerId: 'cus_123',
            last4: '4242'
          }
        })
        .expect(200);
      
      expect(response.body.message).toContain('basic');
      expect(response.body.subscription.plan).toBe('basic');
      expect(response.body.subscription.monthlyPrice).toBe(2);
      expect(response.body.subscription.status).toBe('active');
      expect(response.body.subscription.payments).toHaveLength(1);
    });

    it('should upgrade to premium plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan: 'premium'
        })
        .expect(200);
      
      expect(response.body.subscription.plan).toBe('premium');
      expect(response.body.subscription.monthlyPrice).toBe(5);
      expect(response.body.subscription.endDate).toBeTruthy();
    });

    it('should reject invalid plan', async () => {
      await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan: 'invalid'
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/subscriptions/upgrade')
        .send({ plan: 'basic' })
        .expect(401);
    });

    it('should update existing subscription', async () => {
      // Créer un abonnement basic existant
      const subscription = new Subscription({
        user: testUser._id,
        plan: 'basic',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlyPrice: 2
      });
      await subscription.save();
      
      const response = await request(app)
        .post('/api/subscriptions/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          plan: 'premium'
        })
        .expect(200);
      
      expect(response.body.subscription.plan).toBe('premium');
      expect(response.body.subscription.monthlyPrice).toBe(5);
      
      // Vérifier qu'il n'y a qu'un seul abonnement
      const subscriptionCount = await Subscription.countDocuments({ user: testUser._id });
      expect(subscriptionCount).toBe(1);
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    it('should cancel paid subscription', async () => {
      // Créer un abonnement premium
      const subscription = new Subscription({
        user: testUser._id,
        plan: 'premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlyPrice: 5
      });
      await subscription.save();
      
      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.message).toContain('annulé');
      expect(response.body.subscription.status).toBe('cancelled');
      expect(response.body.subscription.autoRenew).toBe(false);
    });

    it('should not cancel free subscription', async () => {
      const subscription = new Subscription({
        user: testUser._id,
        plan: 'free'
      });
      await subscription.save();
      
      await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 404 if no subscription found', async () => {
      await request(app)
        .post('/api/subscriptions/cancel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/subscriptions/cancel')
        .expect(401);
    });
  });

  describe('GET /api/subscriptions/usage', () => {
    it('should return usage statistics for free plan', async () => {
      const subscription = new Subscription({
        user: testUser._id,
        plan: 'free'
      });
      await subscription.save();
      
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.current).toHaveProperty('objects');
      expect(response.body.current).toHaveProperty('trades');
      expect(response.body.limits.maxObjects).toBe(3);
      expect(response.body.limits.maxTrades).toBe(2);
      expect(response.body.plan).toBe('free');
      expect(response.body.isActive).toBe(true);
    });

    it('should return usage statistics for premium plan', async () => {
      const subscription = new Subscription({
        user: testUser._id,
        plan: 'premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        premiumFeatures: {
          objectsPublished: 5,
          tradesCompleted: 3,
          prioritySearches: 10
        }
      });
      await subscription.save();
      
      const response = await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.limits.maxObjects).toBe('unlimited');
      expect(response.body.limits.maxTrades).toBe('unlimited');
      expect(response.body.plan).toBe('premium');
      expect(response.body.premiumFeatures.objectsPublished).toBe(5);
    });

    it('should return 404 if no subscription found', async () => {
      await request(app)
        .get('/api/subscriptions/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/subscriptions/usage')
        .expect(401);
    });
  });

  describe('GET /api/subscriptions', () => {
    beforeEach(async () => {
      // Créer plusieurs abonnements pour tester la pagination
      const user2 = new User({
        pseudo: 'user2',
        email: 'user2@example.com',
        password: 'hashedpassword123',
        city: 'Lyon'
      });
      await user2.save();
      
      const user3 = new User({
        pseudo: 'user3',
        email: 'user3@example.com',
        password: 'hashedpassword123',
        city: 'Marseille'
      });
      await user3.save();
      
      await Subscription.create([
        { user: testUser._id, plan: 'free' },
        { 
          user: user2._id, 
          plan: 'basic',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          monthlyPrice: 2
        },
        { 
          user: user3._id, 
          plan: 'premium',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          monthlyPrice: 5
        }
      ]);
    });

    it('should return paginated subscriptions', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.subscriptions).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.pages).toBe(1);
      
      // Vérifier que les utilisateurs sont populés
      expect(response.body.subscriptions[0].user.email).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/subscriptions?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.subscriptions).toHaveLength(2);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
      expect(response.body.pages).toBe(2);
    });

    it('should sort by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const subscriptions = response.body.subscriptions;
      for (let i = 1; i < subscriptions.length; i++) {
        const currentDate = new Date(subscriptions[i].createdAt);
        const previousDate = new Date(subscriptions[i-1].createdAt);
        expect(currentDate.getTime()).toBeLessThanOrEqual(previousDate.getTime());
      }
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/subscriptions')
        .expect(401);
    });
  });
});
