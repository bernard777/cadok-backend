const Category = require('../models/Category');

// 20 catégories d'objets réellement échangeables - EN FRANÇAIS
const defaultCategories = [
  {
    name: 'Électronique',
    fields: ['marque', 'modèle', 'état', 'stockage', 'couleur', 'garantie', 'accessoires']
  },
  {
    name: 'Vêtements & Mode',
    fields: ['taille', 'marque', 'couleur', 'matière', 'état', 'genre', 'saison']
  },
  {
    name: 'Livres & BD',
    fields: ['auteur', 'éditeur', 'état', 'langue', 'genre', 'édition', 'isbn']
  },
  {
    name: 'Sports & Loisirs',
    fields: ['sport', 'marque', 'taille', 'état', 'matière', 'niveau', 'accessoires']
  },
  {
    name: 'Maison & Décoration',
    fields: ['pièce', 'matière', 'état', 'couleur', 'dimensions', 'style', 'marque']
  },
  {
    name: 'Jouets & Jeux',
    fields: ['tranche_âge', 'marque', 'état', 'type', 'matière', 'joueurs', 'éducatif']
  },
  {
    name: 'Instruments de Musique',
    fields: ['instrument', 'marque', 'état', 'niveau', 'accessoires', 'vintage', 'étui']
  },
  {
    name: 'Vélos & Trottinettes',
    fields: ['type', 'marque', 'état', 'taille', 'vitesses', 'électrique', 'accessoires']
  },
  {
    name: 'Beauté & Parfums',
    fields: ['marque', 'type', 'contenance', 'neuf_scellé', 'état', 'genre', 'parfum']
  },
  {
    name: 'Bijoux & Montres',
    fields: ['type', 'matière', 'marque', 'état', 'taille', 'style', 'authentique']
  },
  {
    name: 'Art & Objets de Collection',
    fields: ['type', 'époque', 'état', 'dimensions', 'signé', 'authentique', 'rareté']
  },
  {
    name: 'Jeux Vidéo & Consoles',
    fields: ['plateforme', 'état', 'genre', 'langue', 'complet', 'année', 'multijoueur']
  },
  {
    name: 'DVD & Blu-ray',
    fields: ['format', 'genre', 'état', 'langue', 'sous_titres', 'année', 'édition']
  },
  {
    name: 'Électroménager',
    fields: ['type', 'marque', 'état', 'capacité', 'puissance', 'garantie', 'classe_énergie']
  },
  {
    name: 'Puériculture & Bébé',
    fields: ['type', 'marque', 'état', 'âge_min', 'âge_max', 'sécurité', 'évolutif']
  },
  {
    name: 'Jardin & Plein Air',
    fields: ['type', 'matière', 'état', 'dimensions', 'saison', 'marque', 'entretien']
  },
  {
    name: 'Bricolage & Outillage',
    fields: ['type', 'marque', 'état', 'électrique', 'professionnel', 'accessoires', 'garantie']
  },
  {
    name: 'Cuisine & Arts de la Table',
    fields: ['type', 'matière', 'marque', 'état', 'capacité', 'lave_vaisselle', 'set']
  },
  {
    name: 'Bagagerie & Maroquinerie',
    fields: ['type', 'marque', 'matière', 'couleur', 'état', 'dimensions', 'authentique']
  },
  {
    name: 'Matériel Informatique',
    fields: ['type', 'marque', 'modèle', 'état', 'compatibilité', 'garantie', 'accessoires']
  }
];

/**
 * Initialise les catégories par défaut si elles n'existent pas
 * @returns {Promise<void>}
 */
async function initializeCategories() {
  try {
    // Vérifier si des catégories existent déjà en nombre suffisant
    const existingCategoriesCount = await Category.countDocuments();
    const expectedCategoriesCount = defaultCategories.length;
    
    if (existingCategoriesCount >= expectedCategoriesCount) {
      console.log(`📦 [CATEGORIES] ${existingCategoriesCount} catégories déjà présentes - initialisation ignorée`);
      return;
    } else if (existingCategoriesCount > 0) {
      console.log(`⚠️ [CATEGORIES] ${existingCategoriesCount} catégories trouvées, mais ${expectedCategoriesCount} attendues - réinitialisation nécessaire`);
      console.log('🔄 [CATEGORIES] Utilisation du script: node scripts/manage-categories.js reset');
      return;
    }

    console.log('📦 [CATEGORIES] Aucune catégorie trouvée - initialisation en cours...');
    
    // Insérer les catégories par défaut
    let successCount = 0;
    let errorCount = 0;

    for (const categoryData of defaultCategories) {
      try {
        const category = new Category(categoryData);
        await category.save();
        successCount++;
        console.log(`✅ [CATEGORIES] ${categoryData.name} créée (${categoryData.fields.length} champs)`);
      } catch (error) {
        errorCount++;
        console.error(`❌ [CATEGORIES] Erreur pour ${categoryData.name}:`, error.message);
      }
    }

    console.log(`🎉 [CATEGORIES] Initialisation terminée: ${successCount} créées, ${errorCount} erreurs`);
    
    // Vérification finale
    const finalCount = await Category.countDocuments();
    console.log(`📊 [CATEGORIES] Total en base: ${finalCount} catégories disponibles`);

  } catch (error) {
    console.error('❌ [CATEGORIES] Erreur lors de l\'initialisation:', error.message);
    throw error;
  }
}

/**
 * Force la réinitialisation complète des catégories (supprime tout et recrée)
 * @returns {Promise<void>}
 */
async function reinitializeCategories() {
  try {
    console.log('🗑️ [CATEGORIES] Suppression des catégories existantes...');
    const deletedCount = await Category.deleteMany({});
    console.log(`✅ [CATEGORIES] ${deletedCount.deletedCount} catégories supprimées`);

    console.log('📦 [CATEGORIES] Recréation des catégories...');
    
    let successCount = 0;
    for (const categoryData of defaultCategories) {
      try {
        const category = new Category(categoryData);
        await category.save();
        successCount++;
      } catch (error) {
        console.error(`❌ [CATEGORIES] Erreur pour ${categoryData.name}:`, error.message);
      }
    }

    console.log(`🎉 [CATEGORIES] Réinitialisation terminée: ${successCount}/${defaultCategories.length} catégories créées`);
    
  } catch (error) {
    console.error('❌ [CATEGORIES] Erreur lors de la réinitialisation:', error.message);
    throw error;
  }
}

module.exports = {
  initializeCategories,
  reinitializeCategories,
  defaultCategories
};
