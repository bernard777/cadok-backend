/**
 * Configuration Jest pour tests unitaires avec mocks
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-mock.js'],
  
  // Mock des modules externes par défaut
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1'
  },

  // Pas de collecte de couverture par défaut
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

  // Configuration de base
  testTimeout: 15000,
  verbose: true,
  
  coverageReporters: [
    'text',
    'html'
  ],
  
  coverageDirectory: './coverage',
  
  // Patterns d'exclusion
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/uploads/'
  ],

  // Mocks automatiques
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Détection des fuites mémoire désactivée pour éviter les blocages
  detectOpenHandles: false,
  detectLeaks: false,

  // Transformation des fichiers
  transform: {},

  // Forcer l'exit
  forceExit: true
};
