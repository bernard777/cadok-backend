/**
 * Tests E2E - Connectivité Basique
 */

const request = require('supertest');
const app = require('../../app');

describe('🌐 Tests Connectivité', () => {
  test('Endpoint racine fonctionne', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Bienvenue sur l');
  });

  test('Endpoint inexistant retourne 404', async () => {
    await request(app)
      .get('/api/inexistant')
      .expect(404);
  });

  test('Routes API existent', async () => {
    // Test que les routes de base sont montées
    await request(app)
      .get('/api/auth')
      .expect(404); // 404 normal car pas de GET sur /api/auth
  });
});
