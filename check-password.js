const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkAdminPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB\n');

    const admin = await User.findOne({ email: 'admin@cadok.com' });
    
    if (admin) {
      console.log('🎯 Admin trouvé:', admin.email);
      console.log('   Pseudo:', admin.pseudo);
      console.log('   Role:', admin.role);
      console.log('   Status:', admin.status);
      console.log('   Vérifié:', admin.verified);
      
      // Test avec différents mots de passe possibles
      const possiblePasswords = [
        'admin123',
        'Admin123',
        'Admin123!',
        'AdminTest123!',
        'admin',
        'cadok123',
        'Cadok123!',
        '123456',
        'password'
      ];
      
      console.log('\n🔍 Test des mots de passe possibles...');
      for (const password of possiblePasswords) {
        try {
          const isMatch = await bcrypt.compare(password, admin.password);
          console.log(`   "${password}": ${isMatch ? '✅ CORRECT' : '❌'}`);
          if (isMatch) {
            console.log(`\n🎉 MOT DE PASSE TROUVÉ: "${password}"`);
            break;
          }
        } catch (err) {
          console.log(`   "${password}": ❌ Erreur`);
        }
      }
    } else {
      console.log('❌ Admin non trouvé avec l\'email admin@cadok.com');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

checkAdminPassword();
