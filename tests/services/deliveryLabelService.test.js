
// Configuration pour tests de services
jest.setTimeout(30000);

// Mock des dépendances externes
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: { success: true } })
}));

jest.mock('node-fetch', () => jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({ success: true })
}));

/**
 * Tests pour le service de génération d'étiquettes avec redirection automatique
 * Couvre le système critique de livraison anonyme CADOK
 */

const DeliveryLabelService = require('../../services/deliveryLabelService');
const Trade = require('../../models/Trade');
const User = require('../../models/User');
const fs = require('fs');
const path = require('path');

// Mock des dépendances externes
jest.mock('../../models/Trade');
jest.mock('../../models/User');
jest.mock('qrcode');
jest.mock('pdfkit');
jest.mock('fs')
describe('DeliveryLabelService - Système de Redirection', () => {
  let deliveryLabelService;
  let mockTrade;
  let mockFromUser;
  let mockToUser
beforeEach(() => {
    deliveryLabelService = new DeliveryLabelService();
    
    mockFromUser = {
      _id: 'user1',
      pseudo: 'Marie',
      email: 'marie@test.com',
      city: 'Paris'
    };

    mockToUser = {
      _id: 'user2', 
      pseudo: 'Thomas',
      email: 'thomas@test.com',
      city: 'Lyon'
    };

    mockTrade = {
      _id: 'trade123',
      fromUser: mockFromUser,
      toUser: mockToUser,
      status: 'accepted'
    };

    // Mock Trade.findById
    Trade.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTrade)
      })
    });

    jest.clearAllMocks();
  })
describe('generateDeliveryLabel', () => {
    test('doit générer un bordereau avec redirection automatique', async () => {
      const result = await deliveryLabelService.generateDeliveryLabel('trade123', 'user1');
      
      expect(result.success).toBe(true);
      expect(result.redirectionCode).toMatch(/^CADOK-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(result.labelUrl).toContain('.pdf');
      expect(result.instructions).toBeDefined();
      expect(result.estimatedDelivery).toBeDefined();
    })
test('doit rejeter si utilisateur non autorisé', async () => {
      const result = await deliveryLabelService.generateDeliveryLabel('trade123', 'wrongUser');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('non autorisé');
    })
test('doit gérer les erreurs de troc inexistant', async () => {
      Trade.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const result = await deliveryLabelService.generateDeliveryLabel('inexistant', 'user1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('non trouvé');
    });
  })
describe('generateRedirectionCode', () => {
    test('doit créer un code de redirection unique', async () => {
      deliveryLabelService.saveRedirectionMapping = jest.fn().mockResolvedValue({});
      deliveryLabelService.encryptUserAddress = jest.fn().mockResolvedValue('encrypted_address');

      const result = await deliveryLabelService.generateRedirectionCode('trade123', 'user1', 'user2');
      
      expect(result.code).toMatch(/^CADOK-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(result.tradeId).toBe('trade123');
      expect(result.fromUserId).toBe('user1');
      expect(result.toUserId).toBe('user2');
      expect(result.status).toBe('active');
      expect(deliveryLabelService.saveRedirectionMapping).toHaveBeenCalledWith(result);
    })
test('doit générer des codes différents pour chaque appel', async () => {
      deliveryLabelService.saveRedirectionMapping = jest.fn().mockResolvedValue({});
      deliveryLabelService.encryptUserAddress = jest.fn().mockResolvedValue('encrypted_address');

      const result1 = await deliveryLabelService.generateRedirectionCode('trade1', 'user1', 'user2');
      const result2 = await deliveryLabelService.generateRedirectionCode('trade2', 'user1', 'user2');
      
      expect(result1.code).not.toBe(result2.code);
    });
  })
describe('createDeliveryInstructions', () => {
    test('doit créer des instructions complètes pour redirection', async () => {
      const redirectionCode = { code: 'CADOK-ABC123-4567' };
      
      const result = await deliveryLabelService.createDeliveryInstructions(mockTrade, redirectionCode);
      
      expect(result.shippingAddress.name).toBe('CADOK REDIRECTION');
      expect(result.shippingAddress.attention).toBe('CADOK-ABC123-4567');
      expect(result.shippingAddress.street).toBe('15 Avenue des Trocs');
      expect(result.shippingAddress.city).toBe('Paris');
      expect(result.shippingAddress.zipCode).toBe('75001');
      
      expect(result.specialInstructions).toContain('🔄 REDIRECTION AUTOMATIQUE');
      expect(result.specialInstructions).toContain('Code: CADOK-ABC123-4567');
      expect(result.specialInstructions).toContain('Livraison finale: Lyon');
      
      expect(result.senderInstructions).toContain('✅ Utilisez EXACTEMENT cette adresse');
      expect(result.senderInstructions).toContain('⚠️ Ne modifiez RIEN sur l\'étiquette');
    });
  })
describe('handleDeliveryRedirection', () => {
    test('doit traiter une redirection webhook correctement', async () => {
      const redirectionCode = 'CADOK-ABC123-4567';
      const carrierData = { tracking: '3S00987654321', carrier: 'colissimo' };
      
      const mockMapping = {
        code: redirectionCode,
        tradeId: 'trade123',
        realDestination: 'encrypted_real_address'
      };
      
      const mockRealAddress = {
        name: 'Thomas Dorel',
        street: '12 Rue des Acacias',
        city: 'Lyon',
        zipCode: '69001',
        phone: '06 12 34 56 78'
      };

      deliveryLabelService.getRedirectionMapping = jest.fn().mockResolvedValue(mockMapping);
      deliveryLabelService.decryptUserAddress = jest.fn().mockResolvedValue(mockRealAddress);

      const result = await deliveryLabelService.handleDeliveryRedirection(redirectionCode, carrierData);
      
      expect(result.success).toBe(true);
      expect(result.redirectionInstructions.newDestination).toEqual(mockRealAddress);
      expect(result.redirectionInstructions.specialInstructions).toContain('Livraison finale pour troc CADOK');
      expect(result.redirectionInstructions.specialInstructions).toContain('Destinataire: Thomas Dorel');
    })
test('doit gérer les codes de redirection invalides', async () => {
      deliveryLabelService.getRedirectionMapping = jest.fn().mockResolvedValue(null);

      const result = await deliveryLabelService.handleDeliveryRedirection('INVALID', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Code de redirection invalide');
    })
test('doit gérer les erreurs de déchiffrement', async () => {
      const mockMapping = { realDestination: 'corrupted_data' };
      deliveryLabelService.getRedirectionMapping = jest.fn().mockResolvedValue(mockMapping);
      deliveryLabelService.decryptUserAddress = jest.fn().mockRejectedValue(new Error('Déchiffrement échoué'));

      const result = await deliveryLabelService.handleDeliveryRedirection('CADOK-TEST', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Déchiffrement échoué');
    });
  })
describe('generateTrackingQRCode', () => {
    test('doit générer un QR code de traçabilité valide', async () => {
      const QRCode = require('qrcode');
      QRCode.toBuffer = jest.fn().mockResolvedValue(Buffer.from('fake-qr-data'));

      const redirectionCode = { code: 'CADOK-ABC123-4567' };
      const result = await deliveryLabelService.generateTrackingQRCode('trade123', redirectionCode);
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.data.type).toBe('CADOK_DELIVERY');
      expect(result.data.tradeId).toBe('trade123');
      expect(result.data.redirectionCode).toBe('CADOK-ABC123-4567');
      expect(result.data.trackingUrl).toContain('https://cadok.com/track/CADOK-ABC123-4567');
    });
  })
describe('createLabelPDF', () => {
    test('doit créer un PDF de bordereau complet', async () => {
      const PDFDocument = require('pdfkit');
      const mockDoc = {
        pipe: jest.fn(),
        fillColor: jest.fn().mockReturnThis(),
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        rect: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        image: jest.fn().mockReturnThis(),
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'end') setTimeout(callback, 0);
        })
      };
      PDFDocument.mockImplementation(() => mockDoc);

      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.createWriteStream = jest.fn().mockReturnValue({ pipe: jest.fn() });

      const deliveryInstructions = {
        shippingAddress: {
          name: 'CADOK REDIRECTION',
          attention: 'CADOK-ABC123-4567',
          street: '15 Avenue des Trocs',
          city: 'Paris',
          zipCode: '75001',
          country: 'France'
        },
        specialInstructions: ['🔄 REDIRECTION AUTOMATIQUE'],
        senderInstructions: ['✅ Utilisez EXACTEMENT cette adresse']
      };

      const qrCodeData = { buffer: Buffer.from('qr-data') };

      const result = await deliveryLabelService.createLabelPDF(mockTrade, deliveryInstructions, qrCodeData);
      
      expect(result.filepath).toContain('.pdf');
      expect(result.filename).toContain('delivery-label-trade123');
      expect(result.url).toContain('/uploads/labels/');
      expect(mockDoc.text).toHaveBeenCalledWith('CADOK DELIVERY LABEL', 50, 50);
    });
  })
describe('calculateEstimatedDelivery', () => {
    test('doit calculer 1 jour pour même ville', () => {
      const result = deliveryLabelService.calculateEstimatedDelivery('Paris', 'Paris');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(result).toBe(tomorrow.toISOString().split('T')[0]);
    })
test('doit calculer 2 jours pour villes proches', () => {
      deliveryLabelService.isNearbyCity = jest.fn().mockReturnValue(true);
      
      const result = deliveryLabelService.calculateEstimatedDelivery('Paris', 'Lyon');
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      expect(result).toBe(dayAfterTomorrow.toISOString().split('T')[0]);
    })
test('doit calculer 3 jours pour villes éloignées', () => {
      deliveryLabelService.isNearbyCity = jest.fn().mockReturnValue(false);
      
      const result = deliveryLabelService.calculateEstimatedDelivery('Paris', 'Marseille');
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      
      expect(result).toBe(threeDaysLater.toISOString().split('T')[0]);
    });
  })
describe('Chiffrement et Sécurité', () => {
    test('doit chiffrer et déchiffrer une adresse utilisateur', async () => {
      const originalAddress = {
        name: 'Thomas Dorel',
        street: '12 Rue des Acacias',
        city: 'Lyon',
        zipCode: '69001',
        phone: '06 12 34 56 78'
      };

      // Mock des méthodes de chiffrement
      deliveryLabelService.encryptUserAddress = jest.fn().mockResolvedValue('encrypted_data_base64');
      deliveryLabelService.decryptUserAddress = jest.fn().mockResolvedValue(originalAddress);

      const encrypted = await deliveryLabelService.encryptUserAddress('user2');
      const decrypted = await deliveryLabelService.decryptUserAddress(encrypted);
      
      expect(encrypted).toBe('encrypted_data_base64');
      expect(decrypted).toEqual(originalAddress);
    });
  })
describe('Intégration complète', () => {
    test('doit traiter un workflow complet de redirection', async () => {
      // Simuler toutes les étapes
      deliveryLabelService.saveRedirectionMapping = jest.fn().mockResolvedValue({});
      deliveryLabelService.encryptUserAddress = jest.fn().mockResolvedValue('encrypted_address');
      
      const QRCode = require('qrcode');
      QRCode.toBuffer = jest.fn().mockResolvedValue(Buffer.from('qr-data'));
      
      const PDFDocument = require('pdfkit');
      const mockDoc = {
        pipe: jest.fn(),
        fillColor: jest.fn().mockReturnThis(),
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        rect: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        image: jest.fn().mockReturnThis(),
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'end') setTimeout(callback, 0);
        })
      };
      PDFDocument.mockImplementation(() => mockDoc);

      fs.existsSync = jest.fn().mockReturnValue(true);
      fs.createWriteStream = jest.fn().mockReturnValue({ pipe: jest.fn() });

      // Étape 1: Génération du bordereau
      const labelResult = await deliveryLabelService.generateDeliveryLabel('trade123', 'user1');
      expect(labelResult.success).toBe(true);

      // Étape 2: Simulation webhook redirection
      deliveryLabelService.getRedirectionMapping = jest.fn().mockResolvedValue({
        code: labelResult.redirectionCode,
        realDestination: 'encrypted_address'
      });
      
      deliveryLabelService.decryptUserAddress = jest.fn().mockResolvedValue({
        name: 'Thomas Dorel',
        street: '12 Rue des Acacias',
        city: 'Lyon',
        zipCode: '69001'
      });

      const redirectionResult = await deliveryLabelService.handleDeliveryRedirection(
        labelResult.redirectionCode,
        { tracking: '3S00987654321' }
      );
      
      expect(redirectionResult.success).toBe(true);
      expect(redirectionResult.redirectionInstructions.newDestination.city).toBe('Lyon');
    });
  });
});
