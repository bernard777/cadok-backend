/**
 * 🌍 SERVICE GÉOLOCALISATION - IMPACT TRANSPORT RÉEL
 * Calcul des distances et émissions de transport
 */

const axios = require('axios');

class GeoService {

  constructor() {
    this.distanceCache = new Map();
    this.geocodeCache = new Map();
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 jours
  }

  /**
   * 📍 Calculer l'impact transport entre deux utilisateurs
   */
  async calculateTransportImpact(fromUser, toUser, objectWeight = 2) {
    try {
      const distance = await this.calculateDistance(fromUser, toUser);
      const emissions = this.calculateEmissions(distance, objectWeight);
      const transportType = this.getTransportType(distance);

      return {
        distance_km: Math.round(distance),
        transport_type: transportType,
        co2_emissions_kg: Math.round(emissions * 100) / 100,
        transport_cost_estimate: this.estimateTransportCost(distance, objectWeight),
        environmental_benefit: this.getEnvironmentalBenefit(distance),
        delivery_options: this.getDeliveryOptions(distance),
        carbon_offset_needed: Math.round(emissions * 100) / 100
      };

    } catch (error) {
      console.error('❌ Erreur calcul impact transport:', error);
      return this.getFallbackTransportImpact();
    }
  }

  /**
   * 📏 Calculer la distance entre deux utilisateurs
   */
  async calculateDistance(fromUser, toUser) {
    const cacheKey = `${this.getUserLocationKey(fromUser)}_${this.getUserLocationKey(toUser)}`;
    
    // Vérifier le cache
    if (this.distanceCache.has(cacheKey)) {
      const cached = this.distanceCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.distance;
      }
    }

    try {
      // Géocoder les adresses
      const fromCoords = await this.geocodeAddress(fromUser);
      const toCoords = await this.geocodeAddress(toUser);

      // Calculer la distance routière
      const distanceResult = await this.getRoutingDistance(fromCoords, toCoords);
      const distance = typeof distanceResult === 'object' ? distanceResult.distance : distanceResult;

      // Mettre en cache
      this.distanceCache.set(cacheKey, {
        distance,
        timestamp: Date.now(),
        source: distanceResult.source || 'unknown'
      });

      return distance;

    } catch (error) {
      console.warn('⚠️ Erreur calcul distance:', error.message);
      // Fallback: distance à vol d'oiseau
      return this.calculateHaversineDistance(fromUser, toUser);
    }
  }

  /**
   * 🗺️ Géocoder une adresse utilisateur avec Google Maps ou API française
   */
  async geocodeAddress(user) {
    const address = this.buildUserAddress(user);
    const cacheKey = `geocode_${address}`;

    // Vérifier le cache
    if (this.geocodeCache.has(cacheKey)) {
      const cached = this.geocodeCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.coords;
      }
    }

    // Choisir le service selon la configuration
    const service = process.env.GEOCODING_SERVICE || 'government';
    
    try {
      let coords;
      
      if (service === 'google' && process.env.GOOGLE_MAPS_API_KEY) {
        coords = await this.geocodeWithGoogle(address);
      } else {
        coords = await this.geocodeWithGovernmentAPI(address);
      }

      // Mettre en cache
      this.geocodeCache.set(cacheKey, {
        coords,
        timestamp: Date.now()
      });

      return coords;

    } catch (error) {
      console.warn('⚠️ Géocodage échoué:', error.message);
      // Fallback: coordonnées approximatives des grandes villes
      return this.getFallbackCoordinates(user.city);
    }
  }

  /**
   * 🌍 Géocodage avec Google Maps API (précision maximale)
   */
  async geocodeWithGoogle(address) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
          region: 'fr',
          language: 'fr'
        },
        timeout: 5000
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        throw new Error(`Google Geocoding error: ${response.data.status}`);
      }

      const location = response.data.results[0].geometry.location;
      
      return {
        lat: location.lat,
        lng: location.lng,
        source: 'google_maps',
        accuracy: response.data.results[0].geometry.location_type,
        formatted_address: response.data.results[0].formatted_address
      };

    } catch (error) {
      console.warn('⚠️ Google Geocoding échoué:', error.message);
      throw error;
    }
  }

  /**
   * 🇫🇷 Géocodage avec API gouvernementale française (gratuit)
   */
  async geocodeWithGovernmentAPI(address) {
    try {
      // Utiliser l'API gouvernementale française (gratuite)
      const response = await axios.get('https://api-adresse.data.gouv.fr/search/', {
        params: {
          q: address,
          limit: 1
        },
        timeout: 5000
      });

      const features = response.data.features;
      if (features.length === 0) {
        throw new Error('Adresse non trouvée dans la base gouvernementale');
      }

      return {
        lat: features[0].geometry.coordinates[1],
        lng: features[0].geometry.coordinates[0],
        source: 'api_gouvernementale',
        accuracy: 'APPROXIMATE',
        formatted_address: features[0].properties.label
      };

    } catch (error) {
      console.warn('⚠️ API gouvernementale échouée:', error.message);
      throw error;
    }
  }

  /**
   * 🛣️ Calculer la distance routière avec Google Maps ou OSRM
   */
  async getRoutingDistance(fromCoords, toCoords) {
    const service = process.env.ROUTING_SERVICE || 'osrm';
    
    try {
      if (service === 'google' && process.env.GOOGLE_MAPS_API_KEY) {
        return await this.getDistanceWithGoogle(fromCoords, toCoords);
      } else {
        return await this.getDistanceWithOSRM(fromCoords, toCoords);
      }
    } catch (error) {
      console.warn('⚠️ Routage échoué:', error.message);
      // Fallback: distance à vol d'oiseau × 1.3 (facteur route)
      return this.calculateHaversineDistance(fromCoords, toCoords) * 1.3;
    }
  }

  /**
   * 🌍 Distance avec Google Maps Directions API (précision maximale)
   */
  async getDistanceWithGoogle(fromCoords, toCoords) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${fromCoords.lat},${fromCoords.lng}`,
          destination: `${toCoords.lat},${toCoords.lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
          mode: 'driving',
          language: 'fr',
          region: 'fr',
          units: 'metric'
        },
        timeout: 8000
      });

      if (response.data.status !== 'OK' || response.data.routes.length === 0) {
        throw new Error(`Google Directions error: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      // Distance en kilomètres
      const distanceKm = leg.distance.value / 1000;
      
      return {
        distance: distanceKm,
        duration: leg.duration.value / 60, // minutes
        source: 'google_maps',
        route_summary: route.summary,
        traffic_info: route.overview_polyline ? 'available' : 'unavailable'
      };

    } catch (error) {
      console.warn('⚠️ Google Directions échoué:', error.message);
      throw error;
    }
  }

  /**
   * 🗺️ Distance avec OSRM (OpenStreetMap - gratuit)
   */
  async getDistanceWithOSRM(fromCoords, toCoords) {
    try {
      // Utiliser OSRM (OpenStreetMap Routing Machine) - gratuit
      const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}`, {
        params: {
          overview: false,
          steps: false,
          geometries: 'geojson'
        },
        timeout: 5000
      });

      if (response.data.code !== 'Ok' || response.data.routes.length === 0) {
        throw new Error(`OSRM error: ${response.data.code}`);
      }

      const route = response.data.routes[0];

      // Distance en kilomètres
      const distanceKm = route.distance / 1000;

      return {
        distance: distanceKm,
        duration: route.duration / 60, // minutes
        source: 'osrm_free',
        confidence: 'good'
      };

    } catch (error) {
      console.warn('⚠️ OSRM échoué:', error.message);
      throw error;
    }
  }

  /**
   * 🧮 Distance à vol d'oiseau (formule Haversine)
   */
  calculateHaversineDistance(from, to) {
    const fromCoords = typeof from === 'object' && 'lat' in from ? from : this.getFallbackCoordinates(from.city);
    const toCoords = typeof to === 'object' && 'lat' in to ? to : this.getFallbackCoordinates(to.city);

    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(toCoords.lat - fromCoords.lat);
    const dLng = this.toRadians(toCoords.lng - fromCoords.lng);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(fromCoords.lat)) * Math.cos(this.toRadians(toCoords.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 💨 Calculer les émissions CO2 selon la distance et le poids
   */
  calculateEmissions(distance_km, weight_kg) {
    let factor_kg_co2_per_km_per_kg;

    if (distance_km <= 50) {
      factor_kg_co2_per_km_per_kg = 0.0001; // Transport local
    } else if (distance_km <= 200) {
      factor_kg_co2_per_km_per_kg = 0.00015; // Transport régional
    } else if (distance_km <= 800) {
      factor_kg_co2_per_km_per_kg = 0.0002; // Transport national
    } else {
      factor_kg_co2_per_km_per_kg = 0.0005; // Transport international
    }

    return distance_km * weight_kg * factor_kg_co2_per_km_per_kg;
  }

  /**
   * 🚛 Déterminer le type de transport selon la distance
   */
  getTransportType(distance_km) {
    if (distance_km <= 5) return 'hand_delivery';
    if (distance_km <= 30) return 'local_delivery';
    if (distance_km <= 100) return 'regional_truck';
    if (distance_km <= 500) return 'national_truck';
    return 'long_distance_truck';
  }

  /**
   * 💰 Estimer le coût de transport
   */
  estimateTransportCost(distance_km, weight_kg) {
    const baseCost = 5; // Coût de base
    const distanceCost = distance_km * 0.8; // 0.80€/km
    const weightCost = weight_kg * 2; // 2€/kg

    const total = baseCost + distanceCost + weightCost;

    return {
      estimated_cost: Math.round(total * 100) / 100,
      cost_breakdown: {
        base: baseCost,
        distance: Math.round(distanceCost * 100) / 100,
        weight: Math.round(weightCost * 100) / 100
      },
      currency: 'EUR'
    };
  }

  /**
   * 🌱 Évaluer le bénéfice environnemental
   */
  getEnvironmentalBenefit(distance_km) {
    if (distance_km <= 10) {
      return {
        level: 'excellent',
        message: 'Échange ultra-local ! Impact transport minimal.',
        co2_vs_new_product: 'Évite 95% des émissions d\'un achat neuf'
      };
    } else if (distance_km <= 50) {
      return {
        level: 'very_good',
        message: 'Échange local avec faible impact transport.',
        co2_vs_new_product: 'Évite 85% des émissions d\'un achat neuf'
      };
    } else if (distance_km <= 200) {
      return {
        level: 'good',
        message: 'Impact transport raisonnable pour un échange régional.',
        co2_vs_new_product: 'Évite 70% des émissions d\'un achat neuf'
      };
    } else if (distance_km <= 500) {
      return {
        level: 'acceptable',
        message: 'Échange national - toujours bénéfique vs achat neuf.',
        co2_vs_new_product: 'Évite 50% des émissions d\'un achat neuf'
      };
    } else {
      return {
        level: 'questionable',
        message: 'Longue distance - vérifiez si l\'échange reste écologique.',
        co2_vs_new_product: 'Évite 20% des émissions d\'un achat neuf'
      };
    }
  }

  /**
   * 📦 Options de livraison selon la distance
   */
  getDeliveryOptions(distance_km) {
    const options = [];

    if (distance_km <= 10) {
      options.push({
        type: 'hand_delivery',
        name: 'Remise en main propre',
        cost: 0,
        co2_kg: 0,
        duration: '1-2 heures'
      });
    }

    if (distance_km <= 50) {
      options.push({
        type: 'local_courier',
        name: 'Coursier local',
        cost: 8,
        co2_kg: 0.5,
        duration: 'Même jour'
      });
    }

    options.push({
      type: 'standard_post',
      name: 'Colissimo',
      cost: 6.9,
      co2_kg: this.calculateEmissions(distance_km, 2),
      duration: '2-3 jours'
    });

    if (distance_km > 100) {
      options.push({
        type: 'express_post',
        name: 'Chronopost',
        cost: 15,
        co2_kg: this.calculateEmissions(distance_km, 2) * 1.5,
        duration: '24h'
      });
    }

    return options;
  }

  // 🛠️ MÉTHODES UTILITAIRES

  buildUserAddress(user) {
    const parts = [
      user.address,
      user.city,
      user.postalCode,
      'France'
    ].filter(Boolean);

    return parts.join(', ');
  }

  getUserLocationKey(user) {
    return `${user.city}_${user.postalCode}`.toLowerCase();
  }

  getFallbackCoordinates(city) {
    // Coordonnées approximatives des principales villes françaises
    const cityCoords = {
      'paris': { lat: 48.8566, lng: 2.3522 },
      'marseille': { lat: 43.2965, lng: 5.3698 },
      'lyon': { lat: 45.7640, lng: 4.8357 },
      'toulouse': { lat: 43.6047, lng: 1.4442 },
      'nice': { lat: 43.7102, lng: 7.2620 },
      'nantes': { lat: 47.2184, lng: -1.5536 },
      'montpellier': { lat: 43.6110, lng: 3.8767 },
      'strasbourg': { lat: 48.5734, lng: 7.7521 },
      'bordeaux': { lat: 44.8378, lng: -0.5792 },
      'lille': { lat: 50.6292, lng: 3.0573 }
    };

    const cityKey = city?.toLowerCase().replace(/[^a-z]/g, '');
    return cityCoords[cityKey] || cityCoords['paris']; // Fallback Paris
  }

  getFallbackTransportImpact() {
    return {
      distance_km: 50,
      transport_type: 'regional_truck',
      co2_emissions_kg: 0.4,
      transport_cost_estimate: { estimated_cost: 20, currency: 'EUR' },
      environmental_benefit: {
        level: 'good',
        message: 'Impact estimé - données précises indisponibles'
      },
      delivery_options: [{
        type: 'standard_post',
        name: 'Colissimo',
        cost: 6.9,
        co2_kg: 0.4,
        duration: '2-3 jours'
      }],
      carbon_offset_needed: 0.4
    };
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * 🧹 Nettoyer les caches
   */
  clearCaches() {
    this.distanceCache.clear();
    this.geocodeCache.clear();
  }

  /**
   * 📊 Statistiques des caches
   */
  getCacheStats() {
    return {
      distances: this.distanceCache.size,
      geocodes: this.geocodeCache.size,
      total_cached_items: this.distanceCache.size + this.geocodeCache.size
    };
  }
}

module.exports = GeoService;
