/**
 * Test direct de l'endpoint upgrade pour diagnostiquer l'erreur 400
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Fonction pour tester l'upgrade
async function testUpgrade() {
  console.log('🧪 Test de l\'endpoint /api/subscriptions/upgrade\n');
  
  try {
    // Test 1: Sans authentification (devrait donner 401)
    console.log('1️⃣ Test sans authentification...');
    try {
      await axios.post(`${BASE_URL}/api/subscriptions/upgrade`, {
        plan: 'premium',
        paymentMethod: 'pm_test_123'
      });
    } catch (error) {
      console.log(`   Status: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 2: Avec des données invalides (pour simuler l'erreur)
    console.log('\n2️⃣ Test avec données invalides...');
    try {
      await axios.post(`${BASE_URL}/api/subscriptions/upgrade`, {
        // Plan manquant intentionnellement
        paymentMethod: 'pm_test_123'
      }, {
        headers: {
          'Authorization': 'Bearer fake_token'
        }
      });
    } catch (error) {
      console.log(`   Status: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Plan invalide
    console.log('\n3️⃣ Test avec plan invalide...');
    try {
      await axios.post(`${BASE_URL}/api/subscriptions/upgrade`, {
        plan: 'invalid_plan',
        paymentMethod: 'pm_test_123'
      }, {
        headers: {
          'Authorization': 'Bearer fake_token'
        }
      });
    } catch (error) {
      console.log(`   Status: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Test 4: Vérifier que l'endpoint existe
    console.log('\n4️⃣ Vérification routes disponibles...');
    try {
      await axios.get(`${BASE_URL}/api/subscriptions/plans`);
      console.log('   ✅ Route /plans accessible');
    } catch (error) {
      console.log('   ❌ Route /plans inaccessible');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter les tests
testUpgrade().then(() => {
  console.log('\n🎯 Diagnostic terminé');
  console.log('💡 Vérifiez les logs du serveur backend pour plus de détails');
});
