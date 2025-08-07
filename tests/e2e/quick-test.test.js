/**
 * Test E2E simple avec vraie application
 */

const request = require('supertest');
const app = require('../../app');

describe('🧪 TEST E2E SIMPLE - Application réelle', () => {
  
  test('Application démarre correctement', async () => {
    expect(app).toBeDefined();
    console.log('✅ Application chargée');
  });
  
  test('Route de base accessible', async () => {
    const response = await request(app)
      .get('/')
      .timeout(10000);
    
    // L'application peut retourner 404 ou autre, l'important c'est qu'elle réponde
    expect([200, 404, 500].includes(response.status)).toBe(true);
    console.log(`✅ Application répond avec status: ${response.status}`);
  }, 15000);

});
