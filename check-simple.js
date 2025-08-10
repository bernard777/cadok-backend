/**
 * 🔍 VÉRIFICATION RAPIDE ADMIN
 */

const mongoose = require('mongoose');
const User = require('./models/User');

async function checkQuick() {
  console.log('🔍 VÉRIFICATION ADMIN RAPIDE\n');
  
  // Test base principale (selon .env)
  console.log('📊 Base CADOK (principale):');
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    const admins = await User.find({ isAdmin: true });
    console.log(`   👑 ${admins.length} admin(s) trouvé(s)`);
    if (admins.length > 0) {
      admins.forEach(a => console.log(`   📧 ${a.email} (${a.pseudo})`));
    }
    await mongoose.disconnect();
  } catch (e) {
    console.log(`   ❌ Erreur: ${e.message}`);
  }
  
  console.log('\n📊 Base CADOK_PRODUCTION:');
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok_production');
    const admins = await User.find({ isAdmin: true });
    console.log(`   👑 ${admins.length} admin(s) trouvé(s)`);
    if (admins.length > 0) {
      admins.forEach(a => console.log(`   📧 ${a.email} (${a.pseudo})`));
    }
    await mongoose.disconnect();
  } catch (e) {
    console.log(`   ❌ Erreur: ${e.message}`);
  }
  
  console.log('\n🎯 CONCLUSION:');
  console.log('• Serveur backend utilise: cadok (selon .env)');
  console.log('• Script admin a créé sur: cadok_production');
  console.log('• Il faut aligner les bases ou migrer l\'admin');
}

checkQuick();
