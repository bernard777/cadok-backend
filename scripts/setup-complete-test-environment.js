/**
 * 🚀 SETUP COMPLET DONNÉES PRODUCTION - CADOK
 * Script maître pour créer toutes les données de test
 */

const { createProductionTestData } = require('./create-production-test-data');
const { setupAdminRights } = require('./setup-admin-rights');

async function setupCompleteTestEnvironment() {
  console.log('🏗️ CONFIGURATION COMPLÈTE ENVIRONNEMENT DE TEST');
  console.log('================================================\n');
  
  try {
    // Étape 1: Créer les données de base
    console.log('📦 ÉTAPE 1/2: Création des données de test...');
    await createProductionTestData();
    
    // Petit délai pour s'assurer que tout est bien enregistré
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Étape 2: Configurer les droits admin
    console.log('\n🔐 ÉTAPE 2/2: Configuration des droits administrateur...');
    await setupAdminRights();
    
    console.log('\n🎊 ENVIRONNEMENT DE TEST CONFIGURÉ AVEC SUCCÈS !');
    console.log('==============================================');
    console.log('\n🔑 COMPTES DE TEST DISPONIBLES :');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ 👑 SUPER ADMIN                                          │');
    console.log('│ Email: alexandre.martin@email.com                      │');
    console.log('│ Password: Password123!                                  │');
    console.log('│ Rôle: Accès complet système + gestion admins           │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 🛡️ ADMIN                                                │');
    console.log('│ Email: marie.lambert@email.com                         │');
    console.log('│ Password: Password123!                                  │');
    console.log('│ Rôle: Gestion échanges + signalements + modération     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ 👤 UTILISATEUR PREMIUM                                  │');
    console.log('│ Email: clara.dubois@email.com                          │');
    console.log('│ Password: Password123!                                  │');
    console.log('│ Rôle: Utilisateur normal avec abonnement premium       │');
    console.log('└─────────────────────────────────────────────────────────┘');
    
    console.log('\n📊 DONNÉES CRÉÉES :');
    console.log('• 6 utilisateurs avec profils réalistes');
    console.log('• 12 objets dans différentes catégories');
    console.log('• 5 échanges avec statuts variés (proposed, accepted, completed, disputed, cancelled)');
    console.log('• 2 signalements pour tester la modération');
    console.log('• Statistiques utilisateurs mises à jour');
    
    console.log('\n🧪 SCÉNARIOS DE TEST DISPONIBLES :');
    console.log('• Test supervision échanges (échanges en cours, litiges)');
    console.log('• Test gestion signalements (signalements en attente)');
    console.log('• Test statistiques dashboard admin');
    console.log('• Test droits et permissions différenciés');
    console.log('• Test interface utilisateur vs admin');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    process.exit(1);
  }
}

// Exécuter le setup complet
if (require.main === module) {
  setupCompleteTestEnvironment();
}

module.exports = { setupCompleteTestEnvironment };
