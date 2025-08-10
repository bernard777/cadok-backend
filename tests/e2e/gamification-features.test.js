/**
 * 🎮 Tests E2E - Nouvelles Fonctionnalités Gamification
 * Tests complets pour le système de gamification, badges, défis et événements
 */

const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('../../app');

// Configuration Jest
jest.setTimeout(30000);

describe('🎮 Nouvelles Fonctionnalités Gamification - Tests E2E', () => {
  let mongoClient;
  let db;
  let userToken;
  let adminToken;
  let testUser;
  let testAdmin;

  // Setup global
  beforeAll(async () => {
    try {
      console.log('🚀 Initialisation tests gamification...');
      
      // Connexion MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test';
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      const dbName = mongoUri.split('/').pop().split('?')[0];
      db = mongoClient.db(dbName);
      
      // Nettoyage initial
      await db.collection('users').deleteMany({});
      await db.collection('events').deleteMany({});
      await db.collection('challenges').deleteMany({});
      await db.collection('userbadges').deleteMany({});
      await db.collection('objects').deleteMany({});
      
      // Création des utilisateurs de test
      await createTestUsers();
      
      console.log('✅ Setup gamification terminé');
    } catch (error) {
      console.error('❌ Erreur setup:', error);
      throw error;
    }
  });

  // Nettoyage final
  afterAll(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  /**
   * 🏗️ Création des utilisateurs de test
   */
  async function createTestUsers() {
    // Utilisateur normal
    const userSignupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        pseudo: 'GamerTest',
        email: 'gamer@cadok.fr',
        password: 'GamerSecure123!'
      });
    
    expect(userSignupResponse.status).toBe(201);
    
    const userLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'gamer@cadok.fr',
        password: 'GamerSecure123!'
      });
    
    expect(userLoginResponse.status).toBe(200);
    userToken = userLoginResponse.body.token;
    testUser = userLoginResponse.body.user;
    
    // Admin pour créer des événements
    const adminSignupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        pseudo: 'AdminGamer',
        email: 'admingamer@cadok.fr',
        password: 'AdminGamerSecure123!'
      });
    
    expect(adminSignupResponse.status).toBe(201);
    
    const adminLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'admingamer@cadok.fr',
        password: 'AdminGamerSecure123!'
      });
    
    expect(adminLoginResponse.status).toBe(200);
    adminToken = adminLoginResponse.body.token;
    testAdmin = adminLoginResponse.body.user;
    
    // Promouvoir en admin
    await db.collection('users').updateOne(
      { _id: require('mongodb').ObjectId(testAdmin._id) },
      {
        $set: {
          role: 'admin',
          isAdmin: true,
          adminPermissions: {
            users: true,
            events: true,
            analytics: true,
            system: false
          }
        }
      }
    );
  }

  // =============================================================================
  // 🏆 TESTS SYSTÈME DE BADGES
  // =============================================================================

  describe('🏆 Système de Badges', () => {
    
    test('Récupération des badges disponibles', async () => {
      const response = await request(app)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.badges).toBeInstanceOf(Array);
      expect(response.body.badges.length).toBeGreaterThan(0);
      
      // Vérifier la structure d'un badge
      const badge = response.body.badges[0];
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('name');
      expect(badge).toHaveProperty('description');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('criteria');
    });
    
    test('Badges de démarrage attribués automatiquement', async () => {
      const response = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.badges).toBeInstanceOf(Array);
      
      // L'utilisateur devrait avoir au moins le badge "Bienvenue"
      const welcomeBadge = response.body.badges.find(b => b.badge.id === 'welcome');
      expect(welcomeBadge).toBeDefined();
      expect(welcomeBadge.earnedAt).toBeDefined();
    });
    
    test('Badge obtenu après création d\'objet', async () => {
      // Créer un objet pour déclencher le badge "Premier objet"
      const objectResponse = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Objet Test Gamification',
          description: 'Objet créé pour tester les badges',
          category: 'Électronique',
          condition: 'Bon état',
          estimatedValue: 25,
          images: []
        });
      
      expect(objectResponse.status).toBe(201);
      
      // Vérifier que le badge "Premier objet" a été attribué
      const badgesResponse = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(badgesResponse.status).toBe(200);
      const firstObjectBadge = badgesResponse.body.badges.find(b => b.badge.id === 'first_object');
      expect(firstObjectBadge).toBeDefined();
    });
    
    test('Progression des badges avec conditions multiples', async () => {
      // Créer plusieurs objets pour tester la progression
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/objects')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: `Objet Test ${i}`,
            description: `Description objet ${i}`,
            category: 'Divers',
            condition: 'Bon état',
            estimatedValue: 10 + i,
            images: []
          });
      }
      
      // Vérifier les badges obtenus
      const badgesResponse = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(badgesResponse.status).toBe(200);
      
      // L'utilisateur devrait avoir le badge "Collectionneur" (5+ objets)
      const collectorBadge = badgesResponse.body.badges.find(b => b.badge.id === 'collector');
      expect(collectorBadge).toBeDefined();
    });
  });

  // =============================================================================
  // ⚡ TESTS SYSTÈME DE DÉFIS
  // =============================================================================

  describe('⚡ Système de Défis', () => {
    
    test('Récupération des défis actifs', async () => {
      const response = await request(app)
        .get('/api/gamification/challenges/active')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.challenges).toBeInstanceOf(Array);
      
      // Il devrait y avoir au moins les défis par défaut
      expect(response.body.challenges.length).toBeGreaterThan(0);
      
      // Vérifier la structure d'un défi
      const challenge = response.body.challenges[0];
      expect(challenge).toHaveProperty('id');
      expect(challenge).toHaveProperty('title');
      expect(challenge).toHaveProperty('description');
      expect(challenge).toHaveProperty('type');
      expect(challenge).toHaveProperty('target');
      expect(challenge).toHaveProperty('reward');
    });
    
    test('Progression des défis trackée', async () => {
      // Récupérer un défi actif
      const challengesResponse = await request(app)
        .get('/api/gamification/challenges/active')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(challengesResponse.status).toBe(200);
      const challenges = challengesResponse.body.challenges;
      
      // Trouver un défi de création d'objets
      const objectChallenge = challenges.find(c => c.type === 'create_objects');
      
      if (objectChallenge) {
        // Créer un objet pour faire progresser le défi
        await request(app)
          .post('/api/objects')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Objet Challenge Test',
            description: 'Objet pour tester progression challenge',
            category: 'Test',
            condition: 'Excellent',
            estimatedValue: 15,
            images: []
          });
        
        // Vérifier la progression
        const progressResponse = await request(app)
          .get('/api/gamification/challenges/progress')
          .set('Authorization', `Bearer ${userToken}`);
        
        expect(progressResponse.status).toBe(200);
        expect(progressResponse.body.success).toBe(true);
        
        const challengeProgress = progressResponse.body.progress.find(
          p => p.challengeId === objectChallenge.id
        );
        
        if (challengeProgress) {
          expect(challengeProgress.currentValue).toBeGreaterThan(0);
        }
      }
    });
  });

  // =============================================================================
  // 🎪 TESTS SYSTÈME D'ÉVÉNEMENTS
  // =============================================================================

  describe('🎪 Système d\'Événements', () => {
    let createdEventId;
    
    test('Admin peut créer un événement avec défis spécifiques', async () => {
      const eventData = {
        name: 'Semaine Écologique Test',
        description: 'Événement de test pour les fonctionnalités E2E',
        startDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Dans 1 heure
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
        theme: 'ecology',
        bonusMultiplier: 1.5,
        challenges: [
          {
            id: 'eco_exchange_5',
            title: 'Échanges Verts',
            description: 'Échanger 5 objets écologiques',
            type: 'eco_exchanges',
            target: 5,
            reward: { points: 150, badge: 'eco_warrior' }
          },
          {
            id: 'plant_collection_3',
            title: 'Collection Verte',
            description: 'Ajouter 3 plantes à sa collection',
            type: 'add_plants',
            target: 3,
            reward: { points: 100 }
          }
        ]
      };
      
      const response = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.event.name).toBe(eventData.name);
      expect(response.body.event.challenges.length).toBe(2);
      
      createdEventId = response.body.event._id;
    });
    
    test('Utilisateurs peuvent voir les événements actifs', async () => {
      const response = await request(app)
        .get('/api/gamification/events/active')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeInstanceOf(Array);
      
      // L'événement créé devrait être visible
      const testEvent = response.body.events.find(e => e._id === createdEventId);
      if (testEvent) {
        expect(testEvent.name).toBe('Semaine Écologique Test');
        expect(testEvent.challenges.length).toBe(2);
      }
    });
    
    test('Défis d\'événement sont accessibles', async () => {
      if (!createdEventId) {
        console.log('⚠️ Pas d\'événement créé, skip du test');
        return;
      }
      
      const response = await request(app)
        .get(`/api/gamification/events/${createdEventId}/challenges`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.challenges).toBeInstanceOf(Array);
      expect(response.body.challenges.length).toBe(2);
      
      // Vérifier les défis spécifiques
      const ecoChallenge = response.body.challenges.find(c => c.id === 'eco_exchange_5');
      expect(ecoChallenge).toBeDefined();
      expect(ecoChallenge.reward.points).toBe(150);
    });
    
    test('Bonus de points appliqué pendant événement', async () => {
      // Créer un objet pendant l'événement pour tester le bonus
      const objectResponse = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Objet Événement Test',
          description: 'Objet créé pendant événement pour tester bonus',
          category: 'Écologique',
          condition: 'Excellent',
          estimatedValue: 20,
          images: [],
          isEcoFriendly: true
        });
      
      expect(objectResponse.status).toBe(201);
      
      // Vérifier les points de l'utilisateur
      const statsResponse = await request(app)
        .get('/api/gamification/user-stats')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.stats.totalPoints).toBeGreaterThan(0);
    });
    
    test('Événement peut être activé/désactivé par admin', async () => {
      if (!createdEventId) {
        console.log('⚠️ Pas d\'événement créé, skip du test');
        return;
      }
      
      // Désactiver l'événement
      const deactivateResponse = await request(app)
        .post(`/api/admin/events/${createdEventId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false });
      
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body.success).toBe(true);
      
      // Vérifier qu'il n'apparaît plus dans les événements actifs
      const activeEventsResponse = await request(app)
        .get('/api/gamification/events/active')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(activeEventsResponse.status).toBe(200);
      const activeEvent = activeEventsResponse.body.events.find(e => e._id === createdEventId);
      expect(activeEvent).toBeUndefined();
      
      // Réactiver
      const reactivateResponse = await request(app)
        .post(`/api/admin/events/${createdEventId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: true });
      
      expect(reactivateResponse.status).toBe(200);
    });
  });

  // =============================================================================
  // 📊 TESTS ANALYTICS ET STATISTIQUES
  // =============================================================================

  describe('📊 Analytics et Statistiques', () => {
    
    test('Statistiques utilisateur complètes', async () => {
      const response = await request(app)
        .get('/api/gamification/user-stats')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const stats = response.body.stats;
      expect(stats).toHaveProperty('totalPoints');
      expect(stats).toHaveProperty('badgesCount');
      expect(stats).toHaveProperty('challengesCompleted');
      expect(stats).toHaveProperty('level');
      expect(stats).toHaveProperty('nextLevelPoints');
      expect(stats).toHaveProperty('objectsCreated');
      expect(stats).toHaveProperty('tradesCompleted');
    });
    
    test('Classement utilisateurs disponible', async () => {
      const response = await request(app)
        .get('/api/gamification/leaderboard')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.leaderboard).toBeInstanceOf(Array);
      
      if (response.body.leaderboard.length > 0) {
        const firstUser = response.body.leaderboard[0];
        expect(firstUser).toHaveProperty('pseudo');
        expect(firstUser).toHaveProperty('totalPoints');
        expect(firstUser).toHaveProperty('level');
        expect(firstUser).toHaveProperty('rank');
      }
    });
    
    test('Admin peut accéder aux analytics détaillées', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const analytics = response.body.analytics;
      expect(analytics).toHaveProperty('totalUsers');
      expect(analytics).toHaveProperty('totalEvents');
      expect(analytics).toHaveProperty('badgesDistribution');
      expect(analytics).toHaveProperty('challengesCompletion');
      expect(analytics).toHaveProperty('engagementMetrics');
    });
  });

  // =============================================================================
  // 🔄 TESTS D'INTÉGRATION MOBILE
  // =============================================================================

  describe('🔄 Intégration Mobile', () => {
    
    test('Données formatées pour interface mobile', async () => {
      const response = await request(app)
        .get('/api/gamification/mobile-dashboard')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const dashboard = response.body.dashboard;
      expect(dashboard).toHaveProperty('userStats');
      expect(dashboard).toHaveProperty('recentBadges');
      expect(dashboard).toHaveProperty('activeChallenges');
      expect(dashboard).toHaveProperty('activeEvents');
      expect(dashboard).toHaveProperty('leaderboardPosition');
      
      // Format adapté pour React Native
      expect(dashboard.userStats.level).toBeGreaterThan(0);
      expect(dashboard.recentBadges).toBeInstanceOf(Array);
      expect(dashboard.activeChallenges).toBeInstanceOf(Array);
    });
    
    test('Configuration des notifications gamification', async () => {
      const response = await request(app)
        .get('/api/gamification/notifications/config')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const config = response.body.config;
      expect(config).toHaveProperty('badgeEarned');
      expect(config).toHaveProperty('challengeCompleted');
      expect(config).toHaveProperty('eventStarted');
      expect(config).toHaveProperty('levelUp');
    });
  });

  // =============================================================================
  // 🏁 TESTS DE PERFORMANCE ET STRESS
  // =============================================================================

  describe('🏁 Performance et Stress', () => {
    
    test('Calcul rapide des badges pour utilisateur actif', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Moins de 2 secondes
      
      console.log(`⚡ Temps de calcul badges: ${responseTime}ms`);
    });
    
    test('Gestion de multiples créations d\'objets simultanées', async () => {
      const promises = [];
      
      for (let i = 1; i <= 5; i++) {
        const promise = request(app)
          .post('/api/objects')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: `Objet Stress ${i}`,
            description: `Test de stress ${i}`,
            category: 'Test',
            condition: 'Bon état',
            estimatedValue: 10,
            images: []
          });
        
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      
      // Tous les objets doivent être créés avec succès
      results.forEach(result => {
        expect(result.status).toBe(201);
      });
      
      // Vérifier que les badges ont été correctement attribués
      const badgesResponse = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(badgesResponse.status).toBe(200);
      expect(badgesResponse.body.badges.length).toBeGreaterThan(0);
    });
  });

  // =============================================================================
  // ✅ VALIDATION FINALE DU SYSTÈME
  // =============================================================================

  describe('✅ Validation Système Complet', () => {
    
    test('Cohérence des données gamification', async () => {
      // Vérifier que toutes les collections gamification sont cohérentes
      const usersCount = await db.collection('users').countDocuments();
      const eventsCount = await db.collection('events').countDocuments();
      const objectsCount = await db.collection('objects').countDocuments();
      
      expect(usersCount).toBeGreaterThanOrEqual(2);
      expect(objectsCount).toBeGreaterThan(0);
      
      console.log(`✅ Données validées: ${usersCount} users, ${eventsCount} events, ${objectsCount} objects`);
    });
    
    test('Tous les services gamification répondent', async () => {
      const endpoints = [
        '/api/gamification/badges',
        '/api/gamification/challenges/active',
        '/api/gamification/user-stats',
        '/api/gamification/leaderboard'
      ];
      
      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
      
      console.log('✅ Tous les endpoints gamification fonctionnels');
    });
    
    test('Système prêt pour production', async () => {
      // Test final de santé du système
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      
      // Vérifier que l'utilisateur test a bien progressé
      const finalStats = await request(app)
        .get('/api/gamification/user-stats')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(finalStats.status).toBe(200);
      expect(finalStats.body.stats.totalPoints).toBeGreaterThan(0);
      expect(finalStats.body.stats.level).toBeGreaterThan(0);
      expect(finalStats.body.stats.badgesCount).toBeGreaterThan(0);
      
      console.log('🎉 Système gamification complet et opérationnel !');
    });
  });
});
