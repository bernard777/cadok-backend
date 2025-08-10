/**
 * 🎮 ROUTES GAMIFICATION - CADOK
 * API pour la gamification avancée
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const GamificationService = require('../services/gamificationService');

const gamificationService = new GamificationService();

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
