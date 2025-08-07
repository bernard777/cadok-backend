/**
 * SETUP E2E ROBUSTE
 * Solution hybride pour tests de base de données
 */

const { mongoose, connectToDatabase } = require('../../db');

// Configuration Jest
jest.setTimeout(15000);

let dbConnectionEstablished = false;
let testDbName = '';

console.log('🔧 Setup E2E robuste chargé');

// Générer un nom de DB unique pour ce run de test
function generateTestDbName() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `cadok_test_${timestamp}_${random}`;
}

// Setup base de données avant tous les tests
beforeAll(async () => {
  try {
    console.log('🚀 Initialisation base de données de test...');
    
    testDbName = generateTestDbName();
    
    // Essayer d'abord une connexion MongoDB locale
    let mongoUri;
    try {
      mongoUri = `mongodb://localhost:27017/${testDbName}`;
      await connectToDatabase(mongoUri);
      console.log('✅ Connexion MongoDB locale réussie:', testDbName);
      dbConnectionEstablished = true;
    } catch (mongoError) {
      console.warn('⚠️ MongoDB local non disponible, tentative avec URI par défaut...');
      
      // Fallback : essayer avec l'URI d'environnement
      try {
        mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test_fallback';
        await connectToDatabase(mongoUri);
        console.log('✅ Connexion MongoDB fallback réussie');
        dbConnectionEstablished = true;
      } catch (fallbackError) {
        console.error('❌ Aucune connexion MongoDB possible:', fallbackError.message);
        // Dans ce cas, les tests vont tourner sans base réelle (mocks uniquement)
        dbConnectionEstablished = false;
      }
    }
    
    if (dbConnectionEstablished) {
      console.log('📊 Base de données de test prête');
    } else {
      console.log('🤖 Mode tests sans base de données (mocks uniquement)');
    }
    
  } catch (error) {
    console.error('❌ Erreur setup base de données:', error);
    dbConnectionEstablished = false;
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    console.log('🧹 Nettoyage base de données de test...');
    
    if (dbConnectionEstablished && mongoose.connection.readyState === 1) {
      // Supprimer les collections une par une au lieu de dropDatabase
      const collections = ['users', 'objects', 'trades', 'payments'];
      for (const collectionName of collections) {
        try {
          await mongoose.connection.db.collection(collectionName).drop();
          console.log(`🗑️ Collection ${collectionName} supprimée`);
        } catch (err) {
          // Collection n'existe pas, ignorer
        }
      }
      await mongoose.disconnect();
      console.log('✅ Base de données de test nettoyée:', testDbName);
    }
    
  } catch (error) {
    console.warn('⚠️ Erreur nettoyage final:', error);
  }
});

// Nettoyage entre chaque test
beforeEach(async () => {
  if (dbConnectionEstablished && mongoose.connection.db) {
    try {
      // Nettoyer seulement les collections nécessaires
      const collections = ['users', 'objects', 'trades', 'payments'];
      for (const collectionName of collections) {
        try {
          const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
          console.log(`🧹 Collection ${collectionName} nettoyée: ${result.deletedCount} documents supprimés`);
        } catch (err) {
          // Collection n'existe pas encore, ignorer
          console.log(`ℹ️ Collection ${collectionName} n'existe pas encore`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage collections:', error);
    }
  }
});

// Export du statut de connexion pour les tests
global.isDbConnected = () => dbConnectionEstablished;
