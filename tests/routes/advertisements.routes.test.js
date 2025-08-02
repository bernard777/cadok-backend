const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const Advertisement = require('../../models/Advertisement');
const Object = require('../../models/Object');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let premiumUser;
let authToken;
let premiumToken;
let testObject;

describe('Advertisement Routes', () => {
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
    await Advertisement.deleteMany({});
    await Object.deleteMany({});
    
    // Créer un utilisateur standard
    testUser = new User({
      pseudo: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      city: 'Paris'
    });
    await testUser.save();
    
    // Créer un utilisateur premium
    premiumUser = new User({
      pseudo: 'premiumuser',
      email: 'premium@example.com',
      password: 'hashedpassword123',
      city: 'Lyon'
    });
    await premiumUser.save();
    
    // Créer abonnement premium
    const premiumSubscription = new Subscription({
      user: premiumUser._id,
      plan: 'premium',
      status: 'active',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      monthlyPrice: 5
    });
    await premiumSubscription.save();
    
    // Créer un objet de test
    const categoryId = new mongoose.Types.ObjectId();
    testObject = new Object({
      title: 'Test Object',
      description: 'A test object',
      category: categoryId,
      owner: premiumUser._id
    });
    await testObject.save();
    
    // Créer les tokens d'authentification
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    premiumToken = jwt.sign(
      { id: premiumUser._id, email: premiumUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/advertisements', () => {
    it('should create advertisement for premium user', async () => {
      const response = await request(app)
        .post('/api/advertisements')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({
          objectId: testObject._id,
          duration: 7
        })
        .expect(201);
      
      expect(response.body.message).toContain('créée avec succès');
      expect(response.body.advertisement.duration).toBe(7);
      expect(response.body.advertisement.price).toBe(3.5); // 7 * 0.5
      expect(response.body.advertisement.priority).toBe(5);
      expect(response.body.advertisement.status).toBe('active');
      expect(response.body.advertisement.object.title).toBe('Test Object');
    });

    it('should require premium subscription', async () => {
      const response = await request(app)
        .post('/api/advertisements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          objectId: testObject._id,
          duration: 7
        })
        .expect(403);
      
      expect(response.body.message).toContain('Premium requis');
    });

    it('should require objectId and duration', async () => {
      await request(app)
        .post('/api/advertisements')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({})
        .expect(400);
      
      await request(app)
        .post('/api/advertisements')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({ objectId: testObject._id })
        .expect(400);
    });

    it('should require object ownership', async () => {
      // Créer un objet appartenant à un autre utilisateur
      const otherUser = new User({
        pseudo: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword123',
        city: 'Marseille'
      });
      await otherUser.save();
      
      const otherObject = new Object({
        title: 'Other Object',
        description: 'Another object',
        category: new mongoose.Types.ObjectId(),
        owner: otherUser._id
      });
      await otherObject.save();
      
      await request(app)
        .post('/api/advertisements')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({
          objectId: otherObject._id,
          duration: 7
        })
        .expect(404);
    });

    it('should calculate correct price and end date', async () => {
      const duration = 10;
      const expectedPrice = duration * 0.5;
      
      const response = await request(app)
        .post('/api/advertisements')
        .set('Authorization', `Bearer ${premiumToken}`)
        .send({
          objectId: testObject._id,
          duration
        })
        .expect(201);
      
      expect(response.body.advertisement.price).toBe(expectedPrice);
      
      const endDate = new Date(response.body.advertisement.endDate);
      const expectedEndDate = new Date();
      expectedEndDate.setDate(expectedEndDate.getDate() + duration);
      
      // Vérifier que la date de fin est correcte (à 1 minute près)
      expect(Math.abs(endDate.getTime() - expectedEndDate.getTime())).toBeLessThan(60000);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/advertisements')
        .send({
          objectId: testObject._id,
          duration: 7
        })
        .expect(401);
    });
  });

  describe('GET /api/advertisements/my', () => {
    beforeEach(async () => {
      // Créer quelques publicités de test
      await Advertisement.create([
        {
          user: premiumUser._id,
          object: testObject._id,
          duration: 7,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          price: 3.5,
          status: 'active'
        },
        {
          user: premiumUser._id,
          object: testObject._id,
          duration: 3,
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          price: 1.5,
          status: 'expired'
        }
      ]);
    });

    it('should return user advertisements', async () => {
      const response = await request(app)
        .get('/api/advertisements/my')
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(2);
      expect(response.body[0].object.title).toBe('Test Object');
      
      // Vérifier le tri par date de création (plus récent d'abord)
      const dates = response.body.map(ad => new Date(ad.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i-1].getTime());
      }
    });

    it('should return empty array if no advertisements', async () => {
      const response = await request(app)
        .get('/api/advertisements/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveLength(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/advertisements/my')
        .expect(401);
    });
  });

  describe('GET /api/advertisements/active', () => {
    beforeEach(async () => {
      // Créer plusieurs utilisateurs et objets pour les publicités
      const user2 = new User({
        pseudo: 'user2',
        email: 'user2@example.com',
        password: 'hashedpassword123',
        city: 'Nice'
      });
      await user2.save();
      
      const object2 = new Object({
        title: 'Object 2',
        description: 'Second object',
        category: new mongoose.Types.ObjectId(),
        owner: user2._id
      });
      await object2.save();
      
      // Créer des publicités avec différents statuts et priorités
      await Advertisement.create([
        {
          user: premiumUser._id,
          object: testObject._id,
          duration: 7,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          price: 3.5,
          status: 'active',
          priority: 8,
          impressions: 100,
          clicks: 5
        },
        {
          user: user2._id,
          object: object2._id,
          duration: 10,
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          price: 5,
          status: 'active',
          priority: 3
        },
        {
          user: premiumUser._id,
          object: testObject._id,
          duration: 5,
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          price: 2.5,
          status: 'active' // Active mais expiré
        },
        {
          user: user2._id,
          object: object2._id,
          duration: 7,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          price: 3.5,
          status: 'cancelled'
        }
      ]);
    });

    it('should return only active non-expired advertisements', async () => {
      const response = await request(app)
        .get('/api/advertisements/active')
        .expect(200);
      
      expect(response.body).toHaveLength(2);
      
      // Tous doivent être actifs et non expirés
      response.body.forEach(ad => {
        expect(ad.status).toBe('active');
        expect(new Date(ad.endDate).getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should sort by priority then creation date', async () => {
      const response = await request(app)
        .get('/api/advertisements/active')
        .expect(200);
      
      expect(response.body).toHaveLength(2);
      
      // Premier élément doit avoir la priorité la plus élevée
      expect(response.body[0].priority).toBe(8);
      expect(response.body[1].priority).toBe(3);
    });

    it('should populate object and user data', async () => {
      const response = await request(app)
        .get('/api/advertisements/active')
        .expect(200);
      
      expect(response.body[0].object.title).toBeDefined();
      expect(response.body[0].object.category).toBeDefined();
      expect(response.body[0].user.pseudo).toBeDefined();
    });

    it('should limit results to 10', async () => {
      // Créer plus de 10 publicités actives
      const moreAds = [];
      for (let i = 0; i < 12; i++) {
        moreAds.push({
          user: premiumUser._id,
          object: testObject._id,
          duration: 7,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          price: 3.5,
          status: 'active',
          priority: 1
        });
      }
      await Advertisement.create(moreAds);
      
      const response = await request(app)
        .get('/api/advertisements/active')
        .expect(200);
      
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should not require authentication', async () => {
      await request(app)
        .get('/api/advertisements/active')
        .expect(200);
    });
  });

  describe('PUT /api/advertisements/:id/stats', () => {
    let advertisement;

    beforeEach(async () => {
      advertisement = new Advertisement({
        user: premiumUser._id,
        object: testObject._id,
        duration: 7,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        price: 3.5,
        status: 'active',
        impressions: 10,
        clicks: 2
      });
      await advertisement.save();
    });

    it('should increment impressions', async () => {
      await request(app)
        .put(`/api/advertisements/${advertisement._id}/stats`)
        .send({ type: 'impression' })
        .expect(200);
      
      const updatedAd = await Advertisement.findById(advertisement._id);
      expect(updatedAd.impressions).toBe(11);
      expect(updatedAd.clicks).toBe(2);
    });

    it('should increment clicks', async () => {
      await request(app)
        .put(`/api/advertisements/${advertisement._id}/stats`)
        .send({ type: 'click' })
        .expect(200);
      
      const updatedAd = await Advertisement.findById(advertisement._id);
      expect(updatedAd.clicks).toBe(3);
      expect(updatedAd.impressions).toBe(10);
    });

    it('should reject invalid type', async () => {
      await request(app)
        .put(`/api/advertisements/${advertisement._id}/stats`)
        .send({ type: 'invalid' })
        .expect(400);
    });

    it('should return 404 for non-existent advertisement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/advertisements/${fakeId}/stats`)
        .send({ type: 'impression' })
        .expect(404);
    });

    it('should not require authentication', async () => {
      await request(app)
        .put(`/api/advertisements/${advertisement._id}/stats`)
        .send({ type: 'impression' })
        .expect(200);
    });
  });

  describe('DELETE /api/advertisements/:id', () => {
    let advertisement;

    beforeEach(async () => {
      advertisement = new Advertisement({
        user: premiumUser._id,
        object: testObject._id,
        duration: 7,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        price: 3.5,
        status: 'active'
      });
      await advertisement.save();
    });

    it('should delete own advertisement', async () => {
      await request(app)
        .delete(`/api/advertisements/${advertisement._id}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(200);
      
      const deletedAd = await Advertisement.findById(advertisement._id);
      expect(deletedAd).toBeNull();
    });

    it('should not delete other user advertisement', async () => {
      await request(app)
        .delete(`/api/advertisements/${advertisement._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      const stillExists = await Advertisement.findById(advertisement._id);
      expect(stillExists).toBeTruthy();
    });

    it('should return 404 for non-existent advertisement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/advertisements/${fakeId}`)
        .set('Authorization', `Bearer ${premiumToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/advertisements/${advertisement._id}`)
        .expect(401);
    });
  });
});
