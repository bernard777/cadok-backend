const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: String,
  type: String, // ex: "trade_request", "trade_accepted", etc.
  trade: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Notification', notificationSchema);
