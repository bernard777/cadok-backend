const express = require('express');
const router = express.Router();
const deliveryService = require('../services/deliveryService');
const Delivery = require('../models/Delivery');
const Trade = require('../models/Trade');
const auth = require('../middlewares/auth');

/**
 * @route GET /api/delivery/methods
 * @desc Obtenir toutes les méthodes de livraison disponibles
 * @access Public
 */
router.get('/methods', async (req, res) => {
  try {
    const methods = deliveryService.getDeliveryMethods();
    
    res.json({
      success: true,
      methods
    });
  } catch (error) {
    console.error('Erreur récupération méthodes livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/delivery/calculate-cost
 * @desc Calculer le coût de livraison
 * @access Private
 */
router.post('/calculate-cost', auth, async (req, res) => {
  try {
    const { method, fromCity, toCity, weight = 1 } = req.body;
    
    if (!method || !fromCity || !toCity) {
      return res.status(400).json({
        success: false,
        message: 'Méthode, ville de départ et ville d\'arrivée requis'
      });
    }

    // Calculer la distance
    const distance = deliveryService.calculateDistance(fromCity, toCity);
    
    // Calculer le coût
    const result = await deliveryService.calculateShippingCost({
      method,
      fromCity,
      toCity,
      weight,
      distance
    });

    res.json({
      success: true,
      cost: result.cost,
      method: result.method,
      breakdown: result.breakdown,
      distance,
      estimatedDays: result.method.estimatedDays
    });
  } catch (error) {
    console.error('Erreur calcul coût livraison:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/delivery/create
 * @desc Créer une livraison pour un échange
 * @access Private
 */
router.post('/create', auth, async (req, res) => {
  try {
    const { 
      tradeId, 
      method, 
      senderAddress, 
      recipientAddress,
      packageInfo,
      instructions 
    } = req.body;
    
    if (!tradeId || !method) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'échange et méthode de livraison requis'
      });
    }

    // Vérifier que l'échange existe et appartient à l'utilisateur
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({
        success: false,
        message: 'Échange non trouvé'
      });
    }

    if (trade.sender.toString() !== req.user.id && trade.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé pour cet échange'
      });
    }

    // Valider les adresses pour les livraisons non-pickup
    if (method !== 'pickup') {
      const senderValidation = deliveryService.validateAddress(senderAddress);
      const recipientValidation = deliveryService.validateAddress(recipientAddress);
      
      if (!senderValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Adresse expéditeur invalide',
          errors: senderValidation.errors
        });
      }
      
      if (!recipientValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Adresse destinataire invalide',
          errors: recipientValidation.errors
        });
      }
    }

    // Calculer le coût de livraison
    const distance = deliveryService.calculateDistance(
      senderAddress?.city || trade.senderCity,
      recipientAddress?.city || trade.recipientCity
    );
    
    const costResult = await deliveryService.calculateShippingCost({
      method,
      fromCity: senderAddress?.city || trade.senderCity,
      toCity: recipientAddress?.city || trade.recipientCity,
      weight: packageInfo?.weight || 1,
      distance
    });

    // Créer la livraison
    const delivery = new Delivery({
      tradeId,
      method,
      cost: costResult.cost,
      costBreakdown: costResult.breakdown,
      status: 'pending',
      addresses: method !== 'pickup' ? {
        sender: senderAddress,
        recipient: recipientAddress
      } : undefined,
      package: packageInfo,
      instructions,
      metadata: {
        createdBy: req.user.id,
        distance,
        estimatedDays: parseInt(costResult.method.estimatedDays)
      }
    });

    // Ajouter l'événement initial
    delivery.addTrackingEvent({
      status: 'created',
      description: 'Livraison créée',
      location: senderAddress?.city || trade.senderCity
    });

    await delivery.save();

    res.status(201).json({
      success: true,
      delivery: delivery.toJSON(),
      message: 'Livraison créée avec succès'
    });
  } catch (error) {
    console.error('Erreur création livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
});

/**
 * @route POST /api/delivery/:id/confirm
 * @desc Confirmer une livraison et créer l'étiquette
 * @access Private
 */
router.post('/:id/confirm', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée'
      });
    }

    // Vérifier les autorisations
    if (delivery.metadata.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette livraison ne peut plus être confirmée'
      });
    }

    // Créer l'étiquette de livraison
    const labelResult = await deliveryService.createShippingLabel({
      tradeId: delivery.tradeId,
      method: delivery.method,
      addresses: delivery.addresses,
      weight: delivery.package?.weight || 1
    });

    if (labelResult.success) {
      // Mettre à jour la livraison
      delivery.status = 'confirmed';
      delivery.trackingNumber = labelResult.trackingNumber;
      delivery.labelUrl = labelResult.labelUrl;
      delivery.carrier = labelResult.carrier;
      delivery.estimatedDelivery = labelResult.estimatedDelivery;
      
      if (labelResult.pickupPoint) {
        delivery.pickupPoint = labelResult.pickupPoint;
      }

      // Ajouter l'événement
      await delivery.addTrackingEvent({
        status: 'label_created',
        description: 'Étiquette de livraison créée',
        details: {
          trackingNumber: labelResult.trackingNumber,
          carrier: labelResult.carrier
        }
      });

      res.json({
        success: true,
        delivery: delivery.toJSON(),
        trackingNumber: labelResult.trackingNumber,
        labelUrl: labelResult.labelUrl,
        message: 'Livraison confirmée avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Erreur création étiquette: ${labelResult.error}`
      });
    }
  } catch (error) {
    console.error('Erreur confirmation livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route GET /api/delivery/:id/track
 * @desc Suivre une livraison
 * @access Private
 */
router.get('/:id/track', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('tradeId');
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée'
      });
    }

    // Vérifier les autorisations (expéditeur ou destinataire de l'échange)
    const trade = delivery.tradeId;
    if (trade.sender.toString() !== req.user.id && trade.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    let trackingInfo = null;
    
    // Obtenir les informations de suivi si disponibles
    if (delivery.trackingNumber && delivery.carrier) {
      trackingInfo = await deliveryService.trackPackage(
        delivery.trackingNumber,
        delivery.carrier
      );
    }

    res.json({
      success: true,
      delivery: {
        id: delivery._id,
        status: delivery.status,
        method: delivery.method,
        trackingNumber: delivery.trackingNumber,
        estimatedDelivery: delivery.estimatedDelivery,
        actualDelivery: delivery.actualDelivery,
        events: delivery.events,
        pickupPoint: delivery.pickupPoint
      },
      tracking: trackingInfo
    });
  } catch (error) {
    console.error('Erreur suivi livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route GET /api/delivery/user/:userId
 * @desc Obtenir toutes les livraisons d'un utilisateur
 * @access Private
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Récupérer les échanges de l'utilisateur
    const trades = await Trade.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    });

    const tradeIds = trades.map(trade => trade._id);

    // Récupérer les livraisons pour ces échanges
    const deliveries = await Delivery.find({
      tradeId: { $in: tradeIds }
    })
    .populate('tradeId', 'objectOffered objectRequested sender recipient')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      deliveries
    });
  } catch (error) {
    console.error('Erreur récupération livraisons utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/delivery/:id/mark-delivered
 * @desc Marquer une livraison comme livrée
 * @access Private
 */
router.post('/:id/mark-delivered', auth, async (req, res) => {
  try {
    const { deliveryDate, proofUrl } = req.body;
    
    const delivery = await Delivery.findById(req.params.id).populate('tradeId');
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Livraison non trouvée'
      });
    }

    // Seul le destinataire peut confirmer la livraison
    const trade = delivery.tradeId;
    if (trade.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seul le destinataire peut confirmer la livraison'
      });
    }

    // Marquer comme livré
    await delivery.markAsDelivered(deliveryDate ? new Date(deliveryDate) : new Date());
    
    // Ajouter une photo de preuve si fournie
    if (proofUrl) {
      delivery.documents.push({
        type: 'proof_of_delivery',
        url: proofUrl,
        description: 'Preuve de livraison fournie par le destinataire'
      });
      await delivery.save();
    }

    res.json({
      success: true,
      message: 'Livraison marquée comme livrée',
      delivery: delivery.toJSON()
    });
  } catch (error) {
    console.error('Erreur marquage livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route GET /api/delivery/stats
 * @desc Obtenir les statistiques de livraison (admin)
 * @access Private (Admin)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    // Vérifier les droits admin (à adapter selon votre système)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    // }

    const stats = await Delivery.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageCost: { $avg: '$cost' }
        }
      }
    ]);

    const methodStats = await Delivery.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$cost' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byMethod: methodStats
      }
    });
  } catch (error) {
    console.error('Erreur statistiques livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
