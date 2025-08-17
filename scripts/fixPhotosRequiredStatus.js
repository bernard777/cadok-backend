/**
 * Script de correction pour les échanges mal convertis
 * Remet les échanges en statut approprié selon leur contexte
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Charger le modèle Trade
require('../models/Trade');

async function fixPhotosRequiredStatus() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB');

    const Trade = mongoose.model('Trade');
    
    console.log('🔍 Recherche de TOUS les échanges accepted...');
    
    // Récupérer tous les échanges accepted pour debug
    const acceptedTrades = await Trade.find({ 
      status: 'accepted'
    }).populate('fromUser toUser');
    
    console.log(`📊 Trouvé ${acceptedTrades.length} échange(s) accepted au total`);
    
    for (const trade of acceptedTrades) {
      console.log(`\n🔍 Analyse du troc ${trade._id}:`);
      console.log(`   FromUser: ${trade.fromUser?.pseudo || 'undefined'}`);
      console.log(`   ToUser: ${trade.toUser?.pseudo || 'undefined'}`);
      console.log(`   OfferedObjects: ${trade.offeredObjects?.length || 0}`);
      console.log(`   RequestedObjects: ${trade.requestedObjects?.length || 0}`);
      console.log(`   CreatedAt: ${trade.createdAt}`);
      
      // Si toUser n'a pas encore proposé d'objets, c'est encore en pending
      if (!trade.offeredObjects || trade.offeredObjects.length === 0) {
        console.log(`   ➡️  Remise en PENDING (aucun objet proposé par toUser)`);
        await Trade.findByIdAndUpdate(trade._id, { status: 'pending' });
      }
      // Si toUser a proposé des objets, c'est en proposed
      else if (trade.offeredObjects && trade.offeredObjects.length > 0) {
        console.log(`   ➡️  Remise en PROPOSED (objets proposés par toUser)`);
        await Trade.findByIdAndUpdate(trade._id, { status: 'proposed' });
      }
    }
    
    console.log('\n✅ Correction terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion MongoDB');
    process.exit(0);
  }
}

// Exécuter la correction
fixPhotosRequiredStatus();
