/**
 * SETUP E2E MODULAR
 * Configuration partagée pour les tests E2E modulaires
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Configuration Jest
jest.setTimeout(15000); // 15 secondes par test

console.log('🔧 Setup E2E chargé');

// Setup MongoDB Memory Server
beforeAll(async () => {
  try {
    console.log('🚀 Démarrage MongoDB Memory Server...');
    
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: 'latest',
        downloadDir: './mongodb-binaries',
      },
    });
    
    const mongoUri = mongoServer.getUri();
    console.log('📡 MongoDB URI:', mongoUri);
    
    // Forcer la déconnexion si déjà connecté
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connecter Mongoose
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Memory Server démarré');
  } catch (error) {
    console.error('❌ Erreur setup MongoDB:', error);
    throw error;
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    console.log('🧹 Nettoyage MongoDB...');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ MongoDB Memory Server arrêté');
  } catch (error) {
    console.warn('⚠️ Erreur nettoyage:', error);
  }
});MODULAR
 * Configuration partagée pour les tests E2E modulaires
 */

// Configuration Jest simple pour commencer
jest.setTimeout(10000); // 10 secondes par test

console.log('� Setup E2E chargé');

// Setup minimal pour débuter
beforeAll(async () => {
  console.log('🚀 Setup beforeAll lancé');
});

afterAll(async () => {
  console.log('🧹 Setup afterAll lancé');
});
