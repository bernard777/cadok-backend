/**
 * 🔄 MIGRATION GÉOLOCALISATION
 * Script pour migrer les objets existants vers le nouveau système de géolocalisation
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ObjectModel = require('./models/Object');
const User = require('./models/User');
const { GeolocationService } = require('./services/geolocationService');

class GeolocationMigration {
  constructor() {
    this.geoService = new GeolocationService();
    this.stats = {
      processed: 0,
      updated: 0,
      errors: 0,
      skipped: 0
    };
  }

  /**
   * 🔧 Mapper les précisions vers les valeurs d'enum correctes
   */
  mapPrecisionToEnum(precision) {
    const precisionMap = {
      'city_center': 'approximate',
      'city_only': 'city_only',
      'approximate': 'approximate',
      'exact': 'exact'
    };
    return precisionMap[precision] || 'city_only';
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connexion MongoDB établie');
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }

  /**
   * 🏠 Migrer les objets existants vers le nouveau système de géolocalisation
   */
  async migrateObjects(options = {}) {
    const { limit = 100, dryRun = false, geocodeAddresses = false } = options;

    console.log(`\n🚀 MIGRATION GÉOLOCALISATION DES OBJETS`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN (pas de modifications)' : 'PRODUCTION'}`);
    console.log(`   Limite: ${limit} objets`);
    console.log(`   Géocodage: ${geocodeAddresses ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    console.log('');

    try {
      // Récupérer les objets sans système de géolocalisation
      const objects = await ObjectModel.find({
        $or: [
          { 'location': { $exists: false } },
          { 'location.address': { $exists: false } }
        ]
      })
      .populate('owner', 'city address')
      .limit(limit);

      console.log(`📋 ${objects.length} objets à migrer trouvés`);

      for (const object of objects) {
        this.stats.processed++;
        
        try {
          console.log(`\n🔄 [${this.stats.processed}/${objects.length}] Objet: ${object.title}`);

          // Initialiser la structure location
          const locationData = {
            coordinates: null,
            address: {
              city: null,
              zipCode: null,
              street: null,
              country: 'France'
            },
            precision: 'city_only',
            isPublic: true,
            searchRadius: 10
          };

          // Utiliser les informations du propriétaire
          if (object.owner) {
            locationData.address.city = object.owner.city || object.owner.address?.city;
            locationData.address.zipCode = object.owner.address?.zipCode;
            locationData.address.street = object.owner.address?.street;

            // Si le propriétaire a des coordonnées, les utiliser
            if (object.owner.address && object.owner.address.coordinates) {
              locationData.coordinates = object.owner.address.coordinates;
              locationData.precision = object.owner.address.precision || 'approximate';
              console.log(`  📍 Coordonnées utilisateur utilisées: ${locationData.coordinates}`);
            }
          }

            // Géocodage optionnel
            if (geocodeAddresses && locationData.address.city && !locationData.coordinates) {
              console.log(`  🌐 Géocodage de: ${locationData.address.city}`);
              
              try {
                const geocoded = await this.geoService.geocodeAddress(locationData.address.city);
                if (geocoded && geocoded.coordinates) {
                  locationData.coordinates = geocoded.coordinates;
                  // Forcer la précision correcte selon les valeurs d'enum
                  locationData.precision = this.mapPrecisionToEnum(geocoded.precision);
                  console.log(`  ✅ Géocodé: ${geocoded.coordinates} (${locationData.precision})`);
                  
                  // Délai pour respecter les limites d'API
                  await new Promise(resolve => setTimeout(resolve, 1100));
                }
              } catch (geoError) {
                console.warn(`  ⚠️ Erreur géocodage: ${geoError.message}`);
              }
            }          // Appliquer les modifications
          if (!dryRun) {
            object.location = locationData;
            await object.save();
            this.stats.updated++;
            console.log(`  ✅ Objet mis à jour`);
          } else {
            console.log(`  🔍 DRY RUN - Modifications simulées`);
            console.log(`     Ville: ${locationData.address.city}`);
            console.log(`     Coordonnées: ${locationData.coordinates ? 'OUI' : 'NON'}`);
            this.stats.updated++;
          }

        } catch (error) {
          this.stats.errors++;
          console.error(`  ❌ Erreur objet ${object._id}:`, error.message);
        }
      }

      console.log(`\n📊 RÉSULTATS DE LA MIGRATION:`);
      console.log(`   Objets traités: ${this.stats.processed}`);
      console.log(`   Objets mis à jour: ${this.stats.updated}`);
      console.log(`   Erreurs: ${this.stats.errors}`);
      console.log(`   Ignorés: ${this.stats.skipped}`);

    } catch (error) {
      console.error('❌ Erreur migration:', error);
    }
  }

  /**
   * 👥 Migrer les utilisateurs vers le nouveau système
   */
  async migrateUsers(options = {}) {
    const { limit = 100, dryRun = false, geocodeAddresses = false } = options;

    console.log(`\n🚀 MIGRATION GÉOLOCALISATION DES UTILISATEURS`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
    console.log(`   Limite: ${limit} utilisateurs`);
    console.log('');

    try {
      const users = await User.find({
        'address.coordinates': { $exists: false }
      }).limit(limit);

      console.log(`👥 ${users.length} utilisateurs à migrer`);

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        try {
          console.log(`\n🔄 [${i + 1}/${users.length}] Utilisateur: ${user.pseudo}`);

          if (geocodeAddresses && user.address && user.address.city) {
            const fullAddress = `${user.address.street || ''} ${user.address.city} ${user.address.zipCode || ''}`.trim();
            console.log(`  🌐 Géocodage: ${fullAddress}`);

            const geocoded = await this.geoService.geocodeAddress(fullAddress);
            if (geocoded && geocoded.coordinates) {
              if (!dryRun) {
                user.address.coordinates = geocoded.coordinates;
                user.address.precision = geocoded.precision;
                await user.save();
                console.log(`  ✅ Coordonnées ajoutées: ${geocoded.coordinates}`);
              } else {
                console.log(`  🔍 DRY RUN - Coordonnées: ${geocoded.coordinates}`);
              }

              await new Promise(resolve => setTimeout(resolve, 1100));
            }
          }

        } catch (error) {
          console.error(`  ❌ Erreur utilisateur ${user._id}:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ Erreur migration utilisateurs:', error);
    }
  }

  /**
   * 🔧 Créer les index géospatiales nécessaires
   */
  async createIndexes() {
    console.log('\n🔧 CRÉATION DES INDEX GÉOSPATIALES...');

    try {
      // Index pour les objets
      await ObjectModel.collection.createIndex({ "location.coordinates": "2dsphere" });
      console.log('✅ Index géospatial créé pour Object.location.coordinates');

      await ObjectModel.collection.createIndex({ 
        "location.address.city": 1, 
        "status": 1, 
        "createdAt": -1 
      });
      console.log('✅ Index composé créé pour Object (city + status + date)');

      // Index pour les utilisateurs
      await User.collection.createIndex({ "address.coordinates": "2dsphere" });
      console.log('✅ Index géospatial créé pour User.address.coordinates');

      console.log('🎉 Tous les index ont été créés avec succès');

    } catch (error) {
      console.error('❌ Erreur création index:', error);
    }
  }

  /**
   * 📊 Analyser l'état actuel de la géolocalisation
   */
  async analyzeCurrentState() {
    console.log('\n📊 ANALYSE DE LA GÉOLOCALISATION ACTUELLE...\n');

    try {
      // Objets
      const totalObjects = await ObjectModel.countDocuments();
      const objectsWithLocation = await ObjectModel.countDocuments({
        'location.address.city': { $exists: true }
      });
      const objectsWithCoords = await ObjectModel.countDocuments({
        'location.coordinates': { $exists: true, $ne: null }
      });

      console.log('📦 OBJETS:');
      console.log(`   Total: ${totalObjects}`);
      console.log(`   Avec localisation: ${objectsWithLocation} (${Math.round(objectsWithLocation/totalObjects*100)}%)`);
      console.log(`   Avec coordonnées GPS: ${objectsWithCoords} (${Math.round(objectsWithCoords/totalObjects*100)}%)`);

      // Utilisateurs
      const totalUsers = await User.countDocuments();
      const usersWithCoords = await User.countDocuments({
        'address.coordinates': { $exists: true, $ne: null }
      });

      console.log('\n👥 UTILISATEURS:');
      console.log(`   Total: ${totalUsers}`);
      console.log(`   Avec coordonnées GPS: ${usersWithCoords} (${Math.round(usersWithCoords/totalUsers*100)}%)`);

      // Répartition par ville (top 10)
      const cityDistribution = await ObjectModel.aggregate([
        { $match: { 'location.address.city': { $exists: true } } },
        { $group: { _id: '$location.address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      console.log('\n🏙️ RÉPARTITION PAR VILLE (TOP 10):');
      cityDistribution.forEach((city, i) => {
        console.log(`   ${i + 1}. ${city._id}: ${city.count} objets`);
      });

    } catch (error) {
      console.error('❌ Erreur analyse:', error);
    }
  }
}

// 🚀 EXÉCUTION DU SCRIPT
async function main() {
  const migration = new GeolocationMigration();

  try {
    await migration.connect();

    const args = process.argv.slice(2);
    const command = args[0] || 'analyze';

    switch (command) {
      case 'analyze':
        await migration.analyzeCurrentState();
        break;

      case 'migrate-objects':
        const dryRun = args.includes('--dry-run');
        const withGeocoding = args.includes('--geocode');
        const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 100;
        
        await migration.migrateObjects({ 
          dryRun, 
          geocodeAddresses: withGeocoding,
          limit 
        });
        break;

      case 'migrate-users':
        const userDryRun = args.includes('--dry-run');
        const userGeocoding = args.includes('--geocode');
        const userLimit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 50;
        
        await migration.migrateUsers({ 
          dryRun: userDryRun, 
          geocodeAddresses: userGeocoding,
          limit: userLimit 
        });
        break;

      case 'create-indexes':
        await migration.createIndexes();
        break;

      case 'full-migration':
        console.log('🚀 MIGRATION COMPLÈTE...\n');
        await migration.createIndexes();
        await migration.migrateObjects({ dryRun: false, geocodeAddresses: false, limit: 1000 });
        await migration.analyzeCurrentState();
        break;

      default:
        console.log(`
🌍 SCRIPT DE MIGRATION GÉOLOCALISATION CADOK

COMMANDES DISPONIBLES:
  
  analyze                    - Analyser l'état actuel
  migrate-objects            - Migrer les objets
  migrate-users              - Migrer les utilisateurs  
  create-indexes            - Créer les index géospatiales
  full-migration            - Migration complète

OPTIONS:
  --dry-run                 - Mode simulation
  --geocode                 - Activer le géocodage automatique
  --limit=N                 - Limiter le nombre d'éléments

EXEMPLES:
  node geolocation-migration.js analyze
  node geolocation-migration.js migrate-objects --dry-run --limit=50
  node geolocation-migration.js migrate-objects --geocode --limit=100
  node geolocation-migration.js full-migration
        `);
        break;
    }

  } catch (error) {
    console.error('❌ Erreur script:', error);
  } finally {
    await migration.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { GeolocationMigration };
