/**
 * 🧪 TESTS BIDIRECTIONAL TRADE SERVICE
 * Tests complets pour le système de troc bidirectionnel
 */

const bidirectionalTradeService = require('../../services/bidirectionalTradeService');
const Trade = require('../../models/Trade');
const User = require('../../models/User');
const mongoose = require('mongoose')
describe('🔄 BidirectionalTradeService - Tests Critiques', () => {
  jest.setTimeout(30000)
beforeEach(() => {
  let testUser1, testUser2
beforeEach(async () => {
    // Créer utilisateurs test
    testUser1 = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
      pseudo: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
      city: 'Paris'
    });
    await testUser1.save()
testUser2 = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
      pseudo: 'Bob',
      email: 'bob@test.com',
      password: 'password123',
      city: 'Lyon'
    });
    await testUser2.save();
  })
describe('✅ Création de troc bidirectionnel', () => {
  jest.setTimeout(30000)
beforeEach(() => {
    
    test('Doit créer un troc bidirectionnel valide', async () => {
      const tradeData = {
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: {
          title: 'Livre JavaScript',
          description: 'Livre de programmation',
          category: 'Livres',
          estimatedValue: 25
        },
        requestedObject: {
          title: 'Jeu Échecs',
          description: 'Jeu d\'échecs en bois',
          category: 'Jeux',
          estimatedValue: 30
        },
        type: 'bidirectional'
      };
      
      const result = await bidirectionalTradeService.createBidirectionalTrade(tradeData);
      
      expect(result.success).toBe(true);
      expect(result.trade).toBeDefined();
      expect(result.trade.type).toBe('bidirectional');
      expect(result.trade.status).toBe('pending');
      expect(result.trade.fromUser.toString()).toBe(testUser1._id.toString());
      expect(result.trade.toUser.toString()).toBe(testUser2._id.toString());
    })
test('Doit rejeter un troc avec des objets identiques', async () => {
      const tradeData = {
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: {
          title: 'Livre Test',
          description: 'Description test'
        },
        requestedObject: {
          title: 'Livre Test',
          description: 'Description test'
        },
        type: 'bidirectional'
      };
      
      const result = await bidirectionalTradeService.createBidirectionalTrade(tradeData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('identiques');
    })
test('Doit rejeter un auto-troc', async () => {
      const tradeData = {
        fromUser: testUser1._id,
        toUser: testUser1._id,
        offeredObject: { title: 'Objet 1' },
        requestedObject: { title: 'Objet 2' },
        type: 'bidirectional'
      };
      
      const result = await bidirectionalTradeService.createBidirectionalTrade(tradeData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('auto-troc');
        });
  })
describe('🔄 Gestion des statuts', () => {
  jest.setTimeout(30000)
beforeEach(() => {
    
    let testTrade
beforeEach(async () => {
      testTrade = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Livre', description: 'Test' },
        requestedObject: { title: 'Jeu', description: 'Test' },
        type: 'bidirectional',
        status: 'pending'
      });
      await testTrade.save();
    })
test('Doit accepter un troc valide', async () => {
      const result = await bidirectionalTradeService.acceptTrade(testTrade._id, testUser2._id);
      
      expect(result.success).toBe(true);
      expect(result.trade.status).toBe('accepted');
      expect(result.trade.acceptedAt).toBeDefined();
    })
test('Doit rejeter l\'acceptation par mauvais utilisateur', async () => {
      const result = await bidirectionalTradeService.acceptTrade(testTrade._id, testUser1._id);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('autorisé');
    })
test('Doit refuser un troc valide', async () => {
      const result = await bidirectionalTradeService.rejectTrade(testTrade._id, testUser2._id);
      
      expect(result.success).toBe(true);
      expect(result.trade.status).toBe('rejected');
      expect(result.trade.rejectedAt).toBeDefined();
    })
test('Doit annuler un troc valide', async () => {
      const result = await bidirectionalTradeService.cancelTrade(testTrade._id, testUser1._id);
      
      expect(result.success).toBe(true);
      expect(result.trade.status).toBe('cancelled');
      expect(result.trade.cancelledAt).toBeDefined();
    });
  })
describe('📊 Analyse et statistiques', () => {
  jest.setTimeout(30000)
beforeEach(() => {
    
    beforeEach(async () => {
      // Créer plusieurs trocs test
      const trades = [
        {
          fromUser: testUser1._id,
          toUser: testUser2._id,
          offeredObject: { title: 'Livre 1' },
          requestedObject: { title: 'Jeu 1' },
          type: 'bidirectional',
          status: 'completed'
        },
        {
          fromUser: testUser2._id,
          toUser: testUser1._id,
          offeredObject: { title: 'Livre 2' },
          requestedObject: { title: 'Jeu 2' },
          type: 'bidirectional',
          status: 'pending'
        }
      ];
      
      await Trade.insertMany(trades);
    })
test('Doit calculer les statistiques utilisateur', async () => {
      const stats = await bidirectionalTradeService.getUserTradeStats(testUser1._id);
      
      expect(stats.totalTrades).toBeGreaterThan(0);
      expect(stats.completedTrades).toBeDefined();
      expect(stats.pendingTrades).toBeDefined();
      expect(stats.successRate).toBeDefined();
    })
test('Doit récupérer l\'historique des trocs', async () => {
      const history = await bidirectionalTradeService.getTradeHistory(testUser1._id);
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  })
describe('🛡️ Sécurité et validations', () => {
  jest.setTimeout(30000)
beforeEach(() => {
    
    test('Doit valider les données d\'entrée', async () => {
      const invalidData = {
        fromUser: 'invalid-id',
        toUser: testUser2._id,
        offeredObject: {},
        requestedObject: {},
        type: 'bidirectional'
      };
      
      const result = await bidirectionalTradeService.createBidirectionalTrade(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    })
test('Doit détecter les tentatives de fraude', async () => {
      // Simuler un objet de valeur suspecte
      const suspiciousData = {
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: {
          title: 'iPhone 15 Pro Max',
          description: 'Neuf sous blister',
          estimatedValue: 5 // Valeur suspecte
        },
        requestedObject: {
          title: 'Stylo Bic',
          description: 'Stylo usagé',
          estimatedValue: 1200 // Valeur suspecte
        },
        type: 'bidirectional'
      };
      
      const result = await bidirectionalTradeService.createBidirectionalTrade(suspiciousData);
      
      expect(result.flagged).toBe(true);
      expect(result.fraudScore).toBeGreaterThan(0);
    });
  })
describe('⚡ Performance et optimisation', () => {
  jest.setTimeout(30000)
beforeEach(() => {
    
    test('Doit traiter rapidement les requêtes', async () => {
      const startTime = Date.now();
      
      const tradeData = {
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Test Performance' },
        requestedObject: { title: 'Test Rapide' },
        type: 'bidirectional'
      };
      
      await bidirectionalTradeService.createBidirectionalTrade(tradeData);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde
    })
test('Doit gérer les requêtes concurrentes', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const tradeData = {
          fromUser: testUser1._id,
          toUser: testUser2._id,
          offeredObject: { title: `Objet ${i}` },
          requestedObject: { title: `Demande ${i}` },
          type: 'bidirectional'
        };
        
        promises.push(bidirectionalTradeService.createBidirectionalTrade(tradeData));
      }
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  })
describe('🔄 Intégration avec autres services', () => {
  jest.setTimeout(30000)
beforeEach(() => {
    
    test('Doit déclencher les notifications appropriées', async () => {
      const emailService = require('../../services/emailService');
      
      const tradeData = {
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Livre Notification' },
        requestedObject: { title: 'Jeu Notification' },
        type: 'bidirectional'
      };
      
      await bidirectionalTradeService.createBidirectionalTrade(tradeData);
      
      expect(emailService.sendTradeNotification).toHaveBeenCalled();
    })
test('Doit créer les enregistrements de livraison', async () => {
      const Delivery = require('../../models/Delivery');
      
      // Créer un troc accepté
      const trade = new (jest.fn().mockImplementation(function(data) { Object.assign(this, data); this.save = jest.fn().mockResolvedValue(this); return this; }))({
        fromUser: testUser1._id,
        toUser: testUser2._id,
        offeredObject: { title: 'Livre Livraison' },
        requestedObject: { title: 'Jeu Livraison' },
        type: 'bidirectional',
        status: 'accepted'
      });
      await trade.save();
      
      await bidirectionalTradeService.initializeDelivery(trade._id);
      
      const deliveries = await Delivery.find({ tradeId: trade._id });
      expect(deliveries.length).toBeGreaterThan(0);
    });
  });
  });

}}}}});
}}))))))