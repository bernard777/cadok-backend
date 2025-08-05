/**
 * Modèle Point Relais
 */

const mongoose = require('mongoose');

const pickupPointSchema = new mongoose.Schema({
  relayId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'FR' }
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  provider: { type: String, enum: ['mondialrelay', 'colissimo', 'chronopost'], required: true },
  isActive: { type: Boolean, default: true },
  openingHours: {
    monday: { type: String },
    tuesday: { type: String },
    wednesday: { type: String },
    thursday: { type: String },
    friday: { type: String },
    saturday: { type: String },
    sunday: { type: String }
  },
  contact: {
    phone: { type: String },
    email: { type: String }
  },
  capacity: { type: Number, default: 100 },
  features: [{
    type: String,
    enum: ['parking', 'wheelchair_access', '24h_access', 'refrigerated']
  }]
}, {
  timestamps: true
});

// Index pour recherche géographique
pickupPointSchema.index({ "location": "2dsphere" });
pickupPointSchema.index({ "address.zipCode": 1, "provider": 1 });

module.exports = mongoose.model('PickupPoint', pickupPointSchema);
