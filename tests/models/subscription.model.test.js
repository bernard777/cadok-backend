const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Subscription = require('../../models/Subscription');

let mongoServer;

describe('Subscription Model', () => {
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
    await Subscription.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid subscription with default values', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        user: userId
      });

      const savedSubscription = await subscription.save();
      
      expect(savedSubscription.plan).toBe('free');
      expect(savedSubscription.status).toBe('active');
      expect(savedSubscription.monthlyPrice).toBe(0);
      expect(savedSubscription.currency).toBe('EUR');
      expect(savedSubscription.autoRenew).toBe(true);
      expect(savedSubscription.startDate).toBeDefined();
    });

    it('should require user field', async () => {
      const subscription = new Subscription({});
      
      await expect(subscription.save()).rejects.toThrow();
    });

    it('should enforce unique user constraint', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      const subscription1 = new Subscription({ user: userId });
      await subscription1.save();
      
      const subscription2 = new Subscription({ user: userId });
      await expect(subscription2.save()).rejects.toThrow();
    });

    it('should validate plan enum values', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        user: userId,
        plan: 'invalid-plan'
      });
      
      await expect(subscription.save()).rejects.toThrow();
    });

    it('should validate status enum values', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        user: userId,
        status: 'invalid-status'
      });
      
      await expect(subscription.save()).rejects.toThrow();
    });

    it('should require endDate for paid plans', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Basic plan sans endDate
      const basicSubscription = new Subscription({
        user: userId,
        plan: 'basic'
      });
      await expect(basicSubscription.save()).rejects.toThrow();
      
      // Premium plan sans endDate
      const premiumSubscription = new Subscription({
        user: new mongoose.Types.ObjectId(),
        plan: 'premium'
      });
      await expect(premiumSubscription.save()).rejects.toThrow();
    });

    it('should not require endDate for free plan', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        user: userId,
        plan: 'free'
      });
      
      const savedSubscription = await subscription.save();
      expect(savedSubscription.endDate).toBeUndefined();
    });
  });

  describe('Instance Methods', () => {
    describe('isActive()', () => {
      it('should return true for free plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const subscription = new Subscription({
          user: userId,
          plan: 'free'
        });
        
        expect(subscription.isActive()).toBe(true);
      });

      it('should return true for active paid plan with future endDate', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'active',
          endDate: futureDate
        });
        
        expect(subscription.isActive()).toBe(true);
      });

      it('should return false for paid plan with past endDate', async () => {
        const userId = new mongoose.Types.ObjectId();
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'active',
          endDate: pastDate
        });
        
        expect(subscription.isActive()).toBe(false);
      });

      it('should return true for cancelled plan with future endDate', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'cancelled',
          endDate: futureDate
        });
        
        expect(subscription.isActive()).toBe(true);
      });

      it('should return false for expired status', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'expired',
          endDate: futureDate
        });
        
        expect(subscription.isActive()).toBe(false);
      });
    });

    describe('isPremium()', () => {
      it('should return true for active premium plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'active',
          endDate: futureDate
        });
        
        expect(subscription.isPremium()).toBe(true);
      });

      it('should return false for basic plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'basic',
          status: 'active',
          endDate: futureDate
        });
        
        expect(subscription.isPremium()).toBe(false);
      });

      it('should return false for free plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const subscription = new Subscription({
          user: userId,
          plan: 'free'
        });
        
        expect(subscription.isPremium()).toBe(false);
      });

      it('should return false for expired premium plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'active',
          endDate: pastDate
        });
        
        expect(subscription.isPremium()).toBe(false);
      });
    });

    describe('isBasicOrHigher()', () => {
      it('should return true for active basic plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'basic',
          status: 'active',
          endDate: futureDate
        });
        
        expect(subscription.isBasicOrHigher()).toBe(true);
      });

      it('should return true for active premium plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'active',
          endDate: futureDate
        });
        
        expect(subscription.isBasicOrHigher()).toBe(true);
      });

      it('should return false for free plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const subscription = new Subscription({
          user: userId,
          plan: 'free'
        });
        
        expect(subscription.isBasicOrHigher()).toBe(false);
      });

      it('should return false for expired basic plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'basic',
          status: 'active',
          endDate: pastDate
        });
        
        expect(subscription.isBasicOrHigher()).toBe(false);
      });
    });

    describe('getLimits()', () => {
      it('should return correct limits for free plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const subscription = new Subscription({
          user: userId,
          plan: 'free'
        });
        
        const limits = subscription.getLimits();
        expect(limits).toEqual({ maxObjects: 3, maxTrades: 2 });
      });

      it('should return correct limits for basic plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'basic',
          endDate: futureDate
        });
        
        const limits = subscription.getLimits();
        expect(limits).toEqual({ maxObjects: 10, maxTrades: 5 });
      });

      it('should return correct limits for premium plan', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          endDate: futureDate
        });
        
        const limits = subscription.getLimits();
        expect(limits).toEqual({ maxObjects: 'unlimited', maxTrades: 'unlimited' });
      });
    });

    describe('renew()', () => {
      it('should renew premium subscription', async () => {
        const userId = new mongoose.Types.ObjectId();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        
        const subscription = new Subscription({
          user: userId,
          plan: 'premium',
          status: 'cancelled',
          endDate: futureDate
        });
        
        await subscription.save();
        await subscription.renew();
        
        expect(subscription.status).toBe('active');
        expect(subscription.endDate.getMonth()).toBe((new Date().getMonth() + 1) % 12);
      });

      it('should not change free subscription on renew', async () => {
        const userId = new mongoose.Types.ObjectId();
        const subscription = new Subscription({
          user: userId,
          plan: 'free'
        });
        
        await subscription.save();
        const originalEndDate = subscription.endDate;
        await subscription.renew();
        
        expect(subscription.endDate).toBe(originalEndDate);
      });
    });
  });

  describe('Payment History', () => {
    it('should store payment history correctly', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        user: userId,
        plan: 'premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      subscription.payments.push({
        amount: 5,
        status: 'success',
        transactionId: 'txn_123'
      });
      
      const savedSubscription = await subscription.save();
      expect(savedSubscription.payments).toHaveLength(1);
      expect(savedSubscription.payments[0].amount).toBe(5);
      expect(savedSubscription.payments[0].status).toBe('success');
      expect(savedSubscription.payments[0].transactionId).toBe('txn_123');
    });
  });

  describe('Premium Features', () => {
    it('should initialize premium features with default values', async () => {
      const userId = new mongoose.Types.ObjectId();
      const subscription = new Subscription({
        user: userId,
        plan: 'premium',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      const savedSubscription = await subscription.save();
      expect(savedSubscription.premiumFeatures.objectsPublished).toBe(0);
      expect(savedSubscription.premiumFeatures.tradesCompleted).toBe(0);
      expect(savedSubscription.premiumFeatures.prioritySearches).toBe(0);
    });
  });
});
