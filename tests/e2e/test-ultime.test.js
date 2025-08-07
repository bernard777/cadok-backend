/**
 * TEST ULTIME - ISOLATION TOTALE
 * Ne charge QUE les modules essentiels pour éviter toute connexion parasite
 */

// Setup environnement AVANT tout import
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/cadok_test_ultime';
process.env.JWT_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER';

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import du modèle SEULEMENT
const User = require('../../models/User');

describe('🔥 TEST ULTIME - ISOLATION', () => {
  let app;

  beforeAll(async () => {
    console.log('🔥 === SETUP ULTIME ===');
    
    // 1. Créer app Express manuelle
    app = express();
    app.use(express.json());
    
    // 2. Connexion MongoDB directe
    const testUri = process.env.MONGODB_URI;
    console.log('📡 Connexion à:', testUri);
    
    await mongoose.connect(testUri);
    console.log('✅ Connecté - readyState:', mongoose.connection.readyState);
    
    // 3. Charger SEULEMENT la route auth
    const authRoutes = require('../../routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('🛣️ Route auth chargée');
  });

  beforeEach(async () => {
    // Nettoyer la base
    await User.deleteMany({});
    const count = await User.countDocuments();
    console.log('🧹 Base nettoyée - utilisateurs:', count);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  test('🔥 INSCRIPTION ULTIME', async () => {
    const userData = {
      email: `ultime_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      pseudo: `UltimeUser_${Date.now()}`,
      city: 'Paris'
    };

    console.log('🚀 Test inscription ultime:', userData.email);

    // Vérifier que l'email n'existe pas AVANT
    const beforeCount = await User.countDocuments({ email: userData.email });
    console.log('📊 Email existe avant:', beforeCount > 0);

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    console.log('📈 Status reçu:', response.status);
    if (response.status !== 201) {
      console.error('💥 BODY ERREUR:', JSON.stringify(response.body, null, 2));
      
      // Vérifier l'état de la base après échec
      const afterCount = await User.countDocuments();
      console.log('📊 Total users après échec:', afterCount);
      
      // Vérifier si cet email spécifique existe
      const specificUser = await User.findOne({ email: userData.email });
      console.log('🔍 User spécifique trouvé:', !!specificUser);
    } else {
      console.log('🎉 SUCCÈS !');
    }

    // Ce test DOIT marcher avec cette isolation totale
    expect(response.status).toBe(201);
  });
});
