// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  fields: [{ type: String }] // Les champs dynamiques uniques pour cette catégorie
});

module.exports = mongoose.model('Category', CategorySchema);

// La logique de création d'une catégorie avec champs uniques
// À placer dans ton contrôleur, pas ici !
/*
const uniqueFields = Array.from(new Set(req.body.fields));
const category = new CategoryModel({
  name: req.body.name,
  fields: uniqueFields
});
await category.save();
*/