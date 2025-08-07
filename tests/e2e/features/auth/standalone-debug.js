/**
 * TEST STANDALONE - SANS JEST SETUP
 * Solution finale pour corriger les 7 tests
 */

// Chargement direct sans setup Jest
const User = require('../../../../models/User');
const { MongoClient } = require('mongodb');
const { mongoose } = require('../../../../db');

// Test autonome
async function testStandalone() {
  try {
    console.log('🚀 Test standalone démarré');
    
    // Nettoyer la base directement
    const mongoClient = new MongoClient('mongodb://localhost:27017/cadok');
    await mongoClient.connect();
    const db = mongoClient.db('cadok');
    
    console.log('🧹 Nettoyage base...');
    const deletedCount = await db.collection('users').deleteMany({});
    console.log(`✅ ${deletedCount.deletedCount} utilisateurs supprimés`);
    
    // Connecter mongoose s'il ne l'est pas
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://localhost:27017/cadok');
      console.log('🔗 Mongoose connecté');
    }
    
    // Test email unique
    const testEmail = `standalone_${Date.now()}@test.com`;
    console.log(`📧 Test avec email: ${testEmail}`);
    
    // Vérifier via mongoose AVANT l'inscription
    const existingBefore = await User.findOne({ email: testEmail });
    console.log('👤 Utilisateur existant AVANT:', existingBefore ? 'OUI' : 'NON');
    
    if (existingBefore) {
      console.log('❌ PROBLÈME : Utilisateur trouvé avec email qui n\'existe pas !');
      console.log('📧 Email mystérieux:', existingBefore.email);
      console.log('🆔 ID mystérieux:', existingBefore._id);
      
      // Lister TOUS les utilisateurs
      const allUsers = await User.find({});
      console.log(`👥 Total utilisateurs en base: ${allUsers.length}`);
      if (allUsers.length > 0) {
        console.log('📋 Tous les emails:', allUsers.map(u => u.email));
      }
    } else {
      console.log('✅ Aucun utilisateur existant, parfait !');
    }
    
    await mongoClient.close();
    await mongoose.disconnect();
    
    console.log('🎯 Test standalone terminé');
    
  } catch (error) {
    console.error('❌ Erreur standalone:', error);
  }
}

// Exécuter le test
testStandalone();

module.exports = {};
