// Script de migration : remplace les valeurs string du champ category par l'ObjectId correspondant
// Usage : node scripts/fixObjectCategoryField.js

const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cadok';

async function migrateCategories() {
  await mongoose.connect(MONGO_URI);
  const objects = await ObjectModel.find({});
  let updated = 0;
  for (const obj of objects) {
    if (typeof obj.category === 'string' && obj.category.length > 0 && !mongoose.Types.ObjectId.isValid(obj.category)) {
      // Cherche la catégorie par nom
      const cat = await Category.findOne({ name: obj.category });
      if (cat) {
        obj.category = cat._id;
        await obj.save();
        updated++;
        console.log(`✔️ Objet ${obj._id} migré vers catégorie ${cat.name}`);
      } else {
        console.warn(`❌ Catégorie '${obj.category}' introuvable pour l'objet ${obj._id}`);
      }
    }
  }
  console.log(`Migration terminée. Objets mis à jour : ${updated}`);
  await mongoose.disconnect();
}

migrateCategories().catch(err => {
  console.error('Erreur de migration :', err);
  process.exit(1);
});
