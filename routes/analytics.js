/**
 * 📊 ROUTES ANALYTICS - CADOK
 * API pour le dashboard analytique
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const AnalyticsService = require('../services/analyticsService');

const analyticsService = new AnalyticsService();

/**
 * GET /api/analytics/dashboard
 * Dashboard analytique complet
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const result = await analyticsService.getUserDashboard(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur dashboard analytics:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/trading-metrics
 * Métriques détaillées des échanges
 */
router.get('/trading-metrics', authMiddleware, async (req, res) => {
  try {
    const metrics = await analyticsService.getTradingMetrics(req.user.id);
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('❌ Erreur métriques trading:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/objects-metrics
 * Métriques des objets partagés
 */
router.get('/objects-metrics', authMiddleware, async (req, res) => {
  try {
    const metrics = await analyticsService.getObjectsMetrics(req.user.id);
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('❌ Erreur métriques objets:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/community-ranking
 * Classement dans la communauté
 */
router.get('/community-ranking', authMiddleware, async (req, res) => {
  try {
    const ranking = await analyticsService.getCommunityRanking(req.user.id);
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('❌ Erreur classement communauté:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/monthly-trends
 * Tendances mensuelles d'activité
 */
router.get('/monthly-trends', authMiddleware, async (req, res) => {
  try {
    const trends = await analyticsService.getMonthlyTrends(req.user.id);
    res.json({ success: true, trends });
  } catch (error) {
    console.error('❌ Erreur tendances mensuelles:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/analytics/personalized-tips
 * Conseils personnalisés
 */
router.get('/personalized-tips', authMiddleware, async (req, res) => {
  try {
    const tips = await analyticsService.getPersonalizedTips(req.user.id);
    res.json({ success: true, tips });
  } catch (error) {
    console.error('❌ Erreur conseils personnalisés:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
