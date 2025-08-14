/**
 * 🔔 MIDDLEWARE DE DÉCLENCHEMENT AUTOMATIQUE DES NOTIFICATIONS
 * Déclenche les notifications appropriées lors d'actions spécifiques
 */

const SmartNotificationService = require('../services/smartNotificationService');

class NotificationTriggers {
  constructor() {
    this.smartNotificationService = new SmartNotificationService();
  }

  /**
   * 💬 Déclencher notification nouveau message
   */
  async triggerNewMessage(senderId, receiverId, conversationId, messagePreview) {
    try {
      console.log(`🔔 Déclenchement notification nouveau message: ${senderId} → ${receiverId}`);
      
      const result = await this.smartNotificationService.sendPersonalizedNotification(
        receiverId,
        'new_message',
        {
          senderId,
          senderName: 'Un utilisateur', // À récupérer depuis la DB
          conversationId,
          messagePreview: messagePreview.substring(0, 100)
        }
      );

      return result;
    } catch (error) {
      console.error('❌ Erreur déclenchement notification message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔄 Déclencher notification mise à jour échange
   */
  async triggerTradeUpdate(tradeId, userId, newStatus, otherUserName) {
    try {
      console.log(`🔔 Déclenchement notification trade update: ${tradeId} → ${newStatus}`);
      
      const result = await this.smartNotificationService.sendPersonalizedNotification(
        userId,
        'trade_update',
        {
          tradeId,
          newStatus,
          otherUserName
        }
      );

      return result;
    } catch (error) {
      console.error('❌ Erreur déclenchement notification échange:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 👀 Déclencher notification intérêt objet
   */
  async triggerObjectInterest(ownerId, objectId, objectName, interestedUserId, interestedUserName, interestType = 'view') {
    try {
      console.log(`🔔 Déclenchement notification intérêt objet: ${objectId} par ${interestedUserId}`);
      
      const result = await this.smartNotificationService.sendPersonalizedNotification(
        ownerId,
        'object_interest',
        {
          objectId,
          objectName,
          interestedUserId,
          interestedUserName,
          interestType
        }
      );

      return result;
    } catch (error) {
      console.error('❌ Erreur déclenchement notification intérêt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📢 Déclencher notification mise à jour communauté
   */
  async triggerCommunityUpdate(userIds, updateType, message, version = null, features = []) {
    try {
      console.log(`🔔 Déclenchement notification communauté: ${updateType} pour ${userIds.length} utilisateurs`);
      
      const results = [];
      
      for (const userId of userIds) {
        const result = await this.smartNotificationService.sendPersonalizedNotification(
          userId,
          'community_update',
          {
            updateType,
            message,
            version,
            features
          }
        );
        results.push({ userId, result });
      }

      const successCount = results.filter(r => r.result.success).length;
      
      return {
        success: true,
        totalSent: successCount,
        results
      };
    } catch (error) {
      console.error('❌ Erreur déclenchement notification communauté:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🎯 Déclencher match d'échange
   */
  async triggerTradeMatch(userId, objectName, matchDetails) {
    try {
      console.log(`🔔 Déclenchement notification match échange: ${objectName} pour ${userId}`);
      
      const result = await this.smartNotificationService.sendPersonalizedNotification(
        userId,
        'trade_match',
        {
          objectName,
          ...matchDetails
        }
      );

      return result;
    } catch (error) {
      console.error('❌ Erreur déclenchement notification match:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🏆 Déclencher notification milestone
   */
  async triggerMilestone(userId, milestone, details) {
    try {
      console.log(`🔔 Déclenchement notification milestone: ${milestone} pour ${userId}`);
      
      const result = await this.smartNotificationService.sendPersonalizedNotification(
        userId,
        'milestone',
        {
          milestone,
          ...details
        }
      );

      return result;
    } catch (error) {
      console.error('❌ Erreur déclenchement notification milestone:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instance singleton
const notificationTriggers = new NotificationTriggers();

// Middleware Express pour déclencher automatiquement les notifications
const autoNotifyMiddleware = (type) => {
  return async (req, res, next) => {
    // Ajouter les données de déclenchement à la request
    req.notificationTrigger = {
      type,
      trigger: (data) => {
        // Déclencher de manière asynchrone après la réponse
        setImmediate(async () => {
          try {
            switch (type) {
              case 'new_message':
                await notificationTriggers.triggerNewMessage(
                  data.senderId,
                  data.receiverId,
                  data.conversationId,
                  data.messagePreview
                );
                break;
              case 'trade_update':
                await notificationTriggers.triggerTradeUpdate(
                  data.tradeId,
                  data.userId,
                  data.newStatus,
                  data.otherUserName
                );
                break;
              case 'object_interest':
                await notificationTriggers.triggerObjectInterest(
                  data.ownerId,
                  data.objectId,
                  data.objectName,
                  data.interestedUserId,
                  data.interestedUserName,
                  data.interestType
                );
                break;
            }
          } catch (error) {
            console.error('❌ Erreur middleware notification:', error);
          }
        });
      }
    };
    next();
  };
};

module.exports = {
  NotificationTriggers,
  notificationTriggers,
  autoNotifyMiddleware
};
