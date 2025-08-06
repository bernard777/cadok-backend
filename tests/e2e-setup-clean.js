/**
 * Setup global pour les tests E2E
 * Configuration MongoDB Memory Server + App réel
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup global avant tous les tests E2E
beforeAll(async () => {
  console.log('🚀 Démarrage environnement E2E...');
  
  try {
    // Fermer toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Créer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '4.4.6'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    console.log('📦 MongoDB Memory Server démarré:', mongoUri);

    // Connecter Mongoose
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connecté pour tests E2E');

  } catch (error) {
    console.error('❌ Erreur setup E2E:', error);
    throw error;
  }
}, 60000);

// Nettoyage après tous les tests E2E
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

// Configuration globale pour tous les tests E2E
beforeEach(async () => {
  // Nettoyer la base avant chaque test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

module.exports = {
  mongoServer,
  mongoose
};
