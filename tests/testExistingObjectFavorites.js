/**
 * 🧪 TEST ULTRA SIMPLE - FAVORIS AVEC OBJET EXISTANT
 */

const axios = require('axios');
const API_BASE_URL = 'http://localhost:5000/api';

async function testWithExistingObject() {
  console.log('🧪 TEST FAVORIS AVEC OBJET EXISTANT');
  console.log('=' .repeat(35));

  try {
    // 1. Récupérer un objet existant
    const objectsResponse = await axios.get(`${API_BASE_URL}/objects?limit=5`);
    
    if (!objectsResponse.data || objectsResponse.data.length === 0) {
      console.log('❌ Aucun objet en base');
      return;
    }

    const testObject = objectsResponse.data[0];
    console.log(`✅ Objet: "${testObject.title}"`);
    console.log(`👤 Propriétaire: ${testObject.owner.pseudo || testObject.owner._id}`);

    // 2. Créer un utilisateur simple
    const testUser = {
      pseudo: 'FavorisTester',
      email: 'favoris.tester@cadok.com',
      password: 'TestPass123!',
      firstName: 'Paul',
      lastName: 'Testeur',
      phoneNumber: '+33111222333',
      city: 'Marseille',
      address: {
        street: '10 Avenue Test',
        city: 'Marseille', 
        zipCode: '13001',
        country: 'France'
      }
    };

    let userToken;
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      userToken = loginResponse.data.token;
      console.log('✅ Utilisateur connecté');
    } catch {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      userToken = registerResponse.data.token;
      console.log('✅ Utilisateur créé');
    }

    // 3. Tester l'ajout en favoris
    console.log('\n⭐ Test ajout en favoris...');
    
    const favoriteResponse = await axios.post(`${API_BASE_URL}/users/me/favorite-objects/${testObject._id}`, {}, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    console.log(`✅ Résultat: ${favoriteResponse.data.action}`);
    console.log(`📊 Status: ${favoriteResponse.data.isFavorite ? 'EN FAVORIS' : 'RETIRÉ'}`);

    // 4. Vérifier les notifications (si possible)
    try {
      // Essayer de récupérer les notifications de l'utilisateur actuel
      const userNotifs = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`📧 L'utilisateur a ${userNotifs.data.length} notifications`);
    } catch (notifError) {
      console.log('ℹ️  Notifications non accessibles pour cet utilisateur');
    }

    console.log('\n🎯 TEST FAVORIS TERMINÉ AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

if (require.main === module) {
  testWithExistingObject();
}

module.exports = testWithExistingObject;
