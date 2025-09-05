/**
 * 🎯 LOGGING SPÉCIALISÉ CADOK - ÉVÉNEMENTS MÉTIER
 * Fonctions de logging contextuelles pour les trades, objets et sécurité
 * Inspiré des solutions MedicalGo adaptées à Cadok
 */

const { logger } = require('./logger');

// Logger pour les événements de sécurité
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Logger spécialisé pour la sécurité
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '20d',
      level: 'warn'
    })
  ]
});

// Logger spécialisé pour les événements business
const businessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(__dirname, '../logs/business-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '15d',
      level: 'info'
    })
  ]
});

/**
 * 🔐 FONCTIONS DE LOGGING SÉCURITÉ
 */

// Logging des tentatives de connexion (Solution MedicalGo adaptée)
const logLoginAttempt = (email, success, ip, userAgent, requestId = null) => {
  securityLogger.info('Login attempt', {
    email, 
    success, 
    ip, 
    userAgent,
    requestId,
    type: 'login_attempt',
    timestamp: new Date().toISOString()
  });
};

// Logging des activités suspectes (Solution MedicalGo adaptée)
const logSuspiciousActivity = (userId, activity, details, ip, requestId = null) => {
  securityLogger.warn('Suspicious activity', {
    userId, 
    activity, 
    details, 
    ip,
    requestId,
    type: 'suspicious_activity',
    timestamp: new Date().toISOString()
  });
};

// Logging des activités suspectes spécifiques aux trades
const logSuspiciousTradeActivity = (userId, activity, details, requestId = null) => {
  securityLogger.warn('Suspicious trade activity', {
    userId,
    activity,
    details,
    requestId,
    type: 'suspicious_trade',
    timestamp: new Date().toISOString()
  });
};

// Logging des accès aux données sensibles (Solution MedicalGo adaptée)
const logSensitiveDataAccess = (userId, action, resource, resourceId, requestId = null) => {
  securityLogger.info('Sensitive data access', {
    userId,
    action,
    resource,
    resourceId,
    requestId,
    type: 'sensitive_data_access',
    timestamp: new Date().toISOString()
  });
};

// Logging des événements de sécurité
const logSecurityEvent = (event, details = {}) => {
  securityLogger.info('Security event', {
    event,
    details: sanitizeLogData(details),
    timestamp: new Date().toISOString(),
    type: 'security_event'
  });
};

/**
 * 📊 FONCTIONS DE LOGGING MÉTIER CADOK
 */

// Logging de création de trade (événement business critical)
const logTradeCreation = (tradeId, creatorId, participantId, objects, requestId = null) => {
  businessLogger.info('Trade created', {
    tradeId,
    creatorId,
    participantId,
    objectCount: objects.length,
    objects: objects.map(obj => ({ id: obj.id || obj, name: obj.name || 'Unknown' })),
    requestId,
    type: 'trade_creation',
    timestamp: new Date().toISOString()
  });
};

// Logging d'échange d'objet (événement business)
const logObjectExchange = (objectId, fromUserId, toUserId, context, requestId = null) => {
  businessLogger.info('Object exchanged', {
    objectId,
    fromUserId,
    toUserId,
    context,
    requestId,
    type: 'object_exchange',
    timestamp: new Date().toISOString()
  });
};

// Logging de création d'objet
const logObjectCreation = (objectId, userId, objectData, requestId = null) => {
  businessLogger.info('Object created', {
    objectId,
    userId,
    objectType: objectData.category,
    objectName: objectData.name,
    requestId,
    type: 'object_creation',
    timestamp: new Date().toISOString()
  });
};

// Logging de recherche d'objets
const logObjectSearch = (userId, searchTerms, resultCount, requestId = null) => {
  businessLogger.info('Object search', {
    userId,
    searchTerms,
    resultCount,
    requestId,
    type: 'object_search',
    timestamp: new Date().toISOString()
  });
};

// Logging de changement de statut de trade
const logTradeStatusChange = (tradeId, oldStatus, newStatus, userId, requestId = null) => {
  businessLogger.info('Trade status changed', {
    tradeId,
    oldStatus,
    newStatus,
    userId,
    requestId,
    type: 'trade_status_change',
    timestamp: new Date().toISOString()
  });
};

// Logging de finalisation de trade
const logTradeCompletion = (tradeId, participantIds, success, requestId = null) => {
  businessLogger.info('Trade completed', {
    tradeId,
    participantIds,
    success,
    requestId,
    type: 'trade_completion',
    timestamp: new Date().toISOString()
  });
};

/**
 * 🚨 FONCTIONS DE LOGGING D'ERREURS
 */

// Logging d'erreurs de validation
const logValidationError = (field, value, rule, userId, requestId = null) => {
  logger.warn('Validation error', {
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : value,
    rule,
    userId,
    requestId,
    type: 'validation_error',
    timestamp: new Date().toISOString()
  });
};

// Logging d'erreurs de trade
const logTradeError = (tradeId, error, context, userId, requestId = null) => {
  logger.error('Trade error', {
    tradeId,
    error: error.message || error,
    context,
    userId,
    requestId,
    type: 'trade_error',
    timestamp: new Date().toISOString()
  });
};

// Logging d'erreurs d'objet
const logObjectError = (objectId, error, operation, userId, requestId = null) => {
  logger.error('Object error', {
    objectId,
    error: error.message || error,
    operation,
    userId,
    requestId,
    type: 'object_error',
    timestamp: new Date().toISOString()
  });
};

/**
 * 📈 FONCTIONS DE LOGGING DE MÉTRIQUES
 */

// Logging de métriques de performance
const logPerformanceMetric = (metric, value, context, requestId = null) => {
  logger.info('Performance metric', {
    metric,
    value,
    context,
    requestId,
    type: 'performance_metric',
    timestamp: new Date().toISOString()
  });
};

// Logging de statistiques d'usage
const logUsageStats = (feature, action, metadata, requestId = null) => {
  businessLogger.info('Usage stats', {
    feature,
    action,
    metadata,
    type: 'usage_stats',
    timestamp: new Date().toISOString()
  });
};

/**
 * 🔍 FONCTIONS UTILITAIRES
 */

// Fonction pour sanitiser les données sensibles dans les logs
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'cardNumber', 'cvv', 'email'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***MASKED***';
    }
  });

  return sanitized;
};

// Fonction pour créer un contexte de logging enrichi
const createLogContext = (req, additionalData = {}) => {
  return {
    requestId: req?.requestId,
    userId: req?.user?.id,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    url: req?.originalUrl,
    method: req?.method,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
};

module.exports = {
  // Loggers spécialisés
  securityLogger,
  businessLogger,
  
  // Fonctions de sécurité
  logLoginAttempt,
  logSuspiciousActivity,
  logSuspiciousTradeActivity,
  logSensitiveDataAccess,
  logSecurityEvent,
  
  // Fonctions métier Cadok
  logTradeCreation,
  logObjectExchange,
  logObjectCreation,
  logObjectSearch,
  logTradeStatusChange,
  logTradeCompletion,
  
  // Fonctions d'erreur
  logValidationError,
  logTradeError,
  logObjectError,
  
  // Fonctions de métriques
  logPerformanceMetric,
  logUsageStats,
  
  // Utilitaires
  sanitizeLogData,
  createLogContext
};
