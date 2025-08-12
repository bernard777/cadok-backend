/**
 * 📊 SERVICE ANALYTICS AVANCÉ - CADOK
 * Tableaux de bord et métriques intelligentes pour les utilisateurs
 */

const User = require('../models/User');
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const moment = require('moment');

class AnalyticsService {
  
  /**
   * 📈 Tableau de bord utilisateur complet
   */
  async getUserDashboard(userId) {
    try {
      console.log('📊 Génération dashboard analytics pour:', userId);

      const [
        userStats,
        tradingMetrics,
        objectsMetrics,
        communityRanking,
        monthlyTrends,
        personalizedTips
      ] = await Promise.all([
        this.getUserBasicStats(userId),
        this.getTradingMetrics(userId),
        this.getObjectsMetrics(userId),
        this.getCommunityRanking(userId),
        this.getMonthlyTrends(userId),
        this.getPersonalizedTips(userId)
      ]);

      return {
        success: true,
        data: {
          userStats,
          tradingMetrics,
          objectsMetrics,
          communityRanking,
          monthlyTrends,
          personalizedTips,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Erreur génération dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 👤 Statistiques de base utilisateur
   */
  async getUserBasicStats(userId) {
    const user = await User.findById(userId);
    const joinDate = moment(user.createdAt);
    const daysSinceJoin = moment().diff(joinDate, 'days');

    return {
      memberSince: joinDate.format('MMMM YYYY'),
      daysSinceJoin,
      profileCompletion: this.calculateProfileCompletion(user),
      trustScore: user.trustScore || 0,
      totalRating: user.averageRating || 0,
      totalReviews: user.reviewCount || 0
    };
  }

  /**
   * 🔄 Métriques d'échange
   */
  async getTradingMetrics(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    const completedTrades = trades.filter(t => t.status === 'completed');
    const pendingTrades = trades.filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status));
    
    // Calculs avancés
    const successRate = trades.length > 0 ? (completedTrades.length / trades.length) * 100 : 0;
    const avgCompletionTime = this.calculateAvgCompletionTime(completedTrades);
    const favoriteCategories = await this.getFavoriteCategories(userId);

    return {
      totalTrades: trades.length,
      completedTrades: completedTrades.length,
      pendingTrades: pendingTrades.length,
      cancelledTrades: trades.filter(t => t.status === 'cancelled').length,
      successRate: Math.round(successRate),
      avgCompletionTime,
      favoriteCategories,
      bestTradingDay: await this.getBestTradingDay(userId),
      tradingStreak: await this.getCurrentTradingStreak(userId)
    };
  }

  /**
   * 📦 Métriques objets
   */
  async getObjectsMetrics(userId) {
    const objects = await ObjectModel.find({ owner: userId });
    
    const activeObjects = objects.filter(o => o.status === 'available');
    const tradedObjects = objects.filter(o => o.status === 'traded');
    
    return {
      totalObjects: objects.length,
      activeObjects: activeObjects.length,
      tradedObjects: tradedObjects.length,
      mostPopularObject: await this.getMostPopularObject(userId),
      avgObjectValue: this.calculateAvgObjectValue(objects),
      categoriesCount: new Set(objects.map(o => o.category)).size,
      objectsWithImages: objects.filter(o => o.images && o.images.length > 0).length
    };
  }

  /**
   * 🏆 Classement communautaire
   */
  async getCommunityRanking(userId) {
    // Classement basé sur le score de confiance
    const allUsers = await User.find({}, 'trustScore').sort({ trustScore: -1 });
    const userPosition = allUsers.findIndex(u => u._id.toString() === userId.toString()) + 1;
    const totalUsers = allUsers.length;
    const percentile = Math.round((1 - (userPosition / totalUsers)) * 100);

    return {
      position: userPosition,
      totalUsers,
      percentile,
      category: this.getUserCategory(percentile),
      nextMilestone: this.getNextMilestone(userPosition)
    };
  }

  /**
   * 📈 Tendances mensuelles
   */
  async getMonthlyTrends(userId) {
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = moment().subtract(i, 'months').startOf('month');
      const monthEnd = moment().subtract(i, 'months').endOf('month');
      
      const [tradesCount, objectsCount] = await Promise.all([
        Trade.countDocuments({
          $or: [{ fromUser: userId }, { toUser: userId }],
          createdAt: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() }
        }),
        ObjectModel.countDocuments({
          owner: userId,
          createdAt: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() }
        })
      ]);

      last6Months.push({
        month: monthStart.format('MMM YYYY'),
        trades: tradesCount,
        objects: objectsCount,
        activity: tradesCount + objectsCount
      });
    }

    return {
      monthlyData: last6Months,
      trend: this.calculateTrend(last6Months),
      mostActiveMonth: last6Months.reduce((max, current) => 
        current.activity > max.activity ? current : max
      )
    };
  }

  /**
   * 💡 Conseils personnalisés
   */
  async getPersonalizedTips(userId) {
    const tips = [];
    
    const user = await User.findById(userId);
    const objects = await ObjectModel.find({ owner: userId });
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    // Conseils basés sur l'activité
    if (objects.length === 0) {
      tips.push({
        type: 'objects',
        priority: 'high',
        title: 'Ajoutez votre premier objet',
        message: 'Commencez par ajouter un objet pour démarrer les échanges !',
        action: 'add_object'
      });
    }

    if (objects.filter(o => !o.images || o.images.length === 0).length > 0) {
      tips.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Ajoutez des photos',
        message: 'Les objets avec photos ont 3x plus de chances d\'être échangés',
        action: 'add_photos'
      });
    }

    if (trades.length > 0) {
      const successRate = trades.filter(t => t.status === 'completed').length / trades.length;
      if (successRate < 0.8) {
        tips.push({
          type: 'improvement',
          priority: 'medium',
          title: 'Améliorez votre taux de réussite',
          message: 'Communiquez mieux avec vos partenaires d\'échange',
          action: 'improve_communication'
        });
      }
    }

    return tips;
  }

  // 🛠️ MÉTHODES UTILITAIRES

  calculateProfileCompletion(user) {
    let score = 0;
    if (user.pseudo) score += 20;
    if (user.city) score += 20;
    if (user.avatar) score += 15;
    if (user.favoriteCategories && user.favoriteCategories.length > 0) score += 25;
    if (user.bio) score += 20;
    return score;
  }

  calculateAvgCompletionTime(trades) {
    if (trades.length === 0) return 0;
    
    const times = trades
      .filter(t => t.completedAt && t.createdAt)
      .map(t => moment(t.completedAt).diff(moment(t.createdAt), 'days'));
    
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  }

  async getFavoriteCategories(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }]
    }).populate('fromObject toObject', 'category');

    const categories = {};
    trades.forEach(trade => {
      if (trade.fromObject?.category) {
        categories[trade.fromObject.category] = (categories[trade.fromObject.category] || 0) + 1;
      }
      if (trade.toObject?.category) {
        categories[trade.toObject.category] = (categories[trade.toObject.category] || 0) + 1;
      }
    });

    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  }

  async getBestTradingDay(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });

    const dayCount = {};
    trades.forEach(trade => {
      const day = moment(trade.createdAt).format('dddd');
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const bestDay = Object.entries(dayCount).reduce((max, [day, count]) => 
      count > max.count ? { day, count } : max, { day: 'Lundi', count: 0 });

    return bestDay.day;
  }

  async getCurrentTradingStreak(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    }).sort({ completedAt: -1 });

    let streak = 0;
    let lastDate = null;

    for (const trade of trades) {
      const tradeDate = moment(trade.completedAt).startOf('day');
      
      if (lastDate === null) {
        streak = 1;
        lastDate = tradeDate;
      } else {
        const daysDiff = lastDate.diff(tradeDate, 'days');
        if (daysDiff === 1) {
          streak++;
          lastDate = tradeDate;
        } else {
          break;
        }
      }
    }

    return streak;
  }

  async getMostPopularObject(userId) {
    // Simulé : objet avec le plus d'intérêts/vues
    const objects = await ObjectModel.find({ owner: userId }).sort({ createdAt: -1 });
    return objects[0] ? {
      name: objects[0].title,
      views: Math.floor(Math.random() * 50) + 10, // Simulé
      interests: Math.floor(Math.random() * 20) + 5 // Simulé
    } : null;
  }

  calculateAvgObjectValue(objects) {
    if (objects.length === 0) return 0;
    // Pour un système de troc pur, on supprime les calculs basés sur la valeur monétaire
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  getUserCategory(percentile) {
    if (percentile >= 90) return 'Elite Trader';
    if (percentile >= 75) return 'Expert';
    if (percentile >= 50) return 'Trader Confirmé';
    if (percentile >= 25) return 'Trader';
    return 'Débutant';
  }

  getNextMilestone(position) {
    const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];
    const nextMilestone = milestones.find(m => m < position);
    return nextMilestone || position - 1;
  }

  calculateTrend(monthlyData) {
    if (monthlyData.length < 2) return 'stable';
    
    const recent = monthlyData.slice(-2);
    const change = recent[1].activity - recent[0].activity;
    
    if (change > 0) return 'increasing';
    if (change < 0) return 'decreasing';
    return 'stable';
  }
}

module.exports = AnalyticsService;
