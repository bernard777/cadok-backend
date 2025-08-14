/**
 * Service de vérification intelligent pour troc pur CADOK
 * Basé sur localisation, historique et réputation (pas de prix)
 */

const User = require('../models/User');
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');

class SmartVerificationService {
  constructor() {
    this.verificationLevels = {
      NONE: { score: 0, label: 'Non vérifié' },
      PHONE: { score: 25, label: 'Téléphone vérifié' },
      BASIC: { score: 50, label: 'Profil vérifié' },
      VERIFIED: { score: 75, label: 'Identité vérifiée' },
      PREMIUM: { score: 100, label: 'Utilisateur premium' }
    };
  }

  /**
   * Déterminer le niveau de vérification requis pour un troc
   * Basé sur les vraies données CADOK (pas de prix)
   */
  async analyzeVerificationNeeds(fromUserId, toUserId, requestedObjectId) {
    try {
      // 1. Récupérer les données des utilisateurs et de l'objet
      const [fromUser, toUser, requestedObject] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId),
        ObjectModel.findById(requestedObjectId).populate('owner')
      ]);

      // 2. Calculer la distance entre les utilisateurs
      const distance = this.calculateDistance(fromUser, toUser);

      // 3. Analyser l'historique de troc entre ces utilisateurs
      const tradeHistory = await this.getTradeHistoryBetweenUsers(fromUserId, toUserId);

      // 4. Analyser les profils de confiance
      const trustAnalysis = this.analyzeTrustProfiles(fromUser, toUser);

      // 5. Déterminer le niveau requis
      const requiredLevel = this.determineRequiredLevel({
        distance,
        tradeHistory,
        trustAnalysis,
        fromUser,
        toUser
      });

      return {
        success: true,
        analysis: {
          distance: distance,
          sameCity: this.isSameCity(fromUser, toUser),
          sameRegion: this.isSameRegion(fromUser, toUser),
          firstTimeTogether: tradeHistory.totalTrades === 0,
          trustScores: {
            fromUser: fromUser.tradeStats.trustScore,
            toUser: toUser.tradeStats.trustScore
          },
          requiredLevel: requiredLevel,
          currentLevels: {
            fromUser: this.getUserVerificationLevel(fromUser),
            toUser: this.getUserVerificationLevel(toUser)
          },
          recommendations: this.generateRecommendations(distance, trustAnalysis)
        }
      };

    } catch (error) {
      console.error('Erreur analyse vérification:', error);
      return {
        success: false,
        error: error.message,
        defaultLevel: 'BASIC' // Niveau par défaut en cas d'erreur
      };
    }
  }

  /**
   * Calculer la distance entre deux utilisateurs
   */
  calculateDistance(fromUser, toUser) {
    // Si les deux ont des coordonnées précises
    if (fromUser.address?.coordinates && toUser.address?.coordinates) {
      return this.calculateGeoDistance(
        fromUser.address.coordinates,
        toUser.address.coordinates
      );
    }

    // Sinon estimation basée sur les codes postaux
    if (fromUser.address?.zipCode && toUser.address?.zipCode) {
      return this.estimateDistanceByZipCode(
        fromUser.address.zipCode,
        toUser.address.zipCode
      );
    }

    // Estimation grossière par ville
    if (fromUser.city && toUser.city) {
      return this.estimateDistanceByCity(fromUser.city, toUser.city);
    }

    return 999; // Distance inconnue = considérer comme lointain
  }

  /**
   * Calculer distance géographique précise
   */
  calculateGeoDistance(coords1, coords2) {
    const [lng1, lat1] = coords1;
    const [lng2, lat2] = coords2;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  }

  /**
   * Estimation par code postal
   */
  estimateDistanceByZipCode(zip1, zip2) {
    if (zip1 === zip2) return 0;
    
    const dept1 = zip1.substring(0, 2);
    const dept2 = zip2.substring(0, 2);
    
    if (dept1 === dept2) return 25; // Même département
    
    // Distance approximative entre départements français
    const deptDistance = {
      '75': { '92': 15, '93': 20, '94': 25, '91': 30, '77': 35, '78': 40 }, // Paris
      '69': { '42': 60, '01': 80, '38': 100 }, // Lyon
      '13': { '83': 80, '84': 100, '30': 120 }, // Marseille
      // ... autres estimations basées sur la géographie française
    };

    return deptDistance[dept1]?.[dept2] || 200; // Distance par défaut
  }

  /**
   * Estimation grossière par ville
   */
  estimateDistanceByCity(city1, city2) {
    if (city1.toLowerCase() === city2.toLowerCase()) return 5;
    
    const majorCities = {
      'paris': { 'lyon': 460, 'marseille': 770, 'toulouse': 680 },
      'lyon': { 'paris': 460, 'marseille': 320, 'toulouse': 540 },
      'marseille': { 'paris': 770, 'lyon': 320, 'toulouse': 400 }
    };

    const distance = majorCities[city1.toLowerCase()]?.[city2.toLowerCase()];
    return distance || 300; // Distance par défaut entre villes inconnues
  }

  /**
   * Vérifier si même ville
   */
  isSameCity(user1, user2) {
    return user1.city.toLowerCase() === user2.city.toLowerCase();
  }

  /**
   * Vérifier si même région (département)
   */
  isSameRegion(user1, user2) {
    if (user1.address?.zipCode && user2.address?.zipCode) {
      const dept1 = user1.address.zipCode.substring(0, 2);
      const dept2 = user2.address.zipCode.substring(0, 2);
      return dept1 === dept2;
    }
    return false;
  }

  /**
   * Récupérer l'historique de troc entre deux utilisateurs
   */
  async getTradeHistoryBetweenUsers(user1Id, user2Id) {
    const trades = await Trade.find({
      $or: [
        { fromUser: user1Id, toUser: user2Id },
        { fromUser: user2Id, toUser: user1Id }
      ]
    });

    const completed = trades.filter(t => t.status === 'completed').length;
    const cancelled = trades.filter(t => t.status === 'cancelled').length;
    
    return {
      totalTrades: trades.length,
      completedTrades: completed,
      cancelledTrades: cancelled,
      successRate: trades.length > 0 ? completed / trades.length : 0,
      lastTradeDate: trades.length > 0 ? Math.max(...trades.map(t => t.createdAt)) : null
    };
  }

  /**
   * Analyser les profils de confiance
   */
  analyzeTrustProfiles(user1, user2) {
    const user1Trust = user1.tradeStats?.trustScore || 50;
    const user2Trust = user2.tradeStats?.trustScore || 50;
    
    return {
      averageScore: (user1Trust + user2Trust) / 2,
      lowestScore: Math.min(user1Trust, user2Trust),
      bothTrusted: user1Trust >= 70 && user2Trust >= 70,
      anyUntrusted: user1Trust < 40 || user2Trust < 40,
      user1: {
        score: user1Trust,
        completedTrades: user1.tradeStats?.completedTrades || 0,
        violations: user1.tradeStats?.violations?.total || 0,
        isNewUser: (user1.tradeStats?.completedTrades || 0) === 0
      },
      user2: {
        score: user2Trust,
        completedTrades: user2.tradeStats?.completedTrades || 0,
        violations: user2.tradeStats?.violations?.total || 0,
        isNewUser: (user2.tradeStats?.completedTrades || 0) === 0
      }
    };
  }

  /**
   * Déterminer le niveau de vérification requis
   */
  determineRequiredLevel({ distance, tradeHistory, trustAnalysis, fromUser, toUser }) {
    // Niveau par défaut
    let requiredLevel = 'PHONE';

    // 🟢 CAS PRIVILÉGIÉS : Vérification minimale
    if (
      distance <= 20 &&                           // Très proche (< 20km)
      trustAnalysis.bothTrusted &&                // Les deux ont un bon score
      tradeHistory.successRate >= 0.8             // Bon historique ensemble
    ) {
      return 'PHONE';
    }

    // 🟡 CAS STANDARDS : Vérification de base
    if (
      tradeHistory.totalTrades === 0 ||           // Premier troc ensemble
      distance > 20 && distance <= 100 ||        // Distance moyenne
      !trustAnalysis.bothTrusted                  // Au moins un score moyen
    ) {
      requiredLevel = 'BASIC';
    }

    // 🔴 CAS À RISQUE : Vérification renforcée
    if (
      distance > 200 ||                           // Très loin
      trustAnalysis.anyUntrusted ||               // Score faible
      trustAnalysis.user1.violations > 2 ||      // Violations multiples
      trustAnalysis.user2.violations > 2 ||
      (trustAnalysis.user1.isNewUser && trustAnalysis.user2.isNewUser) // Deux nouveaux
    ) {
      requiredLevel = 'VERIFIED';
    }

    return requiredLevel;
  }

  /**
   * Obtenir le niveau de vérification actuel d'un utilisateur
   */
  getUserVerificationLevel(user) {
    if (user.verified && user.phoneVerified && user.emailVerified) {
      return 'VERIFIED';
    } else if (user.emailVerified && user.phoneVerified) {
      return 'BASIC';
    } else if (user.phoneVerified) {
      return 'PHONE';
    } else {
      return 'NONE';
    }
  }

  /**
   * Générer des recommandations intelligentes
   */
  generateRecommendations(distance, trustAnalysis) {
    const recommendations = [];

    if (distance <= 20) {
      recommendations.push({
        type: 'meeting',
        icon: '🤝',
        message: 'Remise en main propre recommandée (proximité)',
        priority: 'high'
      });
    }

    if (distance > 100) {
      recommendations.push({
        type: 'shipping',
        icon: '📦',
        message: 'Envoi postal requis avec suivi',
        priority: 'medium'
      });
    }

    if (trustAnalysis.bothTrusted) {
      recommendations.push({
        type: 'trust',
        icon: '⭐',
        message: 'Échange privilégié entre utilisateurs de confiance',
        priority: 'info'
      });
    }

    return recommendations;
  }

  /**
   * Vérifier si un utilisateur peut faire un troc sans friction supplémentaire
   */
  async canTradeInstantly(fromUserId, toUserId, objectId) {
    const analysis = await this.analyzeVerificationNeeds(fromUserId, toUserId, objectId);
    
    if (!analysis.success) return false;

    const { currentLevels, requiredLevel } = analysis.analysis;
    
    // Vérifier si les deux utilisateurs ont le niveau requis
    const fromUserMeetsRequirement = this.levelMeetsRequirement(currentLevels.fromUser, requiredLevel);
    const toUserMeetsRequirement = this.levelMeetsRequirement(currentLevels.toUser, requiredLevel);

    return fromUserMeetsRequirement && toUserMeetsRequirement;
  }

  /**
   * Vérifier si un niveau actuel satisfait le niveau requis
   */
  levelMeetsRequirement(currentLevel, requiredLevel) {
    const levelOrder = ['NONE', 'PHONE', 'BASIC', 'VERIFIED', 'PREMIUM'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    const requiredIndex = levelOrder.indexOf(requiredLevel);
    
    return currentIndex >= requiredIndex;
  }
}

module.exports = SmartVerificationService;
