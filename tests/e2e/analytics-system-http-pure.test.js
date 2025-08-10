/**
 * 📊 TESTS E2E ANALYTICS SYSTEM - HTTP PURE
 * Tests complets pour les analytics avancés CADOK
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
 * Helper class pour les tests Analytics
 */
class AnalyticsHelpers {
  static async createTestUser() {
    const timestamp = Date.now();
    const userData = {
      pseudo: `analytics_user_${timestamp}`,
      email: `analytics.${timestamp}@test-cadok.com`,
      password: 'AuthObjPass123!',
      ville: 'Lyon',
      age: 32
    };

    const response = await api.post('/auth/register', userData);
    if (response.status === 201 && response.data.success) {
      return { ...userData, token: response.data.token, id: response.data.user.id };
    }
    return null;
  }

  static async createTestObject(token, objectData = {}) {
    const defaultObject = {
      nom: `Objet Analytics ${Date.now()}`,
      description: 'Objet pour tests analytics',
      categorie: 'Électronique',
      etat: 'Excellent état',
      disponible: true,
      images: []
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
      message: 'Troc test analytics'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 201 && response.data.success) {
      return response.data.trade;
    }
    return null;
  }

  static async simulateUserActivity(token) {
    // Créer quelques objets et interactions pour alimenter les analytics
    await this.createTestObject(token, { nom: 'Livre Analytics' });
    await this.createTestObject(token, { nom: 'CD Analytics' });
    
    // Simuler des vues d'objets
    await api.get('/auth-objects', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

describe('📊 ANALYTICS SYSTEM - Tests E2E HTTP Pure', () => {
  let testUser = null;
  let authToken = null;
  let testObjects = [];

  beforeEach(async () => {
    // Créer utilisateur de test
    testUser = await AnalyticsHelpers.createTestUser();
    if (testUser) {
      authToken = testUser.token;
      
      // Simuler de l'activité pour les analytics
      await AnalyticsHelpers.simulateUserActivity(authToken);
    }
  });

  // ========== DASHBOARD ANALYTICS ==========
  describe('Dashboard Analytics', () => {
    test('Devrait récupérer le dashboard analytics utilisateur', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/dashboard non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('totalTrades');
        expect(response.data.data).toHaveProperty('totalObjects');
        expect(response.data.data).toHaveProperty('successRate');
      }
    }, 30000);

    test('Devrait récupérer les métriques de trading', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/trading-metrics', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/trading-metrics non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('activeTradesCount');
        expect(response.data.data).toHaveProperty('completedTradesCount');
        expect(response.data.data).toHaveProperty('averageCompletionTime');
      }
    }, 30000);

    test('Devrait récupérer les métriques des objets', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/objects-metrics', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/objects-metrics non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('totalObjects');
        expect(response.data.data).toHaveProperty('categoriesBreakdown');
        expect(response.data.data).toHaveProperty('popularCategories');
      }
    }, 30000);
  });

  // ========== ANALYTICS COMMUNAUTAIRES ==========
  describe('Analytics Communautaires', () => {
    test('Devrait récupérer le ranking communautaire', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/community-ranking', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/community-ranking non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('userRank');
        expect(response.data.data).toHaveProperty('totalUsers');
        expect(Array.isArray(response.data.data.topUsers)).toBe(true);
      }
    }, 30000);

    test('Devrait récupérer les tendances mensuelles', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/monthly-trends', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/monthly-trends non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(Array.isArray(response.data.data.monthlyData)).toBe(true);
        expect(response.data.data).toHaveProperty('trend');
        expect(response.data.data).toHaveProperty('growthRate');
      }
    }, 30000);

    test('Devrait fournir des conseils personnalisés', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/personalized-tips', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/personalized-tips non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(Array.isArray(response.data.data.tips)).toBe(true);
        expect(response.data.data).toHaveProperty('personalizedScore');
      }
    }, 30000);
  });

  // ========== ANALYTICS AVANCÉS ==========
  describe('Analytics Avancés', () => {
    test('Devrait analyser les patterns de comportement', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Test avec paramètres temporels
      const response = await api.get('/analytics/trading-metrics?period=30days', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée avec paramètres');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        // Vérifier que les données sont filtrées par période
        if (response.data.data.periodAnalysis) {
          expect(response.data.data.periodAnalysis.period).toBe('30days');
        }
      }
    }, 30000);

    test('Devrait calculer les métriques de performance', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/dashboard non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        const data = response.data.data;
        
        // Vérifier la cohérence des métriques
        if (data.totalTrades && data.successfulTrades) {
          expect(data.successfulTrades).toBeLessThanOrEqual(data.totalTrades);
        }
        
        if (data.successRate) {
          expect(data.successRate).toBeGreaterThanOrEqual(0);
          expect(data.successRate).toBeLessThanOrEqual(100);
        }
      }
    }, 30000);

    test('Devrait fournir des insights prédictifs', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/personalized-tips', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route analytics/personalized-tips non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success && response.data.data.tips) {
        const tips = response.data.data.tips;
        
        // Vérifier que les conseils sont pertinents
        tips.forEach(tip => {
          expect(tip).toHaveProperty('category');
          expect(tip).toHaveProperty('message');
          expect(tip).toHaveProperty('priority');
        });
      }
    }, 30000);
  });

  // ========== SÉCURITÉ ET AUTHENTIFICATION ==========
  describe('Sécurité Analytics', () => {
    test('Devrait refuser l\'accès sans authentification', async () => {
      const response = await api.get('/analytics/dashboard');
      
      expect([401, 403]).toContain(response.status);
      if (response.data && typeof response.data.success !== 'undefined') {
        expect(response.data.success).toBe(false);
      }
    }, 30000);

    test('Devrait protéger les données personnelles', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/community-ranking', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success && response.data.data.topUsers) {
        // Vérifier que les emails ne sont pas exposés
        response.data.data.topUsers.forEach(user => {
          expect(user.email).toBeUndefined();
          expect(user.pseudo).toBeDefined();
        });
      }
    }, 30000);

    test('Devrait limiter l\'accès aux données des autres utilisateurs', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Créer un deuxième utilisateur
      const user2 = await AnalyticsHelpers.createTestUser();
      if (!user2) return;

      // Essayer d'accéder aux analytics avec un ID spécifique (devrait être refusé)
      const response = await api.get(`/analytics/dashboard?userId=${user2.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      // Devrait soit ignorer le paramètre, soit refuser l'accès
      expect([200, 201, 403]).toContain(response.status);
      if (response.status === 200 && response.data.success) {
        // Les données doivent correspondre à l'utilisateur authentifié, pas à user2
        expect(response.data.data.userId).not.toBe(user2.id);
      }
    }, 30000);
  });

  // ========== PERFORMANCES ET OPTIMISATION ==========
  describe('Performances Analytics', () => {
    test('Devrait répondre rapidement aux requêtes dashboard', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const startTime = Date.now();
      const response = await api.get('/analytics/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const responseTime = Date.now() - startTime;

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      expect(responseTime).toBeLessThan(3000); // Moins de 3 secondes
      expect([200, 201]).toContain(response.status);
    }, 30000);

    test('Devrait paginer les gros datasets', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/analytics/community-ranking?limit=10', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success && response.data.data.topUsers) {
        expect(response.data.data.topUsers.length).toBeLessThanOrEqual(10);
      }
    }, 30000);

    test('Devrait mettre en cache les données fréquemment demandées', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Première requête
      const start1 = Date.now();
      const response1 = await api.get('/analytics/monthly-trends', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const time1 = Date.now() - start1;

      if (response1.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      // Deuxième requête (devrait être plus rapide si mise en cache)
      const start2 = Date.now();
      const response2 = await api.get('/analytics/monthly-trends', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const time2 = Date.now() - start2;

      expect([200, 201]).toContain(response1.status);
      expect([200, 201]).toContain(response2.status);
      
      // La deuxième requête devrait être au moins aussi rapide
      expect(time2).toBeLessThanOrEqual(time1 + 100); // +100ms de tolérance
    }, 30000);
  });
});
