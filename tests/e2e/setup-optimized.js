/**
 * 🔧 SETUP ULTRA-MINIMALISTE
 * PLUS AUCUNE CONNEXION - SEULEMENT CONFIGURATION + CATÉGORIES DE TEST
 */

// FORCER le chargement immédiat de .env.test AVANT tout
require('dotenv').config({ path: '.env.test', override: true });

// Forcer NODE_ENV=test pour déclencher le chargement de .env.test dans app.js
process.env.NODE_ENV = 'test';

console.log('🚀 [E2E SETUP] Configuration minimaliste...');
console.log('🔧 [E2E SETUP] Base de données:', process.env.MONGODB_URI);
console.log('🔧 [E2E SETUP] Mode forcé:', process.env.FORCE_REAL_MODE);

// Configuration environnement test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cadok-jwt-secret-super-secure-2024';

// Configuration Stripe (mock pour tests)
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_MOCK_KEY_FOR_TESTS';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_MOCK_KEY_FOR_TESTS';

// ✅ SETUP global pour catégories de test
beforeAll(async () => {
  try {
    console.log('📂 [E2E SETUP] Initialisation catégories de test...');
    const { insertTestCategories } = require('../insert-test-categories');
    await insertTestCategories();
    console.log('✅ [E2E SETUP] Catégories de test prêtes');
  } catch (error) {
    console.error('❌ [E2E SETUP] Erreur catégories:', error.message);
    // Ne pas faire échouer les tests pour les catégories
  }
}, 30000);

console.log('✅ [E2E SETUP] Configuration ultra-minimaliste chargée');
