/**
 * 🛡️ SCRIPT D'INITIALISATION SUPER ADMIN - CADOK
 * Crée le premier compte super administrateur
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import du modèle User
const User = require('./models/User');

const createSuperAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok');
    console.log('🔗 Connecté à MongoDB');

    // Vérifier si un super admin existe déjà
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('⚠️ Un super admin existe déjà:', existingSuperAdmin.pseudo);
      process.exit(0);
    }

    // Données du super admin
    const SUPER_ADMIN_DATA = {
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@cadok.com',
      pseudo: process.env.SUPER_ADMIN_PSEUDO || 'SuperAdmin',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2025!',
      city: 'System'
    };

    console.log('🛡️ Création du super admin...');
    console.log('📧 Email:', SUPER_ADMIN_DATA.email);
    console.log('👤 Pseudo:', SUPER_ADMIN_DATA.pseudo);

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_DATA.password, 12);

    // Créer le super admin
    const superAdmin = new User({
      email: SUPER_ADMIN_DATA.email,
      pseudo: SUPER_ADMIN_DATA.pseudo,
      password: hashedPassword,
      city: SUPER_ADMIN_DATA.city,
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
      adminNotes: 'Compte super admin initial créé par script d\'initialisation'
    });

    await superAdmin.save();

    console.log('✅ Super admin créé avec succès !');
    console.log('🔑 Identifiants de connexion :');
    console.log('   Email:', SUPER_ADMIN_DATA.email);
    console.log('   Mot de passe:', SUPER_ADMIN_DATA.password);
    console.log('');
    console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
    console.log('');
    console.log('🚀 Vous pouvez maintenant :');
    console.log('   • Vous connecter avec ces identifiants');
    console.log('   • Accéder au panel admin mobile');
    console.log('   • Promouvoir d\'autres utilisateurs admin');
    console.log('   • Gérer les événements et modération');

  } catch (error) {
    console.error('❌ Erreur création super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Script à exécuter directement
if (require.main === module) {
  console.log('🛡️ INITIALISATION SUPER ADMIN - CADOK');
  console.log('=====================================');
  createSuperAdmin();
}

module.exports = createSuperAdmin;
