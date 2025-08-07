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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0
    };
  }

  /**
   * Créer une base de données de test unique
   */
  createTestDbName() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `cadok_e2e_${timestamp}_${random}`;
  }

  /**
   * Connexion MongoDB pour tests E2E
   */
  async connectForTests() {
    if (this.isSetup && mongoose.connection.readyState === 1) {
      console.log('🔄 Connexion MongoDB existante réutilisée');
      return mongoose.connection;
    }

    try {
      // Fermer toute connexion existante
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
      if (mongoose.connection.readyState === 1) {
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
      const testConnection = mongoose.createConnection();
      await testConnection.openUri('mongodb://127.0.0.1:27017/test_ping', {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000
      });
      
      await testConnection.close();
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
    
    if (!available) {
      console.log('📱 MongoDB indisponible - mode mock forcé');
      global.isDbConnected = () => false;
      return false;
    }

    await this.connectForTests();
    global.isDbConnected = () => mongoose.connection.readyState === 1;
    
    console.log('✅ Setup global terminé - mode réel activé');
    return true;
  }

  /**
   * Teardown global
   */
  async teardownGlobalTests() {
    console.log('🔚 Teardown global MongoDB E2E...');
    await this.disconnect();
    global.isDbConnected = () => false;
  }
}

// Instance singleton
const mongoHelper = new MongoDBTestHelper();

module.exports = mongoHelper;
