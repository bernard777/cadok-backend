/**
 * Tests E2E - Flux de Sécurité
 */

const request = require('supertest');
const app = require('../../app');

describe('🔐 Tests Sécurité', () => {
  test('Endpoint racine fonctionne', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Bienvenue sur l');
  });

  test('Endpoint inexistant retourne 404', async () => {
    await request(app)
      .get('/api/inexistant-1754443378144')
      .expect(404);
  });
});
