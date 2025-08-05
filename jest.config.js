module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-simple.js'],
      moduleNameMapper: {
        '^models/(.*)$': '<rootDir>/tests/__mocks__/$1',
        '^services/(.*)$': '<rootDir>/services/$1',
        '^controllers/(.*)$': '<rootDir>/controllers/$1'
      },
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
      setupFilesAfterEnv: ['<rootDir>/tests/e2e-setup.js']
    }
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'node'
};