/**
 * 🛡️ SCRIPT CRÉATION SUPER ADMIN
 * Créer le compte super administrateur CADOK
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createSuperAdmin = async () => {
  try {
    // Connexion à la base de données de production
    await mongoose.connect('mongodb://localhost:27017/cadok_production');
    console.log('✅ Connexion MongoDB réussie');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    if (existingUser) {
      console.log('⚠️ Utilisateur déjà existant. Mise à jour des permissions...');
      
      // Mettre à jour les permissions admin
      existingUser.role = 'super_admin';
      existingUser.isAdmin = true;
      existingUser.adminPermissions = {
        manageEvents: true,
        manageUsers: true,
        moderateContent: true,
        viewAnalytics: true,
        systemConfig: true
      };
      existingUser.adminActivatedAt = new Date();
      
      await existingUser.save();
      console.log('✅ Permissions super admin mises à jour');
      
    } else {
      // Créer un nouveau super admin
      console.log('🔨 Création du super administrateur...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('Admin1234A@', 12);
      
      const superAdmin = new User({
        email: 'ndongoambassa7@gmail.com',
        pseudo: 'ADMIN',
        password: hashedPassword,
        city: 'Nantes',
        role: 'super_admin',
        isAdmin: true,
        adminPermissions: {
          manageEvents: true,
          manageUsers: true,
          moderateContent: true,
          viewAnalytics: true,
          systemConfig: true
        },
        adminActivatedAt: new Date(),
        // Permissions premium par défaut pour super admin
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date('2030-12-31'), // Valide jusqu'en 2030
        // Stats de base
        tradeStats: {
          completedTrades: 0,
          cancelledTrades: 0,
          averageRating: 5,
          totalRatings: 0,
          trustScore: 100, // Score maximum pour super admin
          lastActivity: new Date(),
          violations: {
            noShipment: 0,
            badQuality: 0,
            communication: 0,
            total: 0
          }
        }
      });

      await superAdmin.save();
      console.log('✅ Super administrateur créé avec succès !');
    }

    // Afficher les informations de connexion
    const adminUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    console.log('\n🛡️ INFORMATIONS DE CONNEXION SUPER ADMIN:');
    console.log('==========================================');
    console.log('Email:', adminUser.email);
    console.log('Pseudo:', adminUser.pseudo);
    console.log('Mot de passe: Admin1234A@');
    console.log('Ville:', adminUser.city);
    console.log('Role:', adminUser.role);
    console.log('isAdmin:', adminUser.isAdmin);
    console.log('Permissions:');
    Object.entries(adminUser.adminPermissions).forEach(([permission, allowed]) => {
      console.log(`  - ${permission}: ${allowed ? '✅' : '❌'}`);
    });
    console.log('==========================================\n');
    
    console.log('🚀 Tu peux maintenant te connecter via:');
    console.log('  - POST /api/auth/login');
    console.log('  - Email: ndongoambassa7@gmail.com');
    console.log('  - Password: Admin1234A@');
    console.log('\n📱 Ou utiliser l\'interface d\'administration CADOK');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
};

// Exécuter le script
createSuperAdmin();
