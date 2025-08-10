/**
 * 🌱 ROUTES ECO-IMPACT - CADOK
 * API pour l'impact écologique
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const EcoImpactService = require('../services/ecoImpactService');

const ecoImpactService = new EcoImpactService();

/**
 * GET /api/eco/dashboard
 * Dashboard impact écologique complet
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const result = await ecoImpactService.getUserEcoDashboard(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur dashboard écologique:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/carbon-footprint
 * Calcul de l'empreinte carbone évitée
 */
router.get('/carbon-footprint', authMiddleware, async (req, res) => {
  try {
    const carbonFootprint = await ecoImpactService.calculateCarbonFootprint(req.user.id);
    res.json({ success: true, carbonFootprint });
  } catch (error) {
    console.error('❌ Erreur empreinte carbone:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/lifecycle-analysis
 * Analyse du cycle de vie des objets
 */
router.get('/lifecycle-analysis', authMiddleware, async (req, res) => {
  try {
    const lifecycle = await ecoImpactService.analyzeObjectsLifecycle(req.user.id);
    res.json({ success: true, lifecycle });
  } catch (error) {
    console.error('❌ Erreur analyse cycle de vie:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/community-impact
 * Impact écologique communautaire
 */
router.get('/community-impact', authMiddleware, async (req, res) => {
  try {
    const community = await ecoImpactService.getCommunityEcoImpact(req.user.id);
    res.json({ success: true, community });
  } catch (error) {
    console.error('❌ Erreur impact communautaire:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/monthly-progress
 * Progrès écologique mensuel
 */
router.get('/monthly-progress', authMiddleware, async (req, res) => {
  try {
    const progress = await ecoImpactService.getMonthlyEcoProgress(req.user.id);
    res.json({ success: true, progress });
  } catch (error) {
    console.error('❌ Erreur progrès mensuel:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/achievements
 * Réalisations écologiques
 */
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const achievements = await ecoImpactService.getEcoAchievements(req.user.id);
    res.json({ success: true, achievements });
  } catch (error) {
    console.error('❌ Erreur achievements écologiques:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/recommendations
 * Recommandations écologiques personnalisées
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const recommendations = await ecoImpactService.getEcoRecommendations(req.user.id);
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('❌ Erreur recommandations écologiques:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/city-ranking
 * Classement écologique par ville
 */
router.get('/city-ranking', authMiddleware, async (req, res) => {
  try {
    const { city } = req.query;
    const ranking = await ecoImpactService.getLocalEcoLeaderboard(city || req.user.city, 10);
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('❌ Erreur classement ville:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/eco/calculate-impact
 * Calculer l'impact d'un échange potentiel
 */
router.post('/calculate-impact', authMiddleware, async (req, res) => {
  try {
    const { objectIds, category } = req.body;
    
    if (!objectIds || !Array.isArray(objectIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Liste d\'objets requise' 
      });
    }

    // Calcul simplifié de l'impact
    const carbonFactors = {
      'Électronique': 150,
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

    const estimatedCarbonSaved = objectIds.length * (carbonFactors[category] || 30);
    const estimatedWasteAvoided = objectIds.length * 2;

    res.json({
      success: true,
      impact: {
        carbonSaved: estimatedCarbonSaved,
        wasteAvoided: estimatedWasteAvoided,
        treesEquivalent: Math.round(estimatedCarbonSaved / 22),
        message: `Cet échange pourrait éviter ${estimatedCarbonSaved}kg de CO2 !`
      }
    });
  } catch (error) {
    console.error('❌ Erreur calcul impact:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
