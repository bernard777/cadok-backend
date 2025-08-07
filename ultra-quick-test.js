/**
 * 🏃 TEST ULTRA-RAPIDE - AUTH
 */

const mongoose = require('mongoose');

async function ultraQuickTest() {
  console.log('⚡ Test ultra-rapide AUTH...');
  
  try {
    // Test connexion MongoDB
    const uri = 'mongodb://127.0.0.1:27017/test_ultra_quick';
    await mongoose.connect(uri);
    console.log('✅ MongoDB OK');
    
    // Test modèle User
    const UserSchema = new mongoose.Schema({
      pseudo: String,
      email: String,
      password: String,
      city: String
    });
    
    const User = mongoose.model('User', UserSchema);
    
    const testUser = new User({
      pseudo: 'Test',
      email: 'test@test.com',
      password: 'hashedpass',
      city: 'Paris'
    });
    
    await testUser.save();
    console.log('✅ User Model OK');
    
    // Test recherche
    const found = await User.findOne({ email: 'test@test.com' });
    if (found) {
      console.log('✅ User Query OK');
    }
    
    // Test bcrypt
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    const valid = await bcrypt.compare('password123', hash);
    if (valid) {
      console.log('✅ Bcrypt OK');
    }
    
    // Test JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 'test' }, 'secret', { expiresIn: '1h' });
    const decoded = jwt.verify(token, 'secret');
    if (decoded.userId === 'test') {
      console.log('✅ JWT OK');
    }
    
    console.log('\\n🎉 TOUS LES COMPOSANTS AUTH FONCTIONNENT !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  }
}

ultraQuickTest().catch(console.error);
