/**
 * 🔄 ROUTES TROC BIDIRECTIONNEL
 * APIs pour gérer les échanges mutuels avec double livraison
 */

const express = require('express');
const router = express.Router();
const BidirectionalTradeService = require('../services/bidirectionalTradeService');
const Trade = require('../models/Trade');

const service = new BidirectionalTradeService();

/**
 * POST /api/trades/:tradeId/bidirectional-delivery
 * Créer les livraisons bidirectionnelles pour un troc
 */
router.post('/:tradeId/bidirectional-delivery', async (req, res) => {
    try {
        console.log('📦📦 API: Création livraison bidirectionnelle');
        
        const { tradeId } = req.params;
        
        // Récupérer le troc avec les utilisateurs
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName address')
            .populate('toUser', 'firstName lastName address')
            .populate('itemSent', 'title weight')
            .populate('itemReceived', 'title weight');
            
        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Troc non trouvé'
            });
        }
        
        // Vérifier que le troc est accepté
        if (trade.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                error: 'Le troc doit être accepté avant de créer les livraisons'
            });
        }
        
        // Créer les livraisons bidirectionnelles
        const result = await service.createBidirectionalDelivery(trade);
        
        if (result.success) {
            // Mettre à jour le troc avec les données de livraison
            trade.delivery = {
                type: 'bidirectional',
                status: 'labels_generated',
                fromUserDelivery: result.fromUserDelivery,
                toUserDelivery: result.toUserDelivery,
                createdAt: new Date()
            };
            
            trade.status = 'delivery_preparation';
            await trade.save();
            
            res.json({
                success: true,
                message: 'Livraisons bidirectionnelles créées avec succès',
                data: {
                    tradeId: trade._id,
                    deliveryStatus: trade.delivery.status,
                    fromUserDelivery: result.fromUserDelivery,
                    toUserDelivery: result.toUserDelivery,
                    instructions: result.instructions,
                    summary: result.summary
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur création livraison bidirectionnelle:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création des livraisons'
        });
    }
});

/**
 * POST /api/trades/:tradeId/confirm-shipment/:userRole
 * Confirmer l'expédition pour un utilisateur spécifique
 */
router.post('/:tradeId/confirm-shipment/:userRole', async (req, res) => {
    try {
        const { tradeId, userRole } = req.params;
        const { trackingNumber, shippingDate } = req.body;
        
        console.log(`📦 API: Confirmation expédition ${userRole} pour troc ${tradeId}`);
        
        if (!['fromUser', 'toUser'].includes(userRole)) {
            return res.status(400).json({
                success: false,
                error: 'Role utilisateur invalide (fromUser ou toUser attendu)'
            });
        }
        
        const trade = await Trade.findById(tradeId);
        if (!trade || !trade.delivery) {
            return res.status(404).json({
                success: false,
                error: 'Troc ou livraison non trouvé'
            });
        }
        
        // Mettre à jour la livraison spécifique
        const deliveryField = `${userRole}Delivery`;
        
        if (!trade.delivery[deliveryField]) {
            return res.status(400).json({
                success: false,
                error: `Livraison ${userRole} non trouvée`
            });
        }
        
        // Mettre à jour le statut de cette livraison
        trade.delivery[deliveryField].status = 'in_transit';
        trade.delivery[deliveryField].trackingInfo.trackingNumber = trackingNumber;
        trade.delivery[deliveryField].trackingInfo.status = 'shipped';
        trade.delivery[deliveryField].shippedAt = shippingDate || new Date();
        
        // Calculer le nouveau statut global
        const globalStatus = service.calculateGlobalStatus(
            trade.delivery.fromUserDelivery,
            trade.delivery.toUserDelivery
        );
        
        trade.delivery.status = globalStatus;
        
        // Mettre à jour le statut du troc si nécessaire
        if (globalStatus === 'both_shipped') {
            trade.status = 'both_items_shipped';
        } else if (globalStatus === 'partial_shipped') {
            trade.status = 'partial_shipped';
        }
        
        await trade.save();
        
        // Prochaines actions pour les utilisateurs
        const fromUserAction = service.getNextActionForUser(
            'fromUser',
            trade.delivery.fromUserDelivery,
            trade.delivery.toUserDelivery,
            globalStatus
        );
        
        const toUserAction = service.getNextActionForUser(
            'toUser',
            trade.delivery.toUserDelivery,
            trade.delivery.fromUserDelivery,
            globalStatus
        );
        
        res.json({
            success: true,
            message: `Expédition confirmée pour ${userRole}`,
            data: {
                tradeId: trade._id,
                userRole,
                deliveryStatus: globalStatus,
                trackingNumber,
                nextActions: {
                    fromUser: fromUserAction,
                    toUser: toUserAction
                },
                currentDelivery: trade.delivery[deliveryField]
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur confirmation expédition:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la confirmation d\'expédition'
        });
    }
});

/**
 * POST /api/trades/:tradeId/confirm-arrival/:userRole
 * Confirmer l'arrivée au point relais pour un utilisateur spécifique
 */
router.post('/:tradeId/confirm-arrival/:userRole', async (req, res) => {
    try {
        const { tradeId, userRole } = req.params;
        const { arrivalDate, pickupPointConfirmation } = req.body;
        
        console.log(`🏪 API: Confirmation arrivée ${userRole} pour troc ${tradeId}`);
        
        const trade = await Trade.findById(tradeId);
        if (!trade || !trade.delivery) {
            return res.status(404).json({
                success: false,
                error: 'Troc ou livraison non trouvé'
            });
        }
        
        const deliveryField = `${userRole}Delivery`;
        
        // Mettre à jour le statut d'arrivée
        trade.delivery[deliveryField].status = 'arrived_at_pickup';
        trade.delivery[deliveryField].trackingInfo.status = 'arrived';
        trade.delivery[deliveryField].arrivedAt = arrivalDate || new Date();
        
        if (pickupPointConfirmation) {
            trade.delivery[deliveryField].pickupPointConfirmation = pickupPointConfirmation;
        }
        
        // Calculer le nouveau statut global
        const globalStatus = service.calculateGlobalStatus(
            trade.delivery.fromUserDelivery,
            trade.delivery.toUserDelivery
        );
        
        trade.delivery.status = globalStatus;
        
        if (globalStatus === 'both_arrived') {
            trade.status = 'both_items_ready_for_pickup';
        }
        
        await trade.save();
        
        res.json({
            success: true,
            message: `Arrivée confirmée pour ${userRole}`,
            data: {
                tradeId: trade._id,
                userRole,
                deliveryStatus: globalStatus,
                arrivalDate: trade.delivery[deliveryField].arrivedAt,
                withdrawalCode: trade.delivery[deliveryField].withdrawalCode,
                pickupPoint: trade.delivery[deliveryField].pickupPoint
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur confirmation arrivée:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la confirmation d\'arrivée'
        });
    }
});

/**
 * POST /api/trades/:tradeId/confirm-pickup/:userRole
 * Confirmer la récupération par l'utilisateur final
 */
router.post('/:tradeId/confirm-pickup/:userRole', async (req, res) => {
    try {
        const { tradeId, userRole } = req.params;
        const { pickupDate, withdrawalCodeUsed, recipientId } = req.body;
        
        console.log(`📦 API: Confirmation récupération ${userRole} pour troc ${tradeId}`);
        
        const trade = await Trade.findById(tradeId);
        if (!trade || !trade.delivery) {
            return res.status(404).json({
                success: false,
                error: 'Troc ou livraison non trouvé'
            });
        }
        
        const deliveryField = `${userRole}Delivery`;
        
        // Vérifier le code de retrait
        if (withdrawalCodeUsed !== trade.delivery[deliveryField].withdrawalCode) {
            return res.status(400).json({
                success: false,
                error: 'Code de retrait incorrect'
            });
        }
        
        // Mettre à jour le statut de récupération
        trade.delivery[deliveryField].status = 'delivered';
        trade.delivery[deliveryField].trackingInfo.status = 'delivered';
        trade.delivery[deliveryField].deliveredAt = pickupDate || new Date();
        trade.delivery[deliveryField].recipientId = recipientId;
        
        // Calculer le nouveau statut global
        const globalStatus = service.calculateGlobalStatus(
            trade.delivery.fromUserDelivery,
            trade.delivery.toUserDelivery
        );
        
        trade.delivery.status = globalStatus;
        
        // Si les deux objets ont été récupérés, le troc est terminé
        if (globalStatus === 'completed') {
            trade.status = 'completed';
            trade.completedAt = new Date();
        } else if (globalStatus === 'partial_delivered') {
            trade.status = 'partial_delivered';
        }
        
        await trade.save();
        
        res.json({
            success: true,
            message: `Récupération confirmée pour ${userRole}`,
            data: {
                tradeId: trade._id,
                userRole,
                deliveryStatus: globalStatus,
                pickupDate: trade.delivery[deliveryField].deliveredAt,
                isTradeCompleted: globalStatus === 'completed',
                tradeStatus: trade.status
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur confirmation récupération:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la confirmation de récupération'
        });
    }
});

/**
 * GET /api/trades/:tradeId/bidirectional-status
 * Obtenir le statut complet du troc bidirectionnel
 */
router.get('/:tradeId/bidirectional-status', async (req, res) => {
    try {
        const { tradeId } = req.params;
        
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName')
            .populate('toUser', 'firstName lastName');
            
        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Troc non trouvé'
            });
        }
        
        if (!trade.delivery || trade.delivery.type !== 'bidirectional') {
            return res.status(400).json({
                success: false,
                error: 'Ce troc n\'a pas de livraison bidirectionnelle'
            });
        }
        
        // Calculer les prochaines actions
        const fromUserAction = service.getNextActionForUser(
            'fromUser',
            trade.delivery.fromUserDelivery,
            trade.delivery.toUserDelivery,
            trade.delivery.status
        );
        
        const toUserAction = service.getNextActionForUser(
            'toUser',
            trade.delivery.toUserDelivery,
            trade.delivery.fromUserDelivery,
            trade.delivery.status
        );
        
        res.json({
            success: true,
            data: {
                tradeId: trade._id,
                tradeStatus: trade.status,
                deliveryStatus: trade.delivery.status,
                fromUser: {
                    name: `${trade.fromUser.firstName} ${trade.fromUser.lastName}`,
                    delivery: trade.delivery.fromUserDelivery,
                    nextAction: fromUserAction
                },
                toUser: {
                    name: `${trade.toUser.firstName} ${trade.toUser.lastName}`,
                    delivery: trade.delivery.toUserDelivery,
                    nextAction: toUserAction
                },
                timeline: {
                    created: trade.delivery.createdAt,
                    fromUserShipped: trade.delivery.fromUserDelivery.shippedAt,
                    toUserShipped: trade.delivery.toUserDelivery.shippedAt,
                    fromUserArrived: trade.delivery.fromUserDelivery.arrivedAt,
                    toUserArrived: trade.delivery.toUserDelivery.arrivedAt,
                    fromUserDelivered: trade.delivery.fromUserDelivery.deliveredAt,
                    toUserDelivered: trade.delivery.toUserDelivery.deliveredAt,
                    completed: trade.completedAt
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération statut bidirectionnel:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération du statut'
        });
    }
});

/**
 * GET /api/trades/:tradeId/user-instructions/:userRole
 * Obtenir les instructions spécifiques pour un utilisateur
 */
router.get('/:tradeId/user-instructions/:userRole', async (req, res) => {
    try {
        const { tradeId, userRole } = req.params;
        
        if (!['fromUser', 'toUser'].includes(userRole)) {
            return res.status(400).json({
                success: false,
                error: 'Role utilisateur invalide'
            });
        }
        
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName')
            .populate('toUser', 'firstName lastName')
            .populate('itemSent', 'title')
            .populate('itemReceived', 'title');
            
        if (!trade || !trade.delivery) {
            return res.status(404).json({
                success: false,
                error: 'Troc ou livraison non trouvé'
            });
        }
        
        // Recréer les instructions
        const result = await service.createBidirectionalDelivery(trade);
        
        if (result.success) {
            const userInstructions = result.instructions[userRole];
            
            res.json({
                success: true,
                data: {
                    userRole,
                    userName: userRole === 'fromUser' 
                        ? `${trade.fromUser.firstName} ${trade.fromUser.lastName}`
                        : `${trade.toUser.firstName} ${trade.toUser.lastName}`,
                    instructions: userInstructions,
                    currentStatus: trade.delivery.status
                }
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la génération des instructions'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur récupération instructions:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des instructions'
        });
    }
});

module.exports = router;
