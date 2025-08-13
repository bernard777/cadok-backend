/**
 * 🚀 SCRIPT COMPLET DE CRÉATION DE DONNÉES DE TEST - CADOK PRODUCTION
 * Création d'utilisateurs, objets et échanges cohérents avec le système actuel
 * 
 * Fonctionnalités :
 * - Utilisateur super admin avec email spécifié
 * - Utilisateurs de test réalistes avec différents statuts
 * - Objets variés avec géolocalisation
 * - Échanges dans tous les états possibles
 * - Système d'évaluations et signalements
 * - Compatible avec le système de sécurité et livraisons
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

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';

/**
 * 🦸‍♂️ CRÉATION DU SUPER ADMIN
 */
async function createSuperAdmin() {
  console.log('🦸‍♂️ Création du Super Admin...');
  
  const superAdminEmail = 'ndongoambassa7@gmail.com';
  
  // Vérifier si le super admin existe déjà
  const existingAdmin = await User.findOne({ email: superAdminEmail });
  if (existingAdmin) {
    console.log(`✅ Super Admin ${superAdminEmail} existe déjà`);
    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash('SuperAdmin2024!', 12);
  
  const superAdmin = new User({
    pseudo: 'SuperAdminKadoc',
    email: superAdminEmail,
    password: hashedPassword,
    firstName: 'Super',
    lastName: 'Administrateur',
    phoneNumber: '+33612345678',
    city: 'Nantes',
    address: {
      street: '1 Avenue des Administrateurs',
      zipCode: '44000',
      city: 'Nantes',
      country: 'France',
      additionalInfo: 'Centre de commande CADOK',
      isDefault: true,
      coordinates: [-1.5534, 47.2184], // Nantes
      precision: 'exact'
    },
    dateOfBirth: new Date('1985-01-01'),
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    
    // 🛡️ PERMISSIONS MAXIMALES
    role: 'super_admin',
    isAdmin: true,
    adminPermissions: {
      manageEvents: true,
      createEvents: true,
      moderateEvents: true,
      manageUsers: true,
      banUsers: true,
      viewUserDetails: true,
      manageTrades: true,
      approveTrades: true,
      resolveDisputes: true,
      moderateContent: true,
      deleteReports: true,
      manageReports: true,
      viewAnalytics: true,
      systemConfig: true,
      manageAdmins: true
    },
    adminActivatedAt: new Date(),
    
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
    
    profile: {
      bio: 'Super Administrateur CADOK - Responsable de la plateforme et de la communauté.',
      interests: ['Administration', 'Sécurité', 'Développement'],
      preferredCategories: []
    },
    
    tradeStats: {
      totalTrades: 50,
      completedTrades: 45,
      successRate: 90,
      avgRating: 4.9,
      totalRatings: 25
    },
    
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Créé il y a 1 an
    lastLoginAt: new Date()
  });

  await superAdmin.save();
  console.log(`✅ Super Admin créé: ${superAdminEmail}`);
  console.log(`🔑 Mot de passe: SuperAdmin2024!`);
  
  return superAdmin;
}

/**
 * 👥 UTILISATEURS DE TEST DIVERSIFIÉS
 */
const testUsersData = [
  {
    pseudo: 'MarieCollectionneuse',
    email: 'marie.test@cadok.app',
    password: 'Marie2024!',
    firstName: 'Marie',
    lastName: 'Lambert',
    phoneNumber: '+33645123789',
    city: 'Paris',
    address: {
      street: '15 Rue de la République',
      zipCode: '75010',
      city: 'Paris',
      country: 'France',
      additionalInfo: '3ème étage',
      isDefault: true,
      coordinates: [2.3522, 48.8566],
      precision: 'approximate'
    },
    dateOfBirth: new Date('1992-03-15'),
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    role: 'user',
    profile: {
      bio: 'Passionnée de vintage et de mode durable. J\'aime donner une seconde vie aux objets.',
      interests: ['Mode', 'Vintage', 'Art'],
      preferredCategories: []
    }
  },
  {
    pseudo: 'TechLover_Alex',
    email: 'alex.tech@cadok.app',
    password: 'Tech2024!',
    firstName: 'Alexandre',
    lastName: 'Martin',
    phoneNumber: '+33756234891',
    city: 'Lyon',
    address: {
      street: '42 Avenue de la Technologie',
      zipCode: '69003',
      city: 'Lyon',
      country: 'France',
      additionalInfo: 'Appartement B12',
      isDefault: true,
      coordinates: [4.8357, 45.7640],
      precision: 'exact'
    },
    dateOfBirth: new Date('1988-07-22'),
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    role: 'user',
    profile: {
      bio: 'Ingénieur informatique, amateur de high-tech et de gadgets.',
      interests: ['Technologie', 'Gaming', 'Innovation'],
      preferredCategories: []
    }
  },
  {
    pseudo: 'ClaraBookworm',
    email: 'clara.books@cadok.app',
    password: 'Books2024!',
    firstName: 'Clara',
    lastName: 'Dubois',
    phoneNumber: '+33634567123',
    city: 'Bordeaux',
    address: {
      street: '8 Rue des Livres',
      zipCode: '33000',
      city: 'Bordeaux',
      country: 'France',
      additionalInfo: 'Rez-de-chaussée',
      isDefault: true,
      coordinates: [-0.5792, 44.8378],
      precision: 'approximate'
    },
    dateOfBirth: new Date('1995-11-08'),
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    role: 'moderator',
    isAdmin: true,
    adminPermissions: {
      moderateContent: true,
      manageReports: true,
      viewAnalytics: true
    },
    profile: {
      bio: 'Modératrice et bibliothécaire. Mon appartement déborde de livres que je partage avec plaisir.',
      interests: ['Littérature', 'Histoire', 'Philosophie'],
      preferredCategories: []
    }
  },
  {
    pseudo: 'JulienBricoleur',
    email: 'julien.bricoleur@cadok.app',
    password: 'Bricolage2024!',
    firstName: 'Julien',
    lastName: 'Moreau',
    phoneNumber: '+33698765432',
    city: 'Toulouse',
    address: {
      street: '25 Allée des Artisans',
      zipCode: '31000',
      city: 'Toulouse',
      country: 'France',
      additionalInfo: 'Atelier au fond de la cour',
      isDefault: true,
      coordinates: [1.4442, 43.6047],
      precision: 'exact'
    },
    dateOfBirth: new Date('1985-05-12'),
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    verified: true,
    emailVerified: true,
    phoneVerified: false, // Téléphone non vérifié pour test
    role: 'user',
    profile: {
      bio: 'Artisan menuisier, je crée et répare tout ce qui est en bois.',
      interests: ['Bricolage', 'Artisanat', 'Jardinage'],
      preferredCategories: []
    }
  },
  {
    pseudo: 'SophieFitness',
    email: 'sophie.sport@cadok.app',
    password: 'Sport2024!',
    firstName: 'Sophie',
    lastName: 'Garcia',
    phoneNumber: '+33623456789',
    city: 'Nice',
    address: {
      street: '12 Boulevard du Sport',
      zipCode: '06100',
      city: 'Nice',
      country: 'France',
      additionalInfo: '2ème étage',
      isDefault: true,
      coordinates: [7.2619, 43.7102],
      precision: 'approximate'
    },
    dateOfBirth: new Date('1990-09-25'),
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    role: 'user',
    profile: {
      bio: 'Coach sportive, je prône un mode de vie sain et actif.',
      interests: ['Sport', 'Bien-être', 'Nutrition'],
      preferredCategories: []
    }
  },
  {
    pseudo: 'MarkusCollector',
    email: 'markus.collector@cadok.app',
    password: 'Collection2024!',
    firstName: 'Markus',
    lastName: 'Schmidt',
    phoneNumber: '+33687654321',
    city: 'Strasbourg',
    address: {
      street: '7 Place des Antiquités',
      zipCode: '67000',
      city: 'Strasbourg',
      country: 'France',
      additionalInfo: 'Maison particulière',
      isDefault: true,
      coordinates: [7.7521, 48.5734],
      precision: 'city_only'
    },
    dateOfBirth: new Date('1983-12-03'),
    subscriptionPlan: 'basic',
    subscriptionStatus: 'inactive', // Abonnement expiré pour test
    verified: false, // Non vérifié pour test
    emailVerified: true,
    phoneVerified: false,
    role: 'user',
    profile: {
      bio: 'Collectionneur d\'objets vintage et d\'antiquités.',
      interests: ['Antiquités', 'Histoire', 'Collection'],
      preferredCategories: []
    }
  },
  {
    pseudo: 'EmmaCreative',
    email: 'emma.creative@cadok.app',
    password: 'Creative2024!',
    firstName: 'Emma',
    lastName: 'Rousseau',
    phoneNumber: '+33612987654',
    city: 'Rennes',
    address: {
      street: '9 Rue de l\'Art',
      zipCode: '35000',
      city: 'Rennes',
      country: 'France',
      additionalInfo: 'Atelier créatif',
      isDefault: true,
      coordinates: [-1.6778, 48.1173],
      precision: 'exact'
    },
    dateOfBirth: new Date('1993-06-18'),
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    verified: true,
    emailVerified: true,
    phoneVerified: true,
    role: 'user',
    profile: {
      bio: 'Artiste et créatrice, j\'adore les projets DIY et l\'upcycling.',
      interests: ['Art', 'DIY', 'Écologie'],
      preferredCategories: []
    }
  }
];

/**
 * 📦 OBJETS RÉALISTES PAR UTILISATEUR
 */
const objectsData = [
  // Objets du Super Admin
  {
    userIndex: 0, // Super Admin
    objects: [
      {
        title: 'Guide d\'utilisation CADOK Premium',
        description: 'Guide complet pour maximiser votre expérience CADOK. Conseils, astuces et bonnes pratiques.',
        category: 'Livres & BD',
        condition: 'Neuf',
        tags: ['guide', 'CADOK', 'premium', 'conseils']
      },
      {
        title: 'Kit de démarrage Écologique',
        description: 'Kit complet pour débuter dans l\'économie circulaire : sacs réutilisables, contenants, guides.',
        category: 'Maison & Décoration',
        condition: 'Neuf',
        tags: ['écologie', 'starter', 'réutilisable', 'environnement']
      }
    ]
  },
  // Objets de Marie (Mode/Vintage)
  {
    userIndex: 1,
    objects: [
      {
        title: 'Robe vintage années 70',
        description: 'Magnifique robe en parfait état, taille 38. Style bohème chic des années 70 avec motifs floraux.',
        category: 'Vêtements & Mode',
        condition: 'Très bon état',
        tags: ['vintage', 'robe', 'bohème', '70s', 'taille38']
      },
      {
        title: 'Sac à main en cuir vintage',
        description: 'Sac en cuir véritable, fabrication française. Quelques marques d\'usage qui lui donnent du caractère.',
        category: 'Bagagerie & Maroquinerie',
        condition: 'Bon état',
        tags: ['vintage', 'cuir', 'sac', 'français', 'authentique']
      },
      {
        title: 'Collier en perles de culture',
        description: 'Magnifique collier en perles de culture avec fermoir en argent. Héritage familial.',
        category: 'Bijoux & Montres',
        condition: 'Excellent état',
        tags: ['perles', 'culture', 'argent', 'bijou', 'héritage']
      }
    ]
  },
  // Objets d'Alexandre (Tech)
  {
    userIndex: 2,
    objects: [
      {
        title: 'iPhone 13 Pro 256GB',
        description: 'iPhone 13 Pro en excellent état, écran impeccable. Batterie à 91%. Avec chargeur, câble et coque.',
        category: 'Électronique',
        condition: 'Excellent état',
        tags: ['iPhone', 'smartphone', 'Apple', '256GB', 'complet']
      },
      {
        title: 'MacBook Air M2 2022',
        description: 'MacBook Air M2 16GB RAM, 512GB SSD. Utilisé pour développement, très bien entretenu. Garantie restante.',
        category: 'Matériel Informatique',
        condition: 'Très bon état',
        tags: ['MacBook', 'Apple', 'M2', 'développement', '16GB', '512GB']
      },
      {
        title: 'Casque Sony WH-1000XM4',
        description: 'Casque audio haut de gamme avec réduction de bruit active. Parfait pour télétravail et musique.',
        category: 'Électronique',
        condition: 'Excellent état',
        tags: ['Sony', 'casque', 'noise-cancelling', 'bluetooth', 'premium']
      }
    ]
  },
  // Objets de Clara (Livres)
  {
    userIndex: 3,
    objects: [
      {
        title: 'Collection Harry Potter complète',
        description: 'Les 7 tomes de Harry Potter en français, éditions Gallimard. Très bon état, quelques marques de lecture.',
        category: 'Livres & BD',
        condition: 'Très bon état',
        tags: ['Harry Potter', 'collection', 'Gallimard', 'fantasy', 'complet']
      },
      {
        title: 'Encyclopédie Universalis (20 volumes)',
        description: 'Encyclopédie complète en 20 volumes, édition 2018. Parfait pour recherches et culture générale.',
        category: 'Livres & BD',
        condition: 'Bon état',
        tags: ['encyclopédie', 'référence', 'culture', 'Universalis', '2018']
      }
    ]
  },
  // Objets de Julien (Bricolage)
  {
    userIndex: 4,
    objects: [
      {
        title: 'Perceuse-visseuse Bosch Professional',
        description: 'Perceuse-visseuse 18V avec 2 batteries et chargeur. Parfait état de fonctionnement, peu utilisée.',
        category: 'Bricolage & Outillage',
        condition: 'Excellent état',
        tags: ['Bosch', 'perceuse', 'professionnel', '18V', '2batteries']
      },
      {
        title: 'Établi en bois massif',
        description: 'Établi de menuisier traditionnel en hêtre massif. Fabriqué artisanalement, très stable.',
        category: 'Bricolage & Outillage',
        condition: 'Bon état',
        tags: ['établi', 'menuiserie', 'hêtre', 'artisanal', 'massif']
      }
    ]
  },
  // Objets de Sophie (Sport)
  {
    userIndex: 5,
    objects: [
      {
        title: 'Vélo elliptique NordicTrack',
        description: 'Vélo elliptique professionnel, 24 niveaux de résistance, écran connecté. Excellent état.',
        category: 'Sports & Loisirs',
        condition: 'Excellent état',
        tags: ['elliptique', 'NordicTrack', 'cardio', 'fitness', '24niveaux']
      },
      {
        title: 'Set d\'haltères ajustables 50kg',
        description: 'Paire d\'haltères ajustables de 2,5kg à 25kg chacun. Parfait pour entraînement à domicile.',
        category: 'Sports & Loisirs',
        condition: 'Très bon état',
        tags: ['haltères', 'musculation', 'ajustable', '50kg', 'domicile']
      }
    ]
  },
  // Objets de Markus (Collection)
  {
    userIndex: 6,
    objects: [
      {
        title: 'Montre mécanique Omega 1965',
        description: 'Montre mécanique Omega des années 60, mouvement manuel. Révisée récemment, fonctionne parfaitement.',
        category: 'Art & Objets de Collection',
        condition: 'Excellent état',
        tags: ['vintage', 'montre', 'Omega', 'mécanique', '1965']
      },
      {
        title: 'Appareil photo Leica M6',
        description: 'Légendaire Leica M6 avec objectif 50mm Summicron. État de collection, tout fonctionne parfaitement.',
        category: 'Art & Objets de Collection',
        condition: 'Excellent état',
        tags: ['Leica', 'argentique', 'M6', 'collection', 'Summicron']
      }
    ]
  },
  // Objets d'Emma (Créatif)
  {
    userIndex: 7,
    objects: [
      {
        title: 'Machine à coudre Singer Vintage',
        description: 'Machine à coudre Singer des années 80, parfait état de fonctionnement. Idéale pour débuter.',
        category: 'Électroménager',
        condition: 'Très bon état',
        tags: ['Singer', 'couture', 'vintage', 'machine', 'créatif']
      },
      {
        title: 'Coffret complet de peinture acrylique',
        description: 'Coffret professionnel avec 48 tubes de peinture acrylique, pinceaux et accessoires.',
        category: 'Jouets & Jeux',
        condition: 'Neuf',
        tags: ['peinture', 'acrylique', 'professionnel', '48couleurs', 'complet']
      }
    ]
  }
];

/**
 * 🔄 CRÉATION DES ÉCHANGES DANS TOUS LES ÉTATS
 */
async function createComprehensiveTrades(users, objects, superAdmin) {
  console.log('🔄 Création des échanges complets...');
  
  // Helper pour trouver un objet par titre partiel
  const findObjectByTitle = (titleSubstring) => {
    const found = objects.find(obj => obj.title.toLowerCase().includes(titleSubstring.toLowerCase()));
    if (!found) {
      console.log(`⚠️ Objet non trouvé pour: ${titleSubstring}`);
    }
    return found;
  };

  // Helper pour trouver un utilisateur par pseudo
  const findUserByPseudo = (pseudoSubstring) => {
    const found = users.find(user => user.pseudo.toLowerCase().includes(pseudoSubstring.toLowerCase()));
    return found;
  };

  const trades = [
    // 1. Échange en attente (PENDING) - Super Admin propose son guide
    {
      fromUser: superAdmin._id,
      toUser: findUserByPseudo('Marie')._id,
      requestedObjects: [findObjectByTitle('Robe vintage')._id],
      offeredObjects: [findObjectByTitle('Guide')._id],
      status: 'pending',
      message: 'Salut Marie ! Je propose mon guide premium contre ta magnifique robe vintage ?',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Il y a 5 jours
    },

    // 2. Échange proposé (PROPOSED) - Alexandre accepte et propose ses objets
    {
      fromUser: findUserByPseudo('Alex')._id,
      toUser: findUserByPseudo('Sophie')._id,
      requestedObjects: [findObjectByTitle('elliptique')._id],
      offeredObjects: [findObjectByTitle('iPhone')._id],
      status: 'proposed',
      message: 'Ton vélo elliptique m\'intéresse ! Je propose mon iPhone 13 Pro en échange.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      proposedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Proposé il y a 1 jour
    },

    // 3. Échange accepté (ACCEPTED) - Prêt pour livraison
    {
      fromUser: findUserByPseudo('Clara')._id,
      toUser: findUserByPseudo('Julien')._id,
      requestedObjects: [findObjectByTitle('Établi')._id],
      offeredObjects: [findObjectByTitle('Harry Potter')._id],
      status: 'accepted',
      message: 'Mon fils commence à bricoler, ton établi serait parfait ! Je propose ma collection Harry Potter.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Accepté il y a 2 jours
      security: {
        riskLevel: 'LOW_RISK',
        requiresEscrow: false,
        pureTradeValidation: {
          steps: {
            photosSubmitted: {
              fromUser: true,
              toUser: true
            }
          }
        }
      }
    },

    // 4. Échange sécurisé avec dépôt (SECURED) - Haut risque
    {
      fromUser: findUserByPseudo('Markus')._id,
      toUser: findUserByPseudo('Alex')._id,
      requestedObjects: [findObjectByTitle('MacBook')._id],
      offeredObjects: [findObjectByTitle('Leica')._id],
      status: 'secured',
      message: 'Échange haute valeur : mon Leica M6 contre ton MacBook M2.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      securedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      escrow: {
        amount: 500, // Dépôt de 500€
        status: 'held',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // Expire dans 10 jours
      },
      security: {
        riskLevel: 'HIGH_RISK',
        requiresEscrow: true,
        requiresIdentityVerification: true,
        secureDeliveryRequired: true
      }
    },

    // 5. Échange expédié (SHIPPED) - En transit
    {
      fromUser: findUserByPseudo('Emma')._id,
      toUser: findUserByPseudo('Marie')._id,
      requestedObjects: [findObjectByTitle('Sac à main')._id],
      offeredObjects: [findObjectByTitle('Machine à coudre')._id],
      status: 'shipped',
      message: 'Ma machine à coudre vintage contre ton sac en cuir ?',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deliveryTracking: {
        fromUserTracking: 'FR123456789',
        toUserTracking: 'FR987654321',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      security: {
        riskLevel: 'MEDIUM_RISK',
        pureTradeValidation: {
          steps: {
            photosSubmitted: {
              fromUser: true,
              toUser: true
            },
            shippingConfirmed: {
              fromUser: true,
              toUser: true
            }
          }
        }
      }
    },

    // 6. Échange terminé avec succès (COMPLETED) - Avec évaluations
    {
      fromUser: findUserByPseudo('Sophie')._id,
      toUser: findUserByPseudo('Julien')._id,
      requestedObjects: [findObjectByTitle('Perceuse')._id],
      offeredObjects: [findObjectByTitle('haltères')._id],
      status: 'completed',
      message: 'Ta perceuse contre mes haltères ajustables ?',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      ratings: {
        fromUserRating: { 
          score: 5, 
          comment: 'Perceuse en parfait état, exactement comme décrite ! Merci Julien.',
          author: findUserByPseudo('Sophie').pseudo,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        },
        toUserRating: { 
          score: 5, 
          comment: 'Haltères parfaites, Sophie très sympathique. Transaction au top !',
          author: findUserByPseudo('Julien').pseudo,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      }
    },

    // 7. Échange en litige (DISPUTED)
    {
      fromUser: findUserByPseudo('Alex')._id,
      toUser: findUserByPseudo('Markus')._id,
      requestedObjects: [findObjectByTitle('Omega')._id],
      offeredObjects: [findObjectByTitle('Casque Sony')._id],
      status: 'disputed',
      message: 'Mon casque Sony premium contre ta montre Omega ?',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      disputedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dispute: {
        reason: 'L\'objet reçu ne correspond pas à la description',
        reportedBy: findUserByPseudo('Alex')._id,
        reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'La montre présente des rayures importantes non mentionnées dans la description.'
      },
      security: {
        riskLevel: 'VERY_HIGH_RISK'
      }
    },

    // 8. Échange annulé (CANCELLED)
    {
      fromUser: findUserByPseudo('Clara')._id,
      toUser: findUserByPseudo('Emma')._id,
      requestedObjects: [findObjectByTitle('Coffret')._id],
      offeredObjects: [findObjectByTitle('Encyclopédie')._id],
      status: 'cancelled',
      message: 'Mon encyclopédie contre ton coffret de peinture ?',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      cancelledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      cancellationReason: 'L\'utilisateur a changé d\'avis'
    },

    // 9. Échange refusé (REFUSED)
    {
      fromUser: findUserByPseudo('Marie')._id,
      toUser: superAdmin._id,
      requestedObjects: [findObjectByTitle('Kit de démarrage')._id],
      offeredObjects: [findObjectByTitle('Collier')._id],
      status: 'refused',
      message: 'Mon collier en perles contre votre kit écologique ?',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      refusedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      refusalReason: 'Objet ne correspond pas aux besoins actuels'
    }
  ];

  const createdTrades = [];
  for (const tradeData of trades) {
    // Vérifier que tous les objets et utilisateurs existent
    const hasValidObjects = tradeData.requestedObjects?.every(id => id) && tradeData.offeredObjects?.every(id => id);
    const hasValidUsers = tradeData.fromUser && tradeData.toUser;
    
    if (!hasValidObjects || !hasValidUsers) {
      console.log('⚠️ Échange ignoré car données manquantes:', tradeData.message);
      continue;
    }

    const trade = new Trade(tradeData);
    await trade.save();
    createdTrades.push(trade);
    console.log(`✅ Échange créé: ${tradeData.status} - ${tradeData.message.substring(0, 50)}...`);
  }

  return createdTrades;
}

/**
 * 🚨 CRÉATION DES SIGNALEMENTS
 */
async function createComprehensiveReports(users, objects, trades) {
  console.log('🚨 Création des signalements...');
  
  const findObjectByTitle = (titleSubstring) => {
    return objects.find(obj => obj.title.toLowerCase().includes(titleSubstring.toLowerCase()));
  };

  const findUserByPseudo = (pseudoSubstring) => {
    return users.find(user => user.pseudo.toLowerCase().includes(pseudoSubstring.toLowerCase()));
  };

  const reports = [
    {
      reporter: findUserByPseudo('Alex')._id,
      reportedUser: findUserByPseudo('Markus')._id,
      reportedObject: findObjectByTitle('Omega')._id,
      relatedTrade: trades.find(t => t.status === 'disputed')._id,
      type: 'misleading_description',
      reason: 'Description non conforme',
      description: 'La montre présente des rayures importantes et des dysfonctionnements non mentionnés dans la description.',
      status: 'pending',
      priority: 'high',
      evidence: [
        { 
          type: 'image', 
          url: 'https://picsum.photos/400/300?random=100', 
          description: 'Photo des rayures sur le boîtier' 
        },
        { 
          type: 'image', 
          url: 'https://picsum.photos/400/300?random=101', 
          description: 'Photo du mécanisme défaillant' 
        }
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      reporter: findUserByPseudo('Clara')._id,
      reportedUser: findUserByPseudo('Markus')._id,
      type: 'suspicious_behavior',
      reason: 'Tentative d\'arnaque',
      description: 'L\'utilisateur demande un paiement en plus de l\'échange, ce qui va contre les règles de la plateforme.',
      status: 'under_review',
      priority: 'high',
      evidence: [
        { 
          type: 'screenshot', 
          url: 'https://picsum.photos/400/300?random=102', 
          description: 'Capture d\'écran de la demande de paiement' 
        }
      ],
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      reviewedBy: findUserByPseudo('Clara')._id,
      reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    },
    {
      reporter: findUserByPseudo('Sophie')._id,
      reportedUser: findUserByPseudo('Emma')._id,
      reportedObject: findObjectByTitle('peinture')._id,
      type: 'inappropriate_content',
      reason: 'Contenu inapproprié',
      description: 'Les photos de l\'objet contiennent des éléments non appropriés en arrière-plan.',
      status: 'resolved',
      priority: 'medium',
      resolution: {
        action: 'content_moderated',
        description: 'Photos remplacées par l\'utilisateur',
        resolvedBy: findUserByPseudo('Clara')._id,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ];

  const createdReports = [];
  for (const reportData of reports) {
    try {
      const report = new Report(reportData);
      await report.save();
      createdReports.push(report);
      console.log(`✅ Signalement créé: ${reportData.type} - ${reportData.reason}`);
    } catch (error) {
      console.log(`⚠️ Erreur lors de la création du signalement: ${error.message}`);
    }
  }

  return createdReports;
}

/**
 * 📊 MISE À JOUR DES STATISTIQUES UTILISATEURS
 */
async function updateUserStats(users, trades) {
  console.log('📊 Mise à jour des statistiques utilisateurs...');
  
  for (const user of users) {
    const userTrades = trades.filter(t => 
      t.fromUser.toString() === user._id.toString() || 
      t.toUser.toString() === user._id.toString()
    );
    
    const completedTrades = userTrades.filter(t => t.status === 'completed');
    const avgRating = calculateAverageRating(user._id, trades);
    const totalRatings = countTotalRatings(user._id, trades);
    
    await User.findByIdAndUpdate(user._id, {
      'tradeStats.totalTrades': userTrades.length,
      'tradeStats.completedTrades': completedTrades.length,
      'tradeStats.successRate': userTrades.length > 0 ? Math.round((completedTrades.length / userTrades.length) * 100) : 0,
      'tradeStats.avgRating': avgRating,
      'tradeStats.totalRatings': totalRatings
    });
    
    console.log(`✅ Stats mises à jour pour ${user.pseudo}: ${userTrades.length} échanges, ${completedTrades.length} terminés`);
  }
}

// Helper functions
function calculateAverageRating(userId, trades) {
  const ratings = [];
  trades.forEach(trade => {
    if (trade.status === 'completed' && trade.ratings) {
      if (trade.fromUser.toString() === userId.toString() && trade.ratings.toUserRating) {
        ratings.push(trade.ratings.toUserRating.score);
      }
      if (trade.toUser.toString() === userId.toString() && trade.ratings.fromUserRating) {
        ratings.push(trade.ratings.fromUserRating.score);
      }
    }
  });
  
  return ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
}

function calculateTotalRatings(userId, trades) {
  let count = 0;
  trades.forEach(trade => {
    if (trade.status === 'completed' && trade.ratings) {
      if (trade.fromUser.toString() === userId.toString() && trade.ratings.toUserRating) {
        count++;
      }
      if (trade.toUser.toString() === userId.toString() && trade.ratings.fromUserRating) {
        count++;
      }
    }
  });
  return count;
}

/**
 * 🚀 SCRIPT PRINCIPAL
 */
async function createComprehensiveTestData() {
  try {
    console.log('🚀 Démarrage de la création complète de données de test...');
    console.log('🎯 Base de données:', MONGODB_URI);
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Vérifier les catégories
    const categories = await Category.find();
    if (categories.length === 0) {
      console.log('⚠️ Aucune catégorie trouvée. Création des catégories de base...');
      // Créer quelques catégories de base si elles n'existent pas
      const basicCategories = [
        'Livres & BD', 'Électronique', 'Vêtements & Mode', 'Sports & Loisirs', 
        'Bricolage & Outillage', 'Art & Objets de Collection', 'Loisirs Créatifs',
        'Matériel Informatique', 'Audio & Hi-Fi', 'Bijoux & Accessoires',
        'Bagagerie & Maroquinerie', 'Écologie & Environnement'
      ];
      
      for (const catName of basicCategories) {
        const category = new Category({ name: catName, slug: catName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') });
        await category.save();
      }
      console.log('✅ Catégories de base créées');
    }

    // 1. Créer le super admin
    const superAdmin = await createSuperAdmin();
    
    // 2. Créer les utilisateurs de test
    console.log('👥 Création des utilisateurs de test...');
    const allUsers = [superAdmin]; // Commencer avec le super admin
    
    for (const userData of testUsersData) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ Utilisateur ${userData.pseudo} existe déjà`);
        allUsers.push(existingUser);
        continue;
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Créer l'utilisateur
      const user = new User({
        ...userData,
        password: hashedPassword,
        avatar: `https://picsum.photos/150/150?random=${allUsers.length}`,
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // 0-180 jours
        lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 0-30 jours
        tradeStats: {
          totalTrades: 0,
          completedTrades: 0,
          successRate: 0,
          avgRating: 0,
          totalRatings: 0
        }
      });

      await user.save();
      allUsers.push(user);
      console.log(`✅ Utilisateur créé: ${userData.pseudo} (${userData.email})`);
    }

    // 3. Créer les objets
    console.log('📦 Création des objets...');
    const allObjects = [];
    const categoriesMap = {};
    categories.forEach(cat => {
      categoriesMap[cat.name] = cat._id;
    });
    
    for (let i = 0; i < objectsData.length; i++) {
      const userObjects = objectsData[i];
      const user = allUsers[userObjects.userIndex];
      
      if (!user) {
        console.log(`⚠️ Utilisateur non trouvé à l'index ${userObjects.userIndex}`);
        continue;
      }
      
      for (const objectData of userObjects.objects) {
        // Trouver la catégorie
        let categoryId = null;
        for (const [catName, catId] of Object.entries(categoriesMap)) {
          if (catName.toLowerCase().includes(objectData.category.toLowerCase()) ||
              objectData.category.toLowerCase().includes(catName.toLowerCase())) {
            categoryId = catId;
            break;
          }
        }

        if (!categoryId) {
          console.log(`⚠️ Catégorie non trouvée pour: ${objectData.category}`);
          continue;
        }

        const object = new ObjectModel({
          ...objectData,
          owner: user._id,
          category: categoryId,
          status: 'available',
          location: {
            coordinates: user.address.coordinates,
            address: {
              street: user.address.street,
              city: user.address.city,
              zipCode: user.address.zipCode,
              country: user.address.country
            },
            precision: user.address.precision,
            isPublic: true,
            searchRadius: 15
          },
          imageUrl: `https://picsum.photos/400/300?random=${allObjects.length + 1}`,
          images: [{ 
            url: `https://picsum.photos/400/300?random=${allObjects.length + 1}`, 
            caption: objectData.title,
            isPrimary: true 
          }],
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // 0-90 jours
          viewsCount: Math.floor(Math.random() * 200) + 10,
          favoritesCount: Math.floor(Math.random() * 50)
        });

        await object.save();
        allObjects.push(object);
        console.log(`✅ Objet créé: ${objectData.title} pour ${user.pseudo}`);
      }
    }

    // 4. Créer les échanges
    const trades = await createComprehensiveTrades(allUsers, allObjects, superAdmin);
    
    // 5. Créer les signalements
    await createComprehensiveReports(allUsers, allObjects, trades);

    // 6. Mettre à jour les statistiques
    await updateUserStats(allUsers, trades);

    // 7. Résumé final
    console.log('\n🎉 DONNÉES DE TEST COMPLÈTES CRÉÉES AVEC SUCCÈS !');
    console.log('=' .repeat(60));
    console.log('📊 RÉSUMÉ:');
    console.log(`   👑 Super Admin: 1 (${superAdmin.email})`);
    console.log(`   👥 Utilisateurs: ${allUsers.length} (dont ${allUsers.filter(u => u.isAdmin).length} admin)`);
    console.log(`   📦 Objets: ${allObjects.length}`);
    console.log(`   🔄 Échanges: ${trades.length}`);
    console.log(`   🚨 Signalements: 3`);
    console.log(`   🏷️ Catégories: ${categories.length}`);
    
    console.log('\n🔑 COMPTES PRINCIPAUX:');
    console.log(`   🦸‍♂️ Super Admin: ${superAdmin.email} | SuperAdmin2024!`);
    console.log('   🛡️ Modératrice: clara.books@cadok.app | Books2024!');
    console.log('   👤 Utilisateurs test: marie.test@cadok.app | Marie2024!');
    console.log('                        alex.tech@cadok.app | Tech2024!');
    
    console.log('\n📋 ÉTATS DES ÉCHANGES CRÉÉS:');
    const statusCounts = {};
    trades.forEach(trade => {
      statusCounts[trade.status] = (statusCounts[trade.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status.toUpperCase()}: ${count}`);
    });

    console.log('\n✅ PRÊT POUR LES TESTS ! 🚀');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Correction pour countTotalRatings
function countTotalRatings(userId, trades) {
  return calculateTotalRatings(userId, trades);  // Utiliser la fonction existante
}

// Exécuter le script
if (require.main === module) {
  createComprehensiveTestData();
}

module.exports = { createComprehensiveTestData };
