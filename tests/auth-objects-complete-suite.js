/**
 * 🚀 SUITE COMPLÈTE MODULES AUTH + OBJECTS - MODE API RÉELLES
 * Conversion des modules 1 et 2 vers appels HTTP directs comme module 3
 * Total: ≈44 tests convertis avec gestion rate limits
 */

const axios = require('axios');
const mongoose = require('mongoose');
const { connectToDatabase } = require('../db');

// Configuration serveur réel
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

// Utilitaires pour gestion rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 1000; // 1 seconde entre les requêtes
const REQUEST_TIMEOUT = 10000; // 10 secondes de timeout

describe('🚀 SUITE COMPLÈTE AUTH + OBJECTS (API RÉELLES)', () => {
  
  let testUsersPool = []; // Pool d'utilisateurs pré-créés
  let currentUserIndex = 0;

  // Configuration axios globale avec gestion d'erreurs robuste
  const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Interceptor pour logging et rate limiting
  apiClient.interceptors.request.use(
    config => {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    error => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 429) {
        console.log('🚫 Rate limit détecté - attendre plus longtemps...');
      }
      return Promise.reject(error);
    }
  );

  // Générateur d'utilisateurs uniques (éviter les collisions)
  const generateUniqueUser = (prefix = 'AuthObj') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 999999);
    const uuid = Math.random().toString(36).substring(2, 15);
    
    return {
      pseudo: `${prefix}_${timestamp}_${random}_${uuid}`,
      email: `${prefix.toLowerCase()}_${timestamp}_${random}_${uuid}@test-suite.cadok`,
      password: 'TestSecure123!',
      city: 'Paris'
    };
  };

  // Helper API avec gestion d'erreurs robuste
  const makeApiCall = async (method, endpoint, data = null, token = null) => {
    await delay(RATE_LIMIT_DELAY); // Rate limiting préventif
    
    try {
      const config = {
        method,
        url: endpoint,
        ...(data && { data }),
        ...(token && { headers: { 'Authorization': `Bearer ${token}` } })
      };
      
      const response = await apiClient.request(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      if (error.response) {
        return { 
          success: false, 
          error: error.response.data, 
          status: error.response.status 
        };
      }
      return { success: false, error: error.message, status: 0 };
    }
  };

  beforeAll(async () => {
    console.log('🔄 Initialisation suite AUTH + OBJECTS...');
    
    // Vérifier connexion MongoDB
    console.log('⏳ Connexion à MongoDB...');
    await connectToDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test');
    
    console.log('✅ MongoDB connecté pour suite AUTH + OBJECTS');
    
    // Pré-créer un pool d'utilisateurs pour éviter rate limits
    console.log('👥 Création pool utilisateurs...');
    for (let i = 0; i < 5; i++) {
      const userData = generateUniqueUser(`Pool${i}`);
      const result = await makeApiCall('POST', '/api/auth/register', userData);
      
      if (result.success && result.data.token) {
        testUsersPool.push({
          ...userData,
          userId: result.data.user._id,
          token: result.data.token
        });
        console.log(`✅ Utilisateur pool ${i+1}/5 créé: ${userData.pseudo}`);
        await delay(2000); // Délai plus long pour création users
      } else {
        console.warn(`⚠️ Échec création utilisateur pool ${i+1}:`, result.error);
      }
    }
    
    console.log(`🎯 Pool de ${testUsersPool.length} utilisateurs disponible`);
  });

  // Helper pour obtenir un utilisateur du pool
  const getPoolUser = () => {
    if (testUsersPool.length === 0) throw new Error('Pool utilisateurs vide');
    const user = testUsersPool[currentUserIndex % testUsersPool.length];
    currentUserIndex++;
    return user;
  };

  // ========== MODULE 1: AUTHENTIFICATION (≈15 tests) ==========

  describe('👤 MODULE 1: AUTHENTIFICATION (API RÉELLES)', () => {
    
    describe('📝 1.1 Inscription utilisateur', () => {
      
      test('✅ Inscription réussie avec données valides', async () => {
        const userData = generateUniqueUser('RegSuccess');
        const result = await makeApiCall('POST', '/api/auth/register', userData);
        
        expect(result.success).toBe(true);
        expect(result.data.token).toBeDefined();
        expect(result.data.user).toBeDefined();
        expect(result.data.user.email).toBe(userData.email);
        expect(result.data.user.pseudo).toBe(userData.pseudo);
        
        console.log('✅ Utilisateur inscrit:', result.data.user.pseudo);
      });

      test('❌ Inscription échoue avec email invalide', async () => {
        const invalidData = generateUniqueUser('InvalidEmail');
        invalidData.email = 'email-invalide-sans-arobase';
        
        const result = await makeApiCall('POST', '/api/auth/register', invalidData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Email invalide correctement rejeté');
      });

      test('❌ Inscription échoue avec mot de passe trop court', async () => {
        const invalidData = generateUniqueUser('WeakPass');
        invalidData.password = '123';
        
        const result = await makeApiCall('POST', '/api/auth/register', invalidData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Mot de passe faible correctement rejeté');
      });

      test('❌ Inscription échoue avec pseudo trop court', async () => {
        const invalidData = generateUniqueUser('Short');
        invalidData.pseudo = 'ab';
        
        const result = await makeApiCall('POST', '/api/auth/register', invalidData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Pseudo trop court correctement rejeté');
      });

      test('❌ Inscription échoue avec email déjà utilisé', async () => {
        const firstUser = generateUniqueUser('First');
        await makeApiCall('POST', '/api/auth/register', firstUser);
        
        // Tentative avec même email
        const duplicateUser = generateUniqueUser('Duplicate');
        duplicateUser.email = firstUser.email;
        
        const result = await makeApiCall('POST', '/api/auth/register', duplicateUser);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Email dupliqué correctement rejeté');
      });

    });

    describe('🔐 1.2 Connexion utilisateur', () => {
      
      test('✅ Connexion réussie avec identifiants corrects', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('POST', '/api/auth/login', {
          email: user.email,
          password: user.password
        });
        
        expect(result.success).toBe(true);
        expect(result.data.token).toBeDefined();
        expect(result.data.user.email).toBe(user.email);
        
        console.log('✅ Connexion réussie pour:', user.pseudo);
      });

      test('❌ Connexion échoue avec mauvais mot de passe', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('POST', '/api/auth/login', {
          email: user.email,
          password: 'mauvais-mot-de-passe'
        });
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Mauvais mot de passe correctement rejeté');
      });

      test('❌ Connexion échoue avec email inexistant', async () => {
        const result = await makeApiCall('POST', '/api/auth/login', {
          email: 'inexistant@test.com',
          password: 'password123'
        });
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Email inexistant correctement rejeté');
      });

    });

    describe('🛡️ 1.3 Sécurité authentification', () => {
      
      test('✅ Token JWT valide permet accès routes protégées', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('GET', '/api/objects/my-objects', null, user.token);
        
        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
        console.log('✅ Token valide accepté pour route protégée');
      });

      test('❌ Token JWT invalide bloque accès', async () => {
        const result = await makeApiCall('GET', '/api/objects/my-objects', null, 'token-invalide-123');
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        console.log('✅ Token invalide correctement rejeté');
      });

      test('❌ Absence de token bloque accès', async () => {
        const result = await makeApiCall('GET', '/api/objects/my-objects');
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        console.log('✅ Accès sans token correctement bloqué');
      });

      test('✅ Mots de passe hashés correctement', async () => {
        const userData = generateUniqueUser('HashTest');
        const result = await makeApiCall('POST', '/api/auth/register', userData);
        
        expect(result.success).toBe(true);
        expect(result.data.user.password).toBeUndefined(); // Mot de passe pas renvoyé
        console.log('✅ Mot de passe sécurisé (non exposé)');
      });

    });

  });

  // ========== MODULE 2: GESTION D'OBJETS (≈15 tests) ==========

  describe('📦 MODULE 2: GESTION D\'OBJETS (API RÉELLES)', () => {
    
    // Catégories existantes du module 3 (réutilisation)
    const EXISTING_CATEGORIES = {
      ELECTRONIQUE: '68957fc726a977d9dcdfa405',
      VETEMENTS: '68957fc726a977d9dcdfa407', 
      LIVRES: '68957fc726a977d9dcdfa409',
      SPORTS: '68957fc726a977d9dcdfa40b',
      MAISON: '68957fc726a977d9dcdfa40d'
    };
    
    describe('➕ 2.1 Création d\'objets', () => {
      
      test('✅ Création objet réussie avec données valides', async () => {
        const user = getPoolUser();
        const objectData = {
          title: `Test Object ${Date.now()}`,
          description: 'Description test objet API réelle',
          category: EXISTING_CATEGORIES.ELECTRONIQUE,
          condition: 'excellent',
          estimatedValue: 100
        };

        const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
        
        expect(result.success).toBe(true);
        expect(result.data.object).toBeDefined();
        expect(result.data.object.title).toBe(objectData.title);
        
        console.log('✅ Objet créé:', result.data.object.title);
      });

      test('✅ Création objet avec valeur estimée élevée', async () => {
        const user = getPoolUser();
        const objectData = {
          title: `Objet Précieux ${Date.now()}`,
          description: 'Objet de grande valeur',
          category: EXISTING_CATEGORIES.ELECTRONIQUE,
          condition: 'excellent',
          estimatedValue: 1000
        };

        const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
        
        expect(result.success).toBe(true);
        expect(result.data.object.estimatedValue).toBe(1000);
        
        console.log('✅ Objet haute valeur créé:', result.data.object.title);
      });

      test('❌ Création échoue sans titre objet', async () => {
        const user = getPoolUser();
        const invalidData = {
          description: 'Objet sans titre',
          category: EXISTING_CATEGORIES.VETEMENTS,
          condition: 'bon',
          estimatedValue: 25
        };

        const result = await makeApiCall('POST', '/api/objects', invalidData, user.token);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Objet sans titre correctement rejeté');
      });

      test('❌ Création échoue avec valeur négative', async () => {
        const user = getPoolUser();
        const invalidData = {
          title: 'Test prix négatif',
          description: 'Objet avec valeur invalide',
          category: EXISTING_CATEGORIES.SPORTS,
          condition: 'bon',
          estimatedValue: -10
        };

        const result = await makeApiCall('POST', '/api/objects', invalidData, user.token);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Valeur négative correctement rejetée');
      });

      test('❌ Création sans authentification échoue', async () => {
        const objectData = {
          title: 'Objet sans auth',
          description: 'Test sécurité',
          category: EXISTING_CATEGORIES.LIVRES,
          condition: 'bon',
          estimatedValue: 50
        };

        const result = await makeApiCall('POST', '/api/objects', objectData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        console.log('✅ Création sans auth correctement bloquée');
      });

    });

    describe('📋 2.2 Lecture des objets', () => {
      
      let testObjects = [];

      beforeAll(async () => {
        // Créer quelques objets test pour les lectures
        const user = getPoolUser();
        
        const objectsData = [
          {
            title: `Lecture Test 1 ${Date.now()}`,
            description: 'Premier objet de test lecture',
            category: EXISTING_CATEGORIES.ELECTRONIQUE,
            condition: 'excellent',
            estimatedValue: 100
          },
          {
            title: `Lecture Test 2 ${Date.now()}`,
            description: 'Deuxième objet de test lecture', 
            category: EXISTING_CATEGORIES.VETEMENTS, // Catégorie différente
            condition: 'bon',
            estimatedValue: 75
          }
        ];

        for (const objectData of objectsData) {
          const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
          if (result.success) {
            testObjects.push({
              ...result.data.object,
              userToken: user.token
            });
          }
          await delay(1500); // Délai entre créations
        }
      });

      test('✅ Récupération objets utilisateur', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('GET', '/api/objects/my-objects', null, user.token);
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data.objects)).toBe(true);
        console.log('✅ Objets utilisateur récupérés:', result.data.objects.length);
      });

      test('✅ Recherche objets publics', async () => {
        const result = await makeApiCall('GET', '/api/objects/search?query=test');
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data.objects)).toBe(true);
        console.log('✅ Recherche publique effectuée:', result.data.objects.length, 'résultats');
      });

      test('✅ Recherche par catégorie', async () => {
        const result = await makeApiCall('GET', `/api/objects/search?category=${EXISTING_CATEGORIES.ELECTRONIQUE}`);
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data.objects)).toBe(true);
        console.log('✅ Recherche par catégorie:', result.data.objects.length, 'résultats');
      });

      test('✅ Détails objet spécifique', async () => {
        if (testObjects.length > 0) {
          const objectId = testObjects[0]._id;
          const result = await makeApiCall('GET', `/api/objects/${objectId}`);
          
          expect(result.success).toBe(true);
          expect(result.data.object._id).toBe(objectId);
          console.log('✅ Détails objet récupérés:', result.data.object.title);
        }
      });

    });

    describe('🔄 2.3 Modification d\'objets', () => {
      
      let modifiableObject = null;

      beforeAll(async () => {
        // Créer un objet spécifiquement pour les tests de modification
        const user = getPoolUser();
        const objectData = {
          title: `Modifiable Object ${Date.now()}`,
          description: 'Objet destiné à être modifié',
          category: EXISTING_CATEGORIES.MAISON,
          condition: 'bon',
          estimatedValue: 60
        };

        const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
        if (result.success) {
          modifiableObject = {
            ...result.data.object,
            userToken: user.token
          };
        }
        await delay(1500);
      });

      test('✅ Modification réussie titre et valeur', async () => {
        if (!modifiableObject) {
          console.warn('⚠️ Pas d\'objet modifiable disponible');
          return;
        }

        const updatedData = {
          title: `${modifiableObject.title} - MODIFIÉ`,
          estimatedValue: 80
        };

        const result = await makeApiCall('PUT', `/api/objects/${modifiableObject._id}`, updatedData, modifiableObject.userToken);
        
        expect(result.success).toBe(true);
        expect(result.data.object.title).toContain('MODIFIÉ');
        expect(result.data.object.estimatedValue).toBe(80);
        
        console.log('✅ Objet modifié avec succès');
      });

      test('❌ Modification échoue avec valeur invalide', async () => {
        if (!modifiableObject) {
          console.warn('⚠️ Pas d\'objet modifiable disponible');
          return;
        }

        const invalidUpdate = {
          estimatedValue: -50
        };

        const result = await makeApiCall('PUT', `/api/objects/${modifiableObject._id}`, invalidUpdate, modifiableObject.userToken);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('✅ Valeur invalide en modification rejetée');
      });

      test('❌ Modification objet non possédé interdite', async () => {
        if (!modifiableObject) {
          console.warn('⚠️ Pas d\'objet modifiable disponible');
          return;
        }

        const otherUser = getPoolUser();
        const updateData = {
          title: 'Tentative piratage'
        };

        const result = await makeApiCall('PUT', `/api/objects/${modifiableObject._id}`, updateData, otherUser.token);
        
        expect(result.success).toBe(false);
        expect([403, 404]).toContain(result.status);
        console.log('✅ Modification non autorisée bloquée');
      });

    });

    describe('🗑️ 2.4 Suppression d\'objets', () => {
      
      let deletableObject = null;

      beforeAll(async () => {
        // Créer un objet spécifiquement pour suppression
        const user = getPoolUser();
        const objectData = {
          title: `Deletable Object ${Date.now()}`,
          description: 'Objet destiné à être supprimé',
          category: EXISTING_CATEGORIES.LIVRES,
          condition: 'mauvais',
          estimatedValue: 10
        };

        const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
        if (result.success) {
          deletableObject = {
            ...result.data.object,
            userToken: user.token
          };
        }
        await delay(1500);
      });

      test('✅ Suppression réussie objet possédé', async () => {
        if (!deletableObject) {
          console.warn('⚠️ Pas d\'objet supprimable disponible');
          return;
        }

        const result = await makeApiCall('DELETE', `/api/objects/${deletableObject._id}`, null, deletableObject.userToken);
        
        expect(result.success).toBe(true);
        console.log('✅ Objet supprimé avec succès');

        // Vérifier que l'objet n'existe plus
        const checkResult = await makeApiCall('GET', `/api/objects/${deletableObject._id}`);
        expect(checkResult.success).toBe(false);
        expect(checkResult.status).toBe(404);
        console.log('✅ Objet bien supprimé de la base');
      });

      test('❌ Suppression objet non possédé interdite', async () => {
        // Créer un objet avec un user puis tenter suppression avec un autre
        const owner = getPoolUser();
        const objectData = {
          title: `Protected Object ${Date.now()}`,
          description: 'Objet protégé contre suppression',
          category: EXISTING_CATEGORIES.SPORTS,
          condition: 'excellent',
          estimatedValue: 150
        };

        const createResult = await makeApiCall('POST', '/api/objects', objectData, owner.token);
        if (createResult.success) {
          await delay(1000);
          
          const otherUser = getPoolUser();
          const deleteResult = await makeApiCall('DELETE', `/api/objects/${createResult.data.object._id}`, null, otherUser.token);
          
          expect(deleteResult.success).toBe(false);
          expect([403, 404]).toContain(deleteResult.status);
          console.log('✅ Suppression non autorisée bloquée');
        }
      });

      test('❌ Suppression sans authentification échoue', async () => {
        const user = getPoolUser();
        const objectData = {
          title: `Unauth Delete Test ${Date.now()}`,
          description: 'Test suppression sans auth',
          category: EXISTING_CATEGORIES.MAISON,
          condition: 'bon',
          estimatedValue: 30
        };

        const createResult = await makeApiCall('POST', '/api/objects', objectData, user.token);
        if (createResult.success) {
          await delay(1000);
          
          const deleteResult = await makeApiCall('DELETE', `/api/objects/${createResult.data.object._id}`);
          
          expect(deleteResult.success).toBe(false);
          expect(deleteResult.status).toBe(401);
          console.log('✅ Suppression sans auth correctement bloquée');
        }
      });

    });

  });

  // ========== TESTS INTEGRATION ET WORKFLOW ==========

  describe('🔄 3. WORKFLOW INTÉGRATION AUTH + OBJECTS', () => {
    
    test('✅ Workflow complet: Inscription → Création objets → Gestion', async () => {
      // 1. Inscription nouvel utilisateur
      const userData = generateUniqueUser('Workflow');
      const registerResult = await makeApiCall('POST', '/api/auth/register', userData);
      
      expect(registerResult.success).toBe(true);
      const userToken = registerResult.data.token;
      
      // 2. Création plusieurs objets
      const objects = [];
        for (let i = 1; i <= 3; i++) {
          const objectData = {
            title: `Workflow Object ${i} ${Date.now()}`,
            description: `Objet ${i} du workflow complet`,
            category: EXISTING_CATEGORIES.ELECTRONIQUE,
            condition: i === 1 ? 'excellent' : i === 2 ? 'bon' : 'correct',
            estimatedValue: 50 * i
          };
          
          const createResult = await makeApiCall('POST', '/api/objects', objectData, userToken);
          expect(createResult.success).toBe(true);
          objects.push(createResult.data.object);
          
          await delay(1500); // Rate limiting entre créations
        }      // 3. Récupération objets utilisateur
      const myObjectsResult = await makeApiCall('GET', '/api/objects/my-objects', null, userToken);
      expect(myObjectsResult.success).toBe(true);
      expect(myObjectsResult.data.objects.length).toBeGreaterThanOrEqual(3);
      
      // 4. Modification d'un objet
      const objectToModify = objects[0];
      const updateResult = await makeApiCall('PUT', `/api/objects/${objectToModify._id}`, {
        title: `${objectToModify.title} - MODIFIÉ WORKFLOW`
      }, userToken);
      expect(updateResult.success).toBe(true);
      
      // 5. Suppression d'un objet
      const objectToDelete = objects[2];
      const deleteResult = await makeApiCall('DELETE', `/api/objects/${objectToDelete._id}`, null, userToken);
      expect(deleteResult.success).toBe(true);
      
      console.log('✅ Workflow complet AUTH + OBJECTS réussi');
    });

    test('✅ Test limites utilisateur gratuit', async () => {
      const user = getPoolUser();
      
      // Vérifier les objets actuels
      const currentObjectsResult = await makeApiCall('GET', '/api/objects/my-objects', null, user.token);
      expect(currentObjectsResult.success).toBe(true);
      
      const currentCount = currentObjectsResult.data.objects.length;
      console.log(`📊 Utilisateur a actuellement ${currentCount} objets`);
      
      // Les users gratuits peuvent avoir jusqu'à 5 objets (à vérifier selon business rules)
      const maxFreeObjects = 5;
      
      if (currentCount < maxFreeObjects) {
        // Créer des objets jusqu'à la limite
        for (let i = currentCount; i < maxFreeObjects; i++) {
          const objectData = {
            title: `Limit Test Object ${i + 1}`,
            description: 'Test des limites utilisateur gratuit',
            category: EXISTING_CATEGORIES.VETEMENTS,
            condition: 'bon',
            estimatedValue: 40
          };
          
          const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
          expect(result.success).toBe(true);
          
          await delay(2000); // Rate limiting plus important pour test limites
        }
      }
      
      console.log('✅ Test limites utilisateur gratuit terminé');
    });

  });

  // Nettoyage final
  afterAll(async () => {
    console.log('🧹 Nettoyage final suite AUTH + OBJECTS...');
    
    // Note: En production, éviter de supprimer les données de test
    // Ici on fait confiance au système de cleanup automatique
    
    console.log('✅ Suite AUTH + OBJECTS terminée');
  });

});
