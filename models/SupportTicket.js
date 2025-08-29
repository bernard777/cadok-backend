const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'account', 'payment', 'technical', 'content', 'general'],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'awaiting_response', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  }],
  messages: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number
    }],
    isFromUser: {
      type: Boolean,
      default: true
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  userInfo: {
    pseudo: String,
    city: String,
    subscriptionStatus: String,
    deviceInfo: {
      platform: String,
      version: String,
      model: String,
      systemVersion: String
    },
    appVersion: String,
    connectionType: String
  },
  diagnosticData: {
    networkStatus: String,
    storageInfo: Object,
    performanceMetrics: Object,
    errorLogs: [String],
    lastActions: [String]
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  resolution: {
    solution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    timeToResolve: Number // en minutes
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  escalatedReason: String,
  firstResponseAt: Date,
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour les recherches fréquentes
supportTicketSchema.index({ user: 1, status: 1 });
supportTicketSchema.index({ type: 1, priority: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ ticketNumber: 1 });

// Middleware pour mettre à jour lastActivityAt
supportTicketSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Méthodes d'instance
supportTicketSchema.methods.addMessage = function(fromUser, message, attachments = [], isFromUser = true) {
  this.messages.push({
    from: fromUser,
    message: message.trim(),
    attachments,
    isFromUser,
    createdAt: new Date()
  });

  // Mettre à jour le statut selon qui répond
  if (isFromUser && this.status === 'awaiting_response') {
    this.status = 'in_progress';
  } else if (!isFromUser && this.status === 'open') {
    this.status = 'in_progress';
    if (!this.firstResponseAt) {
      this.firstResponseAt = new Date();
    }
  }

  return this.save();
};

supportTicketSchema.methods.resolve = function(resolvedBy, solution) {
  this.status = 'resolved';
  this.resolution = {
    solution: solution.trim(),
    resolvedBy,
    resolvedAt: new Date(),
    timeToResolve: Math.round((new Date() - this.createdAt) / (1000 * 60)) // en minutes
  };

  return this.save();
};

supportTicketSchema.methods.escalate = function(reason) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.escalatedReason = reason;
  this.priority = 'urgent';

  return this.save();
};

// Méthodes statiques
supportTicketSchema.statics.getStats = async function() {
  const stats = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'resolved' }),
    this.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    this.countDocuments({ priority: 'urgent' }),
    this.aggregate([
      { $match: { status: 'resolved', 'resolution.timeToResolve': { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$resolution.timeToResolve' } } }
    ]),
    this.aggregate([
      { $match: { 'satisfaction.rating': { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$satisfaction.rating' } } }
    ])
  ]);

  return {
    total: stats[0],
    resolved: stats[1],
    active: stats[2],
    urgent: stats[3],
    avgResolutionTime: stats[4][0]?.avgTime || 0,
    avgSatisfaction: stats[5][0]?.avgRating || 0
  };
};

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
