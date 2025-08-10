/**
 * 🎮 TESTS E2E FONCTIONNALITÉS AVANCÉES - VERSION HTTP PURE
 * Test complet du système de toggle des features (analytics, notifications, eco, gaming)
 * Architecture HTTP-pure comme les autres modules e2e
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TEST_TIMEOUT = 15000;

// Helpers HTTP directs pour les features
class FeaturesHelpers {
  
  static async registerUser(customData = {}) {
    const userData = {
      pseudo: `Features_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      email: `features_${Date.now()}_${Math.random().toString(36).substr(2, 8)}@test.com`,
      password: 'FeaturesPass123!',
      city: 'Lyon',
      ...customData
    };
    
    console.log('📤 Inscription utilisateur features:', userData.pseudo);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, userData, {
        timeout: 10000
      });
      
      if (response.status === 201 || response.status === 200) {
        console.log('✅ Utilisateur features créé:', userData.pseudo);
        return { 
          success: true, 
          token: response.data.token, 
          user: response.data.user,
          userData 
        };
      } else {
        console.error('❌ Échec inscription features:', response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error('💥 Erreur inscription features:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async getAdvancedFeatures(token) {
    console.log('📊 Récupération fonctionnalités avancées...');
    
    try {
      const response = await axios.get(`${API_BASE}/features/advanced`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ Fonctionnalités récupérées:', response.data.features?.length || 0);
        return { success: true, features: response.data.features || [] };
      } else {
        console.error('❌ Échec récupération features:', response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error('💥 Erreur récupération features:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async toggleFeature(token, featureId) {
    console.log(`🔄 Toggle feature: ${featureId}`);
    
    try {
      const response = await axios.patch(`${API_BASE}/features/${featureId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log(`✅ Feature ${featureId} toggle: ${response.data.enabled ? 'ON' : 'OFF'}`);
        return { 
          success: true, 
          featureId: response.data.featureId,
          enabled: response.data.enabled,
          preferences: response.data.preferences 
        };
      } else {
        console.error(`❌ Échec toggle ${featureId}:`, response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error(`💥 Erreur toggle ${featureId}:`, error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async updateAllPreferences(token, preferences) {
    console.log('📝 Mise à jour préférences complètes...');
    
    try {
      const response = await axios.put(`${API_BASE}/features/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ Préférences mises à jour');
        return { success: true, preferences: response.data.preferences };
      } else {
        console.error('❌ Échec mise à jour préférences:', response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error('💥 Erreur mise à jour préférences:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async getFeatureStats(token) {
    console.log('📈 Récupération statistiques features...');
    
    try {
      const response = await axios.get(`${API_BASE}/features/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ Stats features récupérées');
        return { success: true, stats: response.data.stats, preferences: response.data.preferences };
      } else {
        console.error('❌ Échec récupération stats:', response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error('💥 Erreur récupération stats:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async resetFeatures(token) {
    console.log('🔄 Reset préférences features...');
    
    try {
      const response = await axios.post(`${API_BASE}/features/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ Features resetées');
        return { success: true, preferences: response.data.preferences };
      } else {
        console.error('❌ Échec reset features:', response.data);
        return { success: false, error: response.data, status: response.status };
      }
      
    } catch (error) {
      console.error('💥 Erreur reset features:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }
}

// Tests Jest
describe('🎮 FONCTIONNALITÉS AVANCÉES E2E HTTP-PURE', () => {
  let userToken = null;
  let userId = null;

  // Setup utilisateur pour tous les tests
  beforeAll(async () => {
    console.log('\n🚀 === SETUP FEATURES E2E ===');
    
    const registration = await FeaturesHelpers.registerUser();
    expect(registration.success).toBe(true);
    expect(registration.token).toBeDefined();
    
    userToken = registration.token;
    userId = registration.user.id;
    
    console.log(`✅ Utilisateur features créé: ${registration.userData.pseudo}`);
    console.log(`🎫 Token: ${userToken.substring(0, 20)}...`);
  }, TEST_TIMEOUT);

  describe('📊 RÉCUPÉRATION FONCTIONNALITÉS AVANCÉES', () => {
    test('GET /api/features/advanced - Récupération initiale', async () => {
      const result = await FeaturesHelpers.getAdvancedFeatures(userToken);
      
      expect(result.success).toBe(true);
      expect(result.features).toBeDefined();
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.features.length).toBeGreaterThan(0);
      
      // Vérifier la structure des features
      const feature = result.features[0];
      expect(feature).toHaveProperty('id');
      expect(feature).toHaveProperty('name');
      expect(feature).toHaveProperty('description');
      expect(feature).toHaveProperty('enabled');
      
      // Vérifier que les features attendues sont présentes
      const featureIds = result.features.map(f => f.id);
      expect(featureIds).toContain('analytics');
      expect(featureIds).toContain('notifications');
      expect(featureIds).toContain('eco');
      expect(featureIds).toContain('gaming');
      
      console.log('✅ Structure features validée');
    }, TEST_TIMEOUT);
  });

  describe('🔄 TOGGLE FONCTIONNALITÉS', () => {
    test('PATCH /api/features/analytics/toggle - Toggle Analytics', async () => {
      // État initial
      const initialFeatures = await FeaturesHelpers.getAdvancedFeatures(userToken);
      expect(initialFeatures.success).toBe(true);
      
      const analytics = initialFeatures.features.find(f => f.id === 'analytics');
      expect(analytics).toBeDefined();
      const initialState = analytics.enabled;
      
      // Toggle
      const toggleResult = await FeaturesHelpers.toggleFeature(userToken, 'analytics');
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.featureId).toBe('analytics');
      expect(toggleResult.enabled).toBe(!initialState);
      
      // Vérification persistance
      await new Promise(resolve => setTimeout(resolve, 500)); // Attendre sauvegarde
      
      const finalFeatures = await FeaturesHelpers.getAdvancedFeatures(userToken);
      expect(finalFeatures.success).toBe(true);
      
      const finalAnalytics = finalFeatures.features.find(f => f.id === 'analytics');
      expect(finalAnalytics.enabled).toBe(!initialState);
      
      console.log(`✅ Analytics toggle: ${initialState} → ${!initialState}`);
    }, TEST_TIMEOUT);

    test('PATCH /api/features/notifications/toggle - Toggle Notifications', async () => {
      const initialFeatures = await FeaturesHelpers.getAdvancedFeatures(userToken);
      const notifications = initialFeatures.features.find(f => f.id === 'notifications');
      const initialState = notifications.enabled;
      
      const toggleResult = await FeaturesHelpers.toggleFeature(userToken, 'notifications');
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.enabled).toBe(!initialState);
      
      console.log(`✅ Notifications toggle: ${initialState} → ${!initialState}`);
    }, TEST_TIMEOUT);

    test('PATCH /api/features/eco/toggle - Toggle Eco Impact', async () => {
      const initialFeatures = await FeaturesHelpers.getAdvancedFeatures(userToken);
      const eco = initialFeatures.features.find(f => f.id === 'eco');
      const initialState = eco.enabled;
      
      const toggleResult = await FeaturesHelpers.toggleFeature(userToken, 'eco');
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.enabled).toBe(!initialState);
      
      console.log(`✅ Eco toggle: ${initialState} → ${!initialState}`);
    }, TEST_TIMEOUT);

    test('PATCH /api/features/gaming/toggle - Toggle Gaming', async () => {
      const initialFeatures = await FeaturesHelpers.getAdvancedFeatures(userToken);
      const gaming = initialFeatures.features.find(f => f.id === 'gaming');
      const initialState = gaming.enabled;
      
      const toggleResult = await FeaturesHelpers.toggleFeature(userToken, 'gaming');
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.enabled).toBe(!initialState);
      
      console.log(`✅ Gaming toggle: ${initialState} → ${!initialState}`);
    }, TEST_TIMEOUT);

    test('PATCH /api/features/invalid/toggle - Feature invalide', async () => {
      const toggleResult = await FeaturesHelpers.toggleFeature(userToken, 'invalidfeature');
      expect(toggleResult.success).toBe(false);
      expect(toggleResult.status).toBe(400);
      
      console.log('✅ Validation feature invalide OK');
    }, TEST_TIMEOUT);
  });

  describe('📝 GESTION PRÉFÉRENCES COMPLÈTES', () => {
    test('PUT /api/features/preferences - Mise à jour bulk', async () => {
      const newPreferences = {
        analytics: true,
        notifications: false,
        eco: true,
        gaming: false
      };
      
      const result = await FeaturesHelpers.updateAllPreferences(userToken, newPreferences);
      expect(result.success).toBe(true);
      expect(result.preferences).toMatchObject(newPreferences);
      
      // Vérification persistance
      const features = await FeaturesHelpers.getAdvancedFeatures(userToken);
      expect(features.success).toBe(true);
      
      const analyticsFeature = features.features.find(f => f.id === 'analytics');
      const notificationsFeature = features.features.find(f => f.id === 'notifications');
      
      expect(analyticsFeature.enabled).toBe(true);
      expect(notificationsFeature.enabled).toBe(false);
      
      console.log('✅ Mise à jour bulk validée');
    }, TEST_TIMEOUT);
  });

  describe('📈 STATISTIQUES FEATURES', () => {
    test('GET /api/features/stats - Récupération stats', async () => {
      const result = await FeaturesHelpers.getFeatureStats(userToken);
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      
      expect(result.stats).toHaveProperty('totalFeatures');
      expect(result.stats).toHaveProperty('activeFeatures');
      expect(result.stats).toHaveProperty('averageUsage');
      
      expect(result.stats.totalFeatures).toBeGreaterThan(0);
      expect(result.stats.activeFeatures).toBeGreaterThanOrEqual(0);
      expect(result.stats.averageUsage).toBeGreaterThanOrEqual(0);
      
      console.log(`✅ Stats: ${result.stats.activeFeatures}/${result.stats.totalFeatures} features actives`);
    }, TEST_TIMEOUT);
  });

  describe('🔄 RESET FONCTIONNALITÉS', () => {
    test('POST /api/features/reset - Reset préférences', async () => {
      const result = await FeaturesHelpers.resetFeatures(userToken);
      expect(result.success).toBe(true);
      expect(result.preferences).toBeDefined();
      
      // Vérifier que toutes les features sont activées par défaut
      Object.values(result.preferences).forEach(value => {
        expect(value).toBe(true);
      });
      
      // Vérification via GET
      const features = await FeaturesHelpers.getAdvancedFeatures(userToken);
      expect(features.success).toBe(true);
      
      features.features.forEach(feature => {
        expect(feature.enabled).toBe(true);
      });
      
      console.log('✅ Reset préférences validé');
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    console.log('\n🏁 === CLEANUP FEATURES E2E ===');
    console.log('✅ Tests fonctionnalités avancées terminés');
  });
});

module.exports = { FeaturesHelpers };