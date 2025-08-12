/**
 * Script d'initialisation du système d'administration RBAC
 * Crée le premier super administrateur et configure les rôles
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// 🎯 Configuration du Super Admin par défaut
const SUPER_ADMIN_CONFIG = {
  pseudo: 'SuperAdmin',
  email: 'admin@cadok.com',
  password: 'SuperAdmin2024!', // À changer en production
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
  }
};

async function initializeAdminSystem() {
  try {
    console.log('🚀 Initialisation du système d\'administration RBAC...\n');
    
    // Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Un super administrateur existe déjà:');
      console.log(`   📧 Email: ${existingSuperAdmin.email}`);
      console.log(`   👤 Pseudo: ${existingSuperAdmin.pseudo}`);
      console.log(`   🎯 Rôle: ${existingSuperAdmin.role}`);
      console.log('\n🔄 Mise à jour des permissions...');
      
      // Mettre à jour les permissions
      await User.findByIdAndUpdate(existingSuperAdmin._id, {
        adminPermissions: SUPER_ADMIN_CONFIG.adminPermissions,
        isAdmin: true
      });
      
      console.log('✅ Permissions mises à jour pour le super admin existant');
    } else {
      console.log('📝 Création du premier super administrateur...');
      
      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, 10);
      
      // Créer le super admin
      const superAdmin = new User({
        ...SUPER_ADMIN_CONFIG,
        password: hashedPassword,
        adminActivatedAt: new Date(),
        adminNotes: 'Super administrateur créé automatiquement lors de l\'initialisation du système',
        status: 'active'
      });
      
      await superAdmin.save();
      
      console.log('✅ Super administrateur créé avec succès !');
      console.log('\n🔐 Informations de connexion:');
      console.log(`   📧 Email: ${SUPER_ADMIN_CONFIG.email}`);
      console.log(`   🔑 Mot de passe: ${SUPER_ADMIN_CONFIG.password}`);
      console.log('   ⚠️  CHANGEZ LE MOT DE PASSE IMMÉDIATEMENT EN PRODUCTION !');
    }
    
    // Statistiques du système
    console.log('\n📊 Statistiques du système d\'administration:');
    
    const adminStats = await User.aggregate([
      { $match: { isAdmin: true } },
      { 
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n👥 Répartition des administrateurs:');
    adminStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} utilisateur(s)`);
    });
    
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ isAdmin: true });
    
    console.log(`\n🔢 Total utilisateurs: ${totalUsers}`);
    console.log(`🛡️  Total administrateurs: ${totalAdmins}`);
    
    console.log('\n🎉 Système d\'administration RBAC initialisé avec succès !');
    console.log('🔗 Vous pouvez maintenant utiliser l\'API /api/admin/roles pour gérer les rôles');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initializeAdminSystem();
}

module.exports = { initializeAdminSystem, SUPER_ADMIN_CONFIG };
