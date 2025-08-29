/**
 * 🧮 CALCULATEUR GAMIFICATION UNIFIÉ
 * Logique centralisée pour le calcul de progression
 */

const User = require('../models/User');

/**
 * 📊 Calcule les données de gamification basées sur l'activité réelle
 */
async function calculateGamificationFromRealData(userId) {
  try {
    console.log('🧮 [GAMIFICATION] Calcul progression pour utilisateur:', userId);
    
    // Récupérer les données via les modèles directement
    const ObjectModel = require('../models/Object');
    const Trade = require('../models/Trade');
    
    // Compter les objets de l'utilisateur
    const objectsCount = await ObjectModel.countDocuments({ 
      owner: userId 
    });
    
    // Compter les échanges terminés de l'utilisateur
    const completedTradesCount = await Trade.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: 'completed'
    });
    
    // Compter tous les échanges initiés
    const totalTradesCount = await Trade.countDocuments({
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    console.log('📊 [GAMIFICATION] Données brutes:', { 
      objects: objectsCount, 
      completedTrades: completedTradesCount,
      totalTrades: totalTradesCount 
    });

    // Calcul XP
    const totalXP = (objectsCount * 10) + (completedTradesCount * 50) + (totalTradesCount * 20);
    
    // Calcul niveau et titre (même logique que HomeScreen)
    let level = 1;
    let title = 'Nouveau Troqueur';
    let nextLevelXP = 100;

    if (completedTradesCount >= 50) {
      level = 20; title = 'Gardien Planète'; nextLevelXP = 2500;
    } else if (completedTradesCount >= 15) {
      level = 15; title = 'Écologiste'; nextLevelXP = 2000;
    } else if (completedTradesCount >= 5) {
      level = 7; title = 'Jardinier'; nextLevelXP = 1000;
    } else if (completedTradesCount >= 1) {
      level = 3; title = 'Première Graine'; nextLevelXP = 300;
    } else if (objectsCount >= 10) {
      level = 5; title = 'Collectionneur'; nextLevelXP = 500;
    } else if (objectsCount >= 3) {
      level = 2; title = 'Organisé'; nextLevelXP = 200;
    } else if (objectsCount >= 1) {
      level = 1; title = 'Débutant'; nextLevelXP = 100;
    }

    // Calcul progression dans le niveau actuel
    const currentLevelXP = totalXP % 100;
    const progressPercentage = Math.min((currentLevelXP / nextLevelXP) * 100, 100);

    // Génération des achievements
    const achievements = [];
    
    if (objectsCount >= 1) {
      achievements.push({
        id: 'first_object',
        title: 'Premier Objet',
        description: 'Vous avez ajouté votre premier objet !',
        xpReward: 10,
        rarity: 'common'
      });
    }
    
    if (objectsCount >= 5) {
      achievements.push({
        id: 'collector',
        title: 'Collectionneur',
        description: 'Vous avez partagé 5 objets',
        xpReward: 25,
        rarity: 'uncommon'
      });
    }
    
    if (completedTradesCount >= 1) {
      achievements.push({
        id: 'first_trade',
        title: 'Premier Échange',
        description: 'Votre premier échange réussi !',
        xpReward: 50,
        rarity: 'rare'
      });
    }
    
    if (totalTradesCount >= 10) {
      achievements.push({
        id: 'active_trader',
        title: 'Troqueur Actif',
        description: 'Vous avez initié 10 échanges',
        xpReward: 100,
        rarity: 'epic'
      });
    }

    const result = {
      level,
      title,
      currentXP: totalXP,
      totalXP,
      currentLevelXP,
      nextLevelXP,
      progressPercentage: Math.round(progressPercentage),
      achievements,
      stats: {
        objectsCount,
        completedTradesCount,
        totalTradesCount,
        successRate: totalTradesCount > 0 ? Math.round((completedTradesCount / totalTradesCount) * 100) : 0
      }
    };

    console.log('✅ [GAMIFICATION] Calcul terminé:', {
      level: result.level,
      title: result.title,
      xp: result.totalXP,
      achievements: result.achievements.length
    });

    return result;
  } catch (error) {
    console.error('❌ [GAMIFICATION] Erreur calcul:', error);
    return null;
  }
}

/**
 * 🎖️ Calcule le badge principal de l'utilisateur (logique ProfileScreen)
 */
function calculateUserBadge(objectsCount, completedTradesCount) {
  // Système de badges basé sur l'activité (même logique que ProfileScreen)
  if (completedTradesCount >= 50) {
    return { icon: '🌍', name: 'Gardien Planète', color: '#4CAF50', level: 'legend' };
  }
  if (completedTradesCount >= 15) {
    return { icon: '🌳', name: 'Écologiste', color: '#8BC34A', level: 'epic' };
  }
  if (completedTradesCount >= 5) {
    return { icon: '🌿', name: 'Jardinier', color: '#689F38', level: 'rare' };
  }
  if (completedTradesCount >= 1) {
    return { icon: '🌱', name: 'Première Graine', color: '#7CB342', level: 'common' };
  }
  
  // Badges basés sur les objets si pas d'échanges
  if (objectsCount >= 10) {
    return { icon: '📦', name: 'Collectionneur', color: '#FF9800', level: 'rare' };
  }
  if (objectsCount >= 3) {
    return { icon: '📝', name: 'Organisé', color: '#FFC107', level: 'uncommon' };
  }
  if (objectsCount >= 1) {
    return { icon: '🎯', name: 'Débutant', color: '#9E9E9E', level: 'common' };
  }
  
  return { icon: '👋', name: 'Nouveau Troqueur', color: '#607D8B', level: 'beginner' };
}

/**
 * 🔄 Conversion pour compatibilité avec les écrans existants
 */
function formatForHomeScreen(calculatedData) {
  return {
    level: calculatedData.level,
    title: calculatedData.title,
    currentXP: calculatedData.currentLevelXP,
    nextLevelXP: calculatedData.nextLevelXP,
    progressPercentage: calculatedData.progressPercentage
  };
}

function formatForGamificationScreen(calculatedData) {
  return {
    player: {
      level: calculatedData.level,
      xp: calculatedData.currentLevelXP,
      xpToNext: calculatedData.nextLevelXP,
      totalXp: calculatedData.totalXP,
      rank: calculatedData.title,
      title: calculatedData.title
    },
    achievements: calculatedData.achievements || [],
    stats: {
      totalTrades: calculatedData.stats.totalTradesCount,
      successfulTrades: calculatedData.stats.completedTradesCount,
      objectsShared: calculatedData.stats.objectsCount,
      communityImpact: calculatedData.stats.completedTradesCount * 2.5
    },
    leaderboard: [],
    challenges: [],
    rewards: []
  };
}

module.exports = {
  calculateGamificationFromRealData,
  calculateUserBadge,
  formatForHomeScreen,
  formatForGamificationScreen
};
