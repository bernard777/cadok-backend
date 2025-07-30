const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Trade = require('../models/Trade');
const Object = require('../models/Object');

// GET /api/stats - Récupérer les statistiques de l'application
router.get('/', async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques...');

    // Compter les membres actifs (utilisateurs ayant au moins un objet)
    const activeUsersCount = await User.countDocuments({
      _id: { $in: await Object.distinct('owner') }
    });

    // Compter les échanges réalisés (status: 'accepted')
    const completedTradesCount = await Trade.countDocuments({ 
      status: 'accepted' 
    });

    // Compter les objets disponibles
    const availableObjectsCount = await Object.countDocuments({ 
      status: 'available' 
    });

    // Compter le total d'objets
    const totalObjectsCount = await Object.countDocuments();

    // Compter le total d'utilisateurs
    const totalUsersCount = await User.countDocuments();

    const stats = {
      activeUsers: activeUsersCount,
      completedTrades: completedTradesCount,
      availableObjects: availableObjectsCount,
      totalObjects: totalObjectsCount,
      totalUsers: totalUsersCount
    };

    console.log('📊 Statistiques calculées:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    res.status(500).json({ 
      message: 'Erreur lors du calcul des statistiques', 
      error: error.message 
    });
  }
});

module.exports = router;
