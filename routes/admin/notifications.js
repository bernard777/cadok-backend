/**
 * 📢 INTERFACE ADMIN POUR NOTIFICATIONS COMMUNAUTÉ - CADOK
 * Permet aux admins de déclencher des notifications à tous les utilisateurs
 */

const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { requireAdmin } = require('../../middlewares/adminAuth');
const User = require('../../models/User');
const { notificationTriggers } = require('../../middleware/notificationTriggers');

/**
 * POST /api/admin/notifications/community-update
 * Envoyer une notification communauté à tous les utilisateurs
 */
router.post('/community-update', auth, requireAdmin, async (req, res) => {
  try {
    const {
      message,
      updateType = 'general',
      version = null,
      features = [],
      targetUsers = 'all' // 'all', 'premium', 'active', 'specific'
    } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    console.log(`📢 [ADMIN] Déclenchement notification communauté par ${req.user.pseudo}`);
    console.log(`📢 Type: ${updateType}, Message: ${message}`);

    // Déterminer les utilisateurs cibles
    let targetUserQuery = {};
    
    switch (targetUsers) {
      case 'premium':
        targetUserQuery = { subscriptionStatus: 'active' };
        break;
      case 'active':
        // Utilisateurs actifs dans les 30 derniers jours
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        targetUserQuery = { lastActiveAt: { $gte: thirtyDaysAgo } };
        break;
      case 'all':
      default:
        targetUserQuery = {}; // Tous les utilisateurs
        break;
    }

    // Ajouter filtre pour les utilisateurs qui acceptent les notifications communauté
    targetUserQuery['notificationPreferences.communityUpdates'] = true;

    // Récupérer les utilisateurs cibles
    const users = await User.find(targetUserQuery).select('_id pseudo email');
    
    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun utilisateur correspondant aux critères trouvé' 
      });
    }

    console.log(`📢 [ADMIN] Envoi à ${users.length} utilisateurs`);

    // Déclencher les notifications
    const result = await notificationTriggers.triggerCommunityUpdate(
      users.map(u => u._id),
      updateType,
      message,
      version,
      features
    );

    // Log de l'action admin
    console.log(`✅ [ADMIN] ${result.totalSent} notifications communauté envoyées`);

    res.json({
      success: true,
      message: 'Notifications communauté envoyées avec succès',
      stats: {
        targetUsers: users.length,
        sent: result.totalSent,
        updateType,
        adminUser: req.user.pseudo
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur notification communauté:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications' });
  }
});

/**
 * POST /api/admin/notifications/custom
 * Envoyer une notification personnalisée à un utilisateur spécifique
 */
router.post('/custom', auth, requireAdmin, async (req, res) => {
  try {
    const { userId, type, title, message, data = {} } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        error: 'userId, type, title et message sont requis' 
      });
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await User.findById(userId).select('pseudo email');
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Envoyer la notification personnalisée
    const SmartNotificationService = require('../../services/smartNotificationService');
    const smartNotificationService = new SmartNotificationService();

    const result = await smartNotificationService.createNotification({
      userId,
      type,
      title,
      message,
      data: {
        ...data,
        adminSent: true,
        adminUser: req.user.pseudo
      },
      priority: data.priority || 'medium'
    });

    console.log(`✅ [ADMIN] Notification personnalisée envoyée à ${targetUser.pseudo}`);

    res.json({
      success: true,
      notification: result,
      message: `Notification envoyée à ${targetUser.pseudo}`
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur notification personnalisée:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification' });
  }
});

/**
 * GET /api/admin/notifications/stats
 * Statistiques des notifications
 */
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const Notification = require('../../models/Notification');
    
    const stats = await Promise.all([
      // Notifications par type
      Notification.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Notifications des 24 dernières heures
      Notification.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),

      // Utilisateurs avec notifications activées
      User.countDocuments({
        'notificationPreferences.notifications_push': true
      }),

      // Utilisateurs avec notifications communauté activées
      User.countDocuments({
        'notificationPreferences.communityUpdates': true
      })
    ]);

    res.json({
      success: true,
      stats: {
        byType: stats[0],
        last24h: stats[1],
        usersWithNotifications: stats[2],
        usersWithCommunityNotifications: stats[3]
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur stats notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
