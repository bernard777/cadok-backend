/**
 * Routes API pour la sécurisation des trocs purs (sans prix)
 * Basé sur la réputation, preuves photo et validation par étapes
 */

const express = require('express');
const router = express.Router();
const PureTradeSecurityService = require('../services/pureTradeSecurityService');
const auth = require('../middlewares/auth');

const securityService = new PureTradeSecurityService();

// ============================================================================
// ANALYSE ET CRÉATION DE TROCS SÉCURISÉS
// ============================================================================

/**
 * @route POST /api/trade-security/analyze
 * @desc Analyser la faisabilité et les risques d'un troc proposé
 * @access Private
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const { toUserId, fromObjectIds, toObjectIds } = req.body;
    const fromUserId = req.user.id;

    if (!toUserId || !fromObjectIds || !toObjectIds) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes: toUserId, fromObjectIds, toObjectIds requis'
      });
    }

    const analysis = await securityService.analyzeTradeProposal(
      fromUserId,
      toUserId,
      fromObjectIds,
      toObjectIds
    );

    if (analysis.success) {
      res.json({
        success: true,
        data: analysis.analysis,
        message: analysis.analysis.allowed 
          ? 'Troc autorisé avec mesures de sécurité'
          : 'Troc non autorisé - risque trop élevé'
      });
    } else {
      res.status(400).json({
        success: false,
        message: analysis.error
      });
    }

  } catch (error) {
    console.error('Erreur analyse troc:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'analyse'
    });
  }
});

/**
 * @route POST /api/trade-security/create-secured
 * @desc Créer un troc avec toutes les mesures de sécurité nécessaires
 * @access Private
 */
router.post('/create-secured', auth, async (req, res) => {
  try {
    const { toUserId, fromObjectIds, toObjectIds } = req.body;
    const fromUserId = req.user.id;

    if (!toUserId || !fromObjectIds || !toObjectIds) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes pour créer le troc sécurisé'
      });
    }

    const result = await securityService.createSecuredTrade({
      fromUserId,
      toUserId,
      fromObjectIds,
      toObjectIds
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          trade: result.trade,
          securityInfo: result.securityInfo,
          nextSteps: result.nextSteps
        },
        message: 'Troc sécurisé créé avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur création troc sécurisé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
});

// ============================================================================
// SOUMISSION DE PREUVES ET VALIDATION PAR ÉTAPES
// ============================================================================

/**
 * @route POST /api/trade-security/:tradeId/proof
 * @desc Soumettre une preuve (photo d'objet, emballage, etc.)
 * @access Private
 */
router.post('/:tradeId/proof', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { proofType, photoUrl, description } = req.body;
    const userId = req.user.id;

    if (!proofType || !photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Type de preuve et photo requis'
      });
    }

    const validProofTypes = ['objectPhotos', 'packagingProof', 'shippingProof'];
    if (!validProofTypes.includes(proofType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de preuve non valide'
      });
    }

    const result = await securityService.submitProof(tradeId, userId, proofType, {
      photoUrl,
      description
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          tradeStatus: result.tradeStatus,
          nextSteps: result.nextSteps,
          allProofsReady: result.allProofsReady
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur soumission preuve:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/trade-security/:tradeId/confirm-shipment
 * @desc Confirmer l'expédition d'un objet
 * @access Private
 */
router.post('/:tradeId/confirm-shipment', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { trackingNumber, carrier, receiptPhotoUrl } = req.body;
    const userId = req.user.id;

    const result = await securityService.confirmShipment(tradeId, userId, {
      trackingNumber,
      carrier,
      receiptPhotoUrl
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          status: result.status,
          bothShipped: result.bothShipped
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur confirmation expédition:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/trade-security/:tradeId/confirm-delivery
 * @desc Confirmer la réception et noter l'échange
 * @access Private
 */
router.post('/:tradeId/confirm-delivery', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { satisfaction, comment, objectAsExpected } = req.body;
    const userId = req.user.id;

    if (satisfaction === undefined || objectAsExpected === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Note de satisfaction et confirmation de conformité requises'
      });
    }

    const result = await securityService.confirmDelivery(tradeId, userId, {
      satisfaction: parseInt(satisfaction),
      comment,
      objectAsExpected: Boolean(objectAsExpected)
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          status: result.status,
          bothReceived: result.bothReceived
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
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

// ============================================================================
// GESTION DES SIGNALEMENTS ET LITIGES
// ============================================================================

/**
 * @route POST /api/trade-security/:tradeId/report
 * @desc Signaler un problème sur un troc
 * @access Private
 */
router.post('/:tradeId/report', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { type, description, evidenceUrls } = req.body;
    const reporterId = req.user.id;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type de problème et description requis'
      });
    }

    const validTypes = ['not_shipped', 'wrong_object', 'damaged', 'no_communication', 'late_shipping'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de problème non valide'
      });
    }

    const result = await securityService.reportTradeIssue(tradeId, reporterId, {
      type,
      description,
      evidenceUrls: evidenceUrls || []
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          reportId: result.reportId,
          immediateActions: result.immediateActions
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur signalement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// CONSULTATION DES SCORES ET STATUTS
// ============================================================================

/**
 * @route GET /api/trade-security/trust-score/:userId
 * @desc Obtenir le score de confiance d'un utilisateur
 * @access Private
 */
router.get('/trust-score/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const trustScore = await securityService.calculateTrustScore(user);

    res.json({
      success: true,
      data: {
        userId,
        trustScore,
        level: this.getTrustLevel(trustScore),
        stats: user.stats || { completedTrades: 0, averageRating: 0 }
      }
    });

  } catch (error) {
    console.error('Erreur score confiance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route GET /api/trade-security/:tradeId/status
 * @desc Obtenir le statut de sécurité d'un troc
 * @access Private
 */
router.get('/:tradeId/status', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    
    const Trade = require('../models/Trade');
    const trade = await Trade.findById(tradeId)
      .populate('fromUser', 'pseudo')
      .populate('toUser', 'pseudo');
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        message: 'Troc non trouvé'
      });
    }

    // Vérifier que l'utilisateur fait partie du troc
    if (trade.fromUser._id.toString() !== req.user.id && 
        trade.toUser._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const nextSteps = securityService.getNextSecuritySteps(trade);

    res.json({
      success: true,
      data: {
        tradeId,
        status: trade.status,
        security: trade.security,
        nextSteps,
        reports: trade.reports || []
      }
    });

  } catch (error) {
    console.error('Erreur statut troc:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Fonction utilitaire pour le niveau de confiance
function getTrustLevel(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'AVERAGE';
  if (score >= 20) return 'LOW';
  return 'VERY_LOW';
}

module.exports = router;
