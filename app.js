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

// Routes
app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API Cadok');
});

module.exports = app;
