const mongoose = require('mongoose');

const ObjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['disponible', 'échangé', 'réservé'],
    default: 'disponible'
  }
}, { timestamps: true });

module.exports = mongoose.model('Object', ObjectSchema);
