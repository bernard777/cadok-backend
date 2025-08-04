/**
 * 🔄 SERVICE TROC BIDIRECTIONNEL
 * Gestion des livraisons croisées pour échange mutuel
 */

const PickupPointService = require('./pickupPointService');
const crypto = require('crypto');

class BidirectionalTradeService extends PickupPointService {
    constructor() {
        super();
    }

    /**
     * Créer les 2 livraisons pour un troc bidirectionnel
     */
    async createBidirectionalDelivery(trade) {
        try {
            console.log('📦📦 CRÉATION LIVRAISON BIDIRECTIONNELLE\n');
            
            // 1. Points relais pour chaque utilisateur
            const fromUserPickupPoint = this.findNearestPickupPoint(trade.toUser.address);
            const toUserPickupPoint = this.findNearestPickupPoint(trade.fromUser.address);
            
            console.log('🏪 Points relais sélectionnés :');
            console.log(`   Pour ${trade.toUser.firstName} : ${fromUserPickupPoint.name} (${fromUserPickupPoint.address.city})`);
            console.log(`   Pour ${trade.fromUser.firstName} : ${toUserPickupPoint.name} (${toUserPickupPoint.address.city})`);
            
            // 2. Codes de retrait uniques
            const fromUserCode = this.generateWithdrawalCode(trade._id, trade.toUser._id);
            const toUserCode = this.generateWithdrawalCode(trade._id, trade.fromUser._id);
            
            console.log('\n🔑 Codes de retrait générés :');
            console.log(`   ${trade.fromUser.firstName} → ${trade.toUser.firstName} : ${fromUserCode}`);
            console.log(`   ${trade.toUser.firstName} → ${trade.fromUser.firstName} : ${toUserCode}`);
            
            // 3. Créer les données de livraison
            const fromUserDelivery = this.createDeliveryData(
                trade, 
                'fromUser', 
                fromUserPickupPoint, 
                fromUserCode
            );
            
            const toUserDelivery = this.createDeliveryData(
                trade, 
                'toUser', 
                toUserPickupPoint, 
                toUserCode
            );
            
            // 4. Instructions pour les utilisateurs
            const instructions = this.generateBidirectionalInstructions(
                trade, 
                fromUserDelivery, 
                toUserDelivery
            );
            
            console.log('\n✅ Livraisons bidirectionnelles créées avec succès\n');
            
            return {
                success: true,
                fromUserDelivery,
                toUserDelivery,
                instructions,
                summary: {
                    totalDeliveries: 2,
                    fromUserSends: trade.itemSent.title,
                    toUserSends: trade.itemReceived?.title || 'Objet en échange',
                    estimatedDelivery: '2-3 jours ouvrés'
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur création livraison bidirectionnelle:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Créer les données de livraison pour un utilisateur
     */
    createDeliveryData(trade, userRole, pickupPoint, withdrawalCode) {
        const isFromUser = userRole === 'fromUser';
        const sender = isFromUser ? trade.fromUser : trade.toUser;
        const recipient = isFromUser ? trade.toUser : trade.fromUser;
        
        return {
            userRole,
            tradeId: trade._id,
            sender: {
                name: `${sender.firstName} ${sender.lastName}`,
                address: sender.address
            },
            recipient: {
                name: `${recipient.firstName} ${recipient.lastName}`,
                address: recipient.address
            },
            pickupPoint,
            withdrawalCode,
            itemDescription: isFromUser ? trade.itemSent?.title : trade.itemReceived?.title,
            status: 'label_generated',
            createdAt: new Date(),
            shippingLabel: this.generateShippingLabel(sender, pickupPoint, withdrawalCode),
            trackingInfo: {
                provider: pickupPoint.partner,
                trackingNumber: null, // Sera rempli lors de l'expédition
                status: 'label_created'
            }
        };
    }
    
    /**
     * Générer l'étiquette d'expédition
     */
    generateShippingLabel(sender, pickupPoint, withdrawalCode) {
        return {
            from: {
                name: `${sender.firstName} ${sender.lastName}`,
                address: sender.address
            },
            to: {
                name: pickupPoint.name,
                address: pickupPoint.address,
                specialInstructions: [
                    `Code de retrait : ${withdrawalCode}`,
                    `Destinataire final : ${sender.firstName} (pièce d'identité requise)`,
                    `Service CADOK - Troc sécurisé`,
                    `Contact : support@cadok.fr`
                ]
            },
            specialHandling: [
                '🔄 TROC BIDIRECTIONNEL',
                '🆔 Pièce d\'identité obligatoire',
                '📞 Contact point relais requis en cas de problème'
            ]
        };
    }
    
    /**
     * Générer les instructions pour les 2 utilisateurs
     */
    generateBidirectionalInstructions(trade, fromUserDelivery, toUserDelivery) {
        return {
            fromUser: {
                role: 'Expéditeur ET Destinataire',
                sending: {
                    title: `📦 Vous envoyez : ${trade.itemSent?.title}`,
                    steps: [
                        '1. 🖨️ Imprimez votre bordereau d\'expédition',
                        '2. 📦 Emballez soigneusement votre objet',
                        '3. 🏷️ Collez l\'étiquette sur votre colis',
                        `4. 🏪 Déposez au ${fromUserDelivery.pickupPoint.name}`,
                        `   📍 ${fromUserDelivery.pickupPoint.address.street}`,
                        '5. 📱 Confirmez l\'expédition dans l\'app'
                    ],
                    pickupPoint: fromUserDelivery.pickupPoint,
                    withdrawalCode: fromUserDelivery.withdrawalCode
                },
                receiving: {
                    title: `📬 Vous recevez : ${trade.itemReceived?.title || 'Objet en échange'}`,
                    steps: [
                        '1. 📱 Vous serez notifié quand votre colis arrivera',
                        `2. 🏪 Rendez-vous au ${toUserDelivery.pickupPoint.name}`,
                        `   📍 ${toUserDelivery.pickupPoint.address.street}`,
                        `3. 🔑 Donnez le code : ${toUserDelivery.withdrawalCode}`,
                        '4. 🆔 Présentez votre pièce d\'identité',
                        '5. 📦 Récupérez votre colis'
                    ],
                    pickupPoint: toUserDelivery.pickupPoint,
                    withdrawalCode: toUserDelivery.withdrawalCode
                }
            },
            toUser: {
                role: 'Expéditeur ET Destinataire',
                sending: {
                    title: `📦 Vous envoyez : ${trade.itemReceived?.title || 'Votre objet'}`,
                    steps: [
                        '1. 🖨️ Imprimez votre bordereau d\'expédition',
                        '2. 📦 Emballez soigneusement votre objet',
                        '3. 🏷️ Collez l\'étiquette sur votre colis',
                        `4. 🏪 Déposez au ${toUserDelivery.pickupPoint.name}`,
                        `   📍 ${toUserDelivery.pickupPoint.address.street}`,
                        '5. 📱 Confirmez l\'expédition dans l\'app'
                    ],
                    pickupPoint: toUserDelivery.pickupPoint,
                    withdrawalCode: toUserDelivery.withdrawalCode
                },
                receiving: {
                    title: `📬 Vous recevez : ${trade.itemSent?.title}`,
                    steps: [
                        '1. 📱 Vous serez notifié quand votre colis arrivera',
                        `2. 🏪 Rendez-vous au ${fromUserDelivery.pickupPoint.name}`,
                        `   📍 ${fromUserDelivery.pickupPoint.address.street}`,
                        `3. 🔑 Donnez le code : ${fromUserDelivery.withdrawalCode}`,
                        '4. 🆔 Présentez votre pièce d\'identité',
                        '5. 📦 Récupérez votre colis'
                    ],
                    pickupPoint: fromUserDelivery.pickupPoint,
                    withdrawalCode: fromUserDelivery.withdrawalCode
                }
            }
        };
    }
    
    /**
     * Calculer le statut global du troc bidirectionnel
     */
    calculateGlobalStatus(fromUserDelivery, toUserDelivery) {
        const statuses = [fromUserDelivery.status, toUserDelivery.status];
        
        // Aucun n'a expédié
        if (statuses.every(s => s === 'label_generated')) {
            return 'labels_generated';
        }
        
        // Un seul a expédié
        if (statuses.includes('in_transit') && statuses.includes('label_generated')) {
            return 'partial_shipped';
        }
        
        // Les deux ont expédié
        if (statuses.every(s => s === 'in_transit')) {
            return 'both_shipped';
        }
        
        // Un seul est arrivé
        if (statuses.includes('arrived_at_pickup') && !statuses.every(s => s === 'arrived_at_pickup')) {
            return 'partial_arrived';
        }
        
        // Les deux sont arrivés
        if (statuses.every(s => s === 'arrived_at_pickup')) {
            return 'both_arrived';
        }
        
        // Un seul a été récupéré
        if (statuses.includes('delivered') && !statuses.every(s => s === 'delivered')) {
            return 'partial_delivered';
        }
        
        // Les deux ont été récupérés
        if (statuses.every(s => s === 'delivered')) {
            return 'completed';
        }
        
        return 'in_progress';
    }
    
    /**
     * Obtenir la prochaine action pour l'utilisateur
     */
    getNextActionForUser(userRole, userDelivery, otherUserDelivery, globalStatus) {
        const isFromUser = userRole === 'fromUser';
        
        // Actions d'expédition
        if (userDelivery.status === 'label_generated') {
            return {
                type: 'shipment',
                action: 'confirm_shipment',
                text: 'Confirmer l\'expédition de votre objet',
                priority: 'high'
            };
        }
        
        // Actions de récupération
        if (userDelivery.status === 'arrived_at_pickup') {
            return {
                type: 'pickup',
                action: 'confirm_pickup',
                text: 'Récupérer votre objet au point relais',
                priority: 'high'
            };
        }
        
        // Attente
        if (userDelivery.status === 'in_transit') {
            return {
                type: 'wait',
                action: 'wait_arrival',
                text: 'Votre colis est en transit, vous serez notifié à l\'arrivée',
                priority: 'low'
            };
        }
        
        // Encourager l'autre utilisateur
        if (otherUserDelivery.status === 'label_generated' && userDelivery.status !== 'label_generated') {
            return {
                type: 'encourage',
                action: 'wait_other_shipment',
                text: 'En attente de l\'expédition de l\'autre utilisateur',
                priority: 'medium'
            };
        }
        
        // Troc terminé
        if (globalStatus === 'completed') {
            return {
                type: 'completed',
                action: 'rate_exchange',
                text: 'Évaluer votre échange',
                priority: 'medium'
            };
        }
        
        return {
            type: 'wait',
            action: 'wait',
            text: 'En attente',
            priority: 'low'
        };
    }
}

// Test du service bidirectionnel
async function testBidirectionalService() {
    console.log('🧪 TEST DU SERVICE TROC BIDIRECTIONNEL\n');
    
    const service = new BidirectionalTradeService();
    
    // Données de test
    const testTrade = {
        _id: 'TR-BIDIRECTIONAL-001',
        fromUser: {
            _id: 'user1',
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
            _id: 'user2',
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
        }
    };
    
    console.log('📋 DONNÉES DU TROC :');
    console.log(`   ${testTrade.fromUser.firstName} envoie : ${testTrade.itemSent.title}`);
    console.log(`   ${testTrade.toUser.firstName} envoie : ${testTrade.itemReceived.title}`);
    console.log(`   ${testTrade.fromUser.firstName} habite : ${testTrade.fromUser.address.city}`);
    console.log(`   ${testTrade.toUser.firstName} habite : ${testTrade.toUser.address.city}\n`);
    
    // Créer les livraisons bidirectionnelles
    const result = await service.createBidirectionalDelivery(testTrade);
    
    if (result.success) {
        console.log('🎉 LIVRAISONS BIDIRECTIONNELLES CRÉÉES AVEC SUCCÈS !\n');
        
        console.log('📋 RÉSUMÉ :');
        console.log(`   • Total livraisons : ${result.summary.totalDeliveries}`);
        console.log(`   • ${testTrade.fromUser.firstName} envoie : ${result.summary.fromUserSends}`);
        console.log(`   • ${testTrade.toUser.firstName} envoie : ${result.summary.toUserSends}`);
        console.log(`   • Délai estimé : ${result.summary.estimatedDelivery}\n`);
        
        console.log('🔑 CODES DE RETRAIT :');
        console.log(`   • Pour ${testTrade.toUser.firstName} : ${result.fromUserDelivery.withdrawalCode}`);
        console.log(`   • Pour ${testTrade.fromUser.firstName} : ${result.toUserDelivery.withdrawalCode}\n`);
        
        console.log('🏪 POINTS RELAIS :');
        console.log(`   • ${testTrade.fromUser.firstName} dépose chez : ${result.fromUserDelivery.pickupPoint.name}`);
        console.log(`   • ${testTrade.toUser.firstName} dépose chez : ${result.toUserDelivery.pickupPoint.name}\n`);
        
        // Test du calcul de statut global
        const globalStatus = service.calculateGlobalStatus(
            result.fromUserDelivery,
            result.toUserDelivery
        );
        
        console.log('📊 STATUT GLOBAL :');
        console.log(`   • Status initial : ${globalStatus}`);
        
        // Test des prochaines actions
        const fromUserAction = service.getNextActionForUser(
            'fromUser',
            result.fromUserDelivery,
            result.toUserDelivery,
            globalStatus
        );
        
        const toUserAction = service.getNextActionForUser(
            'toUser',
            result.toUserDelivery,
            result.fromUserDelivery,
            globalStatus
        );
        
        console.log('\n📋 PROCHAINES ACTIONS :');
        console.log(`   • ${testTrade.fromUser.firstName} : ${fromUserAction.text}`);
        console.log(`   • ${testTrade.toUser.firstName} : ${toUserAction.text}\n`);
        
        console.log('✅ SERVICE BIDIRECTIONNEL OPÉRATIONNEL !');
        
    } else {
        console.log('❌ ÉCHEC DE LA CRÉATION DES LIVRAISONS');
        console.log('Erreur :', result.error);
    }
}

// Exécuter le test si ce fichier est lancé directement
if (require.main === module) {
    testBidirectionalService();
}

module.exports = BidirectionalTradeService;
