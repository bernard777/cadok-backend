/**
 * 🧪 CRÉATION DE 10 UTILISATEURS DE TEST COMPLETS
 * Injection en base de production pour tester les fonctionnalités admin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createTestUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB réussie\n');

    // Vérifier s'il y a déjà des utilisateurs de test
    const existingTestUsers = await User.find({ email: { $regex: '@test-cadok\.com$' } });
    if (existingTestUsers.length > 0) {
      console.log(`🗑️ Suppression de ${existingTestUsers.length} utilisateurs de test existants...`);
      await User.deleteMany({ email: { $regex: '@test-cadok\.com$' } });
    }

    const testUsers = [
      {
        pseudo: 'Alice_Martin',
        email: 'alice.martin@test-cadok.com',
        password: 'Test1234@',
        city: 'Paris',
        role: 'user',
        isAdmin: false,
        status: 'active',
        profileDescription: 'Passionnée de livres et de jardinage. Toujours prête pour un bon troc !',
        preferences: {
          categories: ['Livres', 'Jardinage', 'Décoration'],
          maxDistance: 10,
          notifications: true
        }
      },
      {
        pseudo: 'Bob_Dupont',
        email: 'bob.dupont@test-cadok.com',
        password: 'Test1234@',
        city: 'Lyon',
        role: 'user',
        isAdmin: false,
        status: 'active',
        profileDescription: 'Collectionneur de vinyles et amateur de cuisine. Fan de troc vintage.',
        preferences: {
          categories: ['Musique', 'Cuisine', 'Vintage'],
          maxDistance: 15,
          notifications: true
        }
      },
      {
        pseudo: 'Claire_Bernard',
        email: 'claire.bernard@test-cadok.com',
        password: 'Test1234@',
        city: 'Marseille',
        role: 'moderator',
        isAdmin: true,
        status: 'active',
        profileDescription: 'Modératrice communautaire, experte en artisanat et DIY.',
        adminPermissions: {
          moderateContent: true,
          manageEvents: false,
          viewAnalytics: true,
          manageUsers: false,
          systemConfig: false
        },
        preferences: {
          categories: ['Artisanat', 'DIY', 'Décoration'],
          maxDistance: 20,
          notifications: true
        }
      },
      {
        pseudo: 'David_Moreau',
        email: 'david.moreau@test-cadok.com',
        password: 'Test1234@',
        city: 'Toulouse',
        role: 'user',
        isAdmin: false,
        status: 'pending',
        profileDescription: 'Nouveau sur la plateforme, intéressé par les échanges de jeux vidéo.',
        preferences: {
          categories: ['Jeux vidéo', 'Technologies', 'Sport'],
          maxDistance: 25,
          notifications: true
        }
      },
      {
        pseudo: 'Emma_Petit',
        email: 'emma.petit@test-cadok.com',
        password: 'Test1234@',
        city: 'Nice',
        role: 'user',
        isAdmin: false,
        status: 'active',
        profileDescription: 'Maman créative, spécialisée dans les jouets éducatifs et vêtements enfants.',
        preferences: {
          categories: ['Enfants', 'Éducatif', 'Mode'],
          maxDistance: 12,
          notifications: false
        }
      },
      {
        pseudo: 'Frank_Leroy',
        email: 'frank.leroy@test-cadok.com',
        password: 'Test1234@',
        city: 'Nantes',
        role: 'admin',
        isAdmin: true,
        status: 'active',
        profileDescription: 'Administrateur technique passionné de bricolage et outils.',
        adminPermissions: {
          moderateContent: true,
          manageEvents: true,
          viewAnalytics: true,
          manageUsers: true,
          systemConfig: true
        },
        preferences: {
          categories: ['Bricolage', 'Outils', 'Automobile'],
          maxDistance: 30,
          notifications: true
        }
      },
      {
        pseudo: 'Gabrielle_Roux',
        email: 'gabrielle.roux@test-cadok.com',
        password: 'Test1234@',
        city: 'Strasbourg',
        role: 'user',
        isAdmin: false,
        status: 'inactive',
        profileDescription: 'Utilisatrice inactive depuis quelques mois.',
        preferences: {
          categories: ['Mode', 'Beauté', 'Accessoires'],
          maxDistance: 8,
          notifications: false
        }
      },
      {
        pseudo: 'Hugo_Garcia',
        email: 'hugo.garcia@test-cadok.com',
        password: 'Test1234@',
        city: 'Bordeaux',
        role: 'user',
        isAdmin: false,
        status: 'active',
        profileDescription: 'Étudiant passionné de sport et de matériel outdoor.',
        preferences: {
          categories: ['Sport', 'Outdoor', 'Fitness'],
          maxDistance: 18,
          notifications: true
        }
      },
      {
        pseudo: 'Isabelle_Simon',
        email: 'isabelle.simon@test-cadok.com',
        password: 'Test1234@',
        city: 'Rennes',
        role: 'user',
        isAdmin: false,
        status: 'suspended',
        profileDescription: 'Compte temporairement suspendu pour vérification.',
        preferences: {
          categories: ['Livres', 'Culture', 'Art'],
          maxDistance: 15,
          notifications: true
        }
      },
      {
        pseudo: 'Julien_Thomas',
        email: 'julien.thomas@test-cadok.com',
        password: 'Test1234@',
        city: 'Montpellier',
        role: 'user',
        isAdmin: false,
        status: 'active',
        profileDescription: 'Photographe amateur, toujours à la recherche de matériel photo vintage.',
        preferences: {
          categories: ['Photographie', 'Art', 'Vintage'],
          maxDistance: 22,
          notifications: true
        }
      }
    ];

    console.log('🚀 Création des utilisateurs de test...\n');

    for (let i = 0; i < testUsers.length; i++) {
      const userData = testUsers[i];
      
      console.log(`👤 Création de ${userData.pseudo}...`);
      
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Création de l'utilisateur
      const newUser = new User({
        pseudo: userData.pseudo,
        email: userData.email,
        password: hashedPassword,
        city: userData.city,
        role: userData.role,
        isAdmin: userData.isAdmin,
        status: userData.status || 'active',
        profileDescription: userData.profileDescription,
        adminPermissions: userData.adminPermissions || {},
        preferences: userData.preferences || {},
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Date aléatoire dans les 90 derniers jours
        lastActiveAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Dernière activité dans les 30 derniers jours
        emailVerified: Math.random() > 0.2, // 80% des comptes vérifiés
        phoneVerified: Math.random() > 0.5, // 50% des téléphones vérifiés
        avatar: null, // Pas d'avatar pour simplifier
        rating: {
          average: Math.round((Math.random() * 2 + 3) * 10) / 10, // Note entre 3.0 et 5.0
          count: Math.floor(Math.random() * 20) + 1 // Entre 1 et 20 évaluations
        },
        stats: {
          successfulTrades: Math.floor(Math.random() * 15),
          totalTrades: Math.floor(Math.random() * 20),
          responseRate: Math.round((Math.random() * 0.3 + 0.7) * 100), // Entre 70% et 100%
          joinedEvents: Math.floor(Math.random() * 5)
        }
      });

      await newUser.save();
      
      console.log(`✅ ${userData.pseudo} créé avec succès`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🛡️ Rôle: ${userData.role}`);
      console.log(`   📍 Ville: ${userData.city}`);
      console.log(`   📊 Statut: ${userData.status}`);
      if (userData.isAdmin) {
        console.log(`   🔐 Admin: Oui (${Object.keys(userData.adminPermissions || {}).length} permissions)`);
      }
      console.log('');
    }

    // Statistiques finales
    const totalUsers = await User.countDocuments({});
    const testUsersCount = await User.countDocuments({ email: { $regex: '@test-cadok\.com$' } });
    const adminCount = await User.countDocuments({ isAdmin: true });
    const activeCount = await User.countDocuments({ status: 'active' });

    console.log('📊 STATISTIQUES FINALES:');
    console.log(`   👥 Total utilisateurs: ${totalUsers}`);
    console.log(`   🧪 Utilisateurs de test: ${testUsersCount}`);
    console.log(`   🛡️ Administrateurs: ${adminCount}`);
    console.log(`   ✅ Utilisateurs actifs: ${activeCount}`);
    console.log('');

    console.log('🎯 COMPTES DE TEST CRÉÉS:');
    console.log('   📧 Tous les emails: *@test-cadok.com');
    console.log('   🔑 Mot de passe universel: Test1234@');
    console.log('   🛡️ Admins: claire.bernard@test-cadok.com (moderator)');
    console.log('            frank.leroy@test-cadok.com (admin complet)');
    console.log('');

    console.log('✅ INJECTION TERMINÉE - Prêt pour les tests ! 🚀');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

createTestUsers();
