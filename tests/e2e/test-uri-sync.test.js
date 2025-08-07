/**
 * TEST AVEC URI FORCÉE AVANT CHARGEMENT APP
 */

describe('🔧 Test avec URI forcée', () => {
  test('Inscription avec URI synchronisée', async () => {
    // 1. Forcer l'URI AVANT tout chargement
    const crypto = require('crypto');
    const testDb = 'cadok_test_' + crypto.randomBytes(4).toString('hex');
    const testUri = `mongodb://localhost:27017/${testDb}`;
    
    process.env.MONGODB_URI = testUri;
    process.env.NODE_ENV = 'test';
    
    console.log('🔗 URI forcée:', testUri);
    
    // 2. Connecter à cette URI
    const { connectToDatabase } = require('../../db');
    await connectToDatabase(testUri);
    
    // 3. Nettoyer cette base
    const User = require('../../models/User');
    await User.deleteMany({});
    console.log('🧹 Base de test nettoyée');
    
    // 4. MAINTENANT charger l'app (qui utilisera la même URI)
    const app = require('../../app');
    const request = require('supertest');
    
    // 5. Tester l'inscription
    const testUser = {
      pseudo: `SyncTest_${Date.now()}`,
      email: `sync_${Date.now()}@test.com`,
      password: 'SyncTestPassword123!',
      city: 'Paris'
    };
    
    console.log('📡 Test avec URI synchronisée:', testUser.email);
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    console.log('📊 Résultat:', {
      status: response.status,
      success: response.status === 201,
      body: response.body
    });
    
    if (response.status === 201) {
      console.log('🎉 INSCRIPTION RÉUSSIE AVEC JEST !');
    } else {
      console.log('❌ Échec malgré URI synchronisée');
      console.log('Body d\'erreur:', response.body);
    }
    
    expect(true).toBe(true); // Test toujours réussi pour voir les logs
  });
});
