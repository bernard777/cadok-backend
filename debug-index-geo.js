const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/cadok')
  .then(async () => {
    console.log('🔍 Vérification des index de la collection objects:');
    
    const db = mongoose.connection.db;
    const indexes = await db.collection('objects').indexes();
    
    console.log('📋 Index existants:');
    indexes.forEach((index, i) => {
      console.log(`  ${i+1}. ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.key['location.coordinates']) {
        console.log(`     ✅ Index géospatial trouvé: ${index['2dsphereIndexVersion'] ? '2dsphere' : 'autre'}`);
      }
    });
    
    // Vérifier si l'index 2dsphere existe
    const hasGeoIndex = indexes.some(index => 
      index.key['location.coordinates'] && index['2dsphereIndexVersion']
    );
    
    if (!hasGeoIndex) {
      console.log('\n❌ Aucun index 2dsphere trouvé sur location.coordinates');
      console.log('🔧 Création de l\'index géospatial...');
      
      try {
        await db.collection('objects').createIndex(
          { 'location.coordinates': '2dsphere' },
          { name: 'location_2dsphere' }
        );
        console.log('✅ Index géospatial créé avec succès !');
      } catch (error) {
        console.error('❌ Erreur création index:', error.message);
      }
    } else {
      console.log('\n✅ Index géospatial 2dsphere existe déjà');
    }
    
    // Test de la requête $near maintenant
    console.log('\n🧪 Test requête $near (Nantes → Paris/Lyon):');
    try {
      const ObjectModel = require('./models/Object');
      
      const nearbyObjects = await ObjectModel.find({
        status: 'available',
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [-1.5164359, 47.2861415] // Nantes [lng, lat]
            },
            $maxDistance: 500000 // 500km pour tester
          }
        }
      }).limit(5);
      
      console.log(`📍 Objets trouvés dans 500km: ${nearbyObjects.length}`);
      nearbyObjects.forEach(obj => {
        const coords = obj.location?.coordinates || [];
        console.log(`  - ${obj.title}: [${coords[0]}, ${coords[1]}]`);
      });
      
    } catch (error) {
      console.error('❌ Test $near échoué:', error.message);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
