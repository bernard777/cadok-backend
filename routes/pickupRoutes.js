/**
 * 🚚 ROUTES POINT RELAIS CADOK
 * Nouvelles APIs pour la livraison anonyme via points relais
 */

const express = require('express');
const router = express.Router();
const PickupPointService = require('../services/pickupPointService');
const Trade = require('../models/Trade');
const { auth } = require('../middlewares/authMiddleware');

// ==================== GÉNÉRATION BORDEREAU POINT RELAIS ====================

/**
 * Générer un bordereau de livraison via point relais
 * POST /api/trades/:tradeId/generate-pickup-label
 */
router.post('/:tradeId/generate-pickup-label', auth, async (req, res) => {
    try {
        console.log('🎫 Génération bordereau point relais...');
        
        const { tradeId } = req.params;
        const userId = req.user.id;
        
        // Vérifier que le troc existe et que l'utilisateur est l'expéditeur
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName address phone')
            .populate('toUser', 'firstName lastName address phone');
            
        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Troc non trouvé'
            });
        }
        
        // Vérifier que l'utilisateur est bien l'expéditeur
        if (trade.fromUser._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Seul l\'expéditeur peut générer le bordereau'
            });
        }
        
        // Vérifier le statut du troc
        if (trade.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                error: 'Le troc doit être accepté avant génération du bordereau'
            });
        }
        
        console.log(`📋 Troc ${tradeId}: ${trade.fromUser.firstName} → ${trade.toUser.firstName}`);
        
        // Utiliser le service point relais
        const pickupService = new PickupPointService();
        const result = await pickupService.createPickupDelivery(trade);
        
        if (result.success) {
            // Mettre à jour le troc avec les infos de livraison
            trade.delivery = {
                method: 'pickup_point',
                pickupPoint: result.deliveryData.pickupPoint,
                withdrawalCode: result.deliveryData.withdrawalCode,
                status: 'label_generated',
                createdAt: new Date()
            };
            trade.status = 'shipping_prepared';
            await trade.save();
            
            console.log('✅ Bordereau généré avec succès');
            
            return res.json({
                success: true,
                message: 'Bordereau de livraison généré avec succès',
                deliveryData: {
                    withdrawalCode: result.deliveryData.withdrawalCode,
                    pickupPoint: result.deliveryData.pickupPoint,
                    instructions: result.instructions
                },
                downloadUrl: `/api/trades/${tradeId}/download-pickup-label`
            });
        } else {
            console.error('❌ Erreur génération bordereau:', result.error);
            return res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('💥 Erreur API génération bordereau:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur'
        });
    }
});

// ==================== TÉLÉCHARGEMENT BORDEREAU ====================

/**
 * Télécharger le bordereau PDF
 * GET /api/trades/:tradeId/download-pickup-label
 */
router.get('/:tradeId/download-pickup-label', auth, async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.id;
        
        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ error: 'Troc non trouvé' });
        }
        
        // Vérifier que l'utilisateur peut télécharger le bordereau
        if (trade.fromUser.toString() !== userId && trade.toUser.toString() !== userId) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
        if (!trade.delivery || !trade.delivery.withdrawalCode) {
            return res.status(400).json({ error: 'Aucun bordereau généré pour ce troc' });
        }
        
        // Générer le PDF (simulation)
        const pdfContent = `
        BORDEREAU DE LIVRAISON CADOK
        ===========================
        
        Troc ID: ${tradeId}
        Code de retrait: ${trade.delivery.withdrawalCode}
        
        POINT RELAIS:
        ${trade.delivery.pickupPoint.name}
        ${trade.delivery.pickupPoint.address.street}
        ${trade.delivery.pickupPoint.address.zipCode} ${trade.delivery.pickupPoint.address.city}
        
        INSTRUCTIONS:
        1. Déposez le colis au point relais indiqué
        2. Le destinataire recevra une notification
        3. Code de retrait: ${trade.delivery.withdrawalCode}
        `;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="bordereau-cadok-${tradeId}.pdf"`);
        res.send(Buffer.from(pdfContent, 'utf-8'));
        
    } catch (error) {
        console.error('💥 Erreur téléchargement bordereau:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== CONFIRMATION EXPÉDITION ====================

/**
 * Confirmer l'expédition du colis
 * POST /api/trades/:tradeId/confirm-shipment
 */
router.post('/:tradeId/confirm-shipment', auth, async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.id;
        
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName')
            .populate('toUser', 'firstName lastName');
            
        if (!trade) {
            return res.status(404).json({ error: 'Troc non trouvé' });
        }
        
        if (trade.fromUser._id.toString() !== userId) {
            return res.status(403).json({ error: 'Seul l\'expéditeur peut confirmer l\'expédition' });
        }
        
        if (trade.status !== 'shipping_prepared') {
            return res.status(400).json({ error: 'Le bordereau doit être généré avant confirmation d\'expédition' });
        }
        
        // Mettre à jour le statut
        trade.status = 'shipped';
        trade.delivery.status = 'in_transit';
        trade.delivery.shippedAt = new Date();
        await trade.save();
        
        console.log(`📦 Expédition confirmée: ${trade.fromUser.firstName} → ${trade.toUser.firstName}`);
        
        // TODO: Envoyer notifications push
        // await NotificationService.sendShipmentConfirmation(trade);
        
        return res.json({
            success: true,
            message: 'Expédition confirmée avec succès',
            status: trade.status,
            estimatedDelivery: '2-3 jours ouvrés'
        });
        
    } catch (error) {
        console.error('💥 Erreur confirmation expédition:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== CONFIRMATION RÉCUPÉRATION ====================

/**
 * Confirmer la récupération du colis
 * POST /api/trades/:tradeId/confirm-pickup
 */
router.post('/:tradeId/confirm-pickup', auth, async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.id;
        const { rating, comment } = req.body;
        
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName')
            .populate('toUser', 'firstName lastName');
            
        if (!trade) {
            return res.status(404).json({ error: 'Troc non trouvé' });
        }
        
        if (trade.toUser._id.toString() !== userId) {
            return res.status(403).json({ error: 'Seul le destinataire peut confirmer la récupération' });
        }
        
        if (trade.status !== 'shipped' && trade.status !== 'arrived_at_pickup') {
            return res.status(400).json({ error: 'Le colis doit être expédié avant confirmation de récupération' });
        }
        
        // Mettre à jour le statut
        trade.status = 'completed';
        trade.delivery.status = 'delivered';
        trade.delivery.deliveredAt = new Date();
        
        // Ajouter l'évaluation
        trade.rating = {
            fromReceiver: {
                score: rating || 5,
                comment: comment || '',
                createdAt: new Date()
            }
        };
        
        await trade.save();
        
        console.log(`✅ Troc terminé: ${trade.fromUser.firstName} ↔ ${trade.toUser.firstName}`);
        
        // TODO: Mettre à jour les statistiques utilisateurs
        // await UserStatsService.updateTradeCompletion(trade);
        
        return res.json({
            success: true,
            message: 'Troc terminé avec succès !',
            status: trade.status,
            rating: trade.rating
        });
        
    } catch (error) {
        console.error('💥 Erreur confirmation récupération:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== RECHERCHE POINTS RELAIS ====================

/**
 * Rechercher des points relais près d'un code postal
 * GET /api/pickup-points/near/:zipCode
 */
router.get('/pickup-points/near/:zipCode', auth, async (req, res) => {
    try {
        const { zipCode } = req.params;
        const { limit = 5 } = req.query;
        
        console.log(`🔍 Recherche points relais près de ${zipCode}`);
        
        const pickupService = new PickupPointService();
        const nearbyPoints = pickupService.findNearbyPickupPoints(zipCode, parseInt(limit));
        
        return res.json({
            success: true,
            zipCode,
            points: nearbyPoints
        });
        
    } catch (error) {
        console.error('💥 Erreur recherche points relais:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== STATUS LIVRAISON ====================

/**
 * Obtenir le statut détaillé d'une livraison
 * GET /api/trades/:tradeId/delivery-status
 */
router.get('/:tradeId/delivery-status', auth, async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.id;
        
        const trade = await Trade.findById(tradeId)
            .populate('fromUser', 'firstName lastName')
            .populate('toUser', 'firstName lastName');
            
        if (!trade) {
            return res.status(404).json({ error: 'Troc non trouvé' });
        }
        
        // Vérifier que l'utilisateur est impliqué dans le troc
        if (trade.fromUser._id.toString() !== userId && trade.toUser._id.toString() !== userId) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        
        const isFromUser = trade.fromUser._id.toString() === userId;
        
        return res.json({
            success: true,
            tradeId,
            status: trade.status,
            userRole: isFromUser ? 'sender' : 'receiver',
            delivery: trade.delivery || null,
            timeline: generateDeliveryTimeline(trade),
            nextAction: getNextUserAction(trade, isFromUser)
        });
        
    } catch (error) {
        console.error('💥 Erreur statut livraison:', error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// ==================== FONCTIONS UTILITAIRES ====================

function generateDeliveryTimeline(trade) {
    const timeline = [];
    
    if (trade.createdAt) {
        timeline.push({
            step: 'trade_created',
            title: 'Troc créé',
            date: trade.createdAt,
            completed: true
        });
    }
    
    if (trade.status === 'accepted' || trade.status === 'shipping_prepared' || trade.status === 'shipped' || trade.status === 'completed') {
        timeline.push({
            step: 'trade_accepted',
            title: 'Troc accepté',
            date: trade.updatedAt,
            completed: true
        });
    }
    
    if (trade.delivery?.createdAt) {
        timeline.push({
            step: 'label_generated',
            title: 'Bordereau généré',
            date: trade.delivery.createdAt,
            completed: true
        });
    }
    
    if (trade.delivery?.shippedAt) {
        timeline.push({
            step: 'shipped',
            title: 'Colis expédié',
            date: trade.delivery.shippedAt,
            completed: true
        });
    }
    
    if (trade.delivery?.deliveredAt) {
        timeline.push({
            step: 'delivered',
            title: 'Colis récupéré',
            date: trade.delivery.deliveredAt,
            completed: true
        });
    }
    
    return timeline;
}

function getNextUserAction(trade, isFromUser) {
    if (isFromUser) {
        // Actions pour l'expéditeur
        switch (trade.status) {
            case 'accepted':
                return { action: 'generate_label', text: 'Générer le bordereau d\'envoi' };
            case 'shipping_prepared':
                return { action: 'confirm_shipment', text: 'Confirmer l\'expédition' };
            case 'shipped':
                return { action: 'wait', text: 'En attente de récupération par le destinataire' };
            case 'completed':
                return { action: 'completed', text: 'Troc terminé avec succès !' };
            default:
                return { action: 'wait', text: 'En attente' };
        }
    } else {
        // Actions pour le destinataire
        switch (trade.status) {
            case 'accepted':
            case 'shipping_prepared':
                return { action: 'wait', text: 'En attente d\'expédition' };
            case 'shipped':
                return { action: 'wait', text: 'Colis en transit, vous serez notifié à l\'arrivée' };
            case 'arrived_at_pickup':
                return { action: 'confirm_pickup', text: 'Récupérer le colis au point relais' };
            case 'completed':
                return { action: 'completed', text: 'Troc terminé avec succès !' };
            default:
                return { action: 'wait', text: 'En attente' };
        }
    }
}

module.exports = router;
