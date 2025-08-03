require('dotenv').config();

console.log('🔍 DIAGNOSTIC MONGODB');
console.log('===================\n');

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement :');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI || '❌ Non définie'}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI || '❌ Non définie'}`);
console.log(`PORT: ${process.env.PORT || 'Par défaut (5000)'}`);

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/cadok';
console.log(`\n🔗 URI de connexion utilisée: ${mongoUri}`);

// 2. Test de connexion MongoDB
async function testMongoConnection() {
  try {
    console.log('\n🔌 Test de connexion MongoDB...');
    
    const mongoose = require('mongoose');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout de 5 secondes
    });
    
    console.log('✅ Connexion MongoDB réussie !');
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    // Test d'écriture simple
    console.log('\n📝 Test d\'écriture...');
    const testSchema = new mongoose.Schema({ test: String, date: Date });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ 
      test: 'Connexion test réussie', 
      date: new Date() 
    });
    
    await testDoc.save();
    console.log('✅ Écriture test réussie !');
    
    // Nettoyage
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Nettoyage terminé');
    
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée proprement');
    
  } catch (error) {
    console.error('\n❌ ERREUR MongoDB:', error.message);
    
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 Solutions possibles :');
      console.log('1. 🟢 Installer MongoDB localement :');
      console.log('   - Windows: https://www.mongodb.com/try/download/community');
      console.log('   - Ou utiliser MongoDB Atlas (cloud gratuit)');
      console.log('');
      console.log('2. 🔧 Vérifier que MongoDB fonctionne :');
      console.log('   - Service MongoDB démarré');
      console.log('   - Port 27017 accessible');
      console.log('');
      console.log('3. 🌐 Alternative cloud MongoDB Atlas :');
      console.log('   - Créer un cluster gratuit sur mongodb.com/atlas');
      console.log('   - Récupérer l\'URI de connexion');
      console.log('   - Mettre à jour MONGODB_URI dans .env');
    }
  }
}

// 3. Vérifier si MongoDB est installé localement
function checkLocalMongoDB() {
  console.log('\n🔍 Vérification MongoDB local...');
  
  const { exec } = require('child_process');
  
  exec('mongod --version', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ MongoDB n\'est pas installé localement');
      console.log('💡 Recommandation: Utiliser MongoDB Atlas (cloud gratuit)');
      return;
    }
    
    console.log('✅ MongoDB installé localement');
    console.log(`Version: ${stdout.split('\n')[0]}`);
    
    // Vérifier si le service fonctionne
    exec('tasklist | findstr mongod', (error, stdout, stderr) => {
      if (stdout.includes('mongod')) {
        console.log('✅ Service MongoDB en cours d\'exécution');
      } else {
        console.log('⚠️  Service MongoDB non démarré');
        console.log('💡 Démarrez le service: net start MongoDB');
      }
    });
  });
}

// 4. Proposer une configuration MongoDB Atlas
function showAtlasSetup() {
  console.log('\n🌐 SETUP MONGODB ATLAS (RECOMMANDÉ)');
  console.log('===================================');
  console.log('1. Allez sur https://mongodb.com/atlas');
  console.log('2. Créez un compte gratuit');
  console.log('3. Créez un cluster gratuit (M0)');
  console.log('4. Ajoutez votre IP aux autorisations');
  console.log('5. Créez un utilisateur de base de données');
  console.log('6. Récupérez l\'URI de connexion');
  console.log('7. Remplacez MONGODB_URI dans votre .env');
  console.log('');
  console.log('Exemple d\'URI Atlas :');
  console.log('mongodb+srv://username:password@cluster.mongodb.net/cadok');
}

// Exécution
async function runDiagnostic() {
  checkLocalMongoDB();
  
  setTimeout(async () => {
    await testMongoConnection();
    showAtlasSetup();
  }, 2000);
}

runDiagnostic();
