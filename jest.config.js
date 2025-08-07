module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-simple.js'],
      setupFiles: ['<rootDir>/tests/universal-mocks.js'],
      // moduleNameMapper supprimé pour éviter les conflits avec le projet e2e
      collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'middlewares/**/*.js'
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        './services/securityService.js': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup-optimized.js'],
      testEnvironment: 'node',
      clearMocks: true,
      resetModules: false,
      transform: {},
      testTimeout: 30000,
      detectOpenHandles: true,
      forceExit: true
    }
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  testTimeout: 120000,
  maxWorkers: 1
};