/**
 * Tests pour les livraisons bidirectionnelles complexes
 * Couvre la logique métier avancée des échanges simultanés
 */

const BidirectionalTradeService = require('../../services/bidirectionalTradeService');
const Trade = require('../../models/Trade');
const User = require('../../models/User');

jest.mock('../../models/Trade');
jest.mock('../../models/User');

describe('Livraisons Bidirectionnelles Complexes', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
  let bidirectionalService;
  let mockTrade;
  let mockUser1;
  let mockUser2;

  beforeEach(() => {
    bidirectionalService = new BidirectionalTradeService();
    
    mockUser1 = {
      _id: 'user1',
      pseudo: 'Marie',
      city: 'Paris',
      address: {
        street: '123 Rue de Paris',
        city: 'Paris',
        zipCode: '75001'
      }
    };

    mockUser2 = {
      _id: 'user2',
      pseudo: 'Thomas',
      city: 'Lyon',
      address: {
        street: '12 Rue des Acacias',
        city: 'Lyon',
        zipCode: '69001'
      }
    };

    mockTrade = {
      _id: 'trade123',
      fromUser: mockUser1,
      toUser: mockUser2,
      status: 'accepted',
      type: 'bidirectional',
      delivery: {
        type: 'bidirectional',
        status: 'pending',
        fromUserDelivery: {
          status: 'pending',
          withdrawalCode: null,
          pickupPoint: null
        },
        toUserDelivery: {
          status: 'pending',
          withdrawalCode: null,
          pickupPoint: null
        }
      },
      save: jest.fn().mockResolvedValue(true)
    };

    Trade.findById.mockResolvedValue(mockTrade);
    jest.clearAllMocks();
  });

  describe('Création des Livraisons Bidirectionnelles', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    test('doit créer deux livraisons simultanées avec codes différents', async () => {
      const result = await bidirectionalService.createBidirectionalDelivery('trade123');

      expect(result.success).toBe(true);
      expect(result.fromUserDelivery.withdrawalCode).toMatch(/^CADOK-MT-[A-Z0-9]+$/);
      expect(result.toUserDelivery.withdrawalCode).toMatch(/^CADOK-TM-[A-Z0-9]+$/);
      expect(result.fromUserDelivery.withdrawalCode).not.toBe(result.toUserDelivery.withdrawalCode);
    });

    test('doit sélectionner des points relais différents pour éviter les rencontres', async () => {
      const result = await bidirectionalService.createBidirectionalDelivery('trade123');

      const fromPickupPoint = result.fromUserDelivery.pickupPoint;
      const toPickupPoint = result.toUserDelivery.pickupPoint;

      expect(fromPickupPoint.city).toBe('Lyon'); // Marie envoie vers Lyon
      expect(toPickupPoint.city).toBe('Paris'); // Thomas envoie vers Paris
      expect(fromPickupPoint.id).not.toBe(toPickupPoint.id);
    });

    test('doit générer des étiquettes d\'expédition pour les deux utilisateurs', async () => {
      const result = await bidirectionalService.createBidirectionalDelivery('trade123');

      expect(result.fromUserDelivery.shippingLabel).toBeDefined();
      expect(result.toUserDelivery.shippingLabel).toBeDefined();
      
      expect(result.fromUserDelivery.shippingLabel.to.name).toContain('Lyon');
      expect(result.toUserDelivery.shippingLabel.to.name).toContain('Paris');
    });

    test('doit définir les statuts initiaux correctement', async () => {
      const result = await bidirectionalService.createBidirectionalDelivery('trade123');

      expect(mockTrade.delivery.status).toBe('labels_generated');
      expect(mockTrade.delivery.fromUserDelivery.status).toBe('label_generated');
      expect(mockTrade.delivery.toUserDelivery.status).toBe('label_generated');
        });
  });

  describe('Gestion des Expéditions Séquentielles', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    beforeEach(() => {
      mockTrade.delivery.status = 'labels_generated';
      mockTrade.delivery.fromUserDelivery.status = 'label_generated';
      mockTrade.delivery.toUserDelivery.status = 'label_generated';
    });

    test('doit traiter la première expédition (Marie expédie)', async () => {
      const result = await bidirectionalService.confirmShipment('trade123', 'fromUser', {
        trackingNumber: '3S00987654321',
        carrier: 'colissimo'
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.fromUserDelivery.status).toBe('shipped');
      expect(mockTrade.delivery.toUserDelivery.status).toBe('label_generated');
      expect(mockTrade.delivery.status).toBe('partial_shipped');
    });

    test('doit traiter la deuxième expédition (Thomas expédie)', async () => {
      // Marie a déjà expédié
      mockTrade.delivery.status = 'partial_shipped';
      mockTrade.delivery.fromUserDelivery.status = 'shipped';

      const result = await bidirectionalService.confirmShipment('trade123', 'toUser', {
        trackingNumber: '3S00876543210',
        carrier: 'chronopost'
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.toUserDelivery.status).toBe('shipped');
      expect(mockTrade.delivery.status).toBe('both_shipped');
    });

    test('doit empêcher la double expédition du même utilisateur', async () => {
      mockTrade.delivery.fromUserDelivery.status = 'shipped';

      const result = await bidirectionalService.confirmShipment('trade123', 'fromUser', {
        trackingNumber: 'new_tracking'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('déjà expédié');
    });
  });

  describe('Suivi des Arrivées aux Points Relais', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    beforeEach(() => {
      mockTrade.delivery.status = 'both_shipped';
      mockTrade.delivery.fromUserDelivery.status = 'shipped';
      mockTrade.delivery.toUserDelivery.status = 'shipped';
    });

    test('doit traiter l\'arrivée du premier colis', async () => {
      const result = await bidirectionalService.confirmArrival('trade123', 'fromUser', {
        pickupPointId: 'MR123',
        arrivedAt: new Date()
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.fromUserDelivery.status).toBe('arrived');
      expect(mockTrade.delivery.status).toBe('partial_arrived');
    });

    test('doit traiter l\'arrivée du deuxième colis', async () => {
      // Premier colis déjà arrivé
      mockTrade.delivery.status = 'partial_arrived';
      mockTrade.delivery.fromUserDelivery.status = 'arrived';

      const result = await bidirectionalService.confirmArrival('trade123', 'toUser', {
        pickupPointId: 'MR456',
        arrivedAt: new Date()
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.toUserDelivery.status).toBe('arrived');
      expect(mockTrade.delivery.status).toBe('both_arrived');
    });
  });

  describe('Récupération des Colis', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    beforeEach(() => {
      mockTrade.delivery.status = 'both_arrived';
      mockTrade.delivery.fromUserDelivery.status = 'arrived';
      mockTrade.delivery.toUserDelivery.status = 'arrived';
      mockTrade.delivery.fromUserDelivery.withdrawalCode = 'CADOK-MT-847A';
      mockTrade.delivery.toUserDelivery.withdrawalCode = 'CADOK-TM-942B';
    });

    test('doit valider le code de retrait pour Thomas', async () => {
      const result = await bidirectionalService.confirmPickup('trade123', 'toUser', {
        withdrawalCode: 'CADOK-MT-847A',
        pickupPointId: 'MR123',
        idVerification: true
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.fromUserDelivery.status).toBe('delivered');
      expect(mockTrade.delivery.status).toBe('partial_delivered');
    });

    test('doit valider le code de retrait pour Marie', async () => {
      // Thomas a déjà récupéré
      mockTrade.delivery.status = 'partial_delivered';
      mockTrade.delivery.fromUserDelivery.status = 'delivered';

      const result = await bidirectionalService.confirmPickup('trade123', 'fromUser', {
        withdrawalCode: 'CADOK-TM-942B',
        pickupPointId: 'MR456',
        idVerification: true
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.toUserDelivery.status).toBe('delivered');
      expect(mockTrade.delivery.status).toBe('both_delivered');
      expect(mockTrade.status).toBe('completed');
    });

    test('doit rejeter un code de retrait incorrect', async () => {
      const result = await bidirectionalService.confirmPickup('trade123', 'toUser', {
        withdrawalCode: 'WRONG-CODE',
        pickupPointId: 'MR123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Code de retrait invalide');
    });

    test('doit exiger une vérification d\'identité', async () => {
      const result = await bidirectionalService.confirmPickup('trade123', 'toUser', {
        withdrawalCode: 'CADOK-MT-847A',
        pickupPointId: 'MR123',
        idVerification: false
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Vérification d\'identité requise');
    });
  });

  describe('Gestion des Problèmes et Conflits', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    test('doit détecter si un seul utilisateur a expédié après 3 jours', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      mockTrade.delivery.status = 'partial_shipped';
      mockTrade.delivery.fromUserDelivery.status = 'shipped';
      mockTrade.delivery.fromUserDelivery.shippedAt = threeDaysAgo;
      mockTrade.delivery.toUserDelivery.status = 'label_generated';

      const issues = await bidirectionalService.detectDeliveryIssues('trade123');

      expect(issues.hasIssues).toBe(true);
      expect(issues.issues).toContain('UNBALANCED_SHIPPING');
      expect(issues.recommendations).toContain('Relancer l\'utilisateur qui n\'a pas expédié');
    });

    test('doit détecter si un seul colis est récupéré après 5 jours', async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      mockTrade.delivery.status = 'partial_delivered';
      mockTrade.delivery.fromUserDelivery.status = 'delivered';
      mockTrade.delivery.fromUserDelivery.deliveredAt = fiveDaysAgo;
      mockTrade.delivery.toUserDelivery.status = 'arrived';
      mockTrade.delivery.toUserDelivery.arrivedAt = fiveDaysAgo;

      const issues = await bidirectionalService.detectDeliveryIssues('trade123');

      expect(issues.hasIssues).toBe(true);
      expect(issues.issues).toContain('UNBALANCED_PICKUP');
      expect(issues.recommendations).toContain('Contacter l\'utilisateur pour récupération');
    });

    test('doit gérer la perte d\'un colis', async () => {
      const result = await bidirectionalService.reportLostPackage('trade123', 'fromUser', {
        trackingNumber: '3S00987654321',
        reason: 'Colis égaré par le transporteur',
        carrierReference: 'CLAIM123'
      });

      expect(result.success).toBe(true);
      expect(mockTrade.delivery.fromUserDelivery.status).toBe('lost');
      expect(mockTrade.delivery.status).toBe('partial_lost');
      expect(result.compensation).toBeDefined();
    });

    test('doit initier une procédure de médiation en cas de litige', async () => {
      const result = await bidirectionalService.initiateMediation('trade123', {
        initiatedBy: 'user1',
        reason: 'Article non conforme à la description',
        evidenceUrls: ['photo1.jpg', 'photo2.jpg']
      });

      expect(result.success).toBe(true);
      expect(mockTrade.status).toBe('in_mediation');
      expect(result.mediationId).toBeDefined();
      expect(result.expectedResolutionDate).toBeInstanceOf(Date);
    });
  });

  describe('Métriques et Analytics', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    test('doit calculer le temps moyen de livraison bidirectionnelle', async () => {
      const completedTrades = [
        { 
          delivery: {
            fromUserDelivery: { 
              shippedAt: new Date('2025-01-01'), 
              deliveredAt: new Date('2025-01-03') 
            },
            toUserDelivery: { 
              shippedAt: new Date('2025-01-01'), 
              deliveredAt: new Date('2025-01-04') 
            }
          }
        }
      ];

      const metrics = bidirectionalService.calculateDeliveryMetrics(completedTrades);

      expect(metrics.avgDeliveryTime).toBeDefined();
      expect(metrics.successRate).toBeDefined();
      expect(metrics.balancedCompletionRate).toBeDefined();
    });

    test('doit identifier les points relais les plus efficaces', async () => {
      const pickupData = [
        { pickupPointId: 'MR123', avgPickupTime: 1.2, userSatisfaction: 4.8 },
        { pickupPointId: 'MR456', avgPickupTime: 2.1, userSatisfaction: 4.2 }
      ];

      const analysis = bidirectionalService.analyzePickupPointPerformance(pickupData);

      expect(analysis.topPerformers).toContain('MR123');
      expect(analysis.recommendations).toBeDefined();
    });
  });

  describe('Notifications et Communications', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    test('doit envoyer des notifications différenciées pour chaque étape', async () => {
      const notificationService = bidirectionalService.getNotificationService();
      const sendNotificationSpy = jest.spyOn(notificationService, 'send').mockResolvedValue(true);

      await bidirectionalService.confirmShipment('trade123', 'fromUser', {
        trackingNumber: '3S00987654321'
      });

      expect(sendNotificationSpy).toHaveBeenCalledWith('user1', {
        type: 'SHIPMENT_CONFIRMED',
        message: 'Votre expédition a été confirmée';
      });

      expect(sendNotificationSpy).toHaveBeenCalledWith('user2', {
        type: 'INCOMING_PACKAGE',
        message: 'Marie a expédié votre colis';
      });
    });

    test('doit envoyer des rappels automatiques', async () => {
      const reminderService = bidirectionalService.getReminderService();
      
      // Simuler un utilisateur qui n'a pas expédié après 2 jours
      const reminders = await reminderService.checkPendingActions('trade123');

      expect(reminders).toContain({
        type: 'SHIPPING_REMINDER',
        targetUser: 'user2',
        message: 'N\'oubliez pas d\'expédier votre colis';
      });
    });
  });

  describe('Optimisations et Performance', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    test('doit traiter de multiples livraisons bidirectionnelles en parallèle', async () => {
      const tradeIds = ['trade1', 'trade2', 'trade3'];
      
      const startTime = Date.now();
      const results = await Promise.all(
        tradeIds.map(id => bidirectionalService.createBidirectionalDelivery(id))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      results.forEach(result => expect(result.success).toBe(true));
      expect(endTime - startTime).toBeLessThan(2000); // Moins de 2 secondes
    });

    test('doit mettre en cache les données fréquemment utilisées', async () => {
      const cacheService = bidirectionalService.getCacheService();
      
      // Premier appel - doit aller en base
      const pickupPoints1 = await bidirectionalService.findNearestPickupPoints('69001');
      
      // Deuxième appel - doit utiliser le cache
      const pickupPoints2 = await bidirectionalService.findNearestPickupPoints('69001');
      
      expect(pickupPoints1).toEqual(pickupPoints2);
      expect(cacheService.getHitRate()).toBeGreaterThan(0);
    });
  });
  });

}}}}}}});
}}))))))))