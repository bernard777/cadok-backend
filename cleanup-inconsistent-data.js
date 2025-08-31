// Script de nettoyage des données incohérentes
const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';

// Modèles
const User = require('./models/User');
const Trade = require('./models/Trade');
const ObjectModel = require('./models/Object');
const Review = require('./models/Review');

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function cleanupInconsistentTrades() {
  console.log('\n🔄 Nettoyage des trades incohérents...');
  
  try {
    // 1. Supprimer les trades avec des utilisateurs inexistants
    const allTrades = await Trade.find({});
    let deletedTrades = 0;
    
    for (const trade of allTrades) {
      let shouldDelete = false;
      
      // Vérifier que les utilisateurs existent
      if (trade.requester) {
        const requesterExists = await User.findById(trade.requester);
        if (!requesterExists) {
          console.log(`⚠️  Trade ${trade._id} - Requester ${trade.requester} inexistant`);
          shouldDelete = true;
        }
      } else {
        console.log(`⚠️  Trade ${trade._id} - Pas de requester`);
        shouldDelete = true;
      }
      
      if (trade.owner) {
        const ownerExists = await User.findById(trade.owner);
        if (!ownerExists) {
          console.log(`⚠️  Trade ${trade._id} - Owner ${trade.owner} inexistant`);
          shouldDelete = true;
        }
      } else {
        console.log(`⚠️  Trade ${trade._id} - Pas d'owner`);
        shouldDelete = true;
      }
      
      // Vérifier que les objets existent
      if (trade.requestedObjects && trade.requestedObjects.length > 0) {
        for (const objId of trade.requestedObjects) {
          const objExists = await ObjectModel.findById(objId);
          if (!objExists) {
            console.log(`⚠️  Trade ${trade._id} - Objet demandé ${objId} inexistant`);
            shouldDelete = true;
          }
        }
      }
      
      if (trade.offeredObjects && trade.offeredObjects.length > 0) {
        for (const objId of trade.offeredObjects) {
          const objExists = await ObjectModel.findById(objId);
          if (!objExists) {
            console.log(`⚠️  Trade ${trade._id} - Objet offert ${objId} inexistant`);
            shouldDelete = true;
          }
        }
      }
      
      if (shouldDelete) {
        await Trade.findByIdAndDelete(trade._id);
        deletedTrades++;
        console.log(`🗑️  Trade ${trade._id} supprimé`);
      }
    }
    
    console.log(`✅ ${deletedTrades} trades incohérents supprimés`);
    return deletedTrades;
  } catch (error) {
    console.error('❌ Erreur nettoyage trades:', error);
    return 0;
  }
}

async function cleanupInconsistentObjects() {
  console.log('\n🔄 Nettoyage des objets incohérents...');
  
  try {
    // Supprimer les objets avec des propriétaires inexistants
    const allObjects = await ObjectModel.find({});
    let deletedObjects = 0;
    
    for (const obj of allObjects) {
      if (obj.owner) {
        const ownerExists = await User.findById(obj.owner);
        if (!ownerExists) {
          console.log(`⚠️  Objet ${obj._id} - Owner ${obj.owner} inexistant`);
          await ObjectModel.findByIdAndDelete(obj._id);
          deletedObjects++;
          console.log(`🗑️  Objet ${obj._id} supprimé`);
        }
      } else {
        console.log(`⚠️  Objet ${obj._id} - Pas d'owner`);
        await ObjectModel.findByIdAndDelete(obj._id);
        deletedObjects++;
        console.log(`🗑️  Objet ${obj._id} supprimé`);
      }
    }
    
    console.log(`✅ ${deletedObjects} objets incohérents supprimés`);
    return deletedObjects;
  } catch (error) {
    console.error('❌ Erreur nettoyage objets:', error);
    return 0;
  }
}

async function cleanupInconsistentReviews() {
  console.log('\n🔄 Nettoyage des avis incohérents...');
  
  try {
    // Supprimer les reviews avec des utilisateurs ou trades inexistants
    const allReviews = await Review.find({});
    let deletedReviews = 0;
    
    for (const review of allReviews) {
      let shouldDelete = false;
      
      // Vérifier reviewer
      if (review.reviewer) {
        const reviewerExists = await User.findById(review.reviewer);
        if (!reviewerExists) {
          console.log(`⚠️  Review ${review._id} - Reviewer ${review.reviewer} inexistant`);
          shouldDelete = true;
        }
      } else {
        shouldDelete = true;
      }
      
      // Vérifier reviewee
      if (review.reviewee) {
        const revieweeExists = await User.findById(review.reviewee);
        if (!revieweeExists) {
          console.log(`⚠️  Review ${review._id} - Reviewee ${review.reviewee} inexistant`);
          shouldDelete = true;
        }
      } else {
        shouldDelete = true;
      }
      
      // Vérifier trade
      if (review.trade) {
        const tradeExists = await Trade.findById(review.trade);
        if (!tradeExists) {
          console.log(`⚠️  Review ${review._id} - Trade ${review.trade} inexistant`);
          shouldDelete = true;
        }
      } else {
        shouldDelete = true;
      }
      
      if (shouldDelete) {
        await Review.findByIdAndDelete(review._id);
        deletedReviews++;
        console.log(`🗑️  Review ${review._id} supprimée`);
      }
    }
    
    console.log(`✅ ${deletedReviews} avis incohérents supprimés`);
    return deletedReviews;
  } catch (error) {
    console.error('❌ Erreur nettoyage reviews:', error);
    return 0;
  }
}

async function generateCleanupReport() {
  console.log('\n📊 Génération du rapport de nettoyage...');
  
  try {
    const stats = {
      users: await User.countDocuments(),
      trades: await Trade.countDocuments(),
      objects: await ObjectModel.countDocuments(),
      reviews: await Review.countDocuments()
    };
    
    console.log('\n📈 STATISTIQUES APRÈS NETTOYAGE:');
    console.log(`👥 Utilisateurs: ${stats.users}`);
    console.log(`🔄 Échanges: ${stats.trades}`);
    console.log(`📦 Objets: ${stats.objects}`);
    console.log(`⭐ Avis: ${stats.reviews}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return null;
  }
}

async function main() {
  console.log('🧹 DÉMARRAGE DU NETTOYAGE DES DONNÉES INCOHÉRENTES');
  console.log('====================================================');
  
  await connectDB();
  
  let totalCleaned = 0;
  
  // Nettoyage des différentes collections (dans l'ordre)
  totalCleaned += await cleanupInconsistentReviews(); // D'abord les reviews (dépendent des trades)
  totalCleaned += await cleanupInconsistentTrades();   // Puis les trades (dépendent des users/objects)
  totalCleaned += await cleanupInconsistentObjects();  // Enfin les objets (dépendent des users)
  
  // Rapport final
  await generateCleanupReport();
  
  console.log('\n🎯 RÉSULTATS DU NETTOYAGE:');
  console.log(`✅ Total d'éléments incohérents supprimés: ${totalCleaned}`);
  
  if (totalCleaned === 0) {
    console.log('🎉 Aucun élément incohérent trouvé - Base de données propre !');
  } else {
    console.log('🎉 Nettoyage terminé avec succès !');
    console.log('💡 Redémarrez les serveurs pour voir les changements');
  }
  
  await mongoose.connection.close();
  console.log('📦 Connexion MongoDB fermée');
}

// Exécution du script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { main, cleanupInconsistentTrades, cleanupInconsistentObjects, cleanupInconsistentReviews };
