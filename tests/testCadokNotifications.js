/**
 * 🧪 TEST SIMPLE SYSTÈME DE NOTIFICATIONS CADOK
 * Teste uniquement les notifications qui ont du sens métier
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

async function testCadokNotifications() {
  console.log('🧪 TEST SYSTÈME DE NOTIFICATIONS CADOK');
  console.log('=' .repeat(50));

  try {
    // 1. Vérifier que le backend fonctionne
    console.log('\n🔍 Vérification backend...');
    try {
      await axios.get(`${API_BASE_URL}/objects?limit=1`);
      console.log('✅ Backend accessible');
    } catch (error) {
      console.log('❌ Backend non accessible - Démarrez le serveur backend');
      return;
    }

    // 2. Créer deux utilisateurs de test
    console.log('\n👥 Création des utilisateurs de test...');
    
    const users = [];
    
    for (let i = 1; i <= 2; i++) {
      const userData = {
        pseudo: `TestUser${i}`,
        email: `testuser${i}@cadok.com`,
        password: 'TestPass123!',
        firstName: i === 1 ? 'Pierre' : 'Marie',
        lastName: 'Dupont',
        phoneNumber: `+3312345678${i}`,
        city: 'Paris',
        address: {
          street: `${i}23 Test Street`,
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        },
        favoriteCategories: [
          '689bf69282e8f2ac5f1f34bc'
        ]
      };

      try {
        // Essayer de se connecter d'abord
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        users.push({ ...userData, token: loginResponse.data.token });
        console.log(`✅ ${userData.pseudo} connecté`);
      } catch (loginError) {
        // Créer le compte s'il n'existe pas
        try {
          const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, userData);
          users.push({ ...userData, token: registerResponse.data.token });
          console.log(`✅ ${userData.pseudo} créé`);
        } catch (registerError) {
          console.log(`❌ Erreur création ${userData.pseudo}:`, registerError.response?.data || registerError.message);
          return;
        }
      }
    }

    // 3. User2 crée un objet
    console.log('\n📦 User2 crée un objet...');
    
    const objectData = {
      title: 'Livre Test Notifications',
      description: 'Un livre pour tester les notifications CADOK',
      category: 'Livres & BD',
      location: {
        city: 'Paris',
        zipCode: '75001'
      },
      images: []
    };

    const createObjectResponse = await axios.post(`${API_BASE_URL}/objects`, objectData, {
      headers: { Authorization: `Bearer ${users[1].token}` }
    });

    const objectId = createObjectResponse.data._id;
    console.log(`✅ Objet créé: "${createObjectResponse.data.title}" (ID: ${objectId})`);

    // 4. Compter les notifications de User2 avant
    const notifsBefore = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${users[1].token}` }
    });
    console.log(`📧 User2 a ${notifsBefore.data.length} notifications avant`);

    // 5. User1 met l'objet en favoris
    console.log('\n⭐ User1 met l\'objet en favoris...');
    
    const favoriteResponse = await axios.post(`${API_BASE_URL}/users/me/favorite-objects/${objectId}`, {}, {
      headers: { Authorization: `Bearer ${users[0].token}` }
    });

    console.log(`✅ Favori ${favoriteResponse.data.action} (action: ${favoriteResponse.data.action})`);

    // 6. Attendre et vérifier les notifications
    console.log('\n⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const notifsAfter = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${users[1].token}` }
    });

    console.log(`📧 User2 a ${notifsAfter.data.length} notifications après`);

    // 7. Analyser le résultat
    if (notifsAfter.data.length > notifsBefore.data.length) {
      console.log('✅ NOTIFICATION DE FAVORI CRÉÉE !');
      
      const latestNotif = notifsAfter.data[0];
      console.log(`📬 Dernière notification:`);
      console.log(`   - Titre: ${latestNotif.title}`);
      console.log(`   - Message: ${latestNotif.message}`);
      console.log(`   - Type: ${latestNotif.type}`);
      
      console.log('\n🎉 SYSTÈME DE NOTIFICATIONS CADOK FONCTIONNEL !');
    } else {
      console.log('❌ Aucune notification créée');
      console.log('⚠️  Vérifiez la configuration du système de notifications');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Lancer le test
if (require.main === module) {
  testCadokNotifications();
}

module.exports = testCadokNotifications;
