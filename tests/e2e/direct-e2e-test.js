/**
 * 🚀 TEST E2E DIRECT CADOK
 * Script de test direct sans Jest complexe
 */

const request = require('supertest');

// Import direct de l'app
let app;
try {
  app = require('../../app');
  console.log('✅ App CADOK chargée avec succès');
} catch (error) {
  console.error('❌ Erreur chargement app:', error.message);
  process.exit(1);
}

async function runDirectE2ETests() {
  console.log('🧪 TESTS E2E DIRECTS CADOK');
  console.log('============================');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Connectivité API
    console.log('\n1️⃣ Test connectivité API...');
    const connectResponse = await request(app)
      .get('/api/auth/test-connection');
      
    if (connectResponse.status === 200) {
      console.log('✅ Connectivité API: OK');
      testsPassed++;
    } else {
      console.log('❌ Connectivité API: Échec');
      testsFailed++;
    }

    // Test 2: Inscription utilisateur
    console.log('\n2️⃣ Test inscription utilisateur...');
    const userData = {
      firstName: 'TestDirect',
      lastName: 'E2E',
      email: `direct.test.${Date.now()}@cadok.com`,
      password: 'DirectPass123!',
      city: 'TestCity',
      zipCode: '12345'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    if (registerResponse.status === 201 && registerResponse.body.token) {
      console.log('✅ Inscription utilisateur: OK');
      testsPassed++;
      
      // Test 3: Authentification
      console.log('\n3️⃣ Test authentification...');
      const authResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerResponse.body.token}`);
        
      if (authResponse.status === 200) {
        console.log('✅ Authentification: OK');
        testsPassed++;
      } else {
        console.log('❌ Authentification: Échec');
        testsFailed++;
      }
      
      // Test 4: Création objet
      console.log('\n4️⃣ Test création objet...');
      const objectData = {
        title: 'Objet Test Direct E2E',
        description: 'Test objet création directe',
        category: 'Test',
        condition: 'Bon état',
        estimatedValue: 25
      };

      const objectResponse = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${registerResponse.body.token}`)
        .send(objectData);

      if (objectResponse.status === 201) {
        console.log('✅ Création objet: OK');
        testsPassed++;
      } else {
        console.log('❌ Création objet: Échec');
        testsFailed++;
      }
      
    } else {
      console.log('❌ Inscription utilisateur: Échec');
      testsFailed++;
    }

    // Test 5: Liste objets publique
    console.log('\n5️⃣ Test liste objets...');
    const objectsResponse = await request(app)
      .get('/api/objects');
      
    if (objectsResponse.status === 200 && Array.isArray(objectsResponse.body)) {
      console.log('✅ Liste objets: OK');
      testsPassed++;
    } else {
      console.log('❌ Liste objets: Échec');
      testsFailed++;
    }

  } catch (error) {
    console.error('💥 Erreur lors des tests:', error.message);
    testsFailed++;
  }

  // Résultats finaux
  console.log('\n📊 RÉSULTATS TESTS E2E DIRECTS');
  console.log('================================');
  console.log(`✅ Tests réussis: ${testsPassed}`);
  console.log(`❌ Tests échoués: ${testsFailed}`);
  console.log(`📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 TOUS LES TESTS E2E DIRECTS ONT RÉUSSI !');
    console.log('🚀 Votre backend CADOK est fonctionnel');
    return true;
  } else {
    console.log('\n⚠️ Certains tests ont échoué');
    console.log('🔍 Vérifiez la configuration et les services');
    return false;
  }
}

// Exécution directe
if (require.main === module) {
  runDirectE2ETests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runDirectE2ETests };
