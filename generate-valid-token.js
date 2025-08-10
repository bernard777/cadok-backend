/**
 * 🔑 GÉNÉRATION NOUVEAU TOKEN ADMIN VALIDE
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const generateValidAdminToken = async () => {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/cadok');
    
    // 1. Récupérer l'utilisateur admin
    const adminUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Utilisateur admin non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur admin trouvé:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   isAdmin:', adminUser.isAdmin);
    
    // 2. Générer un nouveau token avec la bonne clé secrète
    const JWT_SECRET = process.env.JWT_SECRET;
    console.log('\n🔑 JWT_SECRET utilisé:', JWT_SECRET ? 'Présent' : 'Manquant');
    
    if (!JWT_SECRET) {
      console.log('❌ JWT_SECRET manquant dans .env');
      return;
    }
    
    const token = jwt.sign(
      { id: adminUser._id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('\n✅ NOUVEAU TOKEN GÉNÉRÉ:');
    console.log('========================');
    console.log('Token:', token);
    
    // 3. Test du token généré
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('\n✅ Token validé avec succès');
      console.log('User ID:', decoded.id);
      console.log('Expire:', new Date(decoded.exp * 1000));
      
    } catch (verifyError) {
      console.log('❌ Erreur validation token:', verifyError.message);
    }
    
    // 4. Test API avec ce token
    const axios = require('axios');
    console.log('\n🧪 Test API avec nouveau token...');
    
    try {
      const response = await axios.get('http://localhost:5000/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Test API réussi:', response.data.success ? 'SUCCESS' : 'FAILED');
      
    } catch (apiError) {
      console.log('❌ Test API échoué:', apiError.response?.status, apiError.response?.data?.error);
    }
    
    console.log('\n📋 INSTRUCTIONS:');
    console.log('================');
    console.log('1. Copiez ce token:');
    console.log(`   ${token}`);
    console.log('2. Dans la console de votre navigateur, tapez:');
    console.log(`   localStorage.setItem('token', '${token}');`);
    console.log('3. Rechargez la page et essayez de créer un événement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

// Charger les variables d'environnement
require('dotenv').config();
generateValidAdminToken();
