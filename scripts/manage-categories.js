require('dotenv').config();
const mongoose = require('mongoose');
const { initializeCategories, reinitializeCategories } = require('../utils/initCategories');
const Category = require('../models/Category');

const command = process.argv[2];

async function main() {
  try {
    console.log('🔗 [CATEGORIES] Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ [CATEGORIES] Connecté à MongoDB');

    switch (command) {
      case 'init':
        console.log('📦 [CATEGORIES] Initialisation des catégories...');
        await initializeCategories();
        break;
        
      case 'reset':
        console.log('🔄 [CATEGORIES] Réinitialisation complète des catégories...');
        await reinitializeCategories();
        break;
        
      case 'count':
        const count = await Category.countDocuments();
        console.log(`📊 [CATEGORIES] Nombre de catégories en base: ${count}`);
        break;
        
      case 'list':
        const categories = await Category.find({}, 'name fields').sort({ name: 1 });
        console.log('📋 [CATEGORIES] Liste des catégories:');
        categories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.name} (${cat.fields.length} champs)`);
        });
        break;
        
      default:
        console.log('🛠️ [CATEGORIES] Usage:');
        console.log('  node scripts/manage-categories.js init   - Initialise si vide');
        console.log('  node scripts/manage-categories.js reset  - Supprime et recrée tout');
        console.log('  node scripts/manage-categories.js count  - Compte les catégories');
        console.log('  node scripts/manage-categories.js list   - Liste les catégories');
        break;
    }
    
  } catch (error) {
    console.error('❌ [CATEGORIES] Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 [CATEGORIES] Connexion fermée');
    process.exit(0);
  }
}

main();
