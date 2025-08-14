/**
 * 🧪 TEST RAPIDE DU SYSTÈME DE NOTIFICATIONS
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const SmartNotificationService = require('../services/smartNotificationService');

async function quickTest() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok-dev');
    console.log('✅ Connecté !');
    
    console.log('🎯 Test du service de notifications...');
    const service = new SmartNotificationService();
    console.log('✅ Service créé !');
    
    // Chercher un utilisateur existant
    const existingUser = await User.findOne().limit(1);
    if (existingUser) {
      console.log('👤 Utilisateur trouvé:', existingUser.pseudo);
      
      // Test des préférences
      const canReceive = service.canReceiveNotification(existingUser, 'new_messages');
      console.log('📋 Peut recevoir des notifications:', canReceive);
      
      // Test d'envoi de notification
      console.log('📤 Test d\'envoi de notification...');
      const result = await service.sendPersonalizedNotification(
        existingUser._id,
        'new_message',
        {
          senderName: 'Test System',
          messagePreview: 'Ceci est un test de notification',
          conversationId: 'test_123'
        }
      );
      
      if (result.success) {
        console.log('✅ Notification créée avec succès !');
        console.log('📧 ID:', result.notification._id);
        console.log('📝 Titre:', result.notification.title);
        console.log('💬 Message:', result.notification.message);
      } else {
        console.log('❌ Échec:', result.error || result.reason);
      }
    } else {
      console.log('❌ Aucun utilisateur trouvé en base');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

quickTest();
