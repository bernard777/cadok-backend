/**
 * 🔧 TEMPLATE CRÉATION ADMIN - CADOK
 * 
 * Ce fichier est un EXEMPLE pour créer un compte admin.
 * ⚠️  NE PAS mettre de vrais credentials ici !
 * 
 * UTILISATION:
 * 1. Copiez ce fichier vers scripts/create-admin-local.js
 * 2. Remplacez les valeurs par les vraies credentials
 * 3. Exécutez: node scripts/create-admin-local.js
 * 4. Supprimez le fichier après utilisation
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdminExample = async () => {
  try {
    // 🔗 Connexion MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📦 Connexion MongoDB établie');

    // 👤 Configuration Admin (REMPLACER PAR VRAIES VALEURS)
    const adminConfig = {
      pseudo: 'VOTRE_PSEUDO_ADMIN',           // ← Remplacer
      email: 'admin@votredomaine.com',         // ← Remplacer  
      password: 'VOTRE_MOT_DE_PASSE_FORT',    // ← Remplacer
      city: 'Votre Ville'                     // ← Remplacer
    };

    // 🔍 Vérification existence
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminConfig.email },
        { pseudo: adminConfig.pseudo }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin déjà existant:', existingAdmin.pseudo);
      return;
    }

    // 🔐 Hashage mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminConfig.password, saltRounds);

    // 👑 Création Admin
    const newAdmin = new User({
      pseudo: adminConfig.pseudo,
      email: adminConfig.email,
      password: hashedPassword,
      city: adminConfig.city,
      isAdmin: true,
      role: 'super_admin',
      adminPermissions: {
        canManageUsers: true,
        canManageEvents: true,
        canViewAnalytics: true,
        canManageSystem: true
      },
      adminActivatedAt: new Date(),
      emailVerified: true,
      isActive: true
    });

    await newAdmin.save();

    console.log('✅ Admin créé avec succès !');
    console.log(`👤 Pseudo: ${adminConfig.pseudo}`);
    console.log(`📧 Email: ${adminConfig.email}`);
    console.log(`🏙️  Ville: ${adminConfig.city}`);
    console.log(`🛡️  Rôle: super_admin`);
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Connexion MongoDB fermée');
  }
};

// 🚀 Exécution si script appelé directement
if (require.main === module) {
  createAdminExample();
}

module.exports = createAdminExample;
