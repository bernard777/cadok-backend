/**
 * 🎮 ROUTES GAMIFICATION AVEC SAUVEGARDE
 * API endpoints pour le système de gamification persistant
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const GamificationPersistenceService = require('../services/gamificationPersistence');
const GamificationMiddleware = require('../middleware/gamificationMiddleware');
const { calculateGamificationFromRealData, formatForGamificationScreen, formatForHomeScreen } = require('../utils/gamificationCalculator');
const GamificationService = require('../services/gamificationService');

// Instance du service de gamification pour les événements
const gamificationService = new GamificationService();

/**
 * 📊 GET /api/gamification - Données complètes de gamification
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log('📊 [API] Récupération gamification pour:', userId);

    // 1. Vérifier si recalcul nécessaire
    const savedData = await GamificationPersistenceService.getUserGamificationData(userId);
    
    let gamificationData;
    
    if (!savedData || savedData.needsRecalculation) {
      console.log('🔄 [API] Recalcul nécessaire');
      
      // Recalculer depuis les données réelles
      gamificationData = await calculateGamificationFromRealData(userId);
      
      if (gamificationData) {
        // Sauvegarder les nouveaux calculs
        await GamificationPersistenceService.saveUserProgress(userId, gamificationData);
        
        // Sauvegarder les achievements
        if (gamificationData.achievements) {
          for (const achievement of gamificationData.achievements) {
            await GamificationPersistenceService.saveAchievement(userId, achievement);
          }
        }
      }
    } else {
      console.log('💾 [API] Utilisation données sauvegardées');
      // Utiliser les données sauvegardées
      gamificationData = {
        level: savedData.level,
        title: savedData.title,
        currentXP: savedData.currentLevelXP,
        totalXP: savedData.totalXP,
        achievements: savedData.achievements || [],
        stats: {
          objectsCount: 0, // Sera calculé si nécessaire
          completedTradesCount: 0,
          totalTradesCount: 0
        }
      };
    }

    // Enrichir avec classement
    const ranking = await GamificationPersistenceService.getUserRanking(userId);
    const leaderboard = await GamificationPersistenceService.getLeaderboard(10);

    // Formater pour GamificationScreen
    const formattedData = formatForGamificationScreen(gamificationData);
    
    // Ajouter les données de classement
    if (ranking) {
      formattedData.ranking = ranking;
    }
    
    if (leaderboard.length > 0) {
      formattedData.leaderboard = leaderboard.map(user => ({
        rank: user.rank,
        pseudo: user.pseudo,
        level: user.level,
        xp: user.totalXP,
        isCurrentUser: user.pseudo === req.user.pseudo
      }));
    }

    res.json({
      success: true,
      gamification: formattedData,
      metadata: {
        lastUpdated: savedData?.lastUpdated || new Date(),
        fromCache: !!savedData && !savedData.needsRecalculation
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur gamification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données de gamification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📱 GET /api/gamification/summary - Résumé pour HomeScreen
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log('📱 [API] Résumé gamification pour HomeScreen:', userId);

    const savedData = await GamificationPersistenceService.getUserGamificationData(userId);
    
    let gamificationData;
    
    if (!savedData || savedData.needsRecalculation) {
      // Recalcul rapide
      gamificationData = await calculateGamificationFromRealData(userId);
      if (gamificationData) {
        await GamificationPersistenceService.saveUserProgress(userId, gamificationData);
      }
    } else {
      gamificationData = {
        level: savedData.level,
        title: savedData.title,
        currentXP: savedData.currentLevelXP,
        nextLevelXP: 100, // Simplifié pour HomeScreen
        progressPercentage: (savedData.currentLevelXP / 100) * 100
      };
    }

    // Format pour HomeScreen
    const homeScreenData = formatForHomeScreen(gamificationData);

    res.json({
      success: true,
      gamification: homeScreenData,
      metadata: {
        lastUpdated: savedData?.lastUpdated || new Date(),
        fromCache: !!savedData && !savedData.needsRecalculation
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur résumé gamification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du résumé'
    });
  }
});

/**
 * 🏆 GET /api/gamification/achievements - Liste des achievements
 */
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const savedData = await GamificationPersistenceService.getUserGamificationData(userId);
    
    res.json({
      success: true,
      achievements: savedData?.achievements || [],
      count: savedData?.achievements?.length || 0
    });

  } catch (error) {
    console.error('❌ [API] Erreur achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des achievements'
    });
  }
});

/**
 * 🏅 GET /api/gamification/leaderboard - Classement
 */
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await GamificationPersistenceService.getLeaderboard(limit);
    const userRanking = await GamificationPersistenceService.getUserRanking(userId);

    res.json({
      success: true,
      leaderboard,
      userRanking,
      metadata: {
        total: leaderboard.length,
        userInTop: leaderboard.some(user => user.pseudo === req.user.pseudo)
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du classement'
    });
  }
});

/**
 * 🔄 POST /api/gamification/recalculate - Force le recalcul
 */
router.post('/recalculate', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    console.log('🔄 [API] Recalcul forcé demandé:', userId);

    const result = await GamificationMiddleware.recalculateAndSave(userId);
    
    if (result.success) {
      const updatedData = await GamificationPersistenceService.getUserGamificationData(userId);
      
      res.json({
        success: true,
        message: 'Progression recalculée avec succès',
        gamification: updatedData
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur lors du recalcul',
        details: result.error
      });
    }

  } catch (error) {
    console.error('❌ [API] Erreur recalcul forcé:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du recalcul forcé'
    });
  }
});

/**
 * 📊 GET /api/gamification/stats - Statistiques détaillées
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const savedData = await GamificationPersistenceService.getUserGamificationData(userId);
    
    if (!savedData) {
      return res.status(404).json({
        success: false,
        error: 'Données de progression non trouvées'
      });
    }

    res.json({
      success: true,
      stats: {
        level: savedData.level,
        totalXP: savedData.totalXP,
        title: savedData.title,
        achievementsCount: savedData.achievements?.length || 0,
        lastLevelUp: savedData.lastLevelUp,
        streaks: savedData.streaks,
        monthlyProgress: savedData.statistics?.monthlyProgress,
        lastUpdated: savedData.lastUpdated
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * 🎪 GET /api/gamification/events
 * Liste des événements actifs
 */
router.get('/events', authMiddleware, async (req, res) => {
  try {
    console.log('🎪 [DEBUG] Récupération événements pour utilisateur normal...');
    const currentDate = new Date();
    console.log('📅 [DEBUG] Date actuelle:', currentDate);
    
    const activeEvents = await gamificationService.getActiveEvents(currentDate);
    console.log('📋 [DEBUG] Événements actifs trouvés:', activeEvents.length);
    
    activeEvents.forEach(event => {
      console.log(`🔍 [DEBUG] Événement: ${event.name} - Active: ${event.isActive} - Dates: ${event.startDate} à ${event.endDate}`);
    });
    
    res.json({ success: true, events: activeEvents });
  } catch (error) {
    console.error('❌ Erreur événements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * 🎯 POST /api/gamification/events/:eventId/participate
 * Participer à un événement
 */
router.post('/events/:eventId/participate', authMiddleware, async (req, res) => {
  try {
    console.log('🎯 [DEBUG] Demande participation événement:', req.params.eventId, 'par utilisateur:', req.user.id);
    console.log('🔍 [DEBUG] Objet user complet:', JSON.stringify(req.user, null, 2));
    
    const result = await gamificationService.participateInEvent(req.user.id, req.params.eventId);
    console.log('📊 [DEBUG] Résultat participateInEvent:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ [DEBUG] Participation réussie');
      res.json({
        success: true,
        message: result.message || 'Participation enregistrée avec succès',
        data: result.data
      });
    } else {
      console.log('❌ [DEBUG] Échec participation:', result.error);
      res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('❌ Erreur participation événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * 📋 GET /api/gamification/user-participations
 * Récupérer les participations de l'utilisateur
 */
router.get('/user-participations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 [DEBUG] Récupération participations pour utilisateur:', userId);
    
    const Event = require('../models/Event');
    
    // Trouver tous les événements où l'utilisateur participe
    const eventsWithUser = await Event.find({
      'participants.userId': userId
    });

    // Créer un objet avec les IDs d'événements comme clés
    const participations = {};
    eventsWithUser.forEach(event => {
      if (event.id) {
        participations[event.id] = true;
      } else {
        participations[event._id.toString()] = true;
      }
    });

    console.log('📊 [DEBUG] Participations trouvées:', Object.keys(participations));
    
    res.json({ 
      success: true, 
      participations 
    });
  } catch (error) {
    console.error('❌ Erreur récupération participations:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
