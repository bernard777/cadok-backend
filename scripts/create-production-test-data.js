/**
 * 🧪 CRÉATION DE DONNÉES DE TEST PRODUCTION - CADOK
 * Script pour créer des utilisateurs et données réelles cohérentes
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modèles
const User = require('../models/User');
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');
const Category = require('../models/Category');
const Report = require('../models/Report');

// Configuration base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';

/**
 * Données utilisateurs réalistes
 */
const usersData = [
  {
    pseudo: 'MarieCollectionneuse',
    email: 'marie.lambert@email.com',
    password: 'Password123!',
    firstName: 'Marie',
    lastName: 'Lambert',
    phoneNumber: '0645123789',
    city: 'Paris',
    address: {
      street: '15 Rue de la République',
      zipCode: '75010',
      city: 'Paris',
      country: 'France',
      additionalInfo: '3ème étage',
      isDefault: true
    },
    dateOfBirth: new Date('1992-03-15'),
    subscriptionPlan: 'premium',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    profile: {
      bio: 'Passionnée de vintage et de mode durable. J\'aime donner une seconde vie aux objets.',
      interests: ['Mode', 'Vintage', 'Art'],
      preferredCategories: ['vêtements', 'accessoires', 'art']
    }
  },
  {
    pseudo: 'TechLover_Alex',
    email: 'alexandre.martin@email.com',
    password: 'Password123!',
    firstName: 'Alexandre',
    lastName: 'Martin',
    phoneNumber: '0756234891',
    city: 'Lyon',
    address: {
      street: '42 Avenue de la Technologie',
      zipCode: '69003',
      city: 'Lyon',
      country: 'France',
      additionalInfo: 'Appartement B12',
      isDefault: true
    },
    dateOfBirth: new Date('1988-07-22'),
    subscriptionPlan: 'basic',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    profile: {
      bio: 'Ingénieur informatique, amateur de high-tech et de gadgets. Toujours à la recherche de la dernière innovation.',
      interests: ['Technologie', 'Gaming', 'Innovation'],
      preferredCategories: ['électronique', 'informatique', 'jeux']
    }
  },
  {
    pseudo: 'ClaraBookworm',
    email: 'clara.dubois@email.com',
    password: 'Password123!',
    firstName: 'Clara',
    lastName: 'Dubois',
    phoneNumber: '0634567123',
    city: 'Bordeaux',
    address: {
      street: '8 Rue des Livres',
      zipCode: '33000',
      city: 'Bordeaux',
      country: 'France',
      additionalInfo: 'Rez-de-chaussée',
      isDefault: true
    },
    dateOfBirth: new Date('1995-11-08'),
    subscriptionPlan: 'premium',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    profile: {
      bio: 'Bibliothécaire et grande lectrice. Mon appartement déborde de livres que je partage avec plaisir.',
      interests: ['Littérature', 'Histoire', 'Philosophie'],
      preferredCategories: ['livres', 'art', 'éducation']
    }
  },
  {
    pseudo: 'JulienBricoleur',
    email: 'julien.moreau@email.com',
    password: 'Password123!',
    firstName: 'Julien',
    lastName: 'Moreau',
    phoneNumber: '0698765432',
    city: 'Toulouse',
    address: {
      street: '25 Allée des Artisans',
      zipCode: '31000',
      city: 'Toulouse',
      country: 'France',
      additionalInfo: 'Atelier au fond de la cour',
      isDefault: true
    },
    dateOfBirth: new Date('1985-05-12'),
    subscriptionPlan: 'basic',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    profile: {
      bio: 'Artisan menuisier, je crée et répare tout ce qui est en bois. J\'aime échanger outils et matériaux.',
      interests: ['Bricolage', 'Artisanat', 'Jardinage'],
      preferredCategories: ['outils', 'bricolage', 'jardin']
    }
  },
  {
    pseudo: 'SophieFitness',
    email: 'sophie.garcia@email.com',
    password: 'Password123!',
    firstName: 'Sophie',
    lastName: 'Garcia',
    phoneNumber: '0623456789',
    city: 'Nice',
    address: {
      street: '12 Boulevard du Sport',
      zipCode: '06100',
      city: 'Nice',
      country: 'France',
      additionalInfo: '2ème étage',
      isDefault: true
    },
    dateOfBirth: new Date('1990-09-25'),
    subscriptionPlan: 'premium',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    profile: {
      bio: 'Coach sportive, je prône un mode de vie sain et actif. Toujours prête à échanger du matériel de sport.',
      interests: ['Sport', 'Bien-être', 'Nutrition'],
      preferredCategories: ['sport', 'bien-être', 'santé']
    }
  },
  {
    pseudo: 'MarkusCollector',
    email: 'markus.schmidt@email.com',
    password: 'Password123!',
    firstName: 'Markus',
    lastName: 'Schmidt',
    phoneNumber: '0687654321',
    city: 'Strasbourg',
    address: {
      street: '7 Place des Antiquités',
      zipCode: '67000',
      city: 'Strasbourg',
      country: 'France',
      additionalInfo: 'Maison particulière',
      isDefault: true
    },
    dateOfBirth: new Date('1983-12-03'),
    subscriptionPlan: 'basic',
    verified: false, // Non vérifié pour tester les cas d'erreur
    emailVerified: true,
    phoneVerified: false,
    profile: {
      bio: 'Collectionneur d\'objets vintage et d\'antiquités. Expert en évaluation d\'objets anciens.',
      interests: ['Antiquités', 'Histoire', 'Collection'],
      preferredCategories: ['antiquités', 'collection', 'art']
    }
  }
];

/**
 * Objets réalistes par utilisateur
 */
const objectsData = [
  // Objets de Marie (Mode/Vintage)
  {
    userIndex: 0,
    objects: [
      {
        title: 'Robe vintage années 70',
        description: 'Magnifique robe en parfait état, taille 38. Style bohème chic des années 70.',
        category: 'Vêtements & Mode',
        condition: 'Très bon état',
        imageUrl: 'https://picsum.photos/300/300?random=1',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=1', 
          caption: 'Robe vintage années 70',
          isPrimary: true 
        }],
        tags: ['vintage', 'robe', 'bohème', '70s']
      },
      {
        title: 'Sac à main en cuir vintage',
        description: 'Sac en cuir véritable, fabrication française. Quelques marques d\'usage qui lui donnent du caractère.',
        category: 'Bagagerie & Maroquinerie',
        condition: 'Bon état',
        imageUrl: 'https://picsum.photos/300/300?random=2',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=2', 
          caption: 'Sac à main en cuir vintage',
          isPrimary: true 
        }],
        tags: ['vintage', 'cuir', 'sac', 'français']
      }
    ]
  },
  // Objets d'Alexandre (Tech)
  {
    userIndex: 1,
    objects: [
      {
        title: 'iPhone 12 Pro 128GB',
        description: 'iPhone 12 Pro en excellent état, écran impeccable. Batterie à 89%. Avec chargeur et coque.',
        category: 'Électronique',
        condition: 'Excellent état',
        imageUrl: 'https://picsum.photos/300/300?random=3',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=3', 
          caption: 'iPhone 12 Pro 128GB',
          isPrimary: true 
        }],
        tags: ['iPhone', 'smartphone', 'Apple', '128GB']
      },
      {
        title: 'MacBook Air M1 2020',
        description: 'MacBook Air M1 8GB RAM, 256GB SSD. Utilisé pour développement, très bien entretenu.',
        category: 'Matériel Informatique',
        condition: 'Très bon état',
        imageUrl: 'https://picsum.photos/300/300?random=4',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=4', 
          caption: 'MacBook Air M1 2020',
          isPrimary: true 
        }],
        tags: ['MacBook', 'Apple', 'M1', 'développement']
      }
    ]
  },
  // Objets de Clara (Livres)
  {
    userIndex: 2,
    objects: [
      {
        title: 'Collection Harry Potter complète',
        description: 'Les 7 tomes de Harry Potter en français, éditions Gallimard. Très bon état, quelques marques de lecture.',
        category: 'Livres & BD',
        condition: 'Très bon état',
        imageUrl: 'https://picsum.photos/300/300?random=5',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=5', 
          caption: 'Collection Harry Potter complète',
          isPrimary: true 
        }],
        tags: ['Harry Potter', 'collection', 'Gallimard', 'fantasy']
      },
      {
        title: 'Encyclopédie Universalis (20 volumes)',
        description: 'Encyclopédie complète en 20 volumes, édition 2010. Parfait pour recherches et culture générale.',
        category: 'Livres & BD',
        condition: 'Bon état',
        imageUrl: 'https://picsum.photos/300/300?random=6',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=6', 
          caption: 'Encyclopédie Universalis',
          isPrimary: true 
        }],
        tags: ['encyclopédie', 'référence', 'culture', 'Universalis']
      }
    ]
  },
  // Objets de Julien (Bricolage)
  {
    userIndex: 3,
    objects: [
      {
        title: 'Perceuse-visseuse Bosch Professional',
        description: 'Perceuse-visseuse 18V avec 2 batteries et chargeur. Parfait état de fonctionnement.',
        category: 'Bricolage & Outillage',
        condition: 'Excellent état',
        imageUrl: 'https://picsum.photos/300/300?random=7',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=7', 
          caption: 'Perceuse-visseuse Bosch Professional',
          isPrimary: true 
        }],
        tags: ['Bosch', 'perceuse', 'professionnel', '18V']
      },
      {
        title: 'Établi en bois massif',
        description: 'Établi de menuisier traditionnel en hêtre massif. Fabriqué artisanalement, très stable.',
        category: 'Bricolage & Outillage',
        condition: 'Bon état',
        imageUrl: 'https://picsum.photos/300/300?random=8',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=8', 
          caption: 'Établi en bois massif',
          isPrimary: true 
        }],
        tags: ['établi', 'menuiserie', 'hêtre', 'artisanal']
      }
    ]
  },
  // Objets de Sophie (Sport)
  {
    userIndex: 4,
    objects: [
      {
        title: 'Vélo elliptique Domyos',
        description: 'Vélo elliptique en excellent état, peu utilisé. 16 niveaux de résistance, écran LCD.',
        category: 'Sports & Loisirs',
        condition: 'Excellent état',
        imageUrl: 'https://picsum.photos/300/300?random=9',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=9', 
          caption: 'Vélo elliptique Domyos',
          isPrimary: true 
        }],
        tags: ['elliptique', 'Domyos', 'cardio', 'fitness']
      },
      {
        title: 'Set d\'haltères ajustables 40kg',
        description: 'Paire d\'haltères ajustables de 2,5kg à 20kg chacun. Parfait pour entraînement à domicile.',
        category: 'Sports & Loisirs',
        condition: 'Très bon état',
        imageUrl: 'https://picsum.photos/300/300?random=10',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=10', 
          caption: 'Set d\'haltères ajustables 40kg',
          isPrimary: true 
        }],
        tags: ['haltères', 'musculation', 'ajustable', '40kg']
      }
    ]
  },
  // Objets de Markus (Collection)
  {
    userIndex: 5,
    objects: [
      {
        title: 'Montre mécanique vintage 1960',
        description: 'Montre mécanique suisse des années 60, mouvement manuel. Révisée récemment, fonctionne parfaitement.',
        category: 'Art & Objets de Collection',
        condition: 'Excellent état',
        imageUrl: 'https://picsum.photos/300/300?random=11',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=11', 
          caption: 'Montre mécanique vintage 1960',
          isPrimary: true 
        }],
        tags: ['vintage', 'montre', 'mécanique', 'suisse']
      },
      {
        title: 'Appareil photo argentique Canon AE-1',
        description: 'Légendaire Canon AE-1 avec objectif 50mm f/1.4. État de collection, tout fonctionne parfaitement.',
        category: 'Art & Objets de Collection',
        condition: 'Excellent état',
        imageUrl: 'https://picsum.photos/300/300?random=12',
        images: [{ 
          url: 'https://picsum.photos/300/300?random=12', 
          caption: 'Appareil photo argentique Canon AE-1',
          isPrimary: true 
        }],
        tags: ['Canon', 'argentique', 'AE-1', 'collection']
      }
    ]
  }
];

/**
 * Création des échanges réalistes
 */
async function createRealisticTrades(users, objects) {
  console.log('📝 Création des échanges réalistes...');
  
  // Fonction helper pour trouver un objet par titre
  const findObjectByTitle = (titleSubstring) => {
    const found = objects.find(obj => obj.title.toLowerCase().includes(titleSubstring.toLowerCase()));
    if (!found) {
      console.log(`⚠️ Objet non trouvé pour: ${titleSubstring}`);
      console.log('Objets disponibles:', objects.map(o => o.title));
    }
    return found;
  };

  const trades = [
    // Échange en cours : Marie veut l'iPhone d'Alexandre contre sa robe vintage
    {
      fromUser: users[0]._id, // Marie
      toUser: users[1]._id,   // Alexandre
      requestedObjects: [findObjectByTitle('iPhone')._id],
      offeredObjects: [findObjectByTitle('Robe vintage')._id],
      status: 'proposed',
      message: 'Salut ! Ton iPhone m\'intéresse beaucoup. Je propose ma robe vintage années 70 en échange ?'
    },
    
    // Échange accepté : Clara échange ses livres Harry Potter contre l'établi de Julien
    {
      fromUser: users[2]._id, // Clara
      toUser: users[3]._id,   // Julien
      requestedObjects: [findObjectByTitle('Établi')._id],
      offeredObjects: [findObjectByTitle('Harry Potter')._id],
      status: 'accepted',
      message: 'Mon fils commence à bricoler, ton établi serait parfait !',
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Il y a 2 jours
    },
    
    // Échange terminé : Sophie a échangé ses haltères contre la montre de Markus
    {
      fromUser: users[4]._id, // Sophie
      toUser: users[5]._id,   // Markus
      requestedObjects: [findObjectByTitle('Montre')._id],
      offeredObjects: [findObjectByTitle('haltères')._id],
      status: 'completed',
      message: 'Cette montre vintage m\'intéresse énormément !',
      acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
      ratings: {
        fromUserRating: { score: 5, comment: 'Échange parfait, montre magnifique !' },
        toUserRating: { score: 5, comment: 'Matériel de sport en parfait état, merci !' }
      }
    },
    
    // Échange avec litige : MacBook contre vélo elliptique
    {
      fromUser: users[1]._id, // Alexandre
      toUser: users[4]._id,   // Sophie
      requestedObjects: [findObjectByTitle('elliptique')._id],
      offeredObjects: [findObjectByTitle('MacBook')._id],
      status: 'disputed',
      message: 'Ton vélo elliptique contre mon MacBook ?',
      acceptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      dispute: {
        reason: 'L\'objet reçu ne correspond pas à la description',
        reportedBy: users[1]._id, // Alexandre
        reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Le vélo elliptique présente des dysfonctionnements non mentionnés dans la description.'
      }
    },
    
    // Échange annulé
    {
      fromUser: users[3]._id, // Julien
      toUser: users[0]._id,   // Marie
      requestedObjects: [findObjectByTitle('Sac')._id],
      offeredObjects: [findObjectByTitle('Perceuse')._id],
      status: 'cancelled',
      message: 'Intéressé par ton sac vintage',
      cancelledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      cancellationReason: 'L\'utilisateur a changé d\'avis'
    }
  ];

  const createdTrades = [];
  for (const tradeData of trades) {
    // Vérifier que tous les objets existent
    const hasValidObjects = tradeData.requestedObjects.every(id => id) && tradeData.offeredObjects.every(id => id);
    
    if (!hasValidObjects) {
      console.log('⚠️ Échange ignoré car objets manquants:', tradeData.message);
      continue;
    }

    const trade = new Trade(tradeData);
    await trade.save();
    createdTrades.push(trade);
    console.log(`✅ Échange créé: ${tradeData.status}`);
  }

  return createdTrades;
}

/**
 * Création des signalements
 */
async function createReports(users, objects, trades) {
  console.log('🚨 Création des signalements...');
  
  // Fonction helper pour trouver un objet par titre
  const findObjectByTitle = (titleSubstring) => {
    return objects.find(obj => obj.title.toLowerCase().includes(titleSubstring.toLowerCase()));
  };
  
  const reports = [
    {
      reporter: users[1]._id, // Alexandre
      reportedUser: users[4]._id, // Sophie
      reportedObject: findObjectByTitle('elliptique')._id,
      relatedTrade: trades.find(t => t.status === 'disputed')._id,
      type: 'misleading_description',
      reason: 'Description non conforme',
      description: 'L\'objet présente des défauts importants non mentionnés dans la description. Le vélo fait du bruit et plusieurs fonctions ne marchent pas.',
      status: 'pending',
      evidence: [
        { type: 'image', url: 'https://picsum.photos/400/300?random=100', description: 'Photo du défaut' },
        { type: 'video', url: 'https://example.com/video-defaut.mp4', description: 'Vidéo du dysfonctionnement' }
      ]
    },
    {
      reporter: users[2]._id, // Clara
      reportedUser: users[5]._id, // Markus (non vérifié)
      reportedObject: findObjectByTitle('Canon')._id,
      type: 'suspicious_behavior',
      reason: 'Comportement suspect',
      description: 'L\'utilisateur demande un paiement en plus de l\'échange, ce qui va contre les règles de la plateforme.',
      status: 'pending',
      evidence: [
        { type: 'screenshot', url: 'https://picsum.photos/400/300?random=101', description: 'Capture d\'écran de la conversation' }
      ]
    }
  ];

  const createdReports = [];
  for (const reportData of reports) {
    const report = new Report(reportData);
    await report.save();
    createdReports.push(report);
    console.log(`✅ Signalement créé: ${reportData.type}`);
  }

  return createdReports;
}

/**
 * Script principal
 */
async function createProductionTestData() {
  try {
    console.log('🚀 Démarrage de la création de données de test production...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Vérifier les catégories existantes
    const categories = await Category.find();
    if (categories.length === 0) {
      console.log('⚠️ Aucune catégorie trouvée. Veuillez d\'abord exécuter insert-categories.js');
      return;
    }

    // Créer les utilisateurs
    console.log('👥 Création des utilisateurs...');
    const createdUsers = [];
    
    for (const userData of usersData) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ Utilisateur ${userData.pseudo} existe déjà, passage au suivant...`);
        createdUsers.push(existingUser);
        continue;
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Créer l'utilisateur
      const user = new User({
        ...userData,
        password: hashedPassword,
        avatar: `https://picsum.photos/150/150?random=${createdUsers.length + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Entre maintenant et 90 jours
        lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Dans les 7 derniers jours
        tradeStats: {
          totalTrades: 0,
          completedTrades: 0,
          successRate: 0,
          avgRating: 0,
          totalRatings: 0
        }
      });

      await user.save();
      createdUsers.push(user);
      console.log(`✅ Utilisateur créé: ${userData.pseudo} (${userData.email})`);
    }

    // Créer les objets
    console.log('📦 Création des objets...');
    const allObjects = [];
    
    for (const userObjects of objectsData) {
      const user = createdUsers[userObjects.userIndex];
      
      for (const objectData of userObjects.objects) {
        // Trouver la catégorie
        const category = categories.find(cat => 
          cat.name.toLowerCase().includes(objectData.category.toLowerCase()) ||
          objectData.category.toLowerCase().includes(cat.name.toLowerCase())
        );

        if (!category) {
          console.log(`⚠️ Catégorie non trouvée pour: ${objectData.category}`);
          continue;
        }

        const object = new ObjectModel({
          ...objectData,
          owner: user._id,
          category: category._id,
          status: 'available',
          location: {
            city: user.city,
            postalCode: user.address.zipCode
          },
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Derniers 30 jours
          viewsCount: Math.floor(Math.random() * 100) + 10,
          favoritesCount: Math.floor(Math.random() * 20)
        });

        await object.save();
        allObjects.push(object);
        console.log(`✅ Objet créé: ${objectData.title} pour ${user.pseudo}`);
      }
    }

    // Créer les échanges
    const trades = await createRealisticTrades(createdUsers, allObjects);

    // Mettre à jour les stats des utilisateurs
    console.log('📊 Mise à jour des statistiques utilisateurs...');
    for (const user of createdUsers) {
      const userTrades = trades.filter(t => 
        t.fromUser.toString() === user._id.toString() || 
        t.toUser.toString() === user._id.toString()
      );
      
      const completedTrades = userTrades.filter(t => t.status === 'completed');
      
      await User.findByIdAndUpdate(user._id, {
        'tradeStats.totalTrades': userTrades.length,
        'tradeStats.completedTrades': completedTrades.length,
        'tradeStats.successRate': userTrades.length > 0 ? (completedTrades.length / userTrades.length) * 100 : 0
      });
    }

    // Créer les signalements
    await createReports(createdUsers, allObjects, trades);

    console.log('\n🎉 DONNÉES DE TEST CRÉÉES AVEC SUCCÈS !');
    console.log('📊 Résumé:');
    console.log(`   👥 Utilisateurs: ${createdUsers.length}`);
    console.log(`   📦 Objets: ${allObjects.length}`);
    console.log(`   🔄 Échanges: ${trades.length}`);
    console.log(`   🚨 Signalements: 2`);
    
    console.log('\n🔑 Comptes administrateurs pour tests:');
    console.log('   📧 marie.lambert@email.com | Password123! (Premium)');
    console.log('   📧 alexandre.martin@email.com | Password123! (Free)');
    console.log('   📧 clara.dubois@email.com | Password123! (Premium)');

  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  createProductionTestData();
}

module.exports = { createProductionTestData };
