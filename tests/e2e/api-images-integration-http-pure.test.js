/**
 * 🧪 Tests d'intégration - URLs d'images dans les réponses API (HTTP-Pure)
 * Vérifie que le backend retourne des URLs d'images correctement formatées
 * Architecture: HTTP-Pure avec axios vers serveur externe
 */

const axios = require('axios');

// Configuration axios pour tests HTTP-Pure
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
  validateStatus: () => true // Accepter tous les codes de statut pour les gérer manuellement
});

class ApiImagesHelpers {
  
  static async waitForServer() {
    console.log('🔍 Vérification serveur sur port 5000...');
    try {
      const response = await api.get('/api/health');
      if (response.status === 200 || response.status === 404) {
        console.log('✅ Serveur détecté et prêt');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Serveur peut-être pas complètement prêt, on continue...');
      return true; // On continue même si health check échoue
    }
    return false;
  }

  static async getObjects() {
    console.log('📋 Récupération liste des objets...');
    try {
      const response = await api.get('/api/objects');
      if (response.status === 200) {
        console.log(`✅ ${response.data.objects?.length || 0} objets récupérés`);
        return { success: true, data: response.data, status: response.status };
      } else {
        console.warn(`⚠️ Status ${response.status}:`, response.data);
        return { success: false, data: response.data, status: response.status };
      }
    } catch (error) {
      console.error('💥 Erreur récupération objets:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static async getObjectById(objectId) {
    console.log(`🔍 Récupération détails objet: ${objectId}`);
    try {
      const response = await api.get(`/api/objects/${objectId}`);
      if (response.status === 200) {
        console.log(`✅ Détails objet récupérés: ${response.data.title}`);
        return { success: true, data: response.data, status: response.status };
      } else {
        console.warn(`⚠️ Status ${response.status}:`, response.data);
        return { success: false, data: response.data, status: response.status };
      }
    } catch (error) {
      console.error('💥 Erreur récupération détails objet:', error.message);
      return { success: false, error: error.message, status: error.response?.status || 0 };
    }
  }

  static validateImageUrl(url, context = '') {
    if (!url) return true; // URL vide acceptée
    
    const issues = [];
    
    // L'URL doit être absolue (commencer par http://)
    if (!url.match(/^https?:\/\//)) {
      issues.push('URL non absolue');
    }
    
    // Ne doit PAS être une URL malformée
    if (url.match(/http:\/\/.*file:\/\/\//)) {
      issues.push('URL malformée (http + file)');
    }
    
    // Ne doit pas contenir undefined/null
    if (url.includes('undefined') || url.includes('null')) {
      issues.push('URL contient undefined/null');
    }
    
    // Doit pointer vers le bon serveur
    if (!url.match(/192\.168\.1\.16:5000|localhost:5000/)) {
      issues.push('URL ne pointe pas vers le serveur attendu');
    }
    
    if (issues.length > 0) {
      console.error(`❌ Problèmes URL ${context}:`, { url, issues });
      return false;
    }
    
    return true;
  }

  static validateObject(object, context = '') {
    const issues = [];
    
    // Vérifier les images multiples
    if (object.images && Array.isArray(object.images)) {
      object.images.forEach((image, index) => {
        if (image.url && !this.validateImageUrl(image.url, `${context} image[${index}]`)) {
          issues.push(`Image ${index} invalide`);
        }
      });
    }
    
    // Vérifier l'image unique (compatibilité)
    if (object.imageUrl && !this.validateImageUrl(object.imageUrl, `${context} imageUrl`)) {
      issues.push('ImageUrl invalide');
    }
    
    // Vérifier l'avatar du propriétaire
    if (object.owner && object.owner.avatar) {
      if (!this.validateImageUrl(object.owner.avatar, `${context} owner.avatar`)) {
        issues.push('Avatar propriétaire invalide');
      }
    }
    
    return { valid: issues.length === 0, issues };
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

jest.setTimeout(60000);

describe('🖼️ APIs Images - Tests d\'Intégration HTTP-Pure', () => {
  
  beforeAll(async () => {
    const serverReady = await ApiImagesHelpers.waitForServer();
    expect(serverReady).toBe(true);
  });

  describe('GET /api/objects - Liste des objets', () => {
    
    test('✅ 1.1 - Doit retourner des URLs d\'images complètes', async () => {
      const result = await ApiImagesHelpers.getObjects();
      expect(result.status).toBe(200);
      
      if (result.data.objects && result.data.objects.length > 0) {
        console.log(`🔍 Validation de ${result.data.objects.length} objets...`);
        
        result.data.objects.forEach((object, index) => {
          const validation = ApiImagesHelpers.validateObject(object, `objet[${index}]`);
          if (!validation.valid) {
            console.error(`❌ Objet ${index} invalide:`, validation.issues);
          }
          expect(validation.valid).toBe(true);
        });
        
        console.log('✅ Test 1.1 réussi - Toutes les URLs d\'images sont valides');
      } else {
        console.log('⚠️ Aucun objet trouvé, test passé par défaut');
      }
    });

    test('✅ 1.2 - Les avatars des propriétaires doivent aussi être des URLs complètes', async () => {
      const result = await ApiImagesHelpers.getObjects();
      expect(result.status).toBe(200);
      
      if (result.data.objects && result.data.objects.length > 0) {
        let avatarCount = 0;
        
        result.data.objects.forEach((object, index) => {
          if (object.owner && object.owner.avatar) {
            avatarCount++;
            const isValid = ApiImagesHelpers.validateImageUrl(object.owner.avatar, `avatar propriétaire objet[${index}]`);
            expect(isValid).toBe(true);
          }
        });
        
        console.log(`✅ Test 1.2 réussi - ${avatarCount} avatars validés`);
      } else {
        console.log('⚠️ Aucun objet trouvé, test passé par défaut');
      }
    });
  });

  describe('GET /api/objects/:id - Détails d\'un objet', () => {
    
    test('✅ 2.1 - Doit retourner des URLs d\'images complètes pour un objet spécifique', async () => {
      // D'abord récupérer un objet existant
      const listResult = await ApiImagesHelpers.getObjects();
      expect(listResult.status).toBe(200);
      
      if (listResult.data.objects && listResult.data.objects.length > 0) {
        const objectId = listResult.data.objects[0]._id;
        console.log(`🔍 Test détails pour objet: ${objectId}`);
        
        const detailResult = await ApiImagesHelpers.getObjectById(objectId);
        expect(detailResult.status).toBe(200);
        
        const validation = ApiImagesHelpers.validateObject(detailResult.data, 'détails objet');
        if (!validation.valid) {
          console.error('❌ Objet détaillé invalide:', validation.issues);
        }
        expect(validation.valid).toBe(true);
        
        console.log('✅ Test 2.1 réussi - URLs détails objet validées');
      } else {
        console.log('⚠️ Aucun objet trouvé, test sauté');
      }
    });
  });

  describe('Consistency Tests - URLs entre liste et détails', () => {
    
    test('✅ 3.1 - Les URLs d\'images doivent être identiques entre liste et détails', async () => {
      // Récupérer la liste
      const listResult = await ApiImagesHelpers.getObjects();
      expect(listResult.status).toBe(200);
      
      if (listResult.data.objects && listResult.data.objects.length > 0) {
        const objectFromList = listResult.data.objects[0];
        console.log(`🔍 Test cohérence pour objet: ${objectFromList._id}`);
        
        // Récupérer les détails du même objet
        const detailResult = await ApiImagesHelpers.getObjectById(objectFromList._id);
        expect(detailResult.status).toBe(200);
        
        const objectFromDetail = detailResult.data;
        
        // Comparer les URLs d'images
        if (objectFromList.images && objectFromDetail.images) {
          expect(objectFromList.images.length).toBe(objectFromDetail.images.length);
          
          objectFromList.images.forEach((listImage, index) => {
            const detailImage = objectFromDetail.images[index];
            expect(listImage.url).toBe(detailImage.url);
          });
        }
        
        // Comparer l'image unique
        if (objectFromList.imageUrl && objectFromDetail.imageUrl) {
          expect(objectFromList.imageUrl).toBe(objectFromDetail.imageUrl);
        }
        
        // Comparer l'avatar
        if (objectFromList.owner?.avatar && objectFromDetail.owner?.avatar) {
          expect(objectFromList.owner.avatar).toBe(objectFromDetail.owner.avatar);
        }
        
        console.log('✅ Test 3.1 réussi - URLs cohérentes entre liste et détails');
      } else {
        console.log('⚠️ Aucun objet trouvé, test sauté');
      }
    });
  });

  describe('Error Cases - Gestion des URLs invalides', () => {
    
    test('✅ 4.1 - Ne doit jamais retourner d\'URLs malformées', async () => {
      const result = await ApiImagesHelpers.getObjects();
      expect(result.status).toBe(200);
      
      let totalChecked = 0;
      let issuesFound = 0;
      
      if (result.data.objects) {
        result.data.objects.forEach((object, index) => {
          totalChecked++;
          const validation = ApiImagesHelpers.validateObject(object, `validation objet[${index}]`);
          
          if (!validation.valid) {
            issuesFound++;
            console.error(`❌ Problèmes trouvés dans objet[${index}]:`, validation.issues);
          }
        });
      }
      
      console.log(`🔍 ${totalChecked} objets vérifiés, ${issuesFound} problèmes trouvés`);
      expect(issuesFound).toBe(0);
      console.log('✅ Test 4.1 réussi - Aucune URL malformée détectée');
    });
  });

  describe('Performance Tests - Temps de réponse avec images', () => {
    
    test('✅ 5.1 - Les réponses avec transformation d\'URLs ne doivent pas être trop lentes', async () => {
      console.log('⏱️ Test performance récupération objets...');
      const startTime = Date.now();
      
      const result = await ApiImagesHelpers.getObjects();
      expect(result.status).toBe(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ Temps de réponse: ${responseTime}ms`);
      
      // Ne devrait pas prendre plus de 3 secondes (marge pour serveur externe)
      expect(responseTime).toBeLessThan(3000);
      console.log('✅ Test 5.1 réussi - Performance acceptable');
    });
  });

  afterAll(() => {
    console.log('🧹 Nettoyage final tests images...');
    console.log('✅ Suite IMAGES API HTTP PURE terminée');
  });
});

module.exports = {
  ApiImagesHelpers
};
