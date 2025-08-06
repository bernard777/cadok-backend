/**
 * Test simple pour vérifier que l'environnement E2E fonctionne
 */

const request = require('supertest');

describe('🧪 TEST E2E SIMPLE - Vérification environnement', () => {
  
  test('Environnement de test disponible', () => {
    expect(true).toBe(true);
    console.log('✅ Jest fonctionne');
  });
  
  test('Supertest disponible', () => {
    expect(request).toBeDefined();
    console.log('✅ Supertest disponible');
  });

});
