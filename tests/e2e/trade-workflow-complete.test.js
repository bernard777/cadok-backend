/**
 * VRAI TEST E2E - Workflow complet de TROC
 * 2 utilisateurs, objets, proposition, négociation, finalisation
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Object = require('../../models/Object');
const Trade = require('../../models/Trade');

describe('🔄 WORKFLOW E2E COMPLET - SYSTÈME DE TROC', () => {
  
  let user1Data, user2Data;
  let user1Token, user2Token;
  let user1Id, user2Id;
  let user1Objects = [], user2Objects = [];
  let tradeId;

  beforeEach(async () => {
    // Données des deux utilisateurs pour le troc
    user1Data = {
      pseudo: 'TrocUser1_' + Date.now(),
      email: `troc1_${Date.now()}@cadok.com`,
      password: 'TrocPassword123!',
      firstName: 'Alice',
      lastName: 'Martin',
      city: 'Paris',
      zipCode: '75001'
    };

    user2Data = {
      pseudo: 'TrocUser2_' + Date.now(),
      email: `troc2_${Date.now()}@cadok.com`,
      password: 'TrocPassword123!',
      firstName: 'Bob',
      lastName: 'Durand',
      city: 'Lyon',
      zipCode: '69001'
    };
  });

  test('🎯 WORKFLOW TROC COMPLET: 2 Users → Objets → Proposition → Négociation → Finalisation', async () => {
    
    // ===== PHASE 1: CRÉATION DES DEUX UTILISATEURS =====
    console.log('👥 PHASE 1: Création des deux utilisateurs...');
    
    // Inscription User 1
    const register1Response = await request(app)
      .post('/api/auth/register')
      .send(user1Data);
    
    expect(register1Response.status).toBe(201);
    user1Id = register1Response.body.user._id;
    
    // Connexion User 1
    const login1Response = await request(app)
      .post('/api/auth/login')
      .send({
        email: user1Data.email,
        password: user1Data.password
      });
    
    expect(login1Response.status).toBe(200);
    user1Token = login1Response.body.token;
    
    // Inscription User 2
    const register2Response = await request(app)
      .post('/api/auth/register')
      .send(user2Data);
    
    expect(register2Response.status).toBe(201);
    user2Id = register2Response.body.user._id;
    
    // Connexion User 2
    const login2Response = await request(app)
      .post('/api/auth/login')
      .send({
        email: user2Data.email,
        password: user2Data.password
      });
    
    expect(login2Response.status).toBe(200);
    user2Token = login2Response.body.token;
    
    console.log('✅ Deux utilisateurs créés et connectés');
    console.log(`   - User 1: ${user1Data.pseudo} (${user1Id})`);
    console.log(`   - User 2: ${user2Data.pseudo} (${user2Id})`);

    // ===== PHASE 2: CRÉATION D'OBJETS POUR CHAQUE UTILISATEUR =====
    console.log('📦 PHASE 2: Création d\'objets pour chaque utilisateur...');
    
    // Objets de User 1
    const user1Object1Response = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'MacBook Pro 2021',
        description: 'MacBook Pro M1 en excellent état',
        category: 'Électronique',
        condition: 'Excellent état',
        estimatedValue: 1200,
        available: true
      });
    
    expect(user1Object1Response.status).toBe(201);
    user1Objects.push(user1Object1Response.body.object);
    
    const user1Object2Response = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Casque Bose QC35',
        description: 'Casque audio à réduction de bruit',
        category: 'Électronique',
        condition: 'Bon état',
        estimatedValue: 200,
        available: true
      });
    
    expect(user1Object2Response.status).toBe(201);
    user1Objects.push(user1Object2Response.body.object);
    
    // Objets de User 2
    const user2Object1Response = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'iPad Pro 2022',
        description: 'iPad Pro avec Apple Pencil',
        category: 'Électronique',
        condition: 'Excellent état',
        estimatedValue: 800,
        available: true
      });
    
    expect(user2Object1Response.status).toBe(201);
    user2Objects.push(user2Object1Response.body.object);
    
    const user2Object2Response = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        title: 'AirPods Pro',
        description: 'Écouteurs sans fil Apple',
        category: 'Électronique',
        condition: 'Bon état',
        estimatedValue: 150,
        available: true
      });
    
    expect(user2Object2Response.status).toBe(201);
    user2Objects.push(user2Object2Response.body.object);
    
    console.log('✅ Objets créés pour les deux utilisateurs');
    console.log(`   - User 1: ${user1Objects.length} objets`);
    console.log(`   - User 2: ${user2Objects.length} objets`);

    // ===== PHASE 3: PROPOSITION DE TROC =====
    console.log('🤝 PHASE 3: User 1 propose un troc à User 2...');
    
    // User 1 veut l'iPad de User 2 et propose son MacBook + Casque
    const tradeProposalResponse = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        requestedObject: user2Objects[0]._id, // iPad Pro
        offeredObjects: [user1Objects[0]._id], // MacBook Pro seulement
        receiverId: user2Id,
        message: 'Salut ! Je suis intéressé par ton iPad Pro. Je te propose mon MacBook Pro en échange. Qu\'est-ce que tu en penses ?'
      });
    
    expect(tradeProposalResponse.status).toBe(201);
    expect(tradeProposalResponse.body).toHaveProperty('success', true);
    expect(tradeProposalResponse.body.trade.status).toBe('pending');
    
    tradeId = tradeProposalResponse.body.trade._id;
    console.log('✅ Proposition de troc créée:', tradeId);
    
    // Vérifier en base de données
    const tradeInDB = await Trade.findById(tradeId);
    expect(tradeInDB).toBeTruthy();
    expect(tradeInDB.status).toBe('pending');
    expect(tradeInDB.requester.toString()).toBe(user1Id);

    // ===== PHASE 4: USER 2 CONSULTE LES TROCS REÇUS =====
    console.log('📋 PHASE 4: User 2 consulte les trocs reçus...');
    
    const receivedTradesResponse = await request(app)
      .get('/api/trades/received')
      .set('Authorization', `Bearer ${user2Token}`);
    
    expect(receivedTradesResponse.status).toBe(200);
    expect(receivedTradesResponse.body.trades).toHaveLength(1);
    expect(receivedTradesResponse.body.trades[0]._id).toBe(tradeId);
    expect(receivedTradesResponse.body.trades[0].status).toBe('pending');
    
    console.log('✅ User 2 voit la proposition de troc');

    // ===== PHASE 5: USER 2 CONTRE-PROPOSE =====
    console.log('💬 PHASE 5: User 2 contre-propose...');
    
    const counterOfferResponse = await request(app)
      .post(`/api/trades/${tradeId}/counter-offer`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        requestedObjects: [user1Objects[0]._id, user1Objects[1]._id], // MacBook + Casque
        message: 'Ton MacBook m\'intéresse, mais il faudrait que tu ajoutes le casque Bose pour équilibrer la valeur. Qu\'est-ce que tu en dis ?'
      });
    
    expect(counterOfferResponse.status).toBe(200);
    expect(counterOfferResponse.body).toHaveProperty('success', true);
    
    console.log('✅ Contre-proposition envoyée');

    // ===== PHASE 6: USER 1 ACCEPTE LA CONTRE-PROPOSITION =====
    console.log('✅ PHASE 6: User 1 accepte la contre-proposition...');
    
    const acceptResponse = await request(app)
      .post(`/api/trades/${tradeId}/accept`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        message: 'D\'accord pour le MacBook + le casque contre ton iPad. Marché conclu !'
      });
    
    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body).toHaveProperty('success', true);
    expect(acceptResponse.body.trade.status).toBe('accepted');
    
    console.log('✅ Troc accepté, statut: accepted');
    
    // Vérifier en base de données
    const acceptedTradeInDB = await Trade.findById(tradeId);
    expect(acceptedTradeInDB.status).toBe('accepted');

    // ===== PHASE 7: FINALISATION DU TROC =====
    console.log('🎉 PHASE 7: Finalisation du troc...');
    
    // User 1 confirme l'échange
    const confirmUser1Response = await request(app)
      .post(`/api/trades/${tradeId}/confirm`)
      .set('Authorization', `Bearer ${user1Token}`);
    
    expect(confirmUser1Response.status).toBe(200);
    
    // User 2 confirme l'échange
    const confirmUser2Response = await request(app)
      .post(`/api/trades/${tradeId}/confirm`)
      .set('Authorization', `Bearer ${user2Token}`);
    
    expect(confirmUser2Response.status).toBe(200);
    expect(confirmUser2Response.body.trade.status).toBe('completed');
    
    console.log('✅ Troc finalisé avec succès!');

    // ===== PHASE 8: VÉRIFICATION FINALE =====
    console.log('🔍 PHASE 8: Vérifications finales...');
    
    // Vérifier que les objets ont changé de propriétaire
    const finalTradeInDB = await Trade.findById(tradeId)
      .populate('requestedObject')
      .populate('offeredObjects');
    
    expect(finalTradeInDB.status).toBe('completed');
    expect(finalTradeInDB.completedAt).toBeTruthy();
    
    // Vérifier les objets échangés
    const ipadAfterTrade = await Object.findById(user2Objects[0]._id);
    const macbookAfterTrade = await Object.findById(user1Objects[0]._id);
    const casqueAfterTrade = await Object.findById(user1Objects[1]._id);
    
    // Les objets devraient être marqués comme non disponibles
    expect(ipadAfterTrade.available).toBe(false);
    expect(macbookAfterTrade.available).toBe(false);
    expect(casqueAfterTrade.available).toBe(false);
    
    console.log('✅ Objets marqués comme échangés');
    
    // Vérifier l'historique des trocs
    const user1TradesHistory = await request(app)
      .get('/api/trades/history')
      .set('Authorization', `Bearer ${user1Token}`);
    
    expect(user1TradesHistory.status).toBe(200);
    expect(user1TradesHistory.body.trades).toHaveLength(1);
    expect(user1TradesHistory.body.trades[0].status).toBe('completed');
    
    const user2TradesHistory = await request(app)
      .get('/api/trades/history')
      .set('Authorization', `Bearer ${user2Token}`);
    
    expect(user2TradesHistory.status).toBe(200);
    expect(user2TradesHistory.body.trades).toHaveLength(1);
    expect(user2TradesHistory.body.trades[0].status).toBe('completed');
    
    console.log('✅ Historiques des trocs vérifiés');

    console.log('🎉 WORKFLOW TROC E2E COMPLET RÉUSSI!');
    console.log('📊 Résumé du troc:');
    console.log(`   - Troc ID: ${tradeId}`);
    console.log(`   - ${user1Data.pseudo} a échangé: MacBook Pro + Casque Bose`);
    console.log(`   - ${user2Data.pseudo} a échangé: iPad Pro`);
    console.log(`   - Statut final: completed`);
    console.log(`   - Objets marqués comme non disponibles`);
    
  }, 60000); // Timeout de 60 secondes pour le workflow complet

  test('🛡️ WORKFLOW E2E - Sécurité et cas d\'erreur dans les trocs', async () => {
    
    // Créer deux utilisateurs rapidement
    const { user: user1, token: token1 } = await global.createTestUser(user1Data);
    const { user: user2, token: token2 } = await global.createTestUser(user2Data);
    
    const object1 = await global.createTestObject({
      title: 'Objet Test Sécurité 1'
    }, user1);
    
    const object2 = await global.createTestObject({
      title: 'Objet Test Sécurité 2'
    }, user2);
    
    // Test: Proposer un troc avec un objet qui n'existe pas
    console.log('🔒 Test: Troc avec objet inexistant...');
    
    const invalidObjectResponse = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        requestedObject: '507f1f77bcf86cd799439011', // ID inexistant
        offeredObjects: [object1._id],
        receiverId: user2._id,
        message: 'Test objet inexistant'
      });
    
    expect(invalidObjectResponse.status).toBe(404);
    console.log('✅ Troc avec objet inexistant correctement rejeté');
    
    // Test: Proposer un troc pour son propre objet
    console.log('🔒 Test: Troc pour son propre objet...');
    
    const ownObjectResponse = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        requestedObject: object1._id, // Son propre objet
        offeredObjects: [object1._id],
        receiverId: user2._id,
        message: 'Test objet propre'
      });
    
    expect(ownObjectResponse.status).toBe(400);
    console.log('✅ Troc pour son propre objet correctement rejeté');
    
    // Test: Accepter un troc qui n'existe pas
    console.log('🔒 Test: Accepter troc inexistant...');
    
    const invalidTradeResponse = await request(app)
      .post('/api/trades/507f1f77bcf86cd799439011/accept')
      .set('Authorization', `Bearer ${token2}`);
    
    expect(invalidTradeResponse.status).toBe(404);
    console.log('✅ Acceptation de troc inexistant correctement rejetée');
    
  }, 30000);

});
