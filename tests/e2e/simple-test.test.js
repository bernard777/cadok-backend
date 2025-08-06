/**
 * Test E2E Ultra-Simple - Juste pour valider la configuration
 */

const request = require('supertest');

// Mock simple de l'app pour tester
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: Date.now() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'E2E test working' });
});

describe('🚀 Tests E2E Ultra-Simples', () => {
  test('Health check fonctionne', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });

  test('API test endpoint fonctionne', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body.message).toBe('E2E test working');
  });

  test('Endpoint inexistant retourne 404', async () => {
    await request(app)
      .get('/api/inexistant')
      .expect(404);
  });
});
