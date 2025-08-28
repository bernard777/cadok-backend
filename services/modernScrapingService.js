const axios = require('axios');
const cheerio = require('cheerio');
const { chromium } = require('playwright');

class ModernScrapingService {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        ];
        
        this.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async scrapeWithAxios(url, selector) {
        try {
            console.log(`🔍 Scraping avec Axios: ${url}`);
            
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
            const priceElements = $(selector);
            
            const prices = [];
            priceElements.each((i, element) => {
                const text = $(element).text().trim();
                const price = this.extractPrice(text);
                if (price) prices.push(price);
            });

            return {
                success: true,
                prices: prices,
                method: 'axios'
            };

        } catch (error) {
            console.log(`❌ Axios failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                method: 'axios'
            };
        }
    }

    async scrapeWithPlaywright(url, selector) {
        let browser;
        try {
            console.log(`🎭 Scraping avec Playwright: ${url}`);
            
            browser = await chromium.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const context = await browser.newContext({
                userAgent: this.getRandomUserAgent(),
                viewport: { width: 1920, height: 1080 },
                locale: 'fr-FR'
            });
            
            const page = await context.newPage();
            
            // Bloquer les images et CSS pour être plus rapide
            await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2}', route => route.abort());
            
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            // Attendre un peu pour que le contenu se charge
            await this.delay(2000);
            
            // Essayer de scroll un peu pour déclencher le lazy loading
            await page.evaluate(() => window.scrollTo(0, 500));
            await this.delay(1000);
            
            const priceElements = await page.$$(selector);
            const prices = [];
            
            for (const element of priceElements) {
                const text = await element.textContent();
                const price = this.extractPrice(text);
                if (price) prices.push(price);
            }

            return {
                success: true,
                prices: prices,
                method: 'playwright'
            };

        } catch (error) {
            console.log(`❌ Playwright failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                method: 'playwright'
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    extractPrice(text) {
        if (!text) return null;
        
        // Patterns pour extraire les prix en euros
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
                    // Prix avec centimes
                    price = parseFloat(match[1].replace(/\s/g, '') + '.' + match[2]);
                } else {
                    // Prix sans centimes
                    price = parseFloat(match[1].replace(/\s/g, ''));
                }
                
                if (price > 0 && price < 50000) { // Prix raisonnable
                    return price;
                }
            }
        }
        
        return null;
    }

    async testMultipleSites(productName) {
        const sites = [
            {
                name: 'LeBonCoin',
                url: `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(productName)}`,
                selectors: [
                    '[data-test-id="price"]',
                    '.styles_price__2CddC',
                    '.price',
                    '[class*="price"]'
                ]
            },
            {
                name: 'eBay France',
                url: `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(productName)}`,
                selectors: [
                    '.s-item__price',
                    '.adv-price',
                    '.price',
                    '[class*="price"]'
                ]
            },
            {
                name: 'Vinted',
                url: `https://www.vinted.fr/vetements?search_text=${encodeURIComponent(productName)}`,
                selectors: [
                    '[data-testid="item-price"]',
                    '.ItemBox_price__1Bnl2',
                    '.price',
                    '[class*="price"]'
                ]
            },
            {
                name: 'Facebook Marketplace',
                url: `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(productName)}`,
                selectors: [
                    '[data-testid="marketplace-item-price"]',
                    '.price',
                    '[class*="price"]'
                ]
            }
        ];

        const results = [];

        for (const site of sites) {
            console.log(`\n🔍 Test du site: ${site.name}`);
            
            for (const selector of site.selectors) {
                console.log(`   Sélecteur: ${selector}`);
                
                // Test avec Axios d'abord (plus rapide)
                const axiosResult = await this.scrapeWithAxios(site.url, selector);
                if (axiosResult.success && axiosResult.prices.length > 0) {
                    results.push({
                        site: site.name,
                        method: 'axios',
                        selector: selector,
                        prices: axiosResult.prices.slice(0, 5), // Premiers 5 prix
                        success: true
                    });
                    break; // Selector trouvé, passer au site suivant
                }
                
                await this.delay(1000);
                
                // Si Axios échoue, essayer Playwright
                const playwrightResult = await this.scrapeWithPlaywright(site.url, selector);
                if (playwrightResult.success && playwrightResult.prices.length > 0) {
                    results.push({
                        site: site.name,
                        method: 'playwright',
                        selector: selector,
                        prices: playwrightResult.prices.slice(0, 5),
                        success: true
                    });
                    break;
                }
                
                await this.delay(2000); // Plus de délai entre les tentatives
            }
            
            // Délai entre les sites
            await this.delay(3000);
        }

        return results;
    }

    async getProductPrices(productName) {
        console.log(`\n🎯 Recherche de prix pour: "${productName}"`);
        
        const results = await this.testMultipleSites(productName);
        
        if (results.length === 0) {
            console.log('❌ Aucun prix trouvé sur les sites testés');
            return null;
        }

        // Calculer statistiques
        const allPrices = results.flatMap(r => r.prices);
        const avgPrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);

        return {
            product: productName,
            sitesFound: results.length,
            totalPrices: allPrices.length,
            results: results,
            statistics: {
                average: Math.round(avgPrice * 100) / 100,
                min: minPrice,
                max: maxPrice,
                median: this.calculateMedian(allPrices)
            }
        };
    }

    calculateMedian(prices) {
        const sorted = [...prices].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
    }
}

module.exports = ModernScrapingService;
