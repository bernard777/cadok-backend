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
process.env.STRIPE_SECRET_KEY = 'sk_test_51RrsfBAWWo4iq1n7nGd4qLi21YwqklOipVkL4s13nJ3cIWkIbFwXRKKvs4DlZcyVadP4ke57CVr1EWoE4okLHM9O00WbIz9PW7';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_51RrsfBAWWo4iq1n7QsqN2mkRfR27pN3hWbOwLnBRLe5k46Qdu2dqIzzK7noajc93h3Q29HCPYK3In63RwvK8HLSJ00v4fPw6Mg';
process.env.JWT_SECRET = 'cadok-jwt-secret-super-secure-2024';

console.log('[SETUP] MONGODB_URI forcée:', process.env.MONGODB_URI);
console.log('[SETUP] État après setup:', mongoose.connection.readyState);
