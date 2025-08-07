/**
 * FEATURE E2E - AUTHENTIFICATION
 * Tests isolés pour l'inscription, connexion, et sécurité auth
 */

const { mongoose } = require('../../../../db');
let isDbReady = false;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await new Promise(resolve => mongoose.connection.once('open', resolve));
  }
  isDbReady = true;
});

const E2EHelpers = require('../../helpers/E2EHelpers');

describe('👤 FEATURE E2E - AUTHENTIFICATION', () => {
  
  describe('📝 Inscription utilisateur', () => {
    
    test('Inscription réussie avec données valides', async () => {
      const result = await E2EHelpers.registerUser();
      
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(result.userData.email);
      expect(result.user.pseudo).toBe(result.userData.pseudo);
      
      console.log('✅ Utilisateur inscrit:', result.user.pseudo);
    });

    test('Inscription échoue avec email invalide', async () => {
      const invalidUser = E2EHelpers.generateUniqueUser();
      invalidUser.email = 'email-invalide';
      
      const result = await E2EHelpers.registerUser(invalidUser);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      console.log('✅ Email invalide correctement rejeté');
    });

    test('Inscription échoue avec mot de passe trop court', async () => {
      const invalidUser = E2EHelpers.generateUniqueUser();
      invalidUser.password = '123';
      
      const result = await E2EHelpers.registerUser(invalidUser);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      console.log('✅ Mot de passe faible correctement rejeté');
    });

    test('Inscription échoue avec pseudo trop court', async () => {
      const invalidUser = E2EHelpers.generateUniqueUser();
      invalidUser.pseudo = 'ab';
      
      const result = await E2EHelpers.registerUser(invalidUser);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      console.log('✅ Pseudo trop court correctement rejeté');
    });

  });

  describe('🔐 Connexion utilisateur', () => {
    
    let testUser;

    beforeEach(async () => {
      // Créer un utilisateur pour les tests de connexion
      const result = await E2EHelpers.registerUser();
      expect(result.success).toBe(true);
      testUser = result;
    });

    test('Connexion réussie avec identifiants corrects', async () => {
      const loginResult = await E2EHelpers.loginUser(
        testUser.userData.email, 
        testUser.userData.password
      );
      expect(loginResult.token).toBeDefined();
      expect(loginResult.user.email).toBe(testUser.userData.email);
      
      console.log('✅ Connexion réussie pour:', testUser.user.pseudo);
    });

    test('Connexion échoue avec mauvais mot de passe', async () => {
      const loginResult = await E2EHelpers.loginUser(
        testUser.userData.email, 
        'mauvais-mot-de-passe'
      );
      expect(loginResult.status).toBe(400);
      console.log('✅ Mauvais mot de passe correctement rejeté');
    });

    test('Connexion échoue avec email inexistant', async () => {
      const loginResult = await E2EHelpers.loginUser(
        'inexistant@test.com', 
        'nimporte-quoi'
      );
      
      expect(loginResult.success).toBe(false);
      expect(loginResult.status).toBe(400);
      console.log('✅ Email inexistant correctement rejeté');
    });

  });

  describe('🛡️ Sécurité authentification', () => {
    
    let testUser;

    beforeEach(async () => {
      const result = await E2EHelpers.registerUser();
      expect(result.success).toBe(true);
      testUser = result;
    });

    test('Token JWT valide permet l\'accès aux routes protégées', async () => {
      const objectsResult = await E2EHelpers.getUserObjects(testUser.token);
      
      expect(objectsResult.success).toBe(true);
      expect(Array.isArray(objectsResult.objects)).toBe(true);
      console.log('✅ Token JWT valide accepté');
    });

    test('Token JWT invalide bloque l\'accès', async () => {
      const objectsResult = await E2EHelpers.getUserObjects('token-invalide');
      
      expect(objectsResult.success).toBe(false);
      expect(objectsResult.status).toBe(401);
      console.log('✅ Token invalide correctement bloqué');
    });

    test('Absence de token bloque l\'accès', async () => {
      const objectsResult = await E2EHelpers.getUserObjects('');
      
      expect(objectsResult.success).toBe(false);
      expect(objectsResult.status).toBe(401);
      console.log('✅ Absence de token correctement bloquée');
    });

  });
});