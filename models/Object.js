const mongoose = require('mongoose');

const objectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  imageUrl: { type: String },
  status: { type: String, enum: ['disponible', 'échangé'], default: 'disponible' }, // ou 'échangé'
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Object', objectSchema);
