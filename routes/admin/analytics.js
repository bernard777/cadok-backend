/**
 * 📊 ANALYTICS ADMINISTRATION - CADOK
 * Routes d'analytics dédiées aux administrateurs (stats globales)
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');

const User = require('../../models/User');
const ObjectModel = require('../../models/Object');
const Trade = require('../../models/Trade');
const Report = require('../../models/Report');
const Event = require('../../models/Event');

/**
 * 🛡️ Middleware admin seulement
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès administrateur requis' 
    });
  }
  next();
};

/**
 * GET /api/admin/analytics/platform-overview
 * Vue d'ensemble de la plateforme (admins seulement)
 */
router.get('/platform-overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Chargement vue d\'ensemble plateforme...');

    const [
      totalUsers,
      activeUsers,
      totalObjects,
      activeObjects,
      totalTrades,
      completedTrades,
      totalReports,
      pendingReports,
      totalEvents,
      activeEvents
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      ObjectModel.countDocuments(),
      ObjectModel.countDocuments({ isActive: true }),
      Trade.countDocuments(),
      Trade.countDocuments({ status: 'completed' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Event.countDocuments(),
      Event.countDocuments({ isActive: true, endDate: { $gte: new Date() } })
    ]);

    const platformMetrics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercent: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      },
      objects: {
        total: totalObjects,
        active: activeObjects,
        activePercent: totalObjects > 0 ? ((activeObjects / totalObjects) * 100).toFixed(1) : 0
      },
      trades: {
        total: totalTrades,
        completed: completedTrades,
        completionRate: totalTrades > 0 ? ((completedTrades / totalTrades) * 100).toFixed(1) : 0
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: totalReports - pendingReports
      },
      events: {
        total: totalEvents,
        active: activeEvents
      }
    };

    console.log('✅ [ADMIN] Métriques plateforme calculées');
    res.json({
      success: true,
      data: platformMetrics,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur vue d\'ensemble plateforme:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des métriques plateforme' 
    });
  }
});

/**
 * GET /api/admin/analytics/user-activity
 * Activité globale des utilisateurs (admins seulement)
 */
router.get('/user-activity', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Chargement activité utilisateurs...');
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Activité par jour
    const dailyActivity = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Utilisateurs par statut
    const usersByStatus = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top utilisateurs actifs
    const topActiveUsers = await User.find({
      lastActiveAt: { $gte: startDate }
    })
    .select('pseudo email lastActiveAt trustScore')
    .sort({ lastActiveAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        dailyActivity: dailyActivity.map(item => ({
          date: item._id.date,
          newUsers: item.newUsers
        })),
        usersByStatus: usersByStatus.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        topActiveUsers: topActiveUsers.map(user => ({
          pseudo: user.pseudo,
          email: user.email,
          lastActive: user.lastActiveAt,
          trustScore: user.trustScore
        }))
      },
      period: `${days} derniers jours`
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur activité utilisateurs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement de l\'activité utilisateurs' 
    });
  }
});

/**
 * GET /api/admin/analytics/trading-overview
 * Vue d'ensemble des échanges (admins seulement)
 */
router.get('/trading-overview', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Chargement vue d\'ensemble échanges...');
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Échanges par statut
    const tradesByStatus = await Trade.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Évolution des échanges dans le temps
    const tradesEvolution = await Trade.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          totalTrades: { $sum: 1 },
          completedTrades: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Utilisateurs les plus actifs dans les échanges
    const topTraders = await Trade.aggregate([
      {
        $group: {
          _id: '$proposer',
          tradeCount: { $sum: 1 }
        }
      },
      { $sort: { tradeCount: -1 } },
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
      success: true,
      data: {
        tradesByStatus: tradesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        tradesEvolution: tradesEvolution.map(item => ({
          date: item._id.date,
          total: item.totalTrades,
          completed: item.completedTrades
        })),
        topTraders: topTraders.map(item => ({
          pseudo: item.user[0]?.pseudo || 'Utilisateur supprimé',
          tradeCount: item.tradeCount
        }))
      },
      period: `${days} derniers jours`
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur vue d\'ensemble échanges:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement de la vue d\'ensemble des échanges' 
    });
  }
});

/**
 * GET /api/admin/analytics/content-metrics
 * Métriques de contenu (objets, événements)
 */
router.get('/content-metrics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Chargement métriques contenu...');

    // Distribution des objets par catégorie
    const objectsByCategory = await Object.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Objets les plus populaires (par vues)
    const popularObjects = await Object.find({ isActive: true })
      .select('title category views owner')
      .populate('owner', 'pseudo')
      .sort({ views: -1 })
      .limit(10);

    // Événements par statut
    const eventsByStatus = await Event.aggregate([
      {
        $group: {
          _id: '$isActive',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        objectsByCategory: objectsByCategory.map(item => ({
          category: item._id || 'Non catégorisé',
          total: item.count,
          active: item.activeCount
        })),
        popularObjects: popularObjects.map(obj => ({
          title: obj.title,
          category: obj.category,
          views: obj.views || 0,
          owner: obj.owner?.pseudo || 'Utilisateur supprimé'
        })),
        eventsByStatus: {
          active: eventsByStatus.find(e => e._id === true)?.count || 0,
          inactive: eventsByStatus.find(e => e._id === false)?.count || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Erreur métriques contenu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des métriques de contenu' 
    });
  }
});

module.exports = router;
