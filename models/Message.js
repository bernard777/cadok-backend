const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  trade: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Message', messageSchema);
