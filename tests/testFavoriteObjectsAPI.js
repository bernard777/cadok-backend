const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Tester l'API des objets favoris
const testFavoriteObjectsAPI = async () => {
  try {
    // D'abord se connecter
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');

    // Tester la récupération des favoris
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
      
      if (favoriteObjects.length > 0) {
        console.log('🔍 Premier objet favori:', favoriteObjects[0]);
      } else {
        console.log('ℹ️ Aucun objet en favoris');
      }
    } else {
      console.error('❌ favoriteObjects n\'est pas un array:', typeof favoriteObjects);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
};

testFavoriteObjectsAPI();
