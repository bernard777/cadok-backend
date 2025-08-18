const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
  }

  // Envoyer une notification push via Expo avec préférences utilisateur
  async sendPushNotification(userToken, title, body, data = {}, userId = null) {
    if (!userToken || !Expo.isExpoPushToken(userToken)) {
      console.warn('⚠️ Token push invalide:', userToken);
      return false;
    }

    try {
      // Récupérer les préférences utilisateur si userId fourni
      let soundSetting = 'default';
      if (userId) {
        try {
          const user = await User.findById(userId).select('notificationPreferences');
          if (user?.notificationPreferences) {
            // Respecter les préférences sonores de l'utilisateur
            soundSetting = user.notificationPreferences.sound !== false ? 'default' : null;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de récupérer les préférences utilisateur:', error);
        }
      }

      const message = {
        to: userToken,
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      };

      // Ajouter le son seulement si activé dans les préférences
      if (soundSetting) {
        message.sound = soundSetting;
      }

      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('❌ Erreur envoi push notification chunk:', error);
        }
      }

      console.log('✅ Notification push envoyée:', title, `(son: ${soundSetting || 'silencieux'})`);
      return true;
    } catch (error) {
      console.error('❌ Erreur notification push:', error);
      return false;
    }
  }

  // Envoyer notification de favori avec préférences
  async sendFavoriteNotification(userToken, fromUserName, objectTitle, userId = null) {
    return await this.sendPushNotification(
      userToken,
      '❤️ Nouvel intérêt',
      `${fromUserName} a ajouté "${objectTitle}" à ses favoris`,
      {
        type: 'object_favorite',
        fromUserName,
        objectTitle
      },
      userId
    );
  }

  // Envoyer notification d'échange avec préférences
  async sendTradeNotification(userToken, fromUserName, action, userId = null) {
    const titles = {
      'request': '🔄 Nouvelle proposition',
      'accepted': '✅ Échange accepté',
      'declined': '❌ Échange refusé'
    };

    const bodies = {
      'request': `${fromUserName} vous propose un échange`,
      'accepted': `${fromUserName} a accepté votre proposition`,
      'declined': `${fromUserName} a refusé votre proposition`
    };

    return await this.sendPushNotification(
      userToken,
      titles[action] || '🔔 Notification',
      bodies[action] || `Nouvelle activité de ${fromUserName}`,
      {
        type: `trade_${action}`,
        fromUserName
      },
      userId
    );
  }
}

module.exports = new PushNotificationService();
