const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  object: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Object',
    required: true
  },
  duration: {
    type: Number, // en jours
    required: true,
    min: 1,
    max: 30
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
advertisementSchema.index({ status: 1, endDate: 1 });
advertisementSchema.index({ user: 1, status: 1 });

// Méthode pour vérifier si la publicité est active
advertisementSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() <= this.endDate;
};

module.exports = mongoose.model('Advertisement', advertisementSchema);
