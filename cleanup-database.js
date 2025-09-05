// Script de nettoyage de la base de données CADOK
// CORRECTION SPÉCIFIQUE: Erreur index username_1 dup key
// À exécuter avec : node cleanup-database.js

const mongoose = require('mongoose');

// Configuration MongoDB (ajustez selon votre configuration)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';

console.log('🔧 CORRECTION ERREUR INDEX USERNAME');
console.log('===================================');

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

// NOUVELLE FONCTION: Corriger l'erreur d'index username
async function fixUsernameIndexError() {
  console.log('\n🔧 CORRECTION INDEX USERNAME');
  console.log('=============================');
  
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // 1. Supprimer l'index problématique
    console.log('🗑️ Suppression index username_1...');
    try {
      await usersCollection.dropIndex('username_1');
      console.log('✅ Index username_1 supprimé');
    } catch (error) {
      console.log('ℹ️ Index username_1 n\'existait pas ou déjà supprimé');
    }
    
    // 2. Identifier et corriger les données problématiques
    console.log('🔍 Recherche des utilisateurs avec username null...');
    const nullUsernameUsers = await usersCollection.find({
      $or: [
        { username: null },
        { username: { $exists: false } },
        { username: "" }
      ]
    }).toArray();
    
    console.log(`📊 Trouvé ${nullUsernameUsers.length} utilisateurs avec username null/vide`);
    
    // 3. Assigner des usernames uniques
    if (nullUsernameUsers.length > 0) {
      console.log('🔧 Attribution usernames uniques...');
      
      for (let i = 0; i < nullUsernameUsers.length; i++) {
        const user = nullUsernameUsers[i];
        const uniqueUsername = `user_${user._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;
        
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { username: uniqueUsername } }
        );
        
        console.log(`  ✅ User ${user._id} → username: ${uniqueUsername}`);
      }
    }
    
    // 4. Recréer l'index de manière sécurisée
    console.log('🔨 Création nouvel index username sécurisé...');
    await usersCollection.createIndex(
      { username: 1 }, 
      { 
        unique: true, 
        sparse: true,  // Ignorer les valeurs null
        name: 'username_unique_safe',
        background: true  // Création en arrière-plan
      }
    );
    console.log('✅ Index username sécurisé créé');
    
    // 5. Vérification finale
    console.log('🔍 Vérification finale...');
    const totalUsers = await usersCollection.countDocuments();
    const usersWithUsername = await usersCollection.countDocuments({ 
      username: { $exists: true, $ne: null, $ne: "" } 
    });
    
    console.log(`� Total utilisateurs: ${totalUsers}`);
    console.log(`✅ Utilisateurs avec username valide: ${usersWithUsername}`);
    console.log(`🎯 Utilisateurs sans username: ${totalUsers - usersWithUsername}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur correction index username:', error.message);
    return false;
  }
}

async function cleanupTrades() {
  console.log('\n🔄 Nettoyage des trades orphelins...');
  
  try {
    // Supprimer les trades avec fromUser ou toUser null
    const result = await Trade.deleteMany({
      $or: [
        { fromUser: null },
        { toUser: null }
      ]
    });
    
    console.log(`✅ ${result.deletedCount} trades orphelins supprimés`);
    
    // Optionnel : supprimer les trades référençant des utilisateurs inexistants
    const allTrades = await Trade.find({}).populate('fromUser toUser', '_id');
    let invalidTrades = 0;
    
    for (const trade of allTrades) {
      if (!trade.fromUser || !trade.toUser) {
        await Trade.findByIdAndDelete(trade._id);
        invalidTrades++;
      }
    }
    
    if (invalidTrades > 0) {
      console.log(`✅ ${invalidTrades} trades avec utilisateurs inexistants supprimés`);
    }
    
    return result.deletedCount + invalidTrades;
  } catch (error) {
    console.error('❌ Erreur nettoyage trades:', error);
    return 0;
  }
}

async function cleanupObjects() {
  console.log('\n🔄 Nettoyage des objets orphelins...');
  
  try {
    // Supprimer les objets avec owner null
    const result = await Object.deleteMany({
      owner: null
    });
    
    console.log(`✅ ${result.deletedCount} objets orphelins supprimés`);
    
    // Optionnel : supprimer les objets référençant des propriétaires inexistants
    const allObjects = await Object.find({}).populate('owner', '_id');
    let invalidObjects = 0;
    
    for (const obj of allObjects) {
      if (!obj.owner) {
        await Object.findByIdAndDelete(obj._id);
        invalidObjects++;
      }
    }
    
    if (invalidObjects > 0) {
      console.log(`✅ ${invalidObjects} objets avec propriétaires inexistants supprimés`);
    }
    
    return result.deletedCount + invalidObjects;
  } catch (error) {
    console.error('❌ Erreur nettoyage objets:', error);
    return 0;
  }
}

async function cleanupReviews() {
  console.log('\n🔄 Nettoyage des avis orphelins...');
  
  try {
    // Supprimer les avis avec fromUser, toUser ou trade null
    const result = await Review.deleteMany({
      $or: [
        { fromUser: null },
        { toUser: null },
        { trade: null }
      ]
    });
    
    console.log(`✅ ${result.deletedCount} avis orphelins supprimés`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Erreur nettoyage avis:', error);
    return 0;
  }
}

async function cleanupEvents() {
  console.log('\n🔄 Nettoyage des événements orphelins...');
  
  try {
    // Supprimer les événements avec organizer null
    const result = await Event.deleteMany({
      organizer: null
    });
    
    console.log(`✅ ${result.deletedCount} événements orphelins supprimés`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Erreur nettoyage événements:', error);
    return 0;
  }
}

async function generateReport() {
  console.log('\n📊 Génération du rapport de nettoyage...');
  
  try {
    const stats = {
      users: await User.countDocuments(),
      trades: await Trade.countDocuments(),
      objects: await Object.countDocuments(),
      events: await Event.countDocuments(),
      reviews: await Review.countDocuments()
    };
    
    console.log('\n📈 STATISTIQUES FINALES:');
    console.log(`👥 Utilisateurs: ${stats.users}`);
    console.log(`🔄 Échanges: ${stats.trades}`);
    console.log(`📦 Objets: ${stats.objects}`);
    console.log(`📅 Événements: ${stats.events}`);
    console.log(`⭐ Avis: ${stats.reviews}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return null;
  }
}

async function main() {
  console.log('🧹 DÉMARRAGE DU NETTOYAGE DE LA BASE DE DONNÉES CADOK');
  console.log('======================================================');
  
  await connectDB();
  
  let totalCleaned = 0;
  
  // PRIORITÉ 1: Corriger l'erreur d'index username
  console.log('\n🔥 CORRECTION CRITIQUE: Index username');
  const indexFixed = await fixUsernameIndexError();
  if (!indexFixed) {
    console.log('⚠️ Échec correction index - Continuation du nettoyage...');
  }
  
  // Nettoyage des différentes collections
  totalCleaned += await cleanupTrades();
  totalCleaned += await cleanupObjects();
  totalCleaned += await cleanupReviews();
  totalCleaned += await cleanupEvents();
  
  // Rapport final
  await generateReport();
  
  console.log('\n🎯 RÉSULTATS DU NETTOYAGE:');
  console.log(`✅ Total d'éléments supprimés: ${totalCleaned}`);
  console.log(`🔧 Index username: ${indexFixed ? 'CORRIGÉ' : 'ERREUR'}`);
  
  if (totalCleaned === 0 && indexFixed) {
    console.log('🎉 Base de données parfaitement propre !');
  } else {
    console.log('🎉 Nettoyage terminé avec succès !');
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

module.exports = { main, cleanupTrades, cleanupObjects, cleanupReviews, cleanupEvents };
