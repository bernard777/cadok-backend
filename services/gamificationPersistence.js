/**
 * 🎮 SERVICE DE SAUVEGARDE GAMIFICATION
 * Gestion de la persistance des données de progression
 */

const User = require('../models/User');

class GamificationPersistenceService {
  
  /**
   * 💾 Sauvegarde la progression gamification d'un utilisateur
   */
  static async saveUserProgress(userId, gamificationData) {
    try {
      console.log('💾 [GAMIFICATION] Sauvegarde progression pour utilisateur:', userId);
      
      const updateData = {
        'gamification.level': gamificationData.level,
        'gamification.totalXP': gamificationData.currentXP || gamificationData.totalXP,
        'gamification.currentLevelXP': gamificationData.currentXP % 100,
        'gamification.title': gamificationData.title,
        'gamification.cachedData.lastUpdated': new Date(),
        'gamification.cachedData.needsRecalculation': false
      };

      // Vérifier si level-up pour sauvegarder la date
      const currentUser = await User.findById(userId).select('gamification.level');
      if (currentUser && currentUser.gamification.level < gamificationData.level) {
        updateData['gamification.lastLevelUp'] = new Date();
        console.log('🚀 [GAMIFICATION] Level-up détecté!', currentUser.gamification.level, '→', gamificationData.level);
      }

      await User.findByIdAndUpdate(userId, updateData, { new: true });
      
      console.log('✅ [GAMIFICATION] Progression sauvegardée:', {
        level: gamificationData.level,
        xp: gamificationData.currentXP || gamificationData.totalXP,
        title: gamificationData.title
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur sauvegarde:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🏆 Sauvegarde un achievement débloqué
   */
  static async saveAchievement(userId, achievement) {
    try {
      console.log('🏆 [GAMIFICATION] Sauvegarde achievement:', achievement.id);
      
      // Vérifier si l'achievement n'existe pas déjà
      const user = await User.findById(userId).select('gamification.achievements');
      const existingAchievement = user.gamification.achievements.find(a => a.id === achievement.id);
      
      if (existingAchievement) {
        console.log('⚠️ [GAMIFICATION] Achievement déjà débloqué:', achievement.id);
        return { success: true, alreadyUnlocked: true };
      }

      // Ajouter l'achievement
      await User.findByIdAndUpdate(userId, {
        $push: {
          'gamification.achievements': {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            xpReward: achievement.xpReward || 0,
            rarity: achievement.rarity || 'common',
            unlockedAt: new Date()
          }
        }
      });

      console.log('✅ [GAMIFICATION] Achievement sauvegardé:', achievement.title);
      return { success: true, newAchievement: true };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur sauvegarde achievement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔥 Mise à jour des streaks
   */
  static async updateStreak(userId, isActiveToday = true) {
    try {
      const user = await User.findById(userId).select('gamification.streaks');
      if (!user) return { success: false, error: 'Utilisateur introuvable' };

      const now = new Date();
      const lastActive = user.gamification.streaks.lastActive;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = user.gamification.streaks.current;
      let bestStreak = user.gamification.streaks.best;

      if (isActiveToday) {
        // Vérifier si c'était hier ou aujourd'hui
        if (!lastActive || lastActive.toDateString() === yesterday.toDateString()) {
          newStreak += 1; // Continuer le streak
        } else if (lastActive.toDateString() !== now.toDateString()) {
          newStreak = 1; // Nouveau streak
        }
        // Si c'est aujourd'hui, ne pas modifier le streak

        // Mettre à jour le meilleur streak
        if (newStreak > bestStreak) {
          bestStreak = newStreak;
        }
      } else {
        // Casser le streak si pas actif
        newStreak = 0;
      }

      await User.findByIdAndUpdate(userId, {
        'gamification.streaks.current': newStreak,
        'gamification.streaks.best': bestStreak,
        'gamification.streaks.lastActive': isActiveToday ? now : lastActive,
        'gamification.streaks.lastCalculated': now
      });

      console.log('🔥 [GAMIFICATION] Streak mis à jour:', { current: newStreak, best: bestStreak });
      return { success: true, current: newStreak, best: bestStreak };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur mise à jour streak:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 Mise à jour des statistiques mensuelles
   */
  static async updateMonthlyStats(userId, newTrade = false, newObject = false, xpGained = 0) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const updateData = {
        'gamification.statistics.monthlyProgress.currentMonth': currentMonth,
        'gamification.statistics.lastCalculatedAt': new Date()
      };

      if (newTrade) {
        updateData['$inc'] = updateData['$inc'] || {};
        updateData['$inc']['gamification.statistics.monthlyProgress.tradesThisMonth'] = 1;
      }

      if (newObject) {
        updateData['$inc'] = updateData['$inc'] || {};
        updateData['$inc']['gamification.statistics.monthlyProgress.objectsThisMonth'] = 1;
      }

      if (xpGained > 0) {
        updateData['$inc'] = updateData['$inc'] || {};
        updateData['$inc']['gamification.statistics.monthlyProgress.xpThisMonth'] = xpGained;
      }

      await User.findByIdAndUpdate(userId, updateData);
      console.log('📊 [GAMIFICATION] Stats mensuelles mises à jour');
      return { success: true };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur stats mensuelles:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 Récupération des données sauvegardées
   */
  static async getUserGamificationData(userId) {
    try {
      const user = await User.findById(userId).select('gamification');
      if (!user) return null;

      return {
        level: user.gamification.level,
        totalXP: user.gamification.totalXP,
        currentLevelXP: user.gamification.currentLevelXP,
        title: user.gamification.title,
        lastLevelUp: user.gamification.lastLevelUp,
        achievements: user.gamification.achievements,
        streaks: user.gamification.streaks,
        statistics: user.gamification.statistics,
        lastUpdated: user.gamification.cachedData.lastUpdated,
        needsRecalculation: user.gamification.cachedData.needsRecalculation
      };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur récupération données:', error);
      return null;
    }
  }

  /**
   * 🔄 Marquer comme nécessitant recalcul
   */
  static async markForRecalculation(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        'gamification.cachedData.needsRecalculation': true
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 🎖️ Obtenir le classement d'un utilisateur
   */
  static async getUserRanking(userId) {
    try {
      // Compter combien d'utilisateurs ont plus d'XP
      const user = await User.findById(userId).select('gamification.totalXP');
      if (!user) return null;

      const betterUsersCount = await User.countDocuments({
        'gamification.totalXP': { $gt: user.gamification.totalXP }
      });

      const rank = betterUsersCount + 1;
      const totalUsers = await User.countDocuments({});

      return {
        rank,
        totalUsers,
        percentile: Math.round(((totalUsers - rank) / totalUsers) * 100)
      };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur classement:', error);
      return null;
    }
  }

  /**
   * 🏆 Obtenir le top des utilisateurs
   */
  static async getLeaderboard(limit = 10) {
    try {
      const topUsers = await User.find({})
        .sort({ 'gamification.totalXP': -1 })
        .limit(limit)
        .select('pseudo gamification.level gamification.totalXP gamification.title')
        .lean();

      return topUsers.map((user, index) => ({
        rank: index + 1,
        pseudo: user.pseudo,
        level: user.gamification.level,
        totalXP: user.gamification.totalXP,
        title: user.gamification.title
      }));
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur leaderboard:', error);
      return [];
    }
  }
}

module.exports = GamificationPersistenceService;
