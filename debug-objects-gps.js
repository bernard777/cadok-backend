const mongoose = require('mongoose');
const ObjectModel = require('./models/Object');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/cadok', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('📊 Analyse des objets en base:');
    
    const totalObjects = await ObjectModel.countDocuments();
    console.log(`📦 Total objets: ${totalObjects}`);
    
    const availableObjects = await ObjectModel.countDocuments({ status: 'available' });
    console.log(`✅ Objets disponibles: ${availableObjects}`);
    
    const objectsWithGPS = await ObjectModel.countDocuments({ 
      'location.coordinates': { $exists: true, $ne: null } 
    });
    console.log(`📍 Objets avec GPS: ${objectsWithGPS}`);
    
    const sampleObjects = await ObjectModel.find({ status: 'available' })
      .select('title location owner')
      .populate('owner', 'city')
      .limit(5)
      .lean();
    
    console.log('\n📋 Échantillon objets disponibles:');
    sampleObjects.forEach((obj, i) => {
      console.log(`  ${i+1}. ${obj.title}`);
      console.log(`     GPS: ${obj.location?.coordinates ? obj.location.coordinates : 'Non défini'}`);
      console.log(`     Ville: ${obj.owner?.city || 'Non définie'}`);
      console.log('');
    });
    
    // Test de recherche géolocalisée
    console.log('🔍 Test recherche géolocalisée (Nantes, 100km):');
    const nearbyObjects = await ObjectModel.find({
      status: 'available',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [-1.5164359, 47.2861415] // Nantes
          },
          $maxDistance: 100000 // 100km en mètres
        }
      }
    }).limit(5);
    
    console.log(`📍 Objets trouvés dans un rayon de 100km: ${nearbyObjects.length}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
