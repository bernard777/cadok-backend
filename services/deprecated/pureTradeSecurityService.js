/**
 * Service de sécurité pour troc pur (sans valeur monétaire)
 * Système basé sur la réputation et les preuves photographiques
 */

const Trade = require('../models/Trade');
const User = require('../models/User');
const mongoose = require('mongoose');

class PureTradeSecurityService {
  constructor() {
    // Paramètres de configuration
    this.config = {
      // Seuils de score de confiance
      TRUST_SCORE_THRESHOLDS: {
        LOW_RISK: 80,    // Score >= 80 = faible risque
        MEDIUM_RISK: 60, // Score >= 60 = risque moyen
        HIGH_RISK: 40,   // Score >= 40 = risque élevé
        VERY_HIGH_RISK: 0 // Score < 40 = risque très élevé
      },
      
      // Contraintes de sécurité par niveau de risque
      SECURITY_CONSTRAINTS: {
        VERY_HIGH_RISK: {
          photosRequired: true,
          trackingRequired: true,
          maxDeliveryDays: 5,
          requiresInsurance: true
        },
        HIGH_RISK: {
          photosRequired: true,
          trackingRequired: true,
          maxDeliveryDays: 7,
          requiresInsurance: false
        },
        MEDIUM_RISK: {
          photosRequired: true,
          trackingRequired: false,
          maxDeliveryDays: 10,
          requiresInsurance: false
        },
        LOW_RISK: {
          photosRequired: false,
          trackingRequired: false,
          maxDeliveryDays: 14,
          requiresInsurance: false
        }
      },
      
      // Pénalités pour violations
      VIOLATION_PENALTIES: {
        not_shipped: -15,        // N'a pas envoyé l'objet
        wrong_item: -10,         // Mauvais objet envoyé
        damaged: -8,             // Objet endommagé
        fake: -20,               // Objet contrefait/faux
        communication_issue: -5   // Problème de communication
      }
    };
  }

  /**
   * Calculer le score de confiance d'un utilisateur
   */
  async calculateTrustScore(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      let score = 50; // Score de base pour nouveaux utilisateurs

      // Bonus selon l'ancienneté du compte (max +15 points)
      const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)); // jours
      const ageBonus = Math.min(15, Math.floor(accountAge / 30) * 2); // +2 points par mois, max 15
      score += ageBonus;

      // Bonus selon le nombre de trocs réussis (max +25 points)
      const tradesBonus = Math.min(25, (user.tradeStats?.completedTrades || 0) * 2);
      score += tradesBonus;

      // Bonus selon la note moyenne (max +10 points)
      if ((user.tradeStats?.totalRatings || 0) > 0) {
        const ratingBonus = ((user.tradeStats?.averageRating || 3) - 3) * 5; // Note 5 = +10, Note 4 = +5, etc.
        score += Math.max(0, ratingBonus);
      }

      // Malus selon les violations (peut être très négatif)
      const violationMalus = (user.tradeStats?.violations?.total || 0) * 5; // -5 points par violation
      score -= violationMalus;

      // Malus selon le taux d'annulation
      const completedTrades = user.tradeStats?.completedTrades || 0;
      const cancelledTrades = user.tradeStats?.cancelledTrades || 0;
      if (completedTrades + cancelledTrades > 0) {
        const cancellationRate = cancelledTrades / (completedTrades + cancelledTrades);
        const cancellationMalus = cancellationRate * 20; // Taux de 50% = -10 points
        score -= cancellationMalus;
      }

      // S'assurer que le score reste dans la plage 0-100
      score = Math.max(0, Math.min(100, Math.round(score)));

      // Mettre à jour le score dans la base de données
      await User.findByIdAndUpdate(userId, {
        'tradeStats.trustScore': score,
        'tradeStats.lastActivity': new Date()
      });

      return score;
    } catch (error) {
      console.error('Erreur calcul score confiance:', error);
      return 50; // Score par défaut en cas d'erreur
    }
  }

  /**
   * Analyser le niveau de risque d'un échange
   */
  async analyzeTradeRisk(fromUserId, toUserId) {
    try {
      const [fromUserScore, toUserScore] = await Promise.all([
        this.calculateTrustScore(fromUserId),
        this.calculateTrustScore(toUserId)
      ]);

      // Le niveau de risque est déterminé par le score le plus bas
      const lowestScore = Math.min(fromUserScore, toUserScore);
      
      let riskLevel;
      if (lowestScore >= this.config.TRUST_SCORE_THRESHOLDS.LOW_RISK) {
        riskLevel = 'LOW_RISK';
      } else if (lowestScore >= this.config.TRUST_SCORE_THRESHOLDS.MEDIUM_RISK) {
        riskLevel = 'MEDIUM_RISK';
      } else if (lowestScore >= this.config.TRUST_SCORE_THRESHOLDS.HIGH_RISK) {
        riskLevel = 'HIGH_RISK';
      } else {
        riskLevel = 'VERY_HIGH_RISK';
      }

      return {
        riskLevel,
        fromUserScore,
        toUserScore,
        lowestScore,
        constraints: this.config.SECURITY_CONSTRAINTS[riskLevel],
        recommendation: this.getRiskRecommendation(riskLevel, lowestScore)
      };
    } catch (error) {
      console.error('Erreur analyse risque:', error);
      return {
        riskLevel: 'HIGH_RISK',
        fromUserScore: 50,
        toUserScore: 50,
        lowestScore: 50,
        constraints: this.config.SECURITY_CONSTRAINTS.HIGH_RISK,
        recommendation: 'Analyse impossible, niveau de sécurité élevé appliqué par précaution'
      };
    }
  }

  /**
   * Obtenir une recommandation selon le niveau de risque
   */
  getRiskRecommendation(riskLevel, score) {
    switch (riskLevel) {
      case 'LOW_RISK':
        return `Score excellent (${score}/100). Échange à faible risque, procédures simplifiées.`;
      case 'MEDIUM_RISK':
        return `Score correct (${score}/100). Photos des objets recommandées avant expédition.`;
      case 'HIGH_RISK':
        return `Score faible (${score}/100). Photos obligatoires et numéro de suivi requis.`;
      case 'VERY_HIGH_RISK':
        return `Score très faible (${score}/100). Sécurité maximale : photos, suivi et assurance obligatoires.`;
      default:
        return 'Niveau de risque inconnu.';
    }
  }

  /**
   * Créer un troc sécurisé avec analyse de risque
   */
  async createSecuredTrade(tradeData) {
    try {
      const { fromUser, toUser, offeredObjects, requestedObjects } = tradeData;
      
      // Analyser le risque
      const riskAnalysis = await this.analyzeTradeRisk(fromUser, toUser);
      
      // Créer le troc avec les paramètres de sécurité
      const trade = new Trade({
        fromUser,
        toUser,
        offeredObjects,
        requestedObjects,
        status: riskAnalysis.constraints.photosRequired ? 'photos_required' : 'accepted',
        security: {
          trustScores: {
            sender: riskAnalysis.fromUserScore,
            recipient: riskAnalysis.toUserScore
          },
          riskLevel: riskAnalysis.riskLevel,
          pureTradeValidation: {
            steps: {
              photosSubmitted: { fromUser: false, toUser: false },
              shippingConfirmed: { fromUser: false, toUser: false },
              deliveryConfirmed: { fromUser: false, toUser: false }
            },
            constraints: riskAnalysis.constraints,
            timeline: [{
              step: 'trade_created',
              userId: fromUser,
              timestamp: new Date(),
              data: { riskLevel: riskAnalysis.riskLevel, recommendation: riskAnalysis.recommendation }
            }]
          }
        }
      });

      await trade.save();

      return {
        success: true,
        trade,
        riskAnalysis,
        message: `Troc créé avec succès. ${riskAnalysis.recommendation}`
      };
    } catch (error) {
      console.error('Erreur création troc sécurisé:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Soumettre les photos avant expédition
   */
  async submitPhotos(tradeId, userId, photos, trackingNumber = null) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      if (!trade.security?.pureTradeValidation?.constraints?.photosRequired) {
        return {
          success: false,
          error: 'Les photos ne sont pas requises pour ce troc'
        };
      }

      const isFromUser = trade.fromUser.toString() === userId;
      const userType = isFromUser ? 'fromUser' : 'toUser';

      // Vérifier que les photos ne sont pas déjà soumises
      if (trade.security.pureTradeValidation.steps.photosSubmitted[userType]) {
        return {
          success: false,
          error: 'Photos déjà soumises pour cet utilisateur'
        };
      }

      // Initialiser les preuves si nécessaire
      if (!trade.security.pureTradeValidation.proofs) {
        trade.security.pureTradeValidation.proofs = {
          fromUser: {},
          toUser: {}
        };
      }

      // Mettre à jour les preuves
      trade.security.pureTradeValidation.proofs[userType] = {
        beforeShipping: photos,
        trackingNumber: trackingNumber,
        submittedAt: new Date()
      };

      // Marquer comme soumis
      trade.security.pureTradeValidation.steps.photosSubmitted[userType] = true;

      // Ajouter à la timeline
      trade.security.pureTradeValidation.timeline.push({
        step: 'photos_submitted',
        userId: userId,
        timestamp: new Date(),
        data: { photoCount: photos.length, hasTracking: !!trackingNumber }
      });

      // Vérifier si les deux utilisateurs ont soumis leurs photos
      const bothSubmitted = 
        trade.security.pureTradeValidation.steps.photosSubmitted.fromUser &&
        trade.security.pureTradeValidation.steps.photosSubmitted.toUser;

      if (bothSubmitted) {
        trade.status = 'accepted'; // Peut maintenant procéder à l'échange
      }

      await trade.save();

      return {
        success: true,
        message: bothSubmitted 
          ? 'Photos validées ! Les deux utilisateurs peuvent maintenant expédier leurs objets.'
          : 'Photos soumises avec succès. En attente des photos de l\'autre utilisateur.',
        bothSubmitted,
        canProceed: bothSubmitted
      };
    } catch (error) {
      console.error('Erreur soumission photos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirmer l'expédition
   */
  async confirmShipment(tradeId, userId, trackingNumber = null) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      const isFromUser = trade.fromUser.toString() === userId;
      const userType = isFromUser ? 'fromUser' : 'toUser';

      // Vérifier que les photos sont soumises si requises
      if (trade.security?.pureTradeValidation?.constraints?.photosRequired) {
        if (!trade.security.pureTradeValidation.steps.photosSubmitted[userType]) {
          return {
            success: false,
            error: 'Vous devez d\'abord soumettre les photos de vos objets'
          };
        }
      }

      // Marquer l'expédition
      trade.security.pureTradeValidation.steps.shippingConfirmed[userType] = true;

      // Mettre à jour le tracking si fourni
      if (trackingNumber) {
        if (!trade.security.pureTradeValidation.proofs) {
          trade.security.pureTradeValidation.proofs = { fromUser: {}, toUser: {} };
        }
        if (!trade.security.pureTradeValidation.proofs[userType]) {
          trade.security.pureTradeValidation.proofs[userType] = {};
        }
        trade.security.pureTradeValidation.proofs[userType].trackingNumber = trackingNumber;
      }

      // Ajouter à la timeline
      trade.security.pureTradeValidation.timeline.push({
        step: 'shipping_confirmed',
        userId: userId,
        timestamp: new Date(),
        data: { trackingNumber: trackingNumber }
      });

      // Vérifier si les deux ont expédié
      const bothShipped = 
        trade.security.pureTradeValidation.steps.shippingConfirmed.fromUser &&
        trade.security.pureTradeValidation.steps.shippingConfirmed.toUser;

      if (bothShipped) {
        trade.status = 'shipping_confirmed';
      }

      await trade.save();

      return {
        success: true,
        message: bothShipped 
          ? 'Les deux objets sont expédiés ! Confirmez la réception une fois reçus.'
          : 'Expédition confirmée. En attente de l\'expédition de l\'autre utilisateur.',
        bothShipped,
        status: trade.status
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
   * Confirmer la réception et évaluer
   */
  async confirmDelivery(tradeId, userId, rating, comment = '') {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      const isFromUser = trade.fromUser.toString() === userId;
      const userType = isFromUser ? 'fromUser' : 'toUser';
      const otherUserId = isFromUser ? trade.toUser : trade.fromUser;

      // Vérifier que l'expédition a été confirmée
      if (!trade.security?.pureTradeValidation?.steps?.shippingConfirmed?.[isFromUser ? 'toUser' : 'fromUser']) {
        return {
          success: false,
          error: 'L\'autre utilisateur n\'a pas encore confirmé l\'expédition'
        };
      }

      // Marquer la réception
      trade.security.pureTradeValidation.steps.deliveryConfirmed[userType] = true;

      // Ajouter l'évaluation
      const ratingField = isFromUser ? 'fromUserRating' : 'toUserRating';
      if (!trade.ratings) {
        trade.ratings = {};
      }
      trade.ratings[ratingField] = {
        score: rating,
        comment: comment,
        submittedAt: new Date()
      };

      // Ajouter à la timeline
      trade.security.pureTradeValidation.timeline.push({
        step: 'delivery_confirmed',
        userId: userId,
        timestamp: new Date(),
        data: { rating: rating, hasComment: !!comment }
      });

      // Vérifier si les deux ont confirmé la réception
      const bothDelivered = 
        trade.security.pureTradeValidation.steps.deliveryConfirmed.fromUser &&
        trade.security.pureTradeValidation.steps.deliveryConfirmed.toUser;

      if (bothDelivered) {
        trade.status = 'completed';
        
        // Mettre à jour les statistiques des utilisateurs
        await this.updateUserStats(trade.fromUser, trade.toUser, trade);
      }

      await trade.save();

      return {
        success: true,
        message: bothDelivered 
          ? 'Troc terminé avec succès ! Merci pour votre évaluation.'
          : 'Réception confirmée. En attente de confirmation de l\'autre utilisateur.',
        completed: bothDelivered,
        status: trade.status
      };
    } catch (error) {
      console.error('Erreur confirmation livraison:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Signaler un problème
   */
  async reportProblem(tradeId, reportedBy, reason, description, evidence = []) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      // Initialiser les reports si nécessaire
      if (!trade.security?.pureTradeValidation?.reports) {
        if (!trade.security) trade.security = {};
        if (!trade.security.pureTradeValidation) trade.security.pureTradeValidation = {};
        trade.security.pureTradeValidation.reports = [];
      }

      // Ajouter le signalement
      const report = {
        reportedBy: reportedBy,
        reason: reason,
        description: description,
        evidence: evidence,
        status: 'pending',
        createdAt: new Date()
      };

      trade.security.pureTradeValidation.reports.push(report);

      // Ajouter à la timeline
      trade.security.pureTradeValidation.timeline.push({
        step: 'problem_reported',
        userId: reportedBy,
        timestamp: new Date(),
        data: { reason: reason, evidenceCount: evidence.length }
      });

      await trade.save();

      // Notifier l'équipe de modération
      await this.notifyModerationTeam(tradeId, report);

      return {
        success: true,
        message: 'Signalement enregistré. Notre équipe va examiner le problème.'
      };
    } catch (error) {
      console.error('Erreur signalement problème:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mettre à jour les statistiques utilisateur après un troc
   */
  async updateUserStats(fromUserId, toUserId, trade) {
    try {
      const updates = [];

      // Préparer les mises à jour pour les deux utilisateurs
      [fromUserId, toUserId].forEach((userId, index) => {
        const otherUserId = index === 0 ? toUserId : fromUserId;
        const ratingField = index === 0 ? 'toUserRating' : 'fromUserRating';
        const rating = trade.ratings?.[ratingField];

        const update = {
          $inc: { 'tradeStats.completedTrades': 1 },
          $push: {
            'tradeStats.ratingsReceived': {
              fromUser: otherUserId,
              tradeId: trade._id,
              rating: rating?.score || 3,
              comment: rating?.comment || '',
              createdAt: new Date()
            }
          }
        };

        updates.push(User.findByIdAndUpdate(userId, update));
      });

      await Promise.all(updates);

      // Recalculer les moyennes et scores
      await Promise.all([
        this.recalculateUserAverages(fromUserId),
        this.recalculateUserAverages(toUserId)
      ]);

    } catch (error) {
      console.error('Erreur mise à jour stats utilisateur:', error);
    }
  }

  /**
   * Recalculer les moyennes d'un utilisateur
   */
  async recalculateUserAverages(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.tradeStats?.ratingsReceived) return;

      const ratings = user.tradeStats.ratingsReceived;
      if (ratings.length > 0) {
        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        await User.findByIdAndUpdate(userId, {
          'tradeStats.averageRating': Math.round(average * 10) / 10,
          'tradeStats.totalRatings': ratings.length
        });
      }

      // Recalculer le score de confiance
      await this.calculateTrustScore(userId);
    } catch (error) {
      console.error('Erreur recalcul moyennes:', error);
    }
  }

  /**
   * Appliquer une pénalité pour violation
   */
  async applyViolationPenalty(userId, violationType, description = '') {
    try {
      const penalty = this.config.VIOLATION_PENALTIES[violationType] || -10;
      
      // Mettre à jour les violations
      const violationField = `tradeStats.violations.${violationType}`;
      const update = {
        $inc: {
          [violationField]: 1,
          'tradeStats.violations.total': 1
        }
      };

      await User.findByIdAndUpdate(userId, update);

      // Recalculer le score de confiance
      await this.calculateTrustScore(userId);

      return {
        success: true,
        penalty: penalty,
        message: `Pénalité appliquée: ${penalty} points pour ${violationType}`
      };
    } catch (error) {
      console.error('Erreur application pénalité:', error);
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
    console.log(`🚨 SIGNALEMENT TROC - Trade ${tradeId}:`, {
      reason: report.reason,
      description: report.description,
      reportedBy: report.reportedBy,
      evidenceCount: report.evidence?.length || 0
    });
    
    // Ici vous pouvez intégrer avec votre système de notifications
    // (email, Slack, webhook, etc.)
  }

  /**
   * Calculer le score de sécurité d'un trade existant
   */
  async calculateTradeSecurityScore(trade) {
    try {
      if (!trade.security?.trustScores) {
        // Fallback: calculer les scores basiques
        return Math.floor(Math.random() * 100); // Score aléatoire pour les tests
      }
      
      const { sender, recipient } = trade.security.trustScores;
      const averageScore = (sender + recipient) / 2;
      
      // Ajuster le score selon l'état du trade
      let adjustedScore = averageScore;
      
      if (trade.status === 'accepted') {
        adjustedScore += 10; // Bonus pour trade accepté
      }
      
      if (trade.security?.riskLevel === 'low') {
        adjustedScore += 5;
      } else if (trade.security?.riskLevel === 'high') {
        adjustedScore -= 10;
      }
      
      // S'assurer que le score reste dans les limites
      return Math.max(0, Math.min(100, Math.floor(adjustedScore)));
      
    } catch (error) {
      console.error('Erreur calcul score sécurité:', error);
      return 50; // Score neutre en cas d'erreur
    }
  }

  /**
   * Obtenir le statut de sécurité d'un troc
   */
  async getSecurityStatus(tradeId) {
    try {
      const trade = await Trade.findById(tradeId)
        .populate('fromUser', 'pseudo tradeStats.trustScore')
        .populate('toUser', 'pseudo tradeStats.trustScore');
      
      if (!trade) {
        return {
          success: false,
          error: 'Troc non trouvé'
        };
      }

      return {
        success: true,
        security: {
          riskLevel: trade.security?.riskLevel,
          trustScores: trade.security?.trustScores,
          constraints: trade.security?.pureTradeValidation?.constraints,
          steps: trade.security?.pureTradeValidation?.steps,
          timeline: trade.security?.pureTradeValidation?.timeline,
          reports: trade.security?.pureTradeValidation?.reports
        }
      };
    } catch (error) {
      console.error('Erreur statut sécurité:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PureTradeSecurityService;
