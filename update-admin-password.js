const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

async function updateAdminPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion à MongoDB réussie');
    
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      pseudo: String,
      role: String,
      isAdmin: Boolean
    }));
    
    const hashedPassword = await bcrypt.hash('Admin1234A@', 12);
    
    const result = await User.updateOne(
      { email: 'ndongoambassa7@gmail.com' },
      { password: hashedPassword }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Mot de passe admin mis à jour avec succès');
      console.log('📧 Email: ndongoambassa7@gmail.com');
      console.log('🔑 Nouveau mot de passe: Admin1234A@');
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

updateAdminPassword();
