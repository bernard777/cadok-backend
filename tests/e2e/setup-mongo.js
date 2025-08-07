const { mongoose, connectToDatabase } = require('../../db');
/**
 * SETUP E2E MODULAR
 * Configuration partagée pour les tests E2E modulaires
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Configuration Jest
jest.setTimeout(15000); // 15 secondes par test

console.log('🔧 Setup E2E chargé');

// Setup MongoDB Memory Server
beforeAll(async () => {
  try {
    console.log('🚀 Démarrage MongoDB Memory Server...');


    // Utiliser l'URI injectée par setup-env-mongo.js
    const mongoUri = process.env.MONGODB_URI;
    console.log('📡 MongoDB URI (mémoire):', mongoUri);

    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: mongoUri.split('/').pop(),
      },
      binary: {
        downloadDir: './mongodb-binaries',
      },
    });


    // Connecter Mongoose via le connecteur différé
    await connectToDatabase(mongoUri);

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
});

// Nettoyage global de la collection users avant chaque test E2E
beforeEach(async () => {
  // Attendre que mongoose.connection.db soit bien défini
  let tries = 0;
  while (!mongoose.connection.db && tries < 10) {
    await new Promise(res => setTimeout(res, 100));
    tries++;
  }
  if (mongoose.connection.db) {
    await mongoose.connection.db.collection('users').deleteMany({});
  }
});
