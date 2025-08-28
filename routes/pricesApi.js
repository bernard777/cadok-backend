/**
 * 🔌 INTÉGRATION API BACKEND - PRIX RÉELS
 * Endpoint pour récupérer les prix de marché avec scraping
 */

const express = require('express');
const PriceService = require('../services/priceService');

const router = express.Router();
const priceService = new PriceService();

/**
 * 💰 GET /api/prices/market - Prix de marché pour un objet
 */
router.get('/market', async (req, res) => {
    try {
        const { 
            title, 
            category, 
            subcategory, 
            brand, 
            condition = 'bon', 
            age_years = 1 
        } = req.query;

        // Validation des paramètres requis
        if (!title || !category) {
            return res.status(400).json({
                error: 'Paramètres requis: title, category',
                example: '/api/prices/market?title=iPhone%2014&category=Électronique&subcategory=Smartphone&brand=Apple'
            });
        }

        // Construire l'objet pour le service
        const objectData = {
            title,
            category,
            subcategory: subcategory || title,
            brand,
            condition,
            age_years: parseInt(age_years) || 1
        };

        console.log(`🔍 Demande prix pour: ${title} (${brand || 'Sans marque'})`);

        // Récupérer le prix via notre système complet
        const startTime = Date.now();
        const priceResult = await priceService.getMarketPrice(objectData);
        const responseTime = Date.now() - startTime;

        if (priceResult) {
            // Succès - prix trouvé
            res.json({
                success: true,
                object: {
                    title,
                    category,
                    subcategory,
                    brand
                },
                price: {
                    estimated: priceResult.averagePrice,
                    currency: 'EUR',
                    range: {
                        min: priceResult.priceRange.min,
                        max: priceResult.priceRange.max
                    }
                },
                metadata: {
                    source: priceResult.source,
                    confidence: priceResult.confidence,
                    sampleSize: priceResult.sampleSize,
                    lastUpdated: priceResult.lastUpdated,
                    responseTime: `${responseTime}ms`
                },
                ecological: {
                    recommendation: priceResult.averagePrice > 100 
                        ? "💚 Excellent choix écologique ! Préférer l'occasion permet d'éviter une production neuve."
                        : "💚 Bonne économie circulaire ! Chaque achat d'occasion compte pour la planète."
                }
            });

            console.log(`✅ Prix trouvé: ${priceResult.averagePrice}€ via ${priceResult.source} (${responseTime}ms)`);
        } else {
            // Aucun prix trouvé
            res.status(404).json({
                success: false,
                error: 'Aucun prix trouvé pour cet objet',
                object: objectData,
                suggestions: [
                    'Vérifiez l\'orthographe du titre',
                    'Essayez une catégorie plus générale',
                    'Ajoutez ou retirez la marque'
                ]
            });

            console.log(`❌ Aucun prix trouvé pour: ${title}`);
        }

    } catch (error) {
        console.error('❌ Erreur API prix:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération du prix',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 📊 GET /api/prices/bulk - Prix pour plusieurs objets
 */
router.post('/bulk', async (req, res) => {
    try {
        const { objects } = req.body;

        if (!Array.isArray(objects) || objects.length === 0) {
            return res.status(400).json({
                error: 'Paramètre requis: objects (array)',
                example: {
                    objects: [
                        { title: 'iPhone 14', category: 'Électronique', brand: 'Apple' },
                        { title: 'Jean Levi\'s', category: 'Vêtements', brand: 'Levi\'s' }
                    ]
                }
            });
        }

        if (objects.length > 10) {
            return res.status(400).json({
                error: 'Maximum 10 objets par requête bulk'
            });
        }

        console.log(`🔍 Demande prix bulk pour ${objects.length} objets`);

        const results = [];
        const startTime = Date.now();

        // Traiter chaque objet (en séquentiel pour éviter la surcharge)
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            
            try {
                const priceResult = await priceService.getMarketPrice(obj);
                
                results.push({
                    index: i,
                    object: obj,
                    success: true,
                    price: priceResult ? {
                        estimated: priceResult.averagePrice,
                        range: priceResult.priceRange,
                        source: priceResult.source
                    } : null
                });

            } catch (error) {
                results.push({
                    index: i,
                    object: obj,
                    success: false,
                    error: error.message
                });
            }

            // Pause entre objets pour éviter surcharge
            if (i < objects.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const totalTime = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            summary: {
                total: objects.length,
                successful: successCount,
                failed: objects.length - successCount,
                averageTime: Math.round(totalTime / objects.length)
            },
            results,
            metadata: {
                totalTime: `${totalTime}ms`,
                processedAt: new Date()
            }
        });

        console.log(`✅ Bulk traité: ${successCount}/${objects.length} succès (${totalTime}ms)`);

    } catch (error) {
        console.error('❌ Erreur API bulk:', error);
        
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors du traitement bulk',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 📈 GET /api/prices/stats - Statistiques du système de prix
 */
router.get('/stats', async (req, res) => {
    try {
        const cacheStats = priceService.getCacheStats();
        
        res.json({
            system: {
                status: 'operational',
                version: '2.0.0',
                features: [
                    'Scraping LeBonCoin (priorité 1)',
                    'Service alternatif algorithmique',
                    'Données gouvernementales françaises',
                    'APIs externes (eBay, etc.)',
                    'Fallback garanti',
                    'Cache optimisé',
                    'Monitoring intégré'
                ]
            },
            cache: cacheStats,
            sources: {
                primary: 'LeBonCoin Scraping',
                secondary: 'Alternative Service',
                tertiary: 'French Gov Data',
                fallback: 'Generic Database'
            },
            performance: {
                expectedResponseTime: '3-8 seconds',
                cacheAcceleration: 'instant',
                availability: '99.9%'
            }
        });

    } catch (error) {
        res.status(500).json({
            error: 'Erreur récupération statistiques'
        });
    }
});

/**
 * 🧹 POST /api/prices/cache/clear - Vider le cache
 */
router.post('/cache/clear', async (req, res) => {
    try {
        priceService.clearCache();
        
        res.json({
            success: true,
            message: 'Cache vidé avec succès',
            clearedAt: new Date()
        });

        console.log('🧹 Cache prix vidé');

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur lors du vidage du cache'
        });
    }
});

module.exports = router;
