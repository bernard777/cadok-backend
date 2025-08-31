const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Référence à l'échange
  trade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    required: true,
    index: true
  },

  // Utilisateur qui donne la note (reviewer)
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Utilisateur qui reçoit la note (reviewee)
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Note globale (1-5 étoiles)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // Notes détaillées
  ratings: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    objectCondition: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    deliverySpeed: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    reliability: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },

  // Commentaire textuel
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },

  // Tags positifs/négatifs
  tags: [{
    type: String,
    enum: [
      // Tags positifs
      'excellent_communication', 'fast_delivery', 'perfect_condition', 
      'very_reliable', 'friendly', 'professional', 'flexible',
      // Tags neutres
      'as_described', 'standard_delivery', 'good_communication',
      // Tags négatifs  
      'slow_response', 'late_delivery', 'condition_issues', 
      'unreliable', 'difficult_communication'
    ]
  }],

  // Statut de la review
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden', 'disputed'],
    default: 'published'
  },

  // Métadonnées
  isVerified: {
    type: Boolean,
    default: true // Vérifié car basé sur un vrai échange
  },

  // Réponse du reviewee (optionnelle)
  response: {
    content: {
      type: String,
      maxlength: 500,
      trim: true
    },
    submittedAt: Date
  },

  // Signalements de la review
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'fake', 'spam', 'abusive', 'irrelevant']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
      default: 'pending'
    }
  }],

  // Utilité de la review (votes)
  helpfulVotes: {
    helpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    notHelpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index composé pour éviter les doublons de reviews pour un même échange
reviewSchema.index({ trade: 1, reviewer: 1 }, { unique: true });

// Index pour les requêtes fréquentes
reviewSchema.index({ reviewee: 1, status: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ overallRating: 1 });

// Virtual pour calculer le score d'utilité
reviewSchema.virtual('helpfulnessScore').get(function() {
  const helpful = this.helpfulVotes.helpful.length;
  const notHelpful = this.helpfulVotes.notHelpful.length;
  const total = helpful + notHelpful;
  
  if (total === 0) return 0;
  return (helpful / total) * 100;
});

// Virtual pour vérifier si c'est une review récente
reviewSchema.virtual('isRecent').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt > thirtyDaysAgo;
});

// Méthode statique pour calculer la note moyenne d'un utilisateur
reviewSchema.statics.calculateUserRating = async function(userId) {
  const pipeline = [
    { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: 'published' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$overallRating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$overallRating'
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const data = result[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  data.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(data.averageRating * 10) / 10, // Arrondi à 1 décimale
    totalReviews: data.totalReviews,
    ratingDistribution: distribution
  };
};

// Méthode pour vérifier si un utilisateur peut donner une review
reviewSchema.statics.canUserReview = async function(tradeId, reviewerId) {
  // Vérifier si l'échange existe et est terminé
  const Trade = mongoose.model('Trade');
  const trade = await Trade.findById(tradeId);
  
  if (!trade || trade.status !== 'completed') {
    return { can: false, reason: 'Trade not completed' };
  }

  // Vérifier si l'utilisateur fait partie de l'échange
  const isParticipant = trade.requester.toString() === reviewerId.toString() || 
                       trade.owner.toString() === reviewerId.toString();
  
  if (!isParticipant) {
    return { can: false, reason: 'Not a trade participant' };
  }

  // Vérifier si une review n'existe pas déjà
  const existingReview = await this.findOne({ 
    trade: tradeId, 
    reviewer: reviewerId 
  });
  
  if (existingReview) {
    return { can: false, reason: 'Review already exists' };
  }

  return { can: true };
};

// Hook pre-save pour valider les données
reviewSchema.pre('save', function(next) {
  // Calculer la note globale moyenne si pas fournie
  if (!this.overallRating) {
    const { communication, objectCondition, deliverySpeed, reliability } = this.ratings;
    this.overallRating = Math.round((communication + objectCondition + deliverySpeed + reliability) / 4);
  }
  
  next();
});

// Hook post-save pour mettre à jour les stats utilisateur
reviewSchema.post('save', async function(doc) {
  try {
    // Recalculer les stats du reviewee
    const userStats = await this.constructor.calculateUserRating(doc.reviewee);
    
    // Mettre à jour le modèle User
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.reviewee, {
      'tradeStats.averageRating': userStats.averageRating,
      'tradeStats.totalRatings': userStats.totalReviews
    });
  } catch (error) {
    console.error('Erreur mise à jour stats utilisateur:', error);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
