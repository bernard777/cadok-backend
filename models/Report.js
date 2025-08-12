/**
 * 📋 MODÈLE SIGNALEMENT - CADOK
 * Modèle pour les signalements d'utilisateurs ou d'objets
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Utilisateur qui fait le signalement
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Utilisateur signalé (optionnel)
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Objet signalé (optionnel)
  reportedObject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Object'
  },

  // Échange lié au signalement (optionnel)
  relatedTrade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  },

  // Type de signalement
  type: {
    type: String,
    enum: [
      'inappropriate_content',
      'misleading_description', 
      'fake_item',
      'suspicious_behavior',
      'harassment',
      'spam',
      'fraud',
      'violence_threat',
      'copyright_violation',
      'other'
    ],
    required: true
  },

  // Raison courte
  reason: {
    type: String,
    required: true,
    maxLength: 200
  },

  // Description détaillée
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },

  // Statut du signalement
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },

  // Priorité
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Preuves jointes
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'link', 'screenshot']
    },
    url: String,
    description: String
  }],

  // Traitement par l'administration
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'requires_action']
    },
    adminNotes: String,
    actionTaken: String
  },

  // Résolution
  resolution: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolutionType: {
      type: String,
      enum: [
        'warning_sent',
        'content_removed', 
        'user_suspended',
        'user_banned',
        'trade_cancelled',
        'no_action_needed',
        'false_report'
      ]
    },
    notes: String
  },

  // Métadonnées
  reportedAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // Adresse IP et informations système (pour traçabilité)
  metadata: {
    reporterIP: String,
    userAgent: String,
    platform: String
  }

}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
reportSchema.index({ reporter: 1, reportedAt: -1 });
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ reportedObject: 1, status: 1 });
reportSchema.index({ status: 1, priority: 1 });
reportSchema.index({ 'adminReview.reviewedBy': 1 });

// Middleware pour mettre à jour updatedAt
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthodes du modèle
reportSchema.methods.markAsResolved = function(resolvedBy, resolutionType, notes) {
  this.status = 'resolved';
  this.resolution = {
    resolvedAt: new Date(),
    resolvedBy,
    resolutionType,
    notes
  };
  return this.save();
};

reportSchema.methods.assignToAdmin = function(adminId, notes) {
  this.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    adminNotes: notes
  };
  this.status = 'investigating';
  return this.save();
};

// Méthodes statiques
reportSchema.statics.getPendingReports = function() {
  return this.find({ status: 'pending' })
    .populate('reporter', 'pseudo email')
    .populate('reportedUser', 'pseudo email')
    .populate('reportedObject', 'title')
    .sort({ reportedAt: -1 });
};

reportSchema.statics.getReportsByUser = function(userId) {
  return this.find({ reportedUser: userId })
    .populate('reporter', 'pseudo email')
    .sort({ reportedAt: -1 });
};

reportSchema.statics.getReportsStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
