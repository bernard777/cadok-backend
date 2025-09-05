
const mongoose = require('mongoose');
const { logger } = require('./utils/logger');

let isConnected = false;
let currentUri = null;

// 🔧 Configuration MongoDB robuste (inspirée de MedicalGo)
// ✅ AMÉLIORATIONS MEDICALGO: Retry logic, reconnect automatique, pool optimisé
const mongoOptions = {
  // 🔄 Retry logic et reconnexion automatique
  retryWrites: true,                  // Retry automatique des écritures
  retryReads: true,                   // Retry automatique des lectures
  
  // 🏊 Pool de connexions optimisé
  maxPoolSize: 50,                    // Pool de connexions élargi pour charge
  minPoolSize: 5,                     // Connexions minimum maintenues
  maxIdleTimeMS: 30000,               // Timeout idle connexions
  
  // ⏱️ Timeouts robustes
  serverSelectionTimeoutMS: 10000,    // Timeout de sélection serveur
  socketTimeoutMS: 45000,             // Timeout socket
  connectTimeoutMS: 10000,            // Timeout connexion initiale
  heartbeatFrequencyMS: 10000,        // Vérification connexion fréquente
  
  // 🚫 Buffer désactivé pour cohérence - options modernes  
  bufferCommands: true,               // Réactivé pour éviter erreurs monitoring
  
  // 🔐 Authentification et SSL
  authSource: process.env.MONGO_AUTH_SOURCE || 'admin'
  // Note: useNewUrlParser et useUnifiedTopology supprimées (dépréciées dans MongoDB 4.0+)
};

// 🔄 FONCTION RETRY ROBUSTE - Amélioration MedicalGo
async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      logger.warn(`Tentative ${attempt}/${maxRetries} échouée`, { 
        error: error.message,
        attempt,
        willRetry: attempt < maxRetries 
      });
      
      if (attempt === maxRetries) {
        throw error; // Dernier essai, on lâche
      }
      
      // Attendre avant retry avec backoff exponentiel
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

const connectToDatabase = async (uri = null) => {
  const targetUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
  
  // Extraire le nom de la base de l'URI pour affichage
  const dbNameFromUri = targetUri.split('/').pop() || 'inconnue';
  
  console.log(`🔗 [DB] Connexion demandée à: ${targetUri}`);
  logger.info('Database connection requested', { uri: targetUri, dbName: dbNameFromUri });
  
  // Si déjà connecté à la bonne URI, on garde
  if (isConnected && currentUri === targetUri && mongoose.connection.readyState === 1) {
    console.log(`📌 [DB] Réutilisation connexion existante vers: ${dbNameFromUri}`);
    logger.info('Reusing existing database connection', { dbName: dbNameFromUri });
    return;
  }
  
  // Sinon, déconnecter proprement
  if (mongoose.connection.readyState !== 0) {
    console.log(`🔌 [DB] Déconnexion...`);
    logger.info('Disconnecting from previous database');
    await mongoose.disconnect();
  }
  
  // Connexion avec retry automatique
  try {
    // Utiliser retryOperation pour la robustesse
    await retryOperation(async () => {
      await mongoose.connect(targetUri, mongoOptions);
    }, 3, 2000); // 3 tentatives, 2 secondes de délai initial
    
    isConnected = true;
    currentUri = targetUri;
    
    // Attendre que la connexion soit complètement prête et obtenir le nom réel
    await new Promise(resolve => setTimeout(resolve, 100));
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : dbNameFromUri;
    
    // Affichage avec style selon l'environnement
    const envIndicator = process.env.NODE_ENV === 'test' ? '🧪' : 
                        process.env.NODE_ENV === 'production' ? '🚀' : '🛠️';
    
    console.log(`${envIndicator} [DB] ✅ CONNECTÉ À LA BASE: "${dbName}"`);
    logger.info('Database connected successfully', { dbName, environment: process.env.NODE_ENV });
    
    // Afficher des infos supplémentaires en mode dev
    if (process.env.NODE_ENV !== 'test') {
      console.log(`📊 [DB] URI complète: ${targetUri}`);
      console.log(`🌐 [DB] Statut connexion: ${mongoose.connection.readyState === 1 ? 'ACTIVE' : 'INACTIVE'}`);
    }

    // 🎯 Configuration des gestionnaires d'événements (inspiré MedicalGo)
    setupDatabaseEventHandlers();
    
    // 🎯 Configuration des index optimisés pour Cadok
    await setupCadokIndexes();
    
  } catch (error) {
    isConnected = false;
    currentUri = null;
    console.error(`❌ [DB] ERREUR CONNEXION vers "${dbNameFromUri}":`, error.message);
    logger.error('Database connection failed', { 
      dbName: dbNameFromUri, 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
};

// 🎯 Gestionnaires d'événements de connexion (Solution MedicalGo)
function setupDatabaseEventHandlers() {
  // Éviter de reconfigurer les handlers s'ils sont déjà en place
  if (mongoose.connection._eventHandlersConfigured) {
    return;
  }

  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connecté à MongoDB');
    console.log('🔗 [DB] Mongoose connecté à MongoDB');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('Erreur de connexion Mongoose:', { error: error.message, stack: error.stack });
    console.error('❌ [DB] Erreur de connexion Mongoose:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose déconnecté de MongoDB');
    console.warn('⚠️ [DB] Mongoose déconnecté de MongoDB');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnecté à MongoDB');
    console.log('🔄 [DB] Mongoose reconnecté à MongoDB');
    isConnected = true;
  });

  // Marquer les handlers comme configurés
  mongoose.connection._eventHandlersConfigured = true;
}

// 🎯 Configuration des index optimisés pour Cadok (Solution MedicalGo adaptée)
async function setupCadokIndexes() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      logger.warn('Database not available for index setup');
      return;
    }

    // Index pour les utilisateurs
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { username: 1 }, unique: true },
      { key: { isActive: 1 } },
      { key: { createdAt: -1 } },
      { key: { 'profile.phone': 1 } }
    ]);

    // Index pour les trades (équivalent appointments de MedicalGo)
    await db.collection('trades').createIndexes([
      { key: { initiator: 1, createdAt: -1 } },
      { key: { targetUser: 1, createdAt: -1 } },
      { key: { status: 1 } },
      { key: { 'items.objectId': 1 } },
      { key: { tradeDate: 1 } },
      { key: { createdAt: -1 } }
    ]);

    // Index pour les objets (équivalent services de MedicalGo)
    await db.collection('objects').createIndexes([
      { key: { owner: 1, isAvailable: 1 } },
      { key: { category: 1 } },
      { key: { 'location.coordinates': '2dsphere' } },
      { key: { title: 'text', description: 'text' } },
      { key: { createdAt: -1 } }
    ]);

    // Index pour les transactions (équivalent payments de MedicalGo)
    await db.collection('transactions').createIndexes([
      { key: { trade: 1 } },
      { key: { user: 1, createdAt: -1 } },
      { key: { status: 1 } },
      { key: { transactionId: 1 }, unique: true }
    ]);

    // Index pour les notifications
    await db.collection('notifications').createIndexes([
      { key: { userId: 1, read: 1 } },
      { key: { createdAt: -1 } },
      { key: { type: 1 } }
    ]);

    logger.info('Index de base de données Cadok configurés');
    console.log('📊 [DB] Index de base de données Cadok configurés');
    console.log('🔍 [DEBUG] Fin configuration index - Le serveur devrait continuer...');
  } catch (error) {
    logger.warn('Erreur configuration index Cadok:', { error: error.message });
    console.warn('⚠️ [DB] Erreur configuration index:', error.message);
  }
}

// 🎯 Fonctions de monitoring (Solution MedicalGo adaptée)
async function checkDatabaseHealth() {
  try {
    if (!mongoose.connection.db) {
      return { 
        status: 'unhealthy', 
        message: 'Base de données non connectée',
        error: 'No database connection' 
      };
    }

    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    
    return { 
      status: 'healthy', 
      message: 'Base de données accessible',
      details: result,
      dbName: mongoose.connection.db.databaseName
    };
  } catch (error) {
    logger.error('Health check failed:', { error: error.message });
    return { 
      status: 'unhealthy', 
      message: 'Base de données inaccessible',
      error: error.message 
    };
  }
}

// 🎯 Statistiques de performance (Solution MedicalGo adaptée)
async function getDatabaseStats() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return null;
    }

    const stats = await db.stats();
    
    return {
      databaseName: db.databaseName,
      collections: stats.collections,
      dataSize: Math.round(stats.dataSize / 1024 / 1024 * 100) / 100, // MB
      storageSize: Math.round(stats.storageSize / 1024 / 1024 * 100) / 100, // MB
      indexes: stats.indexes,
      indexSize: Math.round(stats.indexSize / 1024 / 1024 * 100) / 100, // MB
      objects: stats.objects
    };
  } catch (error) {
    logger.error('Erreur récupération statistiques DB:', { error: error.message });
    return null;
  }
}

module.exports = { 
  connectToDatabase, 
  checkDatabaseHealth,
  getDatabaseStats,
  retryOperation,  // Export fonction retry pour réutilisation
  mongoOptions     // Export options pour tests
};