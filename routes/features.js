/**
 * 🚀 ROUTES FEATURES - Gestion des fonctionnalités utilisateur
 * Gestion des préférences et activation/désactivation des features premium
 */

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');

// Configuration des fonctionnalités disponibles
const availableFeatures = [
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    title: 'Analytics Dashboard',
    description: 'Graphiques détaillés de votre activité',
    category: 'data',
    enabled: false,
    icon: 'analytics',
    color: '#2196F3',
    premium: true,
    usage: 89,
    features: ['Graphiques temps réel', 'Analyses prédictives', 'Export de données'],
    screen: 'Analytics'
  },
  {
    id: 'notifications', 
    name: 'Smart Notifications',
    title: 'Smart Notifications',
    description: 'Alertes intelligentes contextuelles',
    category: 'notifications',
    enabled: false,
    icon: 'notifications',
    color: '#FF9800',
    premium: false,
    usage: 76,
    features: ['Notifications push', 'Alertes personnalisées', 'Résumés hebdo'],
    screen: 'SmartNotifications'
  },
  {
    id: 'eco',
    name: 'Impact Écologique',
    title: 'Impact Écologique',
    description: 'Calcul de votre empreinte carbone',
    category: 'ecology',
    enabled: false,
    icon: 'leaf', 
    color: '#4CAF50',
    premium: true,
    usage: 67,
    features: ['Calcul CO₂ économisé', 'Conseils éco', 'Défis environnementaux'],
    screen: 'EcoImpact'
  },
  {
    id: 'gaming',
    name: 'Gamification',
    title: 'Gamification',
    description: 'Système de points XP et défis',
    category: 'gamification',
    enabled: false,
    icon: 'game-controller',
    color: '#9C27B0', 
    premium: false,
    usage: 82,
    features: ['Système XP', 'Succès débloquables', 'Classements'],
    screen: 'Gamification'
  }
];

/**
 * 📱 GET /api/features/advanced - Récupérer les fonctionnalités avancées disponibles
 */
router.get('/advanced', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Récupérer les préférences utilisateur
    const userPreferences = user.featurePreferences || {};

    // Mapper les fonctionnalités avec l'état utilisateur
    const featuresWithState = availableFeatures.map(feature => ({
      ...feature,
      enabled: userPreferences[feature.id] || false,
      lastUsed: new Date().toISOString()
    }));

    // Structure de données compatible avec AdvancedFeaturesScreen
    const responseData = {
      features: featuresWithState,
      stats: {
        totalFeatures: availableFeatures.length,
        activeFeatures: featuresWithState.filter(f => f.enabled).length,
        averageUsage: 78.5
      },
      preferences: userPreferences,
      recommendations: [],
      lastUpdated: new Date().toLocaleString('fr-FR')
    };

    console.log(`📱 Fonctionnalités avancées récupérées pour l'utilisateur ${user.username}`);

    res.json({
      success: true,
      data: responseData,
      message: 'Fonctionnalités avancées récupérées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur récupération fonctionnalités avancées:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des fonctionnalités',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 🔄 PATCH /api/features/:featureId/toggle - Activer/désactiver une fonctionnalité
 */
router.patch('/:featureId/toggle', auth, async (req, res) => {
  try {
    const { featureId } = req.params;
    
    // Vérifier que le featureId est valide  
    const validFeatures = ['analytics', 'notifications', 'eco', 'gaming'];
    if (!validFeatures.includes(featureId)) {
      return res.status(400).json({
        success: false,
        message: `Fonctionnalité invalide. Fonctionnalités disponibles: ${validFeatures.join(', ')}`
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Initialiser featurePreferences si n'existe pas
    if (!user.featurePreferences) {
      user.featurePreferences = {
        analytics: true,
        notifications: true,
        eco: true,
        gaming: true
      };
    }

    // Toggle la fonctionnalité
    const currentState = user.featurePreferences[featureId];
    const newState = !currentState;
    
    user.featurePreferences[featureId] = newState;
    user.markModified('featurePreferences');
    
    await user.save();

    console.log(`✅ Feature ${featureId} ${newState ? 'activée' : 'désactivée'} pour l'utilisateur ${user.username}`);

    res.json({
      success: true,
      featureId,
      enabled: newState,
      preferences: user.featurePreferences,
      message: `Fonctionnalité ${featureId} ${newState ? 'activée' : 'désactivée'} avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur toggle feature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de fonctionnalité',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📊 GET /api/features/preferences - Récupérer préférences features utilisateur
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Préférences par défaut si pas encore définies
    const defaultPreferences = {
      analytics: true,
      notifications: true,
      eco: true,
      gaming: true
    };

    const preferences = user.featurePreferences || defaultPreferences;

    res.json({
      success: true,
      preferences,
      message: 'Préférences récupérées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur récupération préférences features:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des préférences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📝 PUT /api/features/preferences - Mettre à jour toutes les préférences features
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    const { analytics, notifications, eco, gaming } = req.body;

    // Valider les données
    const validFeatures = { analytics, notifications, eco, gaming };
    for (const [key, value] of Object.entries(validFeatures)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: `La valeur pour ${key} doit être un boolean`
        });
      }
    }

    // Mettre à jour les préférences
    user.featurePreferences = {
      ...user.featurePreferences,
      ...validFeatures
    };

    user.markModified('featurePreferences');
    await user.save();

    console.log(`✅ Préférences features mises à jour pour l'utilisateur ${user.username}`);

    res.json({
      success: true,
      preferences: user.featurePreferences,
      message: 'Préférences mises à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour préférences features:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour des préférences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📊 GET /api/features/stats - Statistiques d'utilisation des features
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    const preferences = user.featurePreferences || {
      analytics: true,
      notifications: true,
      eco: true,
      gaming: true
    };

    // Calculer les statistiques
    const totalFeatures = Object.keys(preferences).length;
    const activeFeatures = Object.values(preferences).filter(Boolean).length;
    const averageUsage = (activeFeatures / totalFeatures) * 100;

    res.json({
      success: true,
      stats: {
        totalFeatures,
        activeFeatures,
        averageUsage: Math.round(averageUsage * 10) / 10
      },
      preferences,
      message: 'Statistiques features récupérées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats features:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 🔄 POST /api/features/reset - Remettre à zéro les préférences features
 */
router.post('/reset', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    // Reset aux valeurs par défaut
    const defaultPreferences = {
      analytics: true,
      notifications: true,
      eco: true,
      gaming: true
    };

    user.featurePreferences = defaultPreferences;
    user.markModified('featurePreferences');
    await user.save();

    console.log(`✅ Préférences features remises à zéro pour l'utilisateur ${user.username}`);

    res.json({
      success: true,
      preferences: user.featurePreferences,
      message: 'Préférences remises à zéro avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur reset préférences features:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la remise à zéro',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
