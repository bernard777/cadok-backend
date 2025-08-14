/**
 * 🧪 TEST COMPLET SYSTÈME DE NOTIFICATIONS
 * Lance tous les tests de notifications pour validation complète
 */

const axios = require('axios');
const testFavoriteNotification = require('./testFavoriteNotification');
const testObjectViewNotification = require('./testObjectViewNotification');
const testAnonymousViewNotification = require('./testAnonymousViewNotification');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Backend accessible');
    return true;
  } catch (error) {
    try {
      // Essayer une route basique si /health n'existe pas
      await axios.get(`${API_BASE_URL}/objects?limit=1`);
      console.log('✅ Backend accessible');
      return true;
    } catch (secondError) {
      console.log('❌ Backend non accessible');
      console.log('   Assurez-vous que le serveur backend fonctionne sur le port 5000');
      return false;
    }
  }
}

async function runAllNotificationTests() {
  console.log('🚀 LANCEMENT TEST COMPLET SYSTÈME DE NOTIFICATIONS');
  console.log('=' .repeat(60));
  
  // 1. Vérifier que le backend est accessible
  console.log('\n🔍 Vérification de la connectivité backend...');
  const backendOk = await checkBackendHealth();
  
  if (!backendOk) {
    console.log('\n❌ TESTS INTERROMPUS - Backend non accessible');
    return;
  }

  console.log('\n🎯 Début des tests de notifications...\n');

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // 2. Test des notifications de favoris
  console.log('1️⃣ TEST NOTIFICATIONS DE FAVORIS');
  console.log('-'.repeat(50));
  try {
    await testFavoriteNotification();
    testResults.tests.push({ name: 'Notifications Favoris', status: 'PASS' });
    testResults.passed++;
  } catch (error) {
    console.error('❌ Test favoris échoué:', error.message);
    testResults.tests.push({ name: 'Notifications Favoris', status: 'FAIL', error: error.message });
    testResults.failed++;
  }
  testResults.total++;

  console.log('\n');

  // 3. Test des notifications de consultation
  console.log('2️⃣ TEST NOTIFICATIONS DE CONSULTATION');
  console.log('-'.repeat(50));
  try {
    await testObjectViewNotification();
    testResults.tests.push({ name: 'Notifications Consultation', status: 'PASS' });
    testResults.passed++;
  } catch (error) {
    console.error('❌ Test consultation échoué:', error.message);
    testResults.tests.push({ name: 'Notifications Consultation', status: 'FAIL', error: error.message });
    testResults.failed++;
  }
  testResults.total++;

  console.log('\n');

  // 4. Test des consultations anonymes (pas de notifications)
  console.log('3️⃣ TEST CONSULTATIONS ANONYMES (PAS DE NOTIFICATIONS)');
  console.log('-'.repeat(50));
  try {
    await testAnonymousViewNotification();
    testResults.tests.push({ name: 'Consultations Anonymes', status: 'PASS' });
    testResults.passed++;
  } catch (error) {
    console.error('❌ Test consultation anonyme échoué:', error.message);
    testResults.tests.push({ name: 'Consultations Anonymes', status: 'FAIL', error: error.message });
    testResults.failed++;
  }
  testResults.total++;

  // 5. Résumé des résultats
  console.log('\n');
  console.log('🎯 RÉSUMÉ DES TESTS DE NOTIFICATIONS');
  console.log('=' .repeat(60));
  
  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${test.name}: ${test.status}`);
    if (test.error) {
      console.log(`   Erreur: ${test.error}`);
    }
  });

  console.log('\n📊 STATISTIQUES:');
  console.log(`   Total: ${testResults.total} tests`);
  console.log(`   ✅ Réussis: ${testResults.passed}`);
  console.log(`   ❌ Échoués: ${testResults.failed}`);
  
  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  console.log(`   🎯 Taux de réussite: ${successRate}%`);

  if (successRate === 100) {
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('✨ Le système de notifications est 100% fonctionnel !');
  } else if (successRate >= 75) {
    console.log('\n⚠️  La majorité des tests ont réussi, mais quelques améliorations sont nécessaires');
  } else {
    console.log('\n❌ Plusieurs tests ont échoué, révision nécessaire');
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TESTS TERMINÉS');
}

// Lancer tous les tests si ce script est exécuté directement
if (require.main === module) {
  runAllNotificationTests().catch(error => {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
  });
}

module.exports = runAllNotificationTests;
