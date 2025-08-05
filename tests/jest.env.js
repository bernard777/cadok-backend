/**
 * Variables d'environnement pour les tests Jest
 */

// Configuration test pour MongoDB
process.env.MONGODB_URI = 'mongodb://localhost:27017/cadok_test';
process.env.NODE_ENV = 'test';

// Configuration Stripe test
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_tests';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_fake_key_for_tests';

// Configuration JWT
process.env.JWT_SECRET = 'test_jwt_secret_key_for_tests_only';

// Configuration APIs externes (mode simulation)
process.env.COLISSIMO_API_KEY = 'test_colissimo_key';
process.env.MONDIAL_RELAY_API_KEY = 'test_mondial_relay_key';
process.env.CHRONOPOST_API_KEY = 'test_chronopost_key';

// Configuration chiffrement
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_characters_long';
process.env.WEBHOOK_SECRET = 'test_webhook_secret_key';

// Désactiver les logs en mode test (sauf si DEBUG=true)
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}
