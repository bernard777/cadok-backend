/**
 * 🧪 TESTS SECURITY SERVICE
 * Tests complets pour le système de sécurité et anti-fraude
 */

const securityService = require('../../services/freeTradeSecurityService');
const User = require('../../models/User');
const Trade = require('../../models/Trade');

describe('🛡️ SecurityService - Tests Critiques', () => {
  let testUser;
  
  beforeEach(async () => {
    testUser = new User({
      pseudo: 'TestSecurityUser',
      email: 'test@security.com',
      password: 'password123',
      city: 'Paris'
    });
    await testUser.save();
  });

  describe('🔍 Détection de fraude', () => {
    
    test('Doit détecter une valeur suspecte', async () => {
      const tradeData = {
        fromUser: testUser._id,
        offeredObject: {
          title: 'iPhone 15 Pro Max',
          description: 'Neuf sous blister',
          estimatedValue: 1 // Valeur anormalement basse
        },
        requestedObject: {
          title: 'Stylo Bic',
          description: 'Stylo usagé',
          estimatedValue: 1500 // Valeur anormalement haute
        }
      };
      
      const result = await securityService.analyzeTrade(tradeData);
      
      expect(result.fraudScore).toBeGreaterThan(0.7);
      expect(result.flags).toContain('SUSPICIOUS_VALUE');
      expect(result.riskLevel).toBe('HIGH');
    });
    
    test('Doit détecter des mots-clés suspects', async () => {
      const tradeData = {
        fromUser: testUser._id,
        offeredObject: {
          title: 'Urgent vente rapide',
          description: 'Garantie 100% argent facile livraison gratuite'
        },
        requestedObject: {
          title: 'N\'importe quoi',
          description: 'Peu importe'
        }
      };
      
      const result = await securityService.analyzeTrade(tradeData);
      
      expect(result.fraudScore).toBeGreaterThan(0.5);
      expect(result.flags).toContain('SUSPICIOUS_KEYWORDS');
    });
    
    test('Doit analyser le comportement utilisateur', async () => {
      // Créer plusieurs trocs en peu de temps
      const trades = [];
      for (let i = 0; i < 10; i++) {
        trades.push({
          fromUser: testUser._id,
          offeredObject: { title: `Objet ${i}` },
          requestedObject: { title: `Demande ${i}` },
          createdAt: new Date()
        });
      }
      
      const result = await securityService.analyzeUserBehavior(testUser._id, trades);
      
      expect(result.suspiciousActivity).toBe(true);
      expect(result.flags).toContain('HIGH_FREQUENCY_POSTING');
    });
    
    test('Doit valider un troc légitime', async () => {
      const legitimateTradeData = {
        fromUser: testUser._id,
        offeredObject: {
          title: 'Livre de cuisine',
          description: 'Livre en bon état, quelques annotations',
          estimatedValue: 15
        },
        requestedObject: {
          title: 'DVD Film',
          description: 'Film d\'action récent',
          estimatedValue: 12
        }
      };
      
      const result = await securityService.analyzeTrade(legitimateTradeData);
      
      expect(result.fraudScore).toBeLessThan(0.3);
      expect(result.riskLevel).toBe('LOW');
    });
  });

  describe('🔐 Authentification et autorisation', () => {
    
    test('Doit valider un token JWT valide', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: testUser._id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const result = await securityService.validateToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe(testUser._id.toString());
    });
    
    test('Doit rejeter un token expiré', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: testUser._id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Token expiré
      );
      
      const result = await securityService.validateToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expiré');
    });
    
    test('Doit rejeter un token invalide', async () => {
      const result = await securityService.validateToken('token.invalide.ici');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('Doit vérifier les permissions utilisateur', async () => {
      const result = await securityService.checkPermission(
        testUser._id,
        'CREATE_TRADE'
      );
      
      expect(result.hasPermission).toBe(true);
    });
  });

  describe('🚨 Détection d\'intrusion', () => {
    
    test('Doit détecter les tentatives de force brute', async () => {
      const ipAddress = '192.168.1.100';
      
      // Simuler 5 tentatives de connexion échouées
      for (let i = 0; i < 5; i++) {
        await securityService.logFailedLogin(ipAddress, 'test@test.com');
      }
      
      const result = await securityService.checkBruteForce(ipAddress);
      
      expect(result.isBlocked).toBe(true);
      expect(result.blockDuration).toBeGreaterThan(0);
    });
    
    test('Doit détecter les requêtes suspectes', async () => {
      const requestData = {
        ip: '192.168.1.200',
        userAgent: 'Bot/1.0',
        endpoint: '/api/trades',
        frequency: 100 // 100 requêtes par minute
      };
      
      const result = await securityService.analyzeRequest(requestData);
      
      expect(result.suspicious).toBe(true);
      expect(result.flags).toContain('HIGH_FREQUENCY');
      expect(result.flags).toContain('BOT_SIGNATURE');
    });
    
    test('Doit bloquer les IPs malveillantes', async () => {
      const maliciousIp = '10.0.0.1';
      
      await securityService.blockIp(maliciousIp, 'Activité suspecte détectée');
      
      const result = await securityService.isIpBlocked(maliciousIp);
      
      expect(result.blocked).toBe(true);
      expect(result.reason).toBeDefined();
    });
  });

  describe('📝 Audit et logging', () => {
    
    test('Doit enregistrer les événements de sécurité', async () => {
      await securityService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        userId: testUser._id,
        description: 'Test de logging sécurité',
        severity: 'MEDIUM',
        metadata: { test: true }
      });
      
      const logs = await SecurityLog.find({ userId: testUser._id });
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].type).toBe('SUSPICIOUS_ACTIVITY');
    });
    
    test('Doit générer un rapport d\'audit', async () => {
      const report = await securityService.generateAuditReport({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
        endDate: new Date(),
        userId: testUser._id
      });
      
      expect(report.totalEvents).toBeDefined();
      expect(report.eventsByType).toBeDefined();
      expect(report.riskAnalysis).toBeDefined();
    });
  });

  describe("📊 Analyse des risques", () => {
    
    test('Doit calculer le score de risque utilisateur', async () => {
      // Créer quelques activités pour l\'utilisateur
      await securityService.logSecurityEvent({
        type: 'LOGIN_SUCCESS',
        userId: testUser._id,
        description: 'Connexion réussie'
      });
      
      const riskScore = await securityService.calculateUserRiskScore(testUser._id);
      
      expect(riskScore.score).toBeDefined();
      expect(riskScore.level).toBeDefined();
      expect(riskScore.factors).toBeDefined();
    });
    
    test('Doit analyser les patterns de comportement', async () => {
      const patterns = await securityService.analyzeUserPatterns(testUser._id);
      
      expect(patterns.loginFrequency).toBeDefined();
      expect(patterns.tradeFrequency).toBeDefined();
      expect(patterns.anomalies).toBeDefined();
    });
  });

  describe('🔒 Chiffrement et protection des données', () => {
    
    test('Doit chiffrer des données sensibles', async () => {
      const sensitiveData = 'Données confidentielles test';
      
      const encrypted = await securityService.encryptData(sensitiveData);
      
      expect(encrypted).not.toBe(sensitiveData);
      expect(encrypted.length).toBeGreaterThan(0);
    });
    
    test('Doit déchiffrer des données chiffrées', async () => {
      const originalData = 'Test de chiffrement';
      
      const encrypted = await securityService.encryptData(originalData);
      const decrypted = await securityService.decryptData(encrypted);
      
      expect(decrypted).toBe(originalData);
    });
    
    test('Doit hasher les mots de passe', async () => {
      const password = 'motdepasse123';
      
      const hashed = await securityService.hashPassword(password);
      
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });
    
    test('Doit vérifier les mots de passe hashés', async () => {
      const password = 'motdepasse123';
      
      const hashed = await securityService.hashPassword(password);
      const isValid = await securityService.verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });
  });

  describe('🛡️ Protection contre les vulnérabilités', () => {
    
    test('Doit détecter les tentatives d\'injection SQL', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const result = await securityService.detectSqlInjection(maliciousInput);
      
      expect(result.detected).toBe(true);
      expect(result.type).toBe('SQL_INJECTION');
    });
    
    test('Doit détecter les tentatives XSS', async () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      
      const result = await securityService.detectXSS(maliciousInput);
      
      expect(result.detected).toBe(true);
      expect(result.type).toBe('XSS');
    });
    
    test('Doit nettoyer les entrées utilisateur', async () => {
      const dirtyInput = '<script>alert("test")</script>Hello World';
      
      const cleaned = await securityService.sanitizeInput(dirtyInput);
      
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).toContain('Hello World');
    });
  });

  describe('⚡ Performance et optimisation', () => {
    
    test('Doit analyser rapidement un troc', async () => {
      const startTime = Date.now();
      
      const tradeData = {
        fromUser: testUser._id,
        offeredObject: { title: 'Test Performance' },
        requestedObject: { title: 'Test Rapide' }
      };
      
      await securityService.analyzeTrade(tradeData);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200); // Moins de 200ms
    });
    
    test('Doit mettre en cache les résultats d\'analyse', async () => {
      const tradeData = {
        fromUser: testUser._id,
        offeredObject: { title: 'Cache Test' },
        requestedObject: { title: 'Cache Performance' }
      };
      
      // Première analyse
      const start1 = Date.now();
      await securityService.analyzeTrade(tradeData);
      const time1 = Date.now() - start1;
      
      // Seconde analyse (même données)
      const start2 = Date.now();
      await securityService.analyzeTrade(tradeData);
      const time2 = Date.now() - start2;
      
      expect(time2).toBeLessThan(time1);
    });
  });
});
