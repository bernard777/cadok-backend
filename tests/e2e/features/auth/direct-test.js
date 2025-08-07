/**
 * TEST DIRECT APP AVEC CONNEXION DB
 */

async function testDirect() {
  try {
    console.log('🚀 Test direct démarré');
    
    // Connecter MongoDB d'abord
    const { connectToDatabase } = require('../../../../db');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
    
    console.log('🔗 Connexion MongoDB...');
    await connectToDatabase(mongoUri);
    console.log('✅ MongoDB connecté');
    
    // Charger l'app après connexion
    const app = require('../../../../app');
    const request = require('supertest');
    
    const testUser = {
      pseudo: `Direct_${Date.now()}`,
      email: `direct_${Date.now()}@test.com`,
      password: 'DirectTestPassword123!',
      city: 'Paris'
    };
    
    console.log('📡 Test avec:', testUser);
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    console.log('📊 Réponse:', {
      status: response.status,
      body: response.body
    });
    
    if (response.status === 201) {
      console.log('🎉 INSCRIPTION RÉUSSIE !');
    } else {
      console.log('❌ Inscription échouée');
    }
    
    console.log('✅ Test direct terminé');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur test direct:', error);
    process.exit(1);
  }
}

testDirect();
