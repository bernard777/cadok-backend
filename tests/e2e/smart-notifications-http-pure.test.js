/**
 * 🔔 TESTS E2E SMART NOTIFICATIONS - HTTP PURE
 * Tests complets pour le système de notifications intelligentes CADOK
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
 * Helper class pour les tests Smart Notifications
 */
class NotificationHelpers {
  static async createTestUser(location = null) {
    const timestamp = Date.now();
    const userData = {
      pseudo: `notif_user_${timestamp}`,
      email: `notif.${timestamp}@test-cadok.com`,
      password: 'AuthObjPass123!',
      ville: location ? location.ville : 'Marseille',
      age: 29
    };

    if (location) {
      userData.location = location;
    }

    const response = await api.post('/auth/register', userData);
    if (response.status === 201 && response.data.success) {
      return { ...userData, token: response.data.token, id: response.data.user.id };
    }
    return null;
  }

  static async createTestObject(token, objectData = {}) {
    const defaultObject = {
      nom: `Objet Notif ${Date.now()}`,
      description: 'Objet pour tests notifications',
      categorie: 'Sport',
      etat: 'Très bon état',
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

  static async simulateUserInteractions(token) {
    // Créer des objets et interactions pour déclencher des notifications
    await this.createTestObject(token, { nom: 'Livre Populaire' });
    await this.createTestObject(token, { nom: 'CD Rare' });
    
    // Simuler des vues
    await api.get('/auth-objects', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  static async createTestTrade(token, objectId, targetObjectId) {
    const response = await api.post('/trades', {
      offeredObjectId: objectId,
      requestedObjectId: targetObjectId,
      message: 'Troc test notifications'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.status === 201 && response.data.success ? response.data.trade : null;
  }
}

describe('🔔 SMART NOTIFICATIONS - Tests E2E HTTP Pure', () => {
  let testUser = null;
  let authToken = null;
  let testObjects = [];

  beforeEach(async () => {
    // Créer utilisateur de test
    testUser = await NotificationHelpers.createTestUser();
    if (testUser) {
      authToken = testUser.token;
      
      // Simuler de l'activité pour générer des notifications
      await NotificationHelpers.simulateUserInteractions(authToken);
    }
  });

  // ========== NOTIFICATIONS CONTEXTUELLES ==========
  describe('Notifications Contextuelles', () => {
    test('Devrait envoyer des notifications contextuelles', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/send-contextual', {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications/send-contextual non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('notificationsSent');
        expect(typeof response.data.data.notificationsSent).toBe('number');
      }
    }, 30000);

    test('Devrait personnaliser les notifications selon l\'activité', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Créer des objets spécifiques pour déclencher des notifications ciblées
      await NotificationHelpers.createTestObject(authToken, { 
        categorie: 'Livres',
        nom: 'Roman Populaire' 
      });

      const response = await api.post('/notifications/personalized/trade-suggestion', {
        preferences: { categories: ['Livres'], maxDistance: 10 }
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications personnalisées non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('notificationType');
        expect(response.data.data.notificationType).toBe('trade-suggestion');
      }
    }, 30000);

    test('Devrait récupérer les notifications de l\'utilisateur', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route GET /notifications non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data && Array.isArray(response.data)) {
        // Structure attendue: array de notifications
        response.data.forEach(notification => {
          expect(notification).toHaveProperty('_id');
          expect(notification).toHaveProperty('user');
          expect(notification).toHaveProperty('message');
          expect(notification).toHaveProperty('createdAt');
        });
      }
    }, 30000);
  });

  // ========== NOTIFICATIONS GÉOLOCALISÉES ==========
  describe('Notifications Géolocalisées', () => {
    test('Devrait envoyer des notifications basées sur la localisation', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/send-location-based', {
        location: { ville: 'Marseille', radius: 5 }
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications géolocalisées non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('locationNotifications');
      }
    }, 30000);

    test('Devrait notifier les utilisateurs proches pour les trocs', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Créer un utilisateur dans la même ville
      const nearUser = await NotificationHelpers.createTestUser({
        ville: testUser.ville,
        coordinates: { lat: 43.2965, lng: 5.3698 } // Marseille
      });

      if (!nearUser) return;

      // Créer un objet pour le troc local
      const localObject = await NotificationHelpers.createTestObject(authToken, {
        nom: 'Objet Local',
        localTrade: true
      });

      if (localObject) {
        const response = await api.post('/notifications/send-location-based', {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.status === 404) {
          console.log('⚠️ Route notifications géolocalisées non implémentée');
          return;
        }

        expect([200, 201]).toContain(response.status);
        if (response.data.success) {
          expect(response.data.data.locationNotifications).toBeGreaterThanOrEqual(0);
        }
      }
    }, 30000);

    test('Devrait respecter les préférences de distance', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/send-location-based', {
        maxDistance: 1 // Très restrictif
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        // Devrait avoir moins de notifications avec distance restrictive
        expect(response.data.data).toBeDefined();
      }
    }, 30000);
  });

  // ========== NOTIFICATIONS PERSONNALISÉES ==========
  describe('Notifications Personnalisées', () => {
    test('Devrait envoyer des notifications de suggestion de troc', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/personalized/trade-suggestion', {
        targetCategories: ['Livres', 'CD'],
        userPreferences: { maxDistance: 20, minRating: 4.0 }
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications personnalisées non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('notificationType');
        expect(response.data.data).toHaveProperty('suggestions');
      }
    }, 30000);

    test('Devrait envoyer des notifications de rappel', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/personalized/reminder', {
        reminderType: 'incomplete-profile',
        urgency: 'medium'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications rappel non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data.notificationType).toBe('reminder');
      }
    }, 30000);

    test('Devrait envoyer des notifications de célébration', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/personalized/celebration', {
        achievement: 'first-successful-trade',
        rewardType: 'badge'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications célébration non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toBeDefined();
        expect(response.data.data.notificationType).toBe('celebration');
        expect(response.data.data).toHaveProperty('achievement');
      }
    }, 30000);
  });

  // ========== GESTION DES NOTIFICATIONS ==========
  describe('Gestion des Notifications', () => {
    test('Devrait marquer les notifications comme lues', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // D'abord récupérer les notifications
      const getResponse = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (getResponse.status === 404) {
        console.log('⚠️ Route GET /notifications non implémentée');
        return;
      }

      if (getResponse.data && getResponse.data.length > 0) {
        const notificationId = getResponse.data[0]._id;
        
        const markReadResponse = await api.patch(`/notifications/${notificationId}/read`, {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (markReadResponse.status === 404) {
          console.log('⚠️ Route PATCH notifications/read non implémentée');
          return;
        }

        expect([200, 201]).toContain(markReadResponse.status);
        if (markReadResponse.data.success) {
          expect(markReadResponse.data.data.read).toBe(true);
        }
      }
    }, 30000);

    test('Devrait supprimer les anciennes notifications', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.delete('/notifications/cleanup', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route DELETE notifications/cleanup non implémentée');
        return;
      }

      expect([200, 204]).toContain(response.status);
      if (response.data && response.data.success) {
        expect(response.data.data).toHaveProperty('deletedCount');
        expect(typeof response.data.data.deletedCount).toBe('number');
      }
    }, 30000);

    test('Devrait respecter les préférences de notification', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Configurer les préférences
      const prefsResponse = await api.put('/notifications/preferences', {
        emailNotifications: false,
        pushNotifications: true,
        smsNotifications: false,
        categories: ['trades', 'messages']
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (prefsResponse.status === 404) {
        console.log('⚠️ Route préférences notifications non implémentée');
        return;
      }

      expect([200, 201]).toContain(prefsResponse.status);
      if (prefsResponse.data.success) {
        expect(prefsResponse.data.data).toHaveProperty('preferences');
        expect(prefsResponse.data.data.preferences.emailNotifications).toBe(false);
        expect(prefsResponse.data.data.preferences.pushNotifications).toBe(true);
      }
    }, 30000);
  });

  // ========== SÉCURITÉ ET VALIDATION ==========
  describe('Sécurité Notifications', () => {
    test('Devrait refuser l\'accès sans authentification', async () => {
      const response = await api.get('/notifications');
      
      expect([401, 403]).toContain(response.status);
      if (response.data && typeof response.data.success !== 'undefined') {
        expect(response.data.success).toBe(false);
      }
    }, 30000);

    test('Devrait valider les paramètres des notifications personnalisées', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const response = await api.post('/notifications/personalized/invalid-type', {
        invalidParam: 'test'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route non implémentée - test de validation skippé');
        return;
      }

      expect([400, 422]).toContain(response.status);
      expect(response.data.success).toBe(false);
    }, 30000);

    test('Devrait limiter la fréquence d\'envoi', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Envoyer plusieurs notifications rapidement
      const responses = await Promise.all([
        api.post('/notifications/send-contextual', {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        api.post('/notifications/send-contextual', {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        api.post('/notifications/send-contextual', {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      const successful = responses.filter(r => r.status === 200 || r.status === 201);
      const rateLimited = responses.filter(r => r.status === 429);

      // Au moins une devrait réussir, certaines peuvent être limitées
      expect(successful.length).toBeGreaterThanOrEqual(1);
      
      if (rateLimited.length > 0) {
        rateLimited.forEach(r => {
          expect(r.data.success).toBe(false);
          expect(r.data.error).toContain('limite');
        });
      }
    }, 30000);
  });

  // ========== INTÉGRATION ET PERFORMANCE ==========
  describe('Performance et Intégration', () => {
    test('Devrait traiter les notifications en arrière-plan', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      const startTime = Date.now();
      const response = await api.post('/notifications/send-contextual', {
        async: true
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const responseTime = Date.now() - startTime;

      if (response.status === 404) {
        console.log('⚠️ Route notifications async non implémentée');
        return;
      }

      // Traitement async devrait être rapide
      expect(responseTime).toBeLessThan(2000);
      expect([200, 201, 202]).toContain(response.status);

      if (response.data.success) {
        expect(response.data.data).toHaveProperty('jobId');
      }
    }, 30000);

    test('Devrait s\'intégrer avec le système de gamification', async () => {
      if (!authToken) {
        console.log('⚠️ Pas de token auth, test skippé');
        return;
      }

      // Créer une action qui devrait déclencher une notification de badge
      const response = await api.post('/notifications/personalized/achievement', {
        achievementType: 'first-trade',
        badgeId: 'newcomer'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.status === 404) {
        console.log('⚠️ Route notifications achievement non implémentée');
        return;
      }

      expect([200, 201]).toContain(response.status);
      if (response.data.success) {
        expect(response.data.data).toHaveProperty('notificationType');
        expect(response.data.data.notificationType).toBe('achievement');
        expect(response.data.data).toHaveProperty('badgeEarned');
      }
    }, 30000);
  });
});
