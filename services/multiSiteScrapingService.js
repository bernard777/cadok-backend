const axios = require('axios');
const cheerio = require('cheerio');

class MultiSiteScrapingService {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ];
        
        this.sites = {
            leboncoin: {
                name: 'LeBonCoin',
                baseUrl: 'https://www.leboncoin.fr/recherche?text=',
                selectors: ['[data-test-id="price"]'],
                active: true
            },
            backmarket: {
                name: 'BackMarket',
                baseUrl: 'https://www.backmarket.fr/fr-fr/search?q=',
                selectors: ['.price', '[data-testid="price"]', '.product-price'],
                active: true
            },
            rakuten: {
                name: 'Rakuten',
                baseUrl: 'https://fr.shopping.rakuten.com/s/',
                selectors: ['.price', '.product-price', '[data-price]'],
                active: true
            },
            fnac: {
                name: 'Fnac',
                baseUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=',
                selectors: ['.price', '.userPrice', '.oldPrice'],
                active: true
            }
        };
        
        this.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    extractPrice(text) {
        if (!text) return null;
        
        const patterns = [
            /(\d{1,3}(?:\s?\d{3})*)[,.](\d{2})\s*€/,  // 1 234,56 €
            /(\d{1,3}(?:\s?\d{3})*)\s*€/,              // 1234 €
            /€\s*(\d{1,3}(?:\s?\d{3})*)[,.](\d{2})/,  // € 1234,56
            /€\s*(\d{1,3}(?:\s?\d{3})*)/,              // € 1234
            /(\d+)[,.](\d{2})\s*euros?/i,              // 123,45 euro
            /(\d+)\s*euros?/i                          // 123 euro
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                let price;
                if (match[2]) {
                    price = parseFloat(match[1].replace(/\s/g, '') + '.' + match[2]);
                } else {
                    price = parseFloat(match[1].replace(/\s/g, ''));
                }
                
                if (price > 0 && price < 50000) {
                    return price;
                }
            }
        }
        
        return null;
    }

    async scrapeSingleSite(siteName, productName, maxResults = 10) {
        const site = this.sites[siteName];
        if (!site || !site.active) {
            console.log(`❌ Site ${siteName} non disponible`);
            return null;
        }

        try {
            console.log(`🔍 Scraping ${site.name} pour: ${productName}`);
            
            const url = site.baseUrl + encodeURIComponent(productName);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0',
                    'Referer': 'https://www.google.com/'
                },
                timeout: 15000,
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            const prices = [];
            
            // Essayer chaque sélecteur jusqu'à trouver des prix
            for (const selector of site.selectors) {
                const priceElements = $(selector);
                
                priceElements.each((i, element) => {
                    if (prices.length >= maxResults) return false;
                    
                    const text = $(element).text().trim();
                    const price = this.extractPrice(text);
                    if (price) {
                        prices.push(price);
                    }
                });
                
                // Si on a trouvé des prix avec ce sélecteur, arrêter
                if (prices.length > 0) {
                    console.log(`✅ ${prices.length} prix trouvés sur ${site.name} avec sélecteur: ${selector}`);
                    break;
                }
            }

            if (prices.length > 0) {
                return {
                    site: siteName,
                    siteName: site.name,
                    prices: prices,
                    success: true,
                    productName: productName,
                    statistics: this.calculateStatistics(prices)
                };
            } else {
                console.log(`❌ Aucun prix trouvé sur ${site.name}`);
                return null;
            }

        } catch (error) {
            console.log(`❌ Erreur scraping ${site.name}: ${error.message}`);
            return null;
        }
    }

    async scrapeAllSites(productName, maxResultsPerSite = 10) {
        console.log(`\n🌐 Scraping multi-sites pour: "${productName}"`);
        console.log('='.repeat(60));
        
        const results = [];
        const siteNames = Object.keys(this.sites).filter(name => this.sites[name].active);
        
        for (const siteName of siteNames) {
            try {
                const result = await this.scrapeSingleSite(siteName, productName, maxResultsPerSite);
                
                if (result && result.success) {
                    results.push(result);
                }
                
                // Délai entre les sites pour éviter la détection
                await this.delay(2000 + Math.random() * 3000);
                
            } catch (error) {
                console.log(`⚠️ Erreur site ${siteName}: ${error.message}`);
                await this.delay(1000);
            }
        }
        
        return this.consolidateResults(productName, results);
    }

    consolidateResults(productName, siteResults) {
        if (siteResults.length === 0) {
            return null;
        }
        
        console.log(`\n📊 Consolidation des résultats pour "${productName}"`);
        
        // Rassembler tous les prix
        const allPrices = [];
        const siteStats = {};
        
        siteResults.forEach(result => {
            allPrices.push(...result.prices);
            siteStats[result.siteName] = {
                count: result.prices.length,
                avg: result.statistics.average,
                min: result.statistics.min,
                max: result.statistics.max
            };
        });
        
        if (allPrices.length === 0) {
            return null;
        }
        
        // Filtrer les outliers globalement
        const filteredPrices = this.filterOutliers(allPrices);
        const finalStats = this.calculateStatistics(filteredPrices);
        
        console.log(`✅ Prix consolidés: ${filteredPrices.length} prix de ${siteResults.length} sites`);
        console.log(`   Prix médian: ${finalStats.median}€`);
        console.log(`   Fourchette: ${finalStats.min}€ - ${finalStats.max}€`);
        
        return {
            productName: productName,
            consolidatedPrice: finalStats.median,
            priceRange: {
                min: finalStats.min,
                max: finalStats.max
            },
            dataPoints: filteredPrices.length,
            sitesUsed: siteResults.length,
            siteBreakdown: siteStats,
            confidence: this.calculateMultiSiteConfidence(siteResults, finalStats),
            source: 'multi_site_scraping',
            allPrices: filteredPrices,
            statistics: finalStats
        };
    }

    calculateStatistics(prices) {
        if (prices.length === 0) return null;
        
        const sorted = [...prices].sort((a, b) => a - b);
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = sum / prices.length;
        const median = sorted.length % 2 === 0 
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        return {
            count: prices.length,
            min: Math.min(...prices),
            max: Math.max(...prices),
            average: Math.round(avg * 100) / 100,
            median: Math.round(median * 100) / 100
        };
    }

    filterOutliers(prices) {
        if (prices.length < 4) return prices;
        
        const sorted = [...prices].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const filtered = prices.filter(price => price >= lowerBound && price <= upperBound);
        
        console.log(`   Filtrage outliers: ${prices.length} → ${filtered.length} prix`);
        return filtered;
    }

    calculateMultiSiteConfidence(siteResults, stats) {
        let confidence = 0;
        
        // Bonus pour le nombre de sites
        if (siteResults.length >= 3) confidence += 0.4;
        else if (siteResults.length >= 2) confidence += 0.3;
        else confidence += 0.1;
        
        // Bonus pour le nombre total de points
        const totalPoints = siteResults.reduce((sum, r) => sum + r.prices.length, 0);
        if (totalPoints >= 15) confidence += 0.3;
        else if (totalPoints >= 8) confidence += 0.2;
        else confidence += 0.1;
        
        // Bonus pour la cohérence entre sites
        const sitePrices = siteResults.map(r => r.statistics.median);
        const siteRange = Math.max(...sitePrices) / Math.min(...sitePrices);
        if (siteRange <= 1.5) confidence += 0.3;
        else if (siteRange <= 2) confidence += 0.2;
        else confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    async getEstimatedPrice(productName) {
        const result = await this.scrapeAllSites(productName, 8);
        
        if (!result) {
            return null;
        }
        
        return {
            estimatedPrice: result.consolidatedPrice,
            priceRange: result.priceRange,
            dataPoints: result.dataPoints,
            sitesUsed: result.sitesUsed,
            confidence: result.confidence,
            source: 'multi_site_scraping',
            breakdown: result.siteBreakdown
        };
    }

    // Désactiver/activer des sites
    toggleSite(siteName, active = null) {
        if (this.sites[siteName]) {
            this.sites[siteName].active = active !== null ? active : !this.sites[siteName].active;
            console.log(`${siteName}: ${this.sites[siteName].active ? 'activé' : 'désactivé'}`);
        }
    }

    getActiveSites() {
        return Object.entries(this.sites)
            .filter(([name, site]) => site.active)
            .map(([name, site]) => ({ name, siteName: site.name }));
    }
}

module.exports = MultiSiteScrapingService;
