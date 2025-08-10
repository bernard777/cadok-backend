/**
 * 🔍 ROUTE LOGIN DEBUG TEMPORAIRE
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/debug-login', async (req, res) => {
  console.log('\n🔍 === DEBUG LOGIN START ===');
  console.log('Raw body:', req.body);
  console.log('Content-Type:', req.get('Content-Type'));
  
  const { email, password } = req.body;
  
  console.log('Extracted email:', `"${email}"`);
  console.log('Extracted password:', `"${password}"`);
  console.log('Email type:', typeof email);
  console.log('Password type:', typeof password);
  console.log('Email length:', email?.length);
  console.log('Password length:', password?.length);
  
  try {
    // Chercher l'utilisateur
    console.log('\n🔍 Recherche utilisateur...');
    const user = await User.findOne({ email });
    console.log('User trouvé:', !!user);
    
    if (user) {
      console.log('User email from DB:', `"${user.email}"`);
      console.log('Emails match:', email === user.email);
      console.log('User password hash:', user.password.substring(0, 20) + '...');
      
      // Test bcrypt
      console.log('\n🔐 Test bcrypt...');
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('bcrypt result:', isMatch);
      
      // Test avec différentes versions du password
      const passwordVariations = [
        password,
        password.trim(),
        password.replace(/\r\n/g, ''),
        password.replace(/\n/g, ''),
        password.replace(/\r/g, '')
      ];
      
      console.log('\n🧪 Test variations password:');
      for (let i = 0; i < passwordVariations.length; i++) {
        const variation = passwordVariations[i];
        const result = await bcrypt.compare(variation, user.password);
        console.log(`Variation ${i}: "${variation}" -> ${result}`);
      }
    }
    
    res.json({
      success: true,
      userFound: !!user,
      debugging: 'Complete'
    });
    
  } catch (error) {
    console.error('Erreur debug:', error);
    res.status(500).json({ error: error.message });
  }
  
  console.log('🔍 === DEBUG LOGIN END ===\n');
});

module.exports = router;
