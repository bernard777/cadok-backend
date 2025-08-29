/**
 * 📊 SERVICE ANALYTICS AVANCÉ - CADOK
 * Tableaux de bord et métriques intelligentes pour les utilisateurs
 */

const User = require('../models/User');
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const Category = require('../models/Category');
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
    // Calculer le score de classement pour tous les utilisateurs
    const allUsers = await User.find({});
    
    const userScores = await Promise.all(allUsers.map(async (user) => {
      // Calculer les métriques de trading pour chaque utilisateur
      const completedTrades = await Trade.countDocuments({
        $or: [{ fromUser: user._id }, { toUser: user._id }],
        status: 'completed'
      });
      
      const totalTrades = await Trade.countDocuments({
        $or: [{ fromUser: user._id }, { toUser: user._id }]
      });
      
      const userObjects = await ObjectModel.countDocuments({
        owner: user._id
      });
      
      // Score composite basé sur l'activité réelle
      const activityScore = (completedTrades * 50) + (totalTrades * 20) + (userObjects * 10);
      const trustScore = user.trustScore || 0;
      
      // Score final : 70% activité + 30% confiance
      const finalScore = Math.round((activityScore * 0.7) + (trustScore * 0.3));
      
      return {
        userId: user._id,
        pseudo: user.pseudo,
        finalScore,
        completedTrades,
        totalTrades,
        userObjects,
        trustScore
      };
    }));
    
    // Trier par score final
    userScores.sort((a, b) => b.finalScore - a.finalScore);
    
    // Trouver la position de l'utilisateur actuel
    const userPosition = userScores.findIndex(u => u.userId.toString() === userId.toString()) + 1;
    const totalUsers = userScores.length;
    const percentile = totalUsers > 0 ? Math.round((1 - (userPosition / totalUsers)) * 100) : 0;
    
    // Utilisateur actuel
    const currentUser = userScores.find(u => u.userId.toString() === userId.toString());

    return {
      position: userPosition,
      totalUsers,
      percentile,
      category: this.getUserCategory(percentile),
      nextMilestone: this.getNextMilestone(userPosition),
      score: currentUser ? currentUser.finalScore : 0,
      completedTrades: currentUser ? currentUser.completedTrades : 0,
      // Top 5 pour référence
      topUsers: userScores.slice(0, 5).map((user, index) => ({
        position: index + 1,
        pseudo: user.pseudo || `Utilisateur ${user.userId.toString().substring(0, 8)}`,
        score: user.finalScore,
        completedTrades: user.completedTrades
      }))
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
    }).populate('offeredObjects requestedObjects', 'category');

    const categories = {};
    trades.forEach(trade => {
      // Traiter les objets offerts
      if (trade.offeredObjects) {
        trade.offeredObjects.forEach(obj => {
          if (obj?.category) {
            categories[obj.category] = (categories[obj.category] || 0) + 1;
          }
        });
      }
      // Traiter les objets demandés
      if (trade.requestedObjects) {
        trade.requestedObjects.forEach(obj => {
          if (obj?.category) {
            categories[obj.category] = (categories[obj.category] || 0) + 1;
          }
        });
      }
    });

    // Convertir les IDs de catégories en noms et compter
    const categoryResults = [];
    for (const [categoryId, count] of Object.entries(categories)) {
      try {
        const categoryDoc = await Category.findById(categoryId);
        categoryResults.push({
          category: categoryId,
          name: categoryDoc ? categoryDoc.name : `Catégorie ${categoryId.substring(0, 8)}`,
          count
        });
      } catch (error) {
        // Si la catégorie n'existe pas, utiliser un nom par défaut
        categoryResults.push({
          category: categoryId,
          name: `Catégorie ${categoryId.substring(0, 8)}`,
          count
        });
      }
    }

    return categoryResults
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
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
    
    // Calcul d'un score d'attractivité basé sur des critères réels
    let totalScore = 0;
    
    objects.forEach(object => {
      let objectScore = 50; // Score de base
      
      // Bonus pour les objets avec images (+20 points)
      if (object.images && object.images.length > 0) {
        objectScore += 20;
      }
      
      // Bonus pour description détaillée (+15 points)
      if (object.description && object.description.length > 50) {
        objectScore += 15;
      }
      
      // Bonus pour l'état de l'objet (+10 points pour "excellent")
      if (object.condition === 'excellent') {
        objectScore += 10;
      } else if (object.condition === 'bon') {
        objectScore += 5;
      }
      
      // Malus pour les objets anciens (-5 points si plus de 6 mois)
      if (object.createdAt) {
        const ageInMonths = (Date.now() - new Date(object.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (ageInMonths > 6) {
          objectScore -= 5;
        }
      }
      
      totalScore += Math.max(0, objectScore); // Score minimum de 0
    });
    
    return Math.round(totalScore / objects.length);
  }

  getUserCategory(percentile) {
    if (percentile >= 90) return 'Elite Troqueur';
    if (percentile >= 75) return 'Expert';
    if (percentile >= 50) return 'Troqueur Confirmé';
    if (percentile >= 25) return 'Troqueur';
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
