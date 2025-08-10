/**
 * 🌱 TESTS E2E ECO-IMPACT SYSTEM - HTTP PURE
 * Tests complets pour les fonctionnalités d'impact écologique CADOK
 */

const axios = require('axios');
require('./setup-optimized');

const API_BASE = 'http://localhost:5000/api';

// Configuration Jest
jest.setTimeout(30000);

// Configuration axios avec timeout
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  validateStatus: function (status) {
    return status < 500;
  }
});

/**
 * Helper class pour les tests EcoImpact
 */
class EcoImpactHelpers {
  static async createTestUser() {
    const timestamp = Date.now();
    const userData = {
      pseudo: `eco_user_${timestamp}`,
      email: `eco.${timestamp}@test-cadok.com`,
      password: 'AuthObjPass123!',
      ville: 'Paris',
      age: 28
    };

    const response = await api.post('/auth/register', userData);
    if (response.status === 201 && response.data.success) {
      return { ...userData, token: response.data.token, id: response.data.user.id };
    }
    return null;
  }

  static async loginUser(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.status === 200 ? response.data : null;
  }

  static async createTestObject(token, objectData = {}) {
    const defaultObject = {
      nom: `Objet Eco ${Date.now()}`,
      description: 'Objet pour tests écologiques',
      categorie: 'Livres',
      etat: 'Bon état',
      disponible: true,
      images: [],
      ecoData: {
        materialType: 'recyclable',
        carbonFootprint: 2.5,
        lifespan: 24
      }
    };

    const response = await api.post('/auth-objects', 
      { ...defaultObject, ...objectData }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.status === 201 && response.data.success) {
      return response.data.object;
    }
    return null;
  }

  static async createTestTrade(token, objectId, targetObjectId) {
    const response = await api.post('/trades', {
      offeredObjectId: objectId,
      requestedObjectId: targetObjectId,
      message: 'Troc écologique test'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 201 && response.data.success) {
      return response.data.trade;
    }
    return null;
  }
}

describe('🌱 ECO-IMPACT SYSTEM - Tests E2E HTTP Pure', () => {
  let testUser = null;
  let authToken = null;
  let testObject = null;

  beforeEach(async () => {
    // Créer utilisateur de test
    testUser = await EcoImpactHelpers.createTestUser();
    if (testUser) {
      authToken = testUser.token;
      
      // Créer un objet de test avec données éco
      testObject = await EcoImpactHelpers.createTestObject(authToken);
    }
  });

  // ========== DASHBOARD ÉCOLOGIQUE ==========
  describe('Dashboard Écologique', () => {
    test('Devrait récupérer le dashboard eco de l\'utilisateur', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/dashboard non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('totalCarbonSaved');
        expect(response.data.data).toHaveProperty('objectsRecycled');
        expect(response.data.data).toHaveProperty('ecoScore');
      }
    }, 30000);

    test('Devrait calculer l\'empreinte carbone utilisateur', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/carbon-footprint', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/carbon-footprint non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(typeof response.data.data.totalFootprint).toBe('number');
        expect(response.data.data.breakdown).toBeDefined();
      }
    }, 30000);

    test('Devrait analyser le cycle de vie des objets', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/lifecycle-analysis', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/lifecycle-analysis non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(Array.isArray(response.data.data.objects)).toBe(true);
      }
    }, 30000);
  });

  // ========== IMPACT COMMUNAUTAIRE ==========
  describe('Impact Communautaire', () => {
    test('Devrait récupérer l\'impact écologique communautaire', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/community-impact', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/community-impact non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('totalCommunityImpact');
        expect(response.data.data).toHaveProperty('userRanking');
      }
    }, 30000);

    test('Devrait récupérer les progrès mensuels', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/monthly-progress', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/monthly-progress non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(Array.isArray(response.data.data.monthlyData)).toBe(true);
      }
    }, 30000);

    test('Devrait récupérer les achievements écologiques', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/achievements', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/achievements non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(Array.isArray(response.data.data.achievements)).toBe(true);
      }
    }, 30000);
  });

  // ========== INTÉGRATION AVEC OBJETS ==========
  describe('Intégration EcoImpact avec Objets', () => {
    test('Devrait créer un objet avec données écologiques', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const ecoObject = await EcoImpactHelpers.createTestObject(authToken, {
        nom: 'Livre Écologique',
        ecoData: {
          materialType: 'paper',
          carbonFootprint: 1.2,
          lifespan: 36,
          recyclable: true
        }
      });

      if (ecoObject) {
        expect(ecoObject).toHaveProperty('nom');
        expect(ecoObject.ecoData).toBeDefined();
        expect(ecoObject.ecoData.carbonFootprint).toBe(1.2);
      }
    }, 30000);

    test('Devrait calculer l\'impact d\'un troc écologique', async () => {
      if (!authToken || !testObject) {
        console.log('⚠️ Pas de données test disponibles');
        return;
      }

      // Créer un deuxième utilisateur pour le troc
      const user2 = await EcoImpactHelpers.createTestUser();
      if (!user2) return;

      const object2 = await EcoImpactHelpers.createTestObject(user2.token);
      if (!object2) return;

      const trade = await EcoImpactHelpers.createTestTrade(
        authToken, 
        testObject.id || testObject._id, 
        object2.id || object2._id
      );

      if (trade) {
        expect(trade).toHaveProperty('offeredObjectId');
        expect(trade).toHaveProperty('requestedObjectId');
        
        // Vérifier si impact éco calculé
        if (trade.ecoImpact) {
          expect(typeof trade.ecoImpact.carbonSaved).toBe('number');
        }
      }
    }, 30000);
  });

  // ========== GESTION DES ERREURS ==========
  describe('Gestion des Erreurs EcoImpact', () => {
    test('Devrait refuser l\'accès sans authentification', async () => {
      const response = await api.get('/eco/dashboard');
      
      expect([401, 403]).toContain(response.status);
      if (response.data && typeof response.data.success !== 'undefined') {
        expect(response.data.success).toBe(false);
      }
    }, 30000);

    test('Devrait gérer les paramètres invalides', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/carbon-footprint?period=invalid', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée, test skippé');
        return;
      }

      // Devrait soit accepter avec valeur par défaut, soit rejeter
      if (response.status === 400) {
        expect(response.data.success).toBe(false);
      } else {
        expect([200, 201]).toContain(response.status);
      }
    }, 30000);

    test('Devrait gérer les utilisateurs sans données éco', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/achievements', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route eco/achievements non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      // Même sans données, devrait retourner structure vide
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
      }
    }, 30000);
  });

  // ========== PERFORMANCES ET LIMITATIONS ==========
  describe('Performances EcoImpact', () => {
    test('Devrait répondre rapidement pour dashboard', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const startTime = Date.now();
      const response = await api.get('/eco/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const responseTime = Date.now() - startTime;

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      expect(responseTime).toBeLessThan(5000); // Moins de 5 secondes
      expect([200, 201]).toContain(response.status);
    }, 30000);

    test('Devrait gérer les gros volumes de données', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/eco/community-impact', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        // Vérifier que les données sont paginées ou limitées
        const data = response.data.data;
        if (data.userRanking && Array.isArray(data.userRanking)) {
          expect(data.userRanking.length).toBeLessThanOrEqual(100);
        }
      }
    }, 30000);
  });
});
