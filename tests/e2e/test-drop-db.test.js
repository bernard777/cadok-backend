/**
 * TEST AVEC SUPPRESSION TOTALE DE LA BASE
 * Pour éliminer tous les index et données persistantes
 */

// Setup environnement
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/cadok_test_drop_db';
process.env.JWT_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_51RrsfBAWWo4iq1n7nGd4qLi21YwqklOipVkL4s13nJ3cIWkIbFwXRKKvs4DlZcyVadP4ke57CVr1EWoE4okLHM9O00WbIz9PW7';

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');

describe('🗑️ TEST AVEC DROP DATABASE', () => {
  let app;

  beforeAll(async () => {
    console.log('🗑️ === SETUP AVEC DROP DB ===');
    
    // Créer app Express
    app = express();
    app.use(express.json());
    
    // Connexion MongoDB
    const testUri = process.env.MONGODB_URI;
    console.log('📡 Connexion à:', testUri);
    await mongoose.connect(testUri);
    
    // Attendre que la connexion soit prête
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // SUPPRESSION TOTALE de la base
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log('💥 Base supprimée complètement');
    } else {
      console.log('⚠️ DB non disponible pour drop');
    }
    
    // Charger route auth
    const authRoutes = require('../../routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('🛣️ Route auth chargée');
  });

  beforeEach(async () => {
    // Double sécurité: drop + deleteMany
    try {
      await mongoose.connection.db.dropDatabase();
      console.log('💥 Base droppée avant test');
    } catch (error) {
      console.log('⚠️ Drop échoué (normal si DB vide):', error.message);
    }
    
    await User.deleteMany({});
    const count = await User.countDocuments();
    console.log('🧹 Utilisateurs:', count);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  test('🗑️ INSCRIPTION AVEC DB VIDE GARANTIE', async () => {
    const userData = {
      email: `drop_test_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      pseudo: `DropUser_${Date.now()}`,
      city: 'Paris'
    };

    console.log('🚀 Test avec DB garantie vide:', userData.email);

    // Triple vérification que la base est vide
    const beforeCount = await User.countDocuments();
    console.log('📊 Total users avant:', beforeCount);

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    console.log('📈 Status:', response.status);
    
    if (response.status !== 201) {
      console.error('💥 ERREUR malgré DB vide:');
      console.error('   Body:', JSON.stringify(response.body, null, 2));
      
      // Diagnostic post-échec
      const afterCount = await User.countDocuments();
      console.log('📊 Users après échec:', afterCount);
      
      // Lister toutes les collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📚 Collections existantes:');
      collections.forEach(col => console.log('   -', col.name));
    }

    // Avec une base complètement vide, ça DOIT marcher
    expect(response.status).toBe(201);
  });
});
