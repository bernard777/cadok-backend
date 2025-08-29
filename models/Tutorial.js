const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['basics', 'trading', 'advanced', 'troubleshooting', 'features', 'security'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  duration: {
    type: String,
    required: true // ex: "5:30" pour 5 minutes 30 secondes
  },
  difficulty: {
    type: String,
    enum: ['débutant', 'intermédiaire', 'avancé'],
    default: 'débutant',
    index: true
  },
  thumbnail: {
    type: String,
    required: true // URL de l'image miniature
  },
  videoUrl: {
    type: String,
    required: true // URL de la vidéo
  },
  steps: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: String // ex: "1:30" pour aller à 1 minute 30
    },
    screenshot: String // URL optionnelle d'une capture d'écran
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  language: {
    type: String,
    default: 'fr',
    enum: ['fr', 'en']
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutorial'
  }],
  relatedTutorials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutorial'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transcription: {
    type: String, // Transcription du tutoriel pour l'accessibilité
    maxlength: 10000
  },
  resources: [{
    name: String,
    url: String,
    type: String // 'pdf', 'link', 'image', etc.
  }]
}, {
  timestamps: true
});

// Index pour les recherches
tutorialSchema.index({ category: 1, isActive: 1 });
tutorialSchema.index({ difficulty: 1 });
tutorialSchema.index({ tags: 1 });
tutorialSchema.index({ order: 1, createdAt: -1 });
tutorialSchema.index({ rating: -1, viewCount: -1 });
tutorialSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Méthodes d'instance
tutorialSchema.methods.incrementView = function(userId = null) {
  this.viewCount += 1;
  
  if (userId && !this.viewedBy.includes(userId)) {
    this.viewedBy.push(userId);
  }
  
  return this.save();
};

tutorialSchema.methods.addRating = function(userId, rating) {
  // Vérifier si l'utilisateur a déjà noté
  const existingRating = this.ratings.find(r => r.user.toString() === userId.toString());
  
  if (existingRating) {
    existingRating.rating = rating;
  } else {
    this.ratings.push({
      user: userId,
      rating,
      createdAt: new Date()
    });
  }

  // Recalculer la moyenne
  const totalRating = this.ratings.reduce((sum, r) => sum + r.rating, 0);
  this.rating = Math.round((totalRating / this.ratings.length) * 10) / 10;

  return this.save();
};

// Méthodes statiques
tutorialSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ rating: -1, viewCount: -1 })
    .limit(limit);
};

tutorialSchema.statics.getByDifficulty = function(difficulty) {
  return this.find({ 
    isActive: true, 
    difficulty 
  }).sort({ order: 1, createdAt: -1 });
};

tutorialSchema.statics.searchTutorials = function(searchTerm, filters = {}) {
  const query = {
    isActive: true,
    $text: { $search: searchTerm }
  };

  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }

  if (filters.minRating) {
    query.rating = { $gte: filters.minRating };
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

tutorialSchema.statics.getRecommendations = function(userId, limit = 5) {
  // Logique de recommandation basée sur l'historique de l'utilisateur
  // Pour l'instant, on retourne les plus populaires
  return this.getPopular(limit);
};

const Tutorial = mongoose.model('Tutorial', tutorialSchema);

module.exports = Tutorial;
