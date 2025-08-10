
const mongoose = require('mongoose');

let isConnected = false;
let currentUri = null;

const connectToDatabase = async (uri = null) => {
  const targetUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
  
  // Extraire le nom de la base de l'URI pour affichage
  const dbNameFromUri = targetUri.split('/').pop() || 'inconnue';
  
  console.log(`🔗 [DB] Connexion demandée à: ${targetUri}`);
  
  // Si déjà connecté à la bonne URI, on garde
  if (isConnected && currentUri === targetUri && mongoose.connection.readyState === 1) {
    console.log(`📌 [DB] Réutilisation connexion existante vers: ${dbNameFromUri}`);
    return;
  }
  
  // Sinon, déconnecter proprement
  if (mongoose.connection.readyState !== 0) {
    console.log(`🔌 [DB] Déconnexion...`);
    await mongoose.disconnect();
  }
  
  // Connexion propre
  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    isConnected = true;
    currentUri = targetUri;
    
    // Attendre que la connexion soit complètement prête et obtenir le nom réel
    await new Promise(resolve => setTimeout(resolve, 100));
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : dbNameFromUri;
    
    // Affichage avec style selon l'environnement
    const envIndicator = process.env.NODE_ENV === 'test' ? '🧪' : 
                        process.env.NODE_ENV === 'production' ? '🚀' : '🛠️';
    
    console.log(`${envIndicator} [DB] ✅ CONNECTÉ À LA BASE: "${dbName}"`);
    
    // Afficher des infos supplémentaires en mode dev
    if (process.env.NODE_ENV !== 'test') {
      console.log(`📊 [DB] URI complète: ${targetUri}`);
      console.log(`🌐 [DB] Statut connexion: ${mongoose.connection.readyState === 1 ? 'ACTIVE' : 'INACTIVE'}`);
    }
    
  } catch (error) {
    isConnected = false;
    currentUri = null;
    console.error(`❌ [DB] ERREUR CONNEXION vers "${dbNameFromUri}":`, error.message);
    throw error;
  }
};

module.exports = { connectToDatabase };
