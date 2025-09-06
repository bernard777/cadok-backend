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

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: 'Signalement introuvable' });
    }

    // Mettre à jour le statut et assigner
    report.status = 'investigating';
    report.assignedTo = assignedTo || req.user._id;
    
    if (adminNotes) {
      if (!report.adminReview) {
        report.adminReview = {};
      }
      report.adminReview.notes = adminNotes;
      report.adminReview.reviewedBy = req.user._id;
      report.adminReview.reviewedAt = new Date();
    }

    await report.save();

    res.json({ 
      success: true,
      message: 'Signalement assigné pour investigation',
      report: report
    });

  } catch (error) {
    console.error('Erreur investigation signalement:', error);
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
router.get('/admin-activity', requireAuth, requirePermission('manage_system'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Statistiques des actions par admin
    const adminActivity = await Report.aggregate([
      {
        $match: {
          $or: [
            { 'adminReview.reviewedAt': { $gte: startDate } },
            { 'resolution.resolvedAt': { $gte: startDate } }
          ]
        }
      },
      {
        $group: {
          _id: {
            admin: { $ifNull: ['$resolution.resolvedBy', '$adminReview.reviewedBy'] }
          },
          assignedReports: {
            $sum: {
              $cond: [{ $ne: ['$adminReview.reviewedBy', null] }, 1, 0]
            }
          },
          resolvedReports: {
            $sum: {
              $cond: [{ $ne: ['$resolution.resolvedBy', null] }, 1, 0]
            }
          },
          resolutionTypes: {
            $push: '$resolution.resolutionType'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.admin',
          foreignField: '_id',
          as: 'adminInfo'
        }
      },
      {
        $match: {
          'adminInfo.0': { $exists: true }, // S'assurer que l'admin existe
          'adminInfo.0.isActive': { $ne: false }, // Admin actif
          'adminInfo.0.isBanned': { $ne: true }, // Admin non banni
        }
      },
      {
        $project: {
          adminId: '$_id.admin',
          adminName: { $arrayElemAt: ['$adminInfo.pseudo', 0] },
          adminEmail: { $arrayElemAt: ['$adminInfo.email', 0] },
          assignedReports: 1,
          resolvedReports: 1,
          totalActivity: { $add: ['$assignedReports', '$resolvedReports'] },
          resolutionBreakdown: {
            $reduce: {
              input: '$resolutionTypes',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $cond: [
                    { $ne: ['$$this', null] },
                    { $arrayToObject: [[ { k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }]] },
                    {}
                  ]}
                ]
              }
            }
          }
        }
      },
      { $sort: { totalActivity: -1 } }
    ]);

    // Statistiques générales d'activité
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

    res.json({
      success: true,
      period: `${days} derniers jours`,
      adminActivity: adminActivity,
      periodStats: periodStats[0] || {
        totalReportsReceived: 0,
        totalProcessed: 0,
        avgResponseTime: 0
      },
      processedReportsPercent: periodStats[0] ? 
        ((periodStats[0].totalProcessed / periodStats[0].totalReportsReceived) * 100).toFixed(1) : 0
    });

  } catch (error) {
    console.error('Erreur statistiques activité admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des statistiques d\'activité' 
    });
  }
});

module.exports = router;
