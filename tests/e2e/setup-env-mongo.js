// ⚡ RESET MONGOOSE SYNCHRONE RADICAL
const mongoose = require('mongoose');

console.log('[SETUP] État Mongoose avant reset:', mongoose.connection.readyState);

// Reset synchrone brutal
if (mongoose.connection.readyState !== 0) {
  console.log('[SETUP] Force déconnexion synchrone...');
  mongoose.connection.close();
}

// Force une URI MongoDB mémoire unique pour chaque run E2E
const crypto = require('crypto');
const uniqueDb = 'cadok_e2e_' + crypto.randomBytes(8).toString('hex');

// OVERRIDE complet des variables d'environnement pour les tests
process.env.MONGODB_URI = `mongodb://127.0.0.1:27017/${uniqueDb}`;
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_PLACEHOLDER';
process.env.JWT_SECRET = 'cadok-jwt-secret-super-secure-2024';

console.log('[SETUP] MONGODB_URI forcée:', process.env.MONGODB_URI);
console.log('[SETUP] État après setup:', mongoose.connection.readyState);
