/**
 * 🎯 APP-TEST-ULTRA-SIMPLE.JS
 * Version ultra-simple qui FONCTIONNE
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createWorkingTestApp() {
  console.log('[ULTRA-SIMPLE] 🚀 Création app test...');
  
  const app = express();
  
  // Middlewares
  app.use(cors());
  app.use(express.json());
  
  // Config MongoDB
  const mongoUri = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/cadok_ultra_test_${Date.now()}`;
  console.log('[ULTRA-SIMPLE] 🔗 MongoDB:', mongoUri);
  
  // Déconnexion propre
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);
  console.log('[ULTRA-SIMPLE] ✅ MongoDB connecté');
  
  // Schéma User simple
  const UserSchema = new mongoose.Schema({
    pseudo: String,
    email: String,
    password: String,
    city: String,
    isActive: { type: Boolean, default: true }
  });
  
  // Vérifier si models existe avant de l'utiliser
  let User;
  if (mongoose.models && mongoose.models.User) {
    User = mongoose.models.User;
  } else {
    User = mongoose.model('User', UserSchema);
  }
  console.log('[ULTRA-SIMPLE] ✅ Modèle User chargé');
  
  // ========================================
  // ROUTES DIRECTES
  // ========================================
  
  // Route inscription
  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log('[ULTRA-SIMPLE] 📤 Register:', req.body.email);
      
      const { pseudo, email, password, city } = req.body;
      
      if (!pseudo || !email || !password || !city) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs requis'
        });
      }
      
      // Vérifier email unique
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email déjà utilisé'
        });
      }
      
      // Créer user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        pseudo,
        email,
        password: hashedPassword,
        city,
        isActive: true
      });
      
      await user.save();
      console.log('[ULTRA-SIMPLE] ✅ User créé:', user.email);
      
      // Token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'ultra-simple-secret',
        { expiresIn: '7d' }
      );
      
      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: user._id,
          pseudo: user.pseudo,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('[ULTRA-SIMPLE] ❌ Erreur register:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  });
  
  // Route connexion
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('[ULTRA-SIMPLE] 📤 Login:', req.body.email);
      
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et password requis'
        });
      }
      
      // Trouver user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }
      
      // Vérifier password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }
      
      // Token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'ultra-simple-secret',
        { expiresIn: '7d' }
      );
      
      console.log('[ULTRA-SIMPLE] ✅ Login réussi:', user.email);
      
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          id: user._id,
          pseudo: user.pseudo,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('[ULTRA-SIMPLE] ❌ Erreur login:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  });
  
  // Route health
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK',
      mode: 'ULTRA-SIMPLE-TEST',
      database: mongoose.connection.name,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('[ULTRA-SIMPLE] ✅ Routes configurées');
  console.log('[ULTRA-SIMPLE] 🎯 App prête !');
  
  return app;
}

async function cleanupUltraSimple() {
  console.log('[ULTRA-SIMPLE] 🧹 Nettoyage...');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[ULTRA-SIMPLE] ✅ MongoDB déconnecté');
  }
}

module.exports = {
  createWorkingTestApp,
  cleanupUltraSimple
};
