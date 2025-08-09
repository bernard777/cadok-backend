
const mongoose = require('mongoose');

let isConnected = false;
let currentUri = null;

const connectToDatabase = async (uri = null) => {
  const targetUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
  
  console.log(`[DB] Connexion demandée à: ${targetUri}`);
  
  // Si déjà connecté à la bonne URI, on garde
  if (isConnected && currentUri === targetUri && mongoose.connection.readyState === 1) {
    console.log(`[DB] Réutilisation connexion existante`);
    return;
  }
  
  // Sinon, déconnecter proprement
  if (mongoose.connection.readyState !== 0) {
    console.log(`[DB] Déconnexion...`);
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
    await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai pour la stabilisation
    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'inconnue';
    // Log seulement si on n'est pas en mode test ou si les tests ne sont pas terminés
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[DB] ✅ Connecté à: ${dbName}`);
    }
    
  } catch (error) {
    isConnected = false;
    currentUri = null;
    console.error('[DB] ❌ Erreur:', error.message);
    throw error;
  }
};

module.exports = { connectToDatabase };
