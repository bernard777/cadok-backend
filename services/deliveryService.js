const PrivacyProtectionService = require('./privacyProtectionService');

class DeliveryService {
  constructor() {
    this.privacyService = new PrivacyProtectionService();
    this.deliveryMethods = [
      {
        id: 'pickup',
        name: 'Retrait en main propre',
        basePrice: 0,
        estimatedDays: '1-2 jours',
        description: 'Rencontrez l\'échangeur directement',
        icon: 'people-outline'
      },
      {
        id: 'colissimo',
        name: 'Colissimo',
        basePrice: 4.95,
        estimatedDays: '2-3 jours',
        description: 'Livraison à domicile par La Poste',
        icon: 'home-outline'
      },
      {
        id: 'mondial_relay',
        name: 'Mondial Relay',
        basePrice: 3.50,
        estimatedDays: '3-5 jours',
        description: 'Retrait en point relais',
        icon: 'location-outline'
      },
      {
        id: 'chronopost',
        name: 'Chronopost Express',
        basePrice: 12.90,
        estimatedDays: '24h',
        description: 'Livraison express 24h',
        icon: 'flash-outline'
      }
    ];
  }

  /**
   * Obtenir toutes les méthodes de livraison disponibles
   */
  getDeliveryMethods() {
    return this.deliveryMethods;
  }

  /**
   * Obtenir une méthode de livraison spécifique
   */
  getDeliveryMethod(methodId) {
    return this.deliveryMethods.find(method => method.id === methodId);
  }

  /**
   * Calculer le coût de livraison
   */
  async calculateShippingCost(options) {
    const { method, fromCity, toCity, weight = 1, distance = 0 } = options;
    
    const deliveryMethod = this.getDeliveryMethod(method);
    if (!deliveryMethod) {
      throw new Error(`Méthode de livraison non supportée: ${method}`);
    }

    // Pour le retrait en main propre, pas de frais
    if (method === 'pickup') {
      return {
        cost: 0,
        method: deliveryMethod,
        breakdown: {
          basePrice: 0,
          weightSurcharge: 0,
          distanceSurcharge: 0,
          total: 0
        }
      };
    }

    // Calcul des frais de base
    let totalCost = deliveryMethod.basePrice;
    let weightSurcharge = 0;
    let distanceSurcharge = 0;

    // Majoration selon le poids (au-delà de 1kg)
    if (weight > 1) {
      weightSurcharge = Math.ceil(weight - 1) * 1.5;
      totalCost += weightSurcharge;
    }

    // Majoration selon la distance (au-delà de 100km)
    if (distance > 100) {
      distanceSurcharge = Math.ceil((distance - 100) / 100) * 2;
      totalCost += distanceSurcharge;
    }

    // Arrondir à 2 décimales
    totalCost = Math.round(totalCost * 100) / 100;

    return {
      cost: totalCost,
      method: deliveryMethod,
      breakdown: {
        basePrice: deliveryMethod.basePrice,
        weightSurcharge,
        distanceSurcharge,
        total: totalCost
      }
    };
  }

  /**
   * Calculer la distance entre deux villes (approximation)
   */
  calculateDistance(city1, city2) {
    // Coordonnées approximatives des principales villes françaises
    const cityCoordinates = {
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Lyon': { lat: 45.7640, lng: 4.8357 },
      'Marseille': { lat: 43.2965, lng: 5.3698 },
      'Toulouse': { lat: 43.6047, lng: 1.4442 },
      'Nice': { lat: 43.7102, lng: 7.2620 },
      'Nantes': { lat: 47.2184, lng: -1.5536 },
      'Montpellier': { lat: 43.6110, lng: 3.8767 },
      'Strasbourg': { lat: 48.5734, lng: 7.7521 },
      'Bordeaux': { lat: 44.8378, lng: -0.5792 },
      'Lille': { lat: 50.6292, lng: 3.0573 }
    };

    const coord1 = cityCoordinates[city1];
    const coord2 = cityCoordinates[city2];

    if (!coord1 || !coord2) {
      return 50; // Distance par défaut si ville non trouvée
    }

    // Formule de Haversine pour calculer la distance
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance);
  }

  /**
   * Convertir en radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Créer une étiquette de livraison avec protection des données
   */
  async createShippingLabel(deliveryData) {
    const { tradeId, method, addresses, weight, tradeData } = deliveryData;

    try {
      let result;
      let labelAddresses = addresses;

      // Si les données de trade sont fournies, activer la protection des données
      if (tradeData && method !== 'pickup') {
        console.log('🔒 Activation de la protection des données personnelles');
        
        const privacyProtectedLabel = await this.privacyService.createPrivacyProtectedLabel(
          {
            method,
            realSenderAddress: addresses.sender,
            realRecipientAddress: addresses.recipient
          },
          tradeData
        );

        // Utiliser les adresses anonymisées pour l'étiquette
        labelAddresses = privacyProtectedLabel.labelAddresses;
        
        // Validation RGPD
        const compliance = this.privacyService.validatePrivacyCompliance(privacyProtectedLabel);
        console.log('📋 Validation RGPD:', compliance.isCompliant ? '✅ Conforme' : '❌ Non conforme');
        
        if (!compliance.isCompliant) {
          console.warn('⚠️ Problème de conformité RGPD:', compliance.checks);
        }

        // Ajouter les métadonnées de sécurité au résultat
        result = {
          privacy: privacyProtectedLabel.privacy,
          security: privacyProtectedLabel.security,
          instructions: privacyProtectedLabel.instructions,
          compliance: compliance
        };
      }
      
      switch (method) {
        case 'colissimo':
          const colissimoResult = await this.createColissimoLabel({
            ...deliveryData,
            addresses: labelAddresses
          });
          result = { ...result, ...colissimoResult };
          break;
        case 'mondial_relay':
          const mondialResult = await this.createMondialRelayLabel({
            ...deliveryData,
            addresses: labelAddresses
          });
          result = { ...result, ...mondialResult };
          break;
        case 'chronopost':
          const chronoResult = await this.createChronopostLabel({
            ...deliveryData,
            addresses: labelAddresses
          });
          result = { ...result, ...chronoResult };
          break;
        case 'pickup':
          result = {
            ...result,
            success: true,
            trackingNumber: `PICKUP-${tradeId}`,
            labelUrl: null,
            message: 'Retrait en main propre - Aucune étiquette nécessaire',
            privacy: { level: 'DIRECT_CONTACT', method: 'PICKUP' }
          };
          break;
        default:
          throw new Error(`Méthode de livraison non supportée: ${method}`);
      }

      return result;
    } catch (error) {
      console.error('Erreur création étiquette:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Créer une étiquette Colissimo (simulation)
   */
  async createColissimoLabel(deliveryData) {
    // En production, intégrer avec l'API Colissimo
    // https://www.colissimo.entreprise.laposte.fr/fr/catalogue-api
    
    const trackingNumber = `CP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      success: true,
      trackingNumber,
      labelUrl: `https://api-colissimo.com/labels/${trackingNumber}.pdf`,
      carrier: 'colissimo',
      estimatedDelivery: this.calculateEstimatedDelivery('colissimo')
    };
  }

  /**
   * Créer une étiquette Mondial Relay (simulation)
   */
  async createMondialRelayLabel(deliveryData) {
    const trackingNumber = `MR${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    return {
      success: true,
      trackingNumber,
      labelUrl: `https://api-mondialrelay.com/labels/${trackingNumber}.pdf`,
      carrier: 'mondial_relay',
      pickupPoint: this.findNearestPickupPoint(deliveryData.addresses.recipient.city),
      estimatedDelivery: this.calculateEstimatedDelivery('mondial_relay')
    };
  }

  /**
   * Créer une étiquette Chronopost (simulation)
   */
  async createChronopostLabel(deliveryData) {
    const trackingNumber = `CH${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    return {
      success: true,
      trackingNumber,
      labelUrl: `https://api-chronopost.com/labels/${trackingNumber}.pdf`,
      carrier: 'chronopost',
      estimatedDelivery: this.calculateEstimatedDelivery('chronopost')
    };
  }

  /**
   * Calculer la date de livraison estimée
   */
  calculateEstimatedDelivery(method) {
    const now = new Date();
    const deliveryMethod = this.getDeliveryMethod(method);
    
    if (!deliveryMethod) return null;

    // Extraire le nombre de jours de la chaîne estimatedDays
    const daysMatch = deliveryMethod.estimatedDays.match(/(\d+)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 3;

    const estimatedDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    return estimatedDate;
  }

  /**
   * Trouver le point relais le plus proche (simulation)
   */
  findNearestPickupPoint(city) {
    // En production, utiliser l'API Mondial Relay pour trouver les vrais points relais
    const pickupPoints = [
      {
        id: 'MR001',
        name: 'Tabac Presse du Centre',
        address: '12 Rue de la République',
        city,
        hours: 'Lun-Sam 8h-19h'
      },
      {
        id: 'MR002',
        name: 'Carrefour City',
        address: '45 Avenue des Champs',
        city,
        hours: 'Lun-Dim 7h-22h'
      }
    ];

    return pickupPoints[0]; // Retourner le premier pour simplifier
  }

  /**
   * Suivre un colis
   */
  async trackPackage(trackingNumber, carrier) {
    try {
      // En production, intégrer avec les API de tracking des transporteurs
      
      // Simulation des étapes de livraison
      const trackingSteps = this.generateTrackingSteps(carrier);
      
      return {
        success: true,
        trackingNumber,
        carrier,
        status: 'en_transit',
        currentStep: 'Colis en transit vers le centre de tri',
        estimatedDelivery: this.calculateEstimatedDelivery(carrier),
        steps: trackingSteps
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer des étapes de tracking (simulation)
   */
  generateTrackingSteps(carrier) {
    const now = new Date();
    const steps = [
      {
        date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        status: 'expédié',
        location: 'Centre de tri - Paris',
        description: 'Colis pris en charge par le transporteur'
      },
      {
        date: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        status: 'en_transit',
        location: 'Centre de tri - Lyon',
        description: 'Colis en transit vers la destination'
      }
    ];

    if (carrier === 'chronopost') {
      steps.push({
        date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        status: 'en_cours_de_livraison',
        location: 'Véhicule de livraison',
        description: 'Colis en cours de livraison'
      });
    }

    return steps;
  }

  /**
   * Valider une adresse de livraison
   */
  validateAddress(address) {
    const required = ['name', 'address', 'city', 'postalCode'];
    const missing = required.filter(field => !address[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        errors: missing.map(field => `Le champ ${field} est requis`)
      };
    }

    // Valider le code postal français
    const postalCodeRegex = /^\d{5}$/;
    if (!postalCodeRegex.test(address.postalCode)) {
      return {
        valid: false,
        errors: ['Le code postal doit contenir 5 chiffres']
      };
    }

    return { valid: true };
  }
}

module.exports = new DeliveryService();
