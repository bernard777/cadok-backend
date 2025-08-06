// Mock simple et sûr pour les tests
const OriginalDate = Date;

global.mockDate = new OriginalDate('2024-01-01T00:00:00.000Z');

// Mock console sûr
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {}
};

// Mock process.env avec toutes les variables nécessaires
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.STRIPE_SECRET_KEY = 'sk_test_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/cadok-test';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';

console.log('✅ Setup simple configuré');
