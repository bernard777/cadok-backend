const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    console.log('🔍 VÉRIFICATION UTILISATEURS');
    console.log('============================');
    
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB\n');

    // Chercher tous les admins
    const admins = await User.find({ 
      $or: [
        { role: 'admin' },
        { role: 'super_admin' },
        { isAdmin: true }
      ]
    });

    console.log(`📊 ${admins.length} administrateurs trouvés:\n`);
    
    for (const admin of admins) {
      console.log(`👤 ${admin.pseudo} (${admin.email})`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   isAdmin: ${admin.isAdmin}`);
      console.log(`   Vérifié: ${admin.verified}`);
      console.log(`   Status: ${admin.status}`);
      console.log('');
    }

    // Chercher spécifiquement notre admin de test
    const testAdmin = await User.findOne({ email: 'admin@cadok.test' });
    
    if (testAdmin) {
      console.log('🎯 Admin de test trouvé:');
      console.log(`   Email: ${testAdmin.email}`);
      console.log(`   Pseudo: ${testAdmin.pseudo}`);
      console.log(`   Role: ${testAdmin.role}`);
      console.log(`   isAdmin: ${testAdmin.isAdmin}`);
      console.log(`   Status: ${testAdmin.status}`);
      console.log(`   Mot de passe hash: ${testAdmin.password ? 'Présent' : 'Absent'}`);
      
      // Test du mot de passe
      const passwordTest = await bcrypt.compare('AdminTest123!', testAdmin.password);
      console.log(`   Test mot de passe: ${passwordTest ? 'OK' : 'ÉCHEC'}`);
    } else {
      console.log('❌ Admin de test non trouvé');
      
      // Créer l'admin de test
      console.log('\n🔧 Création admin de test...');
      const hashedPassword = await bcrypt.hash('AdminTest123!', 12);
      
      const newAdmin = new User({
        pseudo: 'AdminTest',
        email: 'admin@cadok.test',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Test',
        city: 'Test',
        phoneNumber: '+33123456789',
        address: {
          street: '123 Admin Street',
          city: 'Test',
          zipCode: '12345'
        },
        role: 'admin',
        isAdmin: true,
        verified: true,
        status: 'active'
      });
      
      await newAdmin.save();
      console.log('✅ Admin de test créé avec succès');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

checkUsers();
