/**
 * ðŸ”„ ROUTES ADMIN - SUPERVISION DES Ã‰CHANGES
 * API complÃ¨te pour la gestion administrative des trades
 * AccÃ¨s contrÃ´lÃ© par rÃ´les (admin_trades, super_admin)
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');

// ModÃ¨les
const Trade = require('../../models/Trade');
const User = require('../../models/User');
const ObjectModel = require('../../models/Object');
const Notification = require('../../models/Notification');

/**
 * GET /api/admin/trades
 * RÃ©cupÃ©rer tous les Ã©changes avec filtres
 */
router.get('/', requireAuth, requirePermission('manageTrades'), async (req, res) => {
  try {
    const { 
      status, 
      search, 
      limit = 50, 
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('ðŸ” [ADMIN TRADES] RÃ©cupÃ©ration des Ã©changes...');

    // Construction de la requÃªte
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

    // RÃ©cupÃ©ration avec population complÃ¨te
    const trades = await Trade.find(query)
      .populate('fromUser', 'pseudo email avatar city subscriptionPlan')
      .populate('toUser', 'pseudo email avatar city subscriptionPlan')
      .populate('requestedObjects', 'title description images category')
      .populate('offeredObjects', 'title description images category')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Transformation des donnÃ©es pour l'interface mobile
    const formattedTrades = trades.map(trade => {
      const requestedObject = trade.requestedObjects?.[0];
      const offeredObject = trade.offeredObjects?.[0];

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
          category: requestedObject.category
        } : null,
        offeredObject: offeredObject ? {
          _id: offeredObject._id,
          title: offeredObject.title,
          image: offeredObject.images?.[0],
          category: offeredObject.category
        } : null,
        status: trade.status,
        createdAt: trade.createdAt,
        completedAt: trade.completedAt,
        acceptedAt: trade.acceptedAt,
        refusedAt: trade.refusedAt,
        location: trade.fromUser.city || trade.toUser.city || 'Non spÃ©cifiÃ©e',
        disputeReason: trade.disputeReason,
        adminNotes: trade.adminNotes,
        riskLevel: trade.security?.riskLevel,
        constraints: trade.security?.constraints
      };
    });

    console.log(`âœ… [ADMIN TRADES] ${formattedTrades.length} Ã©changes rÃ©cupÃ©rÃ©s`);

    res.json(formattedTrades);
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur rÃ©cupÃ©ration Ã©changes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la rÃ©cupÃ©ration des Ã©changes' 
    });
  }
});

/**
 * GET /api/admin/trades/stats
 * Statistiques des Ã©changes pour le dashboard
 */
router.get('/stats', requireAuth, requirePermission('manageTrades'), async (req, res) => {
  try {
    console.log('ðŸ“Š [ADMIN TRADES] Calcul des statistiques...');

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

    // Statistiques d'activitÃ© des utilisateurs (derniers 30 jours)
    const activeUsersAgg = await Trade.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: null, 
          users: { $addToSet: "$fromUser" } 
        } 
      }
    ]);

    const activeUserCount = activeUsersAgg[0]?.users?.length || 0;

    // Taux de conversion (Ã©changes complÃ©tÃ©s vs proposÃ©s)
    const conversionRate = totalTrades > 0 ? (completedTrades / totalTrades) * 100 : 0;
    
    // Taux de litiges (litiges vs Ã©changes complÃ©tÃ©s)
    const disputeRate = completedTrades > 0 ? (disputedTrades / (completedTrades + disputedTrades)) * 100 : 0;

    // Temps moyen de traitement (pour les Ã©changes complÃ©tÃ©s avec acceptedAt)
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
      // ðŸ“Š Compteurs de base
      totalTrades,
      completedTrades,
      pendingTrades,
      disputedTrades,
      cancelledTrades,
      proposedTrades,
      
      // ðŸ“ˆ MÃ©triques de performance
      conversionRate: Math.round(conversionRate * 100) / 100, // % d'Ã©changes aboutis
      disputeRate: Math.round(disputeRate * 100) / 100,       // % de litiges
      avgProcessingDays: avgProcessingTime,                   // Temps moyen en jours
      
      // ðŸ•’ ActivitÃ© rÃ©cente (30 jours)
      recentTrades,      // Nouveaux Ã©changes
      recentCompleted,   // Ã‰changes finalisÃ©s
      recentDisputes,    // Nouveaux litiges
      activeUsers: activeUserCount, // Utilisateurs actifs
      
      // ðŸ¥ SantÃ© du systÃ¨me
      systemHealth: disputeRate < 5 ? 'excellent' : disputeRate < 15 ? 'bon' : 'attention',
      needsAttention: pendingTrades + disputedTrades, // Ã‰changes nÃ©cessitant une action
      
      lastUpdated: new Date().toISOString()
    };

    console.log('âœ… [ADMIN TRADES] Statistiques calculÃ©es:', stats);

    res.json(stats);
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur calcul statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors du calcul des statistiques' 
    });
  }
});

/**
 * GET /api/admin/trades/:id
 * DÃ©tails complets d'un Ã©change
 */
router.get('/:id', requireAuth, requirePermission('manageTrades'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`ðŸ” [ADMIN TRADES] RÃ©cupÃ©ration dÃ©tails Ã©change ${id}...`);

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email avatar city phone subscriptionPlan createdAt')
      .populate('toUser', 'pseudo email avatar city phone subscriptionPlan createdAt')
      .populate('requestedObjects', 'title description images category owner createdAt')
      .populate('offeredObjects', 'title description images category owner createdAt');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Ã‰change non trouvÃ©'
      });
    }

    // Historique des notifications liÃ©es
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

    console.log(`âœ… [ADMIN TRADES] DÃ©tails Ã©change rÃ©cupÃ©rÃ©s`);

    res.json(detailedTrade);
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur rÃ©cupÃ©ration dÃ©tails:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la rÃ©cupÃ©ration des dÃ©tails' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/approve
 * Approuver un Ã©change en attente
 */
router.put('/:id/approve', requireAuth, requirePermission('approveTrades'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'ApprouvÃ© par l\'administration' } = req.body;
    
    console.log(`âœ… [ADMIN TRADES] Approbation Ã©change ${id}...`);

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email')
      .populate('toUser', 'pseudo email');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Ã‰change non trouvÃ©'
      });
    }

    if (!['pending', 'disputed'].includes(trade.status)) {
      return res.status(400).json({
        success: false,
        error: 'Seuls les Ã©changes en attente ou en litige peuvent Ãªtre approuvÃ©s'
      });
    }

    // RÃ©cupÃ©rer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    // Mise Ã  jour du statut
    trade.status = 'completed';
    trade.completedAt = new Date();
    trade.adminNotes = `${trade.adminNotes || ''}\n[${new Date().toISOString()}] APPROUVÃ‰ par ${adminPseudo}: ${reason}`;
    
    await trade.save();

    // Marquer les objets comme Ã©changÃ©s
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
        message: 'Votre Ã©change a Ã©tÃ© approuvÃ© par l\'administration.',
        type: 'trade_approved',
        trade: trade._id
      },
      {
        user: trade.toUser._id,
        message: 'Votre Ã©change a Ã©tÃ© approuvÃ© par l\'administration.',
        type: 'trade_approved',
        trade: trade._id
      }
    ]);

    console.log(`âœ… [ADMIN TRADES] Ã‰change ${id} approuvÃ© avec succÃ¨s`);

    res.json({
      success: true,
      message: 'Ã‰change approuvÃ© avec succÃ¨s',
      trade: {
        _id: trade._id,
        status: trade.status,
        completedAt: trade.completedAt
      }
    });
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur approbation Ã©change:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'approbation de l\'Ã©change' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/cancel
 * Annuler un Ã©change
 */
router.put('/:id/cancel', requireAuth, requirePermission('manageTrades'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'AnnulÃ© par l\'administration' } = req.body;
    
    console.log(`âŒ [ADMIN TRADES] Annulation Ã©change ${id}...`);

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email')
      .populate('toUser', 'pseudo email');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Ã‰change non trouvÃ©'
      });
    }

    if (trade.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Impossible d\'annuler un Ã©change dÃ©jÃ  terminÃ©'
      });
    }

    // RÃ©cupÃ©rer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    // Mise Ã  jour du statut
    trade.status = 'cancelled';
    trade.refusedAt = new Date();
    trade.adminNotes = `${trade.adminNotes || ''}\n[${new Date().toISOString()}] ANNULÃ‰ par ${adminPseudo}: ${reason}`;
    
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
        message: `Votre Ã©change a Ã©tÃ© annulÃ© par l'administration. Raison: ${reason}`,
        type: 'trade_cancelled',
        trade: trade._id
      },
      {
        user: trade.toUser._id,
        message: `Votre Ã©change a Ã©tÃ© annulÃ© par l'administration. Raison: ${reason}`,
        type: 'trade_cancelled',
        trade: trade._id
      }
    ]);

    console.log(`âŒ [ADMIN TRADES] Ã‰change ${id} annulÃ© avec succÃ¨s`);

    res.json({
      success: true,
      message: 'Ã‰change annulÃ© avec succÃ¨s',
      trade: {
        _id: trade._id,
        status: trade.status,
        refusedAt: trade.refusedAt
      }
    });
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur annulation Ã©change:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'annulation de l\'Ã©change' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/resolve-dispute
 * RÃ©soudre un litige
 */
router.put('/:id/resolve-dispute', requireAuth, requirePermission('resolveDisputes'), async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, action, reason } = req.body;
    
    console.log(`âš–ï¸ [ADMIN TRADES] RÃ©solution litige Ã©change ${id}...`);

    if (!resolution || !action) {
      return res.status(400).json({
        success: false,
        error: 'ParamÃ¨tres de rÃ©solution manquants'
      });
    }

    // RÃ©cupÃ©rer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    const trade = await Trade.findById(id)
      .populate('fromUser', 'pseudo email')
      .populate('toUser', 'pseudo email');

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Ã‰change non trouvÃ©'
      });
    }

    if (trade.status !== 'disputed') {
      return res.status(400).json({
        success: false,
        error: 'Cet Ã©change n\'est pas en litige'
      });
    }

    let newStatus;
    let notificationMessage;

    switch (action) {
      case 'approve':
        newStatus = 'completed';
        trade.completedAt = new Date();
        notificationMessage = 'Le litige a Ã©tÃ© rÃ©solu en votre faveur. L\'Ã©change est finalisÃ©.';
        
        // Marquer les objets comme Ã©changÃ©s
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
        notificationMessage = 'Le litige a Ã©tÃ© rÃ©solu par l\'annulation de l\'Ã©change.';
        
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
          error: 'Action de rÃ©solution invalide'
        });
    }

    // Mise Ã  jour du trade
    trade.status = newStatus;
    trade.disputeResolution = {
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
      resolution: resolution,
      action: action,
      reason: reason
    };
    trade.adminNotes = `${trade.adminNotes || ''}\n[${new Date().toISOString()}] LITIGE RÃ‰SOLU par ${adminPseudo}: ${resolution} (${action})`;
    
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

    console.log(`âš–ï¸ [ADMIN TRADES] Litige Ã©change ${id} rÃ©solu: ${action}`);

    res.json({
      success: true,
      message: 'Litige rÃ©solu avec succÃ¨s',
      trade: {
        _id: trade._id,
        status: trade.status,
        disputeResolution: trade.disputeResolution
      }
    });
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur rÃ©solution litige:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la rÃ©solution du litige' 
    });
  }
});

/**
 * PUT /api/admin/trades/:id/notes
 * Ajouter des notes administratives
 */
router.put('/:id/notes', requireAuth, requirePermission('manageTrades'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({
        success: false,
        error: 'Note requise'
      });
    }

    console.log(`ðŸ“ [ADMIN TRADES] Ajout note Ã©change ${id}...`);

    // RÃ©cupÃ©rer les infos de l'admin
    const admin = await User.findById(req.user.id).select('pseudo');
    const adminPseudo = admin?.pseudo || 'Admin';

    const trade = await Trade.findById(id);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Ã‰change non trouvÃ©'
      });
    }

    // Ajouter la note avec timestamp
    const noteWithTimestamp = `[${new Date().toISOString()}] NOTE par ${adminPseudo}: ${note}`;
    trade.adminNotes = `${trade.adminNotes || ''}\n${noteWithTimestamp}`;
    
    await trade.save();

    console.log(`âœ… [ADMIN TRADES] Note ajoutÃ©e Ã  l'Ã©change ${id}`);

    res.json({
      success: true,
      message: 'Note ajoutÃ©e avec succÃ¨s',
      adminNotes: trade.adminNotes
    });
    
  } catch (error) {
    console.error('âŒ [ADMIN TRADES] Erreur ajout note:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'ajout de la note' 
    });
  }
});

module.exports = router;

