/**
 * 🔧 CORRIGER LES STATUTS DES UTILISATEURS DE TEST
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const fixTestUserStatuses = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB réussie\n');

    // Définir les statuts corrects selon le plan initial
    const statusUpdates = [
      {
        email: 'david.moreau@test-cadok.com',
        status: 'pending',
        reason: 'Nouveau sur la plateforme, compte en attente de validation'
      },
      {
        email: 'gabrielle.roux@test-cadok.com', 
        status: 'inactive',
        reason: 'Utilisatrice inactive depuis quelques mois'
      },
      {
        email: 'isabelle.simon@test-cadok.com',
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        suspendReason: 'Compte temporairement suspendu pour vérification',
        reason: 'Compte temporairement suspendu pour vérification'
      }
    ];

    console.log('🔧 Application des corrections de statuts...\n');

    for (const update of statusUpdates) {
      const user = await User.findOne({ email: update.email });
      
      if (user) {
        console.log(`👤 Mise à jour: ${user.pseudo}`);
        console.log(`   📊 Ancien statut: ${user.status || 'active'}`);
        console.log(`   📊 Nouveau statut: ${update.status}`);
        
        const updateData = {
          status: update.status,
          adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] Statut corrigé: ${update.reason}`
        };

        // Ajouter les champs spécifiques pour la suspension
        if (update.status === 'suspended') {
          updateData.suspendedAt = update.suspendedAt;
          updateData.suspendedUntil = update.suspendedUntil;
          updateData.suspendReason = update.suspendReason;
        }

        await User.findByIdAndUpdate(user._id, updateData);
        console.log(`   ✅ Statut mis à jour avec succès`);
        console.log('');
      }
    }

    // Créer un utilisateur vraiment banni pour les tests
    const alice = await User.findOne({ email: 'alice.martin@test-cadok.com' });
    if (alice) {
      console.log(`👤 Bannissement de test: Alice_Martin`);
      await User.findByIdAndUpdate(alice._id, {
        status: 'banned',
        bannedAt: new Date(),
        bannedUntil: null, // Ban définitif
        banReason: 'Utilisateur de test - Bannissement temporaire pour démonstration',
        adminNotes: `${alice.adminNotes || ''}\n[${new Date().toISOString()}] BANNI pour test: Démonstration du système de bannissement`
      });
      console.log(`   ✅ Alice_Martin bannie définitivement pour test`);
      console.log('');
    }

    // Vérification finale
    const testUsers = await User.find({ email: { $regex: '@test-cadok\.com$' } })
      .select('pseudo email status bannedAt suspendedAt')
      .sort({ pseudo: 1 });

    console.log('📊 STATUTS FINAUX:');
    const statusCounts = {};
    testUsers.forEach(user => {
      const status = user.status || 'active';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      let statusDisplay = status;
      if (status === 'banned') statusDisplay += ' 🚫';
      else if (status === 'suspended') statusDisplay += ' ⏸️';
      else if (status === 'pending') statusDisplay += ' ⏳';
      else if (status === 'inactive') statusDisplay += ' 😴';
      else statusDisplay += ' ✅';
      
      console.log(`   ${user.pseudo}: ${statusDisplay}`);
    });

    console.log('\n📈 RÉPARTITION:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} utilisateurs`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Corrections appliquées avec succès !');
    console.log('🎯 Vous pouvez maintenant tester tous les statuts dans l\'interface admin.');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

fixTestUserStatuses();
