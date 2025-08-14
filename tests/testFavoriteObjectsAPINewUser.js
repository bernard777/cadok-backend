const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Tester en créant d'abord un utilisateur
const testFavoriteObjectsAPIWithNewUser = async () => {
  try {
    console.log('🔄 Création d\'un utilisateur de test...');
    
    // Créer un utilisateur
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      pseudo: 'testuser' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      city: 'Paris',
      acceptTerms: true,
      acceptNewsletter: false
    });

    console.log('✅ Utilisateur créé');

    const token = registerResponse.data.token;

    // Tester la récupération des favoris (devrait être vide)
    const favoritesResponse = await axios.get(`${BASE_URL}/users/me/favorite-objects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ API favoris réponse:', {
      status: favoritesResponse.status,
      data: favoritesResponse.data,
      favoriteObjectsLength: favoritesResponse.data?.favoriteObjects?.length || 'N/A'
    });

    // Vérifier la structure
    const { favoriteObjects, count } = favoritesResponse.data;
    
    if (Array.isArray(favoriteObjects)) {
      console.log('✅ favoriteObjects est bien un array');
      console.log(`📊 Nombre de favoris: ${favoriteObjects.length}`);
    } else {
      console.error('❌ favoriteObjects n\'est pas un array:', typeof favoriteObjects);
      console.error('Structure reçue:', favoritesResponse.data);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
};

testFavoriteObjectsAPIWithNewUser();
