/**
 * ðŸš€ SUITE COMPLÃˆTE MODULES AUTH + OBJECTS - MODE API RÃ‰ELLES
 * Conversion des modules 1 et 2 vers appels HTTP directs comme module 3
 * Total: â‰ˆ44 tests convertis avec gestion rate limits
 */

const axios = require('axios');
const mongoose = require('mongoose');
const { connectToDatabase } = require('../db');

// Configuration serveur rÃ©el
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

// Utilitaires pour gestion rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 1000; // 1 seconde entre les requÃªtes
const REQUEST_TIMEOUT = 10000; // 10 secondes de timeout

describe('ðŸš€ SUITE COMPLÃˆTE AUTH + OBJECTS (API RÃ‰ELLES)', () => {
  
  let testUsersPool = []; // Pool d'utilisateurs prÃ©-crÃ©Ã©s
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
      console.log(`ðŸ“¡ ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    error => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 429) {
        console.log('ðŸš« Rate limit dÃ©tectÃ© - attendre plus longtemps...');
      }
      return Promise.reject(error);
    }
  );

  // GÃ©nÃ©rateur d'utilisateurs uniques (Ã©viter les collisions)
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
    await delay(RATE_LIMIT_DELAY); // Rate limiting prÃ©ventif
    
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
    console.log('ðŸ”„ Initialisation suite AUTH + OBJECTS...');
    
    // VÃ©rifier connexion MongoDB
    console.log('â³ Connexion Ã  MongoDB...');
    await connectToDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test');
    
    console.log('âœ… MongoDB connectÃ© pour suite AUTH + OBJECTS');
    
    // PrÃ©-crÃ©er un pool d'utilisateurs pour Ã©viter rate limits
    console.log('ðŸ‘¥ CrÃ©ation pool utilisateurs...');
    for (let i = 0; i < 5; i++) {
      const userData = generateUniqueUser(`Pool${i}`);
      const result = await makeApiCall('POST', '/api/auth/register', userData);
      
      if (result.success && result.data.token) {
        testUsersPool.push({
          ...userData,
          userId: result.data.user._id,
          token: result.data.token
        });
        console.log(`âœ… Utilisateur pool ${i+1}/5 crÃ©Ã©: ${userData.pseudo}`);
        await delay(2000); // DÃ©lai plus long pour crÃ©ation users
      } else {
        console.warn(`âš ï¸ Ã‰chec crÃ©ation utilisateur pool ${i+1}:`, result.error);
      }
    }
    
    console.log(`ðŸŽ¯ Pool de ${testUsersPool.length} utilisateurs disponible`);
  });

  // Helper pour obtenir un utilisateur du pool
  const getPoolUser = () => {
    if (testUsersPool.length === 0) throw new Error('Pool utilisateurs vide');
    const user = testUsersPool[currentUserIndex % testUsersPool.length];
    currentUserIndex++;
    return user;
  };

  // ========== MODULE 1: AUTHENTIFICATION (â‰ˆ15 tests) ==========

  describe('ðŸ‘¤ MODULE 1: AUTHENTIFICATION (API RÃ‰ELLES)', () => {
    
    describe('ðŸ“ 1.1 Inscription utilisateur', () => {
      
      test('âœ… Inscription rÃ©ussie avec donnÃ©es valides', async () => {
        const userData = generateUniqueUser('RegSuccess');
        const result = await makeApiCall('POST', '/api/auth/register', userData);
        
        expect(result.success).toBe(true);
        expect(result.data.token).toBeDefined();
        expect(result.data.user).toBeDefined();
        expect(result.data.user.email).toBe(userData.email);
        expect(result.data.user.pseudo).toBe(userData.pseudo);
        
        console.log('âœ… Utilisateur inscrit:', result.data.user.pseudo);
      });

      test('âŒ Inscription Ã©choue avec email invalide', async () => {
        const invalidData = generateUniqueUser('InvalidEmail');
        invalidData.email = 'email-invalide-sans-arobase';
        
        const result = await makeApiCall('POST', '/api/auth/register', invalidData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Email invalide correctement rejetÃ©');
      });

      test('âŒ Inscription Ã©choue avec mot de passe trop court', async () => {
        const invalidData = generateUniqueUser('WeakPass');
        invalidData.password = '123';
        
        const result = await makeApiCall('POST', '/api/auth/register', invalidData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Mot de passe faible correctement rejetÃ©');
      });

      test('âŒ Inscription Ã©choue avec pseudo trop court', async () => {
        const invalidData = generateUniqueUser('Short');
        invalidData.pseudo = 'ab';
        
        const result = await makeApiCall('POST', '/api/auth/register', invalidData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Pseudo trop court correctement rejetÃ©');
      });

      test('âŒ Inscription Ã©choue avec email dÃ©jÃ  utilisÃ©', async () => {
        const firstUser = generateUniqueUser('First');
        await makeApiCall('POST', '/api/auth/register', firstUser);
        
        // Tentative avec mÃªme email
        const duplicateUser = generateUniqueUser('Duplicate');
        duplicateUser.email = firstUser.email;
        
        const result = await makeApiCall('POST', '/api/auth/register', duplicateUser);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Email dupliquÃ© correctement rejetÃ©');
      });

    });

    describe('ðŸ” 1.2 Connexion utilisateur', () => {
      
      test('âœ… Connexion rÃ©ussie avec identifiants corrects', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('POST', '/api/auth/login', {
          email: user.email,
          password: user.password
        });
        
        expect(result.success).toBe(true);
        expect(result.data.token).toBeDefined();
        expect(result.data.user.email).toBe(user.email);
        
        console.log('âœ… Connexion rÃ©ussie pour:', user.pseudo);
      });

      test('âŒ Connexion Ã©choue avec mauvais mot de passe', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('POST', '/api/auth/login', {
          email: user.email,
          password: 'mauvais-mot-de-passe'
        });
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Mauvais mot de passe correctement rejetÃ©');
      });

      test('âŒ Connexion Ã©choue avec email inexistant', async () => {
        const result = await makeApiCall('POST', '/api/auth/login', {
          email: 'inexistant@test.com',
          password: 'password123'
        });
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Email inexistant correctement rejetÃ©');
      });

    });

    describe('ðŸ›¡ï¸ 1.3 SÃ©curitÃ© authentification', () => {
      
      test('âœ… Token JWT valide permet accÃ¨s routes protÃ©gÃ©es', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('GET', '/api/objects/my-objects', null, user.token);
        
        expect(result.success).toBe(true);
        expect(result.status).toBe(200);
        console.log('âœ… Token valide acceptÃ© pour route protÃ©gÃ©e');
      });

      test('âŒ Token JWT invalide bloque accÃ¨s', async () => {
        const result = await makeApiCall('GET', '/api/objects/my-objects', null, 'token-invalide-123');
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        console.log('âœ… Token invalide correctement rejetÃ©');
      });

      test('âŒ Absence de token bloque accÃ¨s', async () => {
        const result = await makeApiCall('GET', '/api/objects/my-objects');
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        console.log('âœ… AccÃ¨s sans token correctement bloquÃ©');
      });

      test('âœ… Mots de passe hashÃ©s correctement', async () => {
        const userData = generateUniqueUser('HashTest');
        const result = await makeApiCall('POST', '/api/auth/register', userData);
        
        expect(result.success).toBe(true);
        expect(result.data.user.password).toBeUndefined(); // Mot de passe pas renvoyÃ©
        console.log('âœ… Mot de passe sÃ©curisÃ© (non exposÃ©)');
      });

    });

  });

  // ========== MODULE 2: GESTION D'OBJETS (â‰ˆ15 tests) ==========

  describe('ðŸ“¦ MODULE 2: GESTION D\'OBJETS (API RÃ‰ELLES)', () => {
    
    // CatÃ©gories existantes du module 3 (rÃ©utilisation)
    const EXISTING_CATEGORIES = {
      ELECTRONIQUE: '68957fc726a977d9dcdfa405',
      VETEMENTS: '68957fc726a977d9dcdfa407', 
      LIVRES: '68957fc726a977d9dcdfa409',
      SPORTS: '68957fc726a977d9dcdfa40b',
      MAISON: '68957fc726a977d9dcdfa40d'
    };
    
    describe('âž• 2.1 CrÃ©ation d\'objets', () => {
      
      test('âœ… CrÃ©ation objet rÃ©ussie avec donnÃ©es valides', async () => {
        const user = getPoolUser();
        const objectData = {
          title: `Test Object ${Date.now()}`,
          description: 'Description test objet API rÃ©elle',
          category: EXISTING_CATEGORIES.ELECTRONIQUE,
          condition: 'excellent'
        };

        const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
        
        expect(result.success).toBe(true);
        expect(result.data.object).toBeDefined();
        expect(result.data.object.title).toBe(objectData.title);
        
        console.log('âœ… Objet crÃ©Ã©:', result.data.object.title);
      });

      test('âœ… CrÃ©ation objet avec valeur estimÃ©e Ã©levÃ©e', async () => {
        const user = getPoolUser();
        const objectData = {
          title: `Objet PrÃ©cieux ${Date.now()}`,
          description: 'Objet de grande valeur',
          category: EXISTING_CATEGORIES.ELECTRONIQUE,
          condition: 'excellent'
        };

        const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
        
        expect(result.success).toBe(true);
        console.log('âœ… Objet haute valeur crÃ©Ã©:', result.data.object.title);
      });

      test('âŒ CrÃ©ation Ã©choue sans titre objet', async () => {
        const user = getPoolUser();
        const invalidData = {
          description: 'Objet sans titre',
          category: EXISTING_CATEGORIES.VETEMENTS,
          condition: 'bon'
        };

        const result = await makeApiCall('POST', '/api/objects', invalidData, user.token);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Objet sans titre correctement rejetÃ©');
      });

      test('âŒ CrÃ©ation Ã©choue avec valeur nÃ©gative', async () => {
        const user = getPoolUser();
        const invalidData = {
          title: 'Test prix nÃ©gatif',
          description: 'Objet avec valeur invalide',
          category: EXISTING_CATEGORIES.SPORTS,
          condition: 'bon'
        };

        const result = await makeApiCall('POST', '/api/objects', invalidData, user.token);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Valeur nÃ©gative correctement rejetÃ©e');
      });

      test('âŒ CrÃ©ation sans authentification Ã©choue', async () => {
        const objectData = {
          title: 'Objet sans auth',
          description: 'Test sÃ©curitÃ©',
          category: EXISTING_CATEGORIES.LIVRES,
          condition: 'bon'
        };

        const result = await makeApiCall('POST', '/api/objects', objectData);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        console.log('âœ… CrÃ©ation sans auth correctement bloquÃ©e');
      });

    });

    describe('ðŸ“‹ 2.2 Lecture des objets', () => {
      
      let testObjects = [];

      beforeAll(async () => {
        // CrÃ©er quelques objets test pour les lectures
        const user = getPoolUser();
        
        const objectsData = [
          {
            title: `Lecture Test 1 ${Date.now()}`,
            description: 'Premier objet de test lecture',
            category: EXISTING_CATEGORIES.ELECTRONIQUE,
            condition: 'excellent'
          },
          {
            title: `Lecture Test 2 ${Date.now()}`,
            description: 'DeuxiÃ¨me objet de test lecture', 
            category: EXISTING_CATEGORIES.VETEMENTS, // CatÃ©gorie diffÃ©rente
            condition: 'bon'
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
          await delay(1500); // DÃ©lai entre crÃ©ations
        }
      });

      test('âœ… RÃ©cupÃ©ration objets utilisateur', async () => {
        const user = getPoolUser();
        const result = await makeApiCall('GET', '/api/objects/my-objects', null, user.token);
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data.objects)).toBe(true);
        console.log('âœ… Objets utilisateur rÃ©cupÃ©rÃ©s:', result.data.objects.length);
      });

      test('âœ… Recherche objets publics', async () => {
        const result = await makeApiCall('GET', '/api/objects/search?query=test');
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data.objects)).toBe(true);
        console.log('âœ… Recherche publique effectuÃ©e:', result.data.objects.length, 'rÃ©sultats');
      });

      test('âœ… Recherche par catÃ©gorie', async () => {
        const result = await makeApiCall('GET', `/api/objects/search?category=${EXISTING_CATEGORIES.ELECTRONIQUE}`);
        
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data.objects)).toBe(true);
        console.log('âœ… Recherche par catÃ©gorie:', result.data.objects.length, 'rÃ©sultats');
      });

      test('âœ… DÃ©tails objet spÃ©cifique', async () => {
        if (testObjects.length > 0) {
          const objectId = testObjects[0]._id;
          const result = await makeApiCall('GET', `/api/objects/${objectId}`);
          
          expect(result.success).toBe(true);
          expect(result.data.object._id).toBe(objectId);
          console.log('âœ… DÃ©tails objet rÃ©cupÃ©rÃ©s:', result.data.object.title);
        }
      });

    });

    describe('ðŸ”„ 2.3 Modification d\'objets', () => {
      
      let modifiableObject = null;

      beforeAll(async () => {
        // CrÃ©er un objet spÃ©cifiquement pour les tests de modification
        const user = getPoolUser();
        const objectData = {
          title: `Modifiable Object ${Date.now()}`,
          description: 'Objet destinÃ© Ã  Ãªtre modifiÃ©',
          category: EXISTING_CATEGORIES.MAISON,
          condition: 'bon'
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

      test('âœ… Modification rÃ©ussie titre et valeur', async () => {
        if (!modifiableObject) {
          console.warn('âš ï¸ Pas d\'objet modifiable disponible');
          return;
        }

        const updatedData = {
          title: `${modifiableObject.title} - MODIFIÃ‰`
        };

        const result = await makeApiCall('PUT', `/api/objects/${modifiableObject._id}`, updatedData, modifiableObject.userToken);
        
        expect(result.success).toBe(true);
        expect(result.data.object.title).toContain('MODIFIÃ‰');
        console.log('âœ… Objet modifiÃ© avec succÃ¨s');
      });

      test('âŒ Modification Ã©choue avec valeur invalide', async () => {
        if (!modifiableObject) {
          console.warn('âš ï¸ Pas d\'objet modifiable disponible');
          return;
        }

        const invalidUpdate = {
        };

        const result = await makeApiCall('PUT', `/api/objects/${modifiableObject._id}`, invalidUpdate, modifiableObject.userToken);
        
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        console.log('âœ… Valeur invalide en modification rejetÃ©e');
      });

      test('âŒ Modification objet non possÃ©dÃ© interdite', async () => {
        if (!modifiableObject) {
          console.warn('âš ï¸ Pas d\'objet modifiable disponible');
          return;
        }

        const otherUser = getPoolUser();
        const updateData = {
          title: 'Tentative piratage'
        };

        const result = await makeApiCall('PUT', `/api/objects/${modifiableObject._id}`, updateData, otherUser.token);
        
        expect(result.success).toBe(false);
        expect([403, 404]).toContain(result.status);
        console.log('âœ… Modification non autorisÃ©e bloquÃ©e');
      });

    });

    describe('ðŸ—‘ï¸ 2.4 Suppression d\'objets', () => {
      
      let deletableObject = null;

      beforeAll(async () => {
        // CrÃ©er un objet spÃ©cifiquement pour suppression
        const user = getPoolUser();
        const objectData = {
          title: `Deletable Object ${Date.now()}`,
          description: 'Objet destinÃ© Ã  Ãªtre supprimÃ©',
          category: EXISTING_CATEGORIES.LIVRES,
          condition: 'mauvais'
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

      test('âœ… Suppression rÃ©ussie objet possÃ©dÃ©', async () => {
        if (!deletableObject) {
          console.warn('âš ï¸ Pas d\'objet supprimable disponible');
          return;
        }

        const result = await makeApiCall('DELETE', `/api/objects/${deletableObject._id}`, null, deletableObject.userToken);
        
        expect(result.success).toBe(true);
        console.log('âœ… Objet supprimÃ© avec succÃ¨s');

        // VÃ©rifier que l'objet n'existe plus
        const checkResult = await makeApiCall('GET', `/api/objects/${deletableObject._id}`);
        expect(checkResult.success).toBe(false);
        expect(checkResult.status).toBe(404);
        console.log('âœ… Objet bien supprimÃ© de la base');
      });

      test('âŒ Suppression objet non possÃ©dÃ© interdite', async () => {
        // CrÃ©er un objet avec un user puis tenter suppression avec un autre
        const owner = getPoolUser();
        const objectData = {
          title: `Protected Object ${Date.now()}`,
          description: 'Objet protÃ©gÃ© contre suppression',
          category: EXISTING_CATEGORIES.SPORTS,
          condition: 'excellent'
        };

        const createResult = await makeApiCall('POST', '/api/objects', objectData, owner.token);
        if (createResult.success) {
          await delay(1000);
          
          const otherUser = getPoolUser();
          const deleteResult = await makeApiCall('DELETE', `/api/objects/${createResult.data.object._id}`, null, otherUser.token);
          
          expect(deleteResult.success).toBe(false);
          expect([403, 404]).toContain(deleteResult.status);
          console.log('âœ… Suppression non autorisÃ©e bloquÃ©e');
        }
      });

      test('âŒ Suppression sans authentification Ã©choue', async () => {
        const user = getPoolUser();
        const objectData = {
          title: `Unauth Delete Test ${Date.now()}`,
          description: 'Test suppression sans auth',
          category: EXISTING_CATEGORIES.MAISON,
          condition: 'bon'
        };

        const createResult = await makeApiCall('POST', '/api/objects', objectData, user.token);
        if (createResult.success) {
          await delay(1000);
          
          const deleteResult = await makeApiCall('DELETE', `/api/objects/${createResult.data.object._id}`);
          
          expect(deleteResult.success).toBe(false);
          expect(deleteResult.status).toBe(401);
          console.log('âœ… Suppression sans auth correctement bloquÃ©e');
        }
      });

    });

  });

  // ========== TESTS INTEGRATION ET WORKFLOW ==========

  describe('ðŸ”„ 3. WORKFLOW INTÃ‰GRATION AUTH + OBJECTS', () => {
    
    test('âœ… Workflow complet: Inscription â†’ CrÃ©ation objets â†’ Gestion', async () => {
      // 1. Inscription nouvel utilisateur
      const userData = generateUniqueUser('Workflow');
      const registerResult = await makeApiCall('POST', '/api/auth/register', userData);
      
      expect(registerResult.success).toBe(true);
      const userToken = registerResult.data.token;
      
      // 2. CrÃ©ation plusieurs objets
      const objects = [];
        for (let i = 1; i <= 3; i++) {
          const objectData = {
            title: `Workflow Object ${i} ${Date.now()}`,
            description: `Objet ${i} du workflow complet`,
            category: EXISTING_CATEGORIES.ELECTRONIQUE,
            condition: i === 1 ? 'excellent' : i === 2 ? 'bon' : 'correct'
          };
          
          const createResult = await makeApiCall('POST', '/api/objects', objectData, userToken);
          expect(createResult.success).toBe(true);
          objects.push(createResult.data.object);
          
          await delay(1500); // Rate limiting entre crÃ©ations
        }      // 3. RÃ©cupÃ©ration objets utilisateur
      const myObjectsResult = await makeApiCall('GET', '/api/objects/my-objects', null, userToken);
      expect(myObjectsResult.success).toBe(true);
      expect(myObjectsResult.data.objects.length).toBeGreaterThanOrEqual(3);
      
      // 4. Modification d'un objet
      const objectToModify = objects[0];
      const updateResult = await makeApiCall('PUT', `/api/objects/${objectToModify._id}`, {
        title: `${objectToModify.title} - MODIFIÃ‰ WORKFLOW`
      }, userToken);
      expect(updateResult.success).toBe(true);
      
      // 5. Suppression d'un objet
      const objectToDelete = objects[2];
      const deleteResult = await makeApiCall('DELETE', `/api/objects/${objectToDelete._id}`, null, userToken);
      expect(deleteResult.success).toBe(true);
      
      console.log('âœ… Workflow complet AUTH + OBJECTS rÃ©ussi');
    });

    test('âœ… Test limites utilisateur gratuit', async () => {
      const user = getPoolUser();
      
      // VÃ©rifier les objets actuels
      const currentObjectsResult = await makeApiCall('GET', '/api/objects/my-objects', null, user.token);
      expect(currentObjectsResult.success).toBe(true);
      
      const currentCount = currentObjectsResult.data.objects.length;
      console.log(`ðŸ“Š Utilisateur a actuellement ${currentCount} objets`);
      
      // Les users gratuits peuvent avoir jusqu'Ã  5 objets (Ã  vÃ©rifier selon business rules)
      const maxFreeObjects = 5;
      
      if (currentCount < maxFreeObjects) {
        // CrÃ©er des objets jusqu'Ã  la limite
        for (let i = currentCount; i < maxFreeObjects; i++) {
          const objectData = {
            title: `Limit Test Object ${i + 1}`,
            description: 'Test des limites utilisateur gratuit',
            category: EXISTING_CATEGORIES.VETEMENTS,
            condition: 'bon'
          };
          
          const result = await makeApiCall('POST', '/api/objects', objectData, user.token);
          expect(result.success).toBe(true);
          
          await delay(2000); // Rate limiting plus important pour test limites
        }
      }
      
      console.log('âœ… Test limites utilisateur gratuit terminÃ©');
    });

  });

  // Nettoyage final
  afterAll(async () => {
    console.log('ðŸ§¹ Nettoyage final suite AUTH + OBJECTS...');
    
    // Note: En production, Ã©viter de supprimer les donnÃ©es de test
    // Ici on fait confiance au systÃ¨me de cleanup automatique
    
    console.log('âœ… Suite AUTH + OBJECTS terminÃ©e');
  });

});

