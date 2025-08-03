require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('📦 LISTE DES PRODUITS ET PRIX STRIPE');
console.log('====================================\n');

async function listStripeProducts() {
  try {
    // Récupérer tous les produits
    const products = await stripe.products.list({ limit: 20 });
    
    if (products.data.length === 0) {
      console.log('ℹ️  Aucun produit trouvé dans votre compte Stripe');
      console.log('💡 Exécutez "node create-stripe-products.js" pour créer les plans Cadok');
      return;
    }

    console.log(`📊 ${products.data.length} produit(s) trouvé(s) :\n`);

    for (const product of products.data) {
      console.log(`🏷️  ${product.name}`);
      console.log(`   ID Produit: ${product.id}`);
      console.log(`   Description: ${product.description || 'Aucune'}`);
      console.log(`   Actif: ${product.active ? '✅ Oui' : '❌ Non'}`);
      
      // Récupérer les prix associés à ce produit
      const prices = await stripe.prices.list({ 
        product: product.id,
        limit: 10
      });

      if (prices.data.length > 0) {
        console.log('   💰 Prix associés :');
        prices.data.forEach(price => {
          const amount = price.unit_amount / 100;
          const currency = price.currency.toUpperCase();
          const interval = price.recurring ? `/${price.recurring.interval}` : ' (unique)';
          
          console.log(`      - ${amount}${currency}${interval} (${price.id})`);
          console.log(`        Actif: ${price.active ? '✅' : '❌'}`);
        });
      } else {
        console.log('   ⚠️  Aucun prix associé');
      }
      
      console.log('');
    }

    // Chercher spécifiquement les plans Cadok
    const cadokProducts = products.data.filter(p => 
      p.metadata?.app === 'cadok' || 
      p.name.toLowerCase().includes('cadok') ||
      p.name.toLowerCase().includes('basic') ||
      p.name.toLowerCase().includes('premium')
    );

    if (cadokProducts.length > 0) {
      console.log('🎯 PRODUITS CADOK DÉTECTÉS :');
      console.log('============================\n');
      
      for (const product of cadokProducts) {
        const prices = await stripe.prices.list({ product: product.id });
        
        if (prices.data.length > 0) {
          const price = prices.data[0]; // Prendre le premier prix
          const planType = product.metadata?.plan_id || 
                          (product.name.toLowerCase().includes('basic') ? 'basic' : 'premium');
          
          console.log(`${planType.toUpperCase()}_PRICE_ID=${price.id}`);
        }
      }
      
      console.log('\n💡 Copiez ces IDs dans votre fichier .env si nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits :', error.message);
  }
}

// Fonction pour nettoyer les anciens produits (optionnel)
async function cleanupProducts() {
  try {
    console.log('🧹 NETTOYAGE DES PRODUITS DE TEST');
    console.log('==================================\n');
    
    const products = await stripe.products.list({ limit: 20 });
    const testProducts = products.data.filter(p => 
      p.name.includes('Test') || 
      p.name.includes('test') ||
      p.metadata?.test === 'true'
    );

    if (testProducts.length === 0) {
      console.log('✅ Aucun produit de test à nettoyer');
      return;
    }

    console.log(`🗑️  ${testProducts.length} produit(s) de test trouvé(s) :`);
    for (const product of testProducts) {
      console.log(`   - ${product.name} (${product.id})`);
    }

    console.log('\n⚠️  Pour supprimer, utilisez le Dashboard Stripe ou modifiez ce script');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error.message);
  }
}

// Menu principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    await cleanupProducts();
  } else {
    await listStripeProducts();
  }
}

main().catch(console.error);
