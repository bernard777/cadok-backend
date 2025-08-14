/**
 * 🧪 TEST SIMPLE NOTIFICATIONS FAVORIS
 * Test simplifié pour vérifier que les notifications de favoris fonctionnent
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

async function testSimpleFavoriteNotification() {
  console.log('🧪 TEST SIMPLE NOTIFICATIONS FAVORIS');
  console.log('=' .repeat(40));

  try {
    // 1. Vérifier qu'il y a des objets existants
    console.log('\n📦 Récupération d\'un objet existant...');
    const objectsResponse = await axios.get(`${API_BASE_URL}/objects?limit=1`);
    
    if (!objectsResponse.data || objectsResponse.data.length === 0) {
      console.log('❌ Aucun objet trouvé en base pour le test');
      return;
    }

    const testObject = objectsResponse.data[0];
    console.log(`✅ Objet trouvé: "${testObject.title}" (ID: ${testObject._id})`);
    console.log(`👤 Propriétaire: ${testObject.owner.pseudo}`);

    // 2. Créer un utilisateur de test différent du propriétaire
    console.log('\n👤 Création utilisateur de test...');
    
    const testUser = {
      pseudo: 'TestFavoris',
      email: 'test.favoris@cadok.com',
      password: 'TestPass123!',
      firstName: 'Jean',
      lastName: 'Test',
      phoneNumber: '+33123456789',
      city: 'Lyon',
      address: {
        street: '123 Rue Test',
        city: 'Lyon',
        zipCode: '69001',
        country: 'France'
      }
    };

    let userToken;

    try {
      // Essayer de se connecter
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      userToken = loginResponse.data.token;
      console.log('✅ Utilisateur connecté');
    } catch (loginError) {
      // Créer le compte
      try {
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
        userToken = registerResponse.data.token;
        console.log('✅ Utilisateur créé et connecté');
      } catch (registerError) {
        console.log('❌ Erreur création utilisateur:', registerError.response?.data || registerError.message);
        return;
      }
    }

    // 3. Récupérer les infos du propriétaire
    const ownerResponse = await axios.get(`${API_BASE_URL}/users/${testObject.owner._id}`);
    const ownerId = ownerResponse.data._id;
    console.log(`✅ Propriétaire trouvé: ${ownerResponse.data.pseudo}`);

    // 4. Compter les notifications du propriétaire AVANT
    let ownerToken;
    try {
      // On a besoin du token du propriétaire pour voir ses notifications
      // Pour simplifier, on va créer un autre utilisateur et tester avec lui
      const ownerTestData = {
        pseudo: 'OwnerTest',
        email: 'owner.test@cadok.com', 
        password: 'OwnerPass123!',
        firstName: 'Marie',
        lastName: 'Proprietaire',
        phoneNumber: '+33987654321',
        city: 'Paris',
        address: {
          street: '456 Rue Propriétaire',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        }
      };

      try {
        const ownerLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: ownerTestData.email,
          password: ownerTestData.password
        });
        ownerToken = ownerLoginResponse.data.token;
      } catch (ownerLoginError) {
        const ownerRegisterResponse = await axios.post(`${API_BASE_URL}/auth/register`, ownerTestData);
        ownerToken = ownerRegisterResponse.data.token;
        console.log('✅ Propriétaire de test créé');
      }

      // Créer un objet avec ce propriétaire
      console.log('\n📦 Création objet par le propriétaire de test...');
      const newObjectResponse = await axios.post(`${API_BASE_URL}/objects`, {
        title: 'Objet Test Favoris',
        description: 'Ceci est un objet pour tester les favoris',
        category: '689bf69282e8f2ac5f1f34b8', // Électronique
        location: {
          city: 'Paris',
          zipCode: '75001'
        },
        images: []
      }, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      const newObjectId = newObjectResponse.data._id;
      console.log(`✅ Nouvel objet créé: "${newObjectResponse.data.title}"`);

      // 5. Compter les notifications du propriétaire AVANT
      const notifsBefore = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      console.log(`📧 Propriétaire a ${notifsBefore.data.length} notifications AVANT`);

      // 6. L'utilisateur de test met l'objet en favoris
      console.log('\n⭐ Ajout en favoris...');
      
      const favoriteResponse = await axios.post(`${API_BASE_URL}/users/me/favorite-objects/${newObjectId}`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      console.log(`✅ ${favoriteResponse.data.action} (${favoriteResponse.data.isFavorite ? 'ajouté' : 'retiré'})`);

      // 7. Attendre et vérifier les notifications
      console.log('\n⏳ Attente 3 secondes...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const notifsAfter = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      console.log(`📧 Propriétaire a ${notifsAfter.data.length} notifications APRÈS`);

      // 8. Vérifier le résultat
      if (notifsAfter.data.length > notifsBefore.data.length) {
        console.log('\n✅ NOTIFICATION DE FAVORI CRÉÉE ! 🎉');
        
        const latestNotif = notifsAfter.data[0];
        console.log(`📬 Dernière notification:`);
        console.log(`   - Titre: ${latestNotif.title}`);
        console.log(`   - Message: ${latestNotif.message}`);
        console.log(`   - Type: ${latestNotif.type}`);
        
        console.log('\n🎯 SYSTÈME DE NOTIFICATIONS CADOK FONCTIONNEL !');
      } else {
        console.log('\n❌ Aucune notification créée');
        console.log('💡 Le système de notification des favoris nécessite une vérification');
      }

    } catch (error) {
      console.log('❌ Erreur durant le test:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }
}

// Lancer le test
if (require.main === module) {
  testSimpleFavoriteNotification();
}

module.exports = testSimpleFavoriteNotification;
