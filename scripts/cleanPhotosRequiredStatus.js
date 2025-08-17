/**
 * Script de migration pour supprimer le statut photos_required
 * Convertit tous les échanges photos_required en accepted
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Charger le modèle Trade
require('../models/Trade');

async function cleanPhotosRequiredStatus() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à MongoDB');

    // Récupérer le modèle Trade
    const Trade = mongoose.model('Trade');
    
    console.log('🔍 Recherche des échanges avec statut photos_required...');
    const photosRequiredTrades = await Trade.find({ status: 'photos_required' });
    
    console.log(`📊 Trouvé ${photosRequiredTrades.length} échange(s) avec statut photos_required`);
    
    if (photosRequiredTrades.length > 0) {
      console.log('🔧 Conversion en statut accepted...');
      
      const result = await Trade.updateMany(
        { status: 'photos_required' },
        { $set: { status: 'accepted' } }
      );
      
      console.log(`✅ ${result.modifiedCount} échange(s) mis à jour`);
      
      // Vérification
      const remainingPhotosRequired = await Trade.find({ status: 'photos_required' });
      console.log(`🔍 Vérification: ${remainingPhotosRequired.length} échange(s) photos_required restant(s)`);
    } else {
      console.log('✅ Aucun échange photos_required trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion MongoDB');
    process.exit(0);
  }
}

// Exécuter la migration
cleanPhotosRequiredStatus();
