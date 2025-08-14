const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    return false;
  }
};

const testFavoriteObjectsDirectly = async () => {
  const connected = await connectDB();
  if (!connected) return;

  try {
    const User = require('../models/User');
    const ObjectModel = require('../models/Object'); // Importer le modèle Object
    
    // Trouver le premier utilisateur
    const user = await User.findOne({}).select('pseudo email favoriteObjects');
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé dans la base');
      return;
    }

    console.log('👤 Utilisateur trouvé:', {
      id: user._id,
      pseudo: user.pseudo,
      email: user.email,
      favoriteObjectsCount: user.favoriteObjects ? user.favoriteObjects.length : 0
    });

    // Tester la population des favoris
    const userWithFavorites = await User.findById(user._id)
      .populate({
        path: 'favoriteObjects',
        populate: {
          path: 'owner category',
          select: 'pseudo name'
        }
      })
      .select('favoriteObjects');

    console.log('🔍 Favoris populés:', {
      favoriteObjects: userWithFavorites.favoriteObjects || [],
      count: userWithFavorites.favoriteObjects ? userWithFavorites.favoriteObjects.length : 0
    });

    // Simuler la réponse de l'API
    const apiResponse = { 
      favoriteObjects: userWithFavorites.favoriteObjects || [],
      count: userWithFavorites.favoriteObjects ? userWithFavorites.favoriteObjects.length : 0
    };

    console.log('🎯 Structure API simulée:', apiResponse);

    // Test du code mobile fixé
    const favoriteObjects = apiResponse?.favoriteObjects || [];
    console.log('✅ Code mobile - favoriteObjects:', Array.isArray(favoriteObjects));
    console.log('✅ Code mobile - peut faire .map():', typeof favoriteObjects.map === 'function');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.disconnect();
  }
};

testFavoriteObjectsDirectly();
