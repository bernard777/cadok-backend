/**
 * 🔔 SERVICE NOTIFICATIONS INTELLIGENTES - CADOK
 * Système de notifications contextuelles et personnalisées
 */

const User = require('../models/User');
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const Notification = require('../models/Notification');
const moment = require('moment');

class SmartNotificationService {

  /**
   * 🎯 Envoi de notifications contextuelles
   */
  async sendContextualNotifications() {
    try {
      console.log('🔔 Démarrage des notifications intelligentes...');

      const results = await Promise.all([
        this.sendLocationBasedNotifications(),
        this.sendTimingBasedNotifications(),
        this.sendUrgencyNotifications(),
        this.sendSeasonalNotifications(),
        this.sendEngagementNotifications()
      ]);

      const totalSent = results.reduce((sum, result) => sum + result.sent, 0);

      return {
        success: true,
        totalSent,
        breakdown: {
          location: results[0].sent,
          timing: results[1].sent,
          urgency: results[2].sent,
          seasonal: results[3].sent,
          engagement: results[4].sent
        }
      };

    } catch (error) {
      console.error('❌ Erreur notifications intelligentes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📍 Notifications basées sur la géolocalisation
   */
  async sendLocationBasedNotifications() {
    console.log('📍 Notifications géolocalisées...');
    
    const users = await User.find({ 
      city: { $exists: true },
      notificationPreferences: { $exists: true }
    });

    let sent = 0;

    for (const user of users) {
      if (!this.canReceiveNotification(user, 'location')) continue;

      // Objets proches de l'utilisateur
      const nearbyObjects = await ObjectModel.find({
        owner: { $ne: user._id },
        status: 'available',
        // Simulation de proximité par ville
        $or: [
          { 'location.city': user.city },
          { 'location.zipCode': { $regex: user.city.substring(0, 2) } }
        ]
      }).limit(5);

      if (nearbyObjects.length > 0) {
        await this.createNotification({
          userId: user._id,
          type: 'location_based',
          title: `${nearbyObjects.length} objets près de chez vous !`,
          message: `Découvrez ${nearbyObjects.length} nouveaux objets à échanger dans votre région`,
          data: {
            objectIds: nearbyObjects.map(o => o._id),
            city: user.city
          },
          priority: 'medium'
        });
        sent++;
      }
    }

    return { sent };
  }

  /**
   * ⏰ Notifications basées sur le timing optimal
   */
  async sendTimingBasedNotifications() {
    console.log('⏰ Notifications timing optimal...');
    
    const users = await User.find({
      notificationPreferences: { $exists: true }
    });

    let sent = 0;
    const currentHour = moment().hour();
    const currentDay = moment().format('dddd');

    for (const user of users) {
      if (!this.canReceiveNotification(user, 'timing')) continue;

      const optimalTime = await this.calculateOptimalNotificationTime(user._id);
      
      // Si c'est le moment optimal pour cet utilisateur
      if (this.isOptimalTime(currentHour, currentDay, optimalTime)) {
        
        // Objets en attente d'action
        const pendingTrades = await Trade.find({
          $or: [{ fromUser: user._id }, { toUser: user._id }],
          status: { $in: ['pending', 'accepted'] }
        });

        if (pendingTrades.length > 0) {
          await this.createNotification({
            userId: user._id,
            type: 'timing_optimal',
            title: 'C\'est le moment parfait pour échanger !',
            message: `Vous avez ${pendingTrades.length} échanges en attente`,
            data: {
              tradeIds: pendingTrades.map(t => t._id),
              optimalTime: true
            },
            priority: 'high'
          });
          sent++;
        }
      }
    }

    return { sent };
  }

  /**
   * 🚨 Notifications d'urgence (objet recherché disponible)
   */
  async sendUrgencyNotifications() {
    console.log('🚨 Notifications urgence...');
    
    let sent = 0;

    // Trouver les objets récemment ajoutés
    const recentObjects = await ObjectModel.find({
      status: 'available',
      createdAt: { $gte: moment().subtract(1, 'hour').toDate() }
    }).populate('category owner');

    for (const object of recentObjects) {
      // Trouver les utilisateurs intéressés par cette catégorie
      const interestedUsers = await User.find({
        _id: { $ne: object.owner._id },
        favoriteCategories: object.category,
        city: object.owner.city, // Même ville pour l'urgence
        notificationPreferences: { $exists: true }
      });

      for (const user of interestedUsers) {
        if (!this.canReceiveNotification(user, 'urgency')) continue;

        await this.createNotification({
          userId: user._id,
          type: 'urgency',
          title: '🔥 Objet rare disponible !',
          message: `"${object.title}" vient d'être ajouté dans votre catégorie favorite`,
          data: {
            objectId: object._id,
            category: object.category,
            urgent: true
          },
          priority: 'high'
        });
        sent++;
      }
    }

    return { sent };
  }

  /**
   * 🍂 Notifications saisonnières
   */
  async sendSeasonalNotifications() {
    console.log('🍂 Notifications saisonnières...');
    
    const currentSeason = this.getCurrentSeason();
    const seasonalKeywords = this.getSeasonalKeywords(currentSeason);
    
    let sent = 0;

    if (seasonalKeywords.length > 0) {
      // Objets saisonniers disponibles
      const seasonalObjects = await ObjectModel.find({
        status: 'available',
        $or: seasonalKeywords.map(keyword => ({
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } }
          ]
        }))
      });

      if (seasonalObjects.length > 0) {
        const users = await User.find({
          notificationPreferences: { $exists: true }
        });

        for (const user of users.slice(0, 50)) { // Limiter pour éviter le spam
          if (!this.canReceiveNotification(user, 'seasonal')) continue;

          await this.createNotification({
            userId: user._id,
            type: 'seasonal',
            title: `🍂 ${currentSeason} : objets de saison disponibles`,
            message: `${seasonalObjects.length} objets parfaits pour ${currentSeason.toLowerCase()}`,
            data: {
              season: currentSeason,
              objectIds: seasonalObjects.slice(0, 10).map(o => o._id)
            },
            priority: 'low'
          });
          sent++;
        }
      }
    }

    return { sent };
  }

  /**
   * 💪 Notifications d'engagement (réactivation)
   */
  async sendEngagementNotifications() {
    console.log('💪 Notifications engagement...');
    
    let sent = 0;

    // Utilisateurs inactifs depuis 7 jours
    const inactiveUsers = await User.find({
      lastActiveAt: { $lt: moment().subtract(7, 'days').toDate() },
      notificationPreferences: { $exists: true }
    });

    for (const user of inactiveUsers) {
      if (!this.canReceiveNotification(user, 'engagement')) continue;

      // Calculer ce qui s'est passé pendant son absence
      const newObjectsCount = await ObjectModel.countDocuments({
        createdAt: { $gte: user.lastActiveAt || user.createdAt },
        status: 'available'
      });

      const engagementMessage = this.getEngagementMessage(user, newObjectsCount);

      await this.createNotification({
        userId: user._id,
        type: 'engagement',
        title: 'On vous a manqué ! 💚',
        message: engagementMessage,
        data: {
          newObjectsCount,
          daysInactive: moment().diff(user.lastActiveAt || user.createdAt, 'days')
        },
        priority: 'medium'
      });
      sent++;
    }

    return { sent };
  }

  /**
   * 🎯 Notifications personnalisées pour un utilisateur
   */
  async sendPersonalizedNotification(userId, type, customData = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || !this.canReceiveNotification(user, type)) {
        return { success: false, reason: 'User cannot receive this notification' };
      }

      let notification;

      switch (type) {
        case 'trade_match':
          notification = await this.createTradeMatchNotification(userId, customData);
          break;
        case 'price_drop':
          notification = await this.createPriceDropNotification(userId, customData);
          break;
        case 'milestone':
          notification = await this.createMilestoneNotification(userId, customData);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      return { success: true, notification };

    } catch (error) {
      console.error('❌ Erreur notification personnalisée:', error);
      return { success: false, error: error.message };
    }
  }

  // 🛠️ MÉTHODES UTILITAIRES

  canReceiveNotification(user, type) {
    if (!user.notificationPreferences) return false;
    
    const prefs = user.notificationPreferences;
    
    // Vérifications générales
    if (prefs.notifications_push === false) return false;
    
    // Vérifications spécifiques par type
    switch (type) {
      case 'location':
        return prefs.locationBased !== false;
      case 'timing':
        return prefs.timingOptimized !== false;
      case 'urgency':
        return prefs.urgentAlerts !== false;
      case 'seasonal':
        return prefs.seasonal !== false;
      case 'engagement':
        return prefs.reactivation !== false;
      default:
        return true;
    }
  }

  async calculateOptimalNotificationTime(userId) {
    // Analyser l'historique d'activité de l'utilisateur
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    }).sort({ createdAt: -1 }).limit(20);

    if (trades.length === 0) {
      return { hour: 18, day: 'Tuesday' }; // Défaut
    }

    const hourCounts = {};
    const dayCounts = {};

    trades.forEach(trade => {
      const hour = moment(trade.createdAt).hour();
      const day = moment(trade.createdAt).format('dddd');
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const optimalHour = Object.entries(hourCounts).reduce((max, [hour, count]) => 
      count > max.count ? { hour: parseInt(hour), count } : max, { hour: 18, count: 0 });

    const optimalDay = Object.entries(dayCounts).reduce((max, [day, count]) => 
      count > max.count ? { day, count } : max, { day: 'Tuesday', count: 0 });

    return {
      hour: optimalHour.hour,
      day: optimalDay.day
    };
  }

  isOptimalTime(currentHour, currentDay, optimalTime) {
    return currentHour === optimalTime.hour && currentDay === optimalTime.day;
  }

  getCurrentSeason() {
    const month = moment().month();
    if (month >= 2 && month <= 4) return 'Printemps';
    if (month >= 5 && month <= 7) return 'Été';
    if (month >= 8 && month <= 10) return 'Automne';
    return 'Hiver';
  }

  getSeasonalKeywords(season) {
    const keywords = {
      'Printemps': ['printemps', 'jardinage', 'vélo', 'sport', 'randonnée'],
      'Été': ['été', 'plage', 'camping', 'vacances', 'piscine', 'barbecue'],
      'Automne': ['automne', 'rentrée', 'école', 'manteau', 'pull'],
      'Hiver': ['hiver', 'ski', 'noël', 'fête', 'chauffage', 'manteau']
    };
    return keywords[season] || [];
  }

  getEngagementMessage(user, newObjectsCount) {
    const messages = [
      `${newObjectsCount} nouveaux objets vous attendent !`,
      `La communauté s'est agrandie : ${newObjectsCount} nouvelles opportunités d'échange`,
      `Découvrez ${newObjectsCount} objets ajoutés récemment`,
      `Votre prochain échange parfait vous attend parmi ${newObjectsCount} nouveaux objets`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async createTradeMatchNotification(userId, data) {
    return this.createNotification({
      userId,
      type: 'trade_match',
      title: '🎯 Match parfait trouvé !',
      message: `L'objet "${data.objectName}" correspond parfaitement à vos recherches`,
      data,
      priority: 'high'
    });
  }

  async createPriceDropNotification(userId, data) {
    return this.createNotification({
      userId,
      type: 'price_drop',
      title: '📉 Baisse de valeur détectée',
      message: `L'objet "${data.objectName}" a une valeur plus accessible maintenant`,
      data,
      priority: 'medium'
    });
  }

  async createMilestoneNotification(userId, data) {
    return this.createNotification({
      userId,
      type: 'milestone',
      title: '🏆 Félicitations !',
      message: `Vous avez atteint ${data.milestone} échanges réussis !`,
      data,
      priority: 'medium'
    });
  }

  async createNotification(notificationData) {
    try {
      const notification = new Notification({
        user: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        priority: notificationData.priority || 'medium',
        read: false,
        createdAt: new Date()
      });

      const saved = await notification.save();
      
      // Ici on pourrait intégrer avec un service de push (Firebase, OneSignal, etc.)
      console.log(`📱 Notification créée: ${notificationData.title} -> User ${notificationData.userId}`);
      
      return saved;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      throw error;
    }
  }
}

module.exports = SmartNotificationService;
