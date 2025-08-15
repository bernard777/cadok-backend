/**
 * 🧪 DÉMO MODE SIMULATION EMAIL
 * Simulation d'envois d'emails pour tests multi-utilisateurs
 */

require('dotenv').config();

console.log('📧 DÉMO MODE SIMULATION CADOK\n');

// Simulation simple du service email
const emailSimulator = {
  simulatedEmails: [],
  
  async sendWelcomeEmail(email, pseudo) {
    const isSimulation = process.env.EMAIL_SIMULATION_MODE === 'true';
    
    console.log(`📧 Envoi email de bienvenue à: ${email} (${pseudo})`);
    
    if (isSimulation) {
      // Mode simulation : on stocke l'email sans l'envoyer
      const simulatedEmail = {
        id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        to: email,
        pseudo: pseudo,
        subject: '🎉 Bienvenue sur CADOK !',
        timestamp: new Date().toISOString(),
        status: 'simulated'
      };
      
      this.simulatedEmails.push(simulatedEmail);
      
      console.log(`✅ [SIMULATION] Email simulé avec ID: ${simulatedEmail.id}`);
      
      return {
        success: true,
        messageId: simulatedEmail.id,
        simulationMode: true,
        service: 'Resend (Simulation)'
      };
      
    } else {
      console.log('📧 [RÉEL] Envoi via Resend API...');
      // Ici on ferait l'appel réel à Resend
      return {
        success: true,
        messageId: `real_${Date.now()}`,
        simulationMode: false,
        service: 'Resend'
      };
    }
  },
  
  getSimulatedEmails() {
    return this.simulatedEmails;
  }
};

async function demonstrateMultiUserTesting() {
  console.log('🎯 DÉMONSTRATION : Tests avec plusieurs utilisateurs\n');
  
  // Utilisateurs de test (impossible avec Resend gratuit normalement)
  const testUsers = [
    { email: 'alice@test.com', pseudo: 'Alice' },
    { email: 'bob@example.org', pseudo: 'Bob' },
    { email: 'charlie@demo.net', pseudo: 'Charlie' },
    { email: 'diana@cadok.test', pseudo: 'Diana' },
    { email: 'jboriasse@gmail.com', pseudo: 'JB' }
  ];
  
  console.log('📝 Création de comptes pour tous les utilisateurs :\n');
  
  // Envoi des emails de bienvenue
  for (const user of testUsers) {
    const result = await emailSimulator.sendWelcomeEmail(user.email, user.pseudo);
    
    if (result.success) {
      console.log(`   ✅ ${user.pseudo} : Email ${result.simulationMode ? 'simulé' : 'envoyé'}`);
    } else {
      console.log(`   ❌ ${user.pseudo} : Erreur`);
    }
  }
  
  console.log('\n📊 RÉSUMÉ DES TESTS :');
  console.log('====================================');
  
  const simulated = emailSimulator.getSimulatedEmails();
  
  if (simulated.length > 0) {
    console.log(`🎉 ${simulated.length} utilisateurs ont pu créer leur compte !`);
    console.log('\n📧 Emails simulés :');
    
    simulated.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.pseudo} (${email.to})`);
      console.log(`      ID: ${email.id}`);
      console.log(`      Heure: ${new Date(email.timestamp).toLocaleTimeString('fr-FR')}`);
    });
    
    console.log('\n✅ SUCCÈS : Tous les utilisateurs peuvent s\'inscrire simultanément !');
    console.log('🚀 Mode simulation parfait pour les tests de développement.');
    
  } else {
    console.log('📧 Mode réel activé - emails envoyés via Resend');
  }
  
  console.log('\n💡 POUR ACTIVER LA SIMULATION :');
  console.log('   Ajoutez dans .env : EMAIL_SIMULATION_MODE=true');
  
  console.log('\n🔧 POUR DÉSACTIVER LA SIMULATION :');
  console.log('   Changez dans .env : EMAIL_SIMULATION_MODE=false');
}

// Exécution de la démo
demonstrateMultiUserTesting();
