module.exports = {
  displayName: 'e2e-real',
  testMatch: [
    '<rootDir>/tests/e2e/**/*-real-only.test.js',
    '<rootDir>/tests/e2e/**/*-real-fixed.test.js',
    '<rootDir>/tests/e2e/all-tests-corrected.test.js',
    '<rootDir>/tests/e2e/ultra-clean-tests.test.js',
    '<rootDir>/tests/e2e/complete-30-tests.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup-real-only.js'],
  testEnvironment: 'node',
  clearMocks: true,
  resetModules: false,
  transform: {},
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: true,
  verbose: true,
  collectCoverage: false // Désactiver la couverture pour les tests réels
};
