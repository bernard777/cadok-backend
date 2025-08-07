/**
 * SETUP E2E SIMPLE
 * Pas de double connexion, juste un nettoyage intelligent
 */

const { MongoClient } = require('mongodb');

// Configuration Jest
jest.setTimeout(15000);

let mongoClient;
let db;

console.log('🔧 Setup E2E simple chargé');

// Nettoyage avant chaque test
beforeEach(async () => {
  try {
    console.log('🧹 Nettoyage simple avant test...');
    
    // Se connecter directement avec l'URI de test ou production
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
    
    if (!mongoClient) {
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      const dbName = mongoUri.split('/').pop().split('?')[0];
      db = mongoClient.db(dbName);
      console.log('🔗 Connexion à:', dbName);
    }
    
    // Nettoyer uniquement la collection users
    const userCount = await db.collection('users').countDocuments();
    if (userCount > 0) {
      await db.collection('users').deleteMany({});
      console.log(`🗑️ ${userCount} utilisateurs supprimés`);
    }
    
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔒 Connexion fermée');
    }
  } catch (error) {
    console.error('❌ Erreur fermeture:', error);
  }
});
