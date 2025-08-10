/**
 * 🛡️ CRÉATION ADMIN SUR BASE TEST
 * Crée l'admin sur la base de test utilisée par le serveur
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdminOnTestDB = async () => {
  try {
    // Connexion à la base de test
    await mongoose.connect('mongodb://localhost:27017/cadok_test');
    console.log('✅ Connecté à la base CADOK_TEST');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'ndongoambassa7@gmail.com' },
        { role: 'super_admin' },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin déjà existant sur la base TEST:');
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👤 Pseudo: ${existingAdmin.pseudo}`);
      console.log(`   🛡️  Rôle: ${existingAdmin.role}`);
    } else {
      console.log('🔨 Création du super admin sur la base TEST...');
      
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
        subscriptionPlan: 'premium',
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date('2030-12-31'),
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
        },
        featurePreferences: {
          analytics: true,
          notifications: true,
          eco: true,
          gaming: true
        },
        emailVerified: true,
        isActive: true
      });

      await superAdmin.save();
      console.log('✅ Super administrateur créé sur la base TEST !');
    }
    
    console.log('\n🔑 IDENTIFIANTS DE CONNEXION:');
    console.log('============================');
    console.log('📧 Email: ndongoambassa7@gmail.com');
    console.log('🔒 Password: Admin1234A@');
    console.log('👤 Pseudo: ADMIN');
    console.log('🏙️  Ville: Nantes');
    console.log('🛡️  Rôle: super_admin');

    // Compter les utilisateurs totaux
    const totalUsers = await User.countDocuments();
    console.log(`\n👥 Total utilisateurs sur base TEST: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
    console.log('\n🚀 TU PEUX MAINTENANT TESTER LA CONNEXION !');
  }
};

console.log('🛡️  CRÉATION ADMIN SUR BASE TEST');
console.log('=================================');
createAdminOnTestDB();
