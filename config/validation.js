/**
 * 🔧 VALIDATION DES VARIABLES D'ENVIRONNEMENT - CADOK
 * Valide et affiche la configuration de l'environnement
 */

// Fonction simple pour coloriser les messages (remplace colors)
const colorize = {
  cyan: (text) => text,
  green: (text) => text,
  red: (text) => text,
  yellow: (text) => text,
  blue: (text) => text,
  bold: (text) => text
};

/**
 * Variables d'environnement requises
 */
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET'
];

/**
 * Variables d'environnement optionnelles avec valeurs par défaut
 */
const OPTIONAL_ENV_VARS = {
  'CORS_ORIGIN': 'http://localhost:3000',
  'CLOUDINARY_CLOUD_NAME': 'not-configured',
  'CLOUDINARY_API_KEY': 'not-configured',
  'CLOUDINARY_API_SECRET': 'not-configured',
  'STRIPE_SECRET_KEY': 'not-configured',
  'STRIPE_WEBHOOK_SECRET': 'not-configured',
  'ADMIN_EMAIL': 'admin@cadok.com',
  'ADMIN_PASSWORD': 'defaultpassword'
};

/**
 * Valide la présence des variables d'environnement requises
 */
function validateEnvironment() {
  console.log('\n🔧 VALIDATION DE L\'ENVIRONNEMENT CADOK');
  console.log('='.repeat(50));

  const validationResults = {
    success: true,
    missing: [],
    warnings: [],
    configured: []
  };

  // Vérifier les variables requises
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      validationResults.missing.push(varName);
      validationResults.success = false;
      console.log(`❌ ${varName}: MANQUANT (REQUIS)`);
    } else {
      validationResults.configured.push(varName);
      // Masquer les valeurs sensibles
      const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') 
        ? '***CONFIGURÉ***' 
        : process.env[varName];
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });

  // Vérifier les variables optionnelles
  Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      validationResults.warnings.push(varName);
      console.log(`⚠️  ${varName}: DÉFAUT (${defaultValue})`);
    } else {
      validationResults.configured.push(varName);
      const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
        ? '***CONFIGURÉ***' 
        : process.env[varName];
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });

  return validationResults;
}

/**
 * Affiche un résumé de la configuration de l'environnement
 */
function displayEnvironmentSummary() {
  console.log('\n📊 RÉSUMÉ DE CONFIGURATION');
  console.log('='.repeat(50));
  
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🚀 Port: ${process.env.PORT}`);
  console.log(`📁 Base de données: ${process.env.MONGODB_URI ? 'Configurée' : 'Non configurée'}`);
  console.log(`🔐 JWT: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME !== 'not-configured' ? 'Configuré' : 'Non configuré'}`);
  console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY !== 'not-configured' ? 'Configuré' : 'Non configuré'}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Configuration validée - Démarrage en cours...\n');
}

/**
 * Valide une configuration spécifique
 */
function validateDatabaseConnection() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI est requis pour la connexion à la base de données');
  }
  
  // Validation basique de l'URI MongoDB
  if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI doit commencer par mongodb:// ou mongodb+srv://');
  }
  
  return true;
}

/**
 * Valide la configuration JWT
 */
function validateJWTConfiguration() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET est requis pour l\'authentification');
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET devrait faire au moins 32 caractères pour une sécurité optimale');
  }
  
  return true;
}

/**
 * Configuration par défaut pour le développement
 */
function setDevelopmentDefaults() {
  if (process.env.NODE_ENV === 'development') {
    // Valeurs par défaut pour le développement
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
    process.env.PORT = process.env.PORT || '5000';
    
    console.log('🔧 Configuration de développement appliquée');
  }
}

module.exports = {
  validateEnvironment,
  displayEnvironmentSummary,
  validateDatabaseConnection,
  validateJWTConfiguration,
  setDevelopmentDefaults
};
