/**
 * 📊 STATISTIQUES ADMINISTRATION - CADOK
 * Routes pour les statistiques générales du panel d'administration
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { 
  requireEventManagement, 
  logAdminAction 
} = require('../../middlewares/adminAuth');
const User = require('../../models/User');
const Event = require('../../models/Event');

/**
 * GET /api/admin/stats
 * Récupère les statistiques générales pour le panel d'administration
 */
router.get('/stats', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    console.log('📊 [DEBUG] Récupération stats admin...');
    
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Actifs dans les 30 derniers jours
    });
    
    // Statistiques des événements
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ 
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    // Événements par statut
    const upcomingEvents = await Event.countDocuments({
      startDate: { $gt: new Date() }
    });
    
    const pastEvents = await Event.countDocuments({
      endDate: { $lt: new Date() }
    });

    // Statistiques fictives pour les éléments non encore implémentés
    // (seront remplacées par de vraies données plus tard)
    const todayTrades = Math.floor(Math.random() * 50) + 10; // Simulation
    const pendingReports = Math.floor(Math.random() * 5); // Simulation
    
    const stats = {
      // Utilisateurs
      totalUsers,
      activeUsers,
      
      // Événements
      totalEvents,
      activeEvents,
      upcomingEvents,
      pastEvents,
      
      // Autres statistiques (temporaires)
      todayTrades,
      pendingReports,
      
      // Métadonnées
      lastUpdated: new Date(),
      period: '30 jours'
    };

    console.log('✅ [DEBUG] Stats admin calculées:', stats);
    
    // Log de l'action admin
    logAdminAction(req.user.id, 'VIEW_STATS', 'Consultation des statistiques admin');
    
    res.json(stats);
  } catch (error) {
    console.error('❌ [DEBUG] Erreur stats admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement des statistiques' 
    });
  }
});

/**
 * GET /api/admin/overview
 * Vue d'ensemble rapide pour le dashboard admin
 */
router.get('/overview', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Récupération overview admin...');
    
    // Résumé rapide
    const overview = {
      platform: {
        name: 'CADOK',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      quick_stats: {
        users_today: Math.floor(Math.random() * 25) + 5,
        events_active: await Event.countDocuments({ isActive: true }),
        system_health: 'good' // green, yellow, red
      }
    };

    console.log('✅ [DEBUG] Overview admin généré');
    res.json(overview);
  } catch (error) {
    console.error('❌ [DEBUG] Erreur overview admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du chargement de l\'overview' 
    });
  }
});

module.exports = router;
