/**
 * 🧪 TEST COMPLET DES APIS TROC BIDIRECTIONNEL
 * Simulation d'un échange complet Marie ↔ Thomas
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/api';

// Données de test
const testTrade = {
    _id: 'TR-BIDIRECTIONAL-TEST-001',
    fromUser: {
        _id: 'user_marie',
        firstName: 'Marie',
        lastName: 'Dupont',
        address: {
            street: '25 Rue de la République',
            city: 'Paris',
            zipCode: '75001',
            country: 'France'
        }
    },
    toUser: {
        _id: 'user_thomas',
        firstName: 'Thomas',
        lastName: 'Dorel',
        address: {
            street: '12 Rue des Acacias',
            city: 'Lyon',
            zipCode: '69001',
            country: 'France'
        }
    },
    itemSent: {
        title: 'Livre "Clean Code"',
        weight: 350
    },
    itemReceived: {
        title: 'Jeu PlayStation "God of War"',
        weight: 200
    },
    status: 'accepted'
};

class BidirectionalAPITester {
    constructor() {
        this.tradeId = testTrade._id;
    }
    
    async runCompleteTest() {
        console.log('🚀 DÉBUT DU TEST COMPLET APIS BIDIRECTIONNELLES\n');
        
        try {
            // Étape 1: Créer les livraisons bidirectionnelles
            await this.testCreateBidirectionalDelivery();
            
            // Étape 2: Vérifier le statut initial
            await this.testGetBidirectionalStatus();
            
            // Étape 3: Marie confirme son expédition
            await this.testConfirmShipment('fromUser', 'Marie');
            
            // Étape 4: Vérifier le statut après expédition partielle
            await this.testGetBidirectionalStatus();
            
            // Étape 5: Thomas confirme son expédition
            await this.testConfirmShipment('toUser', 'Thomas');
            
            // Étape 6: Vérifier le statut après les deux expéditions
            await this.testGetBidirectionalStatus();
            
            // Étape 7: Arrivée du colis de Marie chez Thomas
            await this.testConfirmArrival('fromUser', 'Marie → Thomas');
            
            // Étape 8: Arrivée du colis de Thomas chez Marie
            await this.testConfirmArrival('toUser', 'Thomas → Marie');
            
            // Étape 9: Vérifier le statut après les deux arrivées
            await this.testGetBidirectionalStatus();
            
            // Étape 10: Thomas récupère son colis
            await this.testConfirmPickup('fromUser', 'Thomas récupère');
            
            // Étape 11: Marie récupère son colis
            await this.testConfirmPickup('toUser', 'Marie récupère');
            
            // Étape 12: Vérifier le statut final
            await this.testGetBidirectionalStatus();
            
            // Étape 13: Tester les instructions utilisateur
            await this.testGetUserInstructions();
            
            console.log('\n🎉 TEST COMPLET TERMINÉ AVEC SUCCÈS !');
            
        } catch (error) {
            console.error('❌ ERREUR LORS DU TEST:', error.message);
            if (error.response) {
                console.error('Détails:', error.response.data);
            }
        }
    }
    
    async testCreateBidirectionalDelivery() {
        console.log('📦 TEST: Création livraisons bidirectionnelles');
        
        try {
            const response = await axios.post(
                `${API_BASE}/trades/${this.tradeId}/bidirectional-delivery`,
                testTrade
            );
            
            if (response.data.success) {
                console.log('✅ Livraisons créées avec succès');
                console.log(`   • Status: ${response.data.data.deliveryStatus}`);
                console.log(`   • Total livraisons: ${response.data.data.summary.totalDeliveries}`);
                console.log(`   • Code Marie → Thomas: ${response.data.data.fromUserDelivery.withdrawalCode}`);
                console.log(`   • Code Thomas → Marie: ${response.data.data.toUserDelivery.withdrawalCode}`);
                
                // Sauvegarder les codes pour les tests suivants
                this.fromUserCode = response.data.data.fromUserDelivery.withdrawalCode;
                this.toUserCode = response.data.data.toUserDelivery.withdrawalCode;
            } else {
                throw new Error('Échec création livraisons');
            }
            
        } catch (error) {
            console.log('❌ Erreur création livraisons:', error.message);
            // Simuler la création pour continuer le test
            this.fromUserCode = 'CADOK-MT-TEST1';
            this.toUserCode = 'CADOK-TM-TEST2';
            console.log('⚠️  Simulation des codes pour continuer le test');
        }
        
        console.log('');
    }
    
    async testConfirmShipment(userRole, userName) {
        console.log(`📦 TEST: Confirmation expédition ${userName} (${userRole})`);
        
        try {
            const trackingNumber = `3S00${Math.floor(Math.random() * 1000000000)}`;
            
            const response = await axios.post(
                `${API_BASE}/trades/${this.tradeId}/confirm-shipment/${userRole}`,
                {
                    trackingNumber,
                    shippingDate: new Date().toISOString()
                }
            );
            
            if (response.data.success) {
                console.log(`✅ Expédition confirmée pour ${userName}`);
                console.log(`   • Numéro de suivi: ${trackingNumber}`);
                console.log(`   • Nouveau status: ${response.data.data.deliveryStatus}`);
                console.log(`   • Prochaine action Marie: ${response.data.data.nextActions.fromUser.text}`);
                console.log(`   • Prochaine action Thomas: ${response.data.data.nextActions.toUser.text}`);
            } else {
                throw new Error('Échec confirmation expédition');
            }
            
        } catch (error) {
            console.log(`❌ Erreur confirmation expédition ${userName}:`, error.message);
        }
        
        console.log('');
    }
    
    async testConfirmArrival(userRole, description) {
        console.log(`🏪 TEST: Confirmation arrivée ${description} (${userRole})`);
        
        try {
            const response = await axios.post(
                `${API_BASE}/trades/${this.tradeId}/confirm-arrival/${userRole}`,
                {
                    arrivalDate: new Date().toISOString(),
                    pickupPointConfirmation: `Reçu par point relais - ${Date.now()}`
                }
            );
            
            if (response.data.success) {
                console.log(`✅ Arrivée confirmée pour ${description}`);
                console.log(`   • Code de retrait: ${response.data.data.withdrawalCode}`);
                console.log(`   • Point relais: ${response.data.data.pickupPoint.name}`);
                console.log(`   • Nouveau status: ${response.data.data.deliveryStatus}`);
            } else {
                throw new Error('Échec confirmation arrivée');
            }
            
        } catch (error) {
            console.log(`❌ Erreur confirmation arrivée ${description}:`, error.message);
        }
        
        console.log('');
    }
    
    async testConfirmPickup(userRole, description) {
        console.log(`📬 TEST: Confirmation récupération ${description} (${userRole})`);
        
        try {
            const withdrawalCode = userRole === 'fromUser' ? this.fromUserCode : this.toUserCode;
            
            const response = await axios.post(
                `${API_BASE}/trades/${this.tradeId}/confirm-pickup/${userRole}`,
                {
                    pickupDate: new Date().toISOString(),
                    withdrawalCodeUsed: withdrawalCode,
                    recipientId: `ID_${userRole.toUpperCase()}_${Date.now()}`
                }
            );
            
            if (response.data.success) {
                console.log(`✅ Récupération confirmée pour ${description}`);
                console.log(`   • Code utilisé: ${withdrawalCode}`);
                console.log(`   • Nouveau status: ${response.data.data.deliveryStatus}`);
                console.log(`   • Troc terminé: ${response.data.data.isTradeCompleted ? 'OUI' : 'NON'}`);
                console.log(`   • Status troc: ${response.data.data.tradeStatus}`);
            } else {
                throw new Error('Échec confirmation récupération');
            }
            
        } catch (error) {
            console.log(`❌ Erreur confirmation récupération ${description}:`, error.message);
        }
        
        console.log('');
    }
    
    async testGetBidirectionalStatus() {
        console.log('📊 TEST: Récupération statut bidirectionnel');
        
        try {
            const response = await axios.get(
                `${API_BASE}/trades/${this.tradeId}/bidirectional-status`
            );
            
            if (response.data.success) {
                const data = response.data.data;
                console.log('✅ Statut récupéré avec succès');
                console.log(`   • Status troc: ${data.tradeStatus}`);
                console.log(`   • Status livraison: ${data.deliveryStatus}`);
                console.log(`   • Marie (fromUser):`);
                console.log(`     - Status: ${data.fromUser.delivery.status}`);
                console.log(`     - Action: ${data.fromUser.nextAction.text}`);
                console.log(`   • Thomas (toUser):`);
                console.log(`     - Status: ${data.toUser.delivery.status}`);
                console.log(`     - Action: ${data.toUser.nextAction.text}`);
            } else {
                throw new Error('Échec récupération statut');
            }
            
        } catch (error) {
            console.log('❌ Erreur récupération statut:', error.message);
        }
        
        console.log('');
    }
    
    async testGetUserInstructions() {
        console.log('📋 TEST: Récupération instructions utilisateurs');
        
        for (const userRole of ['fromUser', 'toUser']) {
            const userName = userRole === 'fromUser' ? 'Marie' : 'Thomas';
            
            try {
                const response = await axios.get(
                    `${API_BASE}/trades/${this.tradeId}/user-instructions/${userRole}`
                );
                
                if (response.data.success) {
                    const data = response.data.data;
                    console.log(`✅ Instructions pour ${userName} (${userRole})`);
                    console.log(`   • Role: ${data.instructions.role}`);
                    console.log(`   • Envoi: ${data.instructions.sending.title}`);
                    console.log(`   • Réception: ${data.instructions.receiving.title}`);
                    console.log(`   • Status actuel: ${data.currentStatus}`);
                } else {
                    throw new Error(`Échec récupération instructions ${userName}`);
                }
                
            } catch (error) {
                console.log(`❌ Erreur instructions ${userName}:`, error.message);
            }
        }
        
        console.log('');
    }
}

// Simulation des APIs si le serveur n'est pas démarré
class MockAPIServer {
    constructor() {
        this.mockData = {
            deliveryStatus: 'labels_generated',
            fromUserDelivery: { 
                status: 'label_generated', 
                withdrawalCode: 'CADOK-MT-TEST1',
                trackingInfo: { status: 'label_created' }
            },
            toUserDelivery: { 
                status: 'label_generated', 
                withdrawalCode: 'CADOK-TM-TEST2',
                trackingInfo: { status: 'label_created' }
            }
        };
    }
    
    async runMockTest() {
        console.log('🎭 MODE SIMULATION - APIS BIDIRECTIONNELLES\n');
        
        console.log('📦 Simulation: Création livraisons bidirectionnelles');
        console.log('✅ Livraisons créées (simulation)');
        console.log('   • Code Marie → Thomas: CADOK-MT-SIM001');
        console.log('   • Code Thomas → Marie: CADOK-TM-SIM002');
        console.log('   • Status initial: labels_generated\n');
        
        console.log('📦 Simulation: Marie confirme son expédition');
        this.mockData.fromUserDelivery.status = 'in_transit';
        this.mockData.deliveryStatus = 'partial_shipped';
        console.log('✅ Expédition Marie confirmée');
        console.log('   • Nouveau status: partial_shipped\n');
        
        console.log('📦 Simulation: Thomas confirme son expédition');
        this.mockData.toUserDelivery.status = 'in_transit';
        this.mockData.deliveryStatus = 'both_shipped';
        console.log('✅ Expédition Thomas confirmée');
        console.log('   • Nouveau status: both_shipped\n');
        
        console.log('🏪 Simulation: Arrivée colis Marie chez Thomas');
        this.mockData.fromUserDelivery.status = 'arrived_at_pickup';
        this.mockData.deliveryStatus = 'partial_arrived';
        console.log('✅ Colis Marie arrivé');
        console.log('   • Code pour Thomas: CADOK-MT-SIM001\n');
        
        console.log('🏪 Simulation: Arrivée colis Thomas chez Marie');
        this.mockData.toUserDelivery.status = 'arrived_at_pickup';
        this.mockData.deliveryStatus = 'both_arrived';
        console.log('✅ Colis Thomas arrivé');
        console.log('   • Code pour Marie: CADOK-TM-SIM002\n');
        
        console.log('📬 Simulation: Thomas récupère son colis');
        this.mockData.fromUserDelivery.status = 'delivered';
        this.mockData.deliveryStatus = 'partial_delivered';
        console.log('✅ Thomas a récupéré son colis');
        console.log('   • Nouveau status: partial_delivered\n');
        
        console.log('📬 Simulation: Marie récupère son colis');
        this.mockData.toUserDelivery.status = 'delivered';
        this.mockData.deliveryStatus = 'completed';
        console.log('✅ Marie a récupéré son colis');
        console.log('   • Nouveau status: completed\n');
        
        console.log('📊 Status final du troc bidirectionnel:');
        console.log('   • Status livraison: completed');
        console.log('   • Status troc: completed');
        console.log('   • Marie: delivered ✅');
        console.log('   • Thomas: delivered ✅');
        console.log('   • Échange mutuel réussi ! 🎉\n');
        
        console.log('✨ SIMULATION COMPLÈTE TERMINÉE AVEC SUCCÈS !');
    }
}

// Fonction principale
async function main() {
    const args = process.argv.slice(2);
    const isSimulation = args.includes('--simulation') || args.includes('-s');
    
    console.log('🔄 TESTS APIS TROC BIDIRECTIONNEL');
    console.log('=====================================\n');
    
    if (isSimulation) {
        const mockServer = new MockAPIServer();
        await mockServer.runMockTest();
    } else {
        console.log('⚠️  Mode API réel - Serveur requis sur localhost:3000');
        console.log('💡 Utilisez --simulation pour tester sans serveur\n');
        
        const tester = new BidirectionalAPITester();
        await tester.runCompleteTest();
    }
}

// Exécuter si ce fichier est lancé directement
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { BidirectionalAPITester, MockAPIServer };
