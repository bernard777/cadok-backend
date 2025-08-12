/**
 * 🔐 ATTRIBUTION DES DROITS ADMINISTRATEUR - CADOK
 * Script pour donner les droits admin à des utilisateurs de test
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const User = require('../models/User');

// Configuration base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';

/**
 * Attribution des droits administrateur
 */
async function setupAdminRights() {
  try {
    console.log('🔐 Attribution des droits administrateur...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Donner les droits admin à Marie (compte principal pour tests)
    const marie = await User.findOne({ email: 'marie.lambert@email.com' });
    if (marie) {
      marie.role = 'admin';
      marie.adminRights = {
        canManageUsers: true,
        canManageTrades: true,
        canManageReports: true,
        canViewAnalytics: true,
        canModerateContent: true,
        grantedAt: new Date(),
        grantedBy: 'system'
      };
      await marie.save();
      console.log('✅ Marie Lambert -> ADMINISTRATEUR');
    }

    // Donner les droits super admin à Alexandre (pour tests avancés)
    const alex = await User.findOne({ email: 'alexandre.martin@email.com' });
    if (alex) {
      alex.role = 'super_admin';
      alex.adminRights = {
        canManageUsers: true,
        canManageTrades: true,
        canManageReports: true,
        canViewAnalytics: true,
        canModerateContent: true,
        canManageAdmins: true,
        canAccessSystemSettings: true,
        grantedAt: new Date(),
        grantedBy: 'system'
      };
      await alex.save();
      console.log('✅ Alexandre Martin -> SUPER ADMINISTRATEUR');
    }

    // Garder Clara comme utilisateur premium normal (pour tests de restriction)
    const clara = await User.findOne({ email: 'clara.dubois@email.com' });
    if (clara) {
      clara.role = 'user';
      console.log('✅ Clara Dubois -> UTILISATEUR PREMIUM');
    }

    console.log('\n🎯 COMPTES ADMINISTRATEUR CONFIGURÉS :');
    console.log('📧 marie.lambert@email.com | Password123! | ADMIN');
    console.log('📧 alexandre.martin@email.com | Password123! | SUPER ADMIN');
    console.log('📧 clara.dubois@email.com | Password123! | USER PREMIUM');
    
    console.log('\n🧪 UTILISEZ CES COMPTES POUR TESTER :');
    console.log('• Marie : Gestion des échanges et signalements');
    console.log('• Alexandre : Gestion système complète');
    console.log('• Clara : Interface utilisateur normale');

  } catch (error) {
    console.error('❌ Erreur lors de l\'attribution des droits admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  setupAdminRights();
}

module.exports = { setupAdminRights };
