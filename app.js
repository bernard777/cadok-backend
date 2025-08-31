const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// �️ IMPORTATION MIDDLEWARE DE SÉCURITÉ
const SecurityMiddleware = require('./middleware/security');

// �🔧 CONFIGURATION INTELLIGENTE D'ENVIRONNEMENT
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

const app = express();

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
app.use(SecurityMiddleware.setupHelmet());

// Rate limiting global
app.use(SecurityMiddleware.createGlobalRateLimit());

// Sanitisation des entrées (appliqué AVANT les autres middlewares)
app.use(SecurityMiddleware.sanitizeInput());

// Détection d'injections SQL
app.use(SecurityMiddleware.detectSQLInjection());

console.log('✅ [APP] Middlewares de sécurité configurés');

// Middleware standards (APRÈS la sécurité)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 📄 SERVIR LES FICHIERS STATIQUES (images, uploads, etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));
console.log('✅ [APP] Fichiers statiques configurés (/uploads, /public)');

// Ajout de la route d'authentification
const authRoutes = require('./routes/auth');
// Routes d'authentification (inclut les routes de vérification email/SMS)
app.use('/api/auth', authRoutes);

// Ajout de la route des objets
const objectsRoutePath = path.join(__dirname, 'routes', 'objects.js');

if (fs.existsSync(objectsRoutePath)) {
  const objectRoutes = require('./routes/objects');
  app.use('/api/objects', objectRoutes);
} else {
  console.warn("Warning: './routes/objects.js' not found. '/api/objects' route not registered.");
}

// Ajout de la route des échanges
const tradesRoutePath = path.join(__dirname, 'routes', 'trades.js');

if (fs.existsSync(tradesRoutePath)) {
  const tradeRoutes = require('./routes/trades');
  app.use('/api/trades', tradeRoutes);
} else {
  console.warn("Warning: './routes/trades.js' not found. '/api/trades' route not registered.");
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
  console.warn("Warning: './routes/notifications.js' not found. '/api/notifications' route not registered.");
}

// Ajout des routes notifications intelligentes
const smartNotificationsRoutePath = path.join(__dirname, 'routes', 'smart-notifications.js');
if (fs.existsSync(smartNotificationsRoutePath)) {
  const smartNotificationRoutes = require('./routes/smart-notifications');
  app.use('/api/notifications', smartNotificationRoutes);
  console.log('✅ [APP] Routes Smart Notifications enregistrées avec succès');
} else {
  console.warn("Warning: './routes/smart-notifications.js' not found. Smart notifications route not registered.");
}

// Ajout de la route des conversations
const conversationsRoutePath = path.join(__dirname, 'routes', 'conversations.js');

if (fs.existsSync(conversationsRoutePath)) {
  const conversationRoutes = require('./routes/conversations');
  app.use('/api/conversations', conversationRoutes);
} else {
  console.warn("Warning: './routes/conversations.js' not found. '/api/conversations' route not registered.");
}

// 🚀 NOUVELLES FONCTIONNALITÉS AVANCÉES

// Ajout des routes Features (gestion des toggles)
const featuresRoutePath = path.join(__dirname, 'routes', 'features.js');
if (fs.existsSync(featuresRoutePath)) {
  const featuresRoutes = require('./routes/features');
  app.use('/api/features', featuresRoutes);
  console.log('✅ [APP] Routes /api/features enregistrées avec succès');
} else {
  console.warn("Warning: './routes/features.js' not found. '/api/features' route not registered.");
}

// Ajout des routes Analytics
const analyticsRoutePath = path.join(__dirname, 'routes', 'analytics.js');
if (fs.existsSync(analyticsRoutePath)) {
  const analyticsRoutes = require('./routes/analytics');
  app.use('/api/analytics', analyticsRoutes);
} else {
  console.warn("Warning: './routes/analytics.js' not found. '/api/analytics' route not registered.");
}

// Ajout des routes Eco-Impact
const ecoRoutePath = path.join(__dirname, 'routes', 'eco.js');
if (fs.existsSync(ecoRoutePath)) {
  const ecoRoutes = require('./routes/eco');
  app.use('/api/eco', ecoRoutes);
} else {
  console.warn("Warning: './routes/eco.js' not found. '/api/eco' route not registered.");
}

// Ajout des routes Gamification avec sauvegarde
const gamificationPersistentRoutePath = path.join(__dirname, 'routes', 'gamificationPersistent.js');
if (fs.existsSync(gamificationPersistentRoutePath)) {
  const gamificationPersistentRoutes = require('./routes/gamificationPersistent');
  app.use('/api/gamification', gamificationPersistentRoutes);
  console.log('✅ Gamification routes with persistence registered: /api/gamification');
} else {
  console.warn("Warning: './routes/gamificationPersistent.js' not found. '/api/gamification' route not registered.");
}

// Ajout des routes Admin Événements
const adminEventsRoutePath = path.join(__dirname, 'routes', 'admin', 'events.js');
if (fs.existsSync(adminEventsRoutePath)) {
  const adminEventsRoutes = require('./routes/admin/events');
  app.use('/api/admin/events', adminEventsRoutes);
  console.log('✅ Admin Events routes registered: /api/admin/events');
} else {
  console.warn("Warning: './routes/admin/events.js' not found. '/api/admin/events' route not registered.");
}

// Ajout des routes Admin Statistiques
const adminStatsRoutePath = path.join(__dirname, 'routes', 'admin', 'stats.js');
if (fs.existsSync(adminStatsRoutePath)) {
  const adminStatsRoutes = require('./routes/admin/stats');
  app.use('/api/admin/stats', adminStatsRoutes);
  console.log('✅ Admin Stats routes registered: /api/admin/stats');
} else {
  console.warn("Warning: './routes/admin/stats.js' not found. '/api/admin/stats' route not registered.");
}

// Ajout des routes Admin Utilisateurs
const adminUsersRoutePath = path.join(__dirname, 'routes', 'admin', 'users.js');
if (fs.existsSync(adminUsersRoutePath)) {
  const adminUsersRoutes = require('./routes/admin/users');
  app.use('/api/admin/users', adminUsersRoutes);
  console.log('✅ Admin Users routes registered: /api/admin/users');
} else {
  console.warn("Warning: './routes/admin/users.js' not found. '/api/admin/users' route not registered.");
}

// Ajout des routes Admin Trades
const adminTradesRoutePath = path.join(__dirname, 'routes', 'admin', 'trades.js');
if (fs.existsSync(adminTradesRoutePath)) {
  const adminTradesRoutes = require('./routes/admin/trades');
  app.use('/api/admin/trades', adminTradesRoutes);
  console.log('✅ Admin Trades routes registered: /api/admin/trades');
} else {
  console.warn("Warning: './routes/admin/trades.js' not found. '/api/admin/trades' route not registered.");
}

// Ajout des routes Admin Rôles et Permissions
const adminRolesRoutePath = path.join(__dirname, 'routes', 'admin', 'roles.js');
if (fs.existsSync(adminRolesRoutePath)) {
  const adminRolesRoutes = require('./routes/admin/roles');
  app.use('/api/admin', adminRolesRoutes);
  console.log('✅ Admin Roles routes registered: /api/admin/roles');
} else {
  console.warn("Warning: './routes/admin/roles.js' not found. '/api/admin/roles' route not registered.");
}

// 🔔 Routes Admin Notifications
const adminNotificationsPath = path.join(__dirname, 'routes', 'admin', 'notifications.js');
if (fs.existsSync(adminNotificationsPath)) {
  const adminNotificationsRoutes = require('./routes/admin/notifications');
  app.use('/api/admin/notifications', adminNotificationsRoutes);
  console.log('✅ Admin Notifications routes registered: /api/admin/notifications');
} else {
  console.warn("Warning: './routes/admin/notifications.js' not found. '/api/admin/notifications' route not registered.");
}

// 📢 Routes de Signalements - Modération Communautaire
const reportsRoutePath = path.join(__dirname, 'routes', 'reports.js');
if (fs.existsSync(reportsRoutePath)) {
  const reportsRoutes = require('./routes/reports');
  app.use('/api/reports', reportsRoutes);
  console.log('✅ Reports routes registered: /api/reports');
} else {
  console.warn("Warning: './routes/reports.js' not found. '/api/reports' route not registered.");
}

// ⭐ Routes Reviews - Système d'évaluation
const reviewsRoutePath = path.join(__dirname, 'routes', 'reviews.js');
if (fs.existsSync(reviewsRoutePath)) {
  const reviewsRoutes = require('./routes/reviews');
  app.use('/api/reviews', reviewsRoutes);
  console.log('✅ Reviews routes registered: /api/reviews');
} else {
  console.warn("Warning: './routes/reviews.js' not found. '/api/reviews' route not registered.");
}

// 🎪 Routes Events - Événements utilisateurs
const eventsRoutePath = path.join(__dirname, 'routes', 'events.js');
if (fs.existsSync(eventsRoutePath)) {
  const eventsRoutes = require('./routes/events');
  app.use('/api/events', eventsRoutes);
  console.log('✅ Events routes registered: /api/events');
} else {
  console.warn("Warning: './routes/events.js' not found. '/api/events' route not registered.");
}

// 🎯 Routes Tasks - Tâches quotidiennes d'événements
const tasksRoutePath = path.join(__dirname, 'routes', 'tasks.js');
if (fs.existsSync(tasksRoutePath)) {
  const tasksRoutes = require('./routes/tasks');
  app.use('/api/tasks', tasksRoutes);
  console.log('✅ Tasks routes registered: /api/tasks');
} else {
  console.warn("Warning: './routes/tasks.js' not found. '/api/tasks' route not registered.");
}

// 📊 Ajout des routes Admin Analytics - Statistiques Plateforme
const adminAnalyticsRoutePath = path.join(__dirname, 'routes', 'admin', 'analytics.js');
if (fs.existsSync(adminAnalyticsRoutePath)) {
  const adminAnalyticsRoutes = require('./routes/admin/analytics');
  app.use('/api/admin/analytics', adminAnalyticsRoutes);
  console.log('✅ Admin Analytics routes registered: /api/admin/analytics');
} else {
  console.warn("Warning: './routes/admin/analytics.js' not found. '/api/admin/analytics' route not registered.");
}

// 📦 Ajout des routes Admin Objects - Gestion des objets
const adminObjectsRoutePath = path.join(__dirname, 'routes', 'admin', 'objects.js');
if (fs.existsSync(adminObjectsRoutePath)) {
  const adminObjectsRoutes = require('./routes/admin/objects');
  app.use('/api/admin/objects', adminObjectsRoutes);
  console.log('✅ Admin Objects routes registered: /api/admin/objects');
} else {
  console.warn("Warning: './routes/admin/objects.js' not found. '/api/admin/objects' route not registered.");
}

// ⭐ Ajout des routes Admin Reviews - Gestion des avis
const adminReviewsRoutePath = path.join(__dirname, 'routes', 'admin', 'reviews.js');
if (fs.existsSync(adminReviewsRoutePath)) {
  const adminReviewsRoutes = require('./routes/admin/reviews');
  app.use('/api/admin/reviews', adminReviewsRoutes);
  console.log('✅ Admin Reviews routes registered: /api/admin/reviews');
} else {
  console.warn("Warning: './routes/admin/reviews.js' not found. '/api/admin/reviews' route not registered.");
}

// 🌤️ Routes Cloudinary - Gestion des médias
const cloudinaryRoutePath = path.join(__dirname, 'routes', 'cloudinary.js');
if (fs.existsSync(cloudinaryRoutePath)) {
  const cloudinaryRoutes = require('./routes/cloudinary');
  app.use('/api/media', cloudinaryRoutes);
  console.log('✅ Cloudinary routes registered: /api/media');
} else {
  console.warn("Warning: './routes/cloudinary.js' not found. '/api/media' route not registered.");
}

// 🎧 Routes Support - Aide et Support Utilisateur
const supportRoutePath = path.join(__dirname, 'routes', 'support.js');
if (fs.existsSync(supportRoutePath)) {
  const supportRoutes = require('./routes/support');
  app.use('/api/support', supportRoutes);
  console.log('✅ Support routes registered: /api/support');
} else {
  console.warn("Warning: './routes/support.js' not found. '/api/support' route not registered.");
}

// Routes
app.get('/', (req, res) => {
  res.send('Bienvenue sur l API Cadok');
});

// Route health check pour les tests E2E et la surveillance
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: process.env.PORT || 5000,
    database: 'connected'
  });
});

// Route pour vérifier l'API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    api: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
