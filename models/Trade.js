const mongoose = require('mongoose');

const TRADE_STATUS = {
  PENDING: 'pending', // Demande envoyée, en attente de sélection d'objet par toUser
  PROPOSED: 'proposed', // Objet proposé par toUser, en attente de validation par fromUser
  ACCEPTED: 'accepted',
  REFUSED: 'refused'
};

const tradeSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who proposes the trade
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // User who receives the trade offer
  offeredObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Object' }],
  requestedObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Object', required: true }],
  status: {
    type: String,
    enum: Object.values(TRADE_STATUS),
    default: TRADE_STATUS.PENDING
  }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
