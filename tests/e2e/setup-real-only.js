/**
 * 🔧 SETUP MONGODB RÉEL FORCÉ
 * Force l'utilisation de MongoDB réel pour tous les tests
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔥 [FORCE RÉEL] Setup MongoDB réel obligatoire...');

// Configuration environnement test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cadok-jwt-secret-super-secure-2024';

// Configuration Stripe (mock pour tests)
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_MOCK_KEY_FOR_TESTS';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_MOCK_KEY_FOR_TESTS';

let globalConnection = null;

// Créer une base de données de test unique
function createTestDbName() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `cadok_e2e_real_${timestamp}_${random}`;
}

// Setup global avant tous les tests
beforeAll(async () => {
  console.log('🔧 [FORCE RÉEL] Connexion MongoDB obligatoire...');
  
  try {
    // Fermer toute connexion existante
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const dbName = createTestDbName();
    const mongoUri = `mongodb://127.0.0.1:27017/${dbName}`;
    
    console.log('🔌 [FORCE RÉEL] Connexion à:', dbName);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    // Attendre que la connexion soit complètement établie
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });
    
    globalConnection = mongoose.connection;
    
    // FORCER le mode réel
    global.isDbConnected = true; // Boolean true, pas une fonction
    
    console.log('✅ [FORCE RÉEL] MongoDB connecté en mode RÉEL');
    console.log(`📊 isDbConnected: ${global.isDbConnected} (type: ${typeof global.isDbConnected})`);
    console.log('📊 État connexion:', mongoose.connection.readyState);
    console.log('🔗 Base de données:', mongoose.connection.db?.databaseName || 'undefined');
    
  } catch (error) {
    console.error('❌ [FORCE RÉEL] ÉCHEC connexion MongoDB:', error.message);
    throw new Error('MongoDB requis pour ces tests réels !');
  }
}, 30000);

// Cleanup global après tous les tests
afterAll(async () => {
  console.log('🧹 [FORCE RÉEL] Nettoyage MongoDB...');
  
  try {
    if (globalConnection && mongoose.connection.readyState === 1) {
      const dbName = mongoose.connection.db.databaseName;
      console.log('🗑️ Suppression DB test:', dbName);
      
      // Supprimer toutes les collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const collection of collections) {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log('🗑️ Collection supprimée:', collection.name);
      }
      
      await mongoose.disconnect();
      console.log('✅ [FORCE RÉEL] Nettoyage terminé');
    }
  } catch (error) {
    console.warn('⚠️ [FORCE RÉEL] Erreur nettoyage:', error.message);
  } finally {
    global.isDbConnected = false; // Boolean false, pas une fonction
  }
}, 15000);

// Nettoyage silencieux entre chaque test
afterEach(async () => {
  if (globalConnection && mongoose.connection.readyState === 1) {
    try {
      // Vérifier que la base de données est accessible
      if (mongoose.connection.db && typeof mongoose.connection.db.listCollections === 'function') {
        const collections = await mongoose.connection.db.listCollections().toArray();
        let cleanedCount = 0;
        for (const collection of collections) {
          try {
            await mongoose.connection.db.collection(collection.name).deleteMany({});
            cleanedCount++;
          } catch (collError) {
            // Ignorer les erreurs de collections individuelles
          }
        }
        if (cleanedCount > 0) {
          console.log(`🧽 ${cleanedCount} collections nettoyées silencieusement`);
        }
      }
    } catch (error) {
      // Nettoyage complètement silencieux - pas de warnings
      // Les erreurs de nettoyage n'affectent pas les tests
    }
  }
});

console.log('✅ [FORCE RÉEL] Setup configuré - mode réel uniquement');
