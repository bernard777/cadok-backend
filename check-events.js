/**
 * Script de vérification des événements en base de données
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');

async function checkEvents() {
  try {
    // Connexion à MongoDB (base de production)
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connexion MongoDB établie à: cadok');

    // Récupération des événements
    const events = await Event.find({}).sort({ createdAt: -1 });
    console.log(`📊 Total événements trouvés: ${events.length}`);

    if (events.length > 0) {
      console.log('\n📋 Liste des événements:');
      events.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.name}`);
        console.log(`   ID: ${event._id}`);
        console.log(`   Thème: ${event.theme}`);
        console.log(`   Actif: ${event.isActive}`);
        console.log(`   Créé le: ${event.createdAt}`);
        console.log(`   Début: ${event.startDate}`);
        console.log(`   Fin: ${event.endDate}`);
      });
    } else {
      console.log('❌ Aucun événement trouvé en base de données');
    }

    await mongoose.disconnect();
    console.log('\n✅ Déconnexion MongoDB');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkEvents();
