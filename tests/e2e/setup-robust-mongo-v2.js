/**
 * SETUP E2E ROBUSTE V2
 * Nettoyage de base synchronisé avec setup-env-mongo.js
 */

const { MongoClient } = require('mongodb');

// Configuration Jest
jest.setTimeout(15000);

let mongoClient;
let db;

console.log('🔧 Setup E2E robuste v2 chargé');

// Setup base de données avant tous les tests
beforeAll(async () => {
  try {
    console.log('🚀 Initialisation base de données de test...');
    
    // Utiliser la même URI que setup-env-mongo.js
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cadok_e2e_fallback';
    console.log('🔗 URI MongoDB:', mongoUri);
    
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('✅ Connexion MongoDB établie');
    
    // Extraire le nom de la base depuis l'URI
    const dbName = mongoUri.split('/').pop().split('?')[0];
    db = mongoClient.db(dbName);
    console.log('🎯 Base de données sélectionnée:', dbName);
    
  } catch (error) {
    console.error('❌ Erreur setup base de données:', error);
    throw error;
  }
});

// Nettoyage avant chaque test
beforeEach(async () => {
  if (!db) {
    console.warn('⚠️ Pas de base de données disponible pour le nettoyage');
    return;
  }
  
  try {
    console.log('🧹 Nettoyage avant test...');
    
    // Lister toutes les collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collections trouvées: ${collections.map(c => c.name).join(', ')}`);
    
    // Vider chaque collection
    for (const collection of collections) {
      const countBefore = await db.collection(collection.name).countDocuments();
      if (countBefore > 0) {
        await db.collection(collection.name).deleteMany({});
        console.log(`🗑️ Collection ${collection.name}: ${countBefore} documents supprimés`);
      }
    }
    
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur pendant le nettoyage:', error);
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    console.log('🧹 Nettoyage final base de données...');
    
    if (db) {
      // Supprimer toutes les collections
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).drop().catch(() => {
          // Ignorer les erreurs si la collection n'existe plus
        });
        console.log(`🗑️ Collection ${collection.name} supprimée`);
      }
    }
    
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔒 Connexion MongoDB fermée');
    }
    
  } catch (error) {
    console.error('❌ Erreur nettoyage final:', error);
  }
});

// Export pour accès dans les tests si nécessaire
module.exports = {
  getDb: () => db,
  getClient: () => mongoClient
};
