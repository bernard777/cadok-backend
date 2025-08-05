/**
 * Configuration simplifiée pour les tests
 */

// Configuration globale pour les tests
global.console = {
  ...console,
  log: process.env.DEBUG ? console.log : jest.fn(),
  warn: process.env.DEBUG ? console.warn : jest.fn(), 
  error: process.env.DEBUG ? console.error : jest.fn()
};

// Augmenter le timeout pour les tests complexes
jest.setTimeout(30000);

// Mock des variables d'environnement
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_characters_long';
process.env.WEBHOOK_SECRET = 'test_webhook_secret_key_for_validation';

console.log('✅ Setup de test simplifié configuré');
