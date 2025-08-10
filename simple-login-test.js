/**
 * 🔐 TEST LOGIN SUPER ADMIN - Version Simple
 */

const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🚀 Test de connexion super admin...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'ndongoambassa7@gmail.com',
      password: 'Admin1234A@'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ CONNEXION RÉUSSIE !');
    console.log('Status:', response.status);
    console.log('Token:', response.data.token ? '✅ Présent' : '❌ Manquant');
    console.log('User:', response.data.user ? response.data.user : 'Pas d\'info utilisateur');
    console.log('\nRéponse complète:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Test d'une route admin
    if (response.data.token) {
      console.log('\n🛡️ Test route admin...');
      
      try {
        const adminResponse = await axios.get('http://localhost:5000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${response.data.token}`
          }
        });
        
        console.log('✅ Accès admin OK:', adminResponse.status);
        console.log('Dashboard data:', adminResponse.data);
        
      } catch (adminError) {
        console.log('❌ Erreur route admin:', adminError.response?.status, adminError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ ERREUR DE CONNEXION:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Data:', error.response?.data);
    
    if (error.response?.status === 404) {
      console.log('\n🔍 Route introuvable. Testons les routes disponibles...');
      
      // Test de différentes routes possibles
      const routes = [
        'http://localhost:5000/auth/login',
        'http://localhost:5000/login',
        'http://localhost:5000/api/login',
        'http://localhost:5000/api/users/login'
      ];
      
      for (const route of routes) {
        try {
          await axios.post(route, {
            email: 'ndongoambassa7@gmail.com',
            password: 'Admin1234A@'
          });
          console.log('✅ Route trouvée:', route);
          break;
        } catch (e) {
          console.log('❌', route, ':', e.response?.status || 'NO_RESPONSE');
        }
      }
    }
  }
};

testLogin();
