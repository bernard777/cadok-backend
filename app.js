const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ajout de la route d'authentification
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Ajout de la route des objets
const fs = require('fs');
const path = require('path');
const objectsRoutePath = path.join(__dirname, 'routes', 'objects.js');

if (fs.existsSync(objectsRoutePath)) {
  const objectRoutes = require('./routes/objects');
  app.use('/api/objects', objectRoutes);
} else {
  console.warn("Warning: './routes/objects.js' not found. '/api/objects' route not registered.");
}

// Routes
app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API Cadok');
});

module.exports = app;
