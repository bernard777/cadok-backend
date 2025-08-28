/**
 * Service d'intégration avec l'API Backmarket
 * 
 * IMPORTANT: Cette API est destinée aux VENDEURS sur Backmarket, pas aux consommateurs.
 * Pour accéder aux données, il faut :
 * 1. Être un marchand validé sur Backmarket
 * 2. Avoir un token d'authentification
 * 3. Respecter les limites de taux (200 req/10s)
 * 
 * Documentation complète : https://api.backmarket.dev/
 */

const axios = require('axios');

class BackmarketApiService {
  constructor() {
    // Serveurs API par région
    this.servers = {
      EU: 'https://www.backmarket.fr',      // Europe (France, Allemagne, etc.)
      US: 'https://www.backmarket.com',     // États-Unis
      AP: 'https://www.backmarket.co.jp'    // Asie-Pacifique (Japon, Australie)
    };
    
    this.defaultRegion = 'EU';
    this.baseURL = this.servers[this.defaultRegion];
    
    // Configuration des headers requis
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'fr-fr', // Marché français par défaut
      'User-Agent': 'BM-CADOK-EcoApp;contact@cadok.fr' // Format requis par Backmarket
    };
    
    // Note: Le token d'authentification devrait être configuré
    // this.authToken = process.env.BACKMARKET_API_TOKEN;
  }

  /**
   * Configure l'authentification pour les appels API
   * @param {string} token - Token d'authentification Backmarket
   */
  setAuthToken(token) {
    this.authToken = token;
    this.defaultHeaders['Authorization'] = `Basic ${token}`;
  }

  /**
   * Change la région pour utiliser le bon serveur
   * @param {string} region - 'EU', 'US', ou 'AP'
   * @param {string} locale - Code locale (ex: 'fr-fr', 'en-us', 'ja-jp')
   */
  setRegion(region, locale = 'fr-fr') {
    if (this.servers[region]) {
      this.baseURL = this.servers[region];
      this.defaultHeaders['Accept-Language'] = locale;
    }
  }

  /**
   * Récupère l'arbre des catégories Backmarket
   * Permet de comprendre la taxonomie des produits
   */
  async getCategoryTree() {
    try {
      const response = await axios.get(`${this.baseURL}/ws/category/tree`, {
        headers: this.defaultHeaders
      });
      
      return {
        success: true,
        data: response.data,
        source: 'backmarket_api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur récupération arbre catégories Backmarket:', error.message);
      return {
        success: false,
        error: this._handleError(error),
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Récupère une catégorie spécifique et ses attributs
   * @param {number} categoryId - ID de la catégorie
   */
  async getCategoryBranch(categoryId) {
    try {
      const response = await axios.get(`${this.baseURL}/ws/category/tree/${categoryId}`, {
        headers: this.defaultHeaders
      });
      
      return {
        success: true,
        data: response.data,
        source: 'backmarket_api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erreur récupération catégorie ${categoryId}:`, error.message);
      return {
        success: false,
        error: this._handleError(error),
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Récupère les listings d'un marchand (nécessite authentification)
   * @param {Object} filters - Filtres optionnels
   */
  async getListings(filters = {}) {
    if (!this.authToken) {
      return {
        success: false,
        error: 'Token d\'authentification requis pour accéder aux listings',
        source: 'backmarket_api'
      };
    }

    try {
      const params = new URLSearchParams();
      
      // Filtres disponibles
      if (filters.publicationState) params.append('publication_state', filters.publicationState);
      if (filters.minQuantity) params.append('min_quantity', filters.minQuantity);
      if (filters.maxQuantity) params.append('max_quantity', filters.maxQuantity);
      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('page_size', filters.pageSize);

      const response = await axios.get(`${this.baseURL}/ws/listings?${params}`, {
        headers: this.defaultHeaders
      });
      
      return {
        success: true,
        data: response.data,
        source: 'backmarket_api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur récupération listings:', error.message);
      return {
        success: false,
        error: this._handleError(error),
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Récupère un listing spécifique par son ID
   * @param {string} listingId - ID du listing (UUID préféré)
   */
  async getListingById(listingId) {
    if (!this.authToken) {
      return {
        success: false,
        error: 'Token d\'authentification requis pour accéder aux détails de listing',
        source: 'backmarket_api'
      };
    }

    try {
      const response = await axios.get(`${this.baseURL}/ws/listings/${listingId}`, {
        headers: this.defaultHeaders
      });
      
      return {
        success: true,
        data: response.data,
        source: 'backmarket_api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erreur récupération listing ${listingId}:`, error.message);
      return {
        success: false,
        error: this._handleError(error),
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Recherche un listing par SKU ou autres critères
   * @param {Object} criteria - Critères de recherche
   */
  async getListingDetails(criteria) {
    if (!this.authToken) {
      return {
        success: false,
        error: 'Token d\'authentification requis',
        source: 'backmarket_api'
      };
    }

    try {
      const params = new URLSearchParams();
      
      if (criteria.sku) params.append('sku', criteria.sku);
      if (criteria.listingId) params.append('listing_id', criteria.listingId);
      if (criteria.id) params.append('id', criteria.id);

      const response = await axios.get(`${this.baseURL}/ws/listings/detail?${params}`, {
        headers: this.defaultHeaders
      });
      
      return {
        success: true,
        data: response.data,
        source: 'backmarket_api',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur recherche listing:', error.message);
      return {
        success: false,
        error: this._handleError(error),
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Simule une recherche de prix pour des produits similaires
   * Attention: nécessite un accès authentifié à l'API
   * @param {string} query - Terme de recherche (marque, modèle, etc.)
   * @param {string} category - Catégorie de produit
   */
  async searchProductPrices(query, category = null) {
    try {
      // Cette méthode nécessiterait un accès complet à l'API marchands
      // Pour l'instant, on retourne un exemple de structure de données
      
      const simulatedData = {
        query: query,
        category: category,
        results: [
          {
            title: `${query} - État correct`,
            brand: this._extractBrand(query),
            price: '250.00',
            currency: 'EUR',
            condition: 'Correct',
            warranty: 12,
            seller_rating: 4.2,
            availability: true,
            ean: null,
            marketplace_category_id: category
          },
          {
            title: `${query} - Comme neuf`,
            brand: this._extractBrand(query),
            price: '320.00',
            currency: 'EUR',
            condition: 'Comme neuf',
            warranty: 24,
            seller_rating: 4.7,
            availability: true,
            ean: null,
            marketplace_category_id: category
          }
        ],
        explanation: 'Données simulées - Accès API complet requis pour données réelles'
      };

      return {
        success: true,
        data: simulatedData,
        source: 'backmarket_api_simulation',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur recherche prix produits:', error.message);
      return {
        success: false,
        error: error.message,
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Teste la connectivité de l'API sans authentification
   */
  async testConnection() {
    try {
      // Test avec l'endpoint public des catégories
      const response = await axios.get(`${this.baseURL}/ws/category/tree`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.defaultHeaders['User-Agent']
        },
        timeout: 5000
      });
      
      return {
        success: true,
        data: {
          status: 'connected',
          server: this.baseURL,
          categoriesCount: Array.isArray(response.data) ? response.data.length : 0,
          message: 'Connexion API Backmarket réussie'
        },
        source: 'backmarket_api'
      };
    } catch (error) {
      return {
        success: false,
        error: this._handleError(error),
        data: {
          status: 'failed',
          server: this.baseURL,
          message: 'Échec connexion API Backmarket'
        },
        source: 'backmarket_api'
      };
    }
  }

  /**
   * Extrait la marque d'une requête de produit
   * @private
   */
  _extractBrand(query) {
    const brands = ['Apple', 'Samsung', 'Levi\'s', 'Sony', 'Nike', 'Adidas', 'Dell', 'HP', 'Lenovo'];
    const queryUpper = query.toUpperCase();
    
    for (const brand of brands) {
      if (queryUpper.includes(brand.toUpperCase())) {
        return brand;
      }
    }
    
    return 'Marque générique';
  }

  /**
   * Gère les erreurs API avec des messages explicites
   * @private
   */
  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return 'Non authentifié - Token API invalide ou manquant';
        case 403:
          return 'Accès interdit - Compte marchand requis ou bloqué par WAF/Bot management';
        case 404:
          return 'Ressource non trouvée';
        case 429:
          return 'Limite de taux atteinte - Trop de requêtes (max 200/10s)';
        case 500:
          return 'Erreur serveur Backmarket';
        default:
          return `Erreur HTTP ${status}: ${data?.message || error.message}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      return 'Impossible de se connecter à l\'API Backmarket';
    } else {
      return error.message || 'Erreur inconnue';
    }
  }

  /**
   * Obtient des informations sur les limites d'utilisation de l'API
   */
  getApiLimitations() {
    return {
      authentication: 'Token API requis pour accès complet',
      rateLimit: '200 requêtes par 10 secondes (standard), 20 req/10s pour certains endpoints',
      access: 'Compte marchand Backmarket validé requis',
      regions: Object.keys(this.servers),
      dataTypes: [
        'Catégories (public)',
        'Listings (authentifié)',
        'Produits (authentifié)',
        'Commandes (authentifié)',
        'BuyBack (authentifié)'
      ],
      documentation: 'https://api.backmarket.dev/'
    };
  }
}

module.exports = BackmarketApiService;
