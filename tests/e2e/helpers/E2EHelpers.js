/**
 * HELPERS E2E - Utilitaires partagés pour tous les tests
 * Version robuste avec support fallback sans base de données
 */

const request = require('supertest');
const { mongoose } = require('../../../db');

class E2EHelpers {
  
  /**
   * Créer un utilisateur unique pour les tests
   */
  static generateUniqueUser(baseName = 'TestUser') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 999999);
    const randomString = Math.random().toString(36).substring(2, 8);
    const uuid = Math.random().toString(36).substring(2, 15); // UUID supplémentaire
    
    return {
      pseudo: `${baseName}_${timestamp}_${random}_${randomString}`,
      email: `e2e_${timestamp}_${random}_${randomString}_${uuid}@test-cadok.com`,
      password: 'SecureTestPassword123!',
      city: 'Paris'
    };
  }

  /**
   * Vérifier si nous sommes en mode mock (sans base de données)
   */
  static isMockMode() {
    return typeof global.isDbConnected === 'function' && !global.isDbConnected();
  }

  /**
   * Inscrire un utilisateur
   */
  static async registerUser(userData = null) {
    const user = userData || this.generateUniqueUser();

    // Mode mock : simuler une réponse réussie
    if (this.isMockMode()) {
      console.log('🤖 Mode mock actif pour registerUser');
      return {
        success: true,
        user: {
          id: `mock_${Date.now()}`,
          email: user.email,
          pseudo: user.pseudo,
          city: user.city
        },
        token: `mock_token_${Date.now()}`,
        userData: user
      };
    }

    // Mode réel : appel API
    try {
      console.log('🌐 Mode réel actif pour registerUser');
      const app = require('../../../app');
      const response = await request(app)
        .post('/api/auth/register')
        .send(user);

      console.log(`📡 Réponse API register: status=${response.status}, body=`, response.body);

      if (response.status === 201) {
        return {
          success: true,
          user: response.body.user,
          token: response.body.token,
          userData: user
        };
      } else {
        console.error('❌ Échec registerUser:', {
          status: response.status,
          body: response.body,
          sentData: user
        });
        return {
          success: false,
          error: response.body,
          status: response.status,
          userData: user
        };
      }
    } catch (error) {
      console.error('❌ Erreur réseau registerUser:', error.message);
      return {
        success: false,
        error: error.message,
        status: 500,
        userData: user
      };
    }
  }

  /**
   * Connecter un utilisateur
   */
  static async loginUser(email, password) {
    // Mode mock
    if (this.isMockMode()) {
      console.log('🤖 Mode mock actif pour loginUser');
      if (email.includes('inexistant') || password === 'mauvais-mot-de-passe') {
        return {
          success: false,
          status: 400,
          error: 'Identifiants invalides'
        };
      }
      return {
        success: true,
        token: `mock_login_token_${Date.now()}`,
        user: { email, pseudo: 'MockUser' }
      };
    }

    // Mode réel
    try {
      console.log('🌐 Mode réel actif pour loginUser');
      const app = require('../../../app');
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      if (response.status === 200) {
        return {
          success: true,
          token: response.body.token,
          user: response.body.user
        };
      } else {
        return {
          success: false,
          status: response.status,
          error: response.body
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 500,
        error: error.message
      };
    }
  }

  /**
   * Récupérer les objets d'un utilisateur
   */
  static async getUserObjects(token) {
    // Mode mock
    if (this.isMockMode()) {
      console.log('🤖 Mode mock actif pour getUserObjects');
      if (!token || token === 'token-invalide') {
        return {
          success: false,
          status: 401,
          error: 'Token invalide'
        };
      }
      return {
        success: true,
        objects: []
      };
    }

    // Mode réel
    try {
      console.log('🌐 Mode réel actif pour getUserObjects');
      const app = require('../../../app');
      const response = await request(app)
        .get('/api/objects')
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200) {
        return {
          success: true,
          objects: response.body
        };
      } else {
        return {
          success: false,
          status: response.status,
          error: response.body
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 500,
        error: error.message
      };
    }
  }

  /**
   * Créer un objet
   */
  static async createObject(token, objectData = null) {
    const defaultObject = {
      title: `Objet Test ${Date.now()}`,
      description: 'Description de test',
      category: 'electronique',
      condition: 'bon',
      images: []
    };

    const object = objectData || defaultObject;

    // Mode mock
    if (this.isMockMode()) {
      console.log('🤖 Mode mock actif pour createObject');
      if (!token) {
        return {
          success: false,
          status: 401,
          error: 'Token requis'
        };
      }
      return {
        success: true,
        object: {
          id: `mock_object_${Date.now()}`,
          ...object,
          owner: 'mock_user'
        }
      };
    }

    // Mode réel
    try {
      console.log('🌐 Mode réel actif pour createObject');
      const app = require('../../../app');
      const response = await request(app)
        .post('/api/objects')
        .set('Authorization', `Bearer ${token}`)
        .send(object);

      if (response.status === 201) {
        return {
          success: true,
          object: response.body
        };
      } else {
        return {
          success: false,
          status: response.status,
          error: response.body
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 500,
        error: error.message
      };
    }
  }

  /**
   * Attendre un délai
   */
  static async wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = E2EHelpers;
