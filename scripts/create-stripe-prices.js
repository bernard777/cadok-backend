require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPrices() {
  try {
    console.log('🔧 Création des prix Stripe...');

    // Créer le plan Basic (2€/mois)
    const basicPrice = await stripe.prices.create({
      unit_amount: 200, // 2€ en centimes
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'Plan Basic CADOK'
      },
      metadata: {
        plan: 'basic'
      }
    });

    // Créer le plan Premium (5€/mois)
    const premiumPrice = await stripe.prices.create({
      unit_amount: 500, // 5€ en centimes
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'Plan Premium CADOK'
      },
      metadata: {
        plan: 'premium'
      }
    });

    console.log('✅ Prix créés avec succès!');
    console.log('');
    console.log('🔑 Mettez à jour votre fichier .env avec ces valeurs:');
    console.log('');
    console.log(`STRIPE_BASIC_PRICE_ID=${basicPrice.id}`);
    console.log(`STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`);
    console.log('');
    console.log('Prix Basic créé:', basicPrice.id);
    console.log('Prix Premium créé:', premiumPrice.id);

  } catch (error) {
    console.error('❌ Erreur création prix:', error);
  }
}

createPrices();
