/**
 * 🧪 TEST API DES NOTIFICATIONS
 * Test des endpoints pour l'application mobile
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'test-api-notifications@cadok.com',
  password: 'testpassword123'
};

async function testNotificationAPI() {
  let authToken = null;
  let userId = null;

  try {
    console.log('🔌 Test de l\'API des notifications...\n');

    // 1. Créer un utilisateur de test (ou se connecter)
    console.log('👤 Connexion utilisateur...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      authToken = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      console.log('✅ Connecté avec succès !');
      console.log('📋 User ID:', userId);
      
    } catch (loginError) {
      console.log('📝 Utilisateur inexistant, création...');
      
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        pseudo: 'TestNotificationsAPI',
        email: TEST_USER.email,
        password: TEST_USER.password,
        firstName: 'Test',
        lastName: 'NotificationsAPI',
        phoneNumber: '+33123456789',
        address: {
          street: '123 Test Street',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        }
      });
      
      authToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      console.log('✅ Utilisateur créé et connecté !');
      console.log('📋 User ID:', userId);
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Tester la récupération des préférences
    console.log('\n📖 Test récupération des préférences...');
    const prefsResponse = await axios.get(`${API_BASE_URL}/notifications/preferences`, { headers });
    console.log('✅ Préférences récupérées:', prefsResponse.data.preferences);

    // 3. Tester la mise à jour des préférences
    console.log('\n⚙️ Test mise à jour des préférences...');
    const newPrefs = {
      newMessages: true,
      tradeUpdates: true,
      objectInterest: false, // Désactiver pour test
      smartSuggestions: true,
      communityUpdates: true
    };
    
    const updateResponse = await axios.put(`${API_BASE_URL}/notifications/preferences`, newPrefs, { headers });
    console.log('✅ Préférences mises à jour:', updateResponse.data.success);

    // 4. Tester l'envoi d'une notification spécifique
    console.log('\n📤 Test envoi notification spécifique...');
    const sendResponse = await axios.post(`${API_BASE_URL}/notifications/send`, {
      userId: userId,
      type: 'new_message',
      data: {
        senderName: 'API Test User',
        messagePreview: 'Ceci est un message de test via API !',
        conversationId: 'api_test_conv_123'
      }
    }, { headers });
    
    console.log('✅ Notification envoyée:', sendResponse.data.success);
    console.log('📧 Notification ID:', sendResponse.data.notification._id);

    // 5. Tester une notification de test
    console.log('\n🧪 Test notification de test...');
    const testResponse = await axios.post(`${API_BASE_URL}/notifications/test`, {
      type: 'trade_update'
    }, { headers });
    
    console.log('✅ Notification test:', testResponse.data.success);

    // 6. Récupérer les notifications de l'utilisateur
    console.log('\n📋 Test récupération des notifications...');
    const notificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, { headers });
    console.log('✅ Notifications récupérées:', notificationsResponse.data.length, 'notifications');
    
    if (notificationsResponse.data.length > 0) {
      const latestNotif = notificationsResponse.data[0];
      console.log('📧 Dernière notification:');
      console.log('   - Titre:', latestNotif.title);
      console.log('   - Message:', latestNotif.message);
      console.log('   - Type:', latestNotif.type);
      console.log('   - Lu:', latestNotif.read);
    }

    console.log('\n🎉 TOUS LES TESTS API RÉUSSIS !');
    
  } catch (error) {
    console.error('❌ Erreur test API:', error.response?.data || error.message);
  }
}

// Lancer le test si ce script est exécuté directement
if (require.main === module) {
  testNotificationAPI();
}

module.exports = testNotificationAPI;
