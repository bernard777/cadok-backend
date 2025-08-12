const mongoose = require('mongoose');

async function checkDatabases() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion à MongoDB réussie');
    
    // Lister toutes les bases
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('📊 Bases de données disponibles:');
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Vérifier la base actuelle
    console.log('\n🔍 Base actuelle: cadok');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections dans cadok:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Compter les utilisateurs
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      pseudo: String,
      role: String,
      isAdmin: Boolean
    }));
    
    const userCount = await User.countDocuments();
    console.log(`\n👥 Nombre total d'utilisateurs: ${userCount}`);
    
    // Chercher l'admin
    const adminUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    if (adminUser) {
      console.log('✅ Admin trouvé:');
      console.log(`  - ID: ${adminUser._id}`);
      console.log(`  - Email: ${adminUser.email}`);
      console.log(`  - Pseudo: ${adminUser.pseudo}`);
      console.log(`  - Role: ${adminUser.role}`);
      console.log(`  - isAdmin: ${adminUser.isAdmin}`);
    } else {
      console.log('❌ Admin non trouvé dans cette base');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabases();
