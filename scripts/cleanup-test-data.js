require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');
const User = require('../models/User');

async function cleanupTestData() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB');

    console.log('🗑️ Nettoyage des données de test...');
    
    // Supprimer les trades de test
    const tradesDeleted = await Trade.deleteMany({});
    console.log(`✅ ${tradesDeleted.deletedCount} trade(s) supprimé(s)`);
    
    // Supprimer les objets de test
    const objectsDeleted = await ObjectModel.deleteMany({});
    console.log(`✅ ${objectsDeleted.deletedCount} objet(s) supprimé(s)`);
    
    // Supprimer les utilisateurs de test
    const usersDeleted = await User.deleteMany({
      $or: [
        { email: { $regex: /test\.com$/ } },
        { pseudo: { $regex: /^(TradeTest|TestHttp)/ } }
      ]
    });
    console.log(`✅ ${usersDeleted.deletedCount} utilisateur(s) de test supprimé(s)`);

    console.log('\n🎉 NETTOYAGE TERMINÉ !');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
}

// Exécuter le nettoyage
cleanupTestData();
