/**
 * Configuration Jest pour les tests CADOK
 * Configurations avancées pour les nouveaux tests critiques
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-simple.js'],
  
  // Mock des modules externes par défaut
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1'
  },

  // Collecte de couverture étendue (désactivée par défaut pour éviter les blocages)
  collectCoverage: false,
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js', 
    'middlewares/**/*.js',
    'services/**/*.js',
    'scripts/**/*.js',
    '!node_modules/**',
    '!tests/**',
    '!**/node_modules/**',
    '!coverage/**'
  ],

  // Seuils de couverture par module
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './routes/objects.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './services/deliveryLabelService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './services/bidirectionalTradeService.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './services/securityService.js': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // Configuration avancée
  testTimeout: 30000,
  verbose: true,
  
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json-summary',
    'clover'
  ],
  
  coverageDirectory: './coverage',
  
  // Patterns d'exclusion
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/uploads/'
  ],

  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/jest.env.js'],

  // Transformation des fichiers
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Détection des fuites mémoire
  detectOpenHandles: true,
  detectLeaks: true

  // Configuration par défaut sans projects pour éviter les conflits
  // Les tests peuvent être lancés directement sans restriction de dossiers
};
