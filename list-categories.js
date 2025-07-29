// Script simple pour lister les catégories
const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

async function listCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const categories = await Category.find();
    console.log('📋 Catégories disponibles:');
    categories.forEach(cat => {
      console.log(`ID: ${cat._id} | Nom: ${cat.name}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listCategories();
