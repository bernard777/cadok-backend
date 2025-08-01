// Script de diagnostic pour lister les objets dont le champ category est une string
// et vérifier si une catégorie correspondante existe

const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');
const Category = require('../models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';

async function main() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Cherche tous les objets dont category est une string (et pas un ObjectId)
  const objectsWithStringCategory = await ObjectModel.find({
    $expr: { $eq: [ { $type: "$category" }, "string" ] }
  });

  if (objectsWithStringCategory.length === 0) {
    console.log('Aucun objet avec category en string trouvé.');
    process.exit(0);
  }

  console.log(`Objets avec category en string : (${objectsWithStringCategory.length})`);
  for (const obj of objectsWithStringCategory) {
    // Cherche la catégorie correspondante par nom
    const cat = await Category.findOne({ name: obj.category });
    console.log(`- Objet: ${obj._id} | category: "${obj.category}" | Catégorie trouvée: ${cat ? cat._id : 'NON TROUVÉE'}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Erreur lors du diagnostic :', err);
  process.exit(1);
});
