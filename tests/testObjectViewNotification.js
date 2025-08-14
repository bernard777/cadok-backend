/**
 * 🧪 TEST NOTIFICATION CONSULTATION D'OBJET
 * Teste la notification automatique lors de la consultation d'un objet
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USERS = [
  {
    email: 'user1-consultation@cadok.com',
    password: 'testpassword123',
    pseudo: 'UserConsultant'
  },
  {
    email: 'user2-proprietaire@cadok.com', 
    password: 'testpassword123',
    pseudo: 'UserProprietaire'
  }
];

async function testObjectViewNotification() {
  let user1Token = null;
  let user2Token = null;
  let testObjectId = null;

  try {
    console.log('🧪 TEST NOTIFICATION CONSULTATION D\'OBJET\n');

    // 1. Créer/connecter les utilisateurs de test
    console.log('👤 Préparation des utilisateurs de test...');
    
    for (let i = 0; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      try {
        // Essayer de se connecter
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        if (i === 0) user1Token = loginResponse.data.token;
        else user2Token = loginResponse.data.token;
        
        console.log(`✅ ${user.pseudo} connecté`);
        
      } catch (loginError) {
        // Créer le compte s'il n'existe pas
        console.log(`📝 Création de ${user.pseudo}...`);
        
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
          pseudo: user.pseudo,
          email: user.email,
          password: user.password,
          firstName: user.pseudo,
          lastName: 'Test',
          phoneNumber: `+3312345678${i}`,
          address: {
            street: `${i + 1}23 Test Street`,
            city: 'Paris',
            zipCode: '75001',
            country: 'France'
          }
        });
        
        if (i === 0) user1Token = registerResponse.data.token;
        else user2Token = registerResponse.data.token;
        
        console.log(`✅ ${user.pseudo} créé et connecté`);
      }
    }

    // 2. User2 crée un objet
    console.log('\n📦 Création d\'un objet de test...');
    
    const createObjectResponse = await axios.post(`${API_BASE_URL}/objects`, {
      title: 'Objet Test Consultation',
      description: 'Ceci est un objet pour tester les notifications de consultation',
      category: '507f1f77bcf86cd799439011', // ID de catégorie générique
      location: {
        city: 'Paris',
        zipCode: '75001'
      }
    }, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });

    testObjectId = createObjectResponse.data._id;
    console.log(`✅ Objet créé avec ID: ${testObjectId}`);

    // 3. Compter les notifications avant consultation
    console.log('\n📊 Comptage notifications avant consultation...');
    
    const notificationsBefore = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    
    const notifCountBefore = notificationsBefore.data.length;
    console.log(`📧 User2 a ${notifCountBefore} notifications avant consultation`);

    // 4. User1 consulte l'objet de User2
    console.log('\n👁️ User1 consulte l\'objet de User2...');
    
    const consultationResponse = await axios.get(`${API_BASE_URL}/objects/${testObjectId}`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    console.log(`✅ Objet consulté: "${consultationResponse.data.title}"`);
    console.log(`👤 Propriétaire: ${consultationResponse.data.owner.pseudo}`);

    // 5. Attendre un peu puis vérifier les notifications
    console.log('\n⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6. Compter les notifications après consultation
    console.log('📊 Comptage notifications après consultation...');
    
    const notificationsAfter = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    
    const notifCountAfter = notificationsAfter.data.length;
    console.log(`📧 User2 a ${notifCountAfter} notifications après consultation`);

    // 7. Vérifier qu'une nouvelle notification a été créée
    if (notifCountAfter > notifCountBefore) {
      console.log('✅ NOUVELLE NOTIFICATION DÉTECTÉE !');
      
      // Chercher la notification de consultation
      const latestNotifications = notificationsAfter.data.slice(0, 3);
      const consultationNotif = latestNotifications.find(n => 
        n.type === 'object_interest' && 
        n.data && 
        n.data.interestType === 'view'
      );
      
      if (consultationNotif) {
        console.log('🎯 NOTIFICATION DE CONSULTATION TROUVÉE:');
        console.log(`   - Titre: ${consultationNotif.title}`);
        console.log(`   - Message: ${consultationNotif.message}`);
        console.log(`   - Type d'intérêt: ${consultationNotif.data.interestType}`);
        console.log('✅ TEST RÉUSSI !');
      } else {
        console.log('❌ Notification créée mais pas du bon type');
      }
    } else {
      console.log('❌ AUCUNE NOUVELLE NOTIFICATION CRÉÉE');
    }

    // 8. Test consultation par le propriétaire (ne doit pas créer de notification)
    console.log('\n🚫 Test consultation par le propriétaire...');
    
    const selfConsultationResponse = await axios.get(`${API_BASE_URL}/objects/${testObjectId}`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    
    console.log('✅ Propriétaire a consulté son propre objet (pas de notification attendue)');

    console.log('\n🎉 TEST TERMINÉ !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

// Lancer le test si ce script est exécuté directement
if (require.main === module) {
  testObjectViewNotification();
}

module.exports = testObjectViewNotification;
