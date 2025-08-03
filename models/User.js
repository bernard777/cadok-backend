const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pseudo: { type: String, required: true },
  avatar: { type: String, default: '' },
  city: { type: String, required: true },
  favoriteCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  notificationPreferences: {
    notifications_push: { type: Boolean, default: true },
    notifications_email: { type: Boolean, default: false },
    promotions: { type: Boolean, default: false },
    sound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true }
  },
  // Informations de paiement et abonnement
  subscriptionPlan: { type: String, enum: ['basic', 'premium'], default: null },
  subscriptionStatus: { type: String, enum: ['active', 'inactive', 'canceled', 'trial'], default: 'inactive' },
  subscriptionEndDate: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  lastPaymentDate: { type: Date, default: null },
  // Méthodes de paiement
  paymentMethods: [{
    stripePaymentMethodId: { type: String, required: true },
    type: { type: String, default: 'card' },
    last4: { type: String, required: true },
    brand: { type: String, required: true },
    expiryMonth: { type: Number, required: true },
    expiryYear: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  // Historique des paiements
  payments: [{
    amount: { type: Number, required: true },
    currency: { type: String, default: 'eur' },
    status: { type: String, enum: ['success', 'failed', 'pending'], required: true },
    paymentIntentId: { type: String, required: true },
    subscriptionId: { type: String, default: null },
    plan: { type: String, default: null },
    date: { type: Date, default: Date.now }
  }],
  subscriptionHistory: [{
    plan: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'canceled', 'expired'], required: true },
    amount: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
