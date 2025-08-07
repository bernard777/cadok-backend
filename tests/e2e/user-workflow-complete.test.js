/**
 * VRAI TEST  beforeEach(() => {
    // Générer des données vraiment uniques pour chaque test
    const timestamp = Date.now() + Math.random();
    testUserData = {
      pseudo: 'E2EUser' + timestamp,
      email: `e2e${timestamp}@cadok.com`,
      password: 'SecurePassword123!',
      city: 'Paris'
    };
    
    // Reset des variables
    authToken = null;
    createdUserId = null;
    createdObjectId = null;
  });flow complet utilisateur
 * De l'inscription à la création d'objet avec VRAIE base de données
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Object = require('../../models/Object');

describe('🚀 WORKFLOW E2E COMPLET - Inscription → Connexion → Création Objet', () => {
  
  let testUserData;
  let authToken;
  let createdUserId;
  let createdObjectId;

  beforeEach(() => {
    // Générer des données vraiment uniques pour chaque test
    const timestamp = Date.now() + Math.random();
    testUserData = {
      pseudo: 'E2EUser' + timestamp,
      email: `e2e${timestamp}@cadok.com`,
      password: 'SecurePassword123!',
      city: 'Paris'
    };
    
    // Reset des variables
    authToken = null;
    createdUserId = null;
    createdObjectId = null;
  });

  test('🎯 WORKFLOW COMPLET: Inscription → Connexion → Création objet → Vérification BDD', async () => {
    
    // ===== ÉTAPE 1: INSCRIPTION UTILISATEUR =====
    console.log('📝 ÉTAPE 1: Inscription utilisateur...');
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUserData);
    
    // Debug si erreur
    if (registerResponse.status !== 201) {
      console.error('❌ Erreur inscription:', {
        status: registerResponse.status,
        body: registerResponse.body,
        userData: testUserData
      });
    }
    
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toHaveProperty('token');
    expect(registerResponse.body).toHaveProperty('user');
    expect(registerResponse.body.user.email).toBe(testUserData.email);
    
    createdUserId = registerResponse.body.user._id;
    console.log('✅ Utilisateur inscrit avec ID:', createdUserId);
    
    // Vérifier en base de données réelle
    const userInDB = await User.findById(createdUserId);
    expect(userInDB).toBeTruthy();
    expect(userInDB.email).toBe(testUserData.email);
    expect(userInDB.pseudo).toBe(testUserData.pseudo);
    console.log('✅ Utilisateur vérifié en BDD');

    // ===== ÉTAPE 2: CONNEXION UTILISATEUR =====
    console.log('🔐 ÉTAPE 2: Connexion utilisateur...');
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserData.email,
        password: testUserData.password
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
    expect(loginResponse.body).toHaveProperty('user');
    
    authToken = loginResponse.body.token;
    console.log('✅ Connexion réussie, token reçu');
    
    // Vérifier que le token est valide
    expect(authToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    // ===== ÉTAPE 3: CRÉATION D'UN OBJET =====
    console.log('📦 ÉTAPE 3: Création d\'un objet...');
    
    const objectData = {
      title: 'iPhone 12 E2E Test',
      description: 'iPhone 12 en excellent état pour test E2E complet',
      category: 'Électronique',
      condition: 'Excellent état',
      estimatedValue: 400,
      available: true
    };
    
    const createObjectResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(objectData);
    
    expect(createObjectResponse.status).toBe(201);
    expect(createObjectResponse.body).toHaveProperty('title', objectData.title);
    expect(createObjectResponse.body).toHaveProperty('owner');
    
    createdObjectId = createObjectResponse.body._id;
    console.log('✅ Objet créé avec ID:', createdObjectId);
    
    // Vérifier en base de données réelle
    const objectInDB = await Object.findById(createdObjectId);
    expect(objectInDB).toBeTruthy();
    expect(objectInDB.title).toBe(objectData.title);
    expect(objectInDB.owner.toString()).toBe(createdUserId);
    expect(objectInDB.available).toBe(true);
    console.log('✅ Objet vérifié en BDD');

    // ===== ÉTAPE 4: RÉCUPÉRATION DES OBJETS DE L'UTILISATEUR =====
    console.log('📋 ÉTAPE 4: Récupération des objets utilisateur...');
    
    const getUserObjectsResponse = await request(app)
      .get('/api/objects/me')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(getUserObjectsResponse.status).toBe(200);
    expect(getUserObjectsResponse.body).toHaveProperty('objects');
    expect(getUserObjectsResponse.body.objects).toHaveLength(1);
    expect(getUserObjectsResponse.body.objects[0]._id).toBe(createdObjectId);
    console.log('✅ Objets utilisateur récupérés');

    // ===== ÉTAPE 5: MISE À JOUR DE L'OBJET =====
    console.log('✏️ ÉTAPE 5: Mise à jour de l\'objet...');
    
    const updateData = {
      description: 'Description mise à jour via test E2E',
      estimatedValue: 450
    };
    
    const updateObjectResponse = await request(app)
      .put(`/api/objects/${createdObjectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);
    
    expect(updateObjectResponse.status).toBe(200);
    expect(updateObjectResponse.body).toHaveProperty('success', true);
    expect(updateObjectResponse.body.object.description).toBe(updateData.description);
    expect(updateObjectResponse.body.object.estimatedValue).toBe(updateData.estimatedValue);
    
    // Vérifier en base de données réelle
    const updatedObjectInDB = await Object.findById(createdObjectId);
    expect(updatedObjectInDB.description).toBe(updateData.description);
    expect(updatedObjectInDB.estimatedValue).toBe(updateData.estimatedValue);
    console.log('✅ Objet mis à jour et vérifié en BDD');

    // ===== ÉTAPE 6: RECHERCHE D'OBJETS =====
    console.log('🔍 ÉTAPE 6: Recherche d\'objets...');
    
    const searchResponse = await request(app)
      .get('/api/objects/search?query=iPhone&category=Électronique')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body).toHaveProperty('success', true);
    expect(searchResponse.body).toHaveProperty('objects');
    expect(searchResponse.body.objects.length).toBeGreaterThan(0);
    
    const foundObject = searchResponse.body.objects.find(obj => obj._id === createdObjectId);
    expect(foundObject).toBeTruthy();
    console.log('✅ Objet trouvé via recherche');

    console.log('🎉 WORKFLOW E2E COMPLET RÉUSSI!');
    console.log('📊 Résumé:');
    console.log(`   - Utilisateur inscrit: ${testUserData.email}`);
    console.log(`   - ID utilisateur: ${createdUserId}`);
    console.log(`   - Objet créé: ${objectData.title}`);
    console.log(`   - ID objet: ${createdObjectId}`);
    console.log(`   - Token valide: ${authToken ? 'OUI' : 'NON'}`);
    
  }, 30000); // Timeout de 30 secondes pour le workflow complet

  test('🛡️ WORKFLOW E2E - Gestion des erreurs et sécurité', async () => {
    
    // Test tentative création objet sans token
    console.log('🔒 Test sécurité: Création objet sans authentification...');
    
    const unauthorizedResponse = await request(app)
      .post('/api/objects')
      .send({
        title: 'Objet non autorisé',
        description: 'Test sécurité'
      });
    
    expect(unauthorizedResponse.status).toBe(401);
    console.log('✅ Accès non autorisé correctement rejeté');
    
    // Test avec token invalide
    console.log('🔒 Test sécurité: Token invalide...');
    
    const invalidTokenResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', 'Bearer token_invalide')
      .send({
        title: 'Objet token invalide',
        description: 'Test sécurité'
      });
    
    expect(invalidTokenResponse.status).toBe(401);
    console.log('✅ Token invalide correctement rejeté');
    
    // Test inscription avec email déjà existant
    console.log('📧 Test: Email déjà existant...');
    
    // Créer un premier utilisateur
    await request(app)
      .post('/api/auth/register')
      .send(testUserData);
    
    // Tenter de créer un deuxième avec le même email
    const duplicateEmailResponse = await request(app)
      .post('/api/auth/register')
      .send(testUserData);
    
    expect(duplicateEmailResponse.status).toBe(400);
    expect(duplicateEmailResponse.body).toHaveProperty('message');
    console.log('✅ Email dupliqué correctement rejeté');
    
  }, 20000);

});
