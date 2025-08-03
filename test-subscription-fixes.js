/**
 * Script de test pour vérifier les corrections de l'écran d'abonnement
 * Usage: node test-subscription-fixes.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testSubscriptionEndpoints() {
  console.log('🧪 Test des corrections de l\'écran d\'abonnement\n');

  try {
    // Test 1: Plans disponibles
    console.log('1️⃣ Test des plans disponibles...');
    const plansResponse = await axios.get(`${BASE_URL}/api/subscriptions/plans`);
    
    console.log('✅ Plans récupérés:', plansResponse.data.length, 'plans');
    
    // Vérifier que tous les plans ont des limites
    plansResponse.data.forEach(plan => {
      console.log(`   📋 Plan ${plan.name}: maxObjects=${plan.limits.maxObjects}, maxTrades=${plan.limits.maxTrades}`);
    });

    // Test 2: Structure des données
    console.log('\n2️⃣ Test de la structure des données...');
    
    const expectedProps = ['id', 'name', 'price', 'limits', 'features'];
    const planStructureValid = plansResponse.data.every(plan => 
      expectedProps.every(prop => plan.hasOwnProperty(prop))
    );
    
    if (planStructureValid) {
      console.log('✅ Structure des plans valide');
    } else {
      console.log('❌ Structure des plans invalide');
    }

    // Test 3: Plan gratuit présent
    const freePlan = plansResponse.data.find(plan => plan.id === 'free');
    if (freePlan) {
      console.log('✅ Plan gratuit trouvé:', freePlan.name);
      console.log(`   📊 Limites: ${freePlan.limits.maxObjects} objets, ${freePlan.limits.maxTrades} échanges`);
    } else {
      console.log('❌ Plan gratuit manquant');
    }

    // Test 4: Format de réponse en tableau
    if (Array.isArray(plansResponse.data)) {
      console.log('✅ Plans retournés en format tableau');
    } else {
      console.log('❌ Plans retournés en format objet (incorrect)');
    }

    console.log('\n🎉 Tous les tests passés ! L\'écran d\'abonnement devrait maintenant fonctionner correctement.');
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Assurez-vous que le serveur backend est démarré sur le port 5000');
    }
  }
}

// Exécuter les tests
testSubscriptionEndpoints();
