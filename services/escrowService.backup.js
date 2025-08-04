/**
 * Service de garantie pour trocs (sans argent échangé)
 * Système de caution symbolique pour éviter les arnaques dans les échanges
 */

const Trade = require('../models/Trade');
const Delivery = require('../models/Delivery');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class TradeGuaranteeService {
  constructor() {
    this.holdDuration = 14; // 14 jours de dépôt par défaut
    this.guaranteeAmount = 20; // 20€ de caution symbolique par défaut
  }

  /**
   * Créer une caution pour un troc (les 2 utilisateurs versent une petite caution)
   */
  async createTradeGuarantee(tradeId, userId, paymentMethodId, customAmount = null) {
  /**
   * Créer une caution pour un troc (les 2 utilisateurs versent une petite caution)
   */
  async createTradeGuarantee(tradeId, userId, paymentMethodId, customAmount = null) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Échange non trouvé');
      }

      const cautionAmount = customAmount || this.guaranteeAmount;

      // Créer un Payment Intent avec capture différée pour la caution
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(cautionAmount * 100), // En centimes
        currency: 'eur',
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        capture_method: 'manual', // ⚠️ CLEF: Capture différée
        metadata: {
          type: 'trade_guarantee',
          tradeId: tradeId.toString(),
          userId: userId.toString(),
          purpose: 'Caution de bonne foi pour troc'
        }
      });

      // Confirmer le paiement (autorise mais ne capture pas)
      const confirmedIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id
      );

      if (confirmedIntent.status === 'requires_capture') {
        // Déterminer si c'est l'utilisateur 1 ou 2
        const isFromUser = trade.fromUser.toString() === userId;
        const userType = isFromUser ? 'fromUser' : 'toUser';

        // Initialiser l'escrow si pas encore fait
        if (!trade.escrow) {
          trade.escrow = {
            status: 'partial',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.holdDuration * 24 * 60 * 60 * 1000),
            guarantees: {}
          };
        }

        // Stocker la caution de cet utilisateur
        trade.escrow.guarantees[userType] = {
          paymentIntentId: paymentIntent.id,
          amount: cautionAmount,
          status: 'held',
          createdAt: new Date()
        };

        // Vérifier si les deux utilisateurs ont versé leur caution
        const bothPaid = trade.escrow.guarantees.fromUser && trade.escrow.guarantees.toUser;
        if (bothPaid) {
          trade.escrow.status = 'both_secured';
          trade.status = 'secured'; // Nouvel état : sécurisé
        }

        await trade.save();

        return {
          success: true,
          guaranteeId: paymentIntent.id,
          status: trade.escrow.status,
          bothSecured: bothPaid,
          message: bothPaid 
            ? 'Troc entièrement sécurisé ! Les deux cautions sont versées'
            : 'Votre caution est versée. En attente de l\'autre utilisateur'
        };
      }

      throw new Error('Impossible d\'autoriser le paiement de caution');
    } catch (error) {
      console.error('Erreur création caution troc:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirmer l'expédition d'un objet
   */
  async confirmShipment(tradeId, userId, trackingNumber = null) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        throw new Error('Troc non sécurisé trouvé');
      }

      const isFromUser = trade.fromUser.toString() === userId;
      const userType = isFromUser ? 'fromUser' : 'toUser';

      // Vérifier que l'utilisateur a bien versé sa caution
      if (!trade.escrow.guarantees[userType]) {
        throw new Error('Aucune caution versée par cet utilisateur');
      }

      // Marquer l'expédition
      trade.escrow.guarantees[userType].shipped = {
        confirmedAt: new Date(),
        trackingNumber: trackingNumber
      };

      // Vérifier si les deux ont expédié
      const bothShipped = 
        trade.escrow.guarantees.fromUser?.shipped && 
        trade.escrow.guarantees.toUser?.shipped;

      if (bothShipped) {
        trade.status = 'both_shipped';
      }

      await trade.save();

      return {
        success: true,
        status: trade.status,
        bothShipped,
        message: bothShipped 
          ? 'Les deux objets sont expédiés ! Confirmez réception pour récupérer vos cautions'
          : 'Expédition confirmée. En attente de l\'autre utilisateur'
      };

    } catch (error) {
      console.error('Erreur confirmation expédition:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirmer la réception d'un objet
   */
  async confirmReception(tradeId, userId, satisfactionRating = null) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        throw new Error('Troc non sécurisé trouvé');
      }

      const isFromUser = trade.fromUser.toString() === userId;
      const userType = isFromUser ? 'fromUser' : 'toUser';

      // Marquer la réception
      trade.escrow.guarantees[userType].received = {
        confirmedAt: new Date(),
        satisfactionRating: satisfactionRating
      };

      // Vérifier si les deux ont reçu
      const bothReceived = 
        trade.escrow.guarantees.fromUser?.received && 
        trade.escrow.guarantees.toUser?.received;

      if (bothReceived) {
        // Libérer automatiquement les deux cautions
        const releaseResult = await this.releaseBothGuarantees(tradeId, 'successful_trade');
        
        trade.status = 'completed';
        await trade.save();

        return {
          success: true,
          status: 'completed',
          message: 'Troc terminé avec succès ! Vos cautions ont été remboursées',
          guaranteesReleased: releaseResult.success
        };
      }

      await trade.save();

      return {
        success: true,
        status: trade.status,
        message: 'Réception confirmée. En attente de confirmation de l\'autre utilisateur'
      };

    } catch (error) {
      console.error('Erreur confirmation réception:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Libérer les deux cautions après un troc réussi
   */
  async releaseBothGuarantees(tradeId, reason = 'successful_trade') {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        throw new Error('Dépôt de garantie non trouvé');
      }

      const { paymentIntentId } = trade.escrow;

      // Capturer le paiement (transfert vers le destinataire)
      const capture = await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: trade.escrow.amount * 100
      });

      if (capture.status === 'succeeded') {
        trade.escrow.status = 'released';
        trade.escrow.releasedAt = new Date();
        trade.escrow.releaseReason = reason;
        trade.status = 'completed';

        await trade.save();

        return {
          success: true,
          message: 'Dépôt libéré avec succès',
          amount: trade.escrow.amount
        };
      }

      throw new Error('Échec de la capture du paiement');
    } catch (error) {
      console.error('Erreur libération escrow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Annuler le dépôt de garantie en cas de problème
   */
  async cancelEscrow(tradeId, reason = 'trade_cancelled') {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        throw new Error('Dépôt de garantie non trouvé');
      }

      const { paymentIntentId } = trade.escrow;

      // Annuler l'autorisation (rembourse automatiquement)
      const cancelled = await stripe.paymentIntents.cancel(paymentIntentId);

      if (cancelled.status === 'canceled') {
        trade.escrow.status = 'cancelled';
        trade.escrow.cancelledAt = new Date();
        trade.escrow.cancelReason = reason;
        trade.status = 'cancelled';

        await trade.save();

        return {
          success: true,
          message: 'Dépôt annulé et remboursé',
          amount: trade.escrow.amount
        };
      }

      throw new Error('Échec de l\'annulation');
    } catch (error) {
      console.error('Erreur annulation escrow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gérer un litige sur l'escrow
   */
  async handleDispute(tradeId, disputeDetails) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        throw new Error('Dépôt de garantie non trouvé');
      }

      trade.escrow.dispute = {
        status: 'open',
        details: disputeDetails,
        createdAt: new Date(),
        resolution: null
      };

      // Prolonger la période de dépôt pendant le litige
      trade.escrow.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await trade.save();

      // Notifier l'équipe de modération
      await this.notifyModerationTeam(tradeId, disputeDetails);

      return {
        success: true,
        message: 'Litige ouvert, notre équipe va examiner le cas'
      };
    } catch (error) {
      console.error('Erreur gestion litige:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirmation automatique après délai sans litige
   */
  async autoReleaseExpiredEscrows() {
    try {
      const expiredEscrows = await Trade.find({
        'escrow.status': 'held',
        'escrow.expiresAt': { $lt: new Date() },
        'escrow.dispute.status': { $ne: 'open' }
      });

      const results = [];
      for (const trade of expiredEscrows) {
        const result = await this.releaseEscrow(trade._id, 'auto_release_expired');
        results.push({
          tradeId: trade._id,
          result
        });
      }

      return {
        success: true,
        processedCount: results.length,
        results
      };
    } catch (error) {
      console.error('Erreur libération automatique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Notifier l'équipe de modération
   */
  async notifyModerationTeam(tradeId, disputeDetails) {
    // Ici vous pouvez intégrer avec votre système de notifications
    // (email, Slack, système de tickets, etc.)
    console.log(`🚨 LITIGE ESCROW - Trade ${tradeId}:`, disputeDetails);
    
    // Exemple d'envoi d'email à l'équipe
    // await emailService.sendModerationAlert({
    //   subject: `Litige Escrow - Trade ${tradeId}`,
    //   details: disputeDetails
    // });
  }

  /**
   * Vérifier le statut d'un escrow
   */
  async getEscrowStatus(tradeId) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        return {
          success: false,
          error: 'Aucun dépôt de garantie trouvé'
        };
      }

      return {
        success: true,
        escrow: {
          status: trade.escrow.status,
          amount: trade.escrow.amount,
          createdAt: trade.escrow.createdAt,
          expiresAt: trade.escrow.expiresAt,
          dispute: trade.escrow.dispute || null
        }
      };
    } catch (error) {
      console.error('Erreur statut escrow:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = EscrowService;
