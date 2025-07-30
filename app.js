const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ajout de la route d'authentification
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Ajout de la route des objets
const fs = require('fs');
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
  app.use('/api', conversationRoutes);
} else {
  console.warn("Warning: './routes/conversations.js' not found. '/api/conversations' route not registered.");
}

// Routes
app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API Cadok');
});

module.exports = app;
