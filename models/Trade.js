const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who proposes the trade
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // User who receives the trade offer
  offeredObject: { type: mongoose.Schema.Types.ObjectId, ref: 'Object', required: true },
  requestedObject: { type: mongoose.Schema.Types.ObjectId, ref: 'Object', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
