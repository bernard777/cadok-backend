require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ObjectModel = require('../models/Object');
const User = require('../models/User');
const Category = require('../models/Category');

async function seedTestObjects() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer 2 utilisateurs de test
    console.log('👥 Création des utilisateurs de test...');
    const hashedPassword = await bcrypt.hash('HashedPassword123!', 10);
    
    const user1 = new User({
      pseudo: 'TestUser1',
      email: 'testuser1@test.com',
      password: hashedPassword,
      city: 'Paris'
    });
    await user1.save();
    
    const user2 = new User({
      pseudo: 'TestUser2', 
      email: 'testuser2@test.com',
      password: hashedPassword,
      city: 'Lyon'
    });
    await user2.save();

    console.log('✅ Utilisateurs créés:', user1._id, user2._id);

    // Récupérer la catégorie Électronique
    const category = await Category.findOne({ name: 'Électronique' });
    if (!category) {
      throw new Error('Catégorie Électronique non trouvée');
    }
    console.log('✅ Catégorie trouvée:', category._id);

    // Créer des objets directement sans passer par l'API (évite rate limiting)
    const object1 = new ObjectModel({
      title: 'iPhone Test Seed',
      description: 'iPhone créé par seed pour les tests',
      category: category._id,
      owner: user1._id,
      images: [{
        url: '/uploads/test-iphone.jpg',
        caption: 'iPhone pour tests',
        isPrimary: true
      }],
      attributes: {
        marque: 'Apple',
        modèle: 'iPhone 12',
        état: 'bon',
        couleur: 'noir'
      }
    });
    await object1.save();

    const object2 = new ObjectModel({
      title: 'Samsung Test Seed',
      description: 'Samsung créé par seed pour les tests',
      category: category._id,
      owner: user2._id,
      images: [{
        url: '/uploads/test-samsung.jpg',
        caption: 'Samsung pour tests',
        isPrimary: true
      }],
      attributes: {
        marque: 'Samsung',
        modèle: 'Galaxy S21',
        état: 'excellent',
        couleur: 'blanc'
      }
    });
    await object2.save();

    console.log('✅ Objets créés:', object1._id, object2._id);
    
    console.log('\n🎯 DONNÉES DE TEST PRÊTES !');
    console.log('User1:', user1._id, '- TestUser1 - testuser1@test.com');
    console.log('User2:', user2._id, '- TestUser2 - testuser2@test.com');
    console.log('Object1 (User1):', object1._id, '- iPhone Test Seed');
    console.log('Object2 (User2):', object2._id, '- Samsung Test Seed');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  }
}

seedTestObjects();
