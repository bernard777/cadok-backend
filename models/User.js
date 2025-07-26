const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pseudo: { type: String, required: true },
  avatar: { type: String, default: '' },
  city: { type: String, required: true },
  favoriteCategories: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
