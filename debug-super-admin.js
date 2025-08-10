/**
 * 🔍 DEBUG SUPER ADMIN
 * Diagnostiquer et créer le compte super admin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const debugSuperAdmin = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok_production');
    console.log('✅ Connexion MongoDB réussie\n');

    // 1. Vérifier si l'utilisateur existe
    console.log('🔍 Recherche utilisateur existant...');
    let user = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    
    if (user) {
      console.log('✅ Utilisateur trouvé:', {
        email: user.email,
        pseudo: user.pseudo,
        role: user.role,
        isAdmin: user.isAdmin,
        hasPassword: !!user.password
      });
      
      // Tester le mot de passe
      const isPasswordValid = await bcrypt.compare('Admin1234A@', user.password);
      console.log('🔐 Mot de passe valide:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('🔧 Mise à jour du mot de passe...');
        const newHashedPassword = await bcrypt.hash('Admin1234A@', 12);
        user.password = newHashedPassword;
        await user.save();
        console.log('✅ Mot de passe mis à jour');
      }
      
    } else {
      console.log('❌ Utilisateur non trouvé, création...');
      
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
      console.log('✅ Super admin créé avec succès !');
    }

    // 2. Vérification finale
    console.log('\n🛡️ VÉRIFICATION FINALE:');
    console.log('========================');
    
    const finalUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    console.log('Email:', finalUser.email);
    console.log('Pseudo:', finalUser.pseudo);
    console.log('Ville:', finalUser.city);
    console.log('Role:', finalUser.role);
    console.log('isAdmin:', finalUser.isAdmin);
    console.log('Permissions:', finalUser.adminPermissions);
    
    // Test du hash de mot de passe
    const passwordTest = await bcrypt.compare('Admin1234A@', finalUser.password);
    console.log('Test mot de passe:', passwordTest ? '✅ OK' : '❌ FAILED');
    
    console.log('\n🚀 CONNEXION:');
    console.log('=============');
    console.log('URL: POST http://localhost:5000/api/auth/login');
    console.log('Body:');
    console.log(JSON.stringify({
      email: 'ndongoambassa7@gmail.com',
      password: 'Admin1234A@'
    }, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
  }
};

debugSuperAdmin();
