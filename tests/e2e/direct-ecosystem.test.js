/**
 * 🎯 TEST DIRECT SANS SETUP JEST
 * Test l'écosystème dédié en bypassing le setup problématique
 */

// Forcer les variables d'environnement AVANT tout import
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = `mongodb://127.0.0.1:27017/cadok_direct_test_${Date.now()}`;

const request = require('supertest');
const fs = require('fs');

describe('🎯 TEST DIRECT ÉCOSYSTÈME DÉDIÉ', () => {
  const logFile = 'c:\\Users\\JB\\Music\\cadok-backend\\test-direct-ecosystem.log';
  let testApp = null;
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    console.log(msg);
  }
  
  beforeAll(async () => {
    try { fs.unlinkSync(logFile); } catch {}
    
    log('=== TEST DIRECT ÉCOSYSTÈME DÉDIÉ ===');
    log(`NODE_ENV: ${process.env.NODE_ENV}`);
    log(`MONGODB_URI: ${process.env.MONGODB_URI}`);
    
    // Importer APRÈS avoir défini les variables d'env
    const { initializeTestApp, cleanupTestApp } = require('../../app-test-dedicated');
    
    log('🚀 Import et initialisation app dédiée...');
    testApp = await initializeTestApp();
    log('✅ App dédiée initialisée');
    
  });
  
  test('Test inscription direct avec app dédiée', async () => {
    log('🎯 TEST - Inscription directe');
    
    const timestamp = Date.now();
    const userData = {
      pseudo: `direct_user_${timestamp}`,
      email: `direct_${timestamp}@test.com`,
      password: 'DirectPass123!'
    };

    log(`📤 Inscription: ${userData.email}`);

    const response = await request(testApp)
      .post('/api/auth/register')
      .send(userData);

    log(`📊 Status: ${response.status}`);
    log(`📋 Body: ${JSON.stringify(response.body)}`);
    
    if (response.status === 201) {
      log('✅ SUCCÈS TOTAL - App dédiée fonctionne !');
    } else {
      log(`❌ ÉCHEC - ${response.body?.message}`);
    }

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
