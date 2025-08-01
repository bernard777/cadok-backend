// Script pour supprimer tous les objets de la collection Object
const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const result = await ObjectModel.deleteMany({});
  console.log(`Objets supprimés : ${result.deletedCount}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Erreur lors de la suppression :', err);
  process.exit(1);
});
