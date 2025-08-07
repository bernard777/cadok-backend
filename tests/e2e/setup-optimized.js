/**
 * 🔧 SETUP OPTIMISÉ MONGODB E2E
 * Configuration stable pour les tests Jest avec MongoDB réel
 */

require('dotenv').config();
const mongoHelper = require('./helpers/MongoDBTestHelper');

console.log('🚀 [E2E SETUP] Configuration MongoDB optimisée...');

// Configuration environnement test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cadok-jwt-secret-super-secure-2024';

// Configuration Stripe (mock pour tests)
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_MOCK_KEY_FOR_TESTS';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_MOCK_KEY_FOR_TESTS';

// Setup global avant tous les tests
beforeAll(async () => {
  console.log('🔧 [E2E] Setup global MongoDB...');
  
  try {
    const mongoAvailable = await mongoHelper.setupGlobalTests();
    
    if (mongoAvailable) {
      console.log('✅ [E2E] Mode réel MongoDB activé');
    } else {
      console.log('📱 [E2E] Mode mock activé (MongoDB indisponible)');
    }
  } catch (error) {
    console.warn('⚠️ [E2E] Erreur setup, basculement mode mock:', error.message);
    global.isDbConnected = () => false;
  }
}, 30000);

// Cleanup global après tous les tests
afterAll(async () => {
  console.log('🧹 [E2E] Cleanup global...');
  
  try {
    await mongoHelper.teardownGlobalTests();
    console.log('✅ [E2E] Cleanup terminé');
  } catch (error) {
    console.warn('⚠️ [E2E] Erreur cleanup:', error.message);
  }
}, 15000);

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ [E2E] Promesse rejetée:', reason);
});

console.log('✅ [E2E SETUP] Configuration chargée');
