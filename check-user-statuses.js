/**
 * 🔍 VÉRIFIER LES STATUTS DES UTILISATEURS DE TEST
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const checkUserStatuses = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB réussie\n');

    // Récupérer tous les utilisateurs de test
    const testUsers = await User.find({ email: { $regex: '@test-cadok\.com$' } })
      .select('pseudo email status verified bannedAt bannedUntil banReason suspendedAt suspendedUntil suspendReason createdAt')
      .sort({ pseudo: 1 });

    console.log(`📊 Utilisateurs de test trouvés: ${testUsers.length}\n`);

    testUsers.forEach((user, index) => {
      console.log(`👤 ${index + 1}. ${user.pseudo}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📊 Statut: ${user.status || 'active'}`);
      console.log(`   ✅ Vérifié: ${user.verified ? 'Oui' : 'Non'}`);
      
      if (user.status === 'banned') {
        console.log(`   🚫 Banni le: ${user.bannedAt}`);
        console.log(`   🚫 Banni jusqu'au: ${user.bannedUntil || 'Définitif'}`);
        console.log(`   🚫 Raison: ${user.banReason || 'Non spécifiée'}`);
      }
      
      if (user.status === 'suspended') {
        console.log(`   ⏸️  Suspendu le: ${user.suspendedAt}`);
        console.log(`   ⏸️  Suspendu jusqu'au: ${user.suspendedUntil || 'Définitif'}`);
        console.log(`   ⏸️  Raison: ${user.suspendReason || 'Non spécifiée'}`);
      }
      
      console.log('');
    });

    // Statistiques
    const statusCounts = {};
    testUsers.forEach(user => {
      const status = user.status || 'active';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('📈 RÉPARTITION DES STATUTS:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} utilisateurs`);
    });

    // Corriger Isabelle Simon si nécessaire
    const isabelle = testUsers.find(u => u.pseudo === 'Isabelle_Simon');
    if (isabelle && isabelle.status !== 'suspended') {
      console.log('\n🔧 CORRECTION: Mise à jour du statut d\'Isabelle Simon...');
      
      await User.findByIdAndUpdate(isabelle._id, {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        suspendReason: 'Compte temporairement suspendu pour vérification.',
        adminNotes: `[${new Date().toISOString()}] Statut corrigé automatiquement`
      });
      
      console.log('✅ Isabelle Simon mise à jour avec le statut "suspended"');
    }

    await mongoose.disconnect();
    console.log('\n✅ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

checkUserStatuses();
