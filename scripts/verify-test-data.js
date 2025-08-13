/**
 * 🧪 VÉRIFICATION DES DONNÉES DE TEST - CADOK
 * Script pour vérifier que les données ont été créées correctement
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';

async function verifyTestData() {
  try {
    console.log('🔍 Vérification des données de test CADOK...');
    console.log('🎯 Base de données:', MONGODB_URI);
    
    // Connexion
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie\n');

    // Statistiques générales
    const stats = {
      users: await User.countDocuments(),
      objects: await ObjectModel.countDocuments(),
      trades: await Trade.countDocuments()
    };

    console.log('📊 STATISTIQUES GÉNÉRALES:');
    console.log(`   👥 Utilisateurs: ${stats.users}`);
    console.log(`   📦 Objets: ${stats.objects}`);
    console.log(`   🔄 Échanges: ${stats.trades}\n`);

    // Super admin
    const superAdmin = await User.findOne({ email: 'ndongoambassa7@gmail.com' });
    if (superAdmin) {
      console.log('🦸‍♂️ SUPER ADMIN:');
      console.log(`   📧 Email: ${superAdmin.email}`);
      console.log(`   👤 Pseudo: ${superAdmin.pseudo}`);
      console.log(`   🛡️ Rôle: ${superAdmin.role}`);
      console.log(`   ⚡ Admin: ${superAdmin.isAdmin ? 'Oui' : 'Non'}`);
      console.log(`   📍 Ville: ${superAdmin.city}\n`);
    } else {
      console.log('❌ Super Admin non trouvé !\n');
    }

    // Utilisateurs de test
    const testUsers = await User.find({ 
      email: { $regex: '@cadok\.app$' } 
    }).select('pseudo email city role isAdmin subscriptionPlan');
    
    console.log('👥 UTILISATEURS DE TEST:');
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.pseudo} (${user.email})`);
      console.log(`      📍 ${user.city} | 🛡️ ${user.role} | 💎 ${user.subscriptionPlan || 'basic'}`);
    });
    console.log('');

    // Objets par utilisateur
    const objectsByUser = await ObjectModel.aggregate([
      { $group: { 
        _id: '$owner', 
        count: { $sum: 1 },
        titles: { $push: '$title' }
      }},
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }},
      { $unwind: '$user' },
      { $sort: { count: -1 } }
    ]);

    console.log('📦 OBJETS PAR UTILISATEUR:');
    objectsByUser.forEach((data, index) => {
      console.log(`   ${index + 1}. ${data.user.pseudo}: ${data.count} objets`);
      data.titles.forEach(title => {
        console.log(`      - ${title}`);
      });
    });
    console.log('');

    // États des échanges
    const tradeStates = await Trade.aggregate([
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    console.log('🔄 ÉTATS DES ÉCHANGES:');
    tradeStates.forEach((state, index) => {
      console.log(`   ${index + 1}. ${state._id.toUpperCase()}: ${state.count}`);
    });
    console.log('');

    // Échanges avec le super admin
    const adminTrades = await Trade.find({
      $or: [
        { fromUser: superAdmin._id },
        { toUser: superAdmin._id }
      ]
    }).populate('fromUser toUser', 'pseudo email')
     .populate('offeredObjects requestedObjects', 'title');

    console.log('🦸‍♂️ ÉCHANGES DU SUPER ADMIN:');
    adminTrades.forEach((trade, index) => {
      console.log(`   ${index + 1}. ${trade.status.toUpperCase()}`);
      console.log(`      De: ${trade.fromUser.pseudo} → Vers: ${trade.toUser.pseudo}`);
      console.log(`      Message: ${trade.message}`);
      if (trade.offeredObjects.length > 0) {
        console.log(`      Propose: ${trade.offeredObjects.map(o => o.title).join(', ')}`);
      }
      if (trade.requestedObjects.length > 0) {
        console.log(`      Demande: ${trade.requestedObjects.map(o => o.title).join(', ')}`);
      }
    });
    console.log('');

    // Vérification des coordonnées GPS
    const objectsWithGPS = await ObjectModel.find({ 
      'location.coordinates': { $exists: true, $ne: null } 
    }).countDocuments();
    
    console.log('📍 GÉOLOCALISATION:');
    console.log(`   🗺️ Objets avec coordonnées GPS: ${objectsWithGPS}/${stats.objects}`);
    console.log('');

    console.log('✅ VÉRIFICATION TERMINÉE - Données cohérentes ! 🚀');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  verifyTestData();
}

module.exports = { verifyTestData };
