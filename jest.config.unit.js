/**
 * Configuration Jest pour tests unitaires purs avec mocks complets
 * 🎯 Objectif: Tests rapides, isolation totale, pas de dépendances externes
 */

module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  
  // Tests unitaires uniquement
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/services-unit-mock.test.js',
    '**/tests/basic-validation.test.js'
  ],
  
  // Setup avec mocks complets
  setupFilesAfterEnv: ['<rootDir>/tests/setup-unit-mocks.js'],
  
  // Aliases pour faciliter les imports dans les tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1'
  },

  // Configuration des mocks - désactivé pour préserver les mocks mongoose
  clearMocks: false,    // ⚠️ Désactivé pour éviter de casser les mocks de modules
  resetMocks: false,    // ⚠️ Désactivé pour éviter de casser les mocks de modules
  restoreMocks: false,  // ⚠️ Désactivé pour éviter de casser les mocks de modules
  
  // Pas de transformation pour Node.js
  transform: {},
  
  // Timeout court pour tests unitaires
  testTimeout: 10000,
  
  // Couverture de code ciblée
  collectCoverage: false,
  collectCoverageFrom: [
    'services/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/*.backup.js',
    '!**/*-test.js',
    '!**/*-deprecated/**',
    '!**/services/deprecated/**'
  ],
  
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Patterns d'exclusion
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/e2e/',
    '/tests/integration/'
  ],
  
  // Configuration de performance
  maxWorkers: 1,
  detectOpenHandles: false,
  detectLeaks: false,
  forceExit: true,
  
  // Reporters simples
  reporters: ['default'],
  
  // Directory de couverture spécifique
  coverageDirectory: './coverage/unit',
  
  verbose: true
};
