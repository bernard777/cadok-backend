/**
 * 🌱 SERVICE IMPACT ÉCOLOGIQUE - CADOK
 * Calcul et suivi de l'empreinte environnementale
 */

const User = require('../models/User');
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const moment = require('moment');

class EcoImpactService {

  /**
   * 🌍 Dashboard écologique complet pour un utilisateur
   */
  async getUserEcoDashboard(userId) {
    try {
      console.log(`🌱 Génération dashboard écologique pour ${userId}...`);

      const [
        carbonFootprint,
        objectsLifecycle,
        communityImpact,
        monthlyProgress,
        ecoAchievements,
        recommendations
      ] = await Promise.all([
        this.calculateCarbonFootprint(userId),
        this.analyzeObjectsLifecycle(userId),
        this.getCommunityEcoImpact(userId),
        this.getMonthlyEcoProgress(userId),
        this.getEcoAchievements(userId),
        this.getEcoRecommendations(userId)
      ]);

      return {
        success: true,
        dashboard: {
          carbonFootprint,
          objectsLifecycle,
          communityImpact,
          monthlyProgress,
          ecoAchievements,
          recommendations,
          generatedAt: new Date(),
          ecoScore: this.calculateEcoScore(carbonFootprint, objectsLifecycle, communityImpact)
        }
      };

    } catch (error) {
      console.error('❌ Erreur dashboard écologique:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🌿 Calcul de l'empreinte carbone évitée
   */
  async calculateCarbonFootprint(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    }).populate('fromObject toObject');

    let totalCarbonSaved = 0;
    let totalWastePrevented = 0;
    let newProductsAvoided = 0;

    const carbonFactors = {
      'Électronique': 150, // kg CO2 par objet neuf évité
      'Vêtements': 25,
      'Meubles': 80,
      'Livres': 2,
      'Véhicules': 500,
      'Électroménager': 120,
      'Sport': 35,
      'Jardin': 20,
      'Décoration': 15,
      'Autre': 30
    };

    const wasteFactors = {
      'Électronique': 5, // kg de déchets évités
      'Vêtements': 0.5,
      'Meubles': 20,
      'Livres': 0.3,
      'Véhicules': 100,
      'Électroménager': 30,
      'Sport': 2,
      'Jardin': 3,
      'Décoration': 1,
      'Autre': 2
    };

    for (const trade of trades) {
      const objects = [trade.fromObject, trade.toObject].filter(Boolean);
      
      for (const object of objects) {
        const categoryName = object.category?.name || 'Autre';
        
        // CO2 évité (achat neuf évité)
        const carbonSaved = carbonFactors[categoryName] || carbonFactors['Autre'];
        totalCarbonSaved += carbonSaved;
        
        // Déchets évités (objet donné une seconde vie)
        const wasteAvoided = wasteFactors[categoryName] || wasteFactors['Autre'];
        totalWastePrevented += wasteAvoided;
        
        newProductsAvoided++;
      }
    }

    // Calcul de l'équivalent en arbres sauvés (1 arbre = ~22 kg CO2/an)
    const treesEquivalent = Math.round(totalCarbonSaved / 22);

    // Économies financières estimées (prix neuf évité)
    const averageNewPrice = 150; // Prix moyen d'un objet neuf
    const financialSavings = newProductsAvoided * averageNewPrice;

    return {
      totalCarbonSaved: Math.round(totalCarbonSaved), // kg CO2
      totalWastePrevented: Math.round(totalWastePrevented), // kg déchets
      newProductsAvoided,
      treesEquivalent,
      financialSavings,
      impactLevel: this.getImpactLevel(totalCarbonSaved),
      breakdown: {
        byCategory: this.getCarbonBreakdownByCategory(trades, carbonFactors),
        byMonth: await this.getCarbonBreakdownByMonth(userId)
      }
    };
  }

  /**
   * 🔄 Analyse du cycle de vie des objets
   */
  async analyzeObjectsLifecycle(userId) {
    const userObjects = await ObjectModel.find({ owner: userId });
    const userTrades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });

    let totalObjectsShared = userObjects.length;
    let averageObjectAge = 0;
    let objectsGivenSecondLife = 0;
    let circularityScore = 0;

    // Calcul de l'âge moyen des objets partagés
    if (userObjects.length > 0) {
      const totalAge = userObjects.reduce((sum, obj) => {
        const age = moment().diff(moment(obj.purchaseDate || obj.createdAt), 'years', true);
        return sum + Math.max(age, 0);
      }, 0);
      averageObjectAge = totalAge / userObjects.length;
    }

    // Objets ayant eu une seconde vie grâce aux échanges
    objectsGivenSecondLife = userTrades.length;

    // Score de circularité (0-100)
    const extensionRate = objectsGivenSecondLife > 0 ? (averageObjectAge * objectsGivenSecondLife) / totalObjectsShared : 0;
    circularityScore = Math.min(100, extensionRate * 20);

    // Analyse des catégories les plus échangées
    const categoryStats = await this.getCategoryLifecycleStats(userId);

    return {
      totalObjectsShared,
      averageObjectAge: Math.round(averageObjectAge * 10) / 10,
      objectsGivenSecondLife,
      circularityScore: Math.round(circularityScore),
      lifetimeExtension: Math.round(averageObjectAge * 12), // mois supplémentaires
      categoryStats,
      sustainabilityLevel: this.getSustainabilityLevel(circularityScore)
    };
  }

  /**
   * 🏘️ Impact écologique communautaire
   */
  async getCommunityEcoImpact(userId) {
    const user = await User.findById(userId);
    if (!user) return {};

    // Trouver la communauté locale (même ville)
    const localUsers = await User.find({ 
      city: user.city,
      _id: { $ne: userId }
    });

    const localTrades = await Trade.find({
      $or: [
        { fromUser: { $in: localUsers.map(u => u._id) } },
        { toUser: { $in: localUsers.map(u => u._id) } }
      ],
      status: 'completed'
    });

    // Calcul de l'impact local
    const communitySize = localUsers.length + 1; // +1 pour l'utilisateur
    const totalLocalTrades = localTrades.length;
    const avgTradesPerUser = totalLocalTrades / communitySize;
    
    // Classement de l'utilisateur dans sa communauté
    const userTradeCount = await Trade.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });

    const betterUsers = await this.countUsersBetterThan(userId, user.city);
    const communityRanking = Math.ceil((betterUsers / communitySize) * 100);

    // Impact collectif de la ville
    const cityImpact = await this.calculateCityEcoImpact(user.city);

    return {
      communitySize,
      communityRanking: 100 - communityRanking, // Percentile (plus élevé = mieux)
      userTradeCount,
      avgTradesPerUser: Math.round(avgTradesPerUser * 10) / 10,
      cityImpact,
      localLeaderboard: await this.getLocalEcoLeaderboard(user.city, 5),
      communityGoals: this.getCommunityEcoGoals(cityImpact)
    };
  }

  /**
   * 📊 Progrès écologique mensuel
   */
  async getMonthlyEcoProgress(userId) {
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const startDate = moment().subtract(i, 'months').startOf('month');
      const endDate = moment().subtract(i, 'months').endOf('month');
      
      const monthTrades = await Trade.find({
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: 'completed',
        completedAt: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate()
        }
      });

      const monthObjects = await ObjectModel.find({
        owner: userId,
        createdAt: {
          $gte: startDate.toDate(),
          $lte: endDate.toDate()
        }
      });

      // Calcul du CO2 évité ce mois-ci
      const monthlyCarbonSaved = monthTrades.length * 50; // Estimation moyenne

      months.push({
        month: startDate.format('YYYY-MM'),
        monthName: startDate.format('MMMM'),
        tradesCompleted: monthTrades.length,
        objectsShared: monthObjects.length,
        carbonSaved: monthlyCarbonSaved,
        ecoScore: this.calculateMonthlyEcoScore(monthTrades.length, monthObjects.length)
      });
    }

    // Tendance générale
    const recentMonths = months.slice(-3);
    const earlierMonths = months.slice(0, 3);
    
    const recentAvg = recentMonths.reduce((sum, m) => sum + m.ecoScore, 0) / recentMonths.length;
    const earlierAvg = earlierMonths.reduce((sum, m) => sum + m.ecoScore, 0) / earlierMonths.length;
    
    const trend = recentAvg > earlierAvg ? 'improving' : recentAvg < earlierAvg ? 'declining' : 'stable';

    return {
      monthlyData: months,
      trend,
      trendPercentage: Math.round(((recentAvg - earlierAvg) / earlierAvg) * 100) || 0,
      totalCarbonSaved: months.reduce((sum, m) => sum + m.carbonSaved, 0),
      bestMonth: months.reduce((best, current) => current.ecoScore > best.ecoScore ? current : best, months[0])
    };
  }

  /**
   * 🏆 Réalisations écologiques
   */
  async getEcoAchievements(userId) {
    const userStats = await this.getUserEcoStats(userId);
    
    const achievements = [];
    const badges = [];

    // Badges basés sur les échanges
    if (userStats.totalTrades >= 1) badges.push({ name: 'Première graine', icon: '🌱', earned: true });
    if (userStats.totalTrades >= 5) badges.push({ name: 'Jardinier', icon: '🌿', earned: true });
    if (userStats.totalTrades >= 15) badges.push({ name: 'Écologiste', icon: '🌳', earned: true });
    if (userStats.totalTrades >= 50) badges.push({ name: 'Gardien de la planète', icon: '🌍', earned: true });

    // Badges basés sur le CO2
    if (userStats.carbonSaved >= 100) badges.push({ name: 'Sauveur de CO2', icon: '💨', earned: true });
    if (userStats.carbonSaved >= 500) badges.push({ name: 'Guerrier du climat', icon: '⚡', earned: true });
    if (userStats.carbonSaved >= 1000) badges.push({ name: 'Héros écologique', icon: '🦸', earned: true });

    // Badges spécialisés
    if (userStats.consecutiveDays >= 7) badges.push({ name: 'Engagement vert', icon: '💚', earned: true });
    if (userStats.monthlyStreak >= 3) badges.push({ name: 'Consistance écologique', icon: '📈', earned: true });

    // Prochains badges à débloquer
    const nextBadges = [
      { name: 'Maître du recyclage', icon: '♻️', requirement: 'Échanger 100 objets', progress: userStats.totalTrades, target: 100 },
      { name: 'Champion zéro déchet', icon: '🗑️', requirement: 'Éviter 1 tonne de déchets', progress: userStats.wastePrevented, target: 1000 },
      { name: 'Ambassadeur planète', icon: '🌟', requirement: 'Influencer 10 nouveaux utilisateurs', progress: 0, target: 10 }
    ];

    return {
      totalBadges: badges.length,
      badges,
      nextBadges: nextBadges.filter(b => b.progress < b.target).slice(0, 3),
      achievements,
      completionRate: Math.round((badges.length / (badges.length + nextBadges.length)) * 100)
    };
  }

  /**
   * 💡 Recommandations écologiques personnalisées
   */
  async getEcoRecommendations(userId) {
    const [userStats, userPrefs, seasonalTrends] = await Promise.all([
      this.getUserEcoStats(userId),
      this.getUserEcoPreferences(userId),
      this.getSeasonalEcoTrends()
    ]);

    const recommendations = [];

    // Recommandations basées sur l'activité
    if (userStats.totalTrades < 5) {
      recommendations.push({
        type: 'beginner',
        title: 'Commencez votre parcours écologique',
        message: 'Votre prochain échange pourrait éviter 25 kg de CO2 !',
        action: 'Parcourir les objets disponibles',
        priority: 'high',
        icon: '🌱'
      });
    }

    if (userStats.monthlyTrades === 0) {
      recommendations.push({
        type: 'reactivation',
        title: 'Un petit geste pour la planète',
        message: 'Reprenez vos échanges pour continuer votre impact positif',
        action: 'Voir mes objets à échanger',
        priority: 'medium',
        icon: '🔄'
      });
    }

    // Recommandations saisonnières
    recommendations.push({
      type: 'seasonal',
      title: seasonalTrends.title,
      message: seasonalTrends.message,
      action: seasonalTrends.action,
      priority: 'low',
      icon: seasonalTrends.icon
    });

    // Recommandations basées sur les catégories
    if (userPrefs.preferredCategories?.length > 0) {
      recommendations.push({
        type: 'category',
        title: 'Objets recommandés pour vous',
        message: `${userPrefs.preferredCategories.length} nouvelles opportunités dans vos catégories favorites`,
        action: 'Explorer mes catégories',
        priority: 'medium',
        icon: '🎯'
      });
    }

    // Conseils d'amélioration
    const improvementTips = this.getImprovementTips(userStats);
    recommendations.push(...improvementTips);

    return {
      recommendations: recommendations.slice(0, 5),
      totalAvailable: recommendations.length,
      personalizedScore: this.calculatePersonalizationScore(userStats, recommendations)
    };
  }

  // 🛠️ MÉTHODES UTILITAIRES

  calculateEcoScore(carbonFootprint, lifecycle, community) {
    const carbonScore = Math.min(100, carbonFootprint.totalCarbonSaved / 10);
    const lifecycleScore = lifecycle.circularityScore || 0;
    const communityScore = community.communityRanking || 50;
    
    return Math.round((carbonScore * 0.4) + (lifecycleScore * 0.4) + (communityScore * 0.2));
  }

  getImpactLevel(carbonSaved) {
    if (carbonSaved >= 1000) return 'Champion';
    if (carbonSaved >= 500) return 'Expert';
    if (carbonSaved >= 200) return 'Avancé';
    if (carbonSaved >= 50) return 'Intermédiaire';
    return 'Débutant';
  }

  getSustainabilityLevel(circularityScore) {
    if (circularityScore >= 80) return 'Exemplaire';
    if (circularityScore >= 60) return 'Excellent';
    if (circularityScore >= 40) return 'Bon';
    if (circularityScore >= 20) return 'Correct';
    return 'À améliorer';
  }

  calculateMonthlyEcoScore(trades, objects) {
    return Math.min(100, (trades * 15) + (objects * 5));
  }

  async getUserEcoStats(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });

    const objects = await ObjectModel.find({ owner: userId });
    
    return {
      totalTrades: trades.length,
      monthlyTrades: trades.filter(t => moment(t.completedAt).isAfter(moment().subtract(1, 'month'))).length,
      carbonSaved: trades.length * 50, // Estimation
      wastePrevented: trades.length * 2, // Estimation
      consecutiveDays: 0, // Simplification
      monthlyStreak: 0 // Simplification
    };
  }

  async getUserEcoPreferences(userId) {
    const user = await User.findById(userId).populate('favoriteCategories');
    return {
      preferredCategories: user?.favoriteCategories || []
    };
  }

  getSeasonalEcoTrends() {
    const season = moment().month() < 3 || moment().month() >= 11 ? 'winter' : 
                  moment().month() < 6 ? 'spring' : 
                  moment().month() < 9 ? 'summer' : 'autumn';

    const trends = {
      winter: {
        title: 'Chauffage responsable',
        message: 'Échangez vos appareils de chauffage pour un hiver plus vert',
        action: 'Voir les électroménagers',
        icon: '❄️'
      },
      spring: {
        title: 'Jardinage écologique',
        message: 'Préparez votre jardin avec des outils d\'occasion',
        action: 'Explorer le jardinage',
        icon: '🌸'
      },
      summer: {
        title: 'Vacances durables',
        message: 'Équipez-vous pour l\'été sans acheter neuf',
        action: 'Matériel de loisirs',
        icon: '☀️'
      },
      autumn: {
        title: 'Rentrée responsable',
        message: 'Préparez la rentrée avec des fournitures d\'occasion',
        action: 'Fournitures scolaires',
        icon: '🍂'
      }
    };

    return trends[season];
  }

  getImprovementTips(userStats) {
    const tips = [];

    if (userStats.totalTrades < 10) {
      tips.push({
        type: 'improvement',
        title: 'Diversifiez vos échanges',
        message: 'Essayez différentes catégories pour maximiser votre impact',
        action: 'Explorer toutes les catégories',
        priority: 'medium',
        icon: '🎨'
      });
    }

    return tips;
  }

  calculatePersonalizationScore(userStats, recommendations) {
    return Math.min(100, (userStats.totalTrades * 5) + (recommendations.length * 10));
  }

  async getCategoryLifecycleStats(userId) {
    // Simplification pour l'exemple
    return [
      { category: 'Électronique', count: 3, avgLifeExtension: 24 },
      { category: 'Vêtements', count: 7, avgLifeExtension: 18 },
      { category: 'Livres', count: 5, avgLifeExtension: 12 }
    ];
  }

  async calculateCityEcoImpact(city) {
    const cityTrades = await Trade.find({ status: 'completed' });
    return {
      totalCarbonSaved: cityTrades.length * 50,
      totalTrades: cityTrades.length,
      ranking: 1 // Simplification
    };
  }

  async getLocalEcoLeaderboard(city, limit) {
    // Simplification - dans un vrai système, on calculerait les vrais scores
    return [
      { username: 'EcoWarrior', ecoScore: 950, rank: 1 },
      { username: 'GreenMaster', ecoScore: 890, rank: 2 },
      { username: 'PlanetSaver', ecoScore: 830, rank: 3 }
    ].slice(0, limit);
  }

  getCommunityEcoGoals(cityImpact) {
    return {
      monthly: { target: 1000, current: cityImpact.totalCarbonSaved, unit: 'kg CO2' },
      yearly: { target: 12000, current: cityImpact.totalCarbonSaved * 12, unit: 'kg CO2' }
    };
  }

  getCarbonBreakdownByCategory(trades, factors) {
    // Simplification pour l'exemple
    return {
      'Électronique': 450,
      'Vêtements': 200,
      'Meubles': 320,
      'Autres': 180
    };
  }

  async getCarbonBreakdownByMonth(userId) {
    // Simplification - retour de données d'exemple
    return [
      { month: '2024-01', carbon: 120 },
      { month: '2024-02', carbon: 180 },
      { month: '2024-03', carbon: 200 }
    ];
  }

  async countUsersBetterThan(userId, city) {
    // Simplification
    return Math.floor(Math.random() * 20);
  }
}

module.exports = EcoImpactService;
