const axios = require('axios');
const cheerio = require('cheerio');

class LeboncoinScrapingService {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
        ];
        
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
            /€\s*(\d{1,3}(?:\s?\d{3})*)/               // € 1234
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

    async scrapeProductPrices(productName, maxResults = 10) {
        try {
            console.log(`🔍 Scraping LeBonCoin pour: ${productName}`);
            
            const url = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(productName)}`;
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0'
                },
                timeout: 10000,
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            const priceElements = $('[data-test-id="price"]');
            
            const prices = [];
            priceElements.each((i, element) => {
                if (prices.length >= maxResults) return false;
                
                const text = $(element).text().trim();
                const price = this.extractPrice(text);
                if (price) {
                    prices.push(price);
                }
            });

            if (prices.length > 0) {
                console.log(`✅ ${prices.length} prix trouvés sur LeBonCoin`);
                return {
                    success: true,
                    prices: prices,
                    source: 'leboncoin_scraping',
                    productName: productName,
                    statistics: this.calculateStatistics(prices)
                };
            } else {
                console.log(`❌ Aucun prix trouvé pour ${productName}`);
                return null;
            }

        } catch (error) {
            console.log(`❌ Erreur scraping LeBonCoin: ${error.message}`);
            return null;
        }
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

    async getEstimatedPrice(productName) {
        const result = await this.scrapeProductPrices(productName, 15);
        
        if (!result || !result.prices || result.prices.length === 0) {
            return null;
        }
        
        // Filtrer les prix aberrants (outliers)
        const prices = this.filterOutliers(result.prices);
        
        if (prices.length === 0) {
            return null;
        }
        
        // Calculer la médiane comme prix estimé (plus robuste que la moyenne)
        const stats = this.calculateStatistics(prices);
        
        return {
            estimatedPrice: stats.median,
            confidence: this.calculateConfidence(prices.length, stats),
            priceRange: {
                min: stats.min,
                max: stats.max
            },
            dataPoints: prices.length,
            source: 'leboncoin_scraping'
        };
    }

    filterOutliers(prices) {
        if (prices.length < 3) return prices;
        
        const sorted = [...prices].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        return prices.filter(price => price >= lowerBound && price <= upperBound);
    }

    calculateConfidence(dataPoints, stats) {
        // Confiance basée sur le nombre de points de données et la variabilité
        let confidence = 0;
        
        // Bonus pour le nombre de points
        if (dataPoints >= 10) confidence += 0.4;
        else if (dataPoints >= 5) confidence += 0.3;
        else if (dataPoints >= 3) confidence += 0.2;
        else confidence += 0.1;
        
        // Bonus pour la cohérence des prix
        if (stats.max / stats.min <= 2) confidence += 0.3;
        else if (stats.max / stats.min <= 3) confidence += 0.2;
        else confidence += 0.1;
        
        // Bonus pour une distribution normale
        const avgMedianDiff = Math.abs(stats.average - stats.median) / stats.average;
        if (avgMedianDiff <= 0.1) confidence += 0.3;
        else if (avgMedianDiff <= 0.2) confidence += 0.2;
        else confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }
}

module.exports = LeboncoinScrapingService;