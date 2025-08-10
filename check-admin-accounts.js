/**
 * 🔍 VÉRIFICATION COMPTE ADMIN EXISTANT
 * Affiche les informations du compte admin en base
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkExistingAdmin = async () => {
  try {
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok');
    console.log('🔗 Connecté à MongoDB\n');

    // Rechercher les comptes admin
    const admins = await User.find({ 
      $or: [
        { isAdmin: true },
        { role: 'admin' },
        { role: 'super_admin' }
      ]
    });

    if (admins.length === 0) {
      console.log('❌ Aucun compte admin trouvé en base');
      return;
    }

    console.log(`👑 ${admins.length} compte(s) admin trouvé(s) :\n`);

    admins.forEach((admin, index) => {
      console.log(`📋 ADMIN ${index + 1} :`);
      console.log('===============');
      console.log('ID :', admin._id);
      console.log('Email :', admin.email);
      console.log('Pseudo :', admin.pseudo);
      console.log('Ville :', admin.city);
      console.log('Rôle :', admin.role);
      console.log('isAdmin :', admin.isAdmin);
      console.log('Créé le :', admin.createdAt?.toLocaleString('fr-FR') || 'Non défini');
      console.log('Admin depuis :', admin.adminActivatedAt?.toLocaleString('fr-FR') || 'Non défini');
      
      if (admin.adminPermissions) {
        console.log('Permissions :');
        Object.entries(admin.adminPermissions).forEach(([perm, value]) => {
          console.log(`  - ${perm}: ${value ? '✅' : '❌'}`);
        });
      } else {
        console.log('Permissions : Non définies');
      }
      
      if (admin.subscriptionPlan) {
        console.log('Plan abonnement :', admin.subscriptionPlan);
        console.log('Status abonnement :', admin.subscriptionStatus);
      }
      
      if (admin.tradeStats) {
        console.log('Trust Score :', admin.tradeStats.trustScore || 'Non défini');
      }
      
      console.log('===============\n');
    });

    // Test de connexion avec les identifiants
    console.log('🔑 IDENTIFIANTS DE CONNEXION POSSIBLES :');
    console.log('=======================================');
    admins.forEach((admin, index) => {
      console.log(`Admin ${index + 1} (${admin.pseudo}) :`);
      console.log(`  📧 Email : ${admin.email}`);
      console.log(`  🔒 Mot de passe : [Voir script de création ou demander reset]`);
    });
    console.log('=======================================\n');

    console.log('🚀 ÉTAPES SUIVANTES :');
    console.log('1. Utiliser un de ces emails pour se connecter');
    console.log('2. Si mot de passe oublié, utiliser la fonction reset');
    console.log('3. Accéder au panel admin mobile avec ces identifiants');

  } catch (error) {
    console.error('❌ Erreur vérification admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
};

checkExistingAdmin();
