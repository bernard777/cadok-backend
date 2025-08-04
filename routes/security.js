/**
 * Routes API pour la sécurisation des échanges
 * Escrow, vérification, points relais sécurisés
 */

const express = require('express');
const router = express.Router();
const EscrowService = require('../services/escrowService');
const VerificationService = require('../services/verificationService');
const SecureRelayService = require('../services/secureRelayService');
const auth = require('../middlewares/auth');

const escrowService = new EscrowService();
const verificationService = new VerificationService();
const secureRelayService = new SecureRelayService();

// ============================================================================
// ESCROW (DÉPÔT DE GARANTIE) ROUTES
// ============================================================================

/**
 * @route POST /api/security/escrow/create
 * @desc Créer un dépôt de garantie pour un échange
 * @access Private
 */
router.post('/escrow/create', auth, async (req, res) => {
  try {
    const { tradeId, amount, paymentMethodId } = req.body;

    if (!tradeId || !amount || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes: tradeId, amount, paymentMethodId requis'
      });
    }

    const result = await escrowService.createEscrow(
      tradeId,
      amount,
      paymentMethodId,
      req.user.id
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result,
        message: 'Dépôt de garantie créé avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur création escrow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du dépôt'
    });
  }
});

/**
 * @route POST /api/security/escrow/:tradeId/release
 * @desc Libérer le dépôt de garantie
 * @access Private
 */
router.post('/escrow/:tradeId/release', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { reason = 'delivery_confirmed' } = req.body;

    const result = await escrowService.releaseEscrow(tradeId, reason);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Dépôt de garantie libéré avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur libération escrow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la libération'
    });
  }
});

/**
 * @route POST /api/security/escrow/:tradeId/cancel
 * @desc Annuler le dépôt de garantie
 * @access Private
 */
router.post('/escrow/:tradeId/cancel', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { reason = 'trade_cancelled' } = req.body;

    const result = await escrowService.cancelEscrow(tradeId, reason);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Dépôt de garantie annulé et remboursé'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur annulation escrow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation'
    });
  }
});

/**
 * @route POST /api/security/escrow/:tradeId/dispute
 * @desc Ouvrir un litige sur l'escrow
 * @access Private
 */
router.post('/escrow/:tradeId/dispute', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { details, evidence } = req.body;

    if (!details) {
      return res.status(400).json({
        success: false,
        message: 'Détails du litige requis'
      });
    }

    const disputeDetails = {
      reason: details,
      evidence: evidence || null,
      reportedBy: req.user.id,
      submittedAt: new Date()
    };

    const result = await escrowService.handleDispute(tradeId, disputeDetails);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Litige ouvert avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur ouverture litige:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ouverture du litige'
    });
  }
});

/**
 * @route GET /api/security/escrow/:tradeId/status
 * @desc Obtenir le statut d'un escrow
 * @access Private
 */
router.get('/escrow/:tradeId/status', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;

    const result = await escrowService.getEscrowStatus(tradeId);

    if (result.success) {
      res.json({
        success: true,
        data: result.escrow
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur statut escrow:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// VÉRIFICATION ET CONFIANCE ROUTES
// ============================================================================

/**
 * @route GET /api/security/trust/:userId
 * @desc Obtenir le score de confiance d'un utilisateur
 * @access Private
 */
router.get('/trust/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const trustScore = await verificationService.calculateTrustScore(userId);

    res.json({
      success: true,
      data: trustScore
    });

  } catch (error) {
    console.error('Erreur calcul score confiance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/security/trade/verify
 * @desc Vérifier l'éligibilité d'un échange
 * @access Private
 */
router.post('/trade/verify', auth, async (req, res) => {
  try {
    const { recipientId, tradeValue } = req.body;
    const senderId = req.user.id;

    if (!recipientId || tradeValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'recipientId et tradeValue requis'
      });
    }

    const verification = await verificationService.verifyTradeEligibility(
      senderId,
      recipientId,
      tradeValue
    );

    res.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Erreur vérification échange:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/security/verification/identity
 * @desc Démarrer la vérification d'identité
 * @access Private
 */
router.post('/verification/identity', auth, async (req, res) => {
  try {
    const { documentType, documentNumber } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Type de document requis'
      });
    }

    const document = {
      type: documentType,
      number: documentNumber || null
    };

    const result = await verificationService.startIdentityVerification(
      req.user.id,
      document
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result,
        message: 'Vérification d\'identité démarrée'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur vérification identité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/security/report
 * @desc Signaler un utilisateur
 * @access Private
 */
router.post('/report', auth, async (req, res) => {
  try {
    const { reportedUserId, reason, evidence } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur signalé et raison requis'
      });
    }

    const result = await verificationService.reportUser(
      req.user.id,
      reportedUserId,
      reason,
      evidence
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result,
        message: 'Signalement enregistré'
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
// POINTS RELAIS SÉCURISÉS ROUTES
// ============================================================================

/**
 * @route GET /api/security/relay-points
 * @desc Trouver des points relais sécurisés
 * @access Private
 */
router.get('/relay-points', auth, async (req, res) => {
  try {
    const { 
      address, 
      maxDistance = 10, 
      anonymizationRequired = true,
      minSecurityLevel = 'standard'
    } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Adresse requise pour la recherche'
      });
    }

    const result = await secureRelayService.findSecureRelayPoints(address, {
      maxDistance: parseInt(maxDistance),
      anonymizationRequired: anonymizationRequired === 'true',
      minSecurityLevel
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          points: result.points,
          totalFound: result.totalFound
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur recherche points relais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * @route POST /api/security/relay-delivery
 * @desc Créer une livraison avec point relais sécurisé
 * @access Private
 */
router.post('/relay-delivery', auth, async (req, res) => {
  try {
    const { tradeId, selectedRelayPoint, senderAddress, recipientAddress } = req.body;

    if (!tradeId || !selectedRelayPoint || !senderAddress || !recipientAddress) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes pour créer la livraison relais'
      });
    }

    const result = await secureRelayService.createSecureRelayDelivery({
      tradeId,
      selectedRelayPoint,
      senderAddress,
      recipientAddress
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result,
        message: 'Livraison relais sécurisée créée'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Erreur création livraison relais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ============================================================================
// ADMIN ROUTES (pour la gestion des escrows expirés)
// ============================================================================

/**
 * @route POST /api/security/admin/auto-release
 * @desc Libérer automatiquement les escrows expirés
 * @access Private (Admin)
 */
router.post('/admin/auto-release', auth, async (req, res) => {
  try {
    // Vérifier les droits admin (à adapter selon votre système)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    // }

    const result = await escrowService.autoReleaseExpiredEscrows();

    res.json({
      success: true,
      data: result,
      message: `${result.processedCount} escrows traités`
    });

  } catch (error) {
    console.error('Erreur libération automatique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
