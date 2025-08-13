const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB\n');

    const newPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await User.updateOne(
      { email: 'admin@cadok.com' },
      { 
        password: hashedPassword,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        status: 'active'
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Mot de passe admin mis à jour avec succès !');
      console.log('');
      console.log('📋 IDENTIFIANTS ADMIN:');
      console.log('   Email: admin@cadok.com');
      console.log('   Mot de passe: SuperAdmin123!');
      console.log('');
      console.log('🔐 Le compte est maintenant:');
      console.log('   - Vérifié (email + téléphone)');
      console.log('   - Actif');
      console.log('   - Super Admin');
      
      // Vérification
      const admin = await User.findOne({ email: 'admin@cadok.com' });
      const passwordTest = await bcrypt.compare('SuperAdmin123!', admin.password);
      console.log('');
      console.log('🧪 Test de vérification:', passwordTest ? '✅ OK' : '❌ ÉCHEC');
      
    } else {
      console.log('❌ Aucune modification effectuée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

resetAdminPassword();
