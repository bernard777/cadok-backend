/**
 * ⚙️ ROUTES ADMIN - PARAMÈTRES SYSTÈME
 * API pour la configuration et paramètres avancés - VERSION PERSISTANTE
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');

// Modèles
const User = require('../../models/User');
const Settings = require('../../models/Settings');

/**
 * GET /api/admin/settings
 * Récupérer tous les paramètres système (VERSION PERSISTANTE)
 */
router.get('/', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('⚙️ [SETTINGS] Récupération des paramètres système depuis la BDD...');
    
    // Récupérer les paramètres depuis la base de données
    const settings = await Settings.getInstance();
    
    // Ajouter quelques statistiques dynamiques
    const [totalUsers, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' })
    ]);
    
    const settingsData = settings.toObject();
    settingsData.statistics = {
      totalUsers,
      activeUsers,
      lastUpdated: settings.updatedAt,
      serverUptime: process.uptime(),
      version: settings.version
    };

    res.json({
      success: true,
      data: {
        settings: settingsData,
        categories: {
          maintenance: 'Mode Maintenance',
          moderation: 'Paramètres de Modération',
          features: 'Fonctionnalités Principales',
          registration: 'Paramètres d\'Inscription',
          trading: 'Configuration Trading',
          security: 'Sécurité',
          notifications: 'Notifications',
          content: 'Modération Contenu',
          system: 'Système'
        }
      },
      lastUpdated: settings.updatedAt
    });
    
  } catch (error) {
    console.error('❌ [SETTINGS] Erreur récupération paramètres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des paramètres'
    });
  }
});

/**
 * PUT /api/admin/settings/:category
 * Mettre à jour une catégorie de paramètres (VERSION PERSISTANTE)
 */
router.put('/:category', requireAuth, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const { category } = req.params;
    const newSettings = req.body;
    
    console.log(`⚙️ [SETTINGS] Mise à jour catégorie ${category}:`, newSettings);
    
    // Valider la catégorie
    const validCategories = [
      'maintenance', 'moderation', 'features', 'registration', 
      'trading', 'security', 'notifications', 'content', 'system'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Catégorie de paramètres invalide',
        validCategories
      });
    }
    
    // Préparer les données utilisateur pour l'historique
    const updatedBy = {
      userId: req.user._id,
      pseudo: req.user.pseudo,
      email: req.user.email
    };
    
    // Sauvegarder en base de données
    const settings = await Settings.updateCategory(category, newSettings, updatedBy);
    
    res.json({
      success: true,
      message: `Paramètres ${category} mis à jour avec succès`,
      data: {
        category,
        settings: settings[category],
        updatedBy,
        updatedAt: settings.updatedAt,
        version: settings.version
      }
    });
    
  } catch (error) {
    console.error('❌ [SETTINGS] Erreur mise à jour paramètres:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des paramètres: ' + error.message
    });
  }
});

/**
 * POST /api/admin/settings/maintenance/toggle
 * Activer/Désactiver le mode maintenance rapidement (VERSION PERSISTANTE)
 */
router.post('/maintenance/toggle', requireAuth, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const { enabled, message, scheduledEnd } = req.body;
    
    console.log(`⚙️ [MAINTENANCE] ${enabled ? 'Activation' : 'Désactivation'} du mode maintenance par ${req.user.pseudo}`);
    
    // Préparer les données utilisateur
    const updatedBy = {
      userId: req.user._id,
      pseudo: req.user.pseudo,
      email: req.user.email
    };
    
    // Sauvegarder en base de données
    const settings = await Settings.toggleMaintenance(enabled, message, updatedBy);
    
    res.json({
      success: true,
      message: `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`,
      data: {
        maintenance: settings.maintenance,
        updatedAt: settings.updatedAt,
        version: settings.version
      }
    });
    
  } catch (error) {
    console.error('❌ [MAINTENANCE] Erreur toggle maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du changement de mode maintenance: ' + error.message
    });
  }
});

/**
 * GET /api/admin/settings/stats
 * Statistiques des paramètres système
 */
router.get('/stats', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📊 [SETTINGS] Récupération statistiques paramètres...');
    
    // Calculer quelques métriques
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      inactiveUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      }),
      User.countDocuments({ status: 'inactive' })
    ]);
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          inactive: inactiveUsers,
          activationRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        },
        lastCalculated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [SETTINGS] Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques'
    });
  }
});

/**
 * GET /api/admin/settings/history
 * Historique des modifications des paramètres
 */
router.get('/history', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    const { limit = 50, category } = req.query;
    
    console.log('📜 [SETTINGS] Récupération historique des modifications...');
    
    const settings = await Settings.getInstance();
    let history = settings.history || [];
    
    // Filtrer par catégorie si spécifiée
    if (category) {
      history = history.filter(entry => entry.category === category);
    }
    
    // Trier par date décroissante et limiter
    history = history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        history,
        total: history.length,
        settings: {
          version: settings.version,
          lastUpdated: settings.updatedAt,
          lastUpdatedBy: settings.lastUpdatedBy
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [SETTINGS] Erreur historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = router;
