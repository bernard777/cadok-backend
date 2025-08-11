const mongoose = require('mongoose');
require('dotenv').config();

const Trade = require('./models/Trade');
const User = require('./models/User');
const ObjectModel = require('./models/Object');

async function debugTrades() {
  try {
    console.log('🔍 DEBUG ÉCHANGES');
    console.log('=================\n');

    await mongoose.connect('mongodb://localhost:27017/cadok_test');
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer tous les échanges
    console.log('📋 Échanges bruts:');
    const tradesBruts = await Trade.find();
    console.log(`${tradesBruts.length} échanges trouvés\n`);

    for (const trade of tradesBruts) {
      console.log(`🔄 Échange ${trade._id}:`);
      console.log(`   Status: ${trade.status}`);
      console.log(`   FromUser: ${trade.fromUser}`);
      console.log(`   ToUser: ${trade.toUser}`);
      console.log(`   RequestedObjects: ${trade.requestedObjects?.length || 0}`);
      console.log(`   OfferedObjects: ${trade.offeredObjects?.length || 0}`);
      console.log('');
    }

    // Test avec population
    console.log('📋 Échanges avec population:');
    const tradesPopulated = await Trade.find()
      .populate('fromUser', 'pseudo email avatar')
      .populate('toUser', 'pseudo email avatar')
      .populate('requestedObjects', 'title description')
      .populate('offeredObjects', 'title description');

    console.log(`${tradesPopulated.length} échanges populés\n`);

    for (const trade of tradesPopulated) {
      console.log(`🔄 Échange ${trade._id}:`);
      console.log(`   Status: ${trade.status}`);
      console.log(`   FromUser: ${trade.fromUser ? trade.fromUser.pseudo : 'NULL'}`);
      console.log(`   ToUser: ${trade.toUser ? trade.toUser.pseudo : 'NULL'}`);
      console.log(`   RequestedObjects: ${trade.requestedObjects?.length || 0}`);
      console.log(`   OfferedObjects: ${trade.offeredObjects?.length || 0}`);
      
      if (!trade.fromUser) {
        console.log(`   ⚠️ FromUser manquant !`);
      }
      if (!trade.toUser) {
        console.log(`   ⚠️ ToUser manquant !`);
      }
      console.log('');
    }

    // Vérifier les utilisateurs
    console.log('👥 Utilisateurs:');
    const users = await User.find({ email: /@test\.com$/ }, 'pseudo email');
    users.forEach(user => {
      console.log(`   ${user._id}: ${user.pseudo} (${user.email})`);
    });

    // Vérifier les objets
    console.log('\n📦 Objets:');
    const objects = await ObjectModel.find({}, 'title owner');
    objects.forEach(obj => {
      console.log(`   ${obj._id}: ${obj.title} (propriétaire: ${obj.owner})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugTrades();
