// Ne charge dotenv QUE si on n'est pas en mode test
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const { connectToDatabase } = require('./db');
const { initializeCategories } = require('./utils/initCategories');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

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
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
      console.log(`🌐 Accessible sur: http://192.168.1.16:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur MongoDB :', err);
  });
