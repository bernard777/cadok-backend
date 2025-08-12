/**
 * 🗑️ SUPPRESSION DU SYSTÈME DE VALEUR ESTIMÉE - CADOK
 * Script pour supprimer complètement les champs estimatedValue de la base
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');

// Configuration base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';

/**
 * Suppression des champs estimatedValue
 */
async function removeEstimatedValueFields() {
  try {
    console.log('🗑️ Suppression du système de valeur estimée...');
    
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Suppression du champ estimatedValue des Objects
    console.log('📦 Suppression estimatedValue des objets...');
    const objectsResult = await ObjectModel.updateMany(
      { estimatedValue: { $exists: true } },
      { $unset: { estimatedValue: "" } }
    );
    console.log(`✅ ${objectsResult.modifiedCount} objets mis à jour`);

    // Suppression du champ estimatedValue des Trades
    console.log('🔄 Suppression estimatedValue des échanges...');
    const tradesResult = await Trade.updateMany(
      { estimatedValue: { $exists: true } },
      { $unset: { estimatedValue: "" } }
    );
    console.log(`✅ ${tradesResult.modifiedCount} échanges mis à jour`);

    console.log('\n🎉 SUPPRESSION TERMINÉE AVEC SUCCÈS !');
    console.log('📊 Résumé:');
    console.log(`   📦 Objets nettoyés: ${objectsResult.modifiedCount}`);
    console.log(`   🔄 Échanges nettoyés: ${tradesResult.modifiedCount}`);
    
    console.log('\n✨ Le système de troc est maintenant purement basé sur l\'échange');
    console.log('   ❌ Plus de valeurs monétaires');
    console.log('   ✅ Échanges basés sur l\'envie et l\'utilité');
    console.log('   ✅ Interface épurée sans références monétaires');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  removeEstimatedValueFields();
}

module.exports = { removeEstimatedValueFields };
