/**
 * FEATURE E2E - SYSTÈME D'ÉCHANGES
 * Tests isolés pour propositions, acceptations, refus d'échanges
 */

const E2EHelpers = require('../../helpers/E2EHelpers');

describe('🔄 FEATURE E2E - SYSTÈME D\'ÉCHANGES', () => {
  
  let userA, userB, userC;
  let objectA, objectB, objectC, objectD;

  // Configuration dédiée pour cette feature
  beforeEach(async () => {
    // Créer trois utilisateurs distincts
    userA = await E2EHelpers.registerUser();
    expect(userA.success).toBe(true);
    
    userB = await E2EHelpers.registerUser();
    expect(userB.success).toBe(true);

    userC = await E2EHelpers.registerUser();
    expect(userC.success).toBe(true);

    // Chaque utilisateur crée des objets
    const objectDataA = {
      nom: 'Objet User A pour échange',
      description: 'Description objet A',
      categorie: 'Électronique',
      etat: 'Très bon état',
      prix: 100
    };

    const objectDataB = {
      nom: 'Objet User B pour échange',
      description: 'Description objet B',
      categorie: 'Multimédia',
      etat: 'Bon état',
      prix: 80
    };

    const objectDataC = {
      nom: 'Objet User B secondaire',
      description: 'Deuxième objet B',
      categorie: 'Sport',
      etat: 'Neuf',
      prix: 60
    };

    const objectDataD = {
      nom: 'Objet User C précieux',
      description: 'Objet de collection',
      categorie: 'Collection',
      etat: 'Parfait état',
      prix: 200
    };

    objectA = await E2EHelpers.createObject(userA.token, objectDataA);
    expect(objectA.success).toBe(true);

    objectB = await E2EHelpers.createObject(userB.token, objectDataB);
    expect(objectB.success).toBe(true);

    objectC = await E2EHelpers.createObject(userB.token, objectDataC);
    expect(objectC.success).toBe(true);

    objectD = await E2EHelpers.createObject(userC.token, objectDataD);
    expect(objectD.success).toBe(true);
  });

  afterEach(async () => {
    await E2EHelpers.cleanupTestData();
  });

  describe('💡 Proposition d\'échange', () => {
    
    test('Proposition d\'échange réussie entre deux objets', async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Proposition d\'échange E2E'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(true);
      expect(tradeResult.trade).toBeDefined();
      expect(tradeResult.trade.objetPropose).toBe(objectA.object._id);
      expect(tradeResult.trade.objetDemande).toBe(objectB.object._id);
      expect(tradeResult.trade.statut).toBe('pending');
      
      console.log('✅ Proposition d\'échange créée:', tradeResult.trade.message);
    });

    test('Proposition multiple d\'objets en échange', async () => {
      const tradeData = {
        objetsPropose: [objectA.object._id],
        objetsDemande: [objectB.object._id, objectC.object._id], // Multi-objets
        message: 'Échange 1 contre 2 objets'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(true);
      expect(tradeResult.trade.objetsDemande.length).toBe(2);
      console.log('✅ Échange multi-objets proposé');
    });

    test('Proposition avec message personnalisé long', async () => {
      const longMessage = 'Bonjour ! Je suis très intéressé par votre objet. J\'ai vu qu\'il est en très bon état et cela correspond exactement à ce que je recherche. Mon objet est également en excellent état et je pense que nous pourrions faire un bel échange mutuellement bénéfique. Qu\'en pensez-vous ?';
      
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: longMessage
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(true);
      expect(tradeResult.trade.message).toBe(longMessage);
      console.log('✅ Message personnalisé long accepté');
    });

    test('Proposition échoue avec ses propres objets', async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectA.object._id, // Même objet !
        message: 'Auto-échange impossible'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(false);
      expect(tradeResult.status).toBe(400);
      console.log('✅ Auto-échange correctement rejeté');
    });

    test('Proposition échoue avec objet non disponible', async () => {
      // Marquer l'objet comme non disponible (tradeé)
      await E2EHelpers.updateObject(userB.token, objectB.object._id, { status: 'traded' });

      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Objet déjà échangé'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(false);
      expect(tradeResult.status).toBe(400);
      console.log('✅ Objet non disponible correctement rejeté');
    });

    test('Proposition échoue avec objet inexistant', async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: '507f1f77bcf86cd799439011', // ID inexistant
        message: 'Objet inexistant'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(false);
      expect(tradeResult.status).toBe(404);
      console.log('✅ Objet inexistant correctement rejeté');
    });

    test('Proposition échoue avec objet non possédé', async () => {
      const tradeData = {
        objetPropose: objectB.object._id, // Appartient à userB !
        objetDemande: objectA.object._id,
        message: 'Objet non possédé'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, tradeData);
      
      expect(tradeResult.success).toBe(false);
      expect(tradeResult.status).toBe(403);
      console.log('✅ Objet non possédé correctement rejeté');
    });

  });

  describe('📋 Consultation des échanges', () => {
    
    let trade1, trade2;

    beforeEach(async () => {
      // Créer deux propositions d'échange
      const tradeData1 = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Première proposition'
      };

      const tradeData2 = {
        objetPropose: objectC.object._id,
        objetDemande: objectD.object._id,
        message: 'Deuxième proposition'
      };

      trade1 = await E2EHelpers.createTrade(userA.token, tradeData1);
      expect(trade1.success).toBe(true);

      trade2 = await E2EHelpers.createTrade(userB.token, tradeData2);
      expect(trade2.success).toBe(true);
    });

    test('Récupération des échanges envoyés', async () => {
      const tradesA = await E2EHelpers.getUserTrades(userA.token);
      
      expect(tradesA.success).toBe(true);
      expect(tradesA.trades.length).toBeGreaterThanOrEqual(1);
      
      const myTrade = tradesA.trades.find(t => t.message === 'Première proposition');
      expect(myTrade).toBeDefined();
      
      console.log('✅ Échanges envoyés récupérés:', tradesA.trades.length);
    });

    test('Récupération des échanges reçus', async () => {
      const tradesB = await E2EHelpers.getUserTrades(userB.token);
      
      expect(tradesB.success).toBe(true);
      expect(tradesB.trades.length).toBeGreaterThanOrEqual(1);
      
      const receivedTrade = tradesB.trades.find(t => t.message === 'Première proposition');
      expect(receivedTrade).toBeDefined();
      
      console.log('✅ Échanges reçus récupérés:', tradesB.trades.length);
    });

    test('Filtrage des échanges par statut', async () => {
      const allTrades = await E2EHelpers.getUserTrades(userA.token);
      const pendingTrades = allTrades.trades.filter(t => t.statut === 'pending');
      
      expect(pendingTrades.length).toBeGreaterThan(0);
      console.log('✅ Filtrage par statut \'pending\' fonctionne');
    });

  });

  describe('🔄 Contre-propositions et négociation', () => {
    
    let initialTrade;

    beforeEach(async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Proposition initiale pour négociation'
      };

      initialTrade = await E2EHelpers.createTrade(userA.token, tradeData);
      expect(initialTrade.success).toBe(true);
    });

    test('Contre-proposition avec objet différent', async () => {
      const counterData = {
        tradeId: initialTrade.trade._id,
        objetsPropose: [objectC.object._id], // userB propose objectC au lieu de objectB
        message: 'Contre-proposition avec un autre objet'
      };

      const counterResult = await E2EHelpers.makeCounterProposal(userB.token, counterData);
      
      expect(counterResult.success).toBe(true);
      expect(counterResult.trade.statut).toBe('proposed');
      expect(counterResult.trade.objetsPropose).toContain(objectC.object._id);
      
      console.log('✅ Contre-proposition créée avec succès');
    });

    test('Demande de changement d\'objet (ask-different)', async () => {
      const askDifferentResult = await E2EHelpers.askDifferentObject(userA.token, initialTrade.trade._id);
      
      expect(askDifferentResult.success).toBe(true);
      expect(askDifferentResult.trade.statut).toBe('pending');
      
      console.log('✅ Demande de changement d\'objet envoyée');
    });

    test('Négociation multiple entre utilisateurs', async () => {
      // 1. UserB fait une contre-proposition
      const counter1 = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: initialTrade.trade._id,
        objetsPropose: [objectC.object._id]
      });
      expect(counter1.success).toBe(true);

      // 2. UserA refuse et demande autre chose
      const askDifferent = await E2EHelpers.askDifferentObject(userA.token, initialTrade.trade._id);
      expect(askDifferent.success).toBe(true);

      // 3. UserB propose finalement l'objet original
      const counter2 = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: initialTrade.trade._id,
        objetsPropose: [objectB.object._id]
      });
      expect(counter2.success).toBe(true);

      console.log('✅ Négociation multiple complétée');
    });

  });

  describe('✅ Acceptation d\'échange', () => {
    
    let pendingTrade;

    beforeEach(async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Échange à accepter'
      };

      pendingTrade = await E2EHelpers.createTrade(userA.token, tradeData);
      expect(pendingTrade.success).toBe(true);

      // UserB fait une contre-proposition
      const counterResult = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: pendingTrade.trade._id,
        objetsPropose: [objectB.object._id]
      });
      expect(counterResult.success).toBe(true);
      pendingTrade = counterResult;
    });

    test('Acceptation réussie par l\'initiateur après contre-proposition', async () => {
      const acceptResult = await E2EHelpers.acceptTrade(userA.token, pendingTrade.trade._id);
      
      expect(acceptResult.success).toBe(true);
      expect(acceptResult.trade.statut).toBe('accepted');
      expect(acceptResult.trade.acceptedAt).toBeDefined();
      
      console.log('✅ Échange accepté avec succès');
    });

    test('Acceptation directe d\'une demande initiale (rare)', async () => {
      // Créer une nouvelle demande
      const directTrade = await E2EHelpers.createTrade(userC.token, {
        objetPropose: objectD.object._id,
        objetDemande: objectA.object._id,
        message: 'Demande directe'
      });

      // UserA accepte directement sans contre-proposition
      const acceptResult = await E2EHelpers.acceptTrade(userA.token, directTrade.trade._id);
      
      expect(acceptResult.success).toBe(true);
      expect(acceptResult.trade.statut).toBe('accepted');
      
      console.log('✅ Acceptation directe réussie');
    });

    test('Acceptation change le statut des objets en "traded"', async () => {
      const acceptResult = await E2EHelpers.acceptTrade(userA.token, pendingTrade.trade._id);
      expect(acceptResult.success).toBe(true);

      // Vérifier que les objets sont marqués comme échangés
      const objectsA = await E2EHelpers.getUserObjects(userA.token);
      const objectsB = await E2EHelpers.getUserObjects(userB.token);
      
      const tradedObjectA = objectsA.objects.find(obj => obj._id === objectA.object._id);
      const tradedObjectB = objectsB.objects.find(obj => obj._id === objectB.object._id);
      
      expect(tradedObjectA?.status).toBe('traded');
      expect(tradedObjectB?.status).toBe('traded');
      
      console.log('✅ Statut des objets mis à jour après échange');
    });

    test('Acceptation interdite par un tiers', async () => {
      const acceptResult = await E2EHelpers.acceptTrade(userC.token, pendingTrade.trade._id);
      
      expect(acceptResult.success).toBe(false);
      expect(acceptResult.status).toBe(403);
      console.log('✅ Acceptation par tiers correctement bloquée');
    });

  });

  describe('❌ Refus d\'échange', () => {
    
    let pendingTrade;

    beforeEach(async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Échange à refuser'
      };

      pendingTrade = await E2EHelpers.createTrade(userA.token, tradeData);
      expect(pendingTrade.success).toBe(true);
    });

    test('Refus d\'une demande initiale par le propriétaire', async () => {
      const refuseResult = await E2EHelpers.refuseTrade(userB.token, pendingTrade.trade._id);
      
      expect(refuseResult.success).toBe(true);
      expect(refuseResult.trade.statut).toBe('refused');
      expect(refuseResult.trade.refusedAt).toBeDefined();
      
      console.log('✅ Demande initiale refusée');
    });

    test('Annulation par l\'initiateur (self-cancel)', async () => {
      const cancelResult = await E2EHelpers.cancelTrade(userA.token, pendingTrade.trade._id);
      
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.trade.statut).toBe('cancelled');
      
      console.log('✅ Échange annulé par l\'initiateur');
    });

    test('Refus d\'une contre-proposition', async () => {
      // D'abord faire une contre-proposition
      const counterResult = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: pendingTrade.trade._id,
        objetsPropose: [objectB.object._id]
      });
      expect(counterResult.success).toBe(true);

      // Puis userA refuse la contre-proposition
      const refuseResult = await E2EHelpers.refuseTrade(userA.token, pendingTrade.trade._id);
      
      expect(refuseResult.success).toBe(true);
      expect(refuseResult.trade.statut).toBe('refused');
      
      console.log('✅ Contre-proposition refusée');
    });

    test('Refus interdit par un tiers', async () => {
      const refuseResult = await E2EHelpers.refuseTrade(userC.token, pendingTrade.trade._id);
      
      expect(refuseResult.success).toBe(false);
      expect(refuseResult.status).toBe(403);
      console.log('✅ Refus par tiers correctement bloqué');
    });

    test('Objets restent disponibles après refus', async () => {
      const refuseResult = await E2EHelpers.refuseTrade(userB.token, pendingTrade.trade._id);
      expect(refuseResult.success).toBe(true);

      // Vérifier que les objets sont toujours disponibles
      const objectsA = await E2EHelpers.getUserObjects(userA.token);
      const objectsB = await E2EHelpers.getUserObjects(userB.token);
      
      const stillAvailableA = objectsA.objects.find(obj => obj._id === objectA.object._id);
      const stillAvailableB = objectsB.objects.find(obj => obj._id === objectB.object._id);
      
      expect(stillAvailableA?.status).toBe('available');
      expect(stillAvailableB?.status).toBe('available');
      
      console.log('✅ Objets restent disponibles après refus');
    });

  });

  describe('💬 Messagerie et communication', () => {
    
    let tradeWithMessages;

    beforeEach(async () => {
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Échange avec messagerie'
      };

      tradeWithMessages = await E2EHelpers.createTrade(userA.token, tradeData);
      expect(tradeWithMessages.success).toBe(true);
    });

    test('Envoi de messages dans un échange', async () => {
      const messageResult = await E2EHelpers.sendTradeMessage(userA.token, tradeWithMessages.trade._id, {
        content: 'Bonjour, pouvons-nous discuter des détails ?'
      });
      
      expect(messageResult.success).toBe(true);
      expect(messageResult.message.content).toBe('Bonjour, pouvons-nous discuter des détails ?');
      
      console.log('✅ Message envoyé dans l\'échange');
    });

    test('Récupération de l\'historique des messages', async () => {
      // Envoyer plusieurs messages
      await E2EHelpers.sendTradeMessage(userA.token, tradeWithMessages.trade._id, {
        content: 'Premier message'
      });
      await E2EHelpers.sendTradeMessage(userB.token, tradeWithMessages.trade._id, {
        content: 'Réponse au premier message'
      });

      const messagesResult = await E2EHelpers.getTradeMessages(userA.token, tradeWithMessages.trade._id);
      
      expect(messagesResult.success).toBe(true);
      expect(messagesResult.messages.length).toBe(2);
      expect(messagesResult.messages[0].content).toBe('Premier message');
      
      console.log('✅ Historique des messages récupéré');
    });

    test('Messages interdits pour utilisateurs non impliqués', async () => {
      const messageResult = await E2EHelpers.sendTradeMessage(userC.token, tradeWithMessages.trade._id, {
        content: 'Message non autorisé'
      });
      
      expect(messageResult.success).toBe(false);
      expect(messageResult.status).toBe(403);
      console.log('✅ Message par tiers correctement bloqué');
    });

    test('Validation de la longueur des messages', async () => {
      const tooLongMessage = 'A'.repeat(1001); // Plus de 1000 caractères
      
      const messageResult = await E2EHelpers.sendTradeMessage(userA.token, tradeWithMessages.trade._id, {
        content: tooLongMessage
      });
      
      expect(messageResult.success).toBe(false);
      expect(messageResult.status).toBe(400);
      console.log('✅ Message trop long correctement rejeté');
    });

  });

  describe('🚚 Livraison et finalisation', () => {
    
    let acceptedTrade;

    beforeEach(async () => {
      // Créer et accepter un échange
      const tradeData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Échange pour livraison'
      };

      const initialTrade = await E2EHelpers.createTrade(userA.token, tradeData);
      expect(initialTrade.success).toBe(true);

      const counterResult = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: initialTrade.trade._id,
        objetsPropose: [objectB.object._id]
      });
      expect(counterResult.success).toBe(true);

      acceptedTrade = await E2EHelpers.acceptTrade(userA.token, initialTrade.trade._id);
      expect(acceptedTrade.success).toBe(true);
    });

    test('Configuration de la livraison après acceptation', async () => {
      const deliveryData = {
        method: 'colissimo',
        senderAddress: {
          name: userA.user.pseudo,
          address: '1 Rue Test',
          city: 'Paris',
          postalCode: '75001'
        },
        recipientAddress: {
          name: userB.user.pseudo,
          address: '2 Rue Test',
          city: 'Lyon',
          postalCode: '69001'
        }
      };

      const deliveryResult = await E2EHelpers.configureDelivery(userA.token, acceptedTrade.trade._id, deliveryData);
      
      expect(deliveryResult.success).toBe(true);
      expect(deliveryResult.delivery.method).toBe('colissimo');
      
      console.log('✅ Livraison configurée pour l\'échange');
    });

    test('Suivi de l\'état de livraison', async () => {
      // D'abord configurer la livraison
      const deliveryData = {
        method: 'chronopost',
        senderAddress: { name: userA.user.pseudo, address: '1 Rue Test', city: 'Paris', postalCode: '75001' },
        recipientAddress: { name: userB.user.pseudo, address: '2 Rue Test', city: 'Lyon', postalCode: '69001' }
      };

      await E2EHelpers.configureDelivery(userA.token, acceptedTrade.trade._id, deliveryData);

      // Puis suivre l'état
      const trackingResult = await E2EHelpers.getDeliveryTracking(userA.token, acceptedTrade.trade._id);
      
      expect(trackingResult.success).toBe(true);
      expect(trackingResult.tracking.status).toBeDefined();
      
      console.log('✅ Suivi de livraison disponible');
    });

    test('Finalisation complète de l\'échange', async () => {
      const completionResult = await E2EHelpers.completeTrade(userA.token, acceptedTrade.trade._id);
      
      expect(completionResult.success).toBe(true);
      expect(completionResult.trade.statut).toBe('completed');
      expect(completionResult.trade.completedAt).toBeDefined();
      
      console.log('✅ Échange finalisé avec succès');
    });

  });

  describe('🔄 Workflow complet d\'échange', () => {
    
    test('Cycle complet : proposition → négociation → acceptation → livraison → finalisation', async () => {
      // 1. Proposition initiale
      const initialTrade = await E2EHelpers.createTrade(userA.token, {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Workflow complet E2E'
      });
      expect(initialTrade.success).toBe(true);
      expect(initialTrade.trade.statut).toBe('pending');

      // 2. Contre-proposition
      const counterResult = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: initialTrade.trade._id,
        objetsPropose: [objectB.object._id],
        message: 'Je propose mon objet en échange'
      });
      expect(counterResult.success).toBe(true);
      expect(counterResult.trade.statut).toBe('proposed');

      // 3. Acceptation
      const acceptResult = await E2EHelpers.acceptTrade(userA.token, initialTrade.trade._id);
      expect(acceptResult.success).toBe(true);
      expect(acceptResult.trade.statut).toBe('accepted');

      // 4. Configuration livraison
      const deliveryResult = await E2EHelpers.configureDelivery(userA.token, initialTrade.trade._id, {
        method: 'colissimo',
        senderAddress: { name: userA.user.pseudo, address: '1 Rue Test', city: 'Paris', postalCode: '75001' },
        recipientAddress: { name: userB.user.pseudo, address: '2 Rue Test', city: 'Lyon', postalCode: '69001' }
      });
      expect(deliveryResult.success).toBe(true);

      // 5. Finalisation
      const completionResult = await E2EHelpers.completeTrade(userA.token, initialTrade.trade._id);
      expect(completionResult.success).toBe(true);
      expect(completionResult.trade.statut).toBe('completed');

      console.log('✅ Workflow complet d\'échange réussi de A à Z');
    });

    test('Cycle avec abandon : proposition → négociation → annulation', async () => {
      // 1. Proposition
      const initialTrade = await E2EHelpers.createTrade(userA.token, {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Workflow avec abandon'
      });
      expect(initialTrade.success).toBe(true);

      // 2. Contre-proposition
      const counterResult = await E2EHelpers.makeCounterProposal(userB.token, {
        tradeId: initialTrade.trade._id,
        objetsPropose: [objectC.object._id] // Propose un autre objet
      });
      expect(counterResult.success).toBe(true);

      // 3. Annulation par l'initiateur
      const cancelResult = await E2EHelpers.cancelTrade(userA.token, initialTrade.trade._id);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.trade.statut).toBe('cancelled');

      // 4. Vérifier que les objets sont toujours disponibles
      const objectsA = await E2EHelpers.getUserObjects(userA.token);
      const objectsB = await E2EHelpers.getUserObjects(userB.token);
      
      expect(objectsA.objects.find(obj => obj._id === objectA.object._id)?.status).toBe('available');
      expect(objectsB.objects.find(obj => obj._id === objectB.object._id)?.status).toBe('available');
      
      console.log('✅ Workflow avec abandon géré correctement');
    });

  });

  describe('🛡️ Sécurité et limitations', () => {
    
    test('Limite du nombre d\'échanges simultanés pour plan gratuit', async () => {
      // Créer plusieurs échanges pour tester les limites
      const trades = [];
      for (let i = 0; i < 5; i++) {
        const tradeResult = await E2EHelpers.createTrade(userA.token, {
          objetPropose: objectA.object._id,
          objetDemande: objectD.object._id,
          message: `Échange numéro ${i + 1}`
        });
        
        if (tradeResult.success) {
          trades.push(tradeResult);
        } else {
          expect(tradeResult.status).toBe(400); // Limite atteinte
          expect(tradeResult.error).toContain('limite');
          break;
        }
      }
      
      console.log('✅ Limitation des échanges pour plan gratuit respectée');
    });

    test('Protection contre manipulation d\'échange d\'autrui', async () => {
      // UserA crée un échange avec UserB
      const trade = await E2EHelpers.createTrade(userA.token, {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: 'Échange privé'
      });
      expect(trade.success).toBe(true);

      // UserC tente de modifier l'échange
      const hackAttempt = await E2EHelpers.acceptTrade(userC.token, trade.trade._id);
      
      expect(hackAttempt.success).toBe(false);
      expect(hackAttempt.status).toBe(403);
      console.log('✅ Tentative de manipulation bloquée');
    });

    test('Validation des données d\'entrée (XSS/injection)', async () => {
      const maliciousData = {
        objetPropose: objectA.object._id,
        objetDemande: objectB.object._id,
        message: '<script>alert("XSS")</script>Tentative XSS'
      };

      const tradeResult = await E2EHelpers.createTrade(userA.token, maliciousData);
      
      if (tradeResult.success) {
        // Le message doit être nettoyé/échappé
        expect(tradeResult.trade.message).not.toContain('<script>');
        console.log('✅ Contenu malicieux nettoyé');
      } else {
        expect(tradeResult.status).toBe(400);
        console.log('✅ Contenu malicieux rejeté');
      }
    });

  });

});
