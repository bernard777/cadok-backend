/**
 * Modèle Journal de Sécurité
 */

const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
  action: { 
    type: String, 
    required: true,
    enum: [
      'LOGIN_ATTEMPT',
      'LOGIN_SUCCESS', 
      'LOGIN_FAILED',
      'PASSWORD_CHANGE',
      'TRADE_CREATED',
      'TRADE_ACCEPTED',
      'PAYMENT_ATTEMPT',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'SUSPICIOUS_ACTIVITY',
      'ACCOUNT_LOCKED',
      'DATA_ACCESS',
      'EXPORT_REQUEST',
      'DELETION_REQUEST'
    ]
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  isSuccessful: { type: Boolean, default: true },
  metadata: {
    browser: { type: String },
    os: { type: String },
    device: { type: String },
    location: {
      country: { type: String },
      city: { type: String },
      latitude: { type: Number },
      longitude: { type: Number }
    }
  }
}, {
  timestamps: true
});

// Index pour performance
securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ action: 1, createdAt: -1 });
securityLogSchema.index({ severity: 1, createdAt: -1 });
securityLogSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
