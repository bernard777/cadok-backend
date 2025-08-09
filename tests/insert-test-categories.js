/**
 * 📂 INSERTION CATÉGORIES POUR TESTS AUTH + OBJECTS
 * Script pour s'assurer que les catégories nécessaires existent
 */

const mongoose = require('mongoose');
const { connectToDatabase } = require('../db');

const insertTestCategories = async () => {
  try {
    console.log('📂 Vérification/insertion catégories pour tests...');

    // Connexion à MongoDB
    console.log('⏳ Connexion à MongoDB...');
    await connectToDatabase(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_test');

    const Category = require('../models/Category');

    // Catégories nécessaires pour les tests
    const testCategories = [
      {
        _id: '675bb9c5e7e10c614e5e8e01',
        name: 'Électronique',
        description: 'Appareils et équipements électroniques',
        slug: 'electronique'
      },
      {
        _id: '675bb9c5e7e10c614e5e8e02',  
        name: 'Multimédia',
        description: 'Livres, films, musique, jeux',
        slug: 'multimedia'
      },
      {
        _id: '675bb9c5e7e10c614e5e8e03',
        name: 'Mode & Accessoires',
        description: 'Vêtements, chaussures, bijoux',
        slug: 'mode-accessoires'
      },
      {
        _id: '675bb9c5e7e10c614e5e8e04',
        name: 'Maison & Jardin', 
        description: 'Mobilier, décoration, outils',
        slug: 'maison-jardin'
      },
      {
        _id: '675bb9c5e7e10c614e5e8e05',
        name: 'Sports & Loisirs',
        description: 'Équipements sportifs et loisirs',
        slug: 'sports-loisirs'
      }
    ];

    let inserted = 0;
    let existing = 0;

    for (const categoryData of testCategories) {
      try {
        // Vérifier si la catégorie existe déjà
        const existingCategory = await Category.findById(categoryData._id);
        
        if (!existingCategory) {
          // Créer nouvelle catégorie
          const newCategory = new Category(categoryData);
          await newCategory.save();
          console.log(`✅ Catégorie insérée: ${categoryData.name}`);
          inserted++;
        } else {
          console.log(`👍 Catégorie existante: ${categoryData.name}`);
          existing++;
        }
      } catch (error) {
        console.warn(`⚠️ Erreur catégorie ${categoryData.name}:`, error.message);
      }
    }

    // Vérification finale
    const totalCategories = await Category.countDocuments();
    
    console.log('📊 Résumé catégories:');
    console.log(`   ✨ Nouvelles catégories: ${inserted}`);
    console.log(`   👍 Catégories existantes: ${existing}`);
    console.log(`   📂 Total catégories en base: ${totalCategories}`);

    console.log('✅ Catégories prêtes pour tests AUTH + OBJECTS');

  } catch (error) {
    console.error('❌ Erreur insertion catégories:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Connexion MongoDB fermée');
    }
  }
};

// Exécution directe si appelé en script
if (require.main === module) {
  insertTestCategories()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Échec insertion catégories:', error);
      process.exit(1);
    });
}

module.exports = { insertTestCategories };
