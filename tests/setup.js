// Configuration globale pour les tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Augmenter le timeout pour les tests de base de données
jest.setTimeout(30000);

// Mock des variables d'environnement
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
process.env.NODE_ENV = 'test';
