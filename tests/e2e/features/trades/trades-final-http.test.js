/**
 * FEATURE E2E - SYSTÈME D'ÉCHANGES - VERSION HTTP DIRECTE
 * Tests avec vrais appels API HTTP - basé sur test-http-direct.js qui fonctionne !
 * 
 * ⚠️ PRÉREQUIS : Le serveur doit tourner sur port 5000 
 * Commande : npm start (dans un terminal) puis npm test (dans un autre)
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Helpers HTTP directs (inspirés de test-http-direct.js)
class E2EHelpers {
  
  static async registerUser(customData = {}) {
    const userData = {
      pseudo: `TestE2E_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: `e2e_${Date.now()}_${Math.random().toString(36).substr(2, 8)}@test.com`,
      password: 'TestPassword123!',
      city: 'Paris',
      ...customData
    };
    
    console.log('📤 Inscription utilisateur:', userData.pseudo);
    
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
  
  static async getCategories(token = null) {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE}/categories`, { headers, timeout: 3000 });
      return { success: true, categories: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

describe('🔄 FEATURE E2E - SYSTÈME D\'ÉCHANGES (HTTP DIRECT)', () => {
  
  beforeAll(async () => {
    console.log('🔍 Vérification serveur sur port 5000...');
    
    const serverReady = await E2EHelpers.healthCheck();
    if (!serverReady) {
      throw new Error('❌ Serveur non disponible sur port 5000. Lancez "npm start" d\'abord !');
    }
    
    console.log('✅ Serveur détecté et prêt');
  });

  describe('📋 Tests HTTP Directs - Trades', () => {
    
    beforeEach(async () => {
      console.log('🧹 Nettoyage base de données...');
      
      // Nettoyage via mongosh (solution qui fonctionne)
      try {
        const { exec } = require('child_process');
        await new Promise((resolve) => {
          exec('mongosh "mongodb://localhost:27017/cadok_test" --eval "db.users.deleteMany({}); db.objects.deleteMany({}); db.trades.deleteMany({}); db.categories.deleteMany({});"', 
            (error) => {
              if (error) console.log('⚠️ Nettoyage mongosh:', error.message);
              else console.log('✅ Base nettoyée via mongosh');
              resolve();
            });
        });
        
        await new Promise(resolve => setTimeout(resolve, 300)); // Stabilisation
      } catch (error) {
        console.log('⚠️ Erreur nettoyage:', error.message);
      }
    });
    
    test('✅ Test inscription utilisateur HTTP', async () => {
      console.log('🔥 Test inscription utilisateur...');
      
      const result = await E2EHelpers.registerUser();
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toContain('e2e_');
      expect(result.user.pseudo).toContain('TestE2E_');
      
      console.log('🎉 Utilisateur créé avec succès !');
    });

    test('✅ Test workflow trade complet HTTP', async () => {
      console.log('🔥 Test workflow trade complet...');
      
      // Étape 1 : Créer 2 utilisateurs
      console.log('📝 Étape 1/5 : Création des utilisateurs...');
      const user1 = await E2EHelpers.registerUser({ city: 'Paris' });
      const user2 = await E2EHelpers.registerUser({ city: 'Lyon' });
      
      expect(user1.success && user2.success).toBe(true);
      console.log('✅ 2 utilisateurs créés');
      
      // Étape 2 : Obtenir/créer des catégories
      console.log('📝 Étape 2/5 : Gestion des catégories...');
      let categoryId = '507f1f77bcf86cd799439011'; // ID MongoDB valide par défaut
      
      const categoriesResult = await E2EHelpers.getCategories();
      if (categoriesResult.success && categoriesResult.categories.length > 0) {
        categoryId = categoriesResult.categories[0]._id;
        console.log('✅ Catégorie existante utilisée:', categoriesResult.categories[0].name);
      } else {
        console.log('⚠️ Aucune catégorie, utilisation ID par défaut');
      }
      
      // Étape 3 : Créer 2 objets
      console.log('📝 Étape 3/5 : Création des objets...');
      const obj1 = await E2EHelpers.createObject(user1.token, {
        title: 'iPhone Test E2E',
        description: 'iPhone de test pour échange E2E',
        category: categoryId,
        condition: 'Excellent',
        estimatedValue: 500,
        images: []
      });
      
      const obj2 = await E2EHelpers.createObject(user2.token, {
        title: 'iPad Test E2E',  
        description: 'iPad de test pour échange E2E',
        category: categoryId,
        condition: 'Bon',
        estimatedValue: 400,
        images: []
      });
      
      expect(obj1.success && obj2.success).toBe(true);
      console.log('✅ 2 objets créés');
      
      // Étape 4 : Créer le trade
      console.log('📝 Étape 4/5 : Création du trade...');
      const tradeData = {
        requestedObjects: [obj2.object._id],  // User1 veut l'iPad de User2
        offeredObjects: [obj1.object._id]     // User1 offre son iPhone
      };
      
      const tradeResult = await E2EHelpers.createTrade(user1.token, tradeData);
      
      expect(tradeResult.success).toBe(true);
      expect(tradeResult.trade).toBeDefined();
      expect(tradeResult.trade._id).toBeDefined();
      
      // Étape 5 : Vérifications finales
      console.log('📝 Étape 5/5 : Vérifications...');
      expect(tradeResult.trade.status).toBeDefined();
      expect(tradeResult.trade.requestedObjects).toEqual([obj2.object._id]);
      expect(tradeResult.trade.offeredObjects).toEqual([obj1.object._id]);
      
      console.log('🎉 WORKFLOW TRADE COMPLET RÉUSSI !');
      console.log('📊 Trade ID:', tradeResult.trade._id);
      console.log('📊 Status:', tradeResult.trade.status || 'pending');
      
    }, 30000); // Timeout étendu

  });

});
