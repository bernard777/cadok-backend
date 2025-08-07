/**
 * SETUP E2E SIMPLIFIÉ
 * Configuration sans MongoDB Memory Server pour tests rapides
 */

const { mongoose, connectToDatabase } = require('../../db');

// Configuration Jest
jest.setTimeout(10000); // 10 secondes par test

console.log('🔧 Setup E2E simplifié chargé');

// Setup MongoDB simple (utilise la DB de test locale)
beforeAll(async () => {
  try {
    console.log('🚀 Connexion MongoDB de test...');
    
    // Utiliser la DB de test locale ou l'URI injectée
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test';
    console.log('📡 MongoDB URI:', mongoUri);

    // Connecter via le connecteur unifié
    await connectToDatabase(mongoUri);
    
    console.log('✅ MongoDB de test connecté');
  } catch (error) {
    console.error('❌ Erreur setup MongoDB:', error);
    throw error;
  }
});

// Nettoyage après tous les tests
afterAll(async () => {
  try {
    console.log('🧹 Nettoyage MongoDB...');
    
    if (mongoose.connection.readyState === 1) {
      // Nettoyer les collections de test
      await mongoose.connection.db.collection('users').deleteMany({});
      await mongoose.disconnect();
    }
    
    console.log('✅ MongoDB de test déconnecté');
  } catch (error) {
    console.warn('⚠️ Erreur nettoyage:', error);
  }
});

// Nettoyage entre les tests
beforeEach(async () => {
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('users').deleteMany({});
    }
  } catch (error) {
    console.warn('⚠️ Erreur nettoyage users:', error);
  }
});
