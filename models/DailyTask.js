/**
 * 📋 MODÈLE DE TÂCHE QUOTIDIENNE - CADOK
 * Système de tâches pour les événements écologiques
 */

const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema({
  // Événement auquel la tâche appartient
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Date de la tâche (format YYYY-MM-DD)
  date: {
    type: String,
    required: true
  },
  
  // Informations de la tâche
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Type de tâche détermine comment elle est validée
  taskType: {
    type: String,
    enum: [
      'TRADE_OBJECTS',      // Échanger X objets
      'ADD_OBJECTS',        // Ajouter X objets
      'LOGIN_APP',          // Se connecter à l'app
      'VISIT_CATEGORIES',   // Visiter X catégories
      'RATE_TRADES',        // Noter des échanges
      'UPDATE_PROFILE',     // Mettre à jour le profil
      'SHARE_OBJECT',       // Partager un objet
      'BROWSE_NEARBY'       // Explorer les objets à proximité
    ],
    required: true
  },
  
  // Objectif à atteindre
  targetValue: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Récompenses pour cette tâche (XP uniquement)
  rewards: {
    xp: {
      type: Number,
      default: 0
    },
    multiplier: {
      type: Number,
      default: 1.0
    }
  },
  
  // Catégories spécifiques si applicable
  specificCategories: [{
    type: String
  }],
  
  // Difficulté de la tâche
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  
  // Statistiques de completion
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    completedUsers: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Métadonnées
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Index pour recherches rapides
dailyTaskSchema.index({ eventId: 1, date: 1 });
dailyTaskSchema.index({ taskType: 1 });
dailyTaskSchema.index({ date: 1 });

// Méthodes statiques
dailyTaskSchema.statics.getTasksForEventAndDate = function(eventId, date) {
  return this.find({ eventId, date }).populate('eventId', 'name theme bonusMultiplier');
};

dailyTaskSchema.statics.getTasksForDate = function(date) {
  return this.find({ date })
    .populate('eventId', 'name theme bonusMultiplier isActive')
    .sort({ difficulty: 1, targetValue: 1 });
};

// Méthodes d'instance
dailyTaskSchema.methods.calculateReward = function(eventBonusMultiplier = 1.0) {
  return {
    xp: Math.round(this.rewards.xp * this.rewards.multiplier * eventBonusMultiplier)
  };
};

dailyTaskSchema.methods.updateStats = function() {
  if (this.stats.totalUsers > 0) {
    this.stats.completionRate = Math.round((this.stats.completedUsers / this.stats.totalUsers) * 100);
  }
  return this.save();
};

module.exports = mongoose.model('DailyTask', dailyTaskSchema);
