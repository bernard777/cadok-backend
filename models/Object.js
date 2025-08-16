const mongoose = require('mongoose');

const ObjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  imageUrl: { type: String }, // Gardé pour compatibilité descendante
  images: [{ 
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['available', 'traded', 'reserved'],
    default: 'available'
  },
  // 📍 GÉOLOCALISATION AVANCÉE
  location: {
    // Coordonnées GPS précises
    coordinates: {
      type: [Number], // [longitude, latitude] format GeoJSON
      index: '2dsphere',
      default: undefined
    },
    // Adresse textuelle
    address: {
      street: { type: String },
      city: { type: String, required: true }, // Ville obligatoire
      zipCode: { type: String },
      country: { type: String, default: 'France' }
    },
    // Précision de la localisation
    precision: {
      type: String,
      enum: ['exact', 'approximate', 'city_only'],
      default: 'city_only'
    },
    // Visibilité publique de l'emplacement
    isPublic: { type: Boolean, default: true },
    // Rayon de recherche préféré (en km)
    searchRadius: { type: Number, default: 10, min: 1, max: 100 }
  }
}, { timestamps: true });

// Index composé pour recherche optimisée (l'index 2dsphere est déjà défini dans le schéma)
ObjectSchema.index({ "location.address.city": 1, "status": 1, "createdAt": -1 });
ObjectSchema.index({ "location.address.zipCode": 1, "status": 1 });

// 🧠 MÉTHODES STATIQUES AVANCÉES
ObjectSchema.statics.findNearby = function(lat, lng, maxDistance = 10000, filters = {}) {
  const baseFilters = { 
    status: 'available', 
    'location.isPublic': true,
    ...filters 
  };
  
  // Si coordonnées précises fournies, utiliser recherche géospatiale
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    return this.find({
      ...baseFilters,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] // [longitude, latitude]
          },
          $maxDistance: maxDistance // en mètres
        }
      }
    });
  }
  
  // Sinon recherche classique
  return this.find(baseFilters);
};

ObjectSchema.statics.findByCity = function(city, filters = {}) {
  return this.find({
    status: 'available',
    'location.address.city': new RegExp(city, 'i'),
    ...filters
  });
};

ObjectSchema.statics.findByZipCode = function(zipCode, filters = {}) {
  const zipPrefix = zipCode.substring(0, 2); // Département
  return this.find({
    status: 'available',
    $or: [
      { 'location.address.zipCode': zipCode },
      { 'location.address.zipCode': new RegExp(`^${zipPrefix}`) }
    ],
    ...filters
  });
};

// 🔧 MÉTHODES D'INSTANCE
ObjectSchema.methods.updateLocation = async function(locationData) {
  if (locationData.lat && locationData.lng) {
    this.location.coordinates = [locationData.lng, locationData.lat];
    this.location.precision = 'exact';
  }
  
  if (locationData.city) {
    this.location.address.city = locationData.city;
  }
  
  if (locationData.zipCode) {
    this.location.address.zipCode = locationData.zipCode;
  }
  
  return this.save();
};

ObjectSchema.methods.getDistanceFrom = function(lat, lng) {
  if (!this.location.coordinates || !lat || !lng) return null;
  
  const [objLng, objLat] = this.location.coordinates;
  const R = 6371; // Rayon de la Terre en km
  
  const dLat = (lat - objLat) * Math.PI / 180;
  const dLng = (lng - objLng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(objLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c * 100) / 100; // Distance en km, arrondie à 2 décimales
};

module.exports = mongoose.model('Object', ObjectSchema);
