const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pseudo: { type: String, required: true },
  avatar: { type: String, default: '' },
  city: { type: String, required: true },
  
  // 📱 TÉLÉPHONE REQUIS (pour vérification SMS)
  phoneNumber: { type: String, required: true }, // Numéro de téléphone obligatoire
  
  // 🏠 ADRESSE COMPLÈTE REQUISE (pour livraisons)
  address: {
    street: { type: String, required: true }, // Rue et numéro
    zipCode: { type: String, required: true }, // Code postal
    city: { type: String, required: true }, // Ville (peut être différente de la ville du profil)
    country: { type: String, required: true, default: 'France' }, // Pays
    additionalInfo: { type: String, default: '' }, // Informations supplémentaires (étage, etc.)
    isDefault: { type: Boolean, default: true } // Adresse par défaut
  },
  
  // 👤 INFORMATIONS PERSONNELLES COMPLÈTES
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, default: null }, // Pour vérifications d'âge si nécessaire
  
  // 🔐 SYSTÈME DE VÉRIFICATION EMAIL + SMS
  verified: { type: Boolean, default: false }, // Vérification globale (email ET SMS)
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  phoneVerificationCode: { type: String, default: null },
  phoneVerificationExpires: { type: Date, default: null },
  phoneVerificationAttempts: { type: Number, default: 0 },
  lastPhoneVerificationSent: { type: Date, default: null },
  
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
  
  // 🛡️ SYSTÈME D'ADMINISTRATION GRANULAIRE
  role: { 
    type: String, 
    enum: ['user', 'moderator', 'admin_events', 'admin_users', 'admin_trades', 'admin_content', 'super_admin'], 
    default: 'user' 
  },
  isAdmin: { type: Boolean, default: false },
  adminPermissions: {
    // Gestion des événements  
    manageEvents: { type: Boolean, default: false },
    createEvents: { type: Boolean, default: false },
    moderateEvents: { type: Boolean, default: false },
    
    // Gestion des utilisateurs
    manageUsers: { type: Boolean, default: false },
    banUsers: { type: Boolean, default: false },
    viewUserDetails: { type: Boolean, default: false },
    
    // Gestion des échanges
    manageTrades: { type: Boolean, default: false },
    approveTrades: { type: Boolean, default: false },
    resolveDisputes: { type: Boolean, default: false },
    
    // Modération de contenu
    moderateContent: { type: Boolean, default: false },
    deleteReports: { type: Boolean, default: false },
    manageReports: { type: Boolean, default: false },
    
    // Analytics et système
    viewAnalytics: { type: Boolean, default: false },
    systemConfig: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false }
  },
  adminActivatedAt: { type: Date, default: null },
  adminActivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminNotes: { type: String, default: '' },
  
  // 🚫 SYSTÈME DE BANNISSEMENT ET STATUTS
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'suspended', 'banned'], 
    default: 'active' 
  },
  // Champs pour les bans
  bannedAt: { type: Date, default: null },
  bannedUntil: { type: Date, default: null }, // null = ban définitif
  banReason: { type: String, default: null },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Champs pour les suspensions
  suspendedAt: { type: Date, default: null },
  suspendedUntil: { type: Date, default: null },
  suspendReason: { type: String, default: null },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
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
  }],
  
  // Statistiques pour le système de réputation (troc pur)
  tradeStats: {
    completedTrades: { type: Number, default: 0 },
    cancelledTrades: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    trustScore: { type: Number, default: 50, min: 0, max: 100 }, // Score de confiance sur 100
    lastActivity: { type: Date, default: Date.now },
    violations: {
      noShipment: { type: Number, default: 0 }, // Nombre de fois où l'utilisateur n'a pas envoyé
      badQuality: { type: Number, default: 0 }, // Objet non conforme
      communication: { type: Number, default: 0 }, // Problèmes de communication
      total: { type: Number, default: 0 }
    },
    // Historique des évaluations reçues
    ratingsReceived: [{
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },

  // 🚀 NOUVELLES FONCTIONNALITÉS AVANCÉES - Préférences utilisateur
  featurePreferences: {
    analytics: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    eco: { type: Boolean, default: true },
    gaming: { type: Boolean, default: true }
  }
}, { timestamps: true });

// 🔐 MÉTHODE POUR CALCULER LA VÉRIFICATION GLOBALE
userSchema.pre('save', function(next) {
  // Mise à jour automatique du statut verified
  this.verified = this.emailVerified && this.phoneVerified;
  next();
});

// 🔐 MÉTHODES DE VÉRIFICATION
userSchema.methods.isFullyVerified = function() {
  return this.emailVerified && this.phoneVerified;
};

userSchema.methods.canReceivePhoneCode = function() {
  const now = new Date();
  const lastSent = this.lastPhoneVerificationSent;
  
  // Limite: 1 SMS par minute, max 5 tentatives par heure
  if (lastSent && now - lastSent < 60000) { // 1 minute
    return false;
  }
  
  if (this.phoneVerificationAttempts >= 5) { // Max 5 tentatives
    return false;
  }
  
  return true;
};

module.exports = mongoose.model('User', userSchema);
