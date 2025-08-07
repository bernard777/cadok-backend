/**
 * 🎯 TESTS AUTH - VERSION NODE.JS SIMPLE
 * Tests rapides sans Jest
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('🚀 Démarrage tests Node.js simples...');
  
  let app;
  let testDb;
  let testResults = [];
  
  try {
    // Base unique
    testDb = `node_test_${Date.now()}`;
    const mongoUri = `mongodb://127.0.0.1:27017/${testDb}`;
    
    console.log('📊 MongoDB:', testDb);
    
    // Connexion
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté');
    
    // Modèle
    const UserSchema = new mongoose.Schema({
      pseudo: String,
      email: String,
      password: String,
      city: String
    });
    
    const User = mongoose.model('User', UserSchema);
    
    // App
    app = express();
    app.use(express.json());
    
    app.post('/register', async (req, res) => {
      try {
        const { pseudo, email, password, city } = req.body;
        
        if (!pseudo || !email || !password || !city) {
          return res.status(400).json({ error: 'Champs requis' });
        }
        
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ error: 'Email existe' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ pseudo, email, password: hashedPassword, city });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1h' });
        
        res.json({ success: true, token, user: { pseudo: user.pseudo } });
      } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });
    
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({ error: 'User non trouvé' });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.status(400).json({ error: 'Password incorrect' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1h' });
        
        res.json({ success: true, token, user: { pseudo: user.pseudo } });
      } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
      }
    });
    
    console.log('✅ App prête, démarrage tests...');
    
    // TEST 1: Inscription
    console.log('\\n🧪 Test 1: Inscription');
    try {
      const res1 = await request(app)
        .post('/register')
        .send({
          pseudo: 'Test1',
          email: 'test1@test.com',
          password: 'password123',
          city: 'Paris'
        });
      
      if (res1.status === 200 && res1.body.success) {
        console.log('✅ Test 1 RÉUSSI');
        testResults.push({ test: 'Inscription', status: 'RÉUSSI' });
      } else {
        console.log('❌ Test 1 ÉCHOUÉ:', res1.status);
        testResults.push({ test: 'Inscription', status: 'ÉCHOUÉ', error: res1.status });
      }
    } catch (error) {
      console.log('❌ Test 1 ERREUR:', error.message);
      testResults.push({ test: 'Inscription', status: 'ERREUR', error: error.message });
    }
    
    // TEST 2: Connexion
    console.log('\\n🧪 Test 2: Connexion');
    try {
      // D'abord créer un user
      await request(app)
        .post('/register')
        .send({
          pseudo: 'Test2',
          email: 'test2@test.com',
          password: 'password123',
          city: 'Lyon'
        });
      
      // Puis se connecter
      const res2 = await request(app)
        .post('/login')
        .send({
          email: 'test2@test.com',
          password: 'password123'
        });
      
      if (res2.status === 200 && res2.body.success) {
        console.log('✅ Test 2 RÉUSSI');
        testResults.push({ test: 'Connexion', status: 'RÉUSSI' });
      } else {
        console.log('❌ Test 2 ÉCHOUÉ:', res2.status);
        testResults.push({ test: 'Connexion', status: 'ÉCHOUÉ', error: res2.status });
      }
    } catch (error) {
      console.log('❌ Test 2 ERREUR:', error.message);
      testResults.push({ test: 'Connexion', status: 'ERREUR', error: error.message });
    }
    
    // TEST 3: Mauvais password
    console.log('\\n🧪 Test 3: Mauvais password');
    try {
      // Créer user
      await request(app)
        .post('/register')
        .send({
          pseudo: 'Test3',
          email: 'test3@test.com',
          password: 'correct123',
          city: 'Nice'
        });
      
      // Mauvais password
      const res3 = await request(app)
        .post('/login')
        .send({
          email: 'test3@test.com',
          password: 'incorrect123'
        });
      
      if (res3.status === 400) {
        console.log('✅ Test 3 RÉUSSI (rejet attendu)');
        testResults.push({ test: 'Mauvais password', status: 'RÉUSSI' });
      } else {
        console.log('❌ Test 3 ÉCHOUÉ:', res3.status);
        testResults.push({ test: 'Mauvais password', status: 'ÉCHOUÉ', error: res3.status });
      }
    } catch (error) {
      console.log('❌ Test 3 ERREUR:', error.message);
      testResults.push({ test: 'Mauvais password', status: 'ERREUR', error: error.message });
    }
    
    // TEST 4: Email dupliqué
    console.log('\\n🧪 Test 4: Email dupliqué');
    try {
      // Premier user
      await request(app)
        .post('/register')
        .send({
          pseudo: 'User1',
          email: 'duplicate@test.com',
          password: 'pass123',
          city: 'Paris'
        });
      
      // Deuxième user même email
      const res4 = await request(app)
        .post('/register')
        .send({
          pseudo: 'User2',
          email: 'duplicate@test.com',
          password: 'pass456',
          city: 'Lyon'
        });
      
      if (res4.status === 400) {
        console.log('✅ Test 4 RÉUSSI (rejet attendu)');
        testResults.push({ test: 'Email dupliqué', status: 'RÉUSSI' });
      } else {
        console.log('❌ Test 4 ÉCHOUÉ:', res4.status);
        testResults.push({ test: 'Email dupliqué', status: 'ÉCHOUÉ', error: res4.status });
      }
    } catch (error) {
      console.log('❌ Test 4 ERREUR:', error.message);
      testResults.push({ test: 'Email dupliqué', status: 'ERREUR', error: error.message });
    }
    
    // TEST 5: Champs manquants
    console.log('\\n🧪 Test 5: Champs manquants');
    try {
      const res5 = await request(app)
        .post('/register')
        .send({
          pseudo: 'Incomplet',
          email: 'incomplete@test.com'
          // password et city manquants
        });
      
      if (res5.status === 400) {
        console.log('✅ Test 5 RÉUSSI (rejet attendu)');
        testResults.push({ test: 'Champs manquants', status: 'RÉUSSI' });
      } else {
        console.log('❌ Test 5 ÉCHOUÉ:', res5.status);
        testResults.push({ test: 'Champs manquants', status: 'ÉCHOUÉ', error: res5.status });
      }
    } catch (error) {
      console.log('❌ Test 5 ERREUR:', error.message);
      testResults.push({ test: 'Champs manquants', status: 'ERREUR', error: error.message });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    // Nettoyage
    console.log('\\n🧹 Nettoyage...');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      console.log('🗑️ DB supprimée');
      await mongoose.disconnect();
      console.log('✅ Déconnecté');
    }
  }
  
  // Résumé
  console.log('\\n=== RÉSUMÉ TESTS NODE.JS ===');
  const reussis = testResults.filter(t => t.status === 'RÉUSSI').length;
  const total = testResults.length;
  
  console.log(`Tests réussis: ${reussis}/${total}`);
  console.log(`Taux de réussite: ${Math.round((reussis/total) * 100)}%`);
  
  testResults.forEach(result => {
    const icon = result.status === 'RÉUSSI' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.error) console.log(`   Erreur: ${result.error}`);
  });
  
  console.log('\\n🏁 Tests terminés');
}

// Exécuter
runTests().catch(console.error);
