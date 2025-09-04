/**
 * 🚨 GESTION GLOBALE DES ERREURS - CADOK
 * Middleware complet pour traiter toutes les erreurs de l'application
 */

const { logger, logCriticalError } = require('../utils/logger');

/**
 * Types d'erreurs standardisées
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service unavailable') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Middleware principal de gestion d'erreurs
 */
function globalErrorHandler(error, req, res, next) {
  const logger = req.logger || require('../utils/logger').logger;
  
  // Assurer que l'erreur a les propriétés nécessaires
  let err = error;
  if (!(error instanceof AppError)) {
    err = convertToAppError(error);
  }

  // Logger l'erreur avec le niveau approprié
  logError(err, req, logger);

  // En mode développement, inclure la stack trace
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Construire la réponse d'erreur
  const errorResponse = {
    success: false,
    error: {
      message: err.isOperational ? err.message : 'Internal server error',
      code: err.errorCode,
      timestamp: err.timestamp,
      requestId: req.requestId
    }
  };

  // Ajouter des détails en développement
  if (isDevelopment && err.isOperational) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err;
  }

  // Ajouter des champs spécifiques selon le type d'erreur
  if (err instanceof ValidationError && err.field) {
    errorResponse.error.field = err.field;
  }

  // Répondre avec le status code approprié
  res.status(err.statusCode).json(errorResponse);
}

/**
 * Convertir les erreurs natives en AppError
 */
function convertToAppError(error) {
  // Erreurs MongoDB
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if (error.code === 11000) {
      return new ConflictError('Duplicate entry detected');
    }
    return new DatabaseError(`Database error: ${error.message}`);
  }

  // Erreurs Mongoose
  if (error.name === 'ValidationError') {
    return new ValidationError(`Validation failed: ${error.message}`);
  }

  if (error.name === 'CastError') {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }

  // Erreurs de parse JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return new ValidationError('Invalid JSON format');
  }

  // Erreur générique
  return new AppError(
    error.message || 'Internal server error',
    error.statusCode || 500,
    'INTERNAL_ERROR',
    false
  );
}

/**
 * Logger une erreur avec le niveau approprié
 */
function logError(error, req, logger) {
  const logData = {
    error: error.message,
    errorCode: error.errorCode,
    statusCode: error.statusCode,
    url: req?.originalUrl,
    method: req?.method,
    ip: req?.ip,
    userId: req?.user?.id,
    userAgent: req?.get('User-Agent'),
    isOperational: error.isOperational
  };

  if (error.statusCode >= 500) {
    // Erreurs serveur - niveau error
    logger.error('Server Error', {
      ...logData,
      stack: error.stack
    });

    // Log critique pour erreurs non opérationnelles
    if (!error.isOperational) {
      logCriticalError(error, logData);
    }
  } else if (error.statusCode >= 400) {
    // Erreurs client - niveau warn
    logger.warn('Client Error', logData);
  } else {
    // Autres - niveau info
    logger.info('Application Error', logData);
  }
}

/**
 * Middleware pour capturer les routes non trouvées
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Gestionnaire pour les rejets de promesses non gérés
 */
function handleUnhandledRejection() {
  process.on('unhandledRejection', (reason, promise) => {
    logCriticalError(new Error('Unhandled Promise Rejection'), {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
    
    // Optionnel: arrêter l'application en production
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled Rejection. Shutting down...');
      process.exit(1);
    }
  });
}

/**
 * Gestionnaire pour les exceptions non capturées
 */
function handleUncaughtException() {
  process.on('uncaughtException', (error) => {
    logCriticalError(error, {
      type: 'Uncaught Exception',
      pid: process.pid
    });
    
    console.error('Uncaught Exception. Shutting down...');
    process.exit(1);
  });
}

module.exports = {
  // Classes d'erreurs
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  
  // Middlewares
  globalErrorHandler,
  notFoundHandler,
  
  // Gestionnaires globaux
  handleUnhandledRejection,
  handleUncaughtException,
  
  // Utilitaires
  convertToAppError,
  logError
};
