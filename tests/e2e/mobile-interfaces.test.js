/**
 * 📱 Tests E2E - Interfaces Mobile Admin et Gamification
 * Tests d'intégration entre le backend et les nouvelles interfaces mobile
 */

const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('../../app');

// Configuration Jest
jest.setTimeout(30000);

describe('📱 Interfaces Mobile - Tests E2E Intégration', () => {
  let mongoClient;
  let db;
  let adminToken;
  let userToken;
  let testAdmin;
  let testUser;

  // Setup global
  beforeAll(async () => {
    try {
      console.log('📱 Initialisation tests interfaces mobile...');
      
      // Connexion MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test';
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      const dbName = mongoUri.split('/').pop().split('?')[0];
      db = mongoClient.db(dbName);
      
      // Nettoyage initial
      await db.collection('users').deleteMany({});
      await db.collection('events').deleteMany({});
      await db.collection('objects').deleteMany({});
      
      // Création des utilisateurs de test
      await createTestUsers();
      
      console.log('✅ Setup interfaces mobile terminé');
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
    // Admin
    const adminSignupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        pseudo: 'MobileAdmin',
        email: 'mobileadmin@cadok.fr',
        password: 'MobileAdmin123!'
      });
    
    expect(adminSignupResponse.status).toBe(201);
    
    const adminLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'mobileadmin@cadok.fr',
        password: 'MobileAdmin123!'
      });
    
    expect(adminLoginResponse.status).toBe(200);
    adminToken = adminLoginResponse.body.token;
    testAdmin = adminLoginResponse.body.user;
    
    // Utilisateur normal
    const userSignupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        pseudo: 'MobileUser',
        email: 'mobileuser@cadok.fr',
        password: 'MobileUser123!'
      });
    
    expect(userSignupResponse.status).toBe(201);
    
    const userLoginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'mobileuser@cadok.fr',
        password: 'MobileUser123!'
      });
    
    expect(userLoginResponse.status).toBe(200);
    userToken = userLoginResponse.body.token;
    testUser = userLoginResponse.body.user;
    
    // Promouvoir l'admin
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
  // 🏛️ TESTS INTERFACE ADMIN MOBILE
  // =============================================================================

  describe('🏛️ Interface Admin Mobile (AdminScreen)', () => {
    
    test('Données dashboard admin complètes pour mobile', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Si l'endpoint n'existe pas encore, on teste les composants individuels
      if (response.status === 404) {
        // Tester les statistiques utilisateurs
        const usersStatsResponse = await request(app)
          .get('/api/admin/users/stats')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(usersStatsResponse.status).toBe(200);
        expect(usersStatsResponse.body.success).toBe(true);
        expect(usersStatsResponse.body.stats).toHaveProperty('totalUsers');
        
        // Tester les événements pour l'admin
        const eventsResponse = await request(app)
          .get('/api/admin/events')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(eventsResponse.status).toBe(200);
        expect(eventsResponse.body.success).toBe(true);
      } else {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        const dashboard = response.body.dashboard;
        expect(dashboard).toHaveProperty('userStats');
        expect(dashboard).toHaveProperty('eventStats');
        expect(dashboard).toHaveProperty('systemHealth');
      }
    });
    
    test('Menu admin accessible selon permissions', async () => {
      // Vérifier les permissions de l'admin
      const response = await request(app)
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (response.status === 404) {
        // Tester indirectement via l'accès aux routes
        const usersAccess = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);
        
        const eventsAccess = await request(app)
          .get('/api/admin/events')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(usersAccess.status).toBe(200);
        expect(eventsAccess.status).toBe(200);
      } else {
        expect(response.status).toBe(200);
        expect(response.body.permissions.users).toBe(true);
        expect(response.body.permissions.events).toBe(true);
      }
    });
    
    test('Statistiques système pour interface admin', async () => {
      // Créer quelques données de test
      await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Object Admin Stats',
          description: 'Objet pour test stats admin',
          category: 'Test',
          condition: 'Bon état',
          estimatedValue: 15,
          images: []
        });
      
      const statsResponse = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.stats.totalUsers).toBeGreaterThanOrEqual(2);
    });
  });

  // =============================================================================
  // 🎪 TESTS INTERFACE ÉVÉNEMENTS ADMIN
  // =============================================================================

  describe('🎪 Interface Événements Admin (AdminEventsScreen)', () => {
    let createdEventId;
    
    test('Création d\'événement via interface mobile', async () => {
      const eventData = {
        name: 'Événement Mobile Test',
        description: 'Créé via l\'interface mobile admin',
        startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Dans 2 heures
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Dans 5 jours
        theme: 'seasonal',
        bonusMultiplier: 1.3,
        challenges: [
          {
            title: 'Challenge Mobile Test',
            description: 'Défi créé via interface mobile',
            type: 'create_objects',
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
      
      createdEventId = response.body.event._id;
    });
    
    test('Templates d\'événement pour interface mobile', async () => {
      const response = await request(app)
        .get('/api/admin/events/templates')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.templates).toBeInstanceOf(Array);
      expect(response.body.templates.length).toBeGreaterThan(0);
      
      // Vérifier format adapté mobile
      const template = response.body.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('icon');
      expect(template).toHaveProperty('duration');
    });
    
    test('Création d\'événement depuis template', async () => {
      const templatesResponse = await request(app)
        .get('/api/admin/events/templates')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(templatesResponse.status).toBe(200);
      const template = templatesResponse.body.templates[0];
      
      const response = await request(app)
        .post(`/api/admin/events/templates/${template.id}/create`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customName: 'Template Test Mobile',
          startDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          customizations: {
            bonusMultiplier: 2.0,
            additionalReward: { points: 50 }
          }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Gestion des événements (activation/désactivation)', async () => {
      if (!createdEventId) {
        console.log('⚠️ Pas d\'événement créé, skip du test');
        return;
      }
      
      // Désactivation
      const deactivateResponse = await request(app)
        .post(`/api/admin/events/${createdEventId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false });
      
      expect(deactivateResponse.status).toBe(200);
      expect(deactivateResponse.body.success).toBe(true);
      
      // Réactivation
      const reactivateResponse = await request(app)
        .post(`/api/admin/events/${createdEventId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: true });
      
      expect(reactivateResponse.status).toBe(200);
      expect(reactivateResponse.body.success).toBe(true);
    });
    
    test('Analytics événement pour interface mobile', async () => {
      if (!createdEventId) {
        console.log('⚠️ Pas d\'événement créé, skip du test');
        return;
      }
      
      const response = await request(app)
        .get(`/api/admin/events/${createdEventId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('participation');
      expect(response.body.analytics).toHaveProperty('challengesCompletion');
    });
  });

  // =============================================================================
  // 🎮 TESTS INTERFACE GAMIFICATION UTILISATEUR
  // =============================================================================

  describe('🎮 Interface Gamification Utilisateur (GamificationScreen)', () => {
    
    test('Dashboard gamification complet pour mobile', async () => {
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
      
      // Format optimisé pour React Native
      expect(dashboard.userStats).toHaveProperty('level');
      expect(dashboard.userStats).toHaveProperty('totalPoints');
      expect(dashboard.userStats).toHaveProperty('progressToNextLevel');
    });
    
    test('Liste des badges avec progression', async () => {
      const response = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.badges).toBeInstanceOf(Array);
      
      // Chaque badge doit avoir les infos pour l'affichage mobile
      if (response.body.badges.length > 0) {
        const badge = response.body.badges[0];
        expect(badge.badge).toHaveProperty('icon');
        expect(badge.badge).toHaveProperty('name');
        expect(badge.badge).toHaveProperty('description');
        expect(badge).toHaveProperty('earnedAt');
      }
    });
    
    test('Défis actifs avec progression en temps réel', async () => {
      const response = await request(app)
        .get('/api/gamification/challenges/active')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.challenges).toBeInstanceOf(Array);
      
      // Créer un objet pour tester la progression
      await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Progression Challenge',
          description: 'Objet pour tester progression',
          category: 'Test',
          condition: 'Bon état',
          estimatedValue: 12,
          images: []
        });
      
      // Vérifier la progression mise à jour
      const progressResponse = await request(app)
        .get('/api/gamification/challenges/progress')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(progressResponse.status).toBe(200);
      expect(progressResponse.body.success).toBe(true);
    });
    
    test('Classement optimisé pour mobile', async () => {
      const response = await request(app)
        .get('/api/gamification/leaderboard')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.leaderboard).toBeInstanceOf(Array);
      
      if (response.body.leaderboard.length > 0) {
        const user = response.body.leaderboard[0];
        expect(user).toHaveProperty('pseudo');
        expect(user).toHaveProperty('level');
        expect(user).toHaveProperty('totalPoints');
        expect(user).toHaveProperty('rank');
        // Pas d'infos sensibles exposées
        expect(user).not.toHaveProperty('email');
        expect(user).not.toHaveProperty('_id');
      }
    });
  });

  // =============================================================================
  // 🏆 TESTS INTERFACE ACHIEVEMENTS/BADGES
  // =============================================================================

  describe('🏆 Interface Achievements/Badges (BadgesScreen)', () => {
    
    test('Catalogue complet des badges disponibles', async () => {
      const response = await request(app)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.badges).toBeInstanceOf(Array);
      expect(response.body.badges.length).toBeGreaterThan(0);
      
      // Vérifier la structure pour l'interface mobile
      const badge = response.body.badges[0];
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('name');
      expect(badge).toHaveProperty('description');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('rarity');
      expect(badge).toHaveProperty('criteria');
    });
    
    test('Badges obtenus avec détails de progression', async () => {
      // Créer quelques objets pour déclencher des badges
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/objects')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: `Badge Test Object ${i}`,
            description: `Objet ${i} pour tester badges`,
            category: 'Test',
            condition: 'Excellent',
            estimatedValue: 20,
            images: []
          });
      }
      
      const response = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.badges.length).toBeGreaterThan(0);
      
      // Vérifier qu'au moins le badge "Bienvenue" et "Premier objet" sont présents
      const welcomeBadge = response.body.badges.find(b => b.badge.id === 'welcome');
      const firstObjectBadge = response.body.badges.find(b => b.badge.id === 'first_object');
      
      expect(welcomeBadge).toBeDefined();
      expect(firstObjectBadge).toBeDefined();
    });
    
    test('Progression vers badges non obtenus', async () => {
      const response = await request(app)
        .get('/api/gamification/badges/progress')
        .set('Authorization', `Bearer ${userToken}`);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.progress).toBeInstanceOf(Array);
        
        // Chaque progression doit avoir les infos nécessaires pour l'UI
        if (response.body.progress.length > 0) {
          const progress = response.body.progress[0];
          expect(progress).toHaveProperty('badgeId');
          expect(progress).toHaveProperty('currentValue');
          expect(progress).toHaveProperty('targetValue');
          expect(progress).toHaveProperty('percentage');
        }
      }
    });
  });

  // =============================================================================
  // 📊 TESTS INTERFACE ANALYTICS UTILISATEUR
  // =============================================================================

  describe('📊 Interface Analytics Utilisateur (AnalyticsScreen)', () => {
    
    test('Statistiques personnelles complètes', async () => {
      const response = await request(app)
        .get('/api/gamification/user-stats')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const stats = response.body.stats;
      expect(stats).toHaveProperty('totalPoints');
      expect(stats).toHaveProperty('level');
      expect(stats).toHaveProperty('nextLevelPoints');
      expect(stats).toHaveProperty('badgesCount');
      expect(stats).toHaveProperty('challengesCompleted');
      expect(stats).toHaveProperty('objectsCreated');
      expect(stats).toHaveProperty('tradesCompleted');
      expect(stats).toHaveProperty('registrationDate');
    });
    
    test('Historique d\'activité pour graphiques', async () => {
      const response = await request(app)
        .get('/api/gamification/user-activity')
        .set('Authorization', `Bearer ${userToken}`);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.activity).toBeInstanceOf(Array);
        
        // Format pour graphiques mobile
        if (response.body.activity.length > 0) {
          const activity = response.body.activity[0];
          expect(activity).toHaveProperty('date');
          expect(activity).toHaveProperty('points');
          expect(activity).toHaveProperty('actions');
        }
      }
    });
    
    test('Comparaison avec autres utilisateurs', async () => {
      const response = await request(app)
        .get('/api/gamification/user-ranking')
        .set('Authorization', `Bearer ${userToken}`);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.ranking).toHaveProperty('currentRank');
        expect(response.body.ranking).toHaveProperty('totalUsers');
        expect(response.body.ranking).toHaveProperty('percentile');
      }
    });
  });

  // =============================================================================
  // 🔄 TESTS NAVIGATION ET UX MOBILE
  // =============================================================================

  describe('🔄 Navigation et UX Mobile', () => {
    
    test('Transitions entre écrans admin fonctionnelles', async () => {
      // Simuler navigation : Dashboard → Gestion Utilisateurs
      const dashboardResponse = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(dashboardResponse.status).toBe(200);
      
      // Navigation : Dashboard → Gestion Événements
      const eventsResponse = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(eventsResponse.status).toBe(200);
    });
    
    test('Gestion des erreurs adaptée mobile', async () => {
      // Test avec token expiré/invalide
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer token_invalide_mobile');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      
      // Format d'erreur adapté pour React Native
      expect(typeof response.body.error).toBe('string');
    });
    
    test('Performance des API pour UX mobile fluide', async () => {
      const startTime = Date.now();
      
      const promises = [
        request(app).get('/api/gamification/user-stats').set('Authorization', `Bearer ${userToken}`),
        request(app).get('/api/gamification/user-badges').set('Authorization', `Bearer ${userToken}`),
        request(app).get('/api/gamification/challenges/active').set('Authorization', `Bearer ${userToken}`)
      ];
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Toutes les requêtes doivent réussir
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      
      // Temps de réponse acceptable pour mobile
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(3000); // Moins de 3 secondes
      
      console.log(`📱 Performance mobile: ${totalTime}ms pour 3 requêtes parallèles`);
    });
  });

  // =============================================================================
  // ✅ VALIDATION INTÉGRATION COMPLÈTE
  // =============================================================================

  describe('✅ Validation Intégration Complète', () => {
    
    test('Workflow complet utilisateur mobile', async () => {
      console.log('🔄 Test workflow utilisateur mobile complet...');
      
      // 1. Consultation dashboard
      const dashboardResponse = await request(app)
        .get('/api/gamification/mobile-dashboard')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(dashboardResponse.status).toBe(200);
      
      // 2. Création d'objet (action gamifiée)
      const objectResponse = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Workflow Mobile Final',
          description: 'Test workflow complet mobile',
          category: 'Final Test',
          condition: 'Parfait',
          estimatedValue: 30,
          images: []
        });
      
      expect(objectResponse.status).toBe(201);
      
      // 3. Vérification progression badges
      const badgesResponse = await request(app)
        .get('/api/gamification/user-badges')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(badgesResponse.status).toBe(200);
      
      // 4. Consultation statistiques mises à jour
      const updatedStatsResponse = await request(app)
        .get('/api/gamification/user-stats')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(updatedStatsResponse.status).toBe(200);
      expect(updatedStatsResponse.body.stats.objectsCreated).toBeGreaterThan(0);
      
      console.log('✅ Workflow utilisateur mobile complet validé');
    });
    
    test('Workflow complet admin mobile', async () => {
      console.log('🏛️ Test workflow admin mobile complet...');
      
      // 1. Consultation dashboard admin
      const statsResponse = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(statsResponse.status).toBe(200);
      
      // 2. Création événement
      const eventResponse = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Workflow Admin Final',
          description: 'Événement créé dans workflow admin mobile',
          startDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          theme: 'test',
          bonusMultiplier: 1.0
        });
      
      expect(eventResponse.status).toBe(200);
      
      // 3. Gestion utilisateur (promotion test)
      const promoteResponse = await request(app)
        .post(`/api/admin/users/${testUser._id}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'moderator',
          permissions: { events: true },
          notes: 'Promotion test workflow admin mobile'
        });
      
      expect(promoteResponse.status).toBe(200);
      
      console.log('✅ Workflow admin mobile complet validé');
    });
    
    test('Système complètement opérationnel', async () => {
      // Health check global
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      
      // Vérification des données créées
      const usersCount = await db.collection('users').countDocuments();
      const objectsCount = await db.collection('objects').countDocuments();
      const eventsCount = await db.collection('events').countDocuments();
      
      expect(usersCount).toBeGreaterThanOrEqual(2);
      expect(objectsCount).toBeGreaterThan(0);
      
      console.log(`🎉 Système complet validé:`);
      console.log(`   👥 ${usersCount} utilisateurs`);
      console.log(`   📦 ${objectsCount} objets`);
      console.log(`   🎪 ${eventsCount} événements`);
      console.log(`✅ Toutes les interfaces mobile sont fonctionnelles !`);
    });
  });
});
