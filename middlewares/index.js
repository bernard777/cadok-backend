/**
 * 📦 INDEX DES MIDDLEWARES
 * Point d'entrée centralisé pour tous les middlewares
 */

// Middlewares d'authentification
const {
  auth,
  optionalAuth,
  requireAdmin,
  canAccessTrade,
  generateTestToken
} = require('./authMiddleware');

// Middlewares de validation
const {
  validateBidirectionalTrade,
  validateShipmentData,
  validateUserRole,
  validatePickupData,
  logRequest,
  handleValidationError
} = require('./validation');

// Middleware de gestion d'erreurs global
const errorHandler = (error, req, res, next) => {
  console.error('❌ Erreur globale:', error);
  
  // Erreur de validation déjà gérée
  if (res.headersSent) {
    return next(error);
  }
  
  // Erreur MongoDB
  if (error.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      message: 'Erreur de base de données'
    });
  }
  
  // Erreur par défaut
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur serveur interne' 
      : error.message
  });
};

// Middleware pour les routes non trouvées
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`
  });
};

// Middleware CORS pour le développement
const cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

module.exports = {
  // Auth
  auth,
  optionalAuth,
  requireAdmin,
  canAccessTrade,
  generateTestToken,
  
  // Validation
  validateBidirectionalTrade,
  validateShipmentData,
  validateUserRole,
  validatePickupData,
  logRequest,
  handleValidationError,
  
  // Global
  errorHandler,
  notFound,
  cors
};
