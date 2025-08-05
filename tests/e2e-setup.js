// Setup E2E - Configuration minimale pour tests bout en bout
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jwt_tokens_123456789';
process.env.MONGODB_URI = 'mongodb://localhost:27017/cadok_test_e2e';

// Configuration Jest pour E2E
jest.setTimeout(30000);

console.log('✅ Setup E2E configuré');