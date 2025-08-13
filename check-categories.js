const mongoose = require('mongoose');
const Category = require('./models/Category');

async function checkCategories() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB\n');

    const categories = await Category.find({}).sort({ name: 1 });
    
    console.log(`📦 ${categories.length} catégories trouvées:\n`);
    
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
      console.log(`   Description: ${cat.description || 'Aucune'}`);
      console.log(`   Icône: ${cat.icon || 'Aucune'}`);
      console.log(`   Créé: ${cat.createdAt}`);
      console.log('');
    });

    if (categories.length === 0) {
      console.log('❌ Aucune catégorie trouvée !');
    } else if (categories.length < 10) {
      console.log('⚠️ Nombre de catégories insuffisant. Il devrait y en avoir plus.');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

checkCategories();
