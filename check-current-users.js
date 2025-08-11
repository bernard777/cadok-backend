/**
 * 🔍 VÉRIFIER LES UTILISATEURS ACTUELS
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const checkCurrentUsers = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB réussie\n');

    // Récupérer tous les utilisateurs
    const users = await User.find({})
      .select('email pseudo role isAdmin adminPermissions createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📊 Total utilisateurs trouvés: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  🏷️  Pseudo: ${user.pseudo}`);
      console.log(`  🛡️  Rôle: ${user.role || 'user'}`);
      console.log(`  🔐 Is Admin: ${user.isAdmin || false}`);
      console.log(`  📅 Créé le: ${user.createdAt}`);
      if (user.adminPermissions) {
        console.log(`  🎛️  Permissions admin: ${JSON.stringify(user.adminPermissions, null, 2)}`);
      }
      console.log('');
    });

    // Chercher spécifiquement des admins
    const admins = await User.find({
      $or: [
        { role: 'admin' },
        { role: 'super_admin' },
        { isAdmin: true }
      ]
    });

    console.log(`\n🛡️ Admins trouvés: ${admins.length}`);
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`  👑 Admin ${index + 1}: ${admin.email} (${admin.role})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Déconnexion MongoDB');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

checkCurrentUsers();
