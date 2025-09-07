const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Report = require('../models/Report');
const User = require('../models/User');
const Object = require('../models/Object');
const Trade = require('../models/Trade');

const { requireAuth, requirePermission } = require('../middleware/roleBasedAccess');

// ============================================================================
// SIGNALEMENTS - UTILISATEURS NORMAUX
// ============================================================================

/**
 * POST /api/reports/user - Signaler un utilisateur
 * Accessible à tous les utilisateurs connectés
 */
router.post('/user', requireAuth, async (req, res) => {
  try {
    const { 
      reportedUserId, 
      type, 
      reason, 
      description, 
      evidence = [],
      relatedTradeId 
    } = req.body;

    // Vérifications de base
    if (!reportedUserId || !type || !reason || !description) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants',
        required: ['reportedUserId', 'type', 'reason', 'description']
      });
    }

    // Ne pas permettre l'auto-signalement
    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas vous signaler vous-même'
      });
    }

    // Vérifier que l'utilisateur signalé existe
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Utilisateur signalé introuvable' });
    }

    // Vérifier si un signalement similaire n'existe pas déjà
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      status: { $in: ['pending', 'investigating'] }
    });

    if (existingReport) {
      return res.status(409).json({
        message: 'Vous avez déjà un signalement en cours pour cet utilisateur'
      });
    }

    // Créer le signalement
    const report = new Report({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      relatedTrade: relatedTradeId,
      type,
      reason,
      description,
      evidence,
      priority: determinePriority(type),
      metadata: {
        reporterIP: req.ip,
        userAgent: req.get('User-Agent'),
        platform: 'web'
      }
    });

    await report.save();

    // Mettre à jour le score de confiance de l'utilisateur signalé
    await updateUserTrustScore(reportedUserId, -1);

    res.status(201).json({
      message: 'Signalement créé avec succès',
      reportId: report._id
    });

  } catch (error) {
    console.error('Erreur signalement utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/reports/object - Signaler un objet
 * Accessible à tous les utilisateurs connectés
 */
router.post('/object', requireAuth, async (req, res) => {
  try {
    const { 
      reportedObjectId, 
      type, 
      reason, 
      description, 
      evidence = [] 
    } = req.body;

    // Vérifications de base
    if (!reportedObjectId || !type || !reason || !description) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants',
        required: ['reportedObjectId', 'type', 'reason', 'description']
      });
    }

    // Vérifier que l'objet signalé existe
    const reportedObject = await Object.findById(reportedObjectId);
    if (!reportedObject) {
      return res.status(404).json({ message: 'Objet signalé introuvable' });
    }

    // Ne pas permettre de signaler son propre objet
    if (reportedObject.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Vous ne pouvez pas signaler votre propre objet'
      });
    }

    // Vérifier si un signalement similaire n'existe pas déjà
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      reportedObject: reportedObjectId,
      status: { $in: ['pending', 'investigating'] }
    });

    if (existingReport) {
      return res.status(409).json({
        message: 'Vous avez déjà un signalement en cours pour cet objet'
      });
    }

    // Créer le signalement
    const report = new Report({
      reporter: req.user._id,
      reportedObject: reportedObjectId,
      reportedUser: reportedObject.owner,
      type,
      reason,
      description,
      evidence,
      priority: determinePriority(type),
      metadata: {
        reporterIP: req.ip,
        userAgent: req.get('User-Agent'),
        platform: 'web'
      }
    });

    await report.save();

    res.status(201).json({
      message: 'Signalement créé avec succès',
      reportId: report._id
    });

  } catch (error) {
    console.error('Erreur signalement objet:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * GET /api/reports/my - Mes signalements
 * Accessible à tous les utilisateurs connectés
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { reporter: req.user._id };
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reportedUser', 'pseudo email')
      .populate('reportedObject', 'title images')
      .populate('adminReview.reviewedBy', 'pseudo')
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });

  } catch (error) {
    console.error('Erreur récupération signalements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ============================================================================
// MODÉRATION - ADMINS/MODÉRATEURS SEULEMENT
// ============================================================================

/**
 * GET /api/reports/all - Tous les signalements (admin)
 * Accessible aux modérateurs et admins content
 */
router.get('/all', requireAuth, requirePermission('moderate_content'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      priority,
      sort = 'newest'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Filtres
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    // Tri
    let sortQuery = { reportedAt: -1 };
    if (sort === 'oldest') sortQuery = { reportedAt: 1 };
    else if (sort === 'priority') sortQuery = { priority: -1, reportedAt: -1 };

    const reports = await Report.find(query)
      .populate('reporter', 'pseudo email trustScore')
      .populate('reportedUser', 'pseudo email trustScore')
      .populate('reportedObject', 'title images owner')
      .populate('adminReview.reviewedBy', 'pseudo')
      .populate('resolution.resolvedBy', 'pseudo')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Statistiques rapides
    const stats = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('Erreur récupération signalements admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * PUT /api/reports/:reportId/assign - Assigner un signalement à un admin
 * Accessible aux modérateurs et admins content
 */
router.put('/:reportId/assign', requireAuth, requirePermission('moderate_content'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { adminNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Signalement introuvable' });
    }

    await report.assignToAdmin(req.user._id, adminNotes);

    res.json({ message: 'Signalement assigné avec succès' });

  } catch (error) {
    console.error('Erreur assignation signalement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/reports/:reportId/resolve - Résoudre un signalement
 * Accessible aux modérateurs et admins content
 */
router.post('/:reportId/resolve', requireAuth, requirePermission('moderate_content'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { resolutionType, notes, actionTaken } = req.body;

    if (!resolutionType) {
      return res.status(400).json({ 
        message: 'Type de résolution obligatoire',
        validTypes: [
          'warning_sent', 'content_removed', 'user_suspended',
          'user_banned', 'trade_cancelled', 'no_action_needed', 'false_report'
        ]
      });
    }

    const report = await Report.findById(reportId)
      .populate('reportedUser')
      .populate('reportedObject');

    if (!report) {
      return res.status(404).json({ message: 'Signalement introuvable' });
    }

    // Appliquer l'action selon le type de résolution
    await applyModerationAction(report, resolutionType, req.user._id);

    // Marquer comme résolu
    await report.markAsResolved(req.user._id, resolutionType, notes);

    // Mettre à jour les notes d'admin si nécessaire
    if (actionTaken) {
      report.adminReview.actionTaken = actionTaken;
      await report.save();
    }

    res.json({ 
      success: true,
      message: 'Signalement résolu avec succès',
      report: report
    });

  } catch (error) {
    console.error('Erreur résolution signalement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * POST /api/reports/:reportId/investigate - Assigner un signalement pour investigation
 * Accessible aux modérateurs et admins content
 */
router.post('/:reportId/investigate', requireAuth, requirePermission('moderate_content'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { adminNotes, assignedTo } = req.body;

    console.log(`🔍 [INVESTIGATE] Début investigation pour signalement ${reportId} par ${req.user.pseudo}`);
    console.log(`🔍 [INVESTIGATE] Données reçues:`, { adminNotes, assignedTo });

    const report = await Report.findById(reportId);

    if (!report) {
      console.log(`❌ [INVESTIGATE] Signalement ${reportId} introuvable`);
      return res.status(404).json({ success: false, message: 'Signalement introuvable' });
    }

    // Mettre à jour le statut et assigner
    report.status = 'investigating';
    report.assignedTo = assignedTo || req.user._id;
    
    console.log(`🔍 [INVESTIGATE] Assignation à: ${assignedTo || req.user._id}`);
    
    if (adminNotes) {
      if (!report.adminReview) {
        report.adminReview = {};
      }
      report.adminReview.notes = adminNotes;
      report.adminReview.reviewedBy = req.user._id;
      report.adminReview.reviewedAt = new Date();
      console.log(`🔍 [INVESTIGATE] Notes admin ajoutées: ${adminNotes}`);
    }

    await report.save();
    console.log(`✅ [INVESTIGATE] Signalement ${reportId} mis à jour avec succès`);

    res.json({ 
      success: true,
      message: 'Signalement assigné pour investigation',
      report: report
    });

  } catch (error) {
    console.error('❌ [INVESTIGATE] Erreur investigation signalement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * POST /api/reports/:reportId/dismiss - Rejeter un signalement
 * Accessible aux modérateurs et admins content
 */
router.post('/:reportId/dismiss', requireAuth, requirePermission('moderate_content'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reason, adminNotes } = req.body;

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Signalement introuvable' });
    }

    // Marquer comme rejeté
    report.status = 'dismissed';
    
    if (!report.adminReview) {
      report.adminReview = {};
    }
    
    report.adminReview.notes = adminNotes || reason;
    report.adminReview.reviewedBy = req.user._id;
    report.adminReview.reviewedAt = new Date();
    report.adminReview.actionTaken = 'dismissed';

    await report.save();

    res.json({ 
      success: true,
      message: 'Signalement rejeté',
      report: report
    });

  } catch (error) {
    console.error('Erreur rejet signalement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/**
 * GET /api/reports/stats - Statistiques de modération
 * Accessible aux admins content et super admins
 */
router.get('/stats', requireAuth, requirePermission('moderate_content'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Report.aggregate([
      { $match: { reportedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$reportedAt' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          reports: {
            $push: {
              status: '$_id.status',
              type: '$_id.type',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Statistiques générales
    const generalStats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top signaleurs
    const topReporters = await Report.aggregate([
      {
        $group: {
          _id: '$reporter',
          reportCount: { $sum: 1 }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    res.json({
      period: `${days} derniers jours`,
      dailyStats: stats,
      generalStats: generalStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      topReporters: topReporters.map(item => ({
        user: item.user[0]?.pseudo || 'Utilisateur supprimé',
        reportCount: item.reportCount
      }))
    });

  } catch (error) {
    console.error('Erreur statistiques modération:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Détermine la priorité d'un signalement selon son type
 */
function determinePriority(type) {
  const urgentTypes = ['violence_threat', 'fraud'];
  const highTypes = ['harassment', 'fake_item'];
  const mediumTypes = ['inappropriate_content', 'misleading_description', 'spam'];
  
  if (urgentTypes.includes(type)) return 'urgent';
  if (highTypes.includes(type)) return 'high';
  if (mediumTypes.includes(type)) return 'medium';
  return 'low';
}

/**
 * Met à jour le score de confiance d'un utilisateur
 */
async function updateUserTrustScore(userId, change) {
  try {
    await User.findByIdAndUpdate(
      userId,
      { $inc: { trustScore: change } },
      { new: true }
    );
  } catch (error) {
    console.error('Erreur mise à jour trust score:', error);
  }
}

/**
 * Applique l'action de modération selon le type de résolution
 */
async function applyModerationAction(report, resolutionType, adminId) {
  try {
    const { reportedUser, reportedObject } = report;

    switch (resolutionType) {
      case 'user_suspended':
        if (reportedUser) {
          await User.findByIdAndUpdate(reportedUser._id, {
            isActive: false,
            suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            suspendedBy: adminId,
            suspensionReason: 'Suite à signalement communautaire'
          });
        }
        break;

      case 'user_banned':
        if (reportedUser) {
          await User.findByIdAndUpdate(reportedUser._id, {
            isActive: false,
            isBanned: true,
            bannedBy: adminId,
            banReason: 'Suite à signalement communautaire'
          });
        }
        break;

      case 'content_removed':
        if (reportedObject) {
          await Object.findByIdAndUpdate(reportedObject._id, {
            isActive: false,
            removedBy: adminId,
            removalReason: 'Suite à signalement communautaire'
          });
        }
        break;

      case 'warning_sent':
        // Ici on pourrait envoyer un email d'avertissement
        if (reportedUser) {
          await User.findByIdAndUpdate(reportedUser._id, {
            $inc: { warningCount: 1 },
            $push: {
              warnings: {
                date: new Date(),
                reason: 'Suite à signalement communautaire',
                adminId
              }
            }
          });
        }
        break;

      case 'false_report':
        // Pénaliser le signaleur pour faux signalement
        if (report.reporter) {
          await updateUserTrustScore(report.reporter, -5);
        }
        break;
    }

  } catch (error) {
    console.error('Erreur application action modération:', error);
    throw error;
  }
}

/**
 * GET /api/reports/admin-activity - Statistiques d'activité des administrateurs
 * Accessible aux super admins uniquement
 */
router.get('/admin-activity', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('🎯 API admin-activity appelée (version corrigée)');

    // Récupérer le paramètre de période
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Récupérer tous les utilisateurs avec rôles admin (plusieurs critères possible)
    const User = require('../models/User');
    const admins = await User.find({ 
      $or: [
        { isAdmin: true },
        { role: { $in: ['admin', 'moderator', 'super_admin'] } }
      ],
      status: 'active' 
    }).select('_id pseudo email role');
    
    console.log(`👥 ${admins.length} administrateurs trouvés`);
    
    const adminActivity = [];
    
    for (const admin of admins) {
      console.log(`📊 Calcul stats pour ${admin.pseudo}...`);
      
      // Compter les signalements où cet admin a fait une action d'assignment DANS LA PÉRIODE
      const assignedCount = await Report.countDocuments({
        'adminReview.reviewedBy': admin._id,
        'adminReview.reviewedAt': { $gte: startDate }
      });
      
      // Compter les signalements où cet admin a fait une action de résolution DANS LA PÉRIODE
      const resolvedCount = await Report.countDocuments({
        'resolution.resolvedBy': admin._id,
        'resolution.resolvedAt': { $gte: startDate }
      });
      
      // IMPORTANT: Pour éviter les doublons, compter les signalements uniques DANS LA PÉRIODE
      const reviewedOnlyCount = await Report.countDocuments({
        'adminReview.reviewedBy': admin._id,
        'adminReview.reviewedAt': { $gte: startDate },
        'resolution.resolvedBy': { $ne: admin._id } // Exclu ceux qu'il a aussi résolu
      });
      
      const resolvedOnlyCount = await Report.countDocuments({
        'resolution.resolvedBy': admin._id,
        'resolution.resolvedAt': { $gte: startDate },
        'adminReview.reviewedBy': { $ne: admin._id } // Exclu ceux qu'il a aussi reviewé
      });
      
      const bothCount = await Report.countDocuments({
        'adminReview.reviewedBy': admin._id,
        'adminReview.reviewedAt': { $gte: startDate },
        'resolution.resolvedBy': admin._id,
        'resolution.resolvedAt': { $gte: startDate } // Les deux dans la période
      });
      
      // Total unique = reviewé seulement + résolu seulement + les deux (compté 1 fois)
      const totalActivity = reviewedOnlyCount + resolvedOnlyCount + bothCount;
      
      // Récupérer la dernière action de cet admin
      const lastAction = await Report.findOne({
        $or: [
          { 'adminReview.reviewedBy': admin._id },
          { 'resolution.resolvedBy': admin._id }
        ]
      }).sort({ updatedAt: -1 }).select('adminReview.reviewedAt resolution.resolvedAt updatedAt');
      
      let lastActionDate = admin.updatedAt || admin.createdAt;
      if (lastAction) {
        lastActionDate = lastAction.resolution?.resolvedAt || 
                        lastAction.adminReview?.reviewedAt || 
                        lastAction.updatedAt;
      }
      
      console.log(`  - ${admin.pseudo}: assignedCount=${assignedCount}, resolvedCount=${resolvedCount}, totalActivity=${totalActivity}`);
      console.log(`    Détail: reviewedOnly=${reviewedOnlyCount}, resolvedOnly=${resolvedOnlyCount}, both=${bothCount}`);
      
      // N'inclure que les admins qui ont eu de l'activité dans la période sélectionnée
      if (totalActivity > 0) {
        adminActivity.push({
          adminId: admin._id,
          adminName: admin.pseudo || admin.email,
          adminEmail: admin.email,
          adminRole: admin.role || 'admin',
          assignedReports: assignedCount,
          resolvedReports: resolvedCount,
          totalActivity: totalActivity,
          lastAction: lastActionDate,
          resolutionBreakdown: {}
        });
        
        console.log(`  ✅ ${admin.pseudo} inclus (${totalActivity} activités dans la période)`);
      } else {
        console.log(`  ⏭️ ${admin.pseudo} exclu (aucune activité dans la période de ${days} jours)`);
      }
    }
    
    // Trier par date de dernière activité (plus récent au plus ancien)
    adminActivity.sort((a, b) => {
      // Gérer les cas où lastAction est undefined ou null
      const dateA = a.lastAction ? new Date(a.lastAction) : new Date(0); // Date très ancienne si pas d'activité
      const dateB = b.lastAction ? new Date(b.lastAction) : new Date(0);
      return dateB.getTime() - dateA.getTime(); // Plus récent en premier
    });

    console.log('📊 Tri par date de dernière activité (plus récent au plus ancien):');
    adminActivity.forEach((admin, index) => {
      const formattedDate = admin.lastAction 
        ? new Date(admin.lastAction).toLocaleDateString('fr-FR') + ' ' + new Date(admin.lastAction).toLocaleTimeString('fr-FR')
        : 'Aucune activité';
      console.log(`  ${index + 1}. ${admin.adminName}: ${formattedDate}`);
    });

    // Statistiques générales d'activité pour la période sélectionnée
    const periodStats = await Report.aggregate([
      {
        $match: {
          reportedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReportsReceived: { $sum: 1 },
          totalProcessed: {
            $sum: {
              $cond: [{ $in: ['$status', ['resolved', 'dismissed']] }, 1, 0]
            }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$resolution.resolvedAt', null] },
                { $subtract: ['$resolution.resolvedAt', '$reportedAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    const result = {
      success: true,
      admins: adminActivity, // Utiliser le nom attendu par le frontend
      totalReports: periodStats[0]?.totalReportsReceived || 0,
      processedReports: periodStats[0]?.totalProcessed || 0,
      avgResponseTime: periodStats[0]?.avgResponseTime || 0,
      processedPercentage: periodStats[0] ? 
        ((periodStats[0].totalProcessed / periodStats[0].totalReportsReceived) * 100) : 0
    };

    console.log('📊 Réponse finale:', JSON.stringify(result, null, 2));
    res.json(result);

  } catch (error) {
    console.error('Erreur statistiques activité admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des statistiques d\'activité' 
    });
  }
});

module.exports = router;
