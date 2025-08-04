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
  async createTradeGuarantee(tradeId, userId, paymentMethodId, customAmount) {
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
  async confirmShipment(tradeId, userId, trackingNumber) {
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
  async confirmReception(tradeId, userId, satisfactionRating) {
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
  async releaseBothGuarantees(tradeId, reason) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade || !trade.escrow) {
        throw new Error('Cautions non trouvées');
      }

      const results = [];

      // Libérer la caution de l'utilisateur 1
      if (trade.escrow.guarantees.fromUser) {
        const fromUserRelease = await this.releaseGuarantee(
          trade.escrow.guarantees.fromUser.paymentIntentId,
          reason
        );
        results.push({ user: 'fromUser', result: fromUserRelease });
      }

      // Libérer la caution de l'utilisateur 2
      if (trade.escrow.guarantees.toUser) {
        const toUserRelease = await this.releaseGuarantee(
          trade.escrow.guarantees.toUser.paymentIntentId,
          reason
        );
        results.push({ user: 'toUser', result: toUserRelease });
      }

      // Marquer comme libéré
      trade.escrow.status = 'released';
      trade.escrow.releasedAt = new Date();
      trade.escrow.releaseReason = reason;

      await trade.save();

      return {
        success: true,
        results,
        message: 'Toutes les cautions ont été remboursées'
      };

    } catch (error) {
      console.error('Erreur libération cautions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Libérer une caution individuelle
   */
  async releaseGuarantee(paymentIntentId, reason) {
    try {
      // Annuler l'autorisation (rembourse automatiquement)
      const cancelled = await stripe.paymentIntents.cancel(paymentIntentId);

      if (cancelled.status === 'canceled') {
        return {
          success: true,
          message: 'Caution remboursée avec succès'
        };
      }

      throw new Error('Échec du remboursement');
    } catch (error) {
      console.error('Erreur remboursement caution:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Annuler un troc et rembourser les cautions
   */
  async cancelTrade(tradeId, reason) {
    try {
      const releaseResult = await this.releaseBothGuarantees(tradeId, reason);
      
      const trade = await Trade.findById(tradeId);
      trade.status = 'cancelled';
      await trade.save();

      return {
        success: true,
        message: 'Troc annulé et cautions remboursées',
        releaseResult
      };

    } catch (error) {
      console.error('Erreur annulation troc:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Signaler un problème sur un troc
   */
  async reportTradeIssue(tradeId, reporterId, issueType, details) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      // Créer le signalement
      const report = {
        id: `RPT_${Date.now()}`,
        reporterId,
        issueType, // 'not_shipped', 'wrong_item', 'damaged', 'fake'
        details,
        createdAt: new Date(),
        status: 'pending'
      };

      // Ajouter au trade
      if (!trade.reports) {
        trade.reports = [];
      }
      trade.reports.push(report);

      // Marquer le troc comme en litige
      if (trade.escrow) {
        trade.escrow.dispute = {
          status: 'open',
          reportId: report.id,
          createdAt: new Date()
        };
      }

      await trade.save();

      // Notifier l'équipe
      await this.notifyModerationTeam(tradeId, report);

      return {
        success: true,
        reportId: report.id,
        message: 'Signalement enregistré. Notre équipe va examiner le cas'
      };

    } catch (error) {
      console.error('Erreur signalement troc:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Libération automatique des cautions expirées
   */
  async autoReleaseExpiredGuarantees() {
    try {
      const expiredTrades = await Trade.find({
        'escrow.status': { $in: ['partial', 'both_secured'] },
        'escrow.expiresAt': { $lt: new Date() },
        'escrow.dispute.status': { $ne: 'open' }
      });

      const results = [];
      for (const trade of expiredTrades) {
        const result = await this.releaseBothGuarantees(trade._id, 'auto_release_expired');
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
  async notifyModerationTeam(tradeId, report) {
    console.log(`🚨 SIGNALEMENT TROC - Trade ${tradeId}:`, report);
    
    // Ici vous pouvez intégrer avec votre système de notifications
    // (email, Slack, système de tickets, etc.)
  }

  /**
   * Obtenir le statut des cautions d'un troc
   */
  async getGuaranteeStatus(tradeId) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        return {
          success: false,
          error: 'Troc non trouvé'
        };
      }

      if (!trade.escrow) {
        return {
          success: true,
          status: 'no_guarantees',
          message: 'Aucune caution versée pour ce troc'
        };
      }

      return {
        success: true,
        guarantees: {
          status: trade.escrow.status,
          fromUser: trade.escrow.guarantees?.fromUser || null,
          toUser: trade.escrow.guarantees?.toUser || null,
          expiresAt: trade.escrow.expiresAt,
          dispute: trade.escrow.dispute || null
        }
      };

    } catch (error) {
      console.error('Erreur statut cautions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TradeGuaranteeService;
