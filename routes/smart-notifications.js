/**
 * Routes pour les notifications intelligentes
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');
const Object = require('../models/Object');
const Trade = require('../models/Trade');

/**
 * GET /api/notifications/smart
 * Récupère les notifications intelligentes pour un utilisateur
 */
router.get('/smart', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les données d'activité
    const [user, userObjects, userTrades, notifications] = await Promise.all([
      User.findById(userId),
      Object.find({ owner: userId }),
      Trade.find({ $or: [{ fromUser: userId }, { toUser: userId }] }),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer des alertes actives basées sur l'activité
    const activeAlerts = [];
    
    const pendingTrades = userTrades.filter(trade => trade.status === 'pending' || trade.status === 'proposed');
    if (pendingTrades.length > 0) {
      activeAlerts.push({
        id: 'pending_trades',
        type: 'trade',
        icon: 'time',
        color: '#FF9800',
        title: `${pendingTrades.length} échange(s) en attente`,
        description: 'Des propositions nécessitent votre attention',
        actionLabel: 'Voir les échanges',
        priority: 'high',
        createdAt: new Date().toISOString()
      });
    }

    if (userObjects.length === 0) {
      activeAlerts.push({
        id: 'no_objects',
        type: 'suggestion',
        icon: 'add-circle',
        color: '#2196F3',
        title: 'Ajoutez votre premier objet',
        description: 'Commencez à partager pour commencer les échanges',
        actionLabel: 'Ajouter un objet',
        priority: 'medium',
        createdAt: new Date().toISOString()
      });
    }

    // Générer des suggestions intelligentes
    const suggestions = [];
    
    if (userObjects.length > 0 && userTrades.length === 0) {
      suggestions.push({
        id: 'start_trading',
        type: 'recommendation',
        icon: 'swap-horizontal',
        color: '#4CAF50',
        title: 'Commencez à échanger',
        description: 'Vos objets sont prêts, explorez ceux des autres utilisateurs',
        actionLabel: 'Explorer',
        category: 'trading'
      });
    }

    if (userTrades.length > 0) {
      const successRate = userTrades.filter(t => t.status === 'completed').length / userTrades.length;
      if (successRate > 0.7) {
        suggestions.push({
          id: 'expert_trader',
          type: 'achievement',
          icon: 'trophy',
          color: '#9C27B0',
          title: 'Excellent troqueur !',
          description: `${Math.round(successRate * 100)}% de réussite dans vos échanges`,
          actionLabel: 'Voir vos succès',
          category: 'performance'
        });
      }
    }

    // Générer l'activité récente
    const activity = [];
    
    // Ajouter les trades récents
    const recentTrades = userTrades
      .filter(trade => {
        const tradeDate = new Date(trade.updatedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return tradeDate > weekAgo;
      })
      .slice(0, 5);

    recentTrades.forEach(trade => {
      activity.push({
        id: `trade_${trade._id}`,
        type: 'trade_update',
        icon: trade.status === 'completed' ? 'checkmark-circle' : 'time',
        color: trade.status === 'completed' ? '#4CAF50' : '#FF9800',
        title: trade.status === 'completed' ? 'Échange réussi' : 'Échange en cours',
        description: `Échange ${trade.status === 'completed' ? 'finalisé' : 'mis à jour'}`,
        timestamp: trade.updatedAt,
        relatedId: trade._id
      });
    });

    // Ajouter les objets récents
    const recentObjects = userObjects
      .filter(obj => {
        const objDate = new Date(obj.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return objDate > weekAgo;
      })
      .slice(0, 3);

    recentObjects.forEach(obj => {
      activity.push({
        id: `object_${obj._id}`,
        type: 'object_added',
        icon: 'cube',
        color: '#2196F3',
        title: 'Objet ajouté',
        description: `"${obj.title}" ajouté à votre vitrine`,
        timestamp: obj.createdAt,
        relatedId: obj._id
      });
    });

    // Trier l'activité par date
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const response = {
      activeAlerts: activeAlerts.slice(0, 5),
      suggestions: suggestions.slice(0, 3),
      activity: activity.slice(0, 10),
      stats: {
        totalNotifications: notifications.length,
        unreadCount: notifications.filter(n => !n.read).length,
        activeAlertsCount: activeAlerts.length,
        lastActivity: activity.length > 0 ? activity[0].timestamp : null
      },
      preferences: user.notificationPreferences || {
        push: true,
        email: false,
        sms: false,
        inApp: true
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Erreur récupération notifications intelligentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications intelligentes',
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/smart/mark-read
 * Marquer une notification comme lue
 */
router.post('/smart/mark-read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'ID de notification requis'
      });
    }

    // Pour l'instant, on simule juste la lecture
    console.log(`📖 Notification ${notificationId} marquée comme lue pour l'utilisateur ${req.user.id}`);

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/smart/preferences
 * Mettre à jour les préférences de notifications
 */
router.put('/smart/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { push, email, sms, inApp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les préférences
    user.notificationPreferences = {
      push: push !== undefined ? push : user.notificationPreferences?.push || true,
      email: email !== undefined ? email : user.notificationPreferences?.email || false,
      sms: sms !== undefined ? sms : user.notificationPreferences?.sms || false,
      inApp: inApp !== undefined ? inApp : user.notificationPreferences?.inApp || true
    };

    await user.save();

    res.json({
      success: true,
      preferences: user.notificationPreferences,
      message: 'Préférences de notifications mises à jour'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour préférences notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des préférences',
      error: error.message
    });
  }
});

module.exports = router;
