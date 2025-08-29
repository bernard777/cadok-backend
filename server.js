// Ne charge dotenv QUE si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const { connectToDatabase } = require('./db');
const { initializeCategories } = require('./utils/initCategories');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// 🛡️ Gestionnaires d'erreurs globaux pour éviter les arrêts inattendus
process.on('uncaughtException', (error) => {
  console.error('❌ [SERVEUR] Exception non capturée:', error.message);
  console.error('🔧 [SERVEUR] Stack trace:', error.stack);
  console.log('🔄 [SERVEUR] Le serveur continue de fonctionner...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [SERVEUR] Promesse rejetée non gérée:', reason);
  console.error('🎯 [SERVEUR] À:', promise);
  console.log('🔄 [SERVEUR] Le serveur continue de fonctionner...');
});

// Gestionnaire d'arrêt propre
process.on('SIGINT', () => {
  console.log('\n⚠️ [SERVEUR] Signal d\'arrêt reçu (CTRL+C)');
  console.log('🔌 [SERVEUR] Fermeture propre du serveur...');
  process.exit(0);
});

connectToDatabase(MONGO_URI)
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
    // Initialiser les catégories si nécessaire
    try {
      await initializeCategories();
    } catch (error) {
      console.error('⚠️ Erreur lors de l\'initialisation des catégories:', error.message);
      // Ne pas arrêter le serveur pour autant
    }

    // Initialiser les données de support (FAQ, Tutoriels)
    try {
      const { initializeSupportData } = require('./utils/initSupportData');
      await initializeSupportData();
    } catch (error) {
      console.error('⚠️ Erreur lors de l\'initialisation des données de support:', error.message);
      // Ne pas arrêter le serveur pour autant
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
      console.log(`🌐 Accessible sur: http://192.168.1.16:${PORT}`);
      console.log('🛡️ [SERVEUR] Gestionnaires d\'erreurs globaux activés');
    });

    // Initialiser Socket.io
    const socketService = require('./services/socketService');
    socketService.initialize(server);

    // Gestionnaire d'erreur pour le serveur HTTP
    server.on('error', (error) => {
      console.error('❌ [SERVEUR] Erreur du serveur HTTP:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ [SERVEUR] Le port ${PORT} est déjà utilisé`);
      }
    });

  })
  .catch((err) => {
    console.error('❌ [SERVEUR] Erreur MongoDB critique:', err.message);
    console.log('🔄 [SERVEUR] Tentative de redémarrage dans 5 secondes...');
    setTimeout(() => {
      console.log('🔄 [SERVEUR] Redémarrage...');
      connectToDatabase(MONGO_URI).catch(() => {
        console.error('❌ [SERVEUR] Impossible de reconnecter à MongoDB');
      });
    }, 5000);
  });
