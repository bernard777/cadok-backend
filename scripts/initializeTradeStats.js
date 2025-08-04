/**
 * Script de migration pour initialiser les statistiques de troc
 * pour tous les utilisateurs existants
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Trade = require('../models/Trade');

async function initializeUserTradeStats() {
  try {
    console.log('🔄 Initialisation des statistiques de troc pour tous les utilisateurs...');

    // Trouver tous les utilisateurs qui n'ont pas encore de tradeStats
    const usersWithoutStats = await User.find({
      $or: [
        { tradeStats: { $exists: false } },
        { 'tradeStats.trustScore': { $exists: false } }
      ]
    });

    console.log(`📊 ${usersWithoutStats.length} utilisateurs à mettre à jour`);

    let updated = 0;
    for (const user of usersWithoutStats) {
      try {
        // Calculer les statistiques existantes
        const completedTrades = await Trade.countDocuments({
          $or: [{ fromUser: user._id }, { toUser: user._id }],
          status: 'completed'
        });

        const cancelledTrades = await Trade.countDocuments({
          $or: [{ fromUser: user._id }, { toUser: user._id }],
          status: 'cancelled'
        });

        // Calculer la note moyenne
        const tradesWithRatings = await Trade.find({
          $or: [{ fromUser: user._id }, { toUser: user._id }],
          status: 'completed',
          $or: [
            { 'ratings.fromUserRating': { $exists: true } },
            { 'ratings.toUserRating': { $exists: true } }
          ]
        });

        let totalRating = 0;
        let ratingCount = 0;
        const ratingsReceived = [];

        tradesWithRatings.forEach(trade => {
          // Si l'utilisateur est fromUser, il reçoit l'évaluation de toUser
          if (trade.fromUser.toString() === user._id.toString() && trade.ratings?.toUserRating) {
            totalRating += trade.ratings.toUserRating.score;
            ratingCount++;
            ratingsReceived.push({
              fromUser: trade.toUser,
              tradeId: trade._id,
              rating: trade.ratings.toUserRating.score,
              comment: trade.ratings.toUserRating.comment || '',
              createdAt: trade.ratings.toUserRating.submittedAt || trade.updatedAt
            });
          }
          
          // Si l'utilisateur est toUser, il reçoit l'évaluation de fromUser  
          if (trade.toUser.toString() === user._id.toString() && trade.ratings?.fromUserRating) {
            totalRating += trade.ratings.fromUserRating.score;
            ratingCount++;
            ratingsReceived.push({
              fromUser: trade.fromUser,
              tradeId: trade._id,
              rating: trade.ratings.fromUserRating.score,
              comment: trade.ratings.fromUserRating.comment || '',
              createdAt: trade.ratings.fromUserRating.submittedAt || trade.updatedAt
            });
          }
        });

        const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;

        // Calculer le score de confiance initial
        let trustScore = 50; // Base pour nouveaux utilisateurs

        // Bonus ancienneté (max +15)
        const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const ageBonus = Math.min(15, Math.floor(accountAge / 30) * 2);
        trustScore += ageBonus;

        // Bonus trocs réussis (max +25)
        const tradesBonus = Math.min(25, completedTrades * 2);
        trustScore += tradesBonus;

        // Bonus note moyenne (max +10)
        if (ratingCount > 0) {
          const ratingBonus = (averageRating - 3) * 5;
          trustScore += Math.max(0, ratingBonus);
        }

        // Malus taux d'annulation
        if (completedTrades + cancelledTrades > 0) {
          const cancellationRate = cancelledTrades / (completedTrades + cancelledTrades);
          trustScore -= cancellationRate * 20;
        }

        trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

        // Mettre à jour l'utilisateur
        await User.findByIdAndUpdate(user._id, {
          tradeStats: {
            completedTrades,
            cancelledTrades,
            averageRating,
            totalRatings: ratingCount,
            trustScore,
            lastActivity: new Date(),
            violations: {
              noShipment: 0,
              badQuality: 0,
              communication: 0,
              total: 0
            },
            ratingsReceived
          }
        });

        updated++;
        console.log(`✅ ${user.pseudo || user.email}: Score ${trustScore}/100 (${completedTrades} trocs)`);
      } catch (error) {
        console.error(`❌ Erreur pour ${user.pseudo || user.email}:`, error.message);
      }
    }

    console.log(`🎉 Migration terminée ! ${updated} utilisateurs mis à jour.`);
    return { success: true, updated };

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return { success: false, error: error.message };
  }
}

// Si ce script est exécuté directement
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok')
    .then(async () => {
      console.log('📡 Connecté à MongoDB');
      await initializeUserTradeStats();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}

module.exports = { initializeUserTradeStats };
