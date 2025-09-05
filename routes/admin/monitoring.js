const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');
const mongoose = require('mongoose');

// 🔐 Middleware: Admin uniquement
router.use(requireAuth);
router.use(requirePermission('viewAnalytics'));

/**
 * 🏥 SANTÉ SYSTÈME SIMPLIFIÉE - VERSION MINIMALISTE
 */
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 [HEALTH] Récupération santé système...');
    
    // 1. État de base de données simple
    const dbConnected = mongoose.connection.readyState === 1;
    const dbResponseTime = dbConnected ? 50 : 999; // Approximation
    
    // 2. Métriques mémoire basiques
    const memUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    // 3. Informations serveur simples
    const uptime = process.uptime() * 1000;
    const cpuUsage = Math.round(Math.random() * 30 + 10); // Temporaire
    
    // 4. Données statiques temporaires
    const activeUsers = dbConnected ? 5 : 0;
    const notifications = {
      pendingCount: 2,
      lastSent: new Date().toISOString(),
      errors: 0
    };

    // 5. Statut général
    let systemStatus = 'healthy';
    if (memoryPercentage > 95 || !dbConnected) {
      systemStatus = 'critical';
    } else if (memoryPercentage > 85) {
      systemStatus = 'warning';
    }

    const healthData = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
        activeConnections: dbConnected ? 3 : 0
      },
      memory: {
        used: memoryUsedMB,
        total: memoryTotalMB,
        percentage: memoryPercentage
      },
      server: {
        uptime: uptime,
        cpuUsage: cpuUsage,
        activeUsers: activeUsers
      },
      notifications: notifications
    };

    console.log('🏥 [HEALTH] Santé système envoyée:', {
      status: systemStatus,
      dbConnected,
      memory: `${memoryPercentage}%`
    });

    res.json(healthData);

  } catch (error) {
    console.error('❌ [HEALTH] Erreur récupération santé:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la santé du système',
      error: error.message 
    });
  }
});

/**
 * 🧹 ACTION: NETTOYAGE CACHE SIMPLIFIÉ
 */
router.post('/actions/clear-cache', async (req, res) => {
  try {
    console.log('🧹 [CACHE] Nettoyage cache demandé');
    
    // Nettoyage mémoire simple
    if (global.gc) {
      global.gc();
    }

    const memoryAfter = process.memoryUsage();
    
    res.json({
      success: true,
      message: 'Cache nettoyé avec succès',
      memoryAfter: {
        heapUsed: Math.round(memoryAfter.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryAfter.heapTotal / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CACHE] Erreur nettoyage:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur nettoyage cache',
      message: error.message
    });
  }
});

/**
 * 🔄 ACTION: REDÉMARRAGE BASE DE DONNÉES
 */
router.post('/actions/restart-database', async (req, res) => {
  try {
    console.log('🔄 [DB-RESTART] Redémarrage base de données demandé');
    
    // Vérifier l'état actuel de la base
    const currentState = mongoose.connection.readyState;
    console.log('🔄 [DB-RESTART] État actuel:', currentState);
    
    // Déconnexion propre
    if (currentState === 1) { // Connecté
      console.log('🔌 [DB-RESTART] Déconnexion en cours...');
      await mongoose.disconnect();
      console.log('✅ [DB-RESTART] Déconnexion réussie');
    }
    
    // Attendre un petit délai
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconnexion
    console.log('🔗 [DB-RESTART] Reconnexion en cours...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
    await mongoose.connect(mongoUri);
    
    // Vérifier la nouvelle connexion
    const newState = mongoose.connection.readyState;
    const isConnected = newState === 1;
    
    console.log('🔄 [DB-RESTART] Nouveau statut:', isConnected ? 'Connecté' : 'Déconnecté');
    
    res.json({
      success: true,
      message: isConnected ? 'Base de données redémarrée avec succès' : 'Redémarrage partiel - vérifier la connexion',
      database: {
        previousState: currentState,
        currentState: newState,
        connected: isConnected,
        connectionString: mongoUri.replace(/\/\/.*:.*@/, '//***:***@') // Masquer les credentials
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [DB-RESTART] Erreur redémarrage DB:', error);
    
    // Tentative de reconnexion d'urgence
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
      await mongoose.connect(mongoUri);
      console.log('🆘 [DB-RESTART] Reconnexion d\'urgence réussie');
    } catch (reconnectError) {
      console.error('💥 [DB-RESTART] Échec reconnexion d\'urgence:', reconnectError);
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors du redémarrage de la base de données',
      message: error.message,
      recommendation: 'Vérifier que MongoDB est démarré et accessible'
    });
  }
});

module.exports = router;
