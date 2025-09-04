/**
 * 🔗 MIDDLEWARE DE CORRÉLATION DES REQUÊTES - CADOK
 * Ajoute un ID unique à chaque requête pour traçabilité
 */

const { v4: uuidv4 } = require('uuid');
const { ContextualLogger, PerformanceMetrics } = require('../utils/logger');

/**
 * Middleware pour ajouter un ID de corrélation à chaque requête
 */
function requestCorrelation(req, res, next) {
  // Générer un ID unique pour cette requête
  req.requestId = req.headers['x-request-id'] || uuidv4();
  
  // Ajouter l'ID aux headers de réponse
  res.set('X-Request-ID', req.requestId);
  
  // Créer un logger contextuel pour cette requête
  req.logger = new ContextualLogger(
    req.requestId, 
    req.user?.id || null
  );

  // Démarrer le timer de performance
  PerformanceMetrics.startTimer('request_duration', req.requestId);

  // Logger de début de requête
  req.logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: sanitizeRequestBody(req.body)
  });

  // Intercepter la fin de la réponse
  const originalSend = res.send;
  res.send = function(data) {
    const duration = PerformanceMetrics.endTimer('request_duration', req.requestId);
    
    req.logger.http(`Response ${res.statusCode}`, {
      duration: `${duration?.toFixed(2)}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length')
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Sanitiser le body de la requête pour les logs
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'cardNumber', 'cvv'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***MASKED***';
    }
  });

  return sanitized;
}

/**
 * Middleware pour logger les erreurs avec contexte
 */
function errorLogging(error, req, res, next) {
  const logger = req.logger || new ContextualLogger();
  
  logger.error('Request Error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    statusCode: error.statusCode || 500
  });

  next(error);
}

module.exports = {
  requestCorrelation,
  errorLogging,
  sanitizeRequestBody
};
