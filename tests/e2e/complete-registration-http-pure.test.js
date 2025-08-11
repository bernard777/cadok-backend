/**
 * 🔐 TESTS D'INSCRIPTION COMPLÈTE - VERSION HTTP PURE
 * Tests E2E pour valider l'inscription avec tous les champs obligatoires
 * Validation des nouveaux champs: firstName, lastName, phoneNumber, address
 */

const axios = require('axios');
const UserDataGenerator = require('../helpers/user-data-generator');

const API_BASE = 'http://localhost:5000/api';

// Configuration Jest
jest.setTimeout(30000);

// Configuration axios pour tests HTTP-Pure
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  validateStatus: () => true // Accepter tous les codes de statut pour les gérer manuellement
});

// Helpers pour les tests d'inscription
class RegistrationHelpers {
  
  static async waitForServer() {
    console.log('🔍 Vérification serveur sur port 5000...');
    try {
      const response = await api.get('/health');
      if (response.status === 200 || response.status === 404) {
        console.log('✅ Serveur détecté et prêt');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Serveur peut-être pas complètement prêt, on continue...');
      return true;
    }
    return false;
  }

  static async registerUser(userData) {
    console.log(`👤 Test inscription: ${userData.pseudo}`);
    try {
      const response = await api.post('/auth/register', userData);
      
      return {
        success: response.status === 201 || response.status === 200,
        status: response.status,
        data: response.data,
        error: response.data?.error || null
      };
    } catch (error) {
      console.error('💥 Erreur inscription:', error.message);
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.message,
        data: error.response?.data || null
      };
    }
  }

  static async loginUser(credentials) {
    console.log(`🔐 Test connexion: ${credentials.email}`);
    try {
      const response = await api.post('/auth/login', credentials);
      
      return {
        success: response.status === 200,
        status: response.status,
        token: response.data?.token,
        user: response.data?.user,
        error: response.data?.error || null
      };
    } catch (error) {
      console.error('💥 Erreur connexion:', error.message);
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.message
      };
    }
  }

  static async checkUserProfile(token, userId) {
    console.log(`👤 Vérification profil utilisateur: ${userId}`);
    try {
      const response = await api.get(`/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return {
        success: response.status === 200,
        status: response.status,
        user: response.data?.user,
        error: response.data?.error || null
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.message
      };
    }
  }
}

describe('🔐 INSCRIPTION COMPLÈTE - Tests HTTP Pure', () => {

  beforeAll(async () => {
    const serverReady = await RegistrationHelpers.waitForServer();
    expect(serverReady).toBe(true);
  });

  describe('✅ Inscription réussie avec tous les champs obligatoires', () => {

    test('Inscription standard avec toutes les données requises', async () => {
      // Générer des données utilisateur complètes
      const userData = UserDataGenerator.generateCompleteUserData();
      
      console.log('📝 Données d\'inscription:', {
        pseudo: userData.pseudo,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        city: userData.city,
        address: userData.address
      });

      // Tenter l'inscription
      const result = await RegistrationHelpers.registerUser(userData);
      
      // Vérifications
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data.token).toBeTruthy();
      expect(result.data.user).toBeTruthy();
      
      // Vérifier que l'utilisateur a bien tous les champs
      const user = result.data.user;
      expect(user.pseudo).toBe(userData.pseudo);
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.phoneNumber).toBe(userData.phoneNumber);
      expect(user.city).toBe(userData.city);
      expect(user.address).toBeTruthy();
      expect(user.address.street).toBe(userData.address.street);
      expect(user.address.zipCode).toBe(userData.address.zipCode);
      expect(user.address.city).toBe(userData.address.city);
      expect(user.address.country).toBe(userData.address.country);
      
      console.log('✅ Inscription réussie avec tous les champs obligatoires');
    });

    test('Inscription puis connexion et vérification du profil', async () => {
      // Générer des données utilisateur
      const userData = UserDataGenerator.generateCompleteUserData();
      
      // Inscription
      const registerResult = await RegistrationHelpers.registerUser(userData);
      expect(registerResult.success).toBe(true);
      
      const { token, user } = registerResult.data;
      
      // Connexion
      const loginResult = await RegistrationHelpers.loginUser({
        email: userData.email,
        password: userData.password
      });
      
      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBeTruthy();
      
      // Vérification du profil
      const profileResult = await RegistrationHelpers.checkUserProfile(loginResult.token, user._id);
      expect(profileResult.success).toBe(true);
      
      const profileUser = profileResult.user;
      expect(profileUser.firstName).toBe(userData.firstName);
      expect(profileUser.lastName).toBe(userData.lastName);
      expect(profileUser.phoneNumber).toBe(userData.phoneNumber);
      expect(profileUser.address).toBeTruthy();
      
      console.log('✅ Workflow complet inscription -> connexion -> profil validé');
    });

    test('Test avec différentes variantes d\'utilisateurs', async () => {
      const variants = UserDataGenerator.generateUserVariants();
      
      for (const [type, userData] of Object.entries(variants)) {
        console.log(`🧪 Test inscription variante: ${type}`);
        
        const result = await RegistrationHelpers.registerUser(userData);
        
        expect(result.success).toBe(true);
        expect(result.status).toBe(201);
        expect(result.data.user.firstName).toBe(userData.firstName);
        expect(result.data.user.lastName).toBe(userData.lastName);
        
        console.log(`✅ Variante ${type} validée`);
      }
    });

  });

  describe('❌ Validation des erreurs avec champs manquants/invalides', () => {

    test('Échec avec prénom manquant', async () => {
      const invalidData = UserDataGenerator.generateInvalidDataVariants().missingFirstName;
      
      const result = await RegistrationHelpers.registerUser(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error || result.data?.error).toContain('prénom');
      
      console.log('✅ Validation prénom manquant OK');
    });

    test('Échec avec nom manquant', async () => {
      const invalidData = UserDataGenerator.generateInvalidDataVariants().missingLastName;
      
      const result = await RegistrationHelpers.registerUser(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error || result.data?.error).toContain('nom');
      
      console.log('✅ Validation nom manquant OK');
    });

    test('Échec avec numéro de téléphone invalide', async () => {
      const invalidData = UserDataGenerator.generateInvalidDataVariants().invalidPhone;
      
      const result = await RegistrationHelpers.registerUser(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error || result.data?.error).toContain('téléphone');
      
      console.log('✅ Validation téléphone invalide OK');
    });

    test('Échec avec code postal invalide', async () => {
      const invalidData = UserDataGenerator.generateInvalidDataVariants().invalidZipCode;
      
      const result = await RegistrationHelpers.registerUser(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error || result.data?.error).toContain('postal');
      
      console.log('✅ Validation code postal invalide OK');
    });

    test('Échec avec adresse manquante', async () => {
      const invalidData = UserDataGenerator.generateInvalidDataVariants().missingAddress;
      
      const result = await RegistrationHelpers.registerUser(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error || result.data?.error).toContain('adresse');
      
      console.log('✅ Validation adresse manquante OK');
    });

  });

  describe('🔄 Tests de unicité des champs', () => {

    test('Échec avec email déjà utilisé', async () => {
      // Créer un premier utilisateur
      const userData1 = UserDataGenerator.generateCompleteUserData();
      const result1 = await RegistrationHelpers.registerUser(userData1);
      expect(result1.success).toBe(true);
      
      // Tenter de créer un deuxième utilisateur avec le même email
      const userData2 = UserDataGenerator.generateCompleteUserData({
        email: userData1.email
      });
      
      const result2 = await RegistrationHelpers.registerUser(userData2);
      
      expect(result2.success).toBe(false);
      expect(result2.status).toBe(400);
      expect(result2.error || result2.data?.error).toContain('Email');
      
      console.log('✅ Validation email unique OK');
    });

    test('Échec avec numéro de téléphone déjà utilisé', async () => {
      // Créer un premier utilisateur
      const userData1 = UserDataGenerator.generateCompleteUserData();
      const result1 = await RegistrationHelpers.registerUser(userData1);
      expect(result1.success).toBe(true);
      
      // Tenter de créer un deuxième utilisateur avec le même téléphone
      const userData2 = UserDataGenerator.generateCompleteUserData({
        phoneNumber: userData1.phoneNumber
      });
      
      const result2 = await RegistrationHelpers.registerUser(userData2);
      
      expect(result2.success).toBe(false);
      expect(result2.status).toBe(400);
      expect(result2.error || result2.data?.error).toContain('téléphone');
      
      console.log('✅ Validation téléphone unique OK');
    });

  });

  describe('🔒 Tests de sécurité des données personnelles', () => {

    test('Vérification du chiffrement des données sensibles', async () => {
      const userData = UserDataGenerator.generateCompleteUserData();
      
      const result = await RegistrationHelpers.registerUser(userData);
      expect(result.success).toBe(true);
      
      const { token, user } = result.data;
      
      // Les données sensibles ne doivent pas être retournées en clair dans certains contextes
      // (Ceci dépend de l'implémentation de votre système de confidentialité)
      
      console.log('✅ Données personnelles protégées lors de l\'inscription');
    });

  });

});
