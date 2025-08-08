const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

const app = express();

// 🔗 CONNEXION MONGODB (pour les tests E2E avec supertest)
const { connectToDatabase } = require('./db');

// Établir la connexion MongoDB au démarrage de l'application
connectToDatabase().catch(error => {
  console.error('❌ [APP] Erreur connexion MongoDB:', error.message);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ajout de la route d'authentification
const authRoutes = require('./routes/auth');
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

// Ajout de la route des conversations
const conversationsRoutePath = path.join(__dirname, 'routes', 'conversations.js');

if (fs.existsSync(conversationsRoutePath)) {
  const conversationRoutes = require('./routes/conversations');
  app.use('/api/conversations', conversationRoutes);
} else {
  console.warn("Warning: './routes/conversations.js' not found. '/api/conversations' route not registered.");
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
