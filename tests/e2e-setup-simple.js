/**
 * Setup E2E simple et fonctionnel
 */

console.log('🚀 Setup E2E simple démarré...');

// Variables globales simples pour les tests
global.testData = {
  users: [],
  objects: [],
  trades: []
};

beforeAll(async () => {
  console.log('✅ Setup E2E simple - Environnement prêt');
}, 10000);

afterAll(async () => {
  console.log('✅ Nettoyage E2E simple terminé');
});

beforeEach(() => {
  // Reset des données de test
  global.testData = {
    users: [],
    objects: [],
    trades: []
  };
});

console.log('✅ Setup E2E simple configuré');
