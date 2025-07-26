// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  fields: [{ type: String }] // Les champs attendus pour cette catégorie
});

module.exports = mongoose.model('Category', CategorySchema);