// Script de test pour vérifier la structure des données de l'API
const mongoose = require('mongoose');
const ObjectModel = require(__dirname + '/models/Object');
require('dotenv').config();

async function testFeedData() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer quelques objets avec populate
    const objects = await ObjectModel.find()
      .limit(3)
      .populate('owner', 'pseudo city')
      .populate('category', 'name');
    
    console.log('📄 Exemple d\'objets avec catégories peuplées:');
    objects.forEach((obj, index) => {
      console.log(`\n--- Objet ${index + 1} ---`);
      console.log('Titre:', obj.title);
      console.log('Catégorie (type):', typeof obj.category);
      console.log('Catégorie (valeur):', obj.category);
      if (obj.category && typeof obj.category === 'object') {
        console.log('Catégorie nom:', obj.category.name);
      }
    });

    // Récupérer aussi sans populate pour voir la différence
    const objectsWithoutPopulate = await ObjectModel.find().limit(3);
    console.log('\n📄 Exemple d\'objets SANS catégories peuplées:');
    objectsWithoutPopulate.forEach((obj, index) => {
      console.log(`\n--- Objet ${index + 1} ---`);
      console.log('Titre:', obj.title);
      console.log('Catégorie (type):', typeof obj.category);
      console.log('Catégorie (valeur):', obj.category);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Déconnecté de MongoDB');
    process.exit(0);
  }
}

testFeedData();
