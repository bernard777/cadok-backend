/**
 * Script simple pour corriger l'échange spécifique
 */

const mongoose = require('mongoose');
require('dotenv').config();
require('../models/Trade');

async function fixSpecificTrade() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB');

    const Trade = mongoose.model('Trade');
    
    // ID de l'échange vu dans les logs
    const tradeId = '68a14fc54f19f10493ecdf9d';
    
    const trade = await Trade.findById(tradeId);
    if (trade) {
      console.log(`Échange trouvé: ${tradeId}`);
      console.log(`Status actuel: ${trade.status}`);
      console.log(`OfferedObjects: ${trade.offeredObjects?.length || 0}`);
      
      // Si pas d'objets offerts, remettre en pending
      if (!trade.offeredObjects || trade.offeredObjects.length === 0) {
        trade.status = 'pending';
        await trade.save();
        console.log('✅ Échange remis en pending');
      } else {
        trade.status = 'proposed';
        await trade.save();
        console.log('✅ Échange remis en proposed');
      }
    } else {
      console.log('❌ Échange non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixSpecificTrade();
