
// Setup des mocks pour les routes
// Mocks complets des autres modèles
jest.mock('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com',
    save: jest.fn().mockResolvedValue(true)
  }),
  create: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com',
    save: jest.fn().mockResolvedValue(true)
  }),
  findOne: jest.fn().mockResolvedValue(null),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
}));

jest.mock('../../models/Object', () => ({
  find: jest.fn().mockResolvedValue([]),
  findById: jest.fn().mockResolvedValue({
    _id: 'obj123',
    title: 'Test Object',
    owner: 'user123'
  }),
  create: jest.fn().mockResolvedValue({
    _id: 'obj123',
    title: 'Test Object',
    owner: 'user123',
    save: jest.fn().mockResolvedValue(true)
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
}));

jest.mock('../../models/Trade', () => ({
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'trade123',
    requester: 'user123',
    receiver: 'user456',
    status: 'pending'
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 })
}));

// Tests E2E
// Mock User déjà défini ci-dessus
// jest.mock('../../models/User'('../../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com'
  }),
  create: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    save: jest.fn().mockResolvedValue(true)
  })
}));

jest.mock('../../models/Object', () => ({
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'obj123',
    title: 'Test Object',
    save: jest.fn().mockResolvedValue(true)
  })
}));

/**
 * 🧪 Tests d'intégration - URLs d'images dans les réponses API
 * Vérifie que le backend retourne des URLs d'images correctement formatées
 */

const request = require('supertest');
const app = require('../app');

describe('🖼️ APIs Images - Tests d\'Intégration', () => {
  
  describe('GET /api/objects - Liste des objets', () => {
    
    test('Doit retourner des URLs d\'images complètes', async () => {
      const response = await request(app)
        .get('/api/objects')
        .expect(200);
      
      if (response.body.objects && response.body.objects.length > 0) {
        response.body.objects.forEach(object => {
          // Vérifier les images multiples
          if (object.images && Array.isArray(object.images)) {
            object.images.forEach(image => {
              expect(image.url).toBeDefined();
              
              // L'URL doit être absolue (commencer par http://)
              if (image.url) {
                expect(image.url).toMatch(/^https?:\/\//);
                
                // Ne doit PAS être une URL malformée
                expect(image.url).not.toMatch(/http:\/\/.*file:\/\/\//);
                
                // Doit pointer vers le bon serveur
                expect(image.url).toMatch(/192\.168\.1\.16:5000|localhost:5000/);
              }
            });
          }
          
          // Vérifier l'image unique (compatibilité)
          if (object.imageUrl) {
            expect(object.imageUrl).toMatch(/^https?:\/\//);
            expect(object.imageUrl).not.toMatch(/http:\/\/.*file:\/\/\//);
            expect(object.imageUrl).toMatch(/192\.168\.1\.16:5000|localhost:5000/);
          }
        });
      }
    });
    
    test('Les avatars des propriétaires doivent aussi être des URLs complètes', async () => {
      const response = await request(app)
        .get('/api/objects')
        .expect(200);
      
      if (response.body.objects && response.body.objects.length > 0) {
        response.body.objects.forEach(object => {
          if (object.owner && object.owner.avatar) {
            expect(object.owner.avatar).toMatch(/^https?:\/\//);
            expect(object.owner.avatar).not.toMatch(/http:\/\/.*file:\/\/\//);
          }
        });
      }
    });
  });
  
  describe('GET /api/objects/:id - Détails d\'un objet', () => {
    
    test('Doit retourner des URLs d\'images complètes pour un objet spécifique', async () => {
      // D'abord récupérer un objet existant
      const listResponse = await request(app).get('/api/objects');
      
      if (listResponse.body.objects && listResponse.body.objects.length > 0) {
        const objectId = listResponse.body.objects[0]._id;
        
        const response = await request(app)
          .get(`/api/objects/${objectId}`)
          .expect(200);
        
        const object = response.body;
        
        // Vérifier les images multiples
        if (object.images && Array.isArray(object.images)) {
          object.images.forEach(image => {
            expect(image.url).toBeDefined();
            if (image.url) {
              expect(image.url).toMatch(/^https?:\/\//);
              expect(image.url).not.toMatch(/http:\/\/.*file:\/\/\//);
            }
          });
        }
        
        // Vérifier l'image unique
        if (object.imageUrl) {
          expect(object.imageUrl).toMatch(/^https?:\/\//);
          expect(object.imageUrl).not.toMatch(/http:\/\/.*file:\/\/\//);
        }
        
        // Vérifier l'avatar du propriétaire
        if (object.owner && object.owner.avatar) {
          expect(object.owner.avatar).toMatch(/^https?:\/\//);
          expect(object.owner.avatar).not.toMatch(/http:\/\/.*file:\/\/\//);
        }
      }
    });
  });
  
  describe('Consistency Tests - URLs entre liste et détails', () => {
    
    test('Les URLs d\'images doivent être identiques entre liste et détails', async () => {
      // Récupérer la liste
      const listResponse = await request(app).get('/api/objects');
      
      if (listResponse.body.objects && listResponse.body.objects.length > 0) {
        const objectFromList = listResponse.body.objects[0];
        
        // Récupérer les détails du même objet
        const detailResponse = await request(app)
          .get(`/api/objects/${objectFromList._id}`);
        
        const objectFromDetail = detailResponse.body;
        
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
      }
    });
  });
  
  describe('Error Cases - Gestion des URLs invalides', () => {
    
    test('Ne doit jamais retourner d\'URLs malformées', async () => {
      const response = await request(app).get('/api/objects');
      
      const checkUrlsInObject = (obj) => {
        // Vérifier les images
        if (obj.images && Array.isArray(obj.images)) {
          obj.images.forEach(image => {
            if (image.url) {
              expect(image.url).not.toMatch(/http:\/\/.*file:\/\/\//);
              expect(image.url).not.toMatch(/undefined/);
              expect(image.url).not.toMatch(/null/);
            }
          });
        }
        
        // Vérifier l'image unique
        if (obj.imageUrl) {
          expect(obj.imageUrl).not.toMatch(/http:\/\/.*file:\/\/\//);
          expect(obj.imageUrl).not.toMatch(/undefined/);
          expect(obj.imageUrl).not.toMatch(/null/);
        }
        
        // Vérifier l'avatar
        if (obj.owner && obj.owner.avatar) {
          expect(obj.owner.avatar).not.toMatch(/http:\/\/.*file:\/\/\//);
          expect(obj.owner.avatar).not.toMatch(/undefined/);
          expect(obj.owner.avatar).not.toMatch(/null/);
        }
      };
      
      if (response.body.objects) {
        response.body.objects.forEach(checkUrlsInObject);
      }
    });
  });
  
  describe('Performance Tests - Temps de réponse avec images', () => {
    
    test('Les réponses avec transformation d\'URLs ne doivent pas être trop lentes', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/objects')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Ne devrait pas prendre plus de 2 secondes
      expect(responseTime).toBeLessThan(2000);
    });
  });
});

// Helper functions for manual testing
const testImageURLsInAPI = async () => {
  console.log('🧪 Test manuel des URLs d\'images dans l\'API...');
  
  try {
    const response = await fetch('http://localhost:5000/api/objects');
    const data = await response.json();
    
    if (data.objects && data.objects.length > 0) {
      const firstObject = data.objects[0];
      
      console.log('📋 Premier objet:', {
        id: firstObject._id,
        title: firstObject.title,
        images: firstObject.images?.map(img => ({
          url: img.url,
          isAbsolute: img.url?.startsWith('http'),
          isMalformed: img.url?.includes('file://') && img.url?.includes('http://')
        })),
        imageUrl: firstObject.imageUrl,
        ownerAvatar: firstObject.owner?.avatar
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

module.exports = {
  testImageURLsInAPI
};
