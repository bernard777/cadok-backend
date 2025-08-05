// Setup ultra-simple pour tests - SANS IMPORTS PROBLÉMATIQUES
// Variables d'environnement pour tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jwt_tokens_123456789';
process.env.MONGODB_URI = 'mongodb://localhost:27017/cadok_test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
process.env.ENCRYPTION_KEY = 'test_encryption_key_for_cadok_app_123456789';

// Mock global console pour éviter le spam
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

console.log('✅ Setup ultra-simple configuré pour les tests');