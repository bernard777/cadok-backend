const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');

// Remplace par l'URL de ta base MongoDB
const MONGO_URI = 'mongodb://127.0.0.1:27017/cadok';

async function fixOwners() {
  await mongoose.connect(MONGO_URI);

  const objects = await ObjectModel.find({});

  let count = 0;
  for (const obj of objects) {
    if (obj.owner && typeof obj.owner === 'object' && obj.owner._id) {
      obj.owner = obj.owner._id;
      await obj.save();
      count++;
    }
  }

  console.log(`Correction terminée. ${count} objets modifiés.`);
  mongoose.disconnect();
}

fixOwners().catch(err => {
  console.error('Erreur lors de la correction:', err);
  mongoose.disconnect();
});