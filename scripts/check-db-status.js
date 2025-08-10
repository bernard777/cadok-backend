const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Configuration des couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function checkDatabaseStatus() {
  console.log(`${colors.cyan}${colors.bright}🔍 Vérification du statut des bases de données CADOK${colors.reset}\n`);

  const databases = [
    {
      name: 'PRODUCTION (cadok)',
      uri: 'mongodb://localhost:27017/cadok',
      icon: '🚀',
      env: 'production'
    },
    {
      name: 'TEST (cadok_test)',
      uri: 'mongodb://localhost:27017/cadok_test',
      icon: '🧪',
      env: 'test'
    },
    {
      name: 'DÉVELOPPEMENT (cadok_dev)',
      uri: 'mongodb://localhost:27017/cadok_dev',
      icon: '🛠️',
      env: 'development'
    }
  ];

  for (const db of databases) {
    console.log(`${colors.yellow}📋 Vérification de ${db.icon} ${db.name}${colors.reset}`);
    
    try {
      const connection = await mongoose.createConnection(db.uri);
      await connection.asPromise(); // Attendre que la connexion soit établie
      
      // Vérifier les collections importantes
      const collections = await connection.db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      // Vérifier la collection users pour les admins
      let adminCount = 0;
      let userCount = 0;
      
      if (collectionNames.includes('users')) {
        const Users = connection.model('User', new mongoose.Schema({}, { strict: false }));
        userCount = await Users.countDocuments();
        adminCount = await Users.countDocuments({ role: 'super_admin' });
      }
      
      console.log(`  ${colors.green}✅ Connexion: Réussie${colors.reset}`);
      console.log(`  📊 Collections trouvées: ${collectionNames.length}`);
      console.log(`  👥 Utilisateurs: ${userCount}`);
      console.log(`  👑 Admins: ${adminCount}`);
      console.log(`  🔗 URI: ${db.uri}`);
      
      if (collectionNames.length > 0) {
        console.log(`  📁 Collections principales: ${collectionNames.filter(name => 
          ['users', 'events', 'trades', 'payments'].includes(name)
        ).join(', ') || 'Aucune collection principale trouvée'}`);
      }
      
      await connection.close();
      
    } catch (error) {
      console.log(`  ${colors.red}❌ Connexion: Échec${colors.reset}`);
      console.log(`  🚨 Erreur: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  }
  
  console.log(`${colors.magenta}${colors.bright}💡 Pour démarrer le serveur sur une base spécifique:${colors.reset}`);
  console.log(`${colors.cyan}   npm run server:prod${colors.reset} - Pour la base de production`);
  console.log(`${colors.cyan}   npm run server:test${colors.reset} - Pour la base de test`);
  console.log(`${colors.cyan}   npm run server:dev${colors.reset} - Pour la base de développement`);
  console.log(`${colors.cyan}   npm run dev:prod${colors.reset} - Mode dev avec base de production`);
  console.log(`${colors.cyan}   npm run dev:test${colors.reset} - Mode dev avec base de test`);
  console.log(`${colors.cyan}   npm run dev:dev${colors.reset} - Mode dev avec base de développement\n`);
}

checkDatabaseStatus().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(`${colors.red}Erreur lors de la vérification:${colors.reset}`, error);
  process.exit(1);
});
