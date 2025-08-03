const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  // Référence à l'échange
  tradeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trade', 
    required: true 
  },
  
  // Méthode de livraison choisie
  method: {
    type: String,
    enum: ['pickup', 'colissimo', 'mondial_relay', 'chronopost'],
    required: true
  },
  
  // Coût de la livraison
  cost: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Détail du calcul du coût
  costBreakdown: {
    basePrice: { type: Number, default: 0 },
    weightSurcharge: { type: Number, default: 0 },
    distanceSurcharge: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  
  // Statut de la livraison
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'label_created', 'shipped', 'in_transit', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Informations de suivi
  trackingNumber: {
    type: String,
    sparse: true // Permet les valeurs null sans créer de conflit d'index unique
  },
  
  carrier: {
    type: String,
    enum: ['colissimo', 'mondial_relay', 'chronopost', 'pickup']
  },
  
  labelUrl: String,
  
  // Adresses de livraison
  addresses: {
    sender: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { 
        type: String, 
        required: true,
        validate: {
          validator: function(v) {
            return /^\d{5}$/.test(v);
          },
          message: 'Le code postal doit contenir 5 chiffres'
        }
      },
      phone: String,
      email: String
    },
    recipient: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { 
        type: String, 
        required: true,
        validate: {
          validator: function(v) {
            return /^\d{5}$/.test(v);
          },
          message: 'Le code postal doit contenir 5 chiffres'
        }
      },
      phone: String,
      email: String
    }
  },
  
  // Point relais (pour Mondial Relay)
  pickupPoint: {
    id: String,
    name: String,
    address: String,
    city: String,
    postalCode: String,
    hours: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Informations sur le colis
  package: {
    weight: { type: Number, min: 0.1, max: 30 }, // En kg
    dimensions: {
      length: Number, // En cm
      width: Number,
      height: Number
    },
    description: String,
    value: Number // Valeur déclarée pour l'assurance
  },
  
  // Dates importantes
  estimatedDelivery: Date,
  actualDelivery: Date,
  shippedDate: Date,
  
  // Historique des événements de livraison
  events: [{
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['created', 'confirmed', 'paid', 'label_created', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'failed']
    },
    location: String,
    description: String,
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Informations de paiement des frais de port
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'included_in_trade', 'cash_on_delivery']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    amount: Number
  },
  
  // Instructions spéciales
  instructions: {
    sender: String,
    recipient: String,
    delivery: String
  },
  
  // Photos et documents
  documents: [{
    type: {
      type: String,
      enum: ['label', 'receipt', 'proof_of_delivery', 'damage_report']
    },
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    description: String
  }],
  
  // Assurance
  insurance: {
    enabled: { type: Boolean, default: false },
    amount: Number,
    cost: Number,
    provider: String
  },
  
  // Métadonnées
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    distance: Number, // Distance en km entre expéditeur et destinataire
    estimatedDays: Number,
    priority: {
      type: String,
      enum: ['normal', 'express', 'urgent'],
      default: 'normal'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les requêtes fréquentes
deliverySchema.index({ tradeId: 1 });
deliverySchema.index({ trackingNumber: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ createdAt: -1 });
deliverySchema.index({ 'addresses.recipient.postalCode': 1 });

// Virtual pour obtenir l'événement le plus récent
deliverySchema.virtual('currentEvent').get(function() {
  if (this.events && this.events.length > 0) {
    return this.events[this.events.length - 1];
  }
  return null;
});

// Virtual pour vérifier si la livraison est complète
deliverySchema.virtual('isCompleted').get(function() {
  return ['delivered', 'cancelled'].includes(this.status);
});

// Virtual pour obtenir le délai de livraison réel
deliverySchema.virtual('actualDeliveryTime').get(function() {
  if (this.shippedDate && this.actualDelivery) {
    const diffTime = Math.abs(this.actualDelivery - this.shippedDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // En jours
  }
  return null;
});

// Méthode pour ajouter un événement de suivi
deliverySchema.methods.addTrackingEvent = function(eventData) {
  this.events.push({
    date: eventData.date || new Date(),
    status: eventData.status,
    location: eventData.location,
    description: eventData.description,
    details: eventData.details
  });
  
  // Mettre à jour le statut principal si fourni
  if (eventData.updateMainStatus) {
    this.status = eventData.status;
  }
  
  return this.save();
};

// Méthode pour marquer comme livré
deliverySchema.methods.markAsDelivered = function(deliveryDate = new Date()) {
  this.status = 'delivered';
  this.actualDelivery = deliveryDate;
  
  this.addTrackingEvent({
    status: 'delivered',
    description: 'Colis livré avec succès',
    updateMainStatus: false // Le statut est déjà mis à jour ci-dessus
  });
  
  return this.save();
};

// Méthode pour calculer les frais de retard
deliverySchema.methods.calculateLateFees = function() {
  if (!this.estimatedDelivery || !this.actualDelivery) {
    return 0;
  }
  
  const daysDifference = Math.ceil((this.actualDelivery - this.estimatedDelivery) / (1000 * 60 * 60 * 24));
  
  if (daysDifference > 0) {
    // 1€ par jour de retard, plafonné à 10€
    return Math.min(daysDifference * 1, 10);
  }
  
  return 0;
};

// Middleware pre-save pour validation
deliverySchema.pre('save', function(next) {
  // Valider que les adresses sont complètes pour les livraisons non-pickup
  if (this.method !== 'pickup') {
    const senderComplete = this.addresses.sender.name && 
                          this.addresses.sender.address && 
                          this.addresses.sender.city && 
                          this.addresses.sender.postalCode;
                          
    const recipientComplete = this.addresses.recipient.name && 
                             this.addresses.recipient.address && 
                             this.addresses.recipient.city && 
                             this.addresses.recipient.postalCode;
    
    if (!senderComplete || !recipientComplete) {
      return next(new Error('Adresses expéditeur et destinataire requises pour cette méthode de livraison'));
    }
  }
  
  // S'assurer que le coût total correspond au breakdown
  if (this.costBreakdown) {
    const calculatedTotal = (this.costBreakdown.basePrice || 0) + 
                           (this.costBreakdown.weightSurcharge || 0) + 
                           (this.costBreakdown.distanceSurcharge || 0);
    
    if (Math.abs(calculatedTotal - this.costBreakdown.total) > 0.01) {
      this.costBreakdown.total = calculatedTotal;
      this.cost = calculatedTotal;
    }
  }
  
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
