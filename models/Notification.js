/**
 * 🌍 MODÈLE NOTIFICATION - CADOK
 * Stockage des notifications intelligentes
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Types existants
      'location_based',
      'timing_optimal', 
      'urgency',
      'seasonal',
      'engagement',
      'trade_match',
      'price_drop',
      'milestone',
      'trade_request',
      'trade_accepted',
      'system',
      
      // Nouveaux types pour les notifications personnalisées
      'new_message',
      'trade_update',
      'object_interest',
      'community_update',
      'marketing_tips',
      'smart_suggestion'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  trade: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trade' 
  },
  read: {
    type: Boolean,
    default: false
  },
  isRead: { // Backward compatibility
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1, sent: 1 });
notificationSchema.index({ priority: 1, sent: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
