/**
 * 🔄 MIDDLEWARE AUTO-SAVE GAMIFICATION
 * Sauvegarde automatique de la progression après actions importantes
 */

const GamificationPersistenceService = require('../services/gamificationPersistence');

class GamificationMiddleware {
  
  /**
   * 🎯 Middleware pour sauvegarder après création d'objet
   */
  static async afterObjectCreation(req, res, next) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) return next();

      console.log('📦 [GAMIFICATION] Objet créé, mise à jour progression...');
      
      // Marquer pour recalcul
      await GamificationPersistenceService.markForRecalculation(userId);
      
      // Mettre à jour stats mensuelles
      await GamificationPersistenceService.updateMonthlyStats(userId, false, true, 10);
      
      // Mettre à jour streak
      await GamificationPersistenceService.updateStreak(userId, true);

      console.log('✅ [GAMIFICATION] Progression mise à jour après création objet');
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur middleware objet:', error);
    }
    
    next();
  }

  /**
   * 🔄 Middleware pour sauvegarder après échange
   */
  static async afterTradeStatusChange(req, res, next) {
    try {
      const trade = req.trade || res.locals.trade;
      if (!trade) return next();

      const userIds = [trade.fromUser, trade.toUser].filter(Boolean);
      
      for (const userId of userIds) {
        console.log('🔄 [GAMIFICATION] Échange modifié, mise à jour progression...');
        
        // Marquer pour recalcul
        await GamificationPersistenceService.markForRecalculation(userId);
        
        // Si échange terminé, ajouter XP et stats
        if (trade.status === 'completed') {
          await GamificationPersistenceService.updateMonthlyStats(userId, true, false, 50);
          await GamificationPersistenceService.updateStreak(userId, true);
        }
      }

      console.log('✅ [GAMIFICATION] Progression mise à jour après échange');
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur middleware échange:', error);
    }
    
    next();
  }

  /**
   * 🚪 Middleware pour tracking connexion
   */
  static async afterLogin(req, res, next) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) return next();

      console.log('🚪 [GAMIFICATION] Connexion détectée, mise à jour streak...');
      
      // Mettre à jour le streak de connexion
      await GamificationPersistenceService.updateStreak(userId, true);
      
      // Incrémenter compteur de connexions
      await User.findByIdAndUpdate(userId, {
        $inc: { 'gamification.statistics.totalLogins': 1 }
      });

      console.log('✅ [GAMIFICATION] Streak de connexion mis à jour');
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur middleware connexion:', error);
    }
    
    next();
  }

  /**
   * 🎮 Recalcul et sauvegarde forcée
   */
  static async recalculateAndSave(userId, customData = null) {
    try {
      console.log('🎮 [GAMIFICATION] Recalcul forcé pour utilisateur:', userId);
      
      let gamificationData;
      
      if (customData) {
        // Utiliser les données fournies
        gamificationData = customData;
      } else {
        // Importer le service de calcul (éviter les imports circulaires)
        const { calculateGamificationFromRealData } = require('../utils/gamificationCalculator');
        gamificationData = await calculateGamificationFromRealData(userId);
      }
      
      if (gamificationData) {
        await GamificationPersistenceService.saveUserProgress(userId, gamificationData);
        
        // Sauvegarder les achievements s'il y en a
        if (gamificationData.achievements && Array.isArray(gamificationData.achievements)) {
          for (const achievement of gamificationData.achievements) {
            await GamificationPersistenceService.saveAchievement(userId, achievement);
          }
        }
      }
      
      console.log('✅ [GAMIFICATION] Recalcul et sauvegarde terminés');
      return { success: true };
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur recalcul forcé:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔄 Middleware express pour recalcul automatique si nécessaire
   */
  static async autoRecalculateIfNeeded(req, res, next) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) return next();

      const savedData = await GamificationPersistenceService.getUserGamificationData(userId);
      
      // Recalcul si données pas à jour ou explicitement demandé
      if (!savedData || savedData.needsRecalculation) {
        console.log('🔄 [GAMIFICATION] Recalcul automatique nécessaire');
        await GamificationMiddleware.recalculateAndSave(userId);
      }
      
    } catch (error) {
      console.error('❌ [GAMIFICATION] Erreur auto-recalcul:', error);
    }
    
    next();
  }
}

module.exports = GamificationMiddleware;
