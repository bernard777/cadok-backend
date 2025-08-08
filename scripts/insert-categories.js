require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const Category = require('../models/Category');

// 20 catégories d'objets réellement échangeables - EN FRANÇAIS
const categories = [
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

async function insertCategories() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB');

    console.log('🗑️ Suppression des anciennes catégories...');
    await Category.deleteMany({});
    console.log('✅ Anciennes catégories supprimées');

    console.log('📦 Insertion des nouvelles catégories...');
    
    for (let i = 0; i < categories.length; i++) {
      const categoryData = categories[i];
      const category = new Category(categoryData);
      
      try {
        await category.save();
        console.log(`✅ ${i + 1}/20 - ${categoryData.name} créée avec ${categoryData.fields.length} champs`);
      } catch (error) {
        console.error(`❌ Erreur pour ${categoryData.name}:`, error.message);
      }
    }

    console.log('\n🎉 TOUTES LES CATÉGORIES CRÉÉES !');
    console.log('=' .repeat(50));
    
    // Vérification
    const totalCategories = await Category.countDocuments();
    console.log(`📊 Total en base : ${totalCategories} catégories`);
    
    // Afficher quelques exemples
    const sampleCategories = await Category.find().limit(3);
    console.log('\n📋 Exemples de catégories créées :');
    sampleCategories.forEach(cat => {
      console.log(`• ${cat.name}: [${cat.fields.join(', ')}]`);
    });

    console.log('\n✅ Script terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
}

// Exécuter le script
insertCategories();
