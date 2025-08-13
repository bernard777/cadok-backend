/**
 * 🌍 SERVICE GÉOLOCALISATION AVANCÉ CADOK
 * Gestion      for (const [city, coords] of Object.entries(majorCities)) {
      this.cityCoordinatesCache.set(city.toLowerCase(), {
        coordinates: coords,
        precision: 'approximate', // Utiliser les valeurs d'enum correctes
        lastUpdated: new Date()
      });
    }te des coordonnées GPS, distances, et recherches géospatiales
 */

const axios = require('axios');
const ObjectModel = require('../models/Object');
const User = require('../models/User');

class GeolocationService {
  constructor() {
    // Configuration des APIs de géocodage
    this.geocodingAPIs = {
      // API gratuite pour les tests (limitée)
      nominatim: {
        baseUrl: 'https://nominatim.openstreetmap.org',
        enabled: true,
        rateLimit: 1000 // ms entre requêtes
      },
      // Pour production, utiliser Google Maps API ou MapBox
      google: {
        baseUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
        enabled: !!process.env.GOOGLE_MAPS_API_KEY
      }
    };
    
    // Cache des coordonnées par ville (pour éviter trop d'appels API)
    this.cityCoordinatesCache = new Map();
    this.initializeCityCache();
  }

  /**
   * 🗺️ Initialiser le cache avec les principales villes françaises
   */
  initializeCityCache() {
    const majorCities = {
      'Paris': [2.3522, 48.8566],
      'Lyon': [4.8357, 45.7640],
      'Marseille': [5.3698, 43.2965],
      'Toulouse': [1.4442, 43.6047],
      'Nice': [7.2620, 43.7102],
      'Nantes': [-1.5536, 47.2184],
      'Montpellier': [3.8767, 43.6110],
      'Strasbourg': [7.7521, 48.5734],
      'Bordeaux': [-0.5792, 44.8378],
      'Lille': [3.0573, 50.6292],
      'Rennes': [-1.6778, 48.1173],
      'Reims': [4.0317, 49.2583],
      'Le Havre': [0.1079, 49.4944],
      'Saint-Étienne': [4.3872, 45.4397],
      'Toulon': [5.9280, 43.1242],
      'Grenoble': [5.7276, 45.1667],
      'Dijon': [5.0415, 47.3220],
      'Angers': [-0.5792, 47.4784],
      'Nîmes': [4.3601, 43.8367],
      'Villeurbanne': [4.8795, 45.7734]
    };

    for (const [city, coords] of Object.entries(majorCities)) {
      this.cityCoordinatesCache.set(city.toLowerCase(), {
        coordinates: coords,
        precision: 'city_center',
        lastUpdated: new Date()
      });
    }
  }

  /**
   * 🎯 Obtenir les coordonnées d'une adresse
   */
  async geocodeAddress(address) {
    try {
      // Nettoyer l'adresse
      const cleanAddress = this.cleanAddress(address);
      
      // Vérifier le cache d'abord
      const cached = this.cityCoordinatesCache.get(cleanAddress.toLowerCase());
      if (cached && this.isCacheValid(cached)) {
        return {
          coordinates: cached.coordinates,
          precision: cached.precision,
          source: 'cache'
        };
      }

      // Essayer l'API Nominatim (gratuite)
      if (this.geocodingAPIs.nominatim.enabled) {
        const result = await this.geocodeWithNominatim(cleanAddress);
        if (result) {
          // Mettre en cache
          this.cityCoordinatesCache.set(cleanAddress.toLowerCase(), {
            coordinates: result.coordinates,
            precision: result.precision,
            lastUpdated: new Date()
          });
          return result;
        }
      }

      // Fallback sur Google Maps si disponible
      if (this.geocodingAPIs.google.enabled) {
        return await this.geocodeWithGoogle(cleanAddress);
      }

      return null;
    } catch (error) {
      console.error('🚫 Erreur géocodage:', error);
      return null;
    }
  }

  /**
   * 🌐 Géocodage avec Nominatim (OpenStreetMap)
   */
  async geocodeWithNominatim(address) {
    try {
      await this.rateLimitDelay(this.geocodingAPIs.nominatim.rateLimit);
      
      const response = await axios.get(`${this.geocodingAPIs.nominatim.baseUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          countrycodes: 'fr', // Limiter à la France
          addressdetails: 1
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'CADOK-App/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
          precision: this.determinePrecision(result),
          source: 'nominatim',
          confidence: parseFloat(result.importance || 0.5)
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur Nominatim:', error.message);
      return null;
    }
  }

  /**
   * 🎯 Géocodage avec Google Maps (si API key disponible)
   */
  async geocodeWithGoogle(address) {
    if (!this.geocodingAPIs.google.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(this.geocodingAPIs.google.baseUrl, {
        params: {
          address: address,
          key: this.geocodingAPIs.google.apiKey,
          region: 'fr',
          language: 'fr'
        },
        timeout: 5000
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        
        return {
          coordinates: [location.lng, location.lat],
          precision: this.determinePrecisionGoogle(result.geometry.location_type),
          source: 'google',
          confidence: 0.9
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur Google Maps:', error.message);
      return null;
    }
  }

  /**
   * 🔍 Rechercher des objets à proximité avec vraie géolocalisation
   */
  async findNearbyObjects(lat, lng, options = {}) {
    const {
      maxDistance = 10000, // 10km par défaut, en mètres
      limit = 20,
      category = null,
      status = 'available',
      excludeOwner = null
    } = options;

    try {
      // Validation des coordonnées
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        throw new Error('Coordonnées invalides');
      }

      const filters = {
        status,
        'location.isPublic': true,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: maxDistance
          }
        }
      };

      if (category) {
        filters.category = category;
      }

      if (excludeOwner) {
        filters.owner = { $ne: excludeOwner };
      }

      const objects = await ObjectModel.find(filters)
        .populate('owner', 'pseudo city avatar')
        .populate('category', 'name')
        .limit(limit)
        .lean();

      // Calculer les distances exactes
      const objectsWithDistance = objects.map(obj => ({
        ...obj,
        distance: this.calculateDistance(lat, lng, obj.location.coordinates[1], obj.location.coordinates[0])
      }));

      // Trier par distance
      objectsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

      return {
        objects: objectsWithDistance,
        searchCenter: { lat, lng },
        radiusKm: maxDistance / 1000,
        totalFound: objectsWithDistance.length
      };
    } catch (error) {
      console.error('🚫 Erreur recherche proximité:', error);
      throw error;
    }
  }

  /**
   * 📏 Calculer la distance entre deux points (formule Haversine optimisée)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;

    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * 🔄 Mettre à jour la localisation d'un objet
   */
  async updateObjectLocation(objectId, locationData) {
    try {
      const object = await ObjectModel.findById(objectId);
      if (!object) {
        throw new Error('Objet non trouvé');
      }

      // Si adresse fournie, géocoder
      if (locationData.address && !locationData.coordinates) {
        const geocoded = await this.geocodeAddress(locationData.address);
        if (geocoded) {
          locationData.coordinates = geocoded.coordinates;
          locationData.precision = geocoded.precision;
        }
      }

      // Mettre à jour les données de localisation
      if (locationData.coordinates && Array.isArray(locationData.coordinates)) {
        object.location.coordinates = locationData.coordinates;
        object.location.precision = locationData.precision || 'approximate';
      }

      if (locationData.city) {
        object.location.address.city = locationData.city;
      }

      if (locationData.zipCode) {
        object.location.address.zipCode = locationData.zipCode;
      }

      if (typeof locationData.isPublic === 'boolean') {
        object.location.isPublic = locationData.isPublic;
      }

      await object.save();
      return object;
    } catch (error) {
      console.error('🚫 Erreur mise à jour localisation:', error);
      throw error;
    }
  }

  /**
   * 🛠️ Méthodes utilitaires
   */
  toRad(value) {
    return value * Math.PI / 180;
  }

  cleanAddress(address) {
    if (typeof address === 'object') {
      return `${address.street || ''} ${address.city || ''} ${address.zipCode || ''}`.trim();
    }
    return address.trim();
  }

  determinePrecision(nominatimResult) {
    const type = nominatimResult.type;
    if (['house_number', 'house'].includes(type)) return 'exact';
    if (['street', 'pedestrian'].includes(type)) return 'approximate';
    return 'city_only'; // Au lieu de 'city_center'
  }

  determinePrecisionGoogle(locationType) {
    switch (locationType) {
      case 'ROOFTOP': return 'exact';
      case 'RANGE_INTERPOLATED': return 'approximate';
      case 'GEOMETRIC_CENTER': return 'approximate';
      case 'APPROXIMATE': return 'city_only';
      default: return 'city_only';
    }
  }

  isCacheValid(cached, maxAgeHours = 24) {
    const now = new Date();
    const ageHours = (now - cached.lastUpdated) / (1000 * 60 * 60);
    return ageHours < maxAgeHours;
  }

  async rateLimitDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 Statistiques de géolocalisation
   */
  async getLocationStats() {
    try {
      const totalObjects = await ObjectModel.countDocuments();
      const objectsWithCoords = await ObjectModel.countDocuments({
        'location.coordinates': { $exists: true, $ne: null }
      });
      
      const totalUsers = await User.countDocuments();
      const usersWithCoords = await User.countDocuments({
        'address.coordinates': { $exists: true, $ne: null }
      });

      return {
        objects: {
          total: totalObjects,
          withCoordinates: objectsWithCoords,
          percentage: totalObjects > 0 ? Math.round((objectsWithCoords / totalObjects) * 100) : 0
        },
        users: {
          total: totalUsers,
          withCoordinates: usersWithCoords,
          percentage: totalUsers > 0 ? Math.round((usersWithCoords / totalUsers) * 100) : 0
        },
        cachedCities: this.cityCoordinatesCache.size
      };
    } catch (error) {
      console.error('🚫 Erreur stats géolocalisation:', error);
      return null;
    }
  }
}

module.exports = { GeolocationService };
