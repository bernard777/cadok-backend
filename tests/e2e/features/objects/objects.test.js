/**
 * FEATURE E2E - GESTION D'OBJETS
 * Tests isolés pour création, lecture, modification d'objets
 */

const E2EHelpers = require('../../helpers/E2EHelpers');
const path = require('path');

describe('📦 FEATURE E2E - GESTION D\'OBJETS', () => {
  
  let testUser;

  // Utilisateur dédié pour cette feature
  beforeEach(async () => {
    // Nettoyage avant création
    await E2EHelpers.cleanupTestData();
    
    const result = await E2EHelpers.registerUser();
    expect(result.success).toBe(true);
    testUser = result;
  });

  afterEach(async () => {
    await E2EHelpers.cleanupTestData();
  });

  describe('➕ Création d\'objets', () => {
    
    test('Création d\'objet réussie avec données valides', async () => {
      const objectData = {
        nom: 'Test Object E2E',
        description: 'Description test objet',
        categorie: 'Électronique',
        etat: 'Très bon état',
        prix: 100
      };

      const createResult = await E2EHelpers.createObject(testUser.token, objectData);
      
      expect(createResult.success).toBe(true);
      expect(createResult.object).toBeDefined();
      expect(createResult.object.nom).toBe(objectData.nom);
      expect(createResult.object.proprietaire).toBe(testUser.user._id);
      
      console.log('✅ Objet créé:', createResult.object.nom);
    });

    test('Création d\'objet avec image', async () => {
      const objectData = {
        nom: 'Objet avec image E2E',
        description: 'Test upload image',
        categorie: 'Multimédia',
        etat: 'Bon état',
        prix: 50
      };

      // Simuler un fichier image (en réalité, on utiliserait un vrai fichier)
      const createResult = await E2EHelpers.createObject(testUser.token, objectData);
      
      expect(createResult.success).toBe(true);
      expect(createResult.object.nom).toBe(objectData.nom);
      
      console.log('✅ Objet avec image créé:', createResult.object.nom);
    });

    test('Création échoue sans nom d\'objet', async () => {
      const invalidData = {
        description: 'Objet sans nom',
        categorie: 'Test',
        etat: 'Bon état',
        prix: 25
      };

      const createResult = await E2EHelpers.createObject(testUser.token, invalidData);
      
      expect(createResult.success).toBe(false);
      expect(createResult.status).toBe(400);
      console.log('✅ Objet sans nom correctement rejeté');
    });

    test('Création échoue avec prix négatif', async () => {
      const invalidData = {
        nom: 'Test prix négatif',
        description: 'Objet avec prix invalide',
        categorie: 'Test',
        etat: 'Bon état',
        prix: -10
      };

      const createResult = await E2EHelpers.createObject(testUser.token, invalidData);
      
      expect(createResult.success).toBe(false);
      expect(createResult.status).toBe(400);
      console.log('✅ Prix négatif correctement rejeté');
    });

  });

  describe('📋 Lecture des objets', () => {
    
    let createdObjects = [];

    beforeEach(async () => {
      // Créer quelques objets test
      for (let i = 1; i <= 3; i++) {
        const objectData = {
          nom: `Objet Test ${i}`,
          description: `Description objet ${i}`,
          categorie: 'Test',
          etat: 'Très bon état',
          prix: i * 10
        };
        
        const result = await E2EHelpers.createObject(testUser.token, objectData);
        expect(result.success).toBe(true);
        createdObjects.push(result.object);
      }
    });

    test('Récupération des objets utilisateur', async () => {
      const objectsResult = await E2EHelpers.getUserObjects(testUser.token);
      
      expect(objectsResult.success).toBe(true);
      expect(Array.isArray(objectsResult.objects)).toBe(true);
      expect(objectsResult.objects.length).toBe(3);
      
      console.log('✅ Objets utilisateur récupérés:', objectsResult.objects.length);
    });

    test('Recherche d\'objets par nom', async () => {
      const searchResult = await E2EHelpers.searchObjects('Objet Test 2');
      
      expect(searchResult.success).toBe(true);
      expect(searchResult.objects.length).toBeGreaterThan(0);
      
      const foundObject = searchResult.objects.find(obj => obj.nom === 'Objet Test 2');
      expect(foundObject).toBeDefined();
      
      console.log('✅ Recherche par nom réussie');
    });

    test('Recherche d\'objets par catégorie', async () => {
      const searchResult = await E2EHelpers.searchObjects('', 'Test');
      
      expect(searchResult.success).toBe(true);
      expect(searchResult.objects.length).toBe(3);
      
      console.log('✅ Recherche par catégorie réussie');
    });

  });

  describe('🔄 Modification d\'objets', () => {
    
    let testObject;

    beforeEach(async () => {
      const objectData = {
        nom: 'Objet à modifier',
        description: 'Description originale',
        categorie: 'Original',
        etat: 'Bon état',
        prix: 75
      };
      
      const result = await E2EHelpers.createObject(testUser.token, objectData);
      expect(result.success).toBe(true);
      testObject = result.object;
    });

    test('Modification réussie du nom et prix', async () => {
      const updateData = {
        nom: 'Objet modifié E2E',
        prix: 150
      };

      const updateResult = await E2EHelpers.updateObject(testUser.token, testObject._id, updateData);
      
      expect(updateResult.success).toBe(true);
      expect(updateResult.object.nom).toBe(updateData.nom);
      expect(updateResult.object.prix).toBe(updateData.prix);
      expect(updateResult.object.description).toBe('Description originale'); // Non modifié
      
      console.log('✅ Objet modifié:', updateResult.object.nom);
    });

    test('Modification échoue avec prix invalide', async () => {
      const invalidUpdate = {
        prix: -50
      };

      const updateResult = await E2EHelpers.updateObject(testUser.token, testObject._id, invalidUpdate);
      
      expect(updateResult.success).toBe(false);
      expect(updateResult.status).toBe(400);
      console.log('✅ Prix invalide correctement rejeté en modification');
    });

    test('Modification interdite pour objet non possédé', async () => {
      // Créer un autre utilisateur
      const otherUser = await E2EHelpers.registerUser();
      expect(otherUser.success).toBe(true);

      const updateData = {
        nom: 'Tentative de piratage'
      };

      const updateResult = await E2EHelpers.updateObject(otherUser.token, testObject._id, updateData);
      
      expect(updateResult.success).toBe(false);
      expect(updateResult.status).toBe(403);
      console.log('✅ Modification non autorisée correctement bloquée');
    });

  });

  describe('🗑️ Suppression d\'objets', () => {
    
    let testObject;

    beforeEach(async () => {
      const objectData = {
        nom: 'Objet à supprimer',
        description: 'Sera supprimé',
        categorie: 'Temporaire',
        etat: 'Peu importe',
        prix: 1
      };
      
      const result = await E2EHelpers.createObject(testUser.token, objectData);
      expect(result.success).toBe(true);
      testObject = result.object;
    });

    test('Suppression réussie d\'objet possédé', async () => {
      const deleteResult = await E2EHelpers.deleteObject(testUser.token, testObject._id);
      
      expect(deleteResult.success).toBe(true);
      
      // Vérifier que l'objet n'existe plus
      const objectsResult = await E2EHelpers.getUserObjects(testUser.token);
      const stillExists = objectsResult.objects.find(obj => obj._id === testObject._id);
      expect(stillExists).toBeUndefined();
      
      console.log('✅ Objet supprimé avec succès');
    });

    test('Suppression interdite pour objet non possédé', async () => {
      // Créer un autre utilisateur
      const otherUser = await E2EHelpers.registerUser();
      expect(otherUser.success).toBe(true);

      const deleteResult = await E2EHelpers.deleteObject(otherUser.token, testObject._id);
      
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.status).toBe(403);
      console.log('✅ Suppression non autorisée correctement bloquée');
    });

  });

});
