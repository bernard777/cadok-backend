/**
 * 🔍 VÉRIFICATION BASES DE DONNÉES ADMIN
 * Vérifie sur quelles bases l'admin existe
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const DATABASES_TO_CHECK = [
  'cadok',                    // Base principale (selon .env)
  'cadok_production',         // Base production (selon script admin)
  'cadok_test',              // Base de test
  'cadok_development'        // Base de dev
];

const checkAdminOnDatabase = async (dbName) => {
  try {
    console.log(`\n🔍 Vérification base: ${dbName}`);
    console.log('='.repeat(30));
    
    // Connexion à la base spécifique
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);
    console.log(`✅ Connecté à ${dbName}`);
    
    // Rechercher les admins
    const admins = await User.find({ 
      $or: [
        { isAdmin: true },
        { role: 'admin' },
        { role: 'super_admin' }
      ]
    });
    
    if (admins.length === 0) {
      console.log(`❌ Aucun admin trouvé sur ${dbName}`);
    } else {
      console.log(`👑 ${admins.length} admin(s) trouvé(s) sur ${dbName}:`);
      
      admins.forEach(admin => {
        console.log(`  📧 ${admin.email} (${admin.pseudo})`);
        console.log(`  🛡️ Rôle: ${admin.role}`);
        console.log(`  📅 Créé: ${admin.createdAt?.toLocaleString('fr-FR') || 'N/A'}`);
      });
    }
    
    // Compter tous les utilisateurs sur cette base
    const totalUsers = await User.countDocuments();
    console.log(`👥 Total utilisateurs sur ${dbName}: ${totalUsers}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error(`❌ Erreur avec ${dbName}:`, error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
};

const checkAllDatabases = async () => {
  console.log('🔍 VÉRIFICATION ADMIN SUR TOUTES LES BASES');
  console.log('=========================================');
  
  for (const dbName of DATABASES_TO_CHECK) {
    await checkAdminOnDatabase(dbName);
    
    // Attendre un peu entre les connexions
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎯 RÉSUMÉ :');
  console.log('==========');
  console.log('✅ Vérification terminée');
  console.log('📝 Regarde les résultats ci-dessus pour voir sur quelle base l\'admin existe');
  console.log('\n💡 SOLUTION :');
  console.log('Si l\'admin est sur une base différente de celle du serveur,');
  console.log('il faut soit:');
  console.log('1. Changer MONGODB_URI dans .env pour pointer vers la bonne base');
  console.log('2. Ou recréer l\'admin sur la bonne base');
};

checkAllDatabases();
