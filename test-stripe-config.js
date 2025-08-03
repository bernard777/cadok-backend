require('dotenv').config();

console.log('🔧 TEST CONFIGURATION STRIPE');
console.log('============================\n');

// Vérification des variables d'environnement
console.log('📋 Variables d\'environnement :');
console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Définie' : '❌ Manquante'}`);
console.log(`STRIPE_PUBLISHABLE_KEY: ${process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Définie' : '❌ Manquante'}`);

if (!process.env.STRIPE_SECRET_KEY) {
  console.log('\n❌ ERREUR: Clé secrète Stripe manquante');
  console.log('💡 Solution:');
  console.log('1. Créez un compte sur https://stripe.com');
  console.log('2. Allez dans Developers > API keys');
  console.log('3. Copiez la clé secrète (sk_test_...)');
  console.log('4. Ajoutez-la dans votre fichier .env');
  process.exit(1);
}

// Test de connexion à Stripe
async function testStripeConnection() {
  try {
    console.log('\n🔌 Test de connexion Stripe...');
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Test simple : récupérer les informations du compte
    const account = await stripe.accounts.retrieve();
    
    console.log('✅ Connexion Stripe réussie !');
    console.log(`📧 Email du compte: ${account.email || 'Non spécifié'}`);
    console.log(`🏷️  Nom du compte: ${account.display_name || account.business_profile?.name || 'Non spécifié'}`);
    console.log(`🌍 Pays: ${account.country}`);
    console.log(`💱 Devises supportées: ${account.capabilities?.transfers || 'Standard'}`);
    
    // Test création d'un Payment Intent
    console.log('\n💳 Test création Payment Intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 200, // 2€ en centimes
      currency: 'eur',
      metadata: {
        test: 'true',
        plan: 'basic'
      }
    });
    
    console.log('✅ Payment Intent créé avec succès !');
    console.log(`🆔 ID: ${paymentIntent.id}`);
    console.log(`💰 Montant: ${paymentIntent.amount / 100}€`);
    console.log(`🔒 Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...`);
    
    // Test récupération des produits (si ils existent)
    console.log('\n📦 Test récupération des produits...');
    const products = await stripe.products.list({ limit: 5 });
    
    if (products.data.length > 0) {
      console.log(`✅ ${products.data.length} produit(s) trouvé(s) :`);
      products.data.forEach(product => {
        console.log(`   - ${product.name} (${product.id})`);
      });
    } else {
      console.log('ℹ️  Aucun produit trouvé (normal pour un nouveau compte)');
      console.log('💡 Vous pouvez créer des produits dans le Dashboard Stripe');
    }
    
    console.log('\n🎉 TOUS LES TESTS STRIPE PASSENT !');
    console.log('✅ Votre configuration Stripe est opérationnelle');
    
  } catch (error) {
    console.log('\n❌ ERREUR lors du test Stripe :');
    console.log(`Message: ${error.message}`);
    
    if (error.code === 'invalid_request_error') {
      console.log('💡 Vérifiez que votre clé secrète est correcte');
    } else if (error.code === 'authentication_required') {
      console.log('💡 Clé d\'API invalide ou expirée');
    }
    
    console.log('\n🔧 Conseils de dépannage :');
    console.log('1. Vérifiez que vous êtes en mode TEST dans Stripe');
    console.log('2. Copiez-collez à nouveau la clé depuis le Dashboard');
    console.log('3. Assurez-vous qu\'il n\'y a pas d\'espaces avant/après la clé');
  }
}

// Test des cartes de test Stripe
function showTestCards() {
  console.log('\n💳 CARTES DE TEST STRIPE');
  console.log('========================');
  console.log('Utilisez ces numéros pour tester les paiements :');
  console.log('');
  console.log('✅ Paiement réussi :');
  console.log('   4242 4242 4242 4242 (Visa)');
  console.log('   5555 5555 5555 4444 (Mastercard)');
  console.log('');
  console.log('❌ Paiement échoué :');
  console.log('   4000 0000 0000 0002 (Carte déclinée)');
  console.log('   4000 0000 0000 9995 (Fonds insuffisants)');
  console.log('');
  console.log('ℹ️  Expiration : N\'importe quelle date future');
  console.log('ℹ️  CVC : N\'importe quel code à 3 chiffres');
  console.log('ℹ️  Code postal : N\'importe quel code');
}

// Exécution des tests
testStripeConnection()
  .then(() => {
    showTestCards();
  })
  .catch(error => {
    console.error('Erreur fatale:', error);
  });
