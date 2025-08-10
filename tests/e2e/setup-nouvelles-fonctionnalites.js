/**
 * 🧪 Setup E2E Global - Nouvelles Fonctionnalités
 * Configuration isolée pour éviter les conflits avec les tests existants
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

// Configuration Jest
jest.setTimeout(30000);

let mongoServer;
let mongoClient;
let db;

console.log('🚀 [E2E NOUVELLES FONCTIONNALITÉS] Initialisation...');

// Setup global avant tous les tests
beforeAll(async () => {
  try {
    console.log('🔧 [E2E] Configuration base de données en mémoire...');
    
    // Utiliser MongoDB en mémoire pour les tests
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Port différent pour éviter les conflits
        dbName: 'cadok_e2e_nouvelles_fonctionnalites'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    
    console.log('✅ [E2E] MongoDB en mémoire démarré:', mongoUri);
    
    // Connexion à la base de test
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('cadok_e2e_nouvelles_fonctionnalites');
    
    console.log('✅ [E2E] Connexion base de données établie');
    
    // Pas d'app start ici - chaque test gère son propre serveur
    
  } catch (error) {
    console.error('❌ [E2E] Erreur setup global:', error);
    throw error;
  }
});

// Nettoyage global après tous les tests
afterAll(async () => {
  try {
    console.log('🧹 [E2E] Nettoyage global...');
    
    if (mongoClient) {
      await mongoClient.close();
      console.log('✅ [E2E] Connexion MongoDB fermée');
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✅ [E2E] MongoDB en mémoire arrêté');
    }
    
  } catch (error) {
    console.error('⚠️ [E2E] Erreur nettoyage global:', error);
  }
});

// Nettoyage entre les tests
beforeEach(async () => {
  try {
    if (db) {
      // Nettoyer les collections principales
      const collections = ['users', 'events', 'objects', 'adminlogs', 'userbadges', 'challenges'];
      
      for (const collectionName of collections) {
        try {
          await db.collection(collectionName).deleteMany({});
        } catch (err) {
          // Collection n'existe pas encore, pas grave
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ [E2E] Erreur nettoyage inter-tests:', error);
  }
});

module.exports = {
  mongoServer,
  mongoClient,
  db
};
