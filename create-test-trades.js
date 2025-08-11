/**
 * 🧪 CRÉATEUR D'    // Récupérer les catégories existantes
    const categories = await Category.find();
    if (categories.length === 0) {
      console.log('⚠️ Aucune catégorie trouvée, exécutez d\'abord le script insert-categories.js');
      return;
    }
    console.log(`✅ ${categories.length} catégories trouvées`);

    // Trouver les catégories spécifiques
    const livresCategory = categories.find(c => c.name.includes('Livres'));
    const electroniqueCategory = categories.find(c => c.name.includes('Électronique'));
    const sportCategory = categories.find(c => c.name.includes('Sport'));

    if (!livresCategory || !electroniqueCategory || !sportCategory) {
      console.log('⚠️ Catégories requises manquantes');
      return;
    } Script pour créer des données de test pour la supervision des échanges
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Trade = require('./models/Trade');
const User = require('./models/User');
const ObjectModel = require('./models/Object');
const Category = require('./models/Category');

const createTestTrades = async () => {
  try {
    console.log('🧪 CRÉATION D\'ÉCHANGES DE TEST');
    console.log('==============================');

    // Connexion à MongoDB de test
    await mongoose.connect('mongodb://localhost:27017/cadok_test');
    console.log('✅ Connecté à la base de test');

    // Créer des catégories de test d'abord
    const categories = await Promise.all([
      Category.findOneAndUpdate(
        { name: 'Livres' },
        { name: 'Livres', description: 'Livres et magazines' },
        { upsert: true, new: true }
      ),
      Category.findOneAndUpdate(
        { name: 'Électronique' },
        { name: 'Électronique', description: 'Appareils électroniques' },
        { upsert: true, new: true }
      ),
      Category.findOneAndUpdate(
        { name: 'Sport' },
        { name: 'Sport', description: 'Équipements sportifs' },
        { upsert: true, new: true }
      )
    ]);

    console.log('✅ Catégories de test créées');

    // Créer des utilisateurs de test si nécessaire
    const users = await Promise.all([
      User.findOneAndUpdate(
        { email: 'alice@test.com' },
        {
          pseudo: 'Alice_Trader',
          email: 'alice@test.com',
          password: '$2a$12$test1234567890abcdef',
          city: 'Paris',
          verified: true,
          role: 'user'
        },
        { upsert: true, new: true }
      ),
      User.findOneAndUpdate(
        { email: 'bob@test.com' },
        {
          pseudo: 'Bob_Exchange',
          email: 'bob@test.com', 
          password: '$2a$12$test1234567890abcdef',
          city: 'Lyon',
          verified: true,
          role: 'user'
        },
        { upsert: true, new: true }
      ),
      User.findOneAndUpdate(
        { email: 'claire@test.com' },
        {
          pseudo: 'Claire_Swap',
          email: 'claire@test.com',
          password: '$2a$12$test1234567890abcdef',
          city: 'Marseille',
          verified: true,
          role: 'user'
        },
        { upsert: true, new: true }
      )
    ]);

    console.log('✅ Utilisateurs de test créés');

    // Créer des objets de test
    const objects = await Promise.all([
      ObjectModel.findOneAndUpdate(
        { title: 'Livre Le Petit Prince' },
        {
          title: 'Livre Le Petit Prince',
          description: 'Livre classique en bon état',
          category: livresCategory._id,
          owner: users[0]._id,
          estimatedValue: 15,
          status: 'traded'
        },
        { upsert: true, new: true }
      ),
      ObjectModel.findOneAndUpdate(
        { title: 'Casque Audio Sony' },
        {
          title: 'Casque Audio Sony',
          description: 'Casque audio bluetooth, excellent état',
          category: electroniqueCategory._id,
          owner: users[1]._id,
          estimatedValue: 80,
          status: 'traded'
        },
        { upsert: true, new: true }
      ),
      ObjectModel.findOneAndUpdate(
        { title: 'Appareil Photo Canon' },
        {
          title: 'Appareil Photo Canon',
          description: 'Appareil photo reflex, objectif inclus',
          category: electroniqueCategory._id,
          owner: users[2]._id,
          estimatedValue: 300,
          status: 'available'
        },
        { upsert: true, new: true }
      ),
      ObjectModel.findOneAndUpdate(
        { title: 'Tablette iPad Air' },
        {
          title: 'Tablette iPad Air',
          description: 'Tablette Apple, 64GB, comme neuve',
          category: electroniqueCategory._id,
          owner: users[0]._id,
          estimatedValue: 250,
          status: 'available'
        },
        { upsert: true, new: true }
      ),
      ObjectModel.findOneAndUpdate(
        { title: 'Vélo VTT Trek' },
        {
          title: 'Vélo VTT Trek',
          description: 'VTT en aluminium, 21 vitesses',
          category: sportCategory._id,
          owner: users[1]._id,
          estimatedValue: 200,
          status: 'available'
        },
        { upsert: true, new: true }
      ),
      ObjectModel.findOneAndUpdate(
        { title: 'Console Nintendo Switch' },
        {
          title: 'Console Nintendo Switch',
          description: 'Console portable + dock, 3 jeux inclus',
          category: electroniqueCategory._id,
          owner: users[2]._id,
          estimatedValue: 180,
          status: 'available'
        },
        { upsert: true, new: true }
      )
    ]);

    console.log('✅ Objets de test créés');

    // Créer des échanges de test avec différents statuts
    const testTrades = [
      {
        fromUser: users[0]._id,
        toUser: users[1]._id,
        requestedObjects: [objects[1]._id], // Casque Sony
        offeredObjects: [objects[0]._id], // Livre Petit Prince
        status: 'completed',
        createdAt: new Date('2025-08-01T10:30:00Z'),
        acceptedAt: new Date('2025-08-02T14:20:00Z'),
        completedAt: new Date('2025-08-05T16:30:00Z'),
        estimatedValue: { amount: 95, currency: 'EUR' },
        adminNotes: '[2025-08-05] Échange terminé avec succès'
      },
      {
        fromUser: users[2]._id,
        toUser: users[0]._id,
        requestedObjects: [objects[3]._id], // iPad Air
        offeredObjects: [objects[2]._id], // Canon
        status: 'pending',
        createdAt: new Date('2025-08-09T08:15:00Z'),
        estimatedValue: { amount: 275, currency: 'EUR' }
      },
      {
        fromUser: users[1]._id,
        toUser: users[2]._id,
        requestedObjects: [objects[5]._id], // Nintendo Switch
        offeredObjects: [objects[4]._id], // VTT Trek
        status: 'disputed',
        createdAt: new Date('2025-08-07T16:45:00Z'),
        acceptedAt: new Date('2025-08-08T12:00:00Z'),
        disputeReason: 'Objet reçu non conforme à la description',
        estimatedValue: { amount: 190, currency: 'EUR' },
        adminNotes: '[2025-08-10] Litige signalé par l\'utilisateur'
      },
      {
        fromUser: users[0]._id,
        toUser: users[2]._id,
        requestedObjects: [objects[2]._id], // Canon
        offeredObjects: [objects[3]._id], // iPad
        status: 'proposed',
        createdAt: new Date('2025-08-10T14:22:00Z'),
        estimatedValue: { amount: 275, currency: 'EUR' }
      },
      {
        fromUser: users[1]._id,
        toUser: users[0]._id,
        requestedObjects: [objects[0]._id], // Livre
        offeredObjects: [], // Pas encore proposé
        status: 'cancelled',
        createdAt: new Date('2025-08-06T09:10:00Z'),
        refusedAt: new Date('2025-08-06T18:45:00Z'),
        estimatedValue: { amount: 15, currency: 'EUR' },
        adminNotes: '[2025-08-06] Échange annulé par l\'utilisateur'
      }
    ];

    // Supprimer les anciens échanges de test
    await Trade.deleteMany({
      fromUser: { $in: users.map(u => u._id) }
    });

    // Créer les nouveaux échanges
    const createdTrades = await Trade.create(testTrades);

    console.log(`✅ ${createdTrades.length} échanges de test créés:`);
    createdTrades.forEach((trade, index) => {
      console.log(`   ${index + 1}. ${trade.status.toUpperCase()} - ${trade._id}`);
    });

    // Récapitulatif
    console.log('\n📊 RÉCAPITULATIF:');
    const statusCounts = await Trade.aggregate([
      { $match: { fromUser: { $in: users.map(u => u._id) } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    statusCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} échange(s)`);
    });

    console.log('\n🎯 PRÊT POUR LES TESTS !');
    console.log('L\'interface de supervision peut maintenant être testée avec des données réelles.');

  } catch (error) {
    console.error('❌ Erreur création échanges de test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
createTestTrades();
