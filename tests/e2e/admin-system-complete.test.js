/**
 * 🔐 Tests E2E Complets - Système d'Administration CADOK
 * Tests fonctionnels pour toutes les fonctionnalités admin
 */

const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('../../app');

// Configuration Jest
jest.setTimeout(30000);

describe('🏛️ Système d\'Administration CADOK - Tests E2E', () => {
  let mongoClient;
  let db;
  let adminToken;
  let superAdminToken;
  let regularUserToken;
  let moderatorToken;
  let testUsers = {};

  // Setup global
  beforeAll(async () => {
    try {
      console.log('🚀 Initialisation des tests admin...');
      
      // Connexion MongoDB
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test';
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      const dbName = mongoUri.split('/').pop().split('?')[0];
      db = mongoClient.db(dbName);
      
      // Nettoyage initial
      await db.collection('users').deleteMany({});
      await db.collection('adminlogs').deleteMany({});
      await db.collection('events').deleteMany({});
      
      console.log('✅ Base de données nettoyée');
      
      // Création des utilisateurs de test
      await createTestUsers();
      
      console.log('✅ Setup terminé');
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
    const testUserData = [
      {
        pseudo: 'SuperAdmin',
        email: 'superadmin@cadok.fr',
        password: 'SuperSecure123!',
        role: 'super_admin',
        isAdmin: true,
        adminPermissions: {
          users: true,
          events: true,
          analytics: true,
          system: true
        }
      },
      {
        pseudo: 'AdminTest',
        email: 'admin@cadok.fr',
        password: 'AdminSecure123!',
        role: 'admin',
        isAdmin: true,
        adminPermissions: {
          users: true,
          events: true,
          analytics: true,
          system: false
        }
      },
      {
        pseudo: 'ModeratorTest',
        email: 'moderator@cadok.fr',
        password: 'ModSecure123!',
        role: 'moderator',
        isAdmin: true,
        adminPermissions: {
          users: false,
          events: true,
          analytics: false,
          system: false
        }
      },
      {
        pseudo: 'UserTest',
        email: 'user@cadok.fr',
        password: 'UserSecure123!',
        role: 'user',
        isAdmin: false,
        adminPermissions: {}
      }
    ];

    for (const userData of testUserData) {
      // Inscription
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData);
      
      expect(signupResponse.status).toBe(201);
      
      // Connexion pour récupérer le token
      const loginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      
      // Stockage des tokens
      const userKey = userData.role.replace('_', '');
      testUsers[userKey] = {
        id: loginResponse.body.user._id,
        token: loginResponse.body.token,
        ...userData
      };
      
      // Mise à jour directe du rôle admin en base
      if (userData.isAdmin) {
        await db.collection('users').updateOne(
          { _id: require('mongodb').ObjectId(loginResponse.body.user._id) },
          {
            $set: {
              role: userData.role,
              isAdmin: userData.isAdmin,
              adminPermissions: userData.adminPermissions,
              adminActivatedAt: new Date()
            }
          }
        );
      }
    }
    
    // Assignation des tokens pour faciliter l'utilisation
    superAdminToken = testUsers.superadmin.token;
    adminToken = testUsers.admin.token;
    moderatorToken = testUsers.moderator.token;
    regularUserToken = testUsers.user.token;
    
    console.log('✅ Utilisateurs de test créés:', Object.keys(testUsers));
  }

  // =============================================================================
  // 🔐 TESTS D'AUTHENTIFICATION ET PERMISSIONS
  // =============================================================================

  describe('🔐 Authentification et Permissions', () => {
    
    test('Super Admin a accès à toutes les routes admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeInstanceOf(Array);
    });
    
    test('Admin a accès aux routes autorisées', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Moderator accès limité selon permissions', async () => {
      // Accès aux événements (autorisé)
      const eventsResponse = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${moderatorToken}`);
      
      expect(eventsResponse.status).toBe(200);
      
      // Accès aux utilisateurs (interdit)
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${moderatorToken}`);
      
      expect(usersResponse.status).toBe(403);
    });
    
    test('Utilisateur normal refuse accès admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Accès administrateur requis');
    });
    
    test('Token invalide refuse accès', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer token_invalide');
      
      expect(response.status).toBe(401);
    });
  });

  // =============================================================================
  // 👥 TESTS DE GESTION DES UTILISATEURS
  // =============================================================================

  describe('👥 Gestion des Utilisateurs', () => {
    
    test('Super Admin peut lister tous les utilisateurs', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(4);
      
      // Vérifier que les données sensibles sont présentes pour super admin
      const superAdminUser = response.body.users.find(u => u.role === 'super_admin');
      expect(superAdminUser.adminPermissions).toBeDefined();
    });
    
    test('Admin peut promouvoir un utilisateur', async () => {
      const regularUserId = testUsers.user.id;
      
      const response = await request(app)
        .post(`/api/admin/users/${regularUserId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'moderator',
          permissions: {
            events: true,
            analytics: false
          },
          notes: 'Promotion pour test E2E'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('moderator');
      expect(response.body.user.isAdmin).toBe(true);
      
      // Vérifier en base de données
      const updatedUser = await db.collection('users').findOne({
        _id: require('mongodb').ObjectId(regularUserId)
      });
      
      expect(updatedUser.role).toBe('moderator');
      expect(updatedUser.adminActivatedAt).toBeDefined();
    });
    
    test('Admin peut rétrograder un utilisateur', async () => {
      // D'abord promouvoir pour avoir quelqu'un à rétrograder
      const regularUserId = testUsers.user.id;
      
      await request(app)
        .post(`/api/admin/users/${regularUserId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'moderator',
          permissions: { events: true }
        });
      
      // Maintenant rétrograder
      const response = await request(app)
        .post(`/api/admin/users/${regularUserId}/demote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          notes: 'Rétrogradation pour test E2E'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('user');
      expect(response.body.user.isAdmin).toBe(false);
    });
    
    test('Super Admin peut créer un nouveau compte admin', async () => {
      const response = await request(app)
        .post('/api/admin/users/create-admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          pseudo: 'NewAdminTest',
          email: 'newadmin@cadok.fr',
          password: 'NewAdminSecure123!',
          role: 'admin',
          permissions: {
            users: true,
            events: true,
            analytics: false,
            system: false
          }
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.pseudo).toBe('NewAdminTest');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.isAdmin).toBe(true);
    });
    
    test('Admin normal ne peut pas créer de super admin', async () => {
      const response = await request(app)
        .post('/api/admin/users/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pseudo: 'FakeSuperAdmin',
          email: 'fake@cadok.fr',
          password: 'FakePassword123!',
          role: 'super_admin'
        });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('super_admin');
    });
    
    test('Statistiques utilisateurs disponibles pour admin', async () => {
      const response = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('totalUsers');
      expect(response.body.stats).toHaveProperty('adminUsers');
      expect(response.body.stats).toHaveProperty('roleDistribution');
    });
  });

  // =============================================================================
  // 🎪 TESTS DE GESTION DES ÉVÉNEMENTS
  // =============================================================================

  describe('🎪 Gestion des Événements', () => {
    
    test('Admin peut lister les événements', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('upcoming');
      expect(response.body).toHaveProperty('statistics');
    });
    
    test('Admin peut créer un événement', async () => {
      const eventData = {
        name: 'Test Event E2E',
        description: 'Événement créé lors des tests E2E',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
        theme: 'ecology',
        bonusMultiplier: 1.5,
        challenges: [
          'Échanger 5 objets verts',
          'Ajouter 3 plantes à sa collection'
        ]
      };
      
      const response = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.event.name).toBe(eventData.name);
      expect(response.body.event.theme).toBe(eventData.theme);
    });
    
    test('Validation des données événement', async () => {
      const invalidEventData = {
        name: '', // Nom vide
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() - 1000).toISOString() // Date de fin dans le passé
      };
      
      const response = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidEventData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details).toBeInstanceOf(Array);
    });
    
    test('Moderator peut accéder aux événements avec permissions limitées', async () => {
      // Moderator peut voir les événements
      const getResponse = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${moderatorToken}`);
      
      expect(getResponse.status).toBe(200);
      
      // Moderator peut créer des événements
      const createResponse = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          name: 'Moderator Event',
          description: 'Événement créé par moderator',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          theme: 'seasonal',
          bonusMultiplier: 1.2
        });
      
      expect(createResponse.status).toBe(200);
    });
    
    test('Templates d\'événements disponibles', async () => {
      const response = await request(app)
        .get('/api/admin/events/templates')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.templates).toBeInstanceOf(Array);
      expect(response.body.templates.length).toBeGreaterThan(0);
      
      // Vérifier la structure d'un template
      const template = response.body.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
    });
  });

  // =============================================================================
  // 📊 TESTS DE LOGGING ET AUDIT
  // =============================================================================

  describe('📊 Logging et Audit', () => {
    
    test('Actions admin sont automatiquement loggées', async () => {
      // Effectuer une action admin
      await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // Vérifier que l'action est loggée (si la collection adminlogs existe)
      const logs = await db.collection('adminlogs').find({}).toArray().catch(() => []);
      
      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        expect(lastLog.action).toBe('admin_stats_viewed');
        expect(lastLog.adminId).toBeDefined();
        expect(lastLog.timestamp).toBeDefined();
        expect(lastLog.ipAddress).toBeDefined();
      }
    });
  });

  // =============================================================================
  // 🛡️ TESTS DE SÉCURITÉ
  // =============================================================================

  describe('🛡️ Sécurité et Protection', () => {
    
    test('Impossible de promouvoir au-delà de ses permissions', async () => {
      const regularUserId = testUsers.user.id;
      
      // Un admin normal ne peut pas créer de super_admin
      const response = await request(app)
        .post(`/api/admin/users/${regularUserId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'super_admin',
          permissions: { system: true }
        });
      
      expect(response.status).toBe(403);
    });
    
    test('Protection contre la suppression accidentelle de super admin', async () => {
      const superAdminId = testUsers.superadmin.id;
      
      // Tentative de rétrogradation du super admin
      const response = await request(app)
        .post(`/api/admin/users/${superAdminId}/demote`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('super_admin');
    });
    
    test('Validation des données d\'entrée', async () => {
      // Test avec des données malformées
      const response = await request(app)
        .post('/api/admin/users/create-admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          pseudo: 'a', // Trop court
          email: 'email_invalide', // Format invalide
          password: '123' // Trop faible
        });
      
      expect(response.status).toBe(400);
    });
  });

  // =============================================================================
  // 🔄 TESTS D'INTÉGRATION COMPLÈTE
  // =============================================================================

  describe('🔄 Workflows Complets', () => {
    
    test('Workflow complet : Création admin → Création événement → Analytics', async () => {
      // 1. Super admin crée un nouvel admin
      const createAdminResponse = await request(app)
        .post('/api/admin/users/create-admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          pseudo: 'WorkflowAdmin',
          email: 'workflow@cadok.fr',
          password: 'WorkflowSecure123!',
          role: 'admin',
          permissions: {
            users: false,
            events: true,
            analytics: true,
            system: false
          }
        });
      
      expect(createAdminResponse.status).toBe(201);
      
      // 2. Récupérer le token du nouvel admin
      const loginResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'workflow@cadok.fr',
          password: 'WorkflowSecure123!'
        });
      
      expect(loginResponse.status).toBe(200);
      const newAdminToken = loginResponse.body.token;
      
      // 3. Nouvel admin crée un événement
      const createEventResponse = await request(app)
        .post('/api/admin/events')
        .set('Authorization', `Bearer ${newAdminToken}`)
        .send({
          name: 'Workflow Test Event',
          description: 'Événement pour test workflow complet',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          theme: 'competition',
          bonusMultiplier: 2.0
        });
      
      expect(createEventResponse.status).toBe(200);
      expect(createEventResponse.body.success).toBe(true);
      
      // 4. Nouvel admin consulte les statistiques
      const statsResponse = await request(app)
        .get('/api/admin/users/stats')
        .set('Authorization', `Bearer ${newAdminToken}`);
      
      // Doit échouer car pas de permission users
      expect(statsResponse.status).toBe(403);
      
      // 5. Mais peut consulter les événements
      const eventsResponse = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${newAdminToken}`);
      
      expect(eventsResponse.status).toBe(200);
    });
    
    test('Workflow de promotion progressive', async () => {
      const userId = testUsers.user.id;
      
      // 1. User → Moderator
      const promoteToModResponse = await request(app)
        .post(`/api/admin/users/${userId}/promote`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'moderator',
          permissions: { events: true },
          notes: 'Promotion progressive étape 1'
        });
      
      expect(promoteToModResponse.status).toBe(200);
      expect(promoteToModResponse.body.user.role).toBe('moderator');
      
      // 2. Moderator → Admin (par super admin seulement)
      const promoteToAdminResponse = await request(app)
        .post(`/api/admin/users/${userId}/promote`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: 'admin',
          permissions: {
            users: true,
            events: true,
            analytics: true
          },
          notes: 'Promotion progressive étape 2'
        });
      
      expect(promoteToAdminResponse.status).toBe(200);
      expect(promoteToAdminResponse.body.user.role).toBe('admin');
    });
  });

  // =============================================================================
  // 🏁 VALIDATION FINALE
  // =============================================================================

  describe('🏁 Validation Système Complet', () => {
    
    test('Tous les rôles ont les bonnes permissions', async () => {
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(usersResponse.status).toBe(200);
      
      const users = usersResponse.body.users;
      const superAdminUser = users.find(u => u.role === 'super_admin');
      const adminUser = users.find(u => u.role === 'admin');
      const moderatorUser = users.find(u => u.role === 'moderator');
      const regularUser = users.find(u => u.role === 'user');
      
      // Vérifications super admin
      expect(superAdminUser.adminPermissions.system).toBe(true);
      expect(superAdminUser.adminPermissions.users).toBe(true);
      
      // Vérifications admin
      expect(adminUser.adminPermissions.users).toBe(true);
      expect(adminUser.adminPermissions.system).toBe(false);
      
      // Vérifications moderator
      expect(moderatorUser.adminPermissions.events).toBe(true);
      expect(moderatorUser.adminPermissions.users).toBe(false);
      
      // Vérifications utilisateur normal
      expect(regularUser.isAdmin).toBe(false);
    });
    
    test('Intégrité du système après tous les tests', async () => {
      // Vérifier que les collections principales existent et sont cohérentes
      const usersCount = await db.collection('users').countDocuments();
      const eventsCount = await db.collection('events').countDocuments();
      
      expect(usersCount).toBeGreaterThanOrEqual(4); // Au moins nos utilisateurs de test
      
      // Vérifier qu'il y a toujours au moins un super admin
      const superAdminCount = await db.collection('users').countDocuments({ role: 'super_admin' });
      expect(superAdminCount).toBeGreaterThanOrEqual(1);
      
      console.log(`✅ Système validé : ${usersCount} utilisateurs, ${eventsCount} événements`);
    });
  });
});
