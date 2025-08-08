/**
 * SETUP GLOBAL E2E
 * Configuration globale pour tous les tests E2E
 */

const mongoose = require('mongoose');
const Category = require('../../models/Category');

// Configuration globale avant tous les tests
beforeAll(async () => {
  try {
    // Créer une catégorie par défaut pour les tests si elle n'existe pas
    let defaultCategory = await Category.findOne({ name: 'Test Category' });
    
    if (!defaultCategory) {
      defaultCategory = new Category({
        name: 'Test Category',
        fields: ['title', 'description', 'condition']
      });
      await defaultCategory.save();
      console.log('✅ Catégorie de test créée:', defaultCategory._id);
    }
    
    // Stocker l'ID de la catégorie par défaut dans une variable globale
    global.__DEFAULT_CATEGORY_ID__ = defaultCategory._id.toString();
    
  } catch (error) {
    console.warn('⚠️ Erreur setup global (mode mock possible):', error.message);
    // En mode mock, utiliser un ID factice
    global.__DEFAULT_CATEGORY_ID__ = '000000000000000000000000';
  }
});
