/**
 * 🔄 ROUTES ADMIN - SUPERVISION DES ÉCHANGES
 * API complète pour la gestion administrative des trades
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { requireAdmin, requireSuperAdmin } = require('../../middlewares/adminAuth');

// Modèles
const Trade = require('../../models/Trade');
const User = require('../../models/User');
const ObjectModel = require('../../models/Object');
const Notification = require('../../models/Notification');

/**
 * GET /api/admin/trades
 * Récupérer tous les échanges avec filtres
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      search, 
      limit = 50, 
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 [ADMIN TRADES] Récupération des échanges...');

    // Construction de la requête
    let query = {};
    
    // Filtre par statut
    if (status && status !== 'all') {
      query.status = status;
    }

    // Recherche textuelle
    if (search) {
      const users = await User.find({
        $or: [
          { pseudo: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      
      query.$or = [
        { fromUser: { $in: userIds } },
        { toUser: { $in: userIds } }
      ];
    }

    // Récupération avec population complète
    const trades = await Trade.find(query)
      .populate('fromUser', 'pseudo email avatar city subscriptionPlan')
      .populate('toUser', 'pseudo email avatar city subscriptionPlan')
      .populate('requestedObjects', 'title description images category estimatedValue')
      .populate('offeredObjects', 'title description images category estimatedValue')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Transformation des données pour l'interface mobile
    const formattedTrades = trades.map(trade => {
      const requestedObject = trade.requestedObjects?.[0];
      const offeredObject = trade.offeredObjects?.[0];
      
      // Calcul de la valeur estimée
      const requestedValue = requestedObject?.estimatedValue || 0;
      const offeredValue = offeredObject?.estimatedValue || 0;
      const estimatedValue = (requestedValue + offeredValue) / 2;

      return {
        _id: trade._id,
        requester: {
          _id: trade.fromUser._id,
          username: trade.fromUser.pseudo,
          email: trade.fromUser.email,
          avatar: trade.fromUser.avatar,
          subscriptionPlan: trade.fromUser.subscriptionPlan
        },
        owner: {
          _id: trade.toUser._id,
          username: trade.toUser.pseudo,
          email: trade.toUser.email,
          avatar: trade.toUser.avatar,
          subscriptionPlan: trade.toUser.subscriptionPlan
        },
        requestedObject: requestedObject ? {
          _id: requestedObject._id,
          title: requestedObject.title,
          image: requestedObject.images?.[0],
          category: requestedObject.category,
          estimatedValue: requestedObject.estimatedValue
        } : null,
        offeredObject: offeredObject ? {
          _id: offeredObject._id,
          title: offeredObject.title,
          image: offeredObject.images?.[0],
          category: offeredObject.category,
          estimatedValue: offeredObject.estimatedValue
        } : null,
        status: trade.status,
        createdAt: trade.createdAt,
        completedAt: trade.completedAt,
        acceptedAt: trade.acceptedAt,
        refusedAt: trade.refusedAt,
        estimatedValue: estimatedValue,
        location: trade.fromUser.city || trade.toUser.city || 'Non spécifiée',
        disputeReason: trade.disputeReason,
        adminNotes: trade.adminNotes,
        riskLevel: trade.security?.riskLevel,
        constraints: trade.security?.constraints
      };
    });

    console.log(`✅ [ADMIN TRADES] ${formattedTrades.length} échanges récupérés`);

    res.json(formattedTrades);
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur récupération échanges:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des échanges' 
    });
  }
});

/**
 * GET /api/admin/trades/stats
 * Statistiques des échanges pour le dashboard
 */
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log('📊 [ADMIN TRADES] Calcul des statistiques...');

    // Comptages par statut
    const [
      totalTrades,
      completedTrades,
      pendingTrades,
      disputedTrades,
      cancelledTrades,
      proposedTrades
    ] = await Promise.all([
      Trade.countDocuments(),
      Trade.countDocuments({ status: 'completed' }),
      Trade.countDocuments({ status: 'pending' }),
      Trade.countDocuments({ status: 'disputed' }),
      Trade.countDocuments({ status: 'cancelled' }),
      Trade.countDocuments({ status: 'proposed' })
    ]);

    // Statistiques temporelles (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentTrades, recentCompleted, recentDisputes] = await Promise.all([
      Trade.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Trade.countDocuments({ status: 'completed', completedAt: { $gte: thirtyDaysAgo } }),
      Trade.countDocuments({ status: 'disputed', createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Statistiques d'activité des utilisateurs (derniers 30 jours)
    const activeUsersAgg = await Trade.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: null, 
          users: { $addToSet: "$fromUser" } 
        } 
      }
    ]);

    const activeUserCount = activeUsersAgg[0]?.users?.length || 0;

    // Taux de conversion (échanges complétés vs proposés)
    const conversionRate = totalTrades > 0 ? (completedTrades / totalTrades) * 100 : 0;
    
    // Taux de litiges (litiges vs échanges complétés)
    const disputeRate = completedTrades > 0 ? (disputedTrades / (completedTrades + disputedTrades)) * 100 : 0;

    // Temps moyen de traitement (pour les échanges complétés avec acceptedAt)
    const completedWithTiming = await Trade.find({
      status: 'completed',
      acceptedAt: { $exists: true },
      completedAt: { $exists: true }
    }).select('acceptedAt completedAt');

    let avgProcessingTime = 0;
    if (completedWithTiming.length > 0) {
      const totalProcessingTime = completedWithTiming.reduce((total, trade) => {
        const processingTime = new Date(trade.completedAt) - new Date(trade.acceptedAt);
        return total + processingTime;
      }, 0);
      avgProcessingTime = Math.round(totalProcessingTime / completedWithTiming.length / (1000 * 60 * 60 * 24)); // en jours
    }

    const stats = {
      // 📊 Compteurs de base
      totalTrades,
      completedTrades,
      pendingTrades,
      disputedTrades,
      cancelledTrades,
      proposedTrades,
      
      // 📈 Métriques de performance
      conversionRate: Math.round(conversionRate * 100) / 100, // % d'échanges aboutis
      disputeRate: Math.round(disputeRate * 100) / 100,       // % de litiges
      avgProcessingDays: avgProcessingTime,                   // Temps moyen en jours
      
      // 🕒 Activité récente (30 jours)
      recentTrades,      // Nouveaux échanges
      recentCompleted,   // Échanges finalisés
      recentDisputes,    // Nouveaux litiges
      activeUsers: activeUserCount, // Utilisateurs actifs
      
      // 🏥 Santé du système
      systemHealth: disputeRate < 5 ? 'excellent' : disputeRate < 15 ? 'bon' : 'attention',
      needsAttention: pendingTrades + disputedTrades, // Échanges nécessitant une action
      
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ [ADMIN TRADES] Statistiques calculées:', stats);

    res.json(stats);
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur calcul statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors du calcul des statistiques' 
    });
  }
});

/**
 * GET /api/admin/trades/:id
 * Détails complets d'un échange
 */
router.get('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 [ADMIN TRADES] Récupération détails échange ${id}...`);

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email avatar city phone subscriptionPlan createdAt')
      .populate('toUser', 'pseudo email avatar city phone subscriptionPlan createdAt')
      .populate('requestedObjects', 'title description images category estimatedValue owner createdAt')
      .populate('offeredObjects', 'title description images category estimatedValue owner createdAt');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Échange non trouvé'
      });
    }

    // Historique des notifications liées
    const notifications = await Notification.find({ trade: id })
      .populate('user', 'pseudo')
      .sort({ createdAt: -1 });

    const detailedTrade = {
      _id: trade._id,
      fromUser: trade.fromUser,
      toUser: trade.toUser,
      requestedObjects: trade.requestedObjects,
      offeredObjects: trade.offeredObjects,
      status: trade.status,
      createdAt: trade.createdAt,
      completedAt: trade.completedAt,
      acceptedAt: trade.acceptedAt,
      refusedAt: trade.refusedAt,
      disputeReason: trade.disputeReason,
      adminNotes: trade.adminNotes,
      security: trade.security,
      notifications: notifications.map(n => ({
        _id: n._id,
        user: n.user.pseudo,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt,
        isRead: n.isRead
      }))
    };

    console.log(`✅ [ADMIN TRADES] Détails échange récupérés`);

    res.json(detailedTrade);
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur récupération détails:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des détails' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/approve
 * Approuver un échange en attente
 */
router.put('/:id/approve', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Approuvé par l\'administration' } = req.body;
    
    console.log(`✅ [ADMIN TRADES] Approbation échange ${id}...`);

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email')
      .populate('toUser', 'pseudo email');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Échange non trouvé'
      });
    }

    if (!['pending', 'disputed'].includes(trade.status)) {
      return res.status(400).json({
        success: false,
        error: 'Seuls les échanges en attente ou en litige peuvent être approuvés'
      });
    }

    // Récupérer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    // Mise à jour du statut
    trade.status = 'completed';
    trade.completedAt = new Date();
    trade.adminNotes = `${trade.adminNotes || ''}\n[${new Date().toISOString()}] APPROUVÉ par ${adminPseudo}: ${reason}`;
    
    await trade.save();

    // Marquer les objets comme échangés
    if (trade.requestedObjects?.length > 0) {
      await ObjectModel.updateMany(
        { _id: { $in: trade.requestedObjects } },
        { status: 'traded' }
      );
    }

    if (trade.offeredObjects?.length > 0) {
      await ObjectModel.updateMany(
        { _id: { $in: trade.offeredObjects } },
        { status: 'traded' }
      );
    }

    // Notifications aux utilisateurs
    await Notification.create([
      {
        user: trade.fromUser._id,
        message: 'Votre échange a été approuvé par l\'administration.',
        type: 'trade_approved',
        trade: trade._id
      },
      {
        user: trade.toUser._id,
        message: 'Votre échange a été approuvé par l\'administration.',
        type: 'trade_approved',
        trade: trade._id
      }
    ]);

    console.log(`✅ [ADMIN TRADES] Échange ${id} approuvé avec succès`);

    res.json({
      success: true,
      message: 'Échange approuvé avec succès',
      trade: {
        _id: trade._id,
        status: trade.status,
        completedAt: trade.completedAt
      }
    });
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur approbation échange:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'approbation de l\'échange' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/cancel
 * Annuler un échange
 */
router.put('/:id/cancel', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Annulé par l\'administration' } = req.body;
    
    console.log(`❌ [ADMIN TRADES] Annulation échange ${id}...`);

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email')
      .populate('toUser', 'pseudo email');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Échange non trouvé'
      });
    }

    if (trade.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Impossible d\'annuler un échange déjà terminé'
      });
    }

    // Récupérer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    // Mise à jour du statut
    trade.status = 'cancelled';
    trade.refusedAt = new Date();
    trade.adminNotes = `${trade.adminNotes || ''}\n[${new Date().toISOString()}] ANNULÉ par ${adminPseudo}: ${reason}`;
    
    await trade.save();

    // Remettre les objets disponibles
    if (trade.requestedObjects?.length > 0) {
      await ObjectModel.updateMany(
        { _id: { $in: trade.requestedObjects } },
        { status: 'available' }
      );
    }

    if (trade.offeredObjects?.length > 0) {
      await ObjectModel.updateMany(
        { _id: { $in: trade.offeredObjects } },
        { status: 'available' }
      );
    }

    // Notifications aux utilisateurs
    await Notification.create([
      {
        user: trade.fromUser._id,
        message: `Votre échange a été annulé par l'administration. Raison: ${reason}`,
        type: 'trade_cancelled',
        trade: trade._id
      },
      {
        user: trade.toUser._id,
        message: `Votre échange a été annulé par l'administration. Raison: ${reason}`,
        type: 'trade_cancelled',
        trade: trade._id
      }
    ]);

    console.log(`❌ [ADMIN TRADES] Échange ${id} annulé avec succès`);

    res.json({
      success: true,
      message: 'Échange annulé avec succès',
      trade: {
        _id: trade._id,
        status: trade.status,
        refusedAt: trade.refusedAt
      }
    });
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur annulation échange:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'annulation de l\'échange' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/resolve-dispute
 * Résoudre un litige
 */
router.put('/:id/resolve-dispute', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, action, reason } = req.body;
    
    console.log(`⚖️ [ADMIN TRADES] Résolution litige échange ${id}...`);

    if (!resolution || !action) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres de résolution manquants'
      });
    }

    // Récupérer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email')
      .populate('toUser', 'pseudo email');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Échange non trouvé'
      });
    }

    if (trade.status !== 'disputed') {
      return res.status(400).json({
        success: false,
        error: 'Cet échange n\'est pas en litige'
      });
    }

    let newStatus;
    let notificationMessage;

    switch (action) {
      case 'approve':
        newStatus = 'completed';
        trade.completedAt = new Date();
        notificationMessage = 'Le litige a été résolu en votre faveur. L\'échange est finalisé.';
        
        // Marquer les objets comme échangés
        if (trade.requestedObjects?.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: trade.requestedObjects } },
            { status: 'traded' }
          );
        }
        if (trade.offeredObjects?.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: trade.offeredObjects } },
            { status: 'traded' }
          );
        }
        break;
        
      case 'cancel':
        newStatus = 'cancelled';
        trade.refusedAt = new Date();
        notificationMessage = 'Le litige a été résolu par l\'annulation de l\'échange.';
        
        // Remettre les objets disponibles
        if (trade.requestedObjects?.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: trade.requestedObjects } },
            { status: 'available' }
          );
        }
        if (trade.offeredObjects?.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: trade.offeredObjects } },
            { status: 'available' }
          );
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Action de résolution invalide'
        });
    }

    // Mise à jour du trade
    trade.status = newStatus;
    trade.disputeResolution = {
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
      resolution: resolution,
      action: action,
      reason: reason
    };
    trade.adminNotes = `${trade.adminNotes || ''}\n[${new Date().toISOString()}] LITIGE RÉSOLU par ${adminPseudo}: ${resolution} (${action})`;
    
    await trade.save();

    // Notifications aux utilisateurs
    await Notification.create([
      {
        user: trade.fromUser._id,
        message: notificationMessage,
        type: 'dispute_resolved',
        trade: trade._id
      },
      {
        user: trade.toUser._id,
        message: notificationMessage,
        type: 'dispute_resolved',
        trade: trade._id
      }
    ]);

    console.log(`⚖️ [ADMIN TRADES] Litige échange ${id} résolu: ${action}`);

    res.json({
      success: true,
      message: 'Litige résolu avec succès',
      trade: {
        _id: trade._id,
        status: trade.status,
        disputeResolution: trade.disputeResolution
      }
    });
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur résolution litige:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la résolution du litige' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/notes
 * Ajouter des notes administratives
 */
router.put('/:id/notes', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Note requise'
      });
    }

    console.log(`📝 [ADMIN TRADES] Ajout note échange ${id}...`);

    // Récupérer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    const trade = await Trade.findById(id);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Échange non trouvé'
      });
    }

    // Ajouter la note avec timestamp
    const noteWithTimestamp = `[${new Date().toISOString()}] NOTE par ${adminPseudo}: ${note}`;
    trade.adminNotes = `${trade.adminNotes || ''}\n${noteWithTimestamp}`;
    
    await trade.save();

    console.log(`✅ [ADMIN TRADES] Note ajoutée à l'échange ${id}`);

    res.json({
      success: true,
      message: 'Note ajoutée avec succès',
      adminNotes: trade.adminNotes
    });
    
  } catch (error) {
    console.error('❌ [ADMIN TRADES] Erreur ajout note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'ajout de la note' 
    });
  }
});

module.exports = router;
