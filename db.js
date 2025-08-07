
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
    console.log(`[DB] ✅ Connecté à: ${mongoose.connection.name}`);
    
  } catch (error) {
    isConnected = false;
    currentUri = null;
    console.error('[DB] ❌ Erreur:', error.message);
    throw error;
  }
};

module.exports = { connectToDatabase };
