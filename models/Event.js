/**
 * 🎪 MODÈLE D'ÉVÉNEMENT - CADOK
 * Système de gestion des événements gamification
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // ID custom pour compatibilité avec les templates
  id: {
    type: String,
    unique: true,
    sparse: true // Permet aux anciens événements sans ce champ de continuer à fonctionner
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  theme: {
    type: String,
    required: true,
    enum: ['ecology', 'seasonal', 'education', 'competition', 'community', 'custom'],
    default: 'ecology'
  },
  
  icon: {
    type: String,
    default: '🎪'
  },
  
  color: {
    type: String,
    default: '#9C27B0'
  },
  
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  
  bonusMultiplier: {
    type: Number,
    default: 1.5,
    min: 1.0,
    max: 5.0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  categories: [{
    type: String
  }],
  
  // Actions XP sélectionnées pour bénéficier du multiplicateur
  selectedActions: [{
    type: String,
    enum: [
      // Actions de base
      'LOGIN_APP', 'FIRST_LOGIN',
      // Actions objets
      'ADD_OBJECT', 'ADD_MULTIPLE_OBJECTS', 'UPDATE_OBJECT', 'ADD_OBJECT_PHOTO',
      // Actions échanges
      'INITIATE_TRADE', 'ACCEPT_TRADE', 'COMPLETE_TRADE', 'RATE_TRADE',
      // Actions sociales
      'SEND_MESSAGE', 'RECEIVE_POSITIVE_RATING', 'GIVE_RATING',
      // Actions exploration
      'BROWSE_OBJECTS', 'SEARCH_OBJECTS', 'VIEW_OBJECT_DETAILS', 'USE_FILTERS',
      // Actions profil
      'COMPLETE_PROFILE', 'ADD_PROFILE_PHOTO', 'UPDATE_PREFERENCES',
      // Actions achievements
      'UNLOCK_ACHIEVEMENT', 'REACH_LEVEL',
      // Actions spéciales écologie
      'ECO_TRADE', 'SUSTAINABLE_ACTION', 'GREEN_TRANSPORT', 'WASTE_REDUCTION'
    ]
  }],
  
  specialRewards: {
    badge: {
      type: String,
      default: ''
    },
    exclusiveItems: [{
      type: String
    }]
  },
  
  globalGoal: {
    target: {
      type: Number,
      default: 0
    },
    current: {
      type: Number,
      default: 0
    },
    reward: {
      type: String,
      default: ''
    }
  },
  
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      challengesCompleted: {
        type: Number,
        default: 0
      },
      xpEarned: {
        type: Number,
        default: 0
      },
      tradesCompleted: {
        type: Number,
        default: 0
      }
    }
  }],
  
  statistics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    totalTrades: {
      type: Number,
      default: 0
    },
    totalXPAwarded: {
      type: Number,
      default: 0
    }
  },
  
  // Informations sur l'événement réel correspondant
  realWorldEvent: {
    name: {
      type: String,
      default: ''
    },
    officialDate: {
      type: String,
      default: ''
    },
    organizer: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  
  // Métadonnées de création
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les requêtes fréquentes
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ theme: 1 });
eventSchema.index({ 'participants.userId': 1 });

// Middleware pour mettre à jour updatedAt
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthodes d'instance
eventSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

eventSchema.methods.addParticipant = function(userId) {
  // 🔒 VÉRIFICATION STRICTE : Empêcher les inscriptions multiples
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    console.log(`[EVENT MODEL] Tentative d'inscription multiple bloquée pour l'utilisateur ${userId}`);
    return Promise.resolve(this); // Retourner l'événement sans modification
  }
  
  // ✅ Ajouter le nouvel participant avec structure complète
  this.participants.push({ 
    userId,
    joinedAt: new Date(),
    progress: {
      challengesCompleted: 0,
      xpEarned: 0,
      tradesCompleted: 0
    }
  });
  
  // Mettre à jour les statistiques
  this.statistics.totalParticipants = this.participants.length;
  
  console.log(`[EVENT MODEL] Participant ajouté avec succès. Total: ${this.participants.length}`);
  return this.save();
};

eventSchema.methods.updateProgress = function(userId, progress) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    Object.assign(participant.progress, progress);
    return this.save();
  }
  return Promise.resolve(this);
};

// Méthodes statiques
eventSchema.statics.getActiveEvents = function(currentDate = new Date()) {
  return this.find({
    isActive: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate }
  }).sort({ startDate: 1 });
};

eventSchema.statics.getUpcomingEvents = function(currentDate = new Date()) {
  return this.find({
    startDate: { $gt: currentDate }
  }).sort({ startDate: 1 });
};

eventSchema.statics.getPastEvents = function(currentDate = new Date()) {
  return this.find({
    endDate: { $lt: currentDate }
  }).sort({ endDate: -1 });
};

module.exports = mongoose.model('Event', eventSchema);
