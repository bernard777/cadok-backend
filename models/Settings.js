/**
 * 🔧 MODÈLE SETTINGS - PARAMÈTRES SYSTÈME
 * Configuration persistante pour l'administration
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Maintenance
  maintenance: {
    enabled: { type: Boolean, default: false },
    message: { 
      type: String, 
      default: 'Le système est actuellement en maintenance. Veuillez réessayer plus tard.' 
    },
    scheduledEnd: { type: Date, default: null },
    activatedBy: { type: String, default: null },
    activatedAt: { type: Date, default: null }
  },

  // Modération
  moderation: {
    autoApproval: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    maxObjectsPerUser: { type: Number, default: 20, min: 1, max: 100 },
    maxRegistrationsPerDay: { type: Number, default: 100, min: 1, max: 1000 }
  },

  // Fonctionnalités principales
  features: {
    tradingEnabled: { type: Boolean, default: true },
    registrationEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true }
  },

  // Registration
  registration: {
    enabled: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    allowedDomains: [{ type: String }],
    maxUsersPerDay: { type: Number, default: 100, min: 1, max: 1000 }
  },

  // Trading
  trading: {
    enabled: { type: Boolean, default: true },
    maxObjectsPerUser: { type: Number, default: 20, min: 1, max: 100 },
    moderationEnabled: { type: Boolean, default: true },
    autoApprovalEnabled: { type: Boolean, default: false },
    tradingHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '08:00' },
      end: { type: String, default: '22:00' }
    }
  },

  // Security
  security: {
    maxLoginAttempts: { type: Number, default: 5, min: 3, max: 10 },
    lockoutDuration: { type: Number, default: 15, min: 5, max: 60 }, // minutes
    passwordMinLength: { type: Number, default: 8, min: 6, max: 20 },
    requireStrongPassword: { type: Boolean, default: true },
    sessionTimeout: { type: Number, default: 24, min: 1, max: 168 } // heures
  },

  // Notifications
  notifications: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false }
  },

  // Content moderation
  content: {
    imageModeration: { type: Boolean, default: true },
    textModeration: { type: Boolean, default: true },
    maxImageSize: { type: Number, default: 5, min: 1, max: 20 }, // MB
    allowedImageTypes: [{ type: String, default: ['jpg', 'jpeg', 'png', 'gif'] }],
    profanityFilter: { type: Boolean, default: true }
  },

  // System
  system: {
    apiRateLimit: { type: Number, default: 1000, min: 100, max: 10000 }, // requests per hour
    backupEnabled: { type: Boolean, default: true },
    backupFrequency: { 
      type: String, 
      enum: ['hourly', 'daily', 'weekly'], 
      default: 'daily' 
    },
    logLevel: { 
      type: String, 
      enum: ['error', 'warn', 'info', 'debug'], 
      default: 'info' 
    },
    analyticsEnabled: { type: Boolean, default: true }
  },

  // Métadonnées
  lastUpdatedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pseudo: { type: String },
    email: { type: String }
  },
  
  version: { type: Number, default: 1 },
  
  // Historique des modifications
  history: [{
    category: { type: String, required: true },
    action: { type: String, required: true }, // 'update', 'toggle', 'reset'
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    updatedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      pseudo: { type: String },
      email: { type: String }
    },
    timestamp: { type: Date, default: Date.now }
  }]

}, {
  timestamps: true,
  collection: 'settings'
});

// Index pour optimiser les requêtes
settingsSchema.index({ 'lastUpdatedBy.userId': 1 });
settingsSchema.index({ 'history.timestamp': -1 });

// Méthodes statiques
settingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    console.log('🔧 [SETTINGS] Création des paramètres par défaut...');
    settings = new this({});
    await settings.save();
    console.log('✅ [SETTINGS] Paramètres par défaut créés');
  }
  
  return settings;
};

settingsSchema.statics.updateCategory = async function(category, newData, updatedBy) {
  const settings = await this.getInstance();
  const previousValue = settings[category];
  
  // Mise à jour
  settings[category] = { ...settings[category].toObject(), ...newData };
  
  // Ajout à l'historique
  settings.history.push({
    category,
    action: 'update',
    previousValue,
    newValue: settings[category],
    updatedBy
  });
  
  // Métadonnées
  settings.lastUpdatedBy = updatedBy;
  settings.version += 1;
  
  await settings.save();
  
  console.log(`✅ [SETTINGS] Catégorie ${category} mise à jour par ${updatedBy.pseudo}`);
  return settings;
};

settingsSchema.statics.toggleMaintenance = async function(enabled, message, updatedBy) {
  const settings = await this.getInstance();
  const previousValue = settings.maintenance;
  
  settings.maintenance.enabled = enabled;
  if (message) settings.maintenance.message = message;
  settings.maintenance.activatedBy = updatedBy.pseudo;
  settings.maintenance.activatedAt = enabled ? new Date() : null;
  
  // Ajout à l'historique
  settings.history.push({
    category: 'maintenance',
    action: 'toggle',
    previousValue,
    newValue: settings.maintenance,
    updatedBy
  });
  
  settings.lastUpdatedBy = updatedBy;
  settings.version += 1;
  
  await settings.save();
  
  console.log(`🔧 [MAINTENANCE] Mode ${enabled ? 'activé' : 'désactivé'} par ${updatedBy.pseudo}`);
  return settings;
};

// Middleware pour nettoyer l'historique (garder seulement les 100 dernières entrées)
settingsSchema.pre('save', function(next) {
  if (this.history && this.history.length > 100) {
    this.history = this.history.slice(-100);
  }
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
