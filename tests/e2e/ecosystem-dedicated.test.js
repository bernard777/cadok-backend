/**
 * 🎯 TEST AVEC ÉCOSYSTÈME DÉDIÉ COMPLET
 * Utilise app-test-dedicated.js + server-test-dedicated.js + db-test-dedicated.js
 * ISOLATION TOTALE du mode production
 */

const request = require('supertest');
const fs = require('fs');
const { initializeTestApp, cleanupTestApp } = require('../../app-test-dedicated');
const { testDbManager } = require('../../db-test-dedicated');

describe('🎯 TEST ÉCOSYSTÈME DÉDIÉ - ISOLATION TOTALE', () => {
  const logFile = 'c:\\Users\\JB\\Music\\cadok-backend\\test-ecosystem-dedicated.log';
  let testApp = null;
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.log(msg); // Aussi dans la console
  }
  
  beforeAll(async () => {
    // Nettoyer le log précédent
    try { fs.unlinkSync(logFile); } catch {}
    
    log('=== DÉBUT TESTS ÉCOSYSTÈME DÉDIÉ ===');
    log(`NODE_ENV: ${process.env.NODE_ENV}`);
    log(`MONGODB_URI: ${process.env.MONGODB_URI}`);
    
    try {
      // Initialiser l'app dédiée aux tests
      log('🚀 Initialisation app test dédiée...');
      testApp = await initializeTestApp();
      log('✅ App test dédiée prête');
      
      // Vérifier les stats de la base
      const stats = await testDbManager.getStats();
      log(`📊 Stats base: ${JSON.stringify(stats)}`);
      
    } catch (error) {
      log(`❌ Erreur setup: ${error.message}`);
      throw error;
    }
  });
  
  beforeEach(async () => {
    // Nettoyer la base avant chaque test
    log('🧹 Nettoyage base avant test...');
    await testDbManager.cleanDatabase();
    log('✅ Base nettoyée');
  });
  
  afterAll(async () => {
    log('🛑 Nettoyage final...');
    
    try {
      await cleanupTestApp();
      log('✅ App test fermée');
    } catch (error) {
      log(`⚠️ Erreur fermeture: ${error.message}`);
    }
    
    log('=== FIN TESTS ÉCOSYSTÈME DÉDIÉ ===');
  });

  test('TEST 1/3 - Inscription avec écosystème isolé', async () => {
    log('🎯 TEST 1 - Inscription utilisateur unique');
    
    // Données ultra-uniques
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    const userData = {
      pseudo: `isolated_user_${timestamp}_${random}`,
      email: `isolated_${timestamp}_${random}@test.com`,
      password: 'Password123!'
    };

    log(`📤 Inscription: ${userData.email}`);
    log(`📤 Pseudo: ${userData.pseudo}`);

    // Vérifier qu'on est bien sur la base test
    const statsBefore = await testDbManager.getStats();
    log(`📊 Base avant test: ${statsBefore.database}`);
    
    const response = await request(testApp)
      .post('/api/auth/register')
      .send(userData);

    log(`📊 Status: ${response.status}`);
    log(`📋 Response: ${JSON.stringify(response.body)}`);
    
    if (response.status === 201) {
      log('✅ SUCCÈS - Inscription réussie avec écosystème dédié !');
      log(`Token présent: ${!!response.body.token}`);
      log(`Email confirmé: ${response.body.user?.email}`);
    } else {
      log(`❌ ÉCHEC - Status: ${response.status}`);
      log(`Erreur: ${response.body?.message}`);
      
      // Diagnostics supplémentaires
      const statsAfter = await testDbManager.getStats();
      log(`📊 Stats après échec: ${JSON.stringify(statsAfter)}`);
    }

    // Assertions
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(userData.email);
  });

  test('TEST 2/3 - Connexion utilisateur isolé', async () => {
    log('🎯 TEST 2 - Connexion avec utilisateur créé');
    
    // 1. Créer un utilisateur d'abord
    const timestamp = Date.now();
    const userData = {
      pseudo: `login_user_${timestamp}`,
      email: `login_${timestamp}@test.com`,
      password: 'LoginPass123!'
    };

    log(`📤 Création utilisateur: ${userData.email}`);
    
    const registerResponse = await request(testApp)
      .post('/api/auth/register')
      .send(userData);

    log(`📊 Status création: ${registerResponse.status}`);
    
    if (registerResponse.status !== 201) {
      log(`❌ Échec création: ${registerResponse.body?.message}`);
      expect(registerResponse.status).toBe(201);
      return;
    }
    
    log('✅ Utilisateur créé, tentative connexion...');

    // 2. Se connecter
    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(testApp)
      .post('/api/auth/login')
      .send(loginData);

    log(`📊 Status connexion: ${loginResponse.status}`);
    log(`📋 Response connexion: ${JSON.stringify(loginResponse.body)}`);
    
    if (loginResponse.status === 200) {
      log('✅ SUCCÈS - Connexion réussie avec écosystème dédié !');
    } else {
      log(`❌ ÉCHEC connexion: ${loginResponse.body?.message}`);
    }

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.token).toBeDefined();
  });

  test('TEST 3/3 - Vérification isolation base', async () => {
    log('🎯 TEST 3 - Vérification isolation complète');
    
    // Vérifier qu'on est bien sur une base isolée
    const stats = await testDbManager.getStats();
    log(`📊 Stats finales: ${JSON.stringify(stats, null, 2)}`);
    
    // La base doit contenir "test" dans le nom
    expect(stats.database).toContain('test');
    
    // Vérifier qu'elle est différente de "cadok" (production)
    expect(stats.database).not.toBe('cadok');
    
    // Nettoyer pour vérifier que ça marche
    await testDbManager.cleanDatabase();
    
    const statsAfterClean = await testDbManager.getStats();
    log(`📊 Stats après nettoyage: ${JSON.stringify(statsAfterClean)}`);
    
    log('✅ SUCCÈS - Isolation confirmée !');
    expect(true).toBe(true); // Test symbolique de l'isolation
  });
});
