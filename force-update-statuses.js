/**
 * 🔧 CORRECTION DIRECTE DES STATUTS EN BASE 
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const forceUpdateStatuses = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB réussie\n');

    // Mise à jour directe avec updateOne pour être sûr
    console.log('🔧 Mise à jour forcée des statuts...\n');

    // Alice_Martin -> banned
    const aliceUpdate = await User.updateOne(
      { email: 'alice.martin@test-cadok.com' },
      { 
        $set: { 
          status: 'banned',
          bannedAt: new Date(),
          bannedUntil: null,
          banReason: 'Utilisateur de test - Bannissement pour démonstration'
        }
      }
    );
    console.log(`📝 Alice_Martin -> banned:`, aliceUpdate.modifiedCount > 0 ? '✅' : '❌');

    // David_Moreau -> pending  
    const davidUpdate = await User.updateOne(
      { email: 'david.moreau@test-cadok.com' },
      { $set: { status: 'pending' } }
    );
    console.log(`📝 David_Moreau -> pending:`, davidUpdate.modifiedCount > 0 ? '✅' : '❌');

    // Gabrielle_Roux -> inactive
    const gabrielleUpdate = await User.updateOne(
      { email: 'gabrielle.roux@test-cadok.com' },
      { $set: { status: 'inactive' } }
    );
    console.log(`📝 Gabrielle_Roux -> inactive:`, gabrielleUpdate.modifiedCount > 0 ? '✅' : '❌');

    // Isabelle_Simon -> suspended
    const isabelleUpdate = await User.updateOne(
      { email: 'isabelle.simon@test-cadok.com' },
      { 
        $set: { 
          status: 'suspended',
          suspendedAt: new Date(),
          suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          suspendReason: 'Compte temporairement suspendu pour vérification'
        }
      }
    );
    console.log(`📝 Isabelle_Simon -> suspended:`, isabelleUpdate.modifiedCount > 0 ? '✅' : '❌');

    // Vérification immédiate
    console.log('\n🔍 Vérification immédiate...');
    
    const alice = await User.findOne({ email: 'alice.martin@test-cadok.com' }, 'pseudo status bannedAt');
    console.log(`Alice: ${alice.pseudo} - ${alice.status} ${alice.status === 'banned' ? '🚫' : ''}`);
    
    const david = await User.findOne({ email: 'david.moreau@test-cadok.com' }, 'pseudo status');  
    console.log(`David: ${david.pseudo} - ${david.status} ${david.status === 'pending' ? '⏳' : ''}`);
    
    const gabrielle = await User.findOne({ email: 'gabrielle.roux@test-cadok.com' }, 'pseudo status');
    console.log(`Gabrielle: ${gabrielle.pseudo} - ${gabrielle.status} ${gabrielle.status === 'inactive' ? '😴' : ''}`);
    
    const isabelle = await User.findOne({ email: 'isabelle.simon@test-cadok.com' }, 'pseudo status suspendedUntil');
    console.log(`Isabelle: ${isabelle.pseudo} - ${isabelle.status} ${isabelle.status === 'suspended' ? '⏸️' : ''}`);
    if (isabelle.suspendedUntil) {
      console.log(`   Suspendue jusqu'au: ${isabelle.suspendedUntil}`);
    }

    await mongoose.disconnect();
    console.log('\n🎉 Mise à jour terminée !');
    console.log('🎯 Maintenant, dans l\'app mobile, vous devriez voir :');
    console.log('   - Alice_Martin avec statut BANNI 🚫');
    console.log('   - David_Moreau avec statut EN ATTENTE ⏳');
    console.log('   - Gabrielle_Roux avec statut INACTIF 😴');
    console.log('   - Isabelle_Simon avec statut SUSPENDU ⏸️');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

forceUpdateStatuses();
