/**
 * Script de debug pour tester l'API register directement
 */

const supertest = require('supertest');
const app = require('./app');

async function testRegister() {
  console.log('🔍 Test direct de l\'API register...');
  
  const userData = {
    pseudo: `TestDebug_${Date.now()}`,
    email: `debug_${Date.now()}@test-cadok.com`,
    password: 'SecureTestPassword123!',
    city: 'Paris'
  };
  
  console.log('📤 Données envoyées:', userData);
  
  try {
    const response = await supertest(app)
      .post('/api/auth/register')
      .send(userData);
    
    console.log('📥 Réponse reçue:');
    console.log('   Status:', response.status);
    console.log('   Body:', response.body);
    console.log('   Headers:', response.headers);
    
    if (response.status === 201) {
      console.log('✅ Inscription réussie !');
    } else {
      console.log('❌ Inscription échouée');
      console.log('🔍 Erreur:', response.body?.message || 'Erreur inconnue');
    }
  } catch (error) {
    console.log('💥 Erreur lors de l\'appel API:', error.message);
  }
}

// Lancer le test
testRegister().then(() => {
  console.log('🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
