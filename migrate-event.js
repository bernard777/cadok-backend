/**
 * Script pour migrer un événement de cadok_test vers cadok
 */

const mongoose = require('mongoose');

async function migrateEvent() {
  try {
    // Connexion à cadok_test
    await mongoose.connect('mongodb://localhost:27017/cadok_test');
    console.log('✅ Connecté à cadok_test');

    // Schéma simple pour récupérer l'événement
    const EventSchema = new mongoose.Schema({}, { strict: false });
    const EventTest = mongoose.model('Event', EventSchema);

    // Récupérer l'événement spécifique
    const eventFromTest = await EventTest.findById('68984b8458eb74e10182704b');
    
    if (!eventFromTest) {
      console.log('❌ Événement non trouvé dans cadok_test');
      return;
    }

    console.log('📦 Événement trouvé:', eventFromTest.name);
    const eventData = eventFromTest.toObject();
    delete eventData._id; // Laisser MongoDB générer un nouvel ID
    delete eventData.__v;

    // Déconnexion de cadok_test
    await mongoose.disconnect();

    // Connexion à cadok
    await mongoose.connect('mongodb://localhost:27017/cadok');
    console.log('✅ Connecté à cadok');

    const EventProd = mongoose.model('Event', EventSchema);
    
    // Créer l'événement dans cadok
    const newEvent = new EventProd(eventData);
    await newEvent.save();
    
    console.log('✅ Événement copié vers cadok avec ID:', newEvent._id);

    await mongoose.disconnect();
    console.log('✅ Migration terminée');
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

migrateEvent();
