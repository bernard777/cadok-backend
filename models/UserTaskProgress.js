/**
 * 📊 MODÈLE DE PROGRESSION UTILISATEUR - CADOK
 * Suivi des tâches quotidiennes et récompenses
 */

const mongoose = require('mongoose');

const userTaskProgressSchema = new mongoose.Schema({
  // Utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tâche
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTask',
    required: true
  },
  
  // Événement
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  // Date de la tâche
  date: {
    type: String,
    required: true
  },
  
  // Progression actuelle
  currentProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Objectif à atteindre (copié de la tâche pour historique)
  targetValue: {
    type: Number,
    required: true
  },
  
  // Statut de la tâche
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'claimed'],
    default: 'not_started'
  },
  
  // Dates importantes
  startedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  },
  
  claimedAt: {
    type: Date,
    default: null
  },
  
  // Récompenses reçues (XP uniquement)
  rewardsReceived: {
    xp: {
      type: Number,
      default: 0
    },
    multiplier: {
      type: Number,
      default: 1.0
    }
  },
  
  // Détails de progression spécifiques au type de tâche
  progressDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Métadonnées
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour recherches rapides
userTaskProgressSchema.index({ userId: 1, date: 1 });
userTaskProgressSchema.index({ userId: 1, eventId: 1 });
userTaskProgressSchema.index({ taskId: 1 });
userTaskProgressSchema.index({ date: 1, status: 1 });

// Middleware pour mettre à jour updatedAt
userTaskProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthodes d'instance
userTaskProgressSchema.methods.updateProgress = function(incrementValue = 1, details = {}) {
  this.currentProgress = Math.min(this.currentProgress + incrementValue, this.targetValue);
  
  // Mettre à jour les détails de progression
  Object.assign(this.progressDetails, details);
  
  // Changer le statut si nécessaire
  if (this.status === 'not_started') {
    this.status = 'in_progress';
    this.startedAt = new Date();
  }
  
  // Marquer comme terminé si l'objectif est atteint
  if (this.currentProgress >= this.targetValue && this.status !== 'completed' && this.status !== 'claimed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

userTaskProgressSchema.methods.claimRewards = async function() {
  if (this.status !== 'completed') {
    throw new Error('Tâche non terminée');
  }
  
  if (this.status === 'claimed') {
    throw new Error('Récompenses déjà réclamées');
  }
  
  // Récupérer la tâche et l'événement pour calculer les récompenses
  await this.populate(['taskId', 'eventId']);
  
  const task = this.taskId;
  const event = this.eventId;
  
  // Calculer les récompenses avec bonus d'événement
  const rewards = task.calculateReward(event.bonusMultiplier);
  
  // Enregistrer les récompenses
  this.rewardsReceived = rewards;
  this.status = 'claimed';
  this.claimedAt = new Date();
  
  // Créditer l'utilisateur
  const User = mongoose.model('User');
  const user = await User.findById(this.userId);
  
  if (user) {
    // Ajouter XP
    user.gamification.totalXP += rewards.xp;
    user.gamification.currentLevelXP += rewards.xp;
    
    // Ajouter badge si applicable
    if (rewards.badge) {
      const existingBadge = user.gamification.achievements.find(a => a.id === rewards.badge);
      if (!existingBadge) {
        user.gamification.achievements.push({
          id: rewards.badge,
          title: rewards.badge,
          description: `Badge obtenu pour la tâche: ${task.title}`,
          unlockedAt: new Date(),
          xpReward: rewards.xp,
          rarity: task.difficulty === 'hard' ? 'rare' : task.difficulty === 'medium' ? 'uncommon' : 'common'
        });
      }
    }
    
    // Vérifier si level up
    await this.checkLevelUp(user);
    
    // 🎯 Mettre à jour l'objectif communautaire si l'utilisateur participe à des événements
    try {
      const GamificationService = require('../services/gamificationService');
      const gamificationService = new GamificationService();
      await gamificationService.updateGlobalGoalProgress(this.userId, task.taskType, rewards.xp);
    } catch (error) {
      console.error('❌ Erreur mise à jour objectif global depuis tâche:', error);
    }
    
    await user.save();
  }
  
  await this.save();
  
  return rewards;
};

userTaskProgressSchema.methods.checkLevelUp = async function(user) {
  const xpForNextLevel = this.calculateXPForLevel(user.gamification.level + 1);
  
  if (user.gamification.totalXP >= xpForNextLevel) {
    user.gamification.level += 1;
    user.gamification.currentLevelXP = user.gamification.totalXP - xpForNextLevel;
    user.gamification.lastLevelUp = new Date();
    
    // Mise à jour du titre
    user.gamification.title = this.getTitleForLevel(user.gamification.level);
  }
};

userTaskProgressSchema.methods.calculateXPForLevel = function(level) {
  // Formule: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
};

userTaskProgressSchema.methods.getTitleForLevel = function(level) {
  if (level >= 50) return 'Légende Écologique';
  if (level >= 40) return 'Maître Troqueur';
  if (level >= 30) return 'Expert Écolo';
  if (level >= 20) return 'Gardien de la Planète';
  if (level >= 15) return 'Éco-Warrior';
  if (level >= 10) return 'Ambassadeur Vert';
  if (level >= 5) return 'Troqueur Confirmé';
  return 'Nouveau Troqueur';
};

// Méthodes statiques
userTaskProgressSchema.statics.getUserProgressForDate = function(userId, date) {
  return this.find({ userId, date })
    .populate('taskId', 'title description taskType targetValue rewards')
    .populate('eventId', 'name theme bonusMultiplier')
    .sort({ 'taskId.difficulty': 1 });
};

userTaskProgressSchema.statics.getUserProgressForEvent = function(userId, eventId) {
  return this.find({ userId, eventId })
    .populate('taskId', 'title description taskType targetValue rewards date')
    .populate('eventId', 'name theme bonusMultiplier')
    .sort({ date: -1 });
};

userTaskProgressSchema.statics.createProgressForUser = async function(userId, taskId, eventId, date, targetValue) {
  const existing = await this.findOne({ userId, taskId, date });
  if (existing) return existing;
  
  return this.create({
    userId,
    taskId,
    eventId,
    date,
    targetValue,
    status: 'not_started'
  });
};

module.exports = mongoose.model('UserTaskProgress', userTaskProgressSchema);
