/**
 * 📊 SYSTÈME DE LOGGING CENTRALISÉ - CADOK
 * Configuration Winston avec rotation des logs et corrélation des requêtes
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configuration des niveaux de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Configuration des couleurs (optionnel pour les tests)
if (winston.addColors && typeof winston.addColors === 'function') {
  winston.addColors(logColors);
}

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, stack, requestId, userId, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (requestId) logMessage += ` [REQ:${requestId}]`;
    if (userId) logMessage += ` [USER:${userId}]`;
    
    logMessage += `: ${message}`;
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Configuration des transports
const transports = [
  // Console pour développement
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }),

  // Fichier pour tous les logs avec rotation
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat
  }),

  // Fichier spécifique pour les erreurs
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  }),

  // Fichier pour les requêtes HTTP
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    level: 'http',
    format: logFormat
  })
];

// Créer le logger principal
const logger = winston.createLogger({
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false
});

// Créer le dossier logs s'il n'existe pas
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * 🔗 Logger avec contexte de requête
 */
class ContextualLogger {
  constructor(requestId = null, userId = null) {
    this.requestId = requestId;
    this.userId = userId;
  }

  error(message, meta = {}) {
    logger.error(message, { 
      requestId: this.requestId, 
      userId: this.userId, 
      ...meta 
    });
  }

  warn(message, meta = {}) {
    logger.warn(message, { 
      requestId: this.requestId, 
      userId: this.userId, 
      ...meta 
    });
  }

  info(message, meta = {}) {
    logger.info(message, { 
      requestId: this.requestId, 
      userId: this.userId, 
      ...meta 
    });
  }

  http(message, meta = {}) {
    logger.http(message, { 
      requestId: this.requestId, 
      userId: this.userId, 
      ...meta 
    });
  }

  debug(message, meta = {}) {
    logger.debug(message, { 
      requestId: this.requestId, 
      userId: this.userId, 
      ...meta 
    });
  }
}

/**
 * 📊 Métriques de performance
 */
class PerformanceMetrics {
  static timers = new Map();

  static startTimer(operation, requestId = null) {
    const key = `${operation}_${requestId || 'global'}`;
    this.timers.set(key, {
      start: process.hrtime.bigint(),
      operation,
      requestId
    });
  }

  static endTimer(operation, requestId = null) {
    const key = `${operation}_${requestId || 'global'}`;
    const timer = this.timers.get(key);
    
    if (timer) {
      const duration = Number(process.hrtime.bigint() - timer.start) / 1000000; // ms
      
      logger.info(`Performance: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        requestId: timer.requestId,
        operation
      });

      this.timers.delete(key);
      return duration;
    }
    return null;
  }
}

/**
 * 🚨 Logger d'urgence pour erreurs critiques
 */
function logCriticalError(error, context = {}) {
  const criticalLogger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/critical-errors.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    ]
  });

  criticalLogger.error('CRITICAL ERROR', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memoryUsage: process.memoryUsage()
  });
}

module.exports = {
  logger,
  ContextualLogger,
  PerformanceMetrics,
  logCriticalError
};
