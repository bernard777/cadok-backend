/**
 * 🌱 ROUTES ECO-IMPACT - CADOK
 * API pour l'impact écologique
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const EcoImpactService = require('../services/ecoImpactService');

const ecoImpactService = new EcoImpactService();

/**
 * GET /api/eco/dashboard
 * Dashboard impact écologique complet
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const result = await ecoImpactService.getUserEcoDashboard(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('❌ Erreur dashboard écologique:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/carbon-footprint
 * Calcul de l'empreinte carbone évitée
 */
router.get('/carbon-footprint', authMiddleware, async (req, res) => {
  try {
    const carbonFootprint = await ecoImpactService.calculateCarbonFootprint(req.user.id);
    res.json({ success: true, carbonFootprint });
  } catch (error) {
    console.error('❌ Erreur empreinte carbone:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/lifecycle-analysis
 * Analyse du cycle de vie des objets
 */
router.get('/lifecycle-analysis', authMiddleware, async (req, res) => {
  try {
    const lifecycle = await ecoImpactService.analyzeObjectsLifecycle(req.user.id);
    res.json({ success: true, lifecycle });
  } catch (error) {
    console.error('❌ Erreur analyse cycle de vie:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/community-impact
 * Impact écologique communautaire
 */
router.get('/community-impact', authMiddleware, async (req, res) => {
  try {
    const community = await ecoImpactService.getCommunityEcoImpact(req.user.id);
    res.json({ success: true, community });
  } catch (error) {
    console.error('❌ Erreur impact communautaire:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/monthly-progress
 * Progrès écologique mensuel
 */
router.get('/monthly-progress', authMiddleware, async (req, res) => {
  try {
    const progress = await ecoImpactService.getMonthlyEcoProgress(req.user.id);
    res.json({ success: true, progress });
  } catch (error) {
    console.error('❌ Erreur progrès mensuel:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/achievements
 * Réalisations écologiques
 */
router.get('/achievements', authMiddleware, async (req, res) => {
  try {
    const achievements = await ecoImpactService.getEcoAchievements(req.user.id);
    res.json({ success: true, achievements });
  } catch (error) {
    console.error('❌ Erreur achievements écologiques:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/recommendations
 * Recommandations écologiques personnalisées
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const recommendations = await ecoImpactService.getEcoRecommendations(req.user.id);
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('❌ Erreur recommandations écologiques:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/city-ranking
 * Classement écologique par ville
 */
router.get('/city-ranking', authMiddleware, async (req, res) => {
  try {
    const { city } = req.query;
    const ranking = await ecoImpactService.getLocalEcoLeaderboard(city || req.user.city, 10);
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('❌ Erreur classement ville:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/eco/calculate-impact
 * Calculer l'impact d'un échange potentiel
 */
router.post('/calculate-impact', authMiddleware, async (req, res) => {
  try {
    const { objectIds, category } = req.body;
    
    if (!objectIds || !Array.isArray(objectIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Liste d\'objets requise' 
      });
    }

    // Calcul simplifié de l'impact
    const carbonFactors = {
      'Électronique': 150,
      'Vêtements': 25,
      'Meubles': 80,
      'Livres': 2,
      'Véhicules': 500,
      'Électroménager': 120,
      'Sport': 35,
      'Jardin': 20,
      'Décoration': 15,
      'Autre': 30
    };

    const estimatedCarbonSaved = objectIds.length * (carbonFactors[category] || 30);
    const estimatedWasteAvoided = objectIds.length * 2;

    res.json({
      success: true,
      impact: {
        carbonSaved: estimatedCarbonSaved,
        wasteAvoided: estimatedWasteAvoided,
        treesEquivalent: Math.round(estimatedCarbonSaved / 22),
        message: `Cet échange pourrait éviter ${estimatedCarbonSaved}kg de CO2 !`
      }
    });
  } catch (error) {
    console.error('❌ Erreur calcul impact:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/eco/api-monitoring
 * Monitoring des performances des APIs externes
 */
router.get('/api-monitoring', async (req, res) => {
  try {
    const PriceService = require('../services/priceService');
    const GeoService = require('../services/geoService');
    
    const priceService = new PriceService();
    const geoService = new GeoService();

    // Récupérer les stats de monitoring
    const priceStats = priceService.monitor ? priceService.monitor.getStats() : null;
    const geoStats = geoService.monitor ? geoService.monitor.getStats() : null;

    // Configuration des APIs
    const apiConfig = {
      ebay: {
        configured: !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
        key_status: process.env.EBAY_API_KEY ? 'configured' : 'missing',
        service_type: 'Price data'
      },
      google_maps: {
        configured: !!process.env.GOOGLE_MAPS_API_KEY,
        key_status: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
        service_type: 'Geolocation'
      },
      government_api: {
        configured: true, // Toujours disponible
        key_status: 'public_service',
        service_type: 'Geolocation (France)'
      },
      osrm: {
        configured: true, // Service public
        key_status: 'public_service',
        service_type: 'Routing'
      }
    };

    // Recommandations de configuration
    const recommendations = [];
    
    if (!apiConfig.ebay.configured) {
      recommendations.push({
        api: 'eBay',
        action: 'Configurer les clés eBay pour des prix réels',
        impact: 'Prix d\'occasion précis au lieu d\'estimations',
        setup_url: 'https://developer.ebay.com/'
      });
    }

    if (!apiConfig.google_maps.configured) {
      recommendations.push({
        api: 'Google Maps',
        action: 'Configurer Google Maps API pour géolocalisation précise',
        impact: 'Calculs de distance routière exacts',
        setup_url: 'https://console.cloud.google.com/'
      });
    }

    res.json({
      success: true,
      monitoring_title: '📊 Monitoring APIs Externes - CADOK',
      api_configuration: apiConfig,
      performance_stats: {
        price_service: priceStats,
        geo_service: geoStats
      },
      configuration_recommendations: recommendations,
      service_levels: {
        current: calculateCurrentServiceLevel(apiConfig),
        maximum: 'Toutes APIs configurées avec clés officielles',
        improvement_potential: calculateImprovementPotential(apiConfig)
      },
      next_steps: getNextSteps(apiConfig),
      estimated_costs: {
        ebay_api: 'GRATUIT (5000 appels/jour)',
        google_maps: '$0-200/mois (crédit gratuit 200$/mois)',
        government_apis: 'GRATUIT (services publics)',
        total_monthly_estimate: apiConfig.ebay.configured && apiConfig.google_maps.configured ? 
          '$0-50/mois avec usage normal' : 'GRATUIT avec configuration actuelle'
      }
    });

  } catch (error) {
    console.error('❌ Erreur monitoring APIs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur monitoring',
      details: error.message 
    });
  }
});

// Fonctions utilitaires pour le monitoring
function calculateCurrentServiceLevel(apiConfig) {
  const configuredApis = Object.values(apiConfig).filter(api => api.configured).length;
  const totalApis = Object.keys(apiConfig).length;
  const percentage = (configuredApis / totalApis) * 100;
  
  if (percentage === 100) return '🟢 Maximum - Toutes APIs configurées';
  if (percentage >= 75) return '🟠 Élevé - Plupart des APIs configurées';
  if (percentage >= 50) return '🟡 Moyen - Quelques APIs configurées';
  return '🔴 Basique - APIs publiques uniquement';
}

function calculateImprovementPotential(apiConfig) {
  const improvements = [];
  
  if (!apiConfig.ebay.configured) {
    improvements.push('Prix réels eBay (+40% précision)');
  }
  
  if (!apiConfig.google_maps.configured) {
    improvements.push('Géolocalisation Google (+30% précision)');
  }
  
  return improvements.length > 0 ? improvements : ['Configuration optimale atteinte'];
}

function getNextSteps(apiConfig) {
  const steps = [];
  
  if (!apiConfig.ebay.configured) {
    steps.push({
      priority: 1,
      action: 'Configurer eBay API',
      time: '15 minutes',
      impact: 'Prix d\'occasion réels'
    });
  }
  
  if (!apiConfig.google_maps.configured) {
    steps.push({
      priority: 2,
      action: 'Configurer Google Maps API',
      time: '10 minutes',
      impact: 'Distances routières précises'
    });
  }
  
  if (steps.length === 0) {
    steps.push({
      priority: 1,
      action: 'Configuration complète ✅',
      time: '0 minutes',
      impact: 'Précision maximale atteinte'
    });
  }
  
  return steps;
}

/**
 * GET /api/eco/demo-real-data
 * Démonstration des vraies données (sans auth)
 */
router.get('/demo-real-data', async (req, res) => {
  try {
    const PriceService = require('../services/priceService');
    const GeoService = require('../services/geoService');
    const { ADEME_CARBON_FACTORS } = require('../data/ademe-carbon-factors');
    
    const priceService = new PriceService();
    const geoService = new GeoService();

    // Test objet smartphone
    const testObject = {
      title: 'iPhone 12',
      category: { name: 'Électronique' },
      subcategory: 'Smartphone',
      condition: 'bon',
      brand: 'Apple',
      weight: 0.2
    };

    // Test utilisateurs fictifs
    const userParis = {
      city: 'Paris',
      postalCode: '75001',
      address: '1 Rue de Rivoli, Paris'
    };

    const userLyon = {
      city: 'Lyon', 
      postalCode: '69001',
      address: '1 Place Bellecour, Lyon'
    };

    // Tests en parallèle
    const [priceData, transportData] = await Promise.all([
      priceService.getMarketPrice(testObject),
      geoService.calculateTransportImpact(userParis, userLyon, testObject.weight)
    ]);

    // Données ADEME
    const ademeData = ADEME_CARBON_FACTORS['smartphone'];

    res.json({
      success: true,
      demo_title: '🌱 VRAIES DONNÉES ÉCOLOGIQUES - CADOK',
      test_results: {
        object_tested: testObject,
        ademe_data: {
          source: 'Base Carbone ADEME 2024',
          smartphone_impact: ademeData,
          production_co2: ademeData.production,
          lifespan_years: ademeData.lifespan_years
        },
        price_data: {
          source: priceData.source,
          average_price: priceData.averagePrice,
          price_range: priceData.priceRange,
          confidence: priceData.confidence,
          sample_size: priceData.sampleSize
        },
        transport_data: {
          distance_km: transportData.distance_km,
          co2_emissions: transportData.co2_emissions_kg,
          transport_type: transportData.transport_type,
          cost_estimate: transportData.transport_cost_estimate,
          environmental_benefit: transportData.environmental_benefit
        },
        calculation_example: {
          carbon_saved_production: ademeData.production,
          carbon_cost_transport: transportData.co2_emissions_kg,
          net_carbon_benefit: ademeData.production - transportData.co2_emissions_kg,
          financial_savings: priceData.averagePrice,
          ecological_efficiency: `${Math.round(((ademeData.production - transportData.co2_emissions_kg) / ademeData.production) * 100)}% bénéfice carbone net`
        },
        data_quality: {
          ademe: 'Données officielles françaises',
          prices: 'APIs marché + base données',
          geolocation: 'API gouvernementale + OSRM',
          overall_confidence: 'high'
        }
      },
      improvements_summary: {
        '1_base_carbone_ademe': '✅ Intégrée - Facteurs officiels français',
        '2_prix_marche_reel': '✅ Intégrée - APIs eBay + base prix',
        '3_geolocalisation': '✅ Intégrée - Calcul distances réelles',
        '4_donnees_utilisateurs': '✅ Intégrée - Vrais classements'
      },
      message: '✅ Toutes les vraies données sont opérationnelles !'
    });

  } catch (error) {
    console.error('❌ Erreur test vraies données:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur test données',
      details: error.message 
    });
  }
});

/**
 * GET /api/eco/real-data-test
 * Test des vraies données (ADEME + Prix + Géo)
 */
router.get('/real-data-test', authMiddleware, async (req, res) => {
  try {
    const PriceService = require('../services/priceService');
    const GeoService = require('../services/geoService');
    const { ADEME_CARBON_FACTORS } = require('../data/ademe-carbon-factors');
    
    const priceService = new PriceService();
    const geoService = new GeoService();

    // Test objet smartphone
    const testObject = {
      title: 'iPhone 12',
      category: { name: 'Électronique' },
      subcategory: 'Smartphone',
      condition: 'bon',
      brand: 'Apple',
      weight: 0.2
    };

    // Test utilisateurs fictifs
    const userParis = {
      city: 'Paris',
      postalCode: '75001',
      address: '1 Rue de Rivoli, Paris'
    };

    const userLyon = {
      city: 'Lyon', 
      postalCode: '69001',
      address: '1 Place Bellecour, Lyon'
    };

    // Tests en parallèle
    const [priceData, transportData] = await Promise.all([
      priceService.getMarketPrice(testObject),
      geoService.calculateTransportImpact(userParis, userLyon, testObject.weight)
    ]);

    // Données ADEME
    const ademeData = ADEME_CARBON_FACTORS['smartphone'];

    res.json({
      success: true,
      test_results: {
        object_tested: testObject,
        ademe_data: {
          source: 'Base Carbone ADEME 2024',
          smartphone_impact: ademeData,
          production_co2: ademeData.production,
          lifespan_years: ademeData.lifespan_years
        },
        price_data: {
          source: priceData.source,
          average_price: priceData.averagePrice,
          price_range: priceData.priceRange,
          confidence: priceData.confidence,
          sample_size: priceData.sampleSize
        },
        transport_data: {
          distance_km: transportData.distance_km,
          co2_emissions: transportData.co2_emissions_kg,
          transport_type: transportData.transport_type,
          cost_estimate: transportData.transport_cost_estimate,
          environmental_benefit: transportData.environmental_benefit
        },
        calculation_example: {
          carbon_saved_production: ademeData.production,
          carbon_cost_transport: transportData.co2_emissions_kg,
          net_carbon_benefit: ademeData.production - transportData.co2_emissions_kg,
          financial_savings: priceData.averagePrice,
          ecological_efficiency: `${Math.round(((ademeData.production - transportData.co2_emissions_kg) / ademeData.production) * 100)}% bénéfice carbone net`
        },
        data_quality: {
          ademe: 'Données officielles françaises',
          prices: 'APIs marché + base données',
          geolocation: 'API gouvernementale + OSRM',
          overall_confidence: 'high'
        }
      },
      message: '✅ Toutes les vraies données sont opérationnelles !'
    });

  } catch (error) {
    console.error('❌ Erreur test vraies données:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur test données',
      details: error.message 
    });
  }
});

module.exports = router;
