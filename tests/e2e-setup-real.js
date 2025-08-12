/**
 * Setup E2E RÉEL avec MongoDB Memory Server et services complets
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let mongoServer;
let testDatabase;

// Variables globales pour les tests E2E
global.testUser = null;
global.testToken = null;
global.testObjects = [];
global.testTrades = [];

beforeAll(async () => {
  console.log('🚀 Démarrage environnement E2E RÉEL...');
  
  try {
    // Fermer toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Créer MongoDB Memory Server avec version stable
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '5.0.0'
      },
      instance: {
        dbName: 'cadok_e2e_test'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    console.log('📦 MongoDB Memory Server actif:', mongoUri);

    // Connecter Mongoose avec options optimisées
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      bufferMaxEntries: 0
    });

    // Vérifier la connexion
    testDatabase = mongoose.connection.db;
    if (testDatabase) {
      console.log('✅ MongoDB connecté, DB:', testDatabase.databaseName || 'cadok_e2e_test');
    } else {
      console.log('✅ MongoDB connecté (DB name non accessible)');
    }

    // Créer les index nécessaires pour les tests
    await createTestIndexes();
    
    console.log('🎯 Environnement E2E prêt pour vrais tests!');

  } catch (error) {
    console.error('❌ Erreur setup E2E:', error);
    throw error;
  }
}, 120000);

afterAll(async () => {
  console.log('🧹 Nettoyage environnement E2E...');
  
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Environnement E2E nettoyé');
  } catch (error) {
    console.error('❌ Erreur nettoyage E2E:', error);
  }
});

beforeEach(async () => {
  // Nettoyer toutes les collections avant chaque test
  if (testDatabase) {
    const collections = await testDatabase.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
  
  // Reset des variables globales
  global.testUser = null;
  global.testToken = null;
  global.testObjects = [];
  global.testTrades = [];
});

// Fonctions utilitaires pour les tests E2E
async function createTestIndexes() {
  // Index pour les utilisateurs
  await testDatabase.collection('users').createIndex({ email: 1 }, { unique: true });
  await testDatabase.collection('users').createIndex({ pseudo: 1 }, { unique: true });
  
  // Index pour les objets
  await testDatabase.collection('objects').createIndex({ title: 1 });
  await testDatabase.collection('objects').createIndex({ category: 1 });
  await testDatabase.collection('objects').createIndex({ owner: 1 });
  
  // Index pour les trocs
  await testDatabase.collection('trades').createIndex({ requester: 1 });
  await testDatabase.collection('trades').createIndex({ receiver: 1 });
  await testDatabase.collection('trades').createIndex({ status: 1 });
}

// Fonction pour créer un utilisateur de test
global.createTestUser = async (userData = {}) => {
  const User = require('../../models/User');
  
  const defaultUser = {
    pseudo: 'TestUser' + Date.now(),
    email: `test${Date.now()}@cadok.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    city: 'Paris',
    zipCode: '75001',
    ...userData
  };
  
  const user = new User(defaultUser);
  await user.save();
  
  // Générer un token JWT réel
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '24h' }
  );
  
  global.testUser = user;
  global.testToken = token;
  
  console.log('👤 Utilisateur test créé:', user.email);
  return { user, token };
};

// Fonction pour créer un objet de test
global.createTestObject = async (objectData = {}, ownerUser = null) => {
  const Object = require('../../models/Object');
  
  const owner = ownerUser || global.testUser;
  if (!owner) {
    throw new Error('Aucun utilisateur propriétaire fourni');
  }
  
  const defaultObject = {
    title: 'Objet Test ' + Date.now(),
    description: 'Description test pour E2E',
    category: 'Électronique',
    condition: 'Bon état',
    owner: owner._id,
    images: ['/uploads/test-image.jpg'],
    available: true,
    ...objectData
  };
  
  const object = new Object(defaultObject);
  await object.save();
  
  global.testObjects.push(object);
  console.log('📦 Objet test créé:', object.title);
  return object;
};

// Fonction pour créer un troc de test
global.createTestTrade = async (tradeData = {}) => {
  const Trade = require('../../models/Trade');
  
  const defaultTrade = {
    requester: global.testUser._id,
    requestedObject: global.testObjects[0]?._id,
    offeredObjects: global.testObjects.slice(1, 2).map(obj => obj._id),
    status: 'pending',
    message: 'Message de test pour le troc',
    ...tradeData
  };
  
  const trade = new Trade(defaultTrade);
  await trade.save();
  
  global.testTrades.push(trade);
  console.log('🔄 Troc test créé:', trade._id);
  return trade;
};

module.exports = {
  mongoServer,
  testDatabase
};
