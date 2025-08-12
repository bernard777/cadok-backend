/**
 * Service de sécurisation des trocs SANS ARGENT
 * Solutions alternatives pour éviter les arnaques avec budget limité
 */

const Trade = require('../models/Trade');
const User = require('../models/User');

class FreeTradeSecurityService {
  constructor() {
    this.penaltyDuration = 30; // 30 jours de suspension en cas d'arnaque
    this.minTrustScoreForHighValue = 60; // Score minimum pour objets de valeur
  }

  /**
   * SYSTÈME 1: Score de réputation et contraintes progressives
   */
  async checkTradeEligibility(fromUserId, toUserId, tradeValue) {
    try {
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!fromUser || !toUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Calculer les scores de confiance
      const fromUserScore = await this.calculateTrustScore(fromUser);
      const toUserScore = await this.calculateTrustScore(toUser);

      // Règles selon la valeur de l'échange
      const rules = this.getTradeRules(tradeValue);
      
      const checks = {
        fromUserEligible: fromUserScore >= rules.minScore,
        toUserEligible: toUserScore >= rules.minScore,
        identityRequired: rules.identityRequired,
        photoProofRequired: rules.photoProofRequired,
        witnessRequired: rules.witnessRequired
      };

      const restrictions = [];
      
      // Nouveaux utilisateurs : restrictions
      if (fromUserScore < 20) {
        restrictions.push({
          type: 'NEW_USER',
          target: 'fromUser',
          requirement: 'Maximum 3 échanges en parallèle',
          maxValue: 50
        });
      }

      if (toUserScore < 20) {
        restrictions.push({
          type: 'NEW_USER',
          target: 'toUser',
          requirement: 'Maximum 3 échanges en parallèle',
          maxValue: 50
        });
      }

      // Utilisateurs suspects : restrictions sévères
      if (fromUser.reports && fromUser.reports.length > 2) {
        restrictions.push({
          type: 'REPORTED_USER',
          target: 'fromUser',
          requirement: 'Échanges en main propre uniquement',
          reason: 'Utilisateur signalé plusieurs fois'
        });
      }

      return {
        success: true,
        eligible: checks.fromUserEligible && checks.toUserEligible,
        scores: { fromUser: fromUserScore, toUser: toUserScore },
        rules,
        checks,
        restrictions,
        recommendations: this.getSecurityRecommendations(fromUserScore, toUserScore, tradeValue)
      };

    } catch (error) {
      console.error('Erreur vérification éligibilité:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SYSTÈME 2: Preuve photographique obligatoire
   */
  async createSecuredTrade(tradeData) {
    try {
      const { fromUserId, toUserId, fromObjects, toObjects } = tradeData;

      // Vérifier l'éligibilité
      const eligibility = await this.checkTradeEligibility(fromUserId, toUserId);
      
      if (!eligibility.eligible) {
        throw new Error('Échange non autorisé selon les règles de sécurité');
      }

      // Créer le trade avec exigences de sécurité
      const trade = new Trade({
        fromUser: fromUserId,
        toUser: toUserId,
        offeredObjects: fromObjects,
        requestedObjects: toObjects,
        // Système de troc pur sans valeur monétaire
        security: {
          level: this.calculateSecurityLevel(),
          requirements: {
            photoProofRequired: true, // Toujours requis pour un troc sécurisé
            trackingRequired: true,
            witnessRequired: false,
            identityVerificationRequired: true
          },
          milestones: {
            objectsPhotographed: { fromUser: false, toUser: false },
            packagingPhotographed: { fromUser: false, toUser: false },
            shippingConfirmed: { fromUser: false, toUser: false },
            deliveryConfirmed: { fromUser: false, toUser: false }
          }
        },
        status: 'pending_security_compliance'
      });

      await trade.save();

      return {
        success: true,
        trade: trade.toJSON(),
        nextSteps: this.getNextSecuritySteps(trade),
        message: 'Troc créé avec mesures de sécurité'
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
   * SYSTÈME 3: Validation par étapes avec preuves
   */
  async submitProofPhoto(tradeId, userId, proofType, photoData) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      const isFromUser = trade.fromUser.toString() === userId;
      const userType = isFromUser ? 'fromUser' : 'toUser';

      // Valider le type de preuve
      const validProofTypes = ['object_photo', 'packaging_photo', 'shipping_receipt', 'delivery_photo'];
      if (!validProofTypes.includes(proofType)) {
        throw new Error('Type de preuve non valide');
      }

      // Stocker la preuve
      if (!trade.proofs) {
        trade.proofs = {};
      }
      if (!trade.proofs[userType]) {
        trade.proofs[userType] = {};
      }

      trade.proofs[userType][proofType] = {
        photoUrl: photoData.url || photoData.base64,
        description: photoData.description,
        timestamp: new Date(),
        verified: false // À vérifier par l'autre utilisateur ou l'admin
      };

      // Mettre à jour les jalons de sécurité
      if (proofType === 'object_photo') {
        trade.security.milestones.objectsPhotographed[userType] = true;
      } else if (proofType === 'packaging_photo') {
        trade.security.milestones.packagingPhotographed[userType] = true;
      }

      // Vérifier si toutes les preuves requises sont soumises
      const allProofsSubmitted = this.checkAllProofsSubmitted(trade);
      if (allProofsSubmitted && trade.status === 'pending_security_compliance') {
        trade.status = 'secured';
      }

      await trade.save();

      return {
        success: true,
        message: 'Preuve photographique soumise avec succès',
        nextSteps: this.getNextSecuritySteps(trade),
        allProofsReady: allProofsSubmitted
      };

    } catch (error) {
      console.error('Erreur soumission preuve:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SYSTÈME 4: Confirmation croisée entre utilisateurs
   */
  async validateShipment(tradeId, validatorId, shipmentData) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      const isFromUser = trade.fromUser.toString() === validatorId;
      const userType = isFromUser ? 'fromUser' : 'toUser';

      // Enregistrer la confirmation d'expédition
      if (!trade.shipments) {
        trade.shipments = {};
      }

      trade.shipments[userType] = {
        confirmedAt: new Date(),
        trackingNumber: shipmentData.trackingNumber,
        carrier: shipmentData.carrier,
        estimatedDelivery: shipmentData.estimatedDelivery,
        photo: shipmentData.photoUrl
      };

      // Mettre à jour le jalon
      trade.security.milestones.shippingConfirmed[userType] = true;

      // Si les deux ont expédié
      const bothShipped = trade.security.milestones.shippingConfirmed.fromUser && 
                         trade.security.milestones.shippingConfirmed.toUser;

      if (bothShipped) {
        trade.status = 'both_shipped';
      }

      await trade.save();

      return {
        success: true,
        status: trade.status,
        bothShipped,
        message: bothShipped 
          ? 'Les deux objets sont expédiés ! Suivez vos livraisons'
          : 'Votre expédition est confirmée'
      };

    } catch (error) {
      console.error('Erreur validation expédition:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * SYSTÈME 5: Signalement et pénalités automatiques
   */
  async reportNonCompliance(tradeId, reporterId, violationType, evidence) {
    try {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      // Déterminer l'utilisateur signalé
      const reportedUserId = trade.fromUser.toString() === reporterId 
        ? trade.toUser 
        : trade.fromUser;

      const report = {
        id: `VIO_${Date.now()}`,
        tradeId,
        reporterId,
        reportedUserId,
        violationType, // 'not_shipped', 'wrong_item', 'no_communication', 'fake_proof'
        evidence,
        severity: this.calculateViolationSeverity(violationType, evidence),
        status: 'pending_review',
        createdAt: new Date()
      };

      // Ajouter au trade
      if (!trade.violations) {
        trade.violations = [];
      }
      trade.violations.push(report);

      // Appliquer des pénalités automatiques selon la gravité
      await this.applyAutomaticPenalties(reportedUserId, report);

      // Marquer le trade comme problématique
      trade.status = 'disputed';

      await trade.save();

      return {
        success: true,
        reportId: report.id,
        message: 'Signalement enregistré. Des mesures automatiques ont été appliquées.',
        severity: report.severity
      };

    } catch (error) {
      console.error('Erreur signalement violation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Méthodes utilitaires
   */
  async calculateTrustScore(user) {
    let score = 0;
    
    // Points de base
    if (user.emailVerified) score += 10;
    if (user.phoneVerified) score += 10;
    if (user.profileComplete) score += 5;
    
    // Historique des échanges
    const completedTrades = await Trade.countDocuments({
      $or: [{ fromUser: user._id }, { toUser: user._id }],
      status: 'completed'
    });
    score += Math.min(completedTrades * 5, 50); // Max 50 points
    
    // Pénalités
    const violations = user.violations || [];
    score -= violations.length * 10;
    
    // Notes reçues
    if (user.averageRating) {
      score += (user.averageRating - 3) * 10; // -20 à +20 points
    }
    
    return Math.max(0, Math.min(100, score));
  }

  getTradeRules(value) {
    if (value > 200) {
      return {
        minScore: 60,
        identityRequired: true,
        photoProofRequired: true,
        witnessRequired: true,
        maxParallelTrades: 2
      };
    } else if (value > 100) {
      return {
        minScore: 40,
        identityRequired: false,
        photoProofRequired: true,
        witnessRequired: false,
        maxParallelTrades: 3
      };
    } else if (value > 50) {
      return {
        minScore: 20,
        identityRequired: false,
        photoProofRequired: true,
        witnessRequired: false,
        maxParallelTrades: 5
      };
    } else {
      return {
        minScore: 10,
        identityRequired: false,
        photoProofRequired: false,
        witnessRequired: false,
        maxParallelTrades: 10
      };
    }
  }

  calculateSecurityLevel(value) {
    if (value > 200) return 'MAXIMUM';
    if (value > 100) return 'HIGH';
    if (value > 50) return 'MEDIUM';
    return 'BASIC';
  }

  getSecurityRecommendations(fromUserScore, toUserScore, value) {
    const recommendations = [];
    
    if (fromUserScore < 30 || toUserScore < 30) {
      recommendations.push({
        type: 'NEW_USER_WARNING',
        message: 'Au moins un utilisateur est nouveau. Soyez prudent et préférez les échanges en main propre.',
        priority: 'HIGH'
      });
    }
    
    if (value > 100) {
      recommendations.push({
        type: 'HIGH_VALUE_SECURITY',
        message: 'Échange de forte valeur : utilisez des preuves photo et un suivi de livraison.',
        priority: 'HIGH'
      });
    }
    
    return recommendations;
  }

  getNextSecuritySteps(trade) {
    const steps = [];
    
    if (!trade.security.milestones.objectsPhotographed.fromUser) {
      steps.push('Photographier vos objets à échanger');
    }
    
    if (!trade.security.milestones.packagingPhotographed.fromUser) {
      steps.push('Photographier l\'emballage avant expédition');
    }
    
    return steps;
  }

  checkAllProofsSubmitted(trade) {
    const required = trade.security.requirements;
    const proofs = trade.proofs || {};
    
    if (required.photoProofRequired) {
      return proofs.fromUser?.object_photo && proofs.toUser?.object_photo;
    }
    
    return true;
  }

  calculateViolationSeverity(type, evidence) {
    const severityMap = {
      'not_shipped': 'HIGH',
      'wrong_item': 'HIGH',
      'fake_proof': 'CRITICAL',
      'no_communication': 'MEDIUM',
      'late_shipping': 'LOW'
    };
    
    return severityMap[type] || 'MEDIUM';
  }

  async applyAutomaticPenalties(userId, report) {
    const user = await User.findById(userId);
    if (!user) return;
    
    // Ajouter la violation au profil
    if (!user.violations) {
      user.violations = [];
    }
    user.violations.push(report);
    
    // Pénalités selon la gravité
    if (report.severity === 'CRITICAL') {
      user.suspended = true;
      user.suspendedUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 jours
    } else if (report.severity === 'HIGH') {
      user.suspended = true;
      user.suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
    }
    
    await user.save();
    
    console.log(`⚠️ PÉNALITÉ APPLIQUÉE - Utilisateur ${userId}: ${report.severity}`);
  }
}

module.exports = FreeTradeSecurityService;
