const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// 🛡️ IMPORTATION MIDDLEWARE DE SÉCURITÉ
const securityMiddleware = require('./middleware/security');

// 📊 IMPORTATION NOUVEAUX MIDDLEWARES

// 🚨 MIDDLEWARE DE MONITORING TEMPS RÉEL (Solution MedicalGo)
const { requestCorrelation, errorLogging } = require('./middleware/requestCorrelation');
const { globalErrorHandler, notFoundHandler, handleUnhandledRejection, handleUncaughtException } = require('./middleware/errorHandler');
const { handleValidationErrors } = require('./middleware/validation');
const { logger } = require('./utils/logger');

// 🔧 CONFIGURATION INTELLIGENTE D'ENVIRONNEMENT
// Charger le bon fichier .env selon le contexte
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
  // Mode test : utiliser .env.test
  dotenv.config({ path: '.env.test' });
  console.log('🧪 [APP] Mode test détecté - Configuration .env.test chargée');
} else {
  // Mode normal : utiliser .env par défaut
  dotenv.config();
  console.log('🚀 [APP] Mode production - Configuration .env chargée');
}

// 🔧 VALIDATION DES VARIABLES D'ENVIRONNEMENT (Solution MedicalGo)
const { validateEnvironment, displayEnvironmentSummary } = require('./config/validation');
const validationResult = validateEnvironment();

// Afficher le résumé de configuration
displayEnvironmentSummary();

const app = express();

// 📊 MIDDLEWARE DE CORRÉLATION DES REQUÊTES (Solution MedicalGo)
app.use(requestCorrelation);

// 🚨 MIDDLEWARE DE MONITORING TEMPS RÉEL (Solution MedicalGo)
const { responseTimeMonitoring } = require('./middleware/continuousMonitoring');
app.use(responseTimeMonitoring);

// 🔗 CONNEXION MONGODB (pour production uniquement)
const { connectToDatabase } = require('./db');

// Établir la connexion MongoDB SEULEMENT en mode production ou développement
// En mode test, les tests gèrent leur propre connexion
if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  connectToDatabase().catch(error => {
    console.error('❌ [APP] Erreur connexion MongoDB:', error.message);
    console.warn('⚠️ [APP] Le serveur continue sans MongoDB - certaines fonctionnalités peuvent être limitées');
    // Supprimé: process.exit(1); pour éviter l'arrêt du serveur
  });
  console.log('🔗 [APP] Connexion MongoDB initialisée pour mode production');
} else {
  console.log('🧪 [APP] Mode test - Connexion MongoDB gérée par les tests');
}

// 🛡️ MIDDLEWARE DE SÉCURITÉ (APPLIQUÉS EN PREMIER)
console.log('🛡️ [APP] Configuration des middlewares de sécurité...');

// Headers sécurisés avec Helmet - Configuration stricte uniquement
app.use(securityMiddleware.setupHelmet());

// Headers personnalisés de sécurité (Solution MedicalGo)
app.use((req, res, next) => {
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting global
app.use(securityMiddleware.createGlobalRateLimit());

// Sanitisation des entrées (appliqué AVANT les autres middlewares)
app.use(securityMiddleware.sanitizeInput());

// Détection d'injections SQL
app.use(securityMiddleware.detectSQLInjection());

console.log('✅ [APP] Middlewares de sécurité configurés');

// Middleware standards (APRÈS la sécurité)
// 🔐 Configuration CORS sécurisée (Solution MedicalGo)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.SOCKET_CORS_ORIGIN || '').split(',').filter(Boolean);
    
    // Permettre les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📄 SERVIR LES FICHIERS STATIQUES (images, uploads, etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));
console.log('✅ [APP] Fichiers statiques configurés (/uploads, /public)');

// 🔧 Middlewares de contrôle des paramètres système
const maintenanceCheck = require('./middleware/maintenanceCheck');
const registrationCheck = require('./middleware/registrationCheck');
const tradingCheck = require('./middleware/tradingCheck');

// Appliquer le middleware de maintenance globalement (sauf pour les routes exemptées)
app.use(maintenanceCheck);

// Ajout de la route d'authentification
const authRoutes = require('./routes/auth');
// Routes d'authentification (inclut les routes de vérification email/SMS)
// Appliquer le contrôle d'inscription seulement sur la route de création de compte
app.use('/api/auth/register', registrationCheck);
app.use('/api/auth', authRoutes);

// Ajout de la route des objets
const objectsRoutePath = path.join(__dirname, 'routes', 'objects.js');

if (fs.existsSync(objectsRoutePath)) {
  const objectRoutes = require('./routes/objects');
  app.use('/api/objects', objectRoutes);
} else {
}

// Ajout de la route des échanges
const tradesRoutePath = path.join(__dirname, 'routes', 'trades.js');

if (fs.existsSync(tradesRoutePath)) {
  const tradeRoutes = require('./routes/trades');
  // Appliquer le contrôle de trading aux routes d'échange
  app.use('/api/trades', tradingCheck, tradeRoutes);
} else {
}

// Ajout de la route des utilisateurs
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// Ajout de la route des catégories
const categoryRoutes = require('./routes/categories');
app.use('/api/categories', categoryRoutes);

// Ajout de la route des statistiques
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// Ajout des routes d'abonnement
const subscriptionRoutes = require('./routes/subscription');
app.use('/api/subscriptions', subscriptionRoutes);

// Ajout des routes de publicité
const advertisementRoutes = require('./routes/advertisements');
app.use('/api/advertisements', advertisementRoutes);

// Ajout des routes de paiements
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// Ajout des routes de livraisons
const deliveryRoutes = require('./routes/delivery');
app.use('/api/delivery', deliveryRoutes);

// Ajout des routes de livraison point relais
const pickupRoutes = require('./routes/pickupRoutes');
app.use('/api/trades/pickup', pickupRoutes);

// Ajout de la route des notifications
const notificationsRoutePath = path.join(__dirname, 'routes', 'notifications.js');

if (fs.existsSync(notificationsRoutePath)) {
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
} else {
}

// Ajout des routes notifications intelligentes
const smartNotificationsRoutePath = path.join(__dirname, 'routes', 'smart-notifications.js');
if (fs.existsSync(smartNotificationsRoutePath)) {
  const smartNotificationRoutes = require('./routes/smart-notifications');
  app.use('/api/notifications', smartNotificationRoutes);
  console.log('✅ [APP] Routes Smart Notifications enregistrées avec succès');
} else {
}

// Ajout de la route des conversations
const conversationsRoutePath = path.join(__dirname, 'routes', 'conversations.js');

if (fs.existsSync(conversationsRoutePath)) {
  const conversationRoutes = require('./routes/conversations');
  app.use('/api/conversations', conversationRoutes);
} else {
}

// 🚀 NOUVELLES FONCTIONNALITÉS AVANCÉES

// Ajout des routes Features (gestion des toggles)
const featuresRoutePath = path.join(__dirname, 'routes', 'features.js');
if (fs.existsSync(featuresRoutePath)) {
  const featuresRoutes = require('./routes/features');
  app.use('/api/features', featuresRoutes);
  console.log('✅ [APP] Routes /api/features enregistrées avec succès');
} else {
}

// Ajout des routes Analytics
const analyticsRoutePath = path.join(__dirname, 'routes', 'analytics.js');
if (fs.existsSync(analyticsRoutePath)) {
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);
} else {
}

// Ajout des routes Eco-Impact
const ecoRoutePath = path.join(__dirname, 'routes', 'eco.js');
if (fs.existsSync(ecoRoutePath)) {
  const ecoRoutes = require('./routes/eco');
  app.use('/api/eco', ecoRoutes);
} else {
}

// Ajout des routes Gamification avec sauvegarde
const gamificationPersistentRoutePath = path.join(__dirname, 'routes', 'gamificationPersistent.js');
if (fs.existsSync(gamificationPersistentRoutePath)) {
  const gamificationPersistentRoutes = require('./routes/gamificationPersistent');
  app.use('/api/gamification', gamificationPersistentRoutes);
  console.log('✅ Gamification routes with persistence registered: /api/gamification');
} else {
}

// Ajout des routes Admin Événements
const adminEventsRoutePath = path.join(__dirname, 'routes', 'admin', 'events.js');
if (fs.existsSync(adminEventsRoutePath)) {
  const adminEventsRoutes = require('./routes/admin/events');
  app.use('/api/admin/events', adminEventsRoutes);
  console.log('✅ Admin Events routes registered: /api/admin/events');
} else {
}

// Ajout des routes Admin Statistiques
const adminStatsRoutePath = path.join(__dirname, 'routes', 'admin', 'stats.js');
if (fs.existsSync(adminStatsRoutePath)) {
  const adminStatsRoutes = require('./routes/admin/stats');
  app.use('/api/admin/stats', adminStatsRoutes);
  console.log('✅ Admin Stats routes registered: /api/admin/stats');
} else {
}

// Ajout des routes Admin Utilisateurs
const adminUsersRoutePath = path.join(__dirname, 'routes', 'admin', 'users.js');
if (fs.existsSync(adminUsersRoutePath)) {
  const adminUsersRoutes = require('./routes/admin/users');
  app.use('/api/admin/users', adminUsersRoutes);
  console.log('✅ Admin Users routes registered: /api/admin/users');
} else {
}

// Ajout des routes Admin Trades
const adminTradesRoutePath = path.join(__dirname, 'routes', 'admin', 'trades.js');
if (fs.existsSync(adminTradesRoutePath)) {
  const adminTradesRoutes = require('./routes/admin/trades');
  app.use('/api/admin/trades', adminTradesRoutes);
  console.log('✅ Admin Trades routes registered: /api/admin/trades');
} else {
  console.log('⚠️ Admin Trades route not found');
}

// Ajout des routes Admin Rôles et Permissions
const adminRolesRoutePath = path.join(__dirname, 'routes', 'admin', 'roles.js');
if (fs.existsSync(adminRolesRoutePath)) {
  const adminRolesRoutes = require('./routes/admin/roles');
  app.use('/api/admin/roles', adminRolesRoutes);
  console.log('✅ Admin Roles routes registered: /api/admin/roles');
} else {
  console.log('⚠️ Admin Roles routes not found');
}

// Ajout des routes Admin Settings
const adminSettingsRoutePath = path.join(__dirname, 'routes', 'admin', 'settings.js');
if (fs.existsSync(adminSettingsRoutePath)) {
  const adminSettingsRoutes = require('./routes/admin/settings');
  app.use('/api/admin/settings', adminSettingsRoutes);
  console.log('✅ Admin Settings routes registered: /api/admin/settings');
} else {
  console.log('❌ Admin Settings routes file not found');
}

// 🔔 Routes Admin Notifications
const adminNotificationsPath = path.join(__dirname, 'routes', 'admin', 'notifications.js');
if (fs.existsSync(adminNotificationsPath)) {
  const adminNotificationsRoutes = require('./routes/admin/notifications');
  app.use('/api/admin/notifications', adminNotificationsRoutes);
  console.log('✅ Admin Notifications routes registered: /api/admin/notifications');
} else {
}

// 📢 Routes de Signalements - Modération Communautaire
const reportsRoutePath = path.join(__dirname, 'routes', 'reports.js');
if (fs.existsSync(reportsRoutePath)) {
  const reportsRoutes = require('./routes/reports');
  app.use('/api/reports', reportsRoutes);
  console.log('✅ Reports routes registered: /api/reports');
} else {
}

// 📊 Ajout des routes Admin Analytics - Statistiques Plateforme
const adminAnalyticsRoutePath = path.join(__dirname, 'routes', 'admin', 'analytics.js');
if (fs.existsSync(adminAnalyticsRoutePath)) {
  const adminAnalyticsRoutes = require('./routes/admin/analytics');
  app.use('/api/admin/analytics', adminAnalyticsRoutes);
  console.log('✅ Admin Analytics routes registered: /api/admin/analytics');
}

// 📦 Ajout des routes Admin Objects - Gestion Objets
const adminObjectsRoutePath = path.join(__dirname, 'routes', 'admin', 'objects.js');
if (fs.existsSync(adminObjectsRoutePath)) {
  const adminObjectsRoutes = require('./routes/admin/objects');
  app.use('/api/admin/objects', adminObjectsRoutes);
  console.log('✅ Admin Objects routes registered: /api/admin/objects');
}

// ⭐ Ajout des routes Admin Reviews - Gestion Avis
const adminReviewsRoutePath = path.join(__dirname, 'routes', 'admin', 'reviews.js');
if (fs.existsSync(adminReviewsRoutePath)) {
  const adminReviewsRoutes = require('./routes/admin/reviews');
  app.use('/api/admin/reviews', adminReviewsRoutes);
  console.log('✅ Admin Reviews routes registered: /api/admin/reviews');
}

// 🌤️ Routes Cloudinary - Gestion des médias
const cloudinaryRoutePath = path.join(__dirname, 'routes', 'cloudinary.js');
if (fs.existsSync(cloudinaryRoutePath)) {
  const cloudinaryRoutes = require('./routes/cloudinary');
  app.use('/api/media', cloudinaryRoutes);
  console.log('✅ Cloudinary routes registered: /api/media');
}

// 🎧 Routes Support - Aide et Support Utilisateur
const supportRoutePath = path.join(__dirname, 'routes', 'support.js');
if (fs.existsSync(supportRoutePath)) {
  const supportRoutes = require('./routes/support');
  app.use('/api/support', supportRoutes);
  console.log('✅ Support routes registered: /api/support');
}

// 🎯 Routes Admin Monitoring - Interface Administration Surveillance
const adminMonitoringRoutePath = path.join(__dirname, 'routes', 'admin', 'monitoring.js');
if (fs.existsSync(adminMonitoringRoutePath)) {
  const adminMonitoringRoutes = require('./routes/admin/monitoring');
  app.use('/api/admin/monitoring', adminMonitoringRoutes);
  console.log('✅ Admin Monitoring routes registered: /api/admin/monitoring');
} else {
  console.log('ℹ️ Admin Monitoring routes file not found, skipping...');
}

// Routes
app.get('/', (req, res) => {
  res.send('Bienvenue sur l API Cadok');
});

// Route health check pour les tests E2E et la surveillance (Temporairement désactivée)
/*
app.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion MongoDB (Solution MedicalGo)
    const { checkDatabaseHealth } = require('./db');
    const dbHealth = await checkDatabaseHealth();
    
    const healthCheck = {
      status: dbHealth.status === 'healthy' ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      database: dbHealth.status,
      databaseDetails: dbHealth.message,
      version: require('./package.json').version,
      environment: process.env.NODE_ENV,
      requestId: req.requestId
    };

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      requestId: req.requestId
    });
  }
});
*/

// Route pour vérifier l'API (Amélioré avec solution MedicalGo)
/*
app.get('/api/health', async (req, res) => {
  try {
    const { getDatabaseStats } = require('./db');
    const dbStats = await getDatabaseStats();
    
    res.status(200).json({
      api: 'operational',
      version: require('./package.json').version,
      timestamp: new Date().toISOString(),
      database: dbStats,
      requestId: req.requestId
    });
  } catch (error) {
    logger.error('API health check failed:', error);
    
    res.status(503).json({
      api: 'degraded',
      version: require('./package.json').version,
      timestamp: new Date().toISOString(),
      error: error.message,
      requestId: req.requestId
    });
  }
});
*/

// 🚨 MIDDLEWARE DE GESTION D'ERREURS (Solution MedicalGo)
app.use(errorLogging);
app.use(globalErrorHandler);

module.exports = app;
