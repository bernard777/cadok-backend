const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal'],
    required: true
  },
  stripePaymentMethodId: {
    type: String,
    required: false
  },
  cardLast4: {
    type: String,
    required: false
  },
  cardBrand: {
    type: String,
    required: false
  },
  expiryMonth: {
    type: Number,
    required: false
  },
  expiryYear: {
    type: Number,
    required: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
