/**
 * 🔔 ROUTES NOTIFICATIONS - CADOK
 * API pour les notifications intelligentes
 */

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middlewares/auth'); // Assuming you have auth middleware
const SmartNotificationService = require('../services/smartNotificationService');

const notificationService = new SmartNotificationService();

/**
 * POST /api/notifications/send-contextual
 * Envoie des notifications contextuelles
 */
router.post('/send-contextual', authMiddleware, async (req, res) => {
  try {
    const result = await notificationService.sendContextualNotifications();
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur notifications contextuelles:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/notifications/send-location-based
 * Notifications basées sur la géolocalisation
 */
router.post('/send-location-based', authMiddleware, async (req, res) => {
  try {
    const result = await notificationService.sendLocationBasedNotifications();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('❌ Erreur notifications géolocalisées:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/notifications/personalized/:type
 * Notification personnalisée
 */
router.post('/personalized/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const result = await notificationService.sendPersonalizedNotification(
      req.user.id, 
      type, 
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur notification personnalisée:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /notifications - Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('trade', 'status requestedObjects offeredObjects')
      .sort({ createdAt: -1 })
      .limit(50); // Limiter à 50 notifications récentes
    
    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notifications' });
  }
});

/**
 * GET /api/notifications/user
 * Récupérer les notifications d'un utilisateur avec pagination
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments({ user: req.user.id });
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        unreadCount
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PATCH /notifications/:id/read - Marquer une notification comme lue
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ message: 'Erreur serveur lors du marquage comme lu' });
  }
});

// PATCH /notifications/mark-all-read - Marquer toutes les notifications comme lues
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors du marquage global comme lu:', error);
    res.status(500).json({ message: 'Erreur serveur lors du marquage global comme lu' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marquer toutes les notifications comme lues (nouvelle version)
 */
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { 
        read: true,
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ 
      success: true, 
      updatedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('❌ Erreur marquage toutes lues:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /notifications/unread-count - Compter les notifications non lues
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id, 
      isRead: false 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    res.status(500).json({ message: 'Erreur serveur lors du comptage' });
  }
});

// DELETE /notifications/:id - Supprimer une notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
});

/**
 * GET /api/notifications/stats
 * Statistiques des notifications
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [total, unread, byType] = await Promise.all([
      Notification.countDocuments({ user: req.user.id }),
      Notification.countDocuments({ user: req.user.id, read: false }),
      Notification.aggregate([
        { $match: { user: req.user.id } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats notifications:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Fonction utilitaire pour créer une notification
const createNotification = async (userId, message, type, tradeId = null) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
      trade: tradeId,
      isRead: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

/**
 * GET /api/notifications/smart
 * Récupère les notifications intelligentes pour l'utilisateur
 */
router.get('/smart', authMiddleware, async (req, res) => {
  try {
    const notifications = await notificationService.getSmartNotifications(req.user.id);
    
    res.json({
      success: true,
      notifications: notifications || [],
      message: 'Notifications intelligentes récupérées avec succès'
    });
  } catch (error) {
    console.error('Erreur récupération notifications intelligentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications intelligentes'
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Mettre à jour les préférences de notifications d'un utilisateur
 */
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Mettre à jour les préférences de notifications dans le profil utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          [`notificationPreferences.${Object.keys(preferences)[0]}`]: Object.values(preferences)[0] 
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    console.log(`✅ Préférences notifications mises à jour pour ${user.pseudo}:`, preferences);

    res.json({
      success: true,
      message: 'Préférences de notifications mises à jour',
      preferences: user.notificationPreferences || {}
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour préférences notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des préférences'
    });
  }
});

/**
 * GET /api/notifications/preferences
 * Récupérer les préférences de notifications d'un utilisateur
 */
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Préférences par défaut si elles n'existent pas
    const defaultPreferences = {
      newMessages: true,
      tradeUpdates: true,
      objectInterest: true,
      marketingTips: false,
      communityUpdates: true,
      smartSuggestions: true,
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      frequency: 'normal'
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    res.json({
      success: true,
      preferences: preferences
    });

  } catch (error) {
    console.error('❌ Erreur récupération préférences notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des préférences'
    });
  }
});

// 🔔 CRÉATION DE NOTIFICATIONS SPÉCIFIQUES
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { userId, type, data } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({ error: 'userId et type sont requis' });
    }

    const result = await notificationService.sendPersonalizedNotification(userId, type, data);

    if (result.success) {
      res.json({
        success: true,
        notification: result.notification,
        message: 'Notification envoyée avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.reason || result.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
  }
});

// 🎯 DÉCLENCHEMENT DES NOTIFICATIONS INTELLIGENTES
router.post('/smart-send', authMiddleware, async (req, res) => {
  try {
    const results = await notificationService.sendContextualNotifications();

    res.json({
      success: true,
      results,
      message: `${results.totalSent || 0} notifications envoyées`
    });

  } catch (error) {
    console.error('❌ Erreur notifications intelligentes:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications intelligentes' });
  }
});

// 🧪 ROUTE DE TEST DES NOTIFICATIONS
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'new_message' } = req.body;
    
    const testData = {
      'new_message': {
        senderName: 'Test User',
        messagePreview: 'Ceci est un message de test',
        conversationId: 'test_conv_123'
      },
      'trade_update': {
        tradeId: 'test_trade_123',
        newStatus: 'accepted',
        otherUserName: 'Test User'
      },
      'object_interest': {
        objectId: 'test_obj_123',
        objectName: 'Objet de test',
        interestedUserName: 'Test User',
        interestType: 'view'
      }
    };

    const result = await notificationService.sendPersonalizedNotification(
      userId, 
      type, 
      testData[type] || {}
    );

    res.json({
      success: true,
      result,
      message: 'Notification de test envoyée'
    });

  } catch (error) {
    console.error('❌ Erreur test notification:', error);
    res.status(500).json({ error: 'Erreur lors du test de notification' });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
