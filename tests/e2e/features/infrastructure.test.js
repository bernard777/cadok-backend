/**
 * TEST SIMPLE - Vérification infrastructure E2E
 */

const request = require('supertest');

describe('🔧 INFRASTRUCTURE E2E', () => {
  
  test('Import de supertest fonctionne', () => {
    console.log('✅ Supertest importé');
    expect(request).toBeDefined();
  });

  test('Test de base - app existe', () => {
    console.log('🚀 Test app loading');
    
    try {
      const app = require('../../../app');
      console.log('📊 App chargée avec succès');
      expect(app).toBeDefined();
    } catch (error) {
      console.error('❌ Erreur chargement app:', error.message);
      throw error;
    }
  });

});
