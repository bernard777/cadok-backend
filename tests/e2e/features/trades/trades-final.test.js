/**
 * FEATURE E2E - SYSTÈME D'ÉCHANGES - FINAL
 * Tests avec vrais appels API HTTP - SANS Jest/Supertest !
 * Basé sur le test-http-direct.js qui fonctionne !
 */

const axios = require('axios');

// ⚠️ CE TEST SUPPOSE QUE LE SERVEUR EST DÉJÀ LANCÉ SUR LE PORT 5000
// Utilisation : npm start pour démarrer le serveur, puis npm test dans un autre terminal

const API_BASE = 'http://localhost:5000/api';

// Helpers HTTP directs (comme test-http-direct.js)
class E2EHelpers {
  
  static async registerUser(customData = {}) {
    const userData = {
      pseudo: `TestE2E_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: `e2e_${Date.now()}_${Math.random().toString(36).substr(2, 8)}@test.com`,
      password: 'TestPassword123!',
      city: 'Paris',
      ...customData
    };
    
    console.log('� Inscription utilisateur:', userData.pseudo);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, userData, {
        timeout: 5000,
        validateStatus: status => status < 500
      });
      
      if (response.status === 201) {
        console.log('✅ Utilisateur créé:', userData.pseudo);
        return { 
          success: true, 
          token: response.data.token, 
          user: response.data.user,
          userData 
        };
      } else {
        console.error('❌ Échec inscription:', response.data);
        return { success: false, error: response.data };
      }
      
    } catch (error) {
      console.error('💥 Erreur inscription:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  static async createObject(token, objectData) {
    console.log('📤 Création objet:', objectData.title);
    
    try {
      const response = await axios.post(`${API_BASE}/objects`, objectData, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000,
        validateStatus: status => status < 500
      });
      
      if (response.status === 201) {
        console.log('✅ Objet créé:', objectData.title);
        return { success: true, object: response.data };
      } else {
        console.error('❌ Échec création objet:', response.data);
        return { success: false, error: response.data };
      }
      
    } catch (error) {
      console.error('💥 Erreur création objet:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  static async createTrade(token, tradeData) {
    console.log('📤 Création trade avec:', tradeData);
    
    try {
      const response = await axios.post(`${API_BASE}/trades`, tradeData, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000,
        validateStatus: status => status < 500
      });
      
      if (response.status === 201) {
        console.log('✅ Trade créé:', response.data._id);
        return { success: true, trade: response.data };
      } else {
        console.error('❌ Échec création trade:', response.data);
        return { success: false, error: response.data };
      }
      
    } catch (error) {
      console.error('💥 Erreur création trade:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  static async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE.replace('/api', '')}/health`, { timeout: 3000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

describe('🔄 FEATURE E2E - SYSTÈME D\'ÉCHANGES (FINAL)', () => {
  
  beforeAll(async () => {
    console.log('🔍 Vérification serveur sur port 5000...');
    
    const serverReady = await E2EHelpers.healthCheck();
    if (!serverReady) {
      throw new Error('❌ Serveur non disponible sur port 5000. Lancez "npm start" d\'abord !');
    }
    
    console.log('✅ Serveur détecté et prêt');
  });

  describe('📋 Tests Trades Réels', () => {
    
    beforeEach(async () => {
      console.log('🧹 Nettoyage COMPLET base avant test...');
      
      // Solution ultime : forcer la suppression via mongosh
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('mongosh "mongodb://localhost:27017/cadok_test" --eval "db.users.deleteMany({})"', 
          (error, stdout, stderr) => {
            if (error) {
              console.log('⚠️ Erreur nettoyage mongosh:', error.message);
            } else {
              console.log('✅ Base vidée via mongosh');
            }
            resolve();
          });
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Attendre stabilisation
    });
    
    test('✅ Test création utilisateur simple', async () => {
      console.log('🔥 Test création utilisateur avec HTTP réel...');
      
      const userData = {
        pseudo: `TestUser_${Date.now()}_${Math.floor(Math.random() * 999999)}`,
        email: `e2e_${Date.now()}_${Math.random().toString(36)}@test-cadok.com`,
        password: 'SecureTestPassword123!',
        city: 'Paris'
      };
      
      console.log('📤 Données utilisateur:', userData);
      
      try {
        const response = await axios.post('http://localhost:5000/api/auth/register', userData, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
          validateStatus: status => status < 500
        });
        
        console.log('� Réponse HTTP:');
        console.log('   Status:', response.status);
        console.log('   Data:', response.data);
        
        expect(response.status).toBe(201);
        expect(response.data.token).toBeDefined();
        expect(response.data.user).toBeDefined();
        
        console.log('✅ Utilisateur créé avec succès !');
        
      } catch (error) {
        console.error('💥 Erreur HTTP:', error.message);
        throw error;
      }
    });

    test('✅ Test création trade (mode réel)', async () => {
      console.log('🔥 Test création trade réel...');
      
      // Créer 2 utilisateurs
      const user1 = await E2EHelpers.registerUser();
      const user2 = await E2EHelpers.registerUser();
      
      expect(user1.success && user2.success).toBe(true);
      console.log('✅ 2 utilisateurs créés');
      
      // Créer une catégorie
      const mongoose = require('mongoose');
      const Category = require('../../../models/Category');
      
      const testCategory = await Category.create({
        name: 'Electronics Test',
        description: 'Test electronics category'
      });
      console.log('✅ Catégorie créée:', testCategory.name);
      
      // Créer 2 objets
      const obj1 = await E2EHelpers.createObject(user1.token, {
        title: 'iPhone Test',
        description: 'iPhone de test',
        category: testCategory._id.toString(),
        condition: 'Excellent'
      });
      
      const obj2 = await E2EHelpers.createObject(user2.token, {
        title: 'iPad Test',
        description: 'iPad de test',
        category: testCategory._id.toString(),
        condition: 'Bon'
      });
      
      expect(obj1.success && obj2.success).toBe(true);
      console.log('✅ 2 objets créés');
      
      // MAINTENANT, créer le trade !
      const tradeData = {
        requestedObjects: [obj2.object._id],  // User1 veut l'iPad
        offeredObjects: [obj1.object._id]     // User1 offre l'iPhone
      };
      
      console.log('🔥 Création trade avec données:', tradeData);
      const tradeResult = await E2EHelpers.createTrade(user1.token, tradeData);
      
      console.log('📡 Résultat final trade:', tradeResult);
      
      expect(tradeResult.success).toBe(true);
      expect(tradeResult.trade).toBeDefined();
      
      console.log('🎉 TRADE CRÉÉ AVEC SUCCÈS !', tradeResult.trade._id);
    });

  });

});
