/**
 * 🔐 CRÉATION SUPER ADMIN EN BASE DE PRODUCTION
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createSuperAdminInProduction = async () => {
  try {
    // Connexion à la base de production (comme le serveur maintenant)
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB PRODUCTION réussie\n');

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    
    if (user) {
      console.log('✅ Utilisateur existant trouvé, mise à jour...');
      
      // Mettre à jour avec le rôle super admin si nécessaire
      user.role = 'super_admin';
      user.isAdmin = true;
      user.adminPermissions = {
        manageEvents: true,
        manageUsers: true,
        moderateContent: true,
        viewAnalytics: true,
        systemConfig: true
      };
      
      await user.save();
      console.log('✅ Utilisateur mis à jour avec les droits super admin');
    } else {
      console.log('🆕 Création du super admin...');
      
      const hashedPassword = await bcrypt.hash('Admin1234A@', 12);
      
      user = new User({
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
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date('2030-12-31'),
        notificationPreferences: {
          notifications_push: true,
          notifications_email: true,
          promotions: true,
          sound: true,
          vibration: true
        },
        tradeStats: {
          completedTrades: 0,
          cancelledTrades: 0,
          averageRating: 5,
          totalRatings: 0,
          trustScore: 100,
          lastActivity: new Date(),
          violations: {
            noShipment: 0,
            badQuality: 0,
            communication: 0,
            total: 0
          }
        }
      });

      await user.save();
      console.log('✅ Super admin créé dans la base PRODUCTION !');
    }

    // Vérification finale
    console.log('\n🛡️ VÉRIFICATION EN BASE PRODUCTION:');
    console.log('====================================');
    
    const finalUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    console.log('Email:', finalUser.email);
    console.log('Pseudo:', finalUser.pseudo);
    console.log('Ville:', finalUser.city);
    console.log('Role:', finalUser.role);
    console.log('isAdmin:', finalUser.isAdmin);
    console.log('Permissions:', finalUser.adminPermissions);
    
    // Test du mot de passe
    const passwordTest = await bcrypt.compare('Admin1234A@', finalUser.password);
    console.log('Test mot de passe:', passwordTest ? '✅ OK' : '❌ FAILED');
    
    console.log('\n🚀 PRÊT POUR LA CONNEXION !');
    console.log('============================');
    console.log('URL: POST http://localhost:5000/api/auth/login');
    console.log('Email: ndongoambassa7@gmail.com');
    console.log('Password: Admin1234A@');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
};

createSuperAdminInProduction();
