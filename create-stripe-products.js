require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('🏗️  CRÉATION DES PRODUITS ET PRIX STRIPE');
console.log('=========================================\n');

async function createStripeProducts() {
  try {
    // Définition des plans Cadok
    const plans = [
      {
        id: 'basic',
        name: 'Plan Basic Cadok',
        description: '10 objets maximum, 5 échanges maximum, Support prioritaire, Recherche avancée',
        price: 2, // 2€
        currency: 'eur',
        interval: 'month'
      },
      {
        id: 'premium',
        name: 'Plan Premium Cadok',
        description: 'Objets illimités, Échanges illimités, Support prioritaire 24/7, Recherche avancée',
        price: 5, // 5€
        currency: 'eur',
        interval: 'month'
      }
    ];

    console.log('📦 Création des produits et prix...\n');

    const createdPlans = {};

    for (const plan of plans) {
      console.log(`🔧 Création du plan ${plan.name}...`);

      // 1. Créer le produit
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          app: 'cadok'
        }
      });

      console.log(`   ✅ Produit créé: ${product.id}`);

      // 2. Créer le prix
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100, // Convertir en centimes
        currency: plan.currency,
        recurring: {
          interval: plan.interval
        },
        metadata: {
          plan_id: plan.id,
          app: 'cadok'
        }
      });

      console.log(`   ✅ Prix créé: ${price.id}`);
      console.log(`   💰 Montant: ${plan.price}€/${plan.interval}`);

      createdPlans[plan.id] = {
        product_id: product.id,
        price_id: price.id,
        amount: plan.price
      };

      console.log('');
    }

    // 3. Afficher le résumé et les IDs à copier
    console.log('🎉 CRÉATION TERMINÉE AVEC SUCCÈS !\n');
    
    console.log('📋 COPIEZ CES IDS DANS VOTRE .ENV :\n');
    console.log('# ID des prix des plans Stripe');
    console.log(`STRIPE_BASIC_PRICE_ID=${createdPlans.basic.price_id}`);
    console.log(`STRIPE_PREMIUM_PRICE_ID=${createdPlans.premium.price_id}`);
    
    console.log('\n📊 RÉSUMÉ DES PLANS CRÉÉS :');
    console.log('============================');
    for (const [planId, data] of Object.entries(createdPlans)) {
      console.log(`\n${planId.toUpperCase()} PLAN:`);
      console.log(`   Produit ID: ${data.product_id}`);
      console.log(`   Prix ID: ${data.price_id}`);
      console.log(`   Montant: ${data.amount}€/mois`);
    }

    console.log('\n🔗 LIENS UTILES :');
    console.log(`Dashboard Stripe: https://dashboard.stripe.com/test/products`);
    console.log(`API Documentation: https://stripe.com/docs/api/products`);

    // 4. Mettre à jour automatiquement le fichier .env
    await updateEnvFile(createdPlans);

  } catch (error) {
    console.error('\n❌ ERREUR lors de la création :', error.message);
    
    if (error.code === 'resource_already_exists') {
      console.log('\n💡 Il semble que des produits existent déjà.');
      console.log('   Voulez-vous lister les produits existants ? Exécutez : node list-stripe-products.js');
    }
  }
}

async function updateEnvFile(plans) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remplacer les lignes des price IDs
    envContent = envContent.replace(
      /STRIPE_BASIC_PRICE_ID=.*/,
      `STRIPE_BASIC_PRICE_ID=${plans.basic.price_id}`
    );
    
    envContent = envContent.replace(
      /STRIPE_PREMIUM_PRICE_ID=.*/,
      `STRIPE_PREMIUM_PRICE_ID=${plans.premium.price_id}`
    );
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n🔄 Fichier .env mis à jour automatiquement !');
    console.log('✅ Les nouveaux Price IDs ont été ajoutés');
    
  } catch (error) {
    console.error('⚠️  Impossible de mettre à jour le .env automatiquement :', error.message);
    console.log('💡 Copiez-collez manuellement les IDs ci-dessus dans votre fichier .env');
  }
}

// Fonction pour vérifier si des produits existent déjà
async function checkExistingProducts() {
  try {
    const products = await stripe.products.list({ limit: 10 });
    
    if (products.data.length > 0) {
      console.log('📦 Produits existants trouvés :');
      products.data.forEach(product => {
        console.log(`   - ${product.name} (${product.id})`);
      });
      console.log('\n❓ Voulez-vous créer de nouveaux produits ou utiliser les existants ?');
      console.log('💡 Pour lister les prix existants : node list-stripe-products.js');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Exécution
console.log('🔍 Vérification des produits existants...\n');
checkExistingProducts()
  .then(hasExisting => {
    if (!hasExisting) {
      console.log('➡️  Aucun produit existant. Création des nouveaux plans...\n');
      return createStripeProducts();
    } else {
      console.log('\n❓ Tapez "y" pour créer de nouveaux produits quand même :');
      // Pour ce script, on continue la création
      return createStripeProducts();
    }
  })
  .catch(console.error);
