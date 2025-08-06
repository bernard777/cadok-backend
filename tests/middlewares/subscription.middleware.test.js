
// Mock du modèle Subscription
// Mock complet du modèle Subscription
jest.mock('../../models/Subscription', () => {
  const mockSubscription = function(data) {
    Object.assign(this, {
      user: data.user,
      plan: data.plan || 'free',
      status: data.status || 'active',
      endDate: data.endDate,
      startDate: data.startDate || new Date(),
      paymentHistory: data.paymentHistory || [],
      payments: data.payments || [],
      premiumFeatures: data.premiumFeatures || {
        objectsPublished: 0,
        tradesCompleted: 0,
        advancedFilters: false,
        prioritySupport: false
      },
      monthlyPrice: data.plan === 'free' ? 0 : data.plan === 'basic' ? 5 : 15,
      currency: data.currency || 'EUR',
      autoRenew: data.autoRenew !== undefined ? data.autoRenew : true,
      ...data
    });
    
    // Méthodes d'instance
    this.save = jest.fn().mockImplementation(() => {
      // Validation basique
      if (!this.user) {
        return Promise.reject(new Error('User is required'));
      }
      if (!['free', 'basic', 'premium'].includes(this.plan)) {
        return Promise.reject(new Error('Invalid plan'));
      }
      if (!['active', 'cancelled', 'expired'].includes(this.status)) {
        return Promise.reject(new Error('Invalid status'));
      }
      if (['basic', 'premium'].includes(this.plan) && !this.endDate) {
        return Promise.reject(new Error('EndDate required for paid plans'));
      }
      return Promise.resolve(this);
    });
    
    this.isActive = jest.fn().mockImplementation(() => {
      if (this.plan === 'free') return this.status === 'active';
      if (this.status !== 'active') return false;
      if (!this.endDate) return false;
      return new Date(this.endDate) > new Date();
    });
    
    this.isPremium = jest.fn().mockImplementation(() => {
      return this.plan === 'premium' && this.isActive();
    });
    
    this.isBasicOrHigher = jest.fn().mockImplementation(() => {
      return ['basic', 'premium'].includes(this.plan) && this.isActive();
    });
    
    this.getUsageLimits = jest.fn().mockImplementation(() => {
      const limits = {
        free: { objects: 5, trades: 10 },
        basic: { objects: 20, trades: 50 },
        premium: { objects: 'unlimited', trades: 'unlimited' }
      };
      return limits[this.plan] || limits.free;
    });
    
    this.getLimits = jest.fn().mockImplementation(() => {
      return this.getUsageLimits();
    });
    
    this.renew = jest.fn().mockImplementation(() => {
      if (this.plan !== 'free') {
        this.status = 'active';
        this.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      return Promise.resolve(this);
    });
  };
  
  // Méthodes statiques
  mockSubscription.findOne = jest.fn().mockImplementation((query) => {
    if (query && query.user) {
      return Promise.resolve(null); // Pas trouvé par défaut
    }
    return Promise.resolve(null);
  });
  
  mockSubscription.find = jest.fn().mockResolvedValue([]);
  mockSubscription.create = jest.fn().mockImplementation((data) => {
    return Promise.resolve(new mockSubscription(data));
  });
  mockSubscription.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  mockSubscription.countDocuments = jest.fn().mockResolvedValue(0);
  mockSubscription.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockSubscription.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  mockSubscription.aggregate = jest.fn().mockResolvedValue([]);
  
  return mockSubscription;
});
    
    this.save = jest.fn().mockResolvedValue(this);
    this.isActive = jest.fn().mockReturnValue(this.status === 'active' && (!this.endDate || new Date(this.endDate) > new Date()));
    this.isPremium = jest.fn().mockReturnValue(this.plan === 'premium' && this.isActive());
    this.getUsageLimits = jest.fn().mockReturnValue({
      objects: this.plan === 'free' ? 5 : this.plan === 'basic' ? 20 : 'unlimited',
      trades: this.plan === 'free' ? 10 : this.plan === 'basic' ? 50 : 'unlimited'
    });
    this.renew = jest.fn().mockImplementation(() => {
      this.status = 'active';
      this.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return Promise.resolve(this);
    });
  };
  
  mockSubscription.findOne = jest.fn();
  mockSubscription.find = jest.fn();
  mockSubscription.create = jest.fn();
  mockSubscription.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  
  return mockSubscription;
});

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { requirePremium, requireBasicOrHigher, checkUsageLimits } = require('../../middlewares/subscription');
const Subscription = require('../../models/Subscription');
const User = require('../../models/User');
const Object = require('../../models/Object');
const Trade = require('../../models/Trade');

let mongoServer;
let req, res, next;

jest.setTimeout(30000)
describe('Subscription Middleware', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  })
beforeEach(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await Object.deleteMany({});
    await Trade.deleteMany({});
    
    // Mock request, response et next
    req = {
      user: { id: new mongoose.Types.ObjectId() }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  })
describe('requirePremium', () => {
    it('should allow premium user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'premium',
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();
      
      await requirePremium(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.subscription).toBeDefined();
      expect(req.subscription.plan).toBe('premium');
    })
it('should reject free user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'free'
      });
      await subscription.save();
      
      await requirePremium(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Abonnement Premium requis pour cette fonctionnalité',
        currentPlan: 'free',
        upgradeUrl: '/api/subscriptions/plans'
      });
      expect(next).not.toHaveBeenCalled();
    })
it('should reject basic user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'basic',
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();
      
      await requirePremium(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Abonnement Premium requis pour cette fonctionnalité',
        currentPlan: 'basic',
        upgradeUrl: '/api/subscriptions/plans'
      });
      expect(next).not.toHaveBeenCalled();
    })
it('should reject expired premium user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'premium',
        status: 'active',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expiré hier
      });
      await subscription.save();
      
      await requirePremium(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    })
it('should reject user without subscription', async () => {
      await requirePremium(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Abonnement Premium requis pour cette fonctionnalité',
        currentPlan: 'none',
        upgradeUrl: '/api/subscriptions/plans'
      });
      expect(next).not.toHaveBeenCalled();
    })
it('should handle database errors', async () => {
      // Simuler une erreur de base de données
      jest.spyOn(Subscription, 'findOne').mockRejectedValue(new Error('DB Error'));
      
      await requirePremium(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur'
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restaurer le mock
      Subscription.findOne.mockRestore();
    });
  })
describe('requireBasicOrHigher', () => {
    it('should allow basic user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'basic',
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();
      
      await requireBasicOrHigher(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.subscription).toBeDefined();
      expect(req.subscription.plan).toBe('basic');
    })
it('should allow premium user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'premium',
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await subscription.save();
      
      await requireBasicOrHigher(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.subscription.plan).toBe('premium');
    })
it('should reject free user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'free'
      });
      await subscription.save();
      
      await requireBasicOrHigher(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Abonnement Basic ou Premium requis pour cette fonctionnalité',
        currentPlan: 'free',
        upgradeUrl: '/api/subscriptions/plans'
      });
      expect(next).not.toHaveBeenCalled();
    })
it('should reject expired basic user', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'basic',
        status: 'active',
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });
      await subscription.save();
      
      await requireBasicOrHigher(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  })
describe('checkUsageLimits', () => {
    describe('Objects limit', () => {
      it('should allow free user within object limit', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'free'
        });
        await subscription.save();
        
        // Créer 2 objets (limite: 3)
        const categoryId = new mongoose.Types.ObjectId();
        await Object.create([
          { title: 'Object 1', description: 'Description 1', owner: req.user.id, category: categoryId },
          { title: 'Object 2', description: 'Description 2', owner: req.user.id, category: categoryId }
        ]);
        
        const middleware = checkUsageLimits('objects');
        await middleware(req, res, next);
        
        expect(next).toHaveBeenCalled();
      })
it('should reject free user exceeding object limit', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'free'
        });
        await subscription.save();
        
        // Créer 3 objets (limite: 3)
        const categoryId = new mongoose.Types.ObjectId();
        await Object.create([
          { title: 'Object 1', description: 'Description 1', owner: req.user.id, category: categoryId },
          { title: 'Object 2', description: 'Description 2', owner: req.user.id, category: categoryId },
          { title: 'Object 3', description: 'Description 3', owner: req.user.id, category: categoryId }
        ]);
        
        const middleware = checkUsageLimits('objects');
        await middleware(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Limite d\'objets atteinte (3)',
          currentPlan: 'free',
          upgradeUrl: '/api/subscriptions/plans'
        });
        expect(next).not.toHaveBeenCalled();
      })
it('should allow basic user within object limit', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'basic',
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await subscription.save();
        
        // Créer 5 objets (limite: 10)
        const categoryId = new mongoose.Types.ObjectId();
        const objects = [];
        for (let i = 1; i <= 5; i++) {
          objects.push({
            title: `Object ${i}`,
            description: `Description ${i}`,
            owner: req.user.id,
            category: categoryId
          });
        }
        await Object.create(objects);
        
        const middleware = checkUsageLimits('objects');
        await middleware(req, res, next);
        
        expect(next).toHaveBeenCalled();
      })
it('should allow premium user with unlimited objects', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'premium',
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await subscription.save();
        
        // Créer 50 objets (pas de limite)
        const categoryId = new mongoose.Types.ObjectId();
        const objects = [];
        for (let i = 1; i <= 50; i++) {
          objects.push({
            title: `Object ${i}`,
            description: `Description ${i}`,
            owner: req.user.id,
            category: categoryId
          });
        }
        await Object.create(objects);
        
        const middleware = checkUsageLimits('objects');
        await middleware(req, res, next);
        
        expect(next).toHaveBeenCalled();
      });
    })
describe('Trades limit', () => {
      it('should allow free user within trade limit', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'free'
        });
        await subscription.save();
        
        const otherUserId = new mongoose.Types.ObjectId();
        
        // Créer 1 échange (limite: 2)
        await Trade.create([
          { fromUser: req.user.id, toUser: otherUserId, requestedObjects: [new mongoose.Types.ObjectId()], status: 'pending' }
        ]);
        
        const middleware = checkUsageLimits('trades');
        await middleware(req, res, next);
        
        expect(next).toHaveBeenCalled();
      })
it('should reject free user exceeding trade limit', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'free'
        });
        await subscription.save();
        
        const otherUserId = new mongoose.Types.ObjectId();
        
        // Créer 2 échanges (limite: 2)
        await Trade.create([
          { fromUser: req.user.id, toUser: otherUserId, requestedObjects: [new mongoose.Types.ObjectId()], status: 'pending' },
          { fromUser: otherUserId, toUser: req.user.id, requestedObjects: [new mongoose.Types.ObjectId()], status: 'accepted' }
        ]);
        
        const middleware = checkUsageLimits('trades');
        await middleware(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Limite d\'échanges atteinte (2)',
          currentPlan: 'free',
          upgradeUrl: '/api/subscriptions/plans'
        });
        expect(next).not.toHaveBeenCalled();
      })
it('should count trades as requester and receiver', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'free'
        });
        await subscription.save();
        
        const otherUserId = new mongoose.Types.ObjectId();
        
        // Créer 1 échange comme fromUser et 1 comme toUser
        await Trade.create([
          { fromUser: req.user.id, toUser: otherUserId, requestedObjects: [new mongoose.Types.ObjectId()], status: 'pending' },
          { fromUser: otherUserId, toUser: req.user.id, requestedObjects: [new mongoose.Types.ObjectId()], status: 'accepted' }
        ]);
        
        const middleware = checkUsageLimits('trades');
        await middleware(req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      })
it('should allow premium user with unlimited trades', async () => {
        const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
          user: req.user.id,
          plan: 'premium',
          status: 'active',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await subscription.save();
        
        const otherUserId = new mongoose.Types.ObjectId();
        
        // Créer 20 échanges (pas de limite)
        const trades = [];
        for (let i = 0; i < 20; i++) {
          trades.push({
            fromUser: i % 2 === 0 ? req.user.id : otherUserId,
            toUser: i % 2 === 0 ? otherUserId : req.user.id,
            requestedObjects: [new mongoose.Types.ObjectId()],
            status: 'pending'
          });
        }
        await Trade.create(trades);
        
        const middleware = checkUsageLimits('trades');
        await middleware(req, res, next);
        
        expect(next).toHaveBeenCalled();
      });
    })
it('should return 404 if no subscription found', async () => {
      const middleware = checkUsageLimits('objects');
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Abonnement non trouvé'
      });
      expect(next).not.toHaveBeenCalled();
    })
it('should handle database errors', async () => {
      const subscription = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        user: req.user.id,
        plan: 'free'
      });
      await subscription.save();
      
      // Simuler une erreur lors du comptage des objets
      jest.spyOn(Object, 'countDocuments').mockRejectedValue(new Error('DB Error'));
      
      const middleware = checkUsageLimits('objects');
      await middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur'
      });
      expect(next).not.toHaveBeenCalled();
      
      // Restaurer le mock
      Object.countDocuments.mockRestore();
    });
  });
});


module.exports = {});