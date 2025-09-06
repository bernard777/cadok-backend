/**
 * 📊 ROUTES ADMIN - STATISTIQUES RÉELLES
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');

// Modèles
const User = require('../../models/User');
const Trade = require('../../models/Trade');
const ObjectModel = require('../../models/Object');
const Event = require('../../models/Event');
const Review = require('../../models/Review');

// Route racine pour /api/admin/stats avec données réelles
router.get('/', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📊 [STATS] Récupération des statistiques réelles...');
    
    // Récupération des statistiques réelles depuis la base de données
    const [
      totalUsers,
      totalTrades,
      totalObjects,
      totalEvents,
      totalReviews,
      activeUsers,
      completedTrades,
      availableObjects,
      activeEvents
    ] = await Promise.all([
      User.countDocuments(),
      Trade.countDocuments(),
      ObjectModel.countDocuments(),
      Event.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Trade.countDocuments({ status: 'completed' }),
      ObjectModel.countDocuments({ status: 'available' }),
      Event.countDocuments({ isActive: true })
    ]);

    console.log('📊 [STATS] Données calculées:', {
      totalUsers, totalTrades, totalObjects, totalEvents, totalReviews
    });

    // Calculer les données mensuelles pour les 6 derniers mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyUsers, monthlyTrades] = await Promise.all([
      // Utilisateurs créés par mois
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]),
      
      // Échanges créés par mois
      Trade.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ])
    ]);

    console.log('📊 [STATS] Données mensuelles calculées:', {
      monthlyUsers: monthlyUsers.length,
      monthlyTrades: monthlyTrades.length
    });

    // Stats formatées pour l'interface frontend
    const stats = {
      success: true,
      totalUsers,
      totalTrades,
      totalObjects,
      totalEvents,
      totalReviews,
      // Données détaillées réelles
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: await User.countDocuments({
            createdAt: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
            }
          }),
          monthly: monthlyUsers
        },
        trades: {
          total: totalTrades,
          completed: completedTrades,
          pending: await Trade.countDocuments({ status: { $in: ['pending', 'accepted'] } }),
          monthly: monthlyTrades
        },
        objects: {
          total: totalObjects,
          available: availableObjects,
          traded: await Trade.countDocuments({ status: 'completed' })
        },
        events: {
          total: totalEvents,
          active: activeEvents
        },
        reviews: {
          total: totalReviews,
          averageRating: await Review.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
          ]).then(result => result[0]?.avgRating || 0),
          thisMonth: await Review.countDocuments({
            createdAt: { 
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
            }
          })
        }
      },
      generated: new Date().toISOString()
    };
    
    console.log('✅ [STATS] Statistiques réelles envoyées');
    res.json(stats);
  } catch (error) {
    console.error('❌ [STATS] Erreur récupération stats réelles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération statistiques' 
    });
  }
});

module.exports = router;