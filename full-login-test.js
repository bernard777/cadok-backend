/**
 * 🔐 TEST LOGIN AVEC DEBUGGING COMPLET
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const axios = require('axios');

const fullLoginTest = async () => {
  try {
    // 1. Connexion directe à la DB pour vérifier l'utilisateur
    await mongoose.connect('mongodb://localhost:27017/cadok_production');
    console.log('🔌 Connexion DB OK');
    
    const dbUser = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    console.log('\n🎯 UTILISATEUR EN DB:');
    console.log('- Email:', dbUser.email);
    console.log('- Pseudo:', dbUser.pseudo);  
    console.log('- Mot de passe présent:', !!dbUser.password);
    console.log('- Hash commence par:', dbUser.password.substring(0, 10));
    
    // 2. Test direct du hash
    const directPasswordTest = await bcrypt.compare('Admin1234A@', dbUser.password);
    console.log('- Test direct bcrypt:', directPasswordTest ? '✅ OK' : '❌ FAILED');
    
    // 3. Test avec différents formats
    const passwords = [
      'Admin1234A@',
      'Admin1234A@\n',
      'Admin1234A@\r',
      ' Admin1234A@ ',
      'Admin1234A@\r\n'
    ];
    
    console.log('\n🧪 TESTS FORMATS:');
    for (const pwd of passwords) {
      const result = await bcrypt.compare(pwd, dbUser.password);
      console.log(`- "${pwd.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}": ${result ? '✅' : '❌'}`);
    }
    
    // 4. Test via API avec différentes versions
    console.log('\n🌐 TESTS API:');
    
    const testData = [
      { email: 'ndongoambassa7@gmail.com', password: 'Admin1234A@' },
      { email: 'ndongoambassa7@gmail.com', password: 'Admin1234A@'.trim() },
      { email: 'ndongoambassa7@gmail.com'.toLowerCase(), password: 'Admin1234A@' }
    ];
    
    for (let i = 0; i < testData.length; i++) {
      const data = testData[i];
      console.log(`\n📡 Test API ${i + 1}:`, JSON.stringify(data));
      
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', data, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        console.log('✅ SUCCÈS!', response.status);
        console.log('Token présent:', !!response.data.token);
        console.log('User:', response.data.user?.email);
        
        break; // Arrêter si succès
        
      } catch (error) {
        console.log('❌ Échec:', error.response?.status);
        console.log('Erreur:', error.response?.data?.error);
        console.log('Code:', error.response?.data?.code);
        
        // Analyser la réponse d'erreur
        if (error.response?.data?.details) {
          console.log('Détails validation:', error.response.data.details);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur complète:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }
  }
};

fullLoginTest();
