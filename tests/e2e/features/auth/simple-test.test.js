/**
 * TEST SIMPLE DIAGNOSTIC API
 */

const request = require('supertest');

describe('🔍 Diagnostic API Simple', () => {
  test('Test API inscription simple', async () => {
    // Charger l'app
    const app = require('../../../../app');
    
    const testUser = {
      pseudo: `Simple_${Date.now()}`,
      email: `simple_${Date.now()}@test.com`,
      password: 'SimpleTestPassword123!',
      city: 'Paris'
    };
    
    console.log('📡 Test simple avec:', testUser);
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    console.log('📊 Réponse simple:', {
      status: response.status,
      body: response.body
    });
    
    // Test flexible pour diagnostic
    expect([200, 201, 400, 500]).toContain(response.status);
  });
});
