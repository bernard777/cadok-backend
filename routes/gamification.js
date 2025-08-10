/**
 * 🎮 ROUTES GAMIFICATION - CADOK
 * API pour la gamification avancée
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const GamificationService = require('../services/gamificationService');
const { 
  validateEventParticipation, 
  requireEventParticipation 
} = require('../middlewares/eventValidation');

const gamificationService = new GamificationService();

/**
 * GET /api/gamification/
 * Route racine - redirige vers le dashboard
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('🎮 [GAMIFICATION] Appel route racine pour utilisateur:', req.user.id);
    const result = await gamificationService.getUserGamificationDashboard(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur gamification racine:', error);
    res.status(500).json({ error: 'Erreur serveur gamification' });
  }
});

/**
 * GET /api/gamification/dashboard
 * Dashboard gamification complet
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const result = await gamificationService.getUserGamificationDashboard(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur dashboard gamification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/profile
 * Profil de joueur détaillé
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await gamificationService.getUserProfile(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur profil gamification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * 🎪 ROUTES ÉVÉNEMENTS SPÉCIAUX
 */

/**
 * GET /api/gamification/events
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
 * GET /api/gamification/events/:eventId/challenges
 * Défis spécifiques à un événement
 */
router.get('/events/:eventId/challenges', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const activeEvents = await gamificationService.getActiveEvents(new Date());
    const event = activeEvents.find(e => e.id === eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Événement non trouvé ou inactif' });
    }

    const challenges = await gamificationService.generateEventSpecificChallenges(req.user.id, event);
    res.json({ 
      success: true, 
      event: event,
      challenges: challenges,
      timeRemaining: event.endDate.getTime() - Date.now()
    });
  } catch (error) {
    console.error('❌ Erreur défis événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/gamification/events/:eventId/participate
 * Inscription à un événement (UNE SEULE FOIS PAR UTILISATEUR)
 * 🔒 Utilise les middlewares de validation pour empêcher les inscriptions multiples
 */
router.post('/events/:eventId/participate', authMiddleware, ...validateEventParticipation, async (req, res) => {
  try {
    const { eventId } = req.params;
    // L'événement est déjà validé et disponible dans req.event
    const result = await gamificationService.participateInEvent(req.user.id, eventId);
    
    if (result.success) {
      res.json(result);
    } else {
      // Ne devrait normalement pas arriver grâce aux middlewares
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Erreur participation événement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'inscription',
      code: 'SERVER_ERROR' 
    });
  }
});

/**
 * GET /api/gamification/events/:eventId/participation-status
 * Vérifier le statut de participation d'un utilisateur
 */
router.get('/events/:eventId/participation-status', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = require('../models/Event');
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    const participant = event.participants.find(p => 
      p.userId.toString() === req.user.id.toString()
    );
    
    if (participant) {
      res.json({
        success: true,
        isParticipating: true,
        participation: {
          joinedAt: participant.joinedAt,
          progress: participant.progress,
          participantNumber: event.participants.findIndex(p => 
            p.userId.toString() === req.user.id.toString()
          ) + 1,
          totalParticipants: event.participants.length
        },
        event: {
          name: event.name,
          theme: event.theme,
          icon: event.icon,
          endDate: event.endDate,
          bonusMultiplier: event.bonusMultiplier
        }
      });
    } else {
      res.json({
        success: true,
        isParticipating: false,
        canParticipate: event.isActive && 
                       new Date() >= event.startDate && 
                       new Date() <= event.endDate,
        event: {
          name: event.name,
          theme: event.theme,
          icon: event.icon,
          startDate: event.startDate,
          endDate: event.endDate,
          totalParticipants: event.participants.length
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur vérification participation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
});

/**
 * GET /api/gamification/events/:eventId/leaderboard
 * Classement spécifique à un événement
 * 🔒 Nécessite une participation pour voir le classement complet
 */
router.get('/events/:eventId/leaderboard', authMiddleware, requireEventParticipation, async (req, res) => {
  try {
    const { eventId } = req.params;
    const leaderboard = await gamificationService.getEventLeaderboard(req.user.id, eventId);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('❌ Erreur classement événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/gamification/events/:eventId/challenges/:challengeId/complete
 * Marquer un défi événementiel comme complété
 * 🔒 Nécessite une participation active à l'événement
 */
router.post('/events/:eventId/challenges/:challengeId/complete', authMiddleware, requireEventParticipation, async (req, res) => {
  try {
    const { eventId, challengeId } = req.params;
    // req.event et req.participation sont disponibles grâce au middleware
    const result = await gamificationService.completeEventChallenge(req.user.id, eventId, challengeId);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur completion défi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/profile
  try {
    const profile = await gamificationService.getPlayerProfile(req.user.id);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('❌ Erreur profil joueur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/achievements
 * Achievements et badges utilisateur
 */
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const achievements = await gamificationService.getUserAchievements(req.user.id);
    res.json({ success: true, achievements });
  } catch (error) {
    console.error('❌ Erreur achievements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/challenges
 * Défis actifs (quotidiens, hebdomadaires, mensuels)
 */
router.get('/challenges', authMiddleware, async (req, res) => {
  try {
    const challenges = await gamificationService.getActiveChallenges(req.user.id);
    res.json({ success: true, challenges });
  } catch (error) {
    console.error('❌ Erreur défis:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/gamification/complete-challenge
 * Compléter un défi
 */
router.post('/complete-challenge', authMiddleware, async (req, res) => {
  try {
    const { challengeId, progress } = req.body;

    if (!challengeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID du défi requis' 
      });
    }

    // Validation et completion du défi (logique simplifiée)
    const result = {
      success: true,
      challengeId,
      completed: progress >= 10, // Exemple: défi complété si progress >= 10
      xpEarned: progress >= 10 ? 50 : 0,
      pointsEarned: progress >= 10 ? 25 : 0
    };

    res.json(result);
  } catch (error) {
    console.error('❌ Erreur completion défi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/leaderboards
 * Classements multi-catégories
 */
router.get('/leaderboards', authMiddleware, async (req, res) => {
  try {
    const leaderboards = await gamificationService.getLeaderboards(req.user.id);
    res.json({ success: true, leaderboards });
  } catch (error) {
    console.error('❌ Erreur classements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/rewards
 * Système de récompenses et boutique
 */
router.get('/rewards', authMiddleware, async (req, res) => {
  try {
    const rewards = await gamificationService.getRewardSystem(req.user.id);
    res.json({ success: true, rewards });
  } catch (error) {
    console.error('❌ Erreur système récompenses:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/gamification/stats
 * Statistiques globales gamification
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Statistiques simplifiées
    const stats = {
      totalPlayers: 1250,
      totalXPDistributed: 125000,
      totalAchievements: 45,
      totalChallengesCompleted: 8950,
      averageLevel: 7.3,
      mostPopularAchievement: 'Premier Échange',
      topPlayerLevel: 23
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Erreur stats globales:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
