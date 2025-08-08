const mongoose = require('mongoose');

const ObjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  imageUrl: { type: String }, // Gardé pour compatibilité descendante
  images: [{ 
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false }
  }],
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  estimatedValue: { type: Number, default: 0, min: 0 }, // Valeur estimée (positive)
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['available', 'traded', 'reserved'],
    default: 'available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Object', ObjectSchema);
