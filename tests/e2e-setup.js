/**
 * Setup minimal pour les tests E2E
 */

// Configuration Jest simple pour E2E
beforeAll(async () => {
  console.log('🚀 Setup E2E minimal...');
}, 10000);

afterAll(async () => {
  console.log('✅ Cleanup E2E terminé');
});

beforeEach(async () => {
  // Nettoyage simple avant chaque test
});
