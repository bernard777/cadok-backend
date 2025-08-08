/**
 * 🔧 MONGODB HELPER POUR TESTS E2E
 * Gestion optimisée des connexions MongoDB pour Jest
 */

const mongoose = require('mongoose');

class MongoDBTestHelper {
  constructor() {
    this.connections = new Map();
    this.isSetup = false;
  }

  /**
   * Configuration MongoDB optimisée pour tests
   */
  getMongoConfig() {
    return {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      bufferMaxEntries: 0
    };
  }

  /**
   * Créer un nom de DB de test statique
   */
  createTestDbName() {
    // Utiliser une base de test statique au lieu d'une base dynamique
    return 'cadok_test';
  }

  /**
   * Connexion pour les tests E2E
   */
  async connectForTests() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const dbName = this.createTestDbName();
      const mongoUri = `mongodb://127.0.0.1:27017/${dbName}`;
      
      console.log('🔌 Connexion MongoDB test:', dbName);
      
      await mongoose.connect(mongoUri, this.getMongoConfig());
      
      this.isSetup = true;
      console.log('✅ MongoDB test connecté');
      
      return mongoose.connection;
      
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB test:', error.message);
      throw error;
    }
  }

  /**
   * Nettoyage base de données de test
   */
  async cleanupTestDb() {
    try {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        const dbName = mongoose.connection.db.databaseName;
        console.log('🧹 Nettoyage DB test:', dbName);
        
        // Supprimer toutes les collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        for (const collection of collections) {
          await mongoose.connection.db.dropCollection(collection.name);
        }
        
        console.log('✅ DB test nettoyée');
      }
    } catch (error) {
      console.warn('⚠️ Erreur nettoyage DB:', error.message);
    }
  }

  /**
   * Déconnexion propre
   */
  async disconnect() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await this.cleanupTestDb();
        await mongoose.disconnect();
        console.log('🔐 MongoDB test déconnecté');
      }
      this.isSetup = false;
    } catch (error) {
      console.warn('⚠️ Erreur déconnexion:', error.message);
    }
  }

  /**
   * Vérifier si MongoDB est disponible
   */
  async isMongoDBAvailable() {
    try {
      // Approche simplifiée - utiliser directement mongoose.connect pour le test
      const testUri = 'mongodb://127.0.0.1:27017/ping_test';
      const connection = await mongoose.connect(testUri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      
      // Fermer la connexion de test
      await mongoose.disconnect();
      return true;
    } catch (error) {
      console.warn('⚠️ MongoDB indisponible:', error.message);
      return false;
    }
  }

  /**
   * Setup global pour tous les tests E2E
   */
  async setupGlobalTests() {
    console.log('🚀 Setup global MongoDB E2E...');
    
    const available = await this.isMongoDBAvailable();
    
    if (available) {
      await this.connectForTests();
      console.log('✅ Setup global terminé - mode réel activé');
      return true;
    } else {
      console.log('📱 MongoDB indisponible - mode mock forcé');
      return false;
    }
  }

  /**
   * Teardown global après tous les tests E2E
   */
  async teardownGlobalTests() {
    console.log('🔚 Teardown global MongoDB E2E...');
    await this.disconnect();
  }
}

// Export singleton
const mongoHelper = new MongoDBTestHelper();
module.exports = mongoHelper;
