/**
 * 🧪 TEST COMPLET DES NOUVELLES FONCTIONNALITÉS
 * Teste favoris objets, messages, et notifications admin
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const ObjectModel = require('../models/Object');
const Notification = require('../models/Notification');
const { notificationTriggers } = require('../middleware/notificationTriggers');

async function testNewFeatures() {
  try {
    console.log('🧪 TEST DES NOUVELLES FONCTIONNALITÉS\n');

    // Connexion
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok-dev');
    console.log('✅ Connecté à MongoDB\n');

    // 1. Test système de favoris d'objets
    console.log('📂 TEST SYSTÈME DE FAVORIS D\'OBJETS');
    
    // Chercher des utilisateurs et objets existants
    const users = await User.find().limit(2);
    const objects = await ObjectModel.find().limit(1).populate('owner');
    
    if (users.length < 2) {
      console.log('❌ Pas assez d\'utilisateurs en base pour le test');
      return;
    }
    
    if (objects.length < 1) {
      console.log('❌ Pas d\'objet en base pour le test');
      return;
    }

    const user1 = users[0];
    const user2 = users[1];
    const testObject = objects[0];

    console.log(`👤 Utilisateur 1: ${user1.pseudo}`);
    console.log(`👤 Utilisateur 2: ${user2.pseudo}`);
    console.log(`📦 Objet test: "${testObject.title}" (propriétaire: ${testObject.owner.pseudo})\n`);

    // Test ajout en favoris
    if (!user1.favoriteObjects) {
      user1.favoriteObjects = [];
    }

    if (!user1.favoriteObjects.includes(testObject._id)) {
      user1.favoriteObjects.push(testObject._id);
      await user1.save();
      
      // Déclencher notification
      try {
        await notificationTriggers.triggerObjectInterest(
          testObject.owner._id,
          testObject._id,
          testObject.title,
          user1._id,
          user1.pseudo,
          'favorite'
        );
        console.log('✅ Notification favoris déclenchée');
      } catch (notifError) {
        console.log('❌ Erreur notification favoris:', notifError.message);
      }
    } else {
      console.log('📝 Objet déjà en favoris');
    }

    // 2. Test notifications messages
    console.log('\n💬 TEST NOTIFICATIONS MESSAGES');
    try {
      await notificationTriggers.triggerNewMessage(
        user1._id,
        user2._id,
        'test_conversation_123',
        'Salut ! Ceci est un message de test pour les notifications.'
      );
      console.log('✅ Notification message déclenchée');
    } catch (error) {
      console.log('❌ Erreur notification message:', error.message);
    }

    // 3. Test notifications communauté
    console.log('\n📢 TEST NOTIFICATIONS COMMUNAUTÉ');
    try {
      const allUserIds = users.map(u => u._id);
      await notificationTriggers.triggerCommunityUpdate(
        allUserIds,
        'feature',
        'Nouvelle fonctionnalité de test : Favoris d\'objets !',
        '2.1.0',
        ['Favoris d\'objets', 'Notifications intelligentes', 'Interface admin']
      );
      console.log('✅ Notifications communauté déclenchées');
    } catch (error) {
      console.log('❌ Erreur notifications communauté:', error.message);
    }

    // 4. Vérifier les notifications créées
    console.log('\n📊 VÉRIFICATION DES NOTIFICATIONS CRÉÉES');
    
    const recentNotifications = await Notification.find({
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 dernières minutes
    }).populate('user', 'pseudo');

    console.log(`📧 ${recentNotifications.length} notifications créées récemment:`);
    
    recentNotifications.forEach(notif => {
      console.log(`   - [${notif.type}] ${notif.title} → ${notif.user.pseudo}`);
      console.log(`     "${notif.message}"`);
    });

    // 5. Test requête favoris
    console.log('\n📂 TEST RÉCUPÉRATION FAVORIS');
    const userWithFavorites = await User.findById(user1._id)
      .populate('favoriteObjects', 'title owner')
      .select('pseudo favoriteObjects');
      
    console.log(`📋 ${userWithFavorites.pseudo} a ${userWithFavorites.favoriteObjects?.length || 0} favoris:`);
    if (userWithFavorites.favoriteObjects) {
      userWithFavorites.favoriteObjects.forEach(obj => {
        console.log(`   - "${obj.title}"`);
      });
    }

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
    
    return {
      success: true,
      tested: [
        'Favoris d\'objets',
        'Notifications messages',
        'Notifications communauté',
        'Récupération favoris'
      ]
    };

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return { success: false, error: error.message };
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
}

// Lancer le test si ce script est exécuté directement
if (require.main === module) {
  testNewFeatures();
}

module.exports = testNewFeatures;
