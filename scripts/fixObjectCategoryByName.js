// Script de migration : met à jour le champ category des objets en string vers l'ObjectId correspondant
// selon le nom de la catégorie (si elle existe)

const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';

async function main() {
  await mongoose.connect(MONGODB_URI);

  // Récupère toutes les catégories et fait un mapping nom -> ObjectId
  const categories = await Category.find({});
  const nameToId = {};
  categories.forEach(cat => {
    nameToId[cat.name] = cat._id;
  });

  // Cherche tous les objets dont category est une string
  const objects = await ObjectModel.find({
    $expr: { $eq: [ { $type: "$category" }, "string" ] }
  });

  let updated = 0;
  let notFound = 0;

  for (const obj of objects) {
    const catId = nameToId[obj.category];
    if (catId) {
      await ObjectModel.updateOne({ _id: obj._id }, { $set: { category: catId } });
      updated++;
      console.log(`OK: ${obj._id} | ${obj.title} | category: "${obj.category}" -> ${catId}`);
    } else {
      notFound++;
      console.log(`NON TROUVÉ: ${obj._id} | ${obj.title} | category: "${obj.category}"`);
    }
  }

  console.log(`\nMigration terminée. Objets mis à jour: ${updated}, sans correspondance: ${notFound}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Erreur lors de la migration :', err);
  process.exit(1);
});
