const mongoose = require('mongoose');
const Category = require('./models/Category');

async function showCategories() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    const cats = await Category.find({}, 'name _id').limit(5);
    console.log('Catégories disponibles:');
    cats.forEach(c => console.log(`- ${c.name}: ${c._id}`));
    process.exit();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

showCategories();
