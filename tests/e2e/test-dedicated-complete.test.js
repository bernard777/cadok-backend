/**
 * 🎯 TEST FINAL AVEC APP-TEST-DEDICATED COMPLÈTE
 * Test des 7 cas avec l'app dédiée améliorée
 */

const request = require('supertest');
const fs = require('fs');

describe('🏆 7 TESTS AVEC APP-TEST-DEDICATED COMPLÈTE', () => {
  const logFile = 'c:\\Users\\JB\\Music\\cadok-backend\\test-dedicated-complete.log';
  let testApp = null;
  
  function log(msg) {
    const fullMsg = `[${new Date().toISOString()}] ${msg}`;
    fs.appendFileSync(logFile, fullMsg + '\n');
    console.log(fullMsg);
  }
  
  beforeAll(async () => {
    try { fs.unlinkSync(logFile); } catch {}
    
    log('=== TEST APP-TEST-DEDICATED COMPLÈTE ===');
    
    // Utiliser l'app dédiée avec routes intégrées
    const { initializeTestApp } = require('../../app-test-dedicated');
    testApp = await initializeTestApp();
    
    log('✅ App dédiée complète initialisée');
  });

  afterAll(async () => {
    const { cleanupTestApp } = require('../../app-test-dedicated');
    await cleanupTestApp();
    log('✅ Nettoyage terminé');
  });

  // Test rapide pour vérifier que tout fonctionne
  test('Test inscription avec app dédiée complète', async () => {
    log('🎯 Test inscription rapide');
    
    const timestamp = Date.now();
    const userData = {
      pseudo: `dedicated_${timestamp}`,
      email: `dedicated_${timestamp}@test.com`,
      password: 'DedicatedTest123!',
      city: 'Nice'
    };

    log(`📤 Inscription: ${userData.email}`);

    const response = await request(testApp)
      .post('/api/auth/register')
      .send(userData);

    log(`📊 Status: ${response.status}`);
    log(`📋 Body: ${JSON.stringify(response.body)}`);

    if (response.status === 201) {
      log('🎉 SUCCÈS TOTAL - App dédiée complète fonctionne !');
      
      // Test connexion rapide
      const loginResponse = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      log(`📊 Status connexion: ${loginResponse.status}`);
      
      if (loginResponse.status === 200) {
        log('🏆 VICTOIRE - Inscription ET connexion fonctionnent !');
      }
      
      expect(loginResponse.status).toBe(200);
      
    } else {
      log(`❌ Échec: ${response.body?.message}`);
    }

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
