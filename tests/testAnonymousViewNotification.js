/**
 * 🧪 TEST CONSULTATION ANONYME
 * Teste que les consultations sans authentification ne créent pas de notifications
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

async function testAnonymousViewNoNotification() {
  let userToken = null;
  let testObjectId = null;

  try {
    console.log('🧪 TEST CONSULTATION ANONYME (SANS NOTIFICATION)\n');

    // 1. Créer/connecter un utilisateur
    console.log('👤 Préparation de l\'utilisateur propriétaire...');
    
    const testUser = {
      email: 'proprietaire-anonyme@cadok.com',
      password: 'testpassword123',
      pseudo: 'ProprietaireAnonymous'
    };
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      userToken = loginResponse.data.token;
      console.log('✅ Utilisateur connecté');
      
    } catch (loginError) {
      console.log('📝 Création de l\'utilisateur...');
      
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        pseudo: testUser.pseudo,
        email: testUser.email,
        password: testUser.password,
        firstName: 'Propriétaire',
        lastName: 'Anonymous',
        phoneNumber: '+33123456789',
        address: {
          street: '123 Anonymous Street',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        }
      });
      
      userToken = registerResponse.data.token;
      console.log('✅ Utilisateur créé et connecté');
    }

    // 2. Créer un objet
    console.log('\n📦 Création d\'un objet de test...');
    
    const createObjectResponse = await axios.post(`${API_BASE_URL}/objects`, {
      title: 'Objet Test Anonyme',
      description: 'Ceci est un objet pour tester les consultations anonymes',
      category: '507f1f77bcf86cd799439011',
      location: {
        city: 'Paris',
        zipCode: '75001'
      }
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    testObjectId = createObjectResponse.data._id;
    console.log(`✅ Objet créé avec ID: ${testObjectId}`);

    // 3. Compter les notifications avant consultation anonyme
    console.log('\n📊 Comptage notifications avant consultation anonyme...');
    
    const notificationsBefore = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const notifCountBefore = notificationsBefore.data.length;
    console.log(`📧 Propriétaire a ${notifCountBefore} notifications avant consultation anonyme`);

    // 4. Consultation anonyme (sans token)
    console.log('\n👁️ Consultation anonyme de l\'objet...');
    
    const anonymousConsultationResponse = await axios.get(`${API_BASE_URL}/objects/${testObjectId}`);
    
    console.log(`✅ Objet consulté anonymement: "${anonymousConsultationResponse.data.title}"`);
    console.log(`👤 Propriétaire: ${anonymousConsultationResponse.data.owner.pseudo}`);

    // 5. Attendre un peu puis vérifier les notifications
    console.log('\n⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6. Compter les notifications après consultation anonyme
    console.log('📊 Comptage notifications après consultation anonyme...');
    
    const notificationsAfter = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const notifCountAfter = notificationsAfter.data.length;
    console.log(`📧 Propriétaire a ${notifCountAfter} notifications après consultation anonyme`);

    // 7. Vérifier qu'AUCUNE nouvelle notification n'a été créée
    if (notifCountAfter === notifCountBefore) {
      console.log('✅ AUCUNE NOTIFICATION CRÉÉE (COMPORTEMENT ATTENDU)');
      console.log('🎯 Les consultations anonymes ne génèrent pas de notifications ✅');
    } else {
      console.log('❌ UNE NOTIFICATION A ÉTÉ CRÉÉE (COMPORTEMENT INATTENDU)');
      console.log('⚠️  Les consultations anonymes ne devraient pas créer de notifications');
    }

    console.log('\n🎉 TEST CONSULTATION ANONYME TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Lancer le test si ce script est exécuté directement
if (require.main === module) {
  testAnonymousViewNoNotification();
}

module.exports = testAnonymousViewNoNotification;
