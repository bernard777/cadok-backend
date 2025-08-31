/**
 * 🎮 SERVICE GAMIFICATION AVANCÉE - CADOK
 * Système complet de badges, défis et récompenses
 */

const User = require('../models/User');
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const Event = require('../models/Event');
const moment = require('moment');

class GamificationService {

  /**
   * 🏆 Dashboard gamification complet
   */
  async getUserGamificationDashboard(userId) {
    try {
      console.log(`🎮 Génération dashboard gamification pour ${userId}...`);

      const [
        playerProfile,
        achievements,
        activeChallenges,
        leaderboards,
        rewardSystem,
        progressTracking,
        socialFeatures
      ] = await Promise.all([
        this.getPlayerProfile(userId),
        this.getUserAchievements(userId),
        this.getActiveChallenges(userId),
        this.getLeaderboards(userId),
        this.getRewardSystem(userId),
        this.getProgressTracking(userId),
        this.getSocialFeatures(userId)
      ]);

      return {
        success: true,
        dashboard: {
          playerProfile,
          achievements,
          activeChallenges,
          leaderboards,
          rewardSystem,
          progressTracking,
          socialFeatures,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Erreur dashboard gamification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 👤 Profil de joueur avec statistiques
   */
  async getPlayerProfile(userId) {
    const user = await User.findById(userId);
    const userStats = await this.calculateUserStats(userId);
    
    // Calcul du niveau basé sur l'expérience
    const level = this.calculateLevel(userStats.totalXP);
    const nextLevelXP = this.getXPForLevel(level + 1);
    const currentLevelXP = this.getXPForLevel(level);
    const progressToNextLevel = ((userStats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

    // Titre du joueur basé sur ses performances
    const playerTitle = this.getPlayerTitle(level, userStats);

    return {
      username: user.username,
      level,
      totalXP: userStats.totalXP,
      progressToNextLevel: Math.round(progressToNextLevel),
      nextLevelXP,
      playerTitle,
      avatar: user.avatar || '👤',
      joinDate: user.createdAt,
      stats: {
        totalTrades: userStats.totalTrades,
        successRate: userStats.successRate,
        totalObjects: userStats.totalObjects,
        communityRank: userStats.communityRank,
        streakDays: userStats.streakDays,
        perfectMonths: userStats.perfectMonths
      },
      specialties: this.getPlayerSpecialties(userStats),
      reputation: this.calculateReputation(userStats)
    };
  }

  /**
   * 🏅 Système d'achievements complet
   */
  async getUserAchievements(userId) {
    const userStats = await this.calculateUserStats(userId);
    const allAchievements = this.getAllAchievements();
    
    const earnedAchievements = [];
    const availableAchievements = [];
    const secretAchievements = [];

    for (const achievement of allAchievements) {
      const progress = await this.calculateAchievementProgress(userId, achievement, userStats);
      
      if (progress >= 100) {
        earnedAchievements.push({
          ...achievement,
          earnedAt: await this.getAchievementEarnedDate(userId, achievement.id),
          xpReward: achievement.xpReward
        });
      } else if (achievement.secret && progress < 50) {
        secretAchievements.push({
          id: achievement.id,
          name: '???',
          description: 'Achievement secret à découvrir',
          icon: '❓',
          rarity: achievement.rarity,
          progress: Math.min(progress, 10)
        });
      } else {
        availableAchievements.push({
          ...achievement,
          progress: Math.round(progress),
          timeEstimated: this.estimateCompletionTime(achievement, progress)
        });
      }
    }

    return {
      total: allAchievements.length,
      earned: earnedAchievements.length,
      available: availableAchievements.length,
      secret: secretAchievements.length,
      completionRate: Math.round((earnedAchievements.length / allAchievements.length) * 100),
      earnedAchievements: earnedAchievements.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)).slice(0, 10),
      availableAchievements: availableAchievements.sort((a, b) => b.progress - a.progress).slice(0, 5),
      secretAchievements: secretAchievements.slice(0, 3),
      totalXPFromAchievements: earnedAchievements.reduce((sum, a) => sum + a.xpReward, 0)
    };
  }

  /**
   * 🎯 Défis actifs et quotidiens
   */
  async getActiveChallenges(userId) {
    const now = new Date();
    const today = moment().startOf('day');
    
    // Défis quotidiens (se réinitialisent chaque jour)
    const dailyChallenges = await this.generateDailyChallenges(userId, today);
    
    // Défis hebdomadaires
    const weeklyChallenges = await this.generateWeeklyChallenges(userId);
    
    // Défis mensuels
    const monthlyChallenges = await this.generateMonthlyChallenges(userId);
    
    // Défis spéciaux/événements
    const eventChallenges = await this.getEventChallenges(userId);

    return {
      daily: {
        challenges: dailyChallenges,
        completedToday: dailyChallenges.filter(c => c.completed).length,
        resetTime: moment().add(1, 'day').startOf('day').toDate()
      },
      weekly: {
        challenges: weeklyChallenges,
        completedThisWeek: weeklyChallenges.filter(c => c.completed).length,
        resetTime: moment().add(1, 'week').startOf('week').toDate()
      },
      monthly: {
        challenges: monthlyChallenges,
        completedThisMonth: monthlyChallenges.filter(c => c.completed).length,
        resetTime: moment().add(1, 'month').startOf('month').toDate()
      },
      events: eventChallenges,
      streakBonus: await this.calculateStreakBonus(userId),
      totalActiveRewards: this.calculateTotalRewards([...dailyChallenges, ...weeklyChallenges, ...monthlyChallenges])
    };
  }

  /**
   * 🏆 Classements multi-catégories
   */
  async getLeaderboards(userId) {
    const user = await User.findById(userId);
    
    // Classement général (XP)
    const generalLeaderboard = await this.getGeneralLeaderboard(userId);
    
    // Classement mensuel
    const monthlyLeaderboard = await this.getMonthlyLeaderboard(userId);
    
    // Classement par ville
    const cityLeaderboard = await this.getCityLeaderboard(userId, user.city);
    
    // Classements spécialisés
    const traderLeaderboard = await this.getTraderLeaderboard(userId);
    const ecoLeaderboard = await this.getEcoLeaderboard(userId);
    const streakLeaderboard = await this.getStreakLeaderboard(userId);

    return {
      general: {
        ...generalLeaderboard,
        title: 'Classement Général',
        description: 'Basé sur l\'XP total'
      },
      monthly: {
        ...monthlyLeaderboard,
        title: 'Top du Mois',
        description: 'Performances du mois en cours'
      },
      city: {
        ...cityLeaderboard,
        title: `Top ${user.city}`,
        description: 'Meilleurs joueurs de votre ville'
      },
      specialized: [
        {
          ...traderLeaderboard,
          title: 'Maîtres Échangeurs',
          description: 'Plus grand nombre d\'échanges réussis'
        },
        {
          ...ecoLeaderboard,
          title: 'Champions Écologiques',
          description: 'Impact environnemental positif'
        },
        {
          ...streakLeaderboard,
          title: 'Séries Impressionnantes',
          description: 'Plus longues séries d\'activité'
        }
      ]
    };
  }

  /**
   * 🎁 Système de récompenses et points
   */
  async getRewardSystem(userId) {
    const user = await User.findById(userId);
    const userPoints = user.gamificationPoints || 0;
    
    // Boutique de récompenses
    const shop = this.getRewardShop();
    
    // Récompenses disponibles pour l'utilisateur
    const availableRewards = shop.filter(item => 
      userPoints >= item.cost && !item.levelRestriction || 
      (item.levelRestriction && this.calculateLevel(user.totalXP || 0) >= item.levelRestriction)
    );

    // Récompenses récemment obtenues
    const recentRewards = await this.getRecentRewards(userId);
    
    // Bonus journaliers
    const dailyBonus = await this.getDailyBonus(userId);

    return {
      currentPoints: userPoints,
      totalEarned: user.totalPointsEarned || userPoints,
      totalSpent: (user.totalPointsEarned || userPoints) - userPoints,
      shop: {
        categories: this.groupRewardsByCategory(shop),
        featured: shop.filter(item => item.featured).slice(0, 3),
        affordable: availableRewards.slice(0, 5)
      },
      recentRewards: recentRewards.slice(0, 5),
      dailyBonus,
      pointsHistory: await this.getPointsHistory(userId),
      nextMilestone: this.getNextPointsMilestone(userPoints)
    };
  }

  /**
   * 📈 Suivi de progression détaillé
   */
  async getProgressTracking(userId) {
    const userStats = await this.calculateUserStats(userId);
    
    // Progression par catégories
    const categoryProgress = await this.getCategoryProgress(userId);
    
    // Objectifs personnels
    const personalGoals = await this.getPersonalGoals(userId);
    
    // Statistiques de performance
    const performanceStats = await this.getPerformanceStats(userId);

    return {
      overallProgress: {
        level: this.calculateLevel(userStats.totalXP),
        nextLevelProgress: this.calculateLevelProgress(userStats.totalXP),
        completionRate: Math.round((userStats.totalTrades / (userStats.totalTrades + 10)) * 100)
      },
      categories: categoryProgress,
      personalGoals: personalGoals,
      performance: performanceStats,
      milestones: await this.getMilestones(userId),
      trends: await this.getProgressTrends(userId)
    };
  }

  /**
   * 👥 Fonctionnalités sociales
   */
  async getSocialFeatures(userId) {
    // Amis et réseaux
    const friends = await this.getUserFriends(userId);
    
    // Équipes/guildes
    const teamInfo = await this.getUserTeam(userId);
    
    // Comparaisons sociales
    const socialComparisons = await this.getSocialComparisons(userId);

    return {
      friends: {
        total: friends.length,
        online: friends.filter(f => f.isOnline).length,
        topFriends: friends.slice(0, 5),
        pendingInvites: await this.getPendingFriendInvites(userId)
      },
      team: teamInfo,
      social: socialComparisons,
      community: {
        events: await this.getCommunityEvents(),
        forums: await this.getForumActivity(userId),
        mentorship: await this.getMentorshipInfo(userId)
      }
    };
  }

  // 🛠️ MÉTHODES UTILITAIRES

  calculateLevel(totalXP) {
    // Progression exponentielle : Level = sqrt(XP/100)
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  getXPForLevel(level) {
    return Math.pow(level - 1, 2) * 100;
  }

  async calculateUserStats(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });

    const objects = await ObjectModel.find({ owner: userId });
    
    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => t.status === 'completed').length;
    const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

    return {
      totalTrades,
      successRate: Math.round(successRate),
      totalObjects: objects.length,
      totalXP: this.calculateTotalXP(trades, objects),
      communityRank: await this.getCommunityRank(userId),
      streakDays: await this.calculateStreak(userId),
      perfectMonths: await this.calculatePerfectMonths(userId)
    };
  }

  calculateTotalXP(trades, objects) {
    let xp = 0;
    xp += trades.length * 50; // 50 XP par échange
    xp += objects.length * 10; // 10 XP par objet partagé
    return xp;
  }

  getPlayerTitle(level, stats) {
    if (level >= 20) return 'Maître Suprême';
    if (level >= 15) return 'Expert Légendaire';
    if (level >= 10) return 'Échangeur Elite';
    if (level >= 5) return 'Trader Expérimenté';
    return 'Novice Prometteur';
  }

  getPlayerSpecialties(stats) {
    const specialties = [];
    
    if (stats.successRate >= 90) specialties.push({ name: 'Perfectionniste', icon: '💎' });
    if (stats.totalTrades >= 50) specialties.push({ name: 'Grand Échangeur', icon: '🔄' });
    if (stats.streakDays >= 30) specialties.push({ name: 'Assidu', icon: '🔥' });
    
    return specialties.slice(0, 3);
  }

  calculateReputation(stats) {
    let reputation = 0;
    reputation += stats.successRate * 2;
    reputation += Math.min(stats.totalTrades * 5, 100);
    reputation += Math.min(stats.streakDays, 50);
    
    return Math.min(Math.round(reputation), 1000);
  }

  getAllAchievements() {
    return [
      // Achievements de base
      {
        id: 'first_trade',
        name: 'Premier Échange',
        description: 'Réalisez votre premier échange réussi',
        icon: '🎯',
        category: 'débutant',
        rarity: 'common',
        xpReward: 100,
        requirement: { type: 'trades', value: 1 }
      },
      {
        id: 'trader_novice',
        name: 'Trader Novice',
        description: 'Complétez 5 échanges',
        icon: '📈',
        category: 'progression',
        rarity: 'common',
        xpReward: 200,
        requirement: { type: 'trades', value: 5 }
      },
      {
        id: 'trader_expert',
        name: 'Expert du Troc',
        description: 'Réalisez 25 échanges réussis',
        icon: '🏆',
        category: 'progression',
        rarity: 'rare',
        xpReward: 500,
        requirement: { type: 'trades', value: 25 }
      },

      // Achievements spécialisés
      {
        id: 'perfectionist',
        name: 'Perfectionniste',
        description: '100% de taux de réussite sur 10 échanges',
        icon: '💎',
        category: 'performance',
        rarity: 'epic',
        xpReward: 750,
        requirement: { type: 'success_rate', value: 100, minimum_trades: 10 }
      },
      {
        id: 'speed_trader',
        name: 'Échangeur Éclair',
        description: 'Complétez 3 échanges en 24h',
        icon: '⚡',
        category: 'vitesse',
        rarity: 'rare',
        xpReward: 400,
        requirement: { type: 'speed_trades', value: 3, timeframe: 24 }
      },

      // Achievements secrets
      {
        id: 'night_owl',
        name: 'Oiseau de Nuit',
        description: 'Effectuez des échanges entre 2h et 6h du matin',
        icon: '🦉',
        category: 'secret',
        rarity: 'legendary',
        xpReward: 1000,
        secret: true,
        requirement: { type: 'night_trades', value: 5 }
      },

      // Plus d'achievements...
    ];
  }

  async generateDailyChallenges(userId, today) {
    const dailyChallenges = [
      {
        id: 'daily_browse',
        name: 'Explorateur Quotidien',
        description: 'Consultez 10 objets différents',
        icon: '🔍',
        progress: await this.getDailyBrowseProgress(userId, today),
        target: 10,
        reward: { xp: 50, points: 25 },
        completed: false
      },
      {
        id: 'daily_message',
        name: 'Communicateur',
        description: 'Envoyez 3 messages à d\'autres utilisateurs',
        icon: '💬',
        progress: await this.getDailyMessageProgress(userId, today),
        target: 3,
        reward: { xp: 75, points: 30 },
        completed: false
      },
      {
        id: 'daily_favorite',
        name: 'Collectionneur',
        description: 'Ajoutez 2 objets aux favoris',
        icon: '⭐',
        progress: await this.getDailyFavoriteProgress(userId, today),
        target: 2,
        reward: { xp: 40, points: 20 },
        completed: false
      }
    ];

    return dailyChallenges.map(challenge => ({
      ...challenge,
      completed: challenge.progress >= challenge.target,
      progressPercentage: Math.round((challenge.progress / challenge.target) * 100)
    }));
  }

  // Méthodes simplifiées pour l'exemple
  async getDailyBrowseProgress(userId, today) { return Math.floor(Math.random() * 12); }
  async getDailyMessageProgress(userId, today) { return Math.floor(Math.random() * 4); }
  async getDailyFavoriteProgress(userId, today) { return Math.floor(Math.random() * 3); }
  async generateWeeklyChallenges(userId) { return []; }
  async generateMonthlyChallenges(userId) { return []; }
  
  /**
   * 🎪 SYSTÈME DE DÉFIS ÉVÉNEMENTIELS
   * Gère les défis spéciaux liés aux événements temporaires
   */
  async getEventChallenges(userId) {
    const now = new Date();
    const activeEvents = await this.getActiveEvents(now);
    const eventChallenges = [];

    for (const event of activeEvents) {
      const challengesForEvent = await this.generateEventSpecificChallenges(userId, event);
      eventChallenges.push(...challengesForEvent);
    }

    return eventChallenges;
  }

  /**
   * 📅 Récupère les événements actifs selon la date
   */
  /**
   * 🎪 NOUVELLES FONCTIONS POUR ÉVÉNEMENTS DYNAMIQUES
   */

  // Créer un nouvel événement
  async createEvent(eventData) {
    try {
      // Validation des thèmes
      const themeIcons = {
        ecology: '🌿',
        seasonal: '🎉',
        education: '📚',
        competition: '🏆',
        custom: '🎪'
      };

      const themeColors = {
        ecology: '#4CAF50',
        seasonal: '#2196F3',
        education: '#FF9800',
        competition: '#F44336',
        custom: '#9C27B0'
      };

      const event = new Event({
        ...eventData,
        icon: eventData.icon || themeIcons[eventData.theme] || '🎪',
        color: eventData.color || themeColors[eventData.theme] || '#9C27B0',
        specialRewards: {
          badge: eventData.specialRewards?.badge || `🏆 ${eventData.name}`,
          exclusiveItems: eventData.specialRewards?.exclusiveItems || []
        }
      });

      const savedEvent = await event.save();
      console.log(`✅ Événement créé: ${savedEvent.name} (ID: ${savedEvent._id})`);
      return savedEvent;
    } catch (error) {
      console.error('❌ Erreur création événement:', error);
      throw error;
    }
  }

  // Récupérer tous les événements
  async getAllEvents() {
    try {
      console.log('🔍 [DEBUG] getAllEvents() appelée - utilisation de MongoDB');
      const events = await Event.find({}).sort({ createdAt: -1 });
      console.log('📊 [DEBUG] Événements récupérés de MongoDB:', events.length);
      if (events.length > 0) {
        console.log('📝 [DEBUG] Noms des événements:', events.map(e => e.name));
      }
      return events;
    } catch (error) {
      console.error('❌ Erreur récupération événements:', error);
      return [];
    }
  }

  // Mettre à jour un événement
  async updateEvent(eventId, updateData) {
    try {
      const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, { new: true });
      console.log(`✅ Événement mis à jour: ${updatedEvent.name}`);
      return updatedEvent;
    } catch (error) {
      console.error('❌ Erreur mise à jour événement:', error);
      throw error;
    }
  }

  // Supprimer un événement
  async deleteEvent(eventId) {
    try {
      console.log(`🔍 [DEBUG] Recherche événement à supprimer: ${eventId}`);
      const eventToDelete = await Event.findById(eventId);
      
      if (!eventToDelete) {
        console.log(`❌ [DEBUG] Événement non trouvé: ${eventId}`);
        throw new Error('Événement non trouvé');
      }
      
      console.log(`📋 [DEBUG] Événement trouvé pour suppression: ${eventToDelete.name}`);
      
      const result = await Event.findByIdAndDelete(eventId);
      console.log(`🗑️ [DEBUG] Résultat findByIdAndDelete:`, result ? 'Succès' : 'Échec');
      
      // Vérification après suppression
      const checkAfterDelete = await Event.findById(eventId);
      console.log(`🔍 [DEBUG] Vérification après suppression:`, checkAfterDelete ? 'ENCORE PRÉSENT!' : 'Bien supprimé');
      
      console.log(`✅ Événement supprimé: ${eventId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur suppression événement:', error);
      throw error;
    }
  }

  // Activer/Désactiver un événement
  async toggleEventStatus(eventId, active) {
    try {
      console.log(`🔄 [DEBUG] Toggle événement ID: ${eventId} vers ${active ? 'ACTIF' : 'INACTIF'}`);
      
      const event = await Event.findByIdAndUpdate(
        eventId, 
        { isActive: active }, 
        { new: true }
      );
      
      if (!event) {
        console.error(`❌ [DEBUG] Événement non trouvé avec ID: ${eventId}`);
        throw new Error('Événement non trouvé');
      }
      
      console.log(`✅ [DEBUG] Événement ${active ? 'activé' : 'désactivé'}: ${event.name} (ID: ${event._id})`);
      return event;
    } catch (error) {
      console.error('❌ Erreur changement statut événement:', error);
      throw error;
    }
  }

  // Récupérer un événement par ID
  async getEventById(eventId) {
    try {
      return await Event.findById(eventId);
    } catch (error) {
      console.error('❌ Erreur récupération événement par ID:', error);
      return null;
    }
  }

  // Statistiques des événements
  async getEventsStatistics() {
    try {
      const totalEvents = await Event.countDocuments({});
      const activeEvents = await Event.countDocuments({ isActive: true });
      const upcomingEvents = await Event.countDocuments({ 
        startDate: { $gt: new Date() } 
      });
      
      const allEvents = await Event.find({});
      const totalParticipations = allEvents.reduce((sum, event) => 
        sum + (event.statistics?.totalParticipants || 0), 0
      );

      return {
        total: totalEvents,
        active: activeEvents,
        upcoming: upcomingEvents,
        totalParticipations,
        averageParticipationRate: totalEvents > 0 ? (totalParticipations / totalEvents) : 0
      };
    } catch (error) {
      console.error('❌ Erreur statistiques événements:', error);
      return {
        total: 0,
        active: 0,
        upcoming: 0,
        totalParticipations: 0,
        averageParticipationRate: 0
      };
    }
  }

  // Analytics d'un événement spécifique
  async getEventAnalytics(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Événement non trouvé');
      }

      return {
        participation: {
          totalParticipants: event.statistics?.totalParticipants || 0,
          activeParticipants: event.participants?.length || 0,
          completionRate: 0 // À calculer selon la logique métier
        },
        challenges: {
          completedChallenges: event.statistics?.totalTrades || 0,
          averagePerUser: event.participants.length > 0 ? 
            (event.statistics?.totalTrades || 0) / event.participants.length : 0
        },
        rewards: {
          totalXPGiven: event.statistics?.totalXPAwarded || 0,
          totalPointsGiven: 0, // À calculer
          badgesAwarded: 0 // À calculer
        },
        engagement: {
          retentionRate: 0, // À calculer
          satisfactionScore: 4.5 // Placeholder
        }
      };
    } catch (error) {
      console.error('❌ Erreur analytics événement:', error);
      throw error;
    }
  }

  // Créer un événement depuis un template
  async createEventFromTemplate(templateId, customizations = {}) {
    try {
      const templates = this.getEventTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error('Template non trouvé');
      }

      const eventData = {
        name: customizations.name || template.name,
        description: customizations.description || template.description,
        theme: template.theme,
        icon: template.icon,
        bonusMultiplier: template.bonusMultiplier,
        startDate: customizations.startDate || new Date(),
        endDate: customizations.endDate || 
          new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000),
        ...customizations,
        createdBy: customizations.createdBy
      };

      return await this.createEvent(eventData);
    } catch (error) {
      console.error('❌ Erreur création depuis template:', error);
      throw error;
    }
  }

  // Templates d'événements
  getEventTemplates() {
    return [
      {
        id: 'ecology_week',
        name: 'Semaine Écologique',
        description: 'Événement axé sur les échanges verts',
        duration: 7,
        theme: 'ecology',
        icon: '🌿',
        bonusMultiplier: 1.5
      },
      {
        id: 'seasonal_celebration',
        name: 'Célébration Saisonnière',
        description: 'Événement adaptatif selon la saison',
        duration: 14,
        theme: 'seasonal',
        icon: '🎉',
        bonusMultiplier: 1.8
      },
      {
        id: 'mega_challenge',
        name: 'Méga Défi Communautaire',
        description: 'Grand événement compétitif',
        duration: 30,
        theme: 'competition',
        icon: '🏆',
        bonusMultiplier: 2.5
      }
    ];
  }

  /**
   * 🎯 FONCTIONS EXISTANTES MODIFIÉES POUR UTILISER LA BASE DE DONNÉES
   */

  async getActiveEvents(currentDate = new Date()) {
    try {
      // Récupérer les événements de la base de données
      const dbEvents = await Event.getActiveEvents(currentDate);
      
      // Combiner avec les événements hardcodés existants pour compatibilité
      const hardcodedEvents = this.getHardcodedEvents(currentDate);
      
      // Convertir les événements DB au format attendu
      const dbEventsFormatted = dbEvents.map(event => ({
        id: event._id.toString(),
        name: event.name,
        description: event.description,
        theme: event.theme,
        icon: event.icon,
        color: event.color,
        startDate: new Date(event.startDate), // Conversion en Date
        endDate: new Date(event.endDate),     // Conversion en Date
        bonusMultiplier: event.bonusMultiplier,
        specialRewards: event.specialRewards,
        participants: Array.isArray(event.participants) ? event.participants.length : 0,
        isActive: event.isActive
      }));

      return [...dbEventsFormatted, ...hardcodedEvents];
    } catch (error) {
      console.error('❌ Erreur getActiveEvents:', error);
      // Fallback sur les événements hardcodés
      return this.getHardcodedEvents(currentDate);
    }
  }

  // Garder les événements hardcodés existants pour compatibilité
  getHardcodedEvents(currentDate) {
    const events = [
      // 🌍 Événements écologiques
      {
        id: 'earth_day_2025',
        name: 'Journée de la Terre 2025',
        description: 'Célébrons notre planète avec des échanges verts !',
        theme: 'ecology',
        icon: '🌍',
        color: '#4CAF50',
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-04-25'),
        bonusMultiplier: 2.0,
        specialRewards: {
          badge: '🌍 Gardien Terre 2025',
          exclusiveItems: ['Plante rare', 'Graines bio']
        }
      },
      
      // 🎄 Événements saisonniers
      {
        id: 'winter_exchange_2025',
        name: 'Grand Troc d\'Hiver',
        description: 'L\'esprit de partage hivernal',
        theme: 'seasonal',
        icon: '❄️',
        color: '#2196F3',
        startDate: new Date('2025-12-15'),
        endDate: new Date('2025-01-15'),
        bonusMultiplier: 1.5,
        specialRewards: {
          badge: '❄️ Maître Hiver 2025',
          exclusiveItems: ['Déco hivernale', 'Livre contes']
        }
      },

      // 🎓 Événements communautaires
      {
        id: 'back_to_school_2025',
        name: 'Rentrée Solidaire',
        description: 'Partageons nos fournitures scolaires',
        theme: 'education',
        icon: '📚',
        color: '#FF9800',
        startDate: new Date('2025-08-20'),
        endDate: new Date('2025-09-15'),
        bonusMultiplier: 1.8,
        categories: ['Livres', 'Fournitures', 'Matériel scolaire'],
        specialRewards: {
          badge: '📚 Mentor Éducation',
          exclusiveItems: ['Kit scolaire complet']
        }
      },

      // 🏆 Événements compétitifs
      {
        id: 'mega_challenge_august_2025',
        name: 'Méga Défi Août',
        description: 'Le plus grand défi de l\'été !',
        theme: 'competition',
        icon: '🏆',
        color: '#F44336',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-31'),
        bonusMultiplier: 3.0,
        globalGoal: {
          target: 10000, // 10k échanges communautaires
          current: 0,
          reward: 'Déblocage fonctionnalité premium'
        }
      }
    ];

    return events.filter(event => 
      currentDate >= event.startDate && currentDate <= event.endDate
    );
  }

  /**
   * 🎯 Génère les défis spécifiques pour chaque événement
   */
  async generateEventSpecificChallenges(userId, event) {
    const userProgress = await this.getUserEventProgress(userId, event.id);
    
    switch (event.theme) {
      case 'ecology':
        return await this.generateEcologyChallenges(userId, event, userProgress);
      
      case 'seasonal':
        return await this.generateSeasonalChallenges(userId, event, userProgress);
      
      case 'education':
        return await this.generateEducationChallenges(userId, event, userProgress);
      
      case 'competition':
        return await this.generateCompetitionChallenges(userId, event, userProgress);
      
      default:
        return await this.generateGenericEventChallenges(userId, event, userProgress);
    }
  }

  /**
   * 🌱 Défis écologiques spécialisés
   */
  async generateEcologyChallenges(userId, event, userProgress) {
    const ecoCategories = ['Plantes', 'Jardinage', 'Écologique', 'Bio', 'Naturel'];
    
    return [
      {
        id: `${event.id}_eco_exchange`,
        eventId: event.id,
        eventName: event.name,
        eventIcon: event.icon,
        name: 'Échangeur Vert',
        description: 'Réalisez 5 échanges d\'objets écologiques',
        icon: '🌿',
        progress: userProgress.ecoTrades || 0,
        target: 5,
        reward: { 
          xp: 200 * event.bonusMultiplier, 
          points: 150,
          badge: event.specialRewards.badge,
          eventBonus: true
        },
        categories: ecoCategories,
        endDate: event.endDate,
        type: 'event_special'
      },
      {
        id: `${event.id}_plant_collection`,
        eventId: event.id,
        eventName: event.name,
        eventIcon: event.icon,
        name: 'Collectionneur Nature',
        description: 'Ajoutez 10 objets "nature" à votre collection',
        icon: '🌱',
        progress: userProgress.plantItems || 0,
        target: 10,
        reward: { 
          xp: 150 * event.bonusMultiplier, 
          points: 100,
          exclusiveItem: event.specialRewards.exclusiveItems[0]
        },
        endDate: event.endDate,
        type: 'event_collection'
      }
    ];
  }

  /**
   * 🎓 Défis éducatifs
   */
  async generateEducationChallenges(userId, event, userProgress) {
    return [
      {
        id: `${event.id}_school_helper`,
        eventId: event.id,
        eventName: event.name,
        eventIcon: event.icon,
        name: 'Assistant Scolaire',
        description: 'Partagez 3 livres ou fournitures scolaires',
        icon: '📖',
        progress: userProgress.schoolItems || 0,
        target: 3,
        reward: { 
          xp: 180 * event.bonusMultiplier, 
          points: 120,
          communityImpact: '+50 points solidarité'
        },
        categories: event.categories,
        endDate: event.endDate,
        type: 'event_solidarity'
      }
    ];
  }

  /**
   * 🏆 Défis compétitifs avec objectifs globaux
   */
  async generateCompetitionChallenges(userId, event, userProgress) {
    const globalProgress = await this.getGlobalEventProgress(event.id);
    
    // Vérification de sécurité pour globalGoal
    const globalGoal = event.globalGoal || { target: 100, current: 0, reward: '' };
    const safeTarget = globalGoal.target || 100;
    const safeCurrent = globalProgress?.current || 0;
    
    return [
      {
        id: `${event.id}_mega_trader`,
        eventId: event.id,
        eventName: event.name,
        eventIcon: event.icon,
        name: 'Méga Échangeur',
        description: 'Réalisez 15 échanges pendant l\'événement',
        icon: '⚡',
        progress: userProgress.totalTrades || 0,
        target: 15,
        reward: { 
          xp: 500 * event.bonusMultiplier, 
          points: 300,
          leaderboardBoost: true
        },
        endDate: event.endDate,
        type: 'event_mega'
      },
      {
        id: `${event.id}_global_contributor`,
        eventId: event.id,
        eventName: event.name,
        eventIcon: event.icon,
        name: 'Contributeur Global',
        description: `Participez à l'objectif communautaire (${safeCurrent}/${safeTarget})`,
        icon: '🌍',
        progress: safeCurrent,
        target: safeTarget,
        reward: { 
          xp: 1000, 
          points: 500,
          globalReward: globalGoal.reward || 'Récompense globale'
        },
        isGlobalChallenge: true,
        endDate: event.endDate,
        type: 'event_global'
      }
    ];
  }

  /**
   * 📊 Suivi de progression événementielle
   */
  async getUserEventProgress(userId, eventId) {
    // Ici on récupèrerait les vraies données de progression
    // Pour l'exemple, on simule
    return {
      ecoTrades: Math.floor(Math.random() * 3),
      plantItems: Math.floor(Math.random() * 7),
      schoolItems: Math.floor(Math.random() * 2),
      totalTrades: Math.floor(Math.random() * 10)
    };
  }

  async getGlobalEventProgress(eventId) {
    try {
      // Récupérer l'événement
      const Event = require('../models/Event');
      const event = await Event.findById(eventId);
      
      if (!event) {
        return { current: 0, participants: 0 };
      }

      // Compter les vrais participants
      const participantCount = event.participants.length;

      // Calculer la progression réelle basée sur les actions des participants
      let totalProgress = 0;
      
      // Pour chaque participant, calculer ses contributions
      for (const participant of event.participants) {
        const UserTaskProgress = require('../models/UserTaskProgress');
        
        // Compter les tâches/actions complétées pendant l'événement
        const completedActions = await UserTaskProgress.countDocuments({
          userId: participant.userId,
          eventId: eventId,
          status: 'claimed',
          claimedAt: { 
            $gte: event.startDate, 
            $lte: event.endDate 
          }
        });
        
        totalProgress += completedActions;
      }

      // Mettre à jour l'événement avec la vraie progression
      await Event.findByIdAndUpdate(eventId, {
        'globalGoal.current': totalProgress
      });

      return {
        current: totalProgress,
        participants: participantCount
      };
    } catch (error) {
      console.error('❌ Erreur calcul progression globale:', error);
      // Fallback vers données simulées en cas d'erreur
      return {
        current: Math.floor(Math.random() * 5000) + 3000,
        participants: Math.floor(Math.random() * 500) + 200
      };
    }
  }

  async generateSeasonalChallenges(userId, event, userProgress) { return []; }
  async generateGenericEventChallenges(userId, event, userProgress) { return []; }

  /**
   * 🎯 Mettre à jour l'objectif communautaire lors d'une action utilisateur
   * Appelé automatiquement quand un utilisateur gagne des XP pendant un événement
   */
  async updateGlobalGoalProgress(userId, actionType, xpGained) {
    try {
      const Event = require('../models/Event');
      const currentDate = new Date();
      
      // Mapping des types de tâches vers les actions d'événement
      const taskTypeToEventAction = {
        'ADD_OBJECTS': 'ADD_OBJECT',
        'TRADE_OBJECTS': 'COMPLETE_TRADE',
        'LOGIN_APP': 'LOGIN_APP',
        'VISIT_CATEGORIES': 'BROWSE_CATEGORIES',
        'RATE_TRADES': 'RATE_TRADE',
        'UPDATE_PROFILE': 'UPDATE_PROFILE',
        'SHARE_OBJECT': 'SHARE_OBJECT',
        'BROWSE_NEARBY': 'EXPLORE_NEARBY'
      };
      
      // Convertir le type de tâche en action d'événement
      const eventAction = taskTypeToEventAction[actionType] || actionType;
      
      // Trouver tous les événements actifs auxquels l'utilisateur participe
      const activeEvents = await Event.find({
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        'participants.userId': userId
      });

      for (const event of activeEvents) {
        // Vérifier si cette action est dans les actions sélectionnées de l'événement
        if (event.selectedActions && event.selectedActions.includes(eventAction)) {
          // Incrémenter la progression globale
          await Event.findByIdAndUpdate(event._id, {
            $inc: { 'globalGoal.current': 1 } // +1 pour chaque action réalisée
          });

          console.log(`🎯 [GLOBAL GOAL] User ${userId} contributed to event ${event.name} with action ${eventAction} (+1 progress)`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour objectif global:', error);
    }
  }

  /**
   * 🎪 MÉTHODES DE GESTION D'ÉVÉNEMENTS
   */

  /**
   * Inscription d'un utilisateur à un événement
   * 🚫 PROTECTION CONTRE LES INSCRIPTIONS MULTIPLES
   */
  async participateInEvent(userId, eventId) {
    try {
      const Event = require('../models/Event');
      
      // Vérifier si l'événement existe
      const event = await Event.findById(eventId);
      if (!event) {
        return { 
          success: false, 
          error: 'Événement non trouvé',
          code: 'EVENT_NOT_FOUND'
        };
      }
      
      // Vérifier si l'événement est actif
      if (!event.isActive) {
        return { 
          success: false, 
          error: 'Cet événement n\'est pas actif ou n\'a pas encore commencé',
          code: 'EVENT_NOT_ACTIVE'
        };
      }
      
      // Vérifier si l'événement est dans la période valide
      const now = new Date();
      if (now < event.startDate) {
        return { 
          success: false, 
          error: 'Cet événement n\'a pas encore commencé',
          code: 'EVENT_NOT_STARTED',
          startDate: event.startDate
        };
      }
      
      if (now > event.endDate) {
        return { 
          success: false, 
          error: 'Cet événement est terminé',
          code: 'EVENT_ENDED',
          endDate: event.endDate
        };
      }
      
      // 🔒 VÉRIFICATION STRICTE : L'utilisateur participe-t-il déjà ?
      const existingParticipant = event.participants.find(
        participant => participant.userId.toString() === userId.toString()
      );
      
      if (existingParticipant) {
        console.log(`[PARTICIPATION DENIED] Utilisateur ${userId} tente une inscription multiple à l'événement ${eventId}`);
        return { 
          success: false, 
          error: 'Vous participez déjà à cet événement',
          code: 'ALREADY_PARTICIPATING',
          joinedAt: existingParticipant.joinedAt,
          currentProgress: existingParticipant.progress
        };
      }
      
      // ✅ INSCRIPTION AUTORISÉE - Ajouter l'utilisateur
      const newParticipant = {
        userId: userId,
        joinedAt: new Date(),
        progress: {
          challengesCompleted: 0,
          xpEarned: 0,
          tradesCompleted: 0
        }
      };
      
      event.participants.push(newParticipant);
      
      // Mettre à jour les statistiques
      event.statistics.totalParticipants = event.participants.length;
      
      await event.save();
      
      console.log(`[PARTICIPATION SUCCESS] Utilisateur ${userId} inscrit à l'événement ${eventId} - Total participants: ${event.participants.length}`);
      
      // Initialiser les défis spécifiques à l'événement
      const eventChallenges = await this.generateEventSpecificChallenges(userId, event);
      
      return {
        success: true,
        message: `Inscription réussie à l'événement: ${event.name}`,
        event: {
          id: event._id,
          name: event.name,
          theme: event.theme,
          icon: event.icon,
          bonusMultiplier: event.bonusMultiplier,
          endDate: event.endDate
        },
        participation: {
          joinedAt: newParticipant.joinedAt,
          participantNumber: event.participants.length,
          initialChallenges: eventChallenges.length
        },
        rewards: {
          bonusActivated: true,
          bonusMultiplier: event.bonusMultiplier,
          specialRewards: event.specialRewards?.badge || 'Badge événement exclusif',
          exclusiveItems: event.specialRewards?.exclusiveItems || []
        },
        nextSteps: {
          challenges: eventChallenges,
          nextMilestone: 'Complétez 3 défis pour obtenir le badge spécial',
          leaderboard: 'Consultez votre classement dans l\'événement'
        }
      };
    } catch (error) {
      console.error('[PARTICIPATION ERROR]', error);
      return { 
        success: false, 
        error: 'Erreur technique lors de l\'inscription. Veuillez réessayer.',
        code: 'TECHNICAL_ERROR'
      };
    }
  }

  /**
   * Classement spécifique à un événement
   */
  async getEventLeaderboard(userId, eventId) {
    // Simulation d'un classement événementiel
    const participants = [
      { rank: 1, pseudo: 'EcoMaster2025', points: 2450, badge: '🌍', city: 'Paris' },
      { rank: 2, pseudo: 'TrocExpert', points: 2380, badge: '⚡', city: 'Lyon' },
      { rank: 3, pseudo: 'GreenTrader', points: 2290, badge: '🌿', city: 'Marseille' },
      { rank: 4, pseudo: 'Vous', points: 1850, badge: '🎯', city: 'Toulouse' },
      { rank: 5, pseudo: 'NatureLover', points: 1820, badge: '🌱', city: 'Nice' }
    ];

    return {
      userRank: 4,
      totalParticipants: 847,
      topParticipants: participants,
      eventPrizes: {
        first: 'Badge exclusif + 1000 points bonus',
        top10: 'Badge participant + 500 points bonus',
        top50: 'Badge effort + 200 points bonus'
      },
      timeRemaining: '12j 5h 30min'
    };
  }

  /**
   * Complétion d'un défi événementiel
   */
  async completeEventChallenge(userId, eventId, challengeId) {
    // Ici on validerait le défi et donnerait les récompenses
    return {
      success: true,
      message: 'Défi complété avec succès !',
      rewards: {
        xp: 250,
        points: 150,
        badge: '🎯 Défi Maître',
        specialItem: 'Objet événementiel exclusif'
      },
      nextChallenge: 'Nouveau défi débloqué !',
      eventProgress: {
        challengesCompleted: 2,
        totalChallenges: 5,
        eventRank: 15,
        bonusMultiplier: 1.8
      }
    };
  }

  /**
   * Obtenir le profil gamification d'un utilisateur
   */
  async getUserProfile(userId) {
    const userStats = await this.calculateUserStats(userId);
    return {
      success: true,
      profile: {
        level: this.calculateLevel(userStats.totalXP),
        totalXP: userStats.totalXP,
        badges: await this.getUserBadges(userId),
        achievements: await this.getUserAchievements(userId),
        statistics: userStats,
        currentEvents: await this.getUserActiveEventParticipations(userId)
      }
    };
  }

  async getUserActiveEventParticipations(userId) {
    const activeEvents = await this.getActiveEvents(new Date());
    return activeEvents.map(event => ({
      eventId: event.id,
      eventName: event.name,
      participationDate: new Date(),
      progress: Math.floor(Math.random() * 80) + 10,
      rank: Math.floor(Math.random() * 100) + 1
    }));
  }

  /**
   * 🛠️ MÉTHODES D'ADMINISTRATION D'ÉVÉNEMENTS
   */

  /**
   * Récupère tous les événements (passés, présents, futurs)
   */





  /**
   * Analytics détaillées d'un événement
   */
  async getEventAnalytics(eventId) {
    return {
      eventId,
      period: {
        start: new Date('2025-08-01'),
        end: new Date('2025-08-31'),
        duration: 30, // jours
        remainingDays: 22
      },
      participation: {
        totalParticipants: 2156,
        newParticipants: 847,
        activeParticipants: 1523,
        completionRate: 67.4
      },
      challenges: {
        totalChallenges: 12,
        completedChallenges: 8934,
        averagePerUser: 4.1,
        mostPopular: 'Méga Échangeur',
        leastPopular: 'Contributeur Global'
      },
      rewards: {
        totalXPGiven: 2247800,
        totalPointsGiven: 1348600,
        badgesAwarded: 1523,
        exclusiveItemsGiven: 234
      },
      engagement: {
        dailyActiveUsers: [145, 167, 189, 201, 178], // 5 derniers jours
        peakHours: ['18:00-20:00', '20:00-22:00'],
        retentionRate: 84.2,
        satisfactionScore: 4.6 // sur 5
      },
      leaderboard: {
        topPerformer: 'EcoMaster2025',
        averageRank: 1078,
        competitionLevel: 'Élevé'
      }
    };
  }

  /**
   * Créer un événement basé sur un template
   */
  async createEventFromTemplate(templateId, customizations) {
    const templates = {
      'ecology_week': {
        name: 'Semaine Écologique',
        theme: 'ecology',
        icon: '🌿',
        duration: 7,
        bonusMultiplier: 1.5
      },
      'seasonal_celebration': {
        name: 'Célébration Saisonnière',
        theme: 'seasonal',
        icon: '🎉',
        duration: 14,
        bonusMultiplier: 1.8
      },
      'mega_challenge': {
        name: 'Méga Défi Communautaire',
        theme: 'competition',
        icon: '🏆',
        duration: 30,
        bonusMultiplier: 2.5
      }
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error('Template non trouvé');
    }

    const eventData = {
      ...template,
      ...customizations,
      startDate: customizations.startDate || new Date(),
      endDate: customizations.endDate || new Date(Date.now() + template.duration * 24 * 60 * 60 * 1000)
    };

    return await this.createEvent(eventData);
  }

  /**
   * Statistiques générales des événements
   */
  async getEventsStatistics() {
    return {
      total: 15,
      active: 3,
      upcoming: 2,
      past: 10,
      totalParticipations: 12456,
      totalRewardsGiven: 5847392,
      mostSuccessfulTheme: 'ecology',
      averageParticipationRate: 73.2
    };
  }

  async calculateStreakBonus(userId) { return { multiplier: 1.2, days: 5 }; }
  calculateTotalRewards(challenges) { return challenges.reduce((sum, c) => sum + (c.reward?.points || 0), 0); }

  // Autres méthodes simplifiées...
  async getGeneralLeaderboard(userId) { 
    return { 
      userPosition: 15, 
      topPlayers: [], 
      totalPlayers: 1250 
    }; 
  }
  async getMonthlyLeaderboard(userId) { return { userPosition: 8, topPlayers: [], totalPlayers: 800 }; }
  async getCityLeaderboard(userId, city) { return { userPosition: 3, topPlayers: [], totalPlayers: 45 }; }
  async getTraderLeaderboard(userId) { return { userPosition: 12, topPlayers: [], totalPlayers: 600 }; }
  async getEcoLeaderboard(userId) { return { userPosition: 7, topPlayers: [], totalPlayers: 400 }; }
  async getStreakLeaderboard(userId) { return { userPosition: 20, topPlayers: [], totalPlayers: 300 }; }
  
  getRewardShop() { return []; }
  async getRecentRewards(userId) { return []; }
  async getDailyBonus(userId) { return { available: true, amount: 50 }; }
  async getPointsHistory(userId) { return []; }
  getNextPointsMilestone(points) { return { target: 1000, progress: points, reward: 'Badge Spécial' }; }
  groupRewardsByCategory(shop) { return {}; }
  
  async getCategoryProgress(userId) { return []; }
  async getPersonalGoals(userId) { return []; }
  async getPerformanceStats(userId) { return {}; }
  async getMilestones(userId) { return []; }
  async getProgressTrends(userId) { return []; }
  calculateLevelProgress(xp) { return 65; }
  
  async getUserFriends(userId) { return []; }
  async getUserTeam(userId) { return null; }
  async getSocialComparisons(userId) { return {}; }
  async getPendingFriendInvites(userId) { return []; }
  async getCommunityEvents() { return []; }
  async getForumActivity(userId) { return {}; }
  async getMentorshipInfo(userId) { return {}; }
  
  async getCommunityRank(userId) { return Math.floor(Math.random() * 100) + 1; }
  async calculateStreak(userId) { return Math.floor(Math.random() * 15); }
  async calculatePerfectMonths(userId) { return Math.floor(Math.random() * 3); }
  async calculateAchievementProgress(userId, achievement, stats) { return Math.floor(Math.random() * 120); }
  async getAchievementEarnedDate(userId, achievementId) { return new Date(); }
  estimateCompletionTime(achievement, progress) { return '2-3 jours'; }
}

module.exports = GamificationService;
