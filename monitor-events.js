/**
 * 🔍 MONITEUR EN TEMPS RÉEL DES REQUÊTES ÉVÉNEMENTS
 * 
 * INSTRUCTIONS :
 * 1. Lancer ce script dans un terminal
 * 2. Aller sur l'interface web
 * 3. Essayer de créer un événement
 * 4. Observer les logs ici
 */

const axios = require('axios');

console.log('🔍 MONITEUR ÉVÉNEMENTS CADOK');
console.log('============================');
console.log('Surveillance des appels API en cours...');
console.log('Essayez maintenant de créer un événement depuis l\'interface web.');
console.log('Les logs apparaîtront ci-dessous.\n');

// Simuler une écoute continue des logs (en attendant les vrais logs serveur)
let lastLogTime = Date.now();

const monitorEvents = async () => {
  try {
    // Vérifier le health check
    const healthResponse = await axios.get('http://localhost:5000/health', { timeout: 2000 });
    
    if (healthResponse.status !== 200) {
      console.log('⚠️ Serveur non disponible');
      return;
    }

    // Test de connectivité admin
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'ndongoambassa7@gmail.com',
        password: 'Admin1234A@'
      }, { timeout: 3000 });

      if (loginResponse.data.token) {
        // Vérifier les événements existants
        const eventsResponse = await axios.get('http://localhost:5000/api/admin/events', {
          headers: { 'Authorization': `Bearer ${loginResponse.data.token}` },
          timeout: 3000
        });
        
        const eventCount = (eventsResponse.data.active?.length || 0) + 
                          (eventsResponse.data.upcoming?.length || 0);
        
        console.log(`📊 [${new Date().toLocaleTimeString()}] Serveur OK - ${eventCount} événements en base`);
        
      }
    } catch (authError) {
      console.log('❌ Problème auth admin:', authError.message);
    }

  } catch (error) {
    console.log('❌ Serveur non accessible:', error.message);
  }
};

// Vérifier toutes les 5 secondes
setInterval(monitorEvents, 5000);

console.log('\n💡 DIAGNOSTIC POSSIBLE :');
console.log('========================');
console.log('Si "impossible de créer l\'événement" apparaît :');
console.log('1. Vérifiez que vous êtes connecté en tant qu\'admin');
console.log('2. Regardez la console du navigateur (F12)');
console.log('3. Vérifiez l\'URL utilisée par le frontend');
console.log('4. Confirmez que le token est inclus dans les headers');
console.log('\n🎯 ROUTES DISPONIBLES :');
console.log('• GET  /api/admin/events - Lister les événements');
console.log('• POST /api/admin/events - Créer un événement');
console.log('• GET  /api/admin/events/templates - Templates d\'événements');
console.log('\n⏳ Monitoring en cours... (Ctrl+C pour arrêter)');

// Initial check
monitorEvents();
