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
    isDefault: { type: Boolean, default: true }, // Adresse par défaut
    // 📍 COORDONNÉES GPS OPTIONNELLES
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      default: undefined
    },
    // Précision de l'adresse
    precision: {
      type: String,
      enum: ['exact', 'approximate', 'city_only'],
      default: 'city_only'
    }
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
  favoriteObjects: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Object' 
  }],
  notificationPreferences: {
    // Préférences générales
    notifications_push: { type: Boolean, default: true },
    notifications_email: { type: Boolean, default: false },
    sound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true },
    
    // Préférences spécifiques (correspondant aux switches de l'écran mobile)
    newMessages: { type: Boolean, default: true },
    tradeUpdates: { type: Boolean, default: true },
    objectInterest: { type: Boolean, default: true },
    marketingTips: { type: Boolean, default: false },
    communityUpdates: { type: Boolean, default: true },
    smartSuggestions: { type: Boolean, default: true },
    
    // Heures silencieuses
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '08:00' }
    },
    
    // Fréquence des notifications
    frequency: { 
      type: String, 
      enum: ['minimal', 'normal', 'frequent'], 
      default: 'normal' 
    }
  },
  // Informations de paiement et abonnement
  subscriptionPlan: { type: String, enum: ['basic', 'premium'], default: null },
  subscriptionStatus: { type: String, enum: ['active', 'inactive', 'canceled', 'trial'], default: 'inactive' },
  subscriptionEndDate: { type: Date, default: null },
  stripeCustomerId: { type: String, default: null },
  stripeSubscriptionId: { type: String, default: null },
  lastPaymentDate: { type: Date, default: null },
  
  // � SYSTÈME DE VÉRIFICATION EMAIL ET TÉLÉPHONE
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  verified: { type: Boolean, default: false }, // true quand email ET téléphone vérifiés
  
  // Tokens et codes de vérification
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  phoneVerificationCode: { type: String, default: null },
  phoneVerificationExpires: { type: Date, default: null },
  phoneVerificationAttempts: { type: Number, default: 0 },
  
  // 📱 TOKEN PUSH NOTIFICATIONS
  pushToken: { type: String, default: null }, // Token Expo pour notifications push
  pushTokenUpdatedAt: { type: Date, default: null },
  
  // Email de bienvenue
  welcomeEmailSent: { type: Boolean, default: false },
  welcomeEmailSentAt: { type: Date, default: null },
  
  // �🛡️ SYSTÈME D'ADMINISTRATION GRANULAIRE
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

// 📍 MÉTHODES DE GÉOLOCALISATION
userSchema.methods.updateCoordinates = async function(lat, lng, precision = 'approximate') {
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    this.address.coordinates = [parseFloat(lng), parseFloat(lat)];
    this.address.precision = precision;
    return this.save();
  }
  return Promise.reject(new Error('Coordonnées invalides'));
};

userSchema.methods.getDistanceFrom = function(lat, lng) {
  if (!this.address.coordinates || !lat || !lng) return null;
  
  const [userLng, userLat] = this.address.coordinates;
  const R = 6371; // Rayon de la Terre en km
  
  const dLat = (lat - userLat) * Math.PI / 180;
  const dLng = (lng - userLng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c * 100) / 100; // Distance en km
};

userSchema.statics.findNearby = function(lat, lng, maxDistance = 5000, filters = {}) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return this.find(filters);
  }
  
  return this.find({
    ...filters,
    'address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: maxDistance // en mètres
      }
    }
  });
};

module.exports = mongoose.model('User', userSchema);
