const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  monthlyPrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Gestion des changements programmés (comme les downgrades)
  scheduledPlan: {
    type: String,
    enum: ['free', 'basic', 'premium']
  },
  scheduledChangeDate: {
    type: Date
  },
  // Historique des paiements
  payments: [{
    date: { type: Date, default: Date.now },
    amount: Number,
    status: { type: String, enum: ['success', 'failed', 'pending'] },
    transactionId: String
  }],
  // Méthode de paiement
  paymentMethod: {
    type: {
      type: String,
      enum: ['stripe', 'paypal', 'credit_card']
    },
    customerId: String,
    last4: String
  },
  // Statistiques d'utilisation Premium
  premiumFeatures: {
    objectsPublished: { type: Number, default: 0 },
    tradesCompleted: { type: Number, default: 0 },
    prioritySearches: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes (user index pas nécessaire car unique: true)
subscriptionSchema.index({ status: 1, endDate: 1 });

// Middleware pre-save pour valider endDate selon le plan
subscriptionSchema.pre('save', function(next) {
  if ((this.plan === 'basic' || this.plan === 'premium') && !this.endDate) {
    return next(new Error('endDate is required for paid plans'));
  }
  next();
});

// Méthode pour vérifier si l'abonnement est actif
subscriptionSchema.methods.isActive = function() {
  if (this.plan === 'free') return true;
  
  // Un abonnement est actif s'il n'est pas expiré, même s'il est annulé
  return (this.status === 'active' || this.status === 'cancelled') && 
         this.endDate && 
         new Date() <= this.endDate;
};

// Méthode pour vérifier si l'utilisateur est Premium
subscriptionSchema.methods.isPremium = function() {
  return this.plan === 'premium' && this.isActive();
};

// Méthode pour vérifier si l'utilisateur est Basic ou plus
subscriptionSchema.methods.isBasicOrHigher = function() {
  return (this.plan === 'basic' || this.plan === 'premium') && this.isActive();
};

// Méthode pour vérifier et appliquer les changements programmés
subscriptionSchema.methods.applyScheduledChanges = function() {
  if (this.scheduledPlan && this.scheduledChangeDate && new Date() >= this.scheduledChangeDate) {
    this.plan = this.scheduledPlan;
    this.scheduledPlan = null;
    this.scheduledChangeDate = null;
    
    if (this.plan === 'free') {
      this.endDate = null;
      this.monthlyPrice = 0;
    }
    
    return true; // Changement appliqué
  }
  return false; // Aucun changement
};

// Méthode pour obtenir les limites selon le plan
subscriptionSchema.methods.getLimits = function() {
  const limits = {
    free: { maxObjects: 3, maxTrades: 2 },
    basic: { maxObjects: 10, maxTrades: 5 },
    premium: { maxObjects: 'unlimited', maxTrades: 'unlimited' }
  };
  return limits[this.plan] || limits.free;
};

// Méthode pour renouveler l'abonnement
subscriptionSchema.methods.renew = function() {
  if (this.plan === 'premium') {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    this.endDate = nextMonth;
    this.status = 'active';
  }
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
