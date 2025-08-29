const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['general', 'account', 'trading', 'payment', 'technical', 'security'],
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
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
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  language: {
    type: String,
    default: 'fr',
    enum: ['fr', 'en']
  },
  relatedFAQs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index pour les recherches
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ order: 1, createdAt: -1 });
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

// Méthodes d'instance
faqSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

faqSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulUsers.includes(userId)) {
    this.helpfulUsers.push(userId);
    this.helpfulCount = this.helpfulUsers.length;
    return this.save();
  }
  return Promise.resolve(this);
};

// Méthodes statiques
faqSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ viewCount: -1, helpfulCount: -1 })
    .limit(limit);
};

faqSchema.statics.searchFAQs = function(searchTerm, category = null) {
  const query = {
    isActive: true,
    $text: { $search: searchTerm }
  };

  if (category && category !== 'all') {
    query.category = category;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ;
