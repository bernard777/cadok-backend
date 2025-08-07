/**
 * SETUP E2E HYBRIDE
 * Nettoyage via MongoDB direct ET mongoose pour synchronisation complète
 */

const { MongoClient } = require('mongodb');
const { mongoose } = require('../../db');

// Configuration Jest
jest.setTimeout(15000);

let mongoClient;
let db;

console.log('🔧 Setup E2E hybride chargé');

// Setup base de données avant tous les tests
beforeAll(async () => {
  try {
    console.log('🚀 Initialisation base de données de test...');
    
    // Utiliser la même URI que setup-env-mongo.js
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cadok_e2e_fallback';
    console.log('🔗 URI MongoDB:', mongoUri);
    
    // Déconnecter mongoose s'il est déjà connecté à une autre base
    if (mongoose.connection.readyState !== 0) {
      console.log('🔌 Déconnexion mongoose existant...');
      await mongoose.disconnect();
    }
    
    // Connexion MongoDB directe
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('✅ Connexion MongoDB directe établie');
    
    // Extraire le nom de la base depuis l'URI
    const dbName = mongoUri.split('/').pop().split('?')[0];
    db = mongoClient.db(dbName);
    console.log('🎯 Base de données sélectionnée:', dbName);
    
    // Reconnecter mongoose avec la bonne URI
    console.log('🔗 Reconnexion mongoose...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connexion mongoose également établie');
    console.log('🎯 Mongoose DB:', mongoose.connection.db?.databaseName);
    
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
    console.log('🧹 Nettoyage hybride avant test...');
    
    // 1. Nettoyage via MongoDB direct
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collections trouvées: ${collections.map(c => c.name).join(', ')}`);
    
    for (const collection of collections) {
      const countBefore = await db.collection(collection.name).countDocuments();
      if (countBefore > 0) {
        await db.collection(collection.name).deleteMany({});
        console.log(`🗑️ MongoDB direct - Collection ${collection.name}: ${countBefore} documents supprimés`);
      }
    }
    
    // 2. Nettoyage via mongoose pour synchronisation
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const mongooseCollections = await mongoose.connection.db.listCollections().toArray();
      for (const collection of mongooseCollections) {
        const countBefore = await mongoose.connection.db.collection(collection.name).countDocuments();
        if (countBefore > 0) {
          await mongoose.connection.db.collection(collection.name).deleteMany({});
          console.log(`🗑️ Mongoose - Collection ${collection.name}: ${countBefore} documents supprimés`);
        }
      }
    } else {
      console.log('⚠️ Mongoose non connecté, nettoyage MongoDB direct uniquement');
    }
    
    console.log('✅ Nettoyage hybride terminé');
  } catch (error) {
    console.error('❌ Erreur pendant le nettoyage:', error);
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    console.log('🧹 Nettoyage final hybride...');
    
    // Nettoyage final des deux connexions
    if (db) {
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).drop().catch(() => {});
        console.log(`🗑️ Collection ${collection.name} supprimée (MongoDB direct)`);
      }
    }
    
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const mongooseCollections = await mongoose.connection.db.listCollections().toArray();
      for (const collection of mongooseCollections) {
        await mongoose.connection.db.collection(collection.name).drop().catch(() => {});
        console.log(`🗑️ Collection ${collection.name} supprimée (mongoose)`);
      }
      await mongoose.disconnect();
      console.log('🔒 Connexion mongoose fermée');
    }
    
    if (mongoClient) {
      await mongoClient.close();
      console.log('🔒 Connexion MongoDB directe fermée');
    }
    
  } catch (error) {
    console.error('❌ Erreur nettoyage final:', error);
  }
});

// Export pour accès dans les tests si nécessaire
module.exports = {
  getDb: () => db,
  getClient: () => mongoClient,
  getMongoose: () => mongoose
};
