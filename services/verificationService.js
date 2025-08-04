/**
 * Service de vérification et validation pour éviter les arnaques
 * Système de confiance et réputation des utilisateurs
 */

const User = require('../models/User');
const Trade = require('../models/Trade');

class VerificationService {
  constructor() {
    this.verificationLevels = {
      'BASIC': { score: 1, label: 'Utilisateur vérifié' },
      'PHONE': { score: 2, label: 'Téléphone vérifié' },
      'EMAIL': { score: 2, label: 'Email vérifié' },
      'IDENTITY': { score: 4, label: 'Identité vérifiée' },
      'ADDRESS': { score: 3, label: 'Adresse vérifiée' },
      'PAYMENT': { score: 3, label: 'Moyen de paiement vérifié' },
      'PREMIUM': { score: 5, label: 'Membre premium vérifié' }
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

      let trustScore = 0;
      let verifications = [];

      // 1. Vérifications de base
      if (user.emailVerified) {
        trustScore += this.verificationLevels.EMAIL.score;
        verifications.push('EMAIL');
      }

      if (user.phoneVerified) {
        trustScore += this.verificationLevels.PHONE.score;
        verifications.push('PHONE');
      }

      // 2. Vérifications avancées
      if (user.verification?.identityVerified) {
        trustScore += this.verificationLevels.IDENTITY.score;
        verifications.push('IDENTITY');
      }

      if (user.verification?.addressVerified) {
        trustScore += this.verificationLevels.ADDRESS.score;
        verifications.push('ADDRESS');
      }

      if (user.verification?.paymentVerified) {
        trustScore += this.verificationLevels.PAYMENT.score;
        verifications.push('PAYMENT');
      }

      // 3. Historique des échanges
      const tradeHistory = await this.getTradeHistory(userId);
      const historyBonus = this.calculateHistoryBonus(tradeHistory);
      trustScore += historyBonus;

      // 4. Pénalités pour signalements
      const penalties = await this.calculatePenalties(userId);
      trustScore -= penalties;

      // Score final (0-100)
      const finalScore = Math.max(0, Math.min(100, trustScore * 10));

      return {
        score: finalScore,
        level: this.getTrustLevel(finalScore),
        verifications,
        breakdown: {
          baseVerifications: (verifications.length * 2 * 10),
          historyBonus: historyBonus * 10,
          penalties: penalties * 10,
          details: tradeHistory
        }
      };

    } catch (error) {
      console.error('Erreur calcul score confiance:', error);
      return {
        score: 0,
        level: 'UNKNOWN',
        error: error.message
      };
    }
  }

  /**
   * Vérifier l'éligibilité d'un échange selon les scores de confiance
   */
  async verifyTradeEligibility(senderId, recipientId, tradeValue) {
    try {
      const [senderTrust, recipientTrust] = await Promise.all([
        this.calculateTrustScore(senderId),
        this.calculateTrustScore(recipientId)
      ]);

      const requirements = this.getTradeRequirements(tradeValue);
      
      // Vérifications de sécurité
      const checks = {
        senderMeetsMinimum: senderTrust.score >= requirements.minTrustScore,
        recipientMeetsMinimum: recipientTrust.score >= requirements.minTrustScore,
        identityRequired: tradeValue > 100,
        escrowRequired: tradeValue > 50,
        insuranceRecommended: tradeValue > 200
      };

      // Recommandations de sécurité
      const recommendations = [];
      
      if (checks.escrowRequired) {
        recommendations.push({
          type: 'ESCROW',
          priority: 'HIGH',
          message: 'Dépôt de garantie recommandé pour cette valeur d\'échange'
        });
      }

      if (checks.identityRequired && (!senderTrust.verifications.includes('IDENTITY') || !recipientTrust.verifications.includes('IDENTITY'))) {
        recommendations.push({
          type: 'IDENTITY_VERIFICATION',
          priority: 'MEDIUM',
          message: 'Vérification d\'identité recommandée pour les échanges de haute valeur'
        });
      }

      if (senderTrust.score < 30 || recipientTrust.score < 30) {
        recommendations.push({
          type: 'SECURE_DELIVERY',
          priority: 'HIGH',
          message: 'Livraison sécurisée obligatoire pour les nouveaux utilisateurs'
        });
      }

      return {
        eligible: checks.senderMeetsMinimum && checks.recipientMeetsMinimum,
        trustScores: {
          sender: senderTrust,
          recipient: recipientTrust
        },
        requirements,
        checks,
        recommendations,
        securityLevel: this.calculateSecurityLevel(senderTrust, recipientTrust, tradeValue)
      };

    } catch (error) {
      console.error('Erreur vérification éligibilité échange:', error);
      return {
        eligible: false,
        error: error.message
      };
    }
  }

  /**
   * Démarrer le processus de vérification d'identité
   */
  async startIdentityVerification(userId, document) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Simulation d'un service de vérification d'identité
      // En production, intégrer avec des services comme Yoti, Jumio, etc.
      
      const verificationSession = {
        id: `VER_${Date.now()}`,
        userId,
        status: 'pending',
        documentType: document.type,
        submittedAt: new Date(),
        expectedResponseTime: '24-48 heures'
      };

      // Stocker la session de vérification
      user.verification = user.verification || {};
      user.verification.identitySession = verificationSession;
      await user.save();

      // Simuler traitement automatique basique
      setTimeout(async () => {
        await this.processIdentityVerification(verificationSession.id);
      }, 5000); // 5 sec pour la demo

      return {
        success: true,
        sessionId: verificationSession.id,
        status: 'pending',
        message: 'Vérification d\'identité soumise avec succès'
      };

    } catch (error) {
      console.error('Erreur démarrage vérification identité:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Traiter la vérification d'identité (simulation)
   */
  async processIdentityVerification(sessionId) {
    try {
      const user = await User.findOne({
        'verification.identitySession.id': sessionId
      });

      if (!user) {
        throw new Error('Session de vérification non trouvée');
      }

      // Simulation d'analyse automatique
      const verificationResult = Math.random() > 0.1; // 90% de succès pour la demo

      user.verification.identitySession.status = verificationResult ? 'approved' : 'rejected';
      user.verification.identitySession.processedAt = new Date();
      
      if (verificationResult) {
        user.verification.identityVerified = true;
        user.verification.identityVerifiedAt = new Date();
      }

      await user.save();

      // Notifier l'utilisateur
      await this.notifyVerificationResult(user._id, sessionId, verificationResult);

      return {
        success: verificationResult,
        status: user.verification.identitySession.status
      };

    } catch (error) {
      console.error('Erreur traitement vérification identité:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Signaler un utilisateur suspect
   */
  async reportUser(reporterId, reportedUserId, reason, evidence) {
    try {
      const report = {
        id: `RPT_${Date.now()}`,
        reporterId,
        reportedUserId,
        reason,
        evidence,
        status: 'pending',
        createdAt: new Date(),
        severity: this.calculateReportSeverity(reason, evidence)
      };

      // Stocker le signalement
      const reportedUser = await User.findById(reportedUserId);
      if (!reportedUser) {
        throw new Error('Utilisateur signalé non trouvé');
      }

      reportedUser.reports = reportedUser.reports || [];
      reportedUser.reports.push(report);
      await reportedUser.save();

      // Actions automatiques selon la gravité
      if (report.severity === 'HIGH') {
        await this.suspendUserTemporarily(reportedUserId);
      }

      // Notifier l'équipe de modération
      await this.notifyModerationTeam(report);

      return {
        success: true,
        reportId: report.id,
        message: 'Signalement enregistré avec succès'
      };

    } catch (error) {
      console.error('Erreur signalement utilisateur:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Méthodes utilitaires
   */
  async getTradeHistory(userId) {
    const trades = await Trade.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(20);

    return {
      totalTrades: trades.length,
      recentTrades: trades.slice(0, 5),
      avgRating: this.calculateAverageRating(trades),
      completionRate: this.calculateCompletionRate(userId),
      disputes: trades.filter(t => t.dispute && t.dispute.status === 'resolved').length
    };
  }

  calculateHistoryBonus(history) {
    let bonus = 0;
    
    // Bonus par échange réussi (max 20 points)
    bonus += Math.min(history.totalTrades * 0.5, 20);
    
    // Bonus note moyenne (max 10 points)
    if (history.avgRating >= 4.5) bonus += 10;
    else if (history.avgRating >= 4.0) bonus += 5;
    else if (history.avgRating >= 3.5) bonus += 2;
    
    return bonus;
  }

  async calculatePenalties(userId) {
    const user = await User.findById(userId);
    let penalties = 0;
    
    if (user.reports && user.reports.length > 0) {
      penalties += user.reports.length * 2;
    }
    
    if (user.suspended) {
      penalties += 10;
    }
    
    return penalties;
  }

  getTrustLevel(score) {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'AVERAGE';
    if (score >= 20) return 'LOW';
    return 'VERY_LOW';
  }

  getTradeRequirements(value) {
    if (value > 200) {
      return {
        minTrustScore: 60,
        identityRequired: true,
        escrowRequired: true,
        secureDeliveryRequired: true
      };
    } else if (value > 100) {
      return {
        minTrustScore: 40,
        identityRequired: false,
        escrowRequired: true,
        secureDeliveryRequired: true
      };
    } else if (value > 50) {
      return {
        minTrustScore: 20,
        identityRequired: false,
        escrowRequired: true,
        secureDeliveryRequired: false
      };
    } else {
      return {
        minTrustScore: 10,
        identityRequired: false,
        escrowRequired: false,
        secureDeliveryRequired: false
      };
    }
  }

  calculateSecurityLevel(senderTrust, recipientTrust, value) {
    const avgTrust = (senderTrust.score + recipientTrust.score) / 2;
    
    if (avgTrust >= 70 && value < 100) return 'LOW_RISK';
    if (avgTrust >= 50 && value < 200) return 'MEDIUM_RISK';
    if (avgTrust >= 30) return 'HIGH_RISK';
    return 'VERY_HIGH_RISK';
  }

  calculateAverageRating(trades) {
    if (trades.length === 0) return 0;
    const totalRating = trades.reduce((sum, trade) => sum + (trade.rating || 3), 0);
    return totalRating / trades.length;
  }

  async calculateCompletionRate(userId) {
    const totalTrades = await Trade.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });
    
    const completedTrades = await Trade.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });
    
    return totalTrades > 0 ? (completedTrades / totalTrades) * 100 : 0;
  }

  calculateReportSeverity(reason, evidence) {
    const highRiskReasons = ['fraud', 'scam', 'fake_identity', 'harassment'];
    const mediumRiskReasons = ['no_delivery', 'wrong_item', 'poor_communication'];
    
    if (highRiskReasons.includes(reason)) return 'HIGH';
    if (mediumRiskReasons.includes(reason)) return 'MEDIUM';
    return 'LOW';
  }

  async suspendUserTemporarily(userId) {
    await User.findByIdAndUpdate(userId, {
      suspended: true,
      suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      suspensionReason: 'Signalement en cours d\'investigation'
    });
  }

  async notifyVerificationResult(userId, sessionId, success) {
    console.log(`📧 Notification vérification - Utilisateur ${userId}: ${success ? 'Approuvée' : 'Rejetée'}`);
    // Implémenter envoi d'email/notification push
  }

  async notifyModerationTeam(report) {
    console.log(`🚨 SIGNALEMENT - Utilisateur ${report.reportedUserId}:`, report.reason);
    // Implémenter notification équipe modération
  }
}

module.exports = VerificationService;
