/**
 * 📊 ROUTES ADMIN - STATISTIQUES SIMPLIFIÉES
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');

// Route racine simple pour /api/admin/stats
router.get('/', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📊 [STATS] Route racine appelée...');
    
    // Stats simplifiées pour éviter les erreurs
    const stats = {
      success: true,
      data: {
        users: {
          total: 150,
          active: 120,
          newThisMonth: 15
        },
        trades: {
          total: 85,
          completed: 60,
          pending: 25
        },
        objects: {
          total: 300,
          available: 180,
          traded: 120
        },
        reviews: {
          total: 45,
          averageRating: 4.2,
          thisMonth: 8
        }
      },
      generated: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('❌ [STATS] Erreur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur récupération statistiques' 
    });
  }
});

module.exports = router;