/**
 * 🔍 MIDDLEWARE DE VALIDATION
 * Validation des données entrantes pour les APIs
 */

/**
 * Valider les données d'un troc bidirectionnel
 */
const validateBidirectionalTrade = (req, res, next) => {
  const { tradeId } = req.params;
  
  if (!tradeId) {
    return res.status(400).json({
      success: false,
      message: 'ID du troc requis'
    });
  }
  
  // Validation basique de l'ID (MongoDB ObjectId ou format personnalisé)
  if (tradeId.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Format d\'ID de troc invalide'
    });
  }
  
  next();
};

/**
 * Valider les données d'expédition
 */
const validateShipmentData = (req, res, next) => {
  const { trackingNumber, shippingDate } = req.body;
  
  if (!trackingNumber) {
    return res.status(400).json({
      success: false,
      message: 'Numéro de suivi requis'
    });
  }
  
  if (trackingNumber.length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Numéro de suivi invalide'
    });
  }
  
  // Valider la date si fournie
  if (shippingDate && isNaN(Date.parse(shippingDate))) {
    return res.status(400).json({
      success: false,
      message: 'Date d\'expédition invalide'
    });
  }
  
  next();
};

/**
 * Valider le rôle utilisateur pour les routes bidirectionnelles
 */
const validateUserRole = (req, res, next) => {
  const { userRole } = req.params;
  
  if (!['fromUser', 'toUser'].includes(userRole)) {
    return res.status(400).json({
      success: false,
      message: 'Role utilisateur invalide. Doit être "fromUser" ou "toUser"'
    });
  }
  
  next();
};

/**
 * Valider les données de récupération
 */
const validatePickupData = (req, res, next) => {
  const { withdrawalCodeUsed } = req.body;
  
  if (!withdrawalCodeUsed) {
    return res.status(400).json({
      success: false,
      message: 'Code de retrait requis'
    });
  }
  
  // Valider le format du code CADOK
  if (!withdrawalCodeUsed.startsWith('CADOK-')) {
    return res.status(400).json({
      success: false,
      message: 'Format de code de retrait invalide'
    });
  }
  
  next();
};

/**
 * Middleware général pour logger les requêtes
 */
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userInfo = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Anonyme';
  
  console.log(`📝 ${timestamp} - ${method} ${url} - User: ${userInfo}`);
  
  // Logger le body pour les POST/PUT (sans données sensibles)
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const sanitizedBody = { ...req.body };
    // Masquer les données sensibles
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.token) sanitizedBody.token = '***';
    
    console.log(`📋 Body:`, sanitizedBody);
  }
  
  next();
};

/**
 * Middleware pour gérer les erreurs de validation
 */
const handleValidationError = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Format de données invalide'
    });
  }
  
  next(error);
};

module.exports = {
  validateBidirectionalTrade,
  validateShipmentData,
  validateUserRole,
  validatePickupData,
  logRequest,
  handleValidationError
};
