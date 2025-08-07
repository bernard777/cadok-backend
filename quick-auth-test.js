/**
 * 🧪 TEST RAPIDE AUTH - Vérification que le module fonctionne
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function quickAuthTest() {
  console.log('🚀 Test rapide AUTH...');
  
  let app;
  let testDb = `quick_auth_${Date.now()}`;
  let results = [];
  
  try {
    // MongoDB
    const mongoUri = `mongodb://127.0.0.1:27017/${testDb}`;
    console.log('📊 DB:', testDb);
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connecté');
    
    // User Model
    const UserSchema = new mongoose.Schema({
      pseudo: String,
      email: String,
      password: String,
      city: String
    });
    
    const User = mongoose.model('User', UserSchema);
    
    // Express App
    app = express();
    app.use(express.json());
    
    // Routes
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { pseudo, email, password, city } = req.body;
        
        if (!pseudo || !email || !password || !city) {
          return res.status(400).json({ success: false, message: 'Champs requis' });
        }
        
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email existe' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ pseudo, email, password: hashedPassword, city });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, 'test-secret', { expiresIn: '1h' });
        
        res.json({ success: true, token, user: { pseudo, email } });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
    });
    
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ success: false, message: 'User non trouvé' });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.status(400).json({ success: false, message: 'Password incorrect' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'test-secret', { expiresIn: '1h' });
        
        res.json({ success: true, token, user: { pseudo: user.pseudo, email: user.email } });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
    });
    
    console.log('✅ App prête');
    
    // Tests
    console.log('\\n🧪 TEST 1: Inscription');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        pseudo: 'TestAuth',
        email: `auth_${Date.now()}@test.com`,
        password: 'TestPass123!',
        city: 'Paris'
      });
    
    if (registerRes.status === 200 && registerRes.body.success) {
      console.log('✅ Inscription OK');
      results.push({ test: 'Inscription', status: 'OK' });
    } else {
      console.log('❌ Inscription FAIL:', registerRes.status);
      results.push({ test: 'Inscription', status: 'FAIL' });
    }
    
    console.log('\\n🧪 TEST 2: Connexion');
    const email = `login_${Date.now()}@test.com`;
    
    // Créer user
    await request(app)
      .post('/api/auth/register')
      .send({
        pseudo: 'LoginTest',
        email: email,
        password: 'LoginPass123!',
        city: 'Lyon'
      });
    
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: email,
        password: 'LoginPass123!'
      });
    
    if (loginRes.status === 200 && loginRes.body.success) {
      console.log('✅ Connexion OK');
      results.push({ test: 'Connexion', status: 'OK' });
    } else {
      console.log('❌ Connexion FAIL:', loginRes.status);
      results.push({ test: 'Connexion', status: 'FAIL' });
    }
    
    console.log('\\n🧪 TEST 3: Mauvais password');
    const badRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: email,
        password: 'WrongPassword123!'
      });
    
    if (badRes.status === 400) {
      console.log('✅ Rejet OK');
      results.push({ test: 'Rejet password', status: 'OK' });
    } else {
      console.log('❌ Rejet FAIL:', badRes.status);
      results.push({ test: 'Rejet password', status: 'FAIL' });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    results.push({ test: 'Général', status: 'ERROR', error: error.message });
  } finally {
    // Cleanup
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
      console.log('🧹 Nettoyage OK');
    }
  }
  
  // Résultats
  console.log('\\n=== RÉSULTATS AUTH MODULE ===');
  const ok = results.filter(r => r.status === 'OK').length;
  const total = results.length;
  console.log(`Tests réussis: ${ok}/${total}`);
  
  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${r.test}: ${r.status}`);
  });
  
  if (ok === total) {
    console.log('\\n🏆 MODULE AUTH FONCTIONNE !');
  } else {
    console.log('\\n⚠️ Module AUTH a des problèmes');
  }
}

quickAuthTest().catch(console.error);
