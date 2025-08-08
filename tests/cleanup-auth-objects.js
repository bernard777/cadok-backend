/**
 * 🧹 NETTOYAGE SPÉCIALISÉ AUTH + OBJECTS
 * Script de cleanup pour les tests des modules 1 et 2 avec gestion rate limits
 */

const mongoose = require('mongoose');
const { connectToDatabase } = require('../db');

const cleanupAuthObjectsData = async () => {
  try {
    console.log('🧹 Début nettoyage spécialisé AUTH + OBJECTS...');

    // Connexion à MongoDB
    console.log('⏳ Connexion à MongoDB...');
    await connectToDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test');

    const User = require('../models/User');
    const Object = require('../models/Object');

    // Pattern pour identifier les données de test des modules auth + objects
    const testPatterns = [
      /^(AuthObj|Pool|RegSuccess|InvalidEmail|WeakPass|Short|First|Duplicate)_/,
      /^(Workflow|Modifiable|Deletable|Protected|Unauth|Limit).*Object/,
      /test-suite\.cadok$/,
      /e2e.*@test.*\.com$/
    ];

    // Nettoyage utilisateurs test
    console.log('👥 Nettoyage utilisateurs test...');
    const usersQuery = {
      $or: [
        { email: { $regex: testPatterns[2] } },
        { email: { $regex: testPatterns[3] } },
        { pseudo: { $regex: testPatterns[0] } }
      ]
    };

    const usersToDelete = await User.find(usersQuery).select('_id pseudo email');
    console.log(`🎯 ${usersToDelete.length} utilisateurs test trouvés`);

    if (usersToDelete.length > 0) {
      // Supprimer d'abord leurs objets
      const userIds = usersToDelete.map(u => u._id);
      const objectsDeleted = await Object.deleteMany({ owner: { $in: userIds } });
      console.log(`📦 ${objectsDeleted.deletedCount} objets utilisateurs supprimés`);

      // Puis supprimer les utilisateurs
      const usersDeleted = await User.deleteMany(usersQuery);
      console.log(`👤 ${usersDeleted.deletedCount} utilisateurs supprimés`);
    }

    // Nettoyage objets test orphelins (par titre)
    console.log('📦 Nettoyage objets test...');
    const objectsQuery = {
      $or: [
        { title: { $regex: testPatterns[1] } },
        { title: { $regex: /^(Test Object|Lecture Test|Workflow Object)/ } },
        { description: { $regex: /(test|Test).*API réelle/ } }
      ]
    };

    const orphanObjectsDeleted = await Object.deleteMany(objectsQuery);
    console.log(`🗑️ ${orphanObjectsDeleted.deletedCount} objets test orphelins supprimés`);

    // Statistiques finales
    const totalUsers = await User.countDocuments();
    const totalObjects = await Object.countDocuments();
    
    console.log('📊 Statistiques après nettoyage:');
    console.log(`   👥 Utilisateurs restants: ${totalUsers}`);
    console.log(`   📦 Objets restants: ${totalObjects}`);

    console.log('✅ Nettoyage AUTH + OBJECTS terminé avec succès');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage AUTH + OBJECTS:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Connexion MongoDB fermée');
    }
  }
};

// Exécution directe si appelé en script
if (require.main === module) {
  cleanupAuthObjectsData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Échec du nettoyage:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAuthObjectsData };
