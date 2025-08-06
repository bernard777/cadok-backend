/**
 * Tests E2E - Flux de Paiement
 */

const request = require('supertest');
const app = require('../../app');

describe('💳 Tests Paiements', () => {
  test('Endpoint racine fonctionne', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Bienvenue sur l');
  });

  test('Endpoint inexistant retourne 404', async () => {
    await request(app)
      .get('/api/inexistant-1754443378146')
      .expect(404);
  });
});
