/**
 * 📈 ROUTES ADMIN - ANALYTICS AVEC DONNÉES RÉELLES
 * Version avec vraies données de la base MongoDB
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

// Route racine pour /api/admin/analytics
router.get('/', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📈 [ANALYTICS] Récupération analytics réelles...');
    
    // Calculs statistiques réels
    const [
      totalUsers,
      activeUsers,
      totalTrades,
      completedTrades,
      totalObjects,
      avgRating
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Trade.countDocuments(),
      Trade.countDocuments({ status: 'completed' }),
      ObjectModel.countDocuments(),
      Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
      ]).then(result => result[0]?.avgRating || 0)
    ]);

    const successRate = totalTrades > 0 ? (completedTrades / totalTrades * 100) : 0;

    const analytics = {
      success: true,
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          totalTrades,
          successRate: Math.round(successRate * 10) / 10,
          averageRating: Math.round(avgRating * 10) / 10
        },
        growth: {
          usersGrowth: await calculateGrowth('User', 'createdAt'),
          tradesGrowth: await calculateGrowth('Trade', 'createdAt'),
          objectsGrowth: await calculateGrowth('Object', 'createdAt')
        },
        activity: {
          dailyActive: await User.countDocuments({
            lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }),
          weeklyActive: await User.countDocuments({
            lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }),
          monthlyActive: await User.countDocuments({
            lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          })
        },
        period: 'last30days',
        lastUpdated: new Date().toISOString()
      }
    };
    
    console.log('✅ [ANALYTICS] Analytics réelles envoyées');
    res.json(analytics);
  } catch (error) {
    console.error('❌ [ANALYTICS] Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération analytics' 
    });
  }
});

// Fonction helper pour calculer la croissance
async function calculateGrowth(modelName, dateField) {
  try {
    let Model;
    // Mapping des noms de modèles
    switch(modelName) {
      case 'User':
        Model = User;
        break;
      case 'Trade':
        Model = Trade;
        break;
      case 'Object':
        Model = ObjectModel;
        break;
      default:
        Model = require(`../../models/${modelName}`);
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const [currentMonth, previousMonth] = await Promise.all([
      Model.countDocuments({ [dateField]: { $gte: lastMonth } }),
      Model.countDocuments({ 
        [dateField]: { $gte: twoMonthsAgo, $lt: lastMonth } 
      })
    ]);

    if (previousMonth === 0) return '+100%';
    const growth = ((currentMonth - previousMonth) / previousMonth * 100);
    return (growth >= 0 ? '+' : '') + Math.round(growth) + '%';
  } catch (error) {
    console.error(`❌ Erreur calcul croissance ${modelName}:`, error);
    return '0%';
  }
}

// Route platform-overview pour compatibilité avec données réelles
router.get('/platform-overview', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📈 [ANALYTICS] Platform overview avec données réelles...');
    
    // Récupération des données réelles
    const [
      totalUsers,
      activeUsers,
      totalTrades,
      successfulTrades,
      totalObjects,
      availableObjects
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Trade.countDocuments(),
      Trade.countDocuments({ status: 'completed' }),
      ObjectModel.countDocuments(),
      ObjectModel.countDocuments({ status: 'available' })
    ]);

    // Calcul du revenue (basé sur les trades complétés - exemple)
    const monthlyRevenue = successfulTrades * 2.5; // 2.5€ par trade complété
    const lastMonthTrades = await Trade.countDocuments({
      status: 'completed',
      completedAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    
    const revenueGrowth = lastMonthTrades > 0 ? 
      Math.round(((successfulTrades - lastMonthTrades) / lastMonthTrades) * 100) : 100;

    const platformData = {
      success: true,
      platform: {
        users: { total: totalUsers, active: activeUsers },
        trades: { total: totalTrades, successful: successfulTrades },
        objects: { total: totalObjects, available: availableObjects },
        revenue: { 
          monthly: Math.round(monthlyRevenue * 100) / 100, 
          growth: (revenueGrowth >= 0 ? '+' : '') + revenueGrowth + '%' 
        }
      }
    };
    
    console.log('✅ [ANALYTICS] Platform overview réelle envoyée');
    res.json(platformData);
  } catch (error) {
    console.error('❌ [ANALYTICS] Erreur platform:', error);
    res.status(500).json({ success: false, error: 'Erreur platform analytics' });
  }
});

module.exports = router;