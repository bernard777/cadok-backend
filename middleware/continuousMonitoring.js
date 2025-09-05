/**
 * 🚨 SYSTÈME D'ALERTE TEMPS RÉEL - MONITORING PROACTIF
 * Surveillance automatique et notifications aux administrateurs
 * Détection proactive des problèmes critiques
 * 
 * 🔧 AMÉLIORATIONS MEDICALGO IMPLÉMENTÉES:
 * ✅ Robustesse MongoDB avec retry logic et reconnect automatique
 * ✅ Monitoring continu avec alertes proactives
 * ✅ Logging avancé Winston structuré
 * ✅ Performance optimisée avec cache intelligent
 */

const { logger } = require('../utils/logger');
const cadokLogger = require('../utils/cadokLogger');
const { checkDatabaseHealth } = require('../db');
const mongoose = require('mongoose');

// 🔧 ROBUSTESSE MONGODB - Gestion des reconnexions et retry logic
const mongoRetryOptions = {
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000
};

// Surveillance état connexion MongoDB avec reconnect automatique
function setupMongoDBMonitoring() {
  mongoose.connection.on('connected', () => {
    cadokLogger.logSecurityEvent('MongoDB connexion établie', { 
      state: 'connected',
      readyState: mongoose.connection.readyState 
    });
  });

  mongoose.connection.on('error', (error) => {
    cadokLogger.logSecurityEvent('MongoDB erreur connexion', { 
      error: error.message,
      state: 'error' 
    });
    // Retry automatique géré par Mongoose
  });

  mongoose.connection.on('disconnected', () => {
    cadokLogger.logSecurityEvent('MongoDB déconnecté - tentative reconnexion...', { 
      state: 'disconnected' 
    });
    // Reconnexion automatique
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        mongoose.connect(process.env.MONGODB_URI, mongoRetryOptions);
      }
    }, 5000);
  });

  mongoose.connection.on('reconnected', () => {
    cadokLogger.logSecurityEvent('MongoDB reconnexion réussie', { 
      state: 'reconnected' 
    });
  });
}

// Configuration des seuils d'alerte - AJUSTÉS POUR DÉVELOPPEMENT
const ALERT_THRESHOLDS = {
  memory: {
    warning: 512,    // MB d'utilisation mémoire (au lieu de %)
    critical: 1024   // MB - Plus réaliste pour développement
  },
  pendingTrades: {
    warning: 50,    // Nombre de trades en attente
    critical: 100
  },
  responseTime: {
    warning: 2000,  // ms
    critical: 5000
  },
  uptime: {
    info: 300       // Redémarrage récent (5 minutes)
  }
};

// Cache des dernières alertes pour éviter le spam
const alertCache = new Map();
const ALERT_COOLDOWN = 15 * 60 * 1000; // 15 minutes

/**
 * 🔍 SURVEILLANCE CONTINUE - EXÉCUTION PÉRIODIQUE
 */
class ContinuousMonitoring {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkInterval = 2 * 60 * 1000; // Vérification toutes les 2 minutes
  }

  start() {
    if (this.isRunning) return;
    
    // Initialiser surveillance MongoDB avec retry logic
    setupMongoDBMonitoring();
    
    logger.info('🚨 Démarrage surveillance continue monitoring');
    this.isRunning = true;
    
    // Attendre 5 secondes pour que la DB se connecte avant première vérification
    setTimeout(() => {
      this.performHealthCheck();
    }, 5000);
    
    // Puis vérifications périodiques
    this.interval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  stop() {
    if (!this.isRunning) return;
    
    logger.info('🛑 Arrêt surveillance continue monitoring');
    this.isRunning = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async performHealthCheck() {
    try {
      // 1. Vérifier la base de données
      await this.checkDatabaseHealth();
      
      // 2. Vérifier l'utilisation mémoire
      await this.checkMemoryUsage();
      
      // 3. Vérifier les trades en attente
      await this.checkPendingTrades();
      
      // 4. Vérifier l'uptime (redémarrage récent)
      await this.checkUptime();

    } catch (error) {
      logger.error('Erreur lors de la surveillance continue:', { 
        error: error.message,
        stack: error.stack
      });
      
      // Alerte critique : le système de monitoring lui-même a un problème
      await this.sendAlert({
        id: 'monitoring_system_error',
        severity: 'critical',
        title: 'Erreur système de monitoring',
        message: `Le système de surveillance a rencontré une erreur: ${error.message}`,
        action: 'Vérifier les logs et redémarrer le monitoring'
      });
    }
  }

  async checkDatabaseHealth() {
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.status !== 'healthy') {
      await this.sendAlert({
        id: 'database_unhealthy',
        severity: 'critical',
        title: 'Base de données inaccessible',
        message: dbHealth.message,
        action: 'Vérifier la connexion MongoDB et redémarrer si nécessaire',
        details: dbHealth
      });
    }
  }

  async checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    let severity = null;
    if (heapUsedMB >= ALERT_THRESHOLDS.memory.critical) {
      severity = 'critical';
    } else if (heapUsedMB >= ALERT_THRESHOLDS.memory.warning) {
      severity = 'warning';
    }

    if (severity) {
      await this.sendAlert({
        id: 'high_memory_usage',
        severity,
        title: 'Utilisation mémoire élevée',
        message: `Mémoire heap utilisée: ${heapUsagePercent.toFixed(1)}% (${heapUsedMB} MB / ${heapTotalMB} MB)`,
        action: severity === 'critical' ? 'Redémarrage urgent recommandé' : 'Surveiller et envisager un redémarrage',
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          heapUsedMB,
          heapTotalMB
        }
      });
    }
  }

  async checkPendingTrades() {
    try {
      // Vérifier que la DB est connectée avant d'essayer
      if (mongoose.connection.readyState !== 1) {
        return; // DB pas connectée, skip cette vérification
      }
      
      const Trade = mongoose.model('Trade');
      const pendingCount = await Trade.countDocuments({ status: 'pending' });
      
      let severity = null;
      if (pendingCount >= ALERT_THRESHOLDS.pendingTrades.critical) {
        severity = 'critical';
      } else if (pendingCount >= ALERT_THRESHOLDS.pendingTrades.warning) {
        severity = 'warning';
      }

      if (severity) {
        await this.sendAlert({
          id: 'many_pending_trades',
          severity,
          title: 'Accumulation de trades en attente',
          message: `${pendingCount} trades en attente de traitement`,
          action: 'Vérifier le système de notifications et les processus de validation',
          details: { pendingCount }
        });
      }
    } catch (error) {
      logger.warn('Impossible de vérifier les trades en attente:', { error: error.message });
    }
  }

  async checkUptime() {
    const uptime = process.uptime();
    
    if (uptime < ALERT_THRESHOLDS.uptime.info) {
      await this.sendAlert({
        id: 'recent_restart',
        severity: 'info',
        title: 'Redémarrage récent détecté',
        message: `Uptime actuel: ${Math.round(uptime)} secondes`,
        action: 'Vérifier les logs pour identifier la cause du redémarrage',
        details: { uptime }
      });
    }
  }

  async sendAlert(alert) {
    const alertKey = `${alert.id}_${alert.severity}`;
    const now = Date.now();
    
    // Vérifier le cooldown pour éviter le spam
    if (alertCache.has(alertKey)) {
      const lastAlert = alertCache.get(alertKey);
      if (now - lastAlert < ALERT_COOLDOWN) {
        return; // Alerte déjà envoyée récemment
      }
    }

    // Marquer cette alerte comme envoyée
    alertCache.set(alertKey, now);
    
    // Enrichir l'alerte avec des métadonnées
    const enrichedAlert = {
      ...alert,
      timestamp: new Date().toISOString(),
      source: 'continuous_monitoring',
      serverId: process.env.SERVER_ID || 'cadok_main',
      environment: process.env.NODE_ENV
    };

    // 1. Logger l'alerte
    const logLevel = alert.severity === 'critical' ? 'error' : 
                    alert.severity === 'warning' ? 'warn' : 'info';
    
    logger[logLevel]('🚨 ALERTE SYSTÈME', enrichedAlert);
    
    // 2. Logger dans le système de sécurité
    cadokLogger.logSuspiciousActivity(
      'system',
      'monitoring_alert',
      enrichedAlert,
      'internal'
    );

    // 3. Envoyer aux administrateurs connectés (WebSocket)
    await this.notifyAdministrators(enrichedAlert);
    
    // 4. Si critique, envoyer notification email/SMS (à implémenter)
    if (alert.severity === 'critical') {
      await this.sendCriticalNotification(enrichedAlert);
    }
  }

  async notifyAdministrators(alert) {
    try {
      // Vérifier que la DB est connectée avant d'essayer d'insérer
      if (mongoose.connection.readyState !== 1) {
        logger.warn('DB non connectée - Alerte stockée en mémoire seulement', { alert });
        return;
      }
      
      // Récupérer les admins connectés (si WebSocket implémenté)
      // Pour l'instant, on stocke en DB pour récupération via API
      const AlertModel = mongoose.model('Alert');
      
      const alertDoc = new AlertModel({
        ...alert,
        read: false,
        acknowledgedBy: null,
        createdAt: new Date()
      });
      
      await alertDoc.save();
      
      logger.info('Alerte sauvegardée pour notification admin', { 
        alertId: alertDoc._id,
        severity: alert.severity 
      });

    } catch (error) {
      logger.error('Erreur notification administrateurs:', { error: error.message });
    }
  }

  async sendCriticalNotification(alert) {
    // TODO: Implémenter notifications email/SMS pour alertes critiques
    logger.error('🚨 ALERTE CRITIQUE NÉCESSITANT INTERVENTION IMMÉDIATE', alert);
    
    // Exemple intégration future :
    // await emailService.sendCriticalAlert(alert);
    // await smsService.sendCriticalAlert(alert);
  }
}

/**
 * 📊 MODÈLE MONGOOSE POUR STOCKER LES ALERTES
 */
const alertSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  severity: { 
    type: String, 
    enum: ['critical', 'warning', 'info'], 
    required: true,
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  source: { type: String, default: 'monitoring' },
  serverId: String,
  environment: String,
  read: { type: Boolean, default: false, index: true },
  acknowledgedBy: { type: String, default: null },
  acknowledgedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Index composé pour optimiser les requêtes admin
alertSchema.index({ severity: 1, read: 1, createdAt: -1 });

// Créer le modèle seulement s'il n'existe pas déjà
let AlertModel;
try {
  AlertModel = mongoose.model('Alert');
} catch {
  AlertModel = mongoose.model('Alert', alertSchema);
}

/**
 * 🎯 MIDDLEWARE EXPRESS POUR SURVEILLANCE RÉPONSE
 */
const responseTimeMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Logger toutes les requêtes lentes
    if (responseTime > ALERT_THRESHOLDS.responseTime.warning) {
      const severity = responseTime > ALERT_THRESHOLDS.responseTime.critical ? 'critical' : 'warning';
      
      logger.warn('Requête lente détectée', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        severity,
        requestId: req.requestId,
        userAgent: req.get('User-Agent')
      });

      // Si critique, envoyer alerte
      if (severity === 'critical') {
        continuousMonitoring.sendAlert({
          id: 'slow_response_time',
          severity: 'critical',
          title: 'Temps de réponse critique',
          message: `Requête ${req.method} ${req.originalUrl} a pris ${responseTime}ms`,
          action: 'Vérifier la performance de la base de données et du serveur',
          details: {
            method: req.method,
            url: req.originalUrl,
            responseTime,
            requestId: req.requestId
          }
        });
      }
    }
  });
  
  next();
};

// Instance globale du monitoring continu
const continuousMonitoring = new ContinuousMonitoring();

/**
 * 🚀 DÉMARRAGE AUTOMATIQUE DU MONITORING
 */
const startMonitoring = () => {
  if (process.env.NODE_ENV !== 'test') {
    logger.info('🚨 Initialisation du système de monitoring continu');
    continuousMonitoring.start();
    
    // Arrêt propre du monitoring
    process.on('SIGTERM', () => {
      logger.info('SIGTERM reçu - Arrêt du monitoring');
      continuousMonitoring.stop();
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT reçu - Arrêt du monitoring');
      continuousMonitoring.stop();
    });
  }
};

module.exports = {
  ContinuousMonitoring,
  continuousMonitoring,
  responseTimeMonitoring,
  startMonitoring,
  AlertModel,
  ALERT_THRESHOLDS
};
