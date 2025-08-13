/**
 * 🧹 NETTOYAGE ET CRÉATION DE DONNÉES DE TEST - CADOK
 * Supprime les anciennes données de test et en crée de nouvelles
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');
const Report = require('../models/Report');
const { createComprehensiveTestData } = require('./create-comprehensive-test-data');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';

/**
 * 🗑️ SUPPRESSION DES DONNÉES DE TEST
 */
async function cleanTestData() {
  console.log('🧹 Nettoyage des anciennes données de test...');
  
  try {
    // Supprimer les utilisateurs de test (sauf le super admin principal)
    const testEmails = [
      '@cadok.app', '@test-cadok.com', 'marie.test@', 'alex.tech@', 
      'clara.books@', 'julien.bricoleur@', 'sophie.sport@', 
      'markus.collector@', 'emma.creative@'
    ];
    
    for (const emailPattern of testEmails) {
      const testUsers = await User.find({ 
        email: { $regex: emailPattern, $options: 'i' },
        email: { $ne: 'ndongoambassa7@gmail.com' } // Protéger le super admin
      });
      
      if (testUsers.length > 0) {
        console.log(`🗑️ Suppression de ${testUsers.length} utilisateurs avec ${emailPattern}...`);
        
        // Supprimer les objets de ces utilisateurs
        for (const user of testUsers) {
          await ObjectModel.deleteMany({ owner: user._id });
          await Trade.deleteMany({ 
            $or: [
              { fromUser: user._id },
              { toUser: user._id }
            ]
          });
          await Report.deleteMany({ 
            $or: [
              { reporter: user._id },
              { reportedUser: user._id }
            ]
          });
        }
        
        // Supprimer les utilisateurs
        await User.deleteMany({ 
          email: { $regex: emailPattern, $options: 'i' },
          email: { $ne: 'ndongoambassa7@gmail.com' }
        });
      }
    }
    
    // Supprimer les objets orphelins
    const orphanObjects = await ObjectModel.find({ owner: { $exists: false } });
    if (orphanObjects.length > 0) {
      console.log(`🗑️ Suppression de ${orphanObjects.length} objets orphelins...`);
      await ObjectModel.deleteMany({ owner: { $exists: false } });
    }
    
    // Supprimer les échanges orphelins
    const orphanTrades = await Trade.find({
      $or: [
        { fromUser: { $exists: false } },
        { toUser: { $exists: false } }
      ]
    });
    if (orphanTrades.length > 0) {
      console.log(`🗑️ Suppression de ${orphanTrades.length} échanges orphelins...`);
      await Trade.deleteMany({
        $or: [
          { fromUser: { $exists: false } },
          { toUser: { $exists: false } }
        ]
      });
    }
    
    console.log('✅ Nettoyage terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    throw error;
  }
}

/**
 * 📊 STATISTIQUES AVANT/APRÈS
 */
async function showStats(label) {
  const stats = {
    users: await User.countDocuments(),
    objects: await ObjectModel.countDocuments(),
    trades: await Trade.countDocuments(),
    reports: await Report.countDocuments()
  };
  
  console.log(`📊 ${label}:`);
  console.log(`   👥 Utilisateurs: ${stats.users}`);
  console.log(`   📦 Objets: ${stats.objects}`);
  console.log(`   🔄 Échanges: ${stats.trades}`);
  console.log(`   🚨 Signalements: ${stats.reports}`);
  
  return stats;
}

/**
 * 🚀 SCRIPT PRINCIPAL
 */
async function cleanAndCreateTestData() {
  try {
    console.log('🚀 Nettoyage et création de données de test CADOK...');
    console.log('🎯 Base de données:', MONGODB_URI);
    
    // Connexion
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie\n');
    
    // Statistiques avant
    const statsBefore = await showStats('AVANT NETTOYAGE');
    console.log('');
    
    // Nettoyage
    await cleanTestData();
    console.log('');
    
    // Statistiques après nettoyage
    const statsAfterClean = await showStats('APRÈS NETTOYAGE');
    console.log('');
    
    // Fermer la connexion pour le script de création
    await mongoose.connection.close();
    
    // Créer les nouvelles données
    console.log('🆕 Création des nouvelles données de test...\n');
    await createComprehensiveTestData();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

// Exécuter le script
if (require.main === module) {
  cleanAndCreateTestData();
}

module.exports = { cleanTestData, cleanAndCreateTestData };