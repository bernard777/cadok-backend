/**
 * 🛡️ MIDDLEWARE DE SÉCURITÉ CADOK
 * Protection XSS, validation, sanitisation, rate limiting
 */

const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

class SecurityMiddleware {

  /**
   * Configuration Helmet pour headers sécurisés
   */
  static setupHelmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  /**
   * Rate limiting global
   */
  static createGlobalRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limite de 1000 requêtes par 15min par IP
      message: {
        error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Rate limiting strict pour inscription/connexion
   */
  static createAuthRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Seulement 10 tentatives de connexion par 15min
      message: {
        error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true
    });
  }

  /**
   * Sanitisation XSS des strings
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Nettoyer le HTML malveillant
    const cleaned = DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], // Aucun tag HTML autorisé
      ALLOWED_ATTR: []  // Aucun attribut autorisé
    });
    
    // Double vérification : supprimer tout ce qui ressemble à du JavaScript
    return cleaned
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/eval\(/gi, '')
      .replace(/expression\(/gi, '');
  }

  /**
   * Middleware de sanitisation des données d'entrée
   */
  static sanitizeInput() {
    return (req, res, next) => {
      console.log('🧼 Sanitisation des données d\'entrée...');
      
      // Sanitiser req.body
      if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
          if (typeof req.body[key] === 'string') {
            const original = req.body[key];
            req.body[key] = this.sanitizeString(req.body[key]);
            
            // Log si modification détectée
            if (original !== req.body[key]) {
              console.warn(`⚠️ Contenu malveillant détecté et nettoyé dans ${key}:`, {
                original: original.substring(0, 100),
                cleaned: req.body[key].substring(0, 100)
              });
            }
          }
        }
      }
      
      // Sanitiser req.query
      if (req.query && typeof req.query === 'object') {
        for (const key in req.query) {
          if (typeof req.query[key] === 'string') {
            const original = req.query[key];
            req.query[key] = this.sanitizeString(req.query[key]);
            
            if (original !== req.query[key]) {
              console.warn(`⚠️ Contenu malveillant détecté dans query ${key}:`, {
                original: original.substring(0, 100),
                cleaned: req.query[key].substring(0, 100)
              });
            }
          }
        }
      }
      
      console.log('✅ Sanitisation terminée');
      next();
    };
  }

  /**
   * Validation pour création d'objets
   */
  static validateObjectCreation() {
    return [
      body('title')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Le titre doit contenir entre 1 et 100 caractères')
        .matches(/^[a-zA-Z0-9À-ÿ\s\-\.\,\!\?\'\"\_\(\)]+$/)
        .withMessage('Le titre contient des caractères non autorisés'),
      
      body('description')
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('La description doit contenir entre 1 et 2000 caractères')
        .matches(/^[a-zA-Z0-9À-ÿ\s\-\.\,\!\?\'\"\n\r\_\(\)]+$/)
        .withMessage('La description contient des caractères non autorisés'),
      
      body('category')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('La catégorie est requise'),
      
      body('estimatedValue')
        .isNumeric()
        .withMessage('La valeur estimée doit être un nombre')
        .isFloat({ min: 0, max: 1000000 })
        .withMessage('La valeur estimée doit être entre 0 et 1,000,000')
    ];
  }

  /**
   * Validation pour inscription utilisateur
   */
  static validateUserRegistration() {
    return [
      body('pseudo')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Le pseudo doit contenir entre 3 et 30 caractères')
        .matches(/^[a-zA-Z0-9À-ÿ_\-]+$/)
        .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores'),
      
      body('email')
        .isEmail()
        .withMessage('Email invalide')
        .normalizeEmail(),
      
      body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Le mot de passe doit contenir entre 8 et 128 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
      
      body('firstName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
        .withMessage('Le prénom contient des caractères non autorisés'),
      
      body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
        .withMessage('Le nom contient des caractères non autorisés')
    ];
  }

  /**
   * Middleware pour vérifier les erreurs de validation
   */
  static handleValidationErrors() {
    return (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.warn('⚠️ Erreurs de validation détectées:', errors.array());
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array(),
          code: 'VALIDATION_ERROR'
        });
      }
      next();
    };
  }

  /**
   * Détection d'injection SQL basique
   */
  static detectSQLInjection() {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(--|\/\*|\*\/|;)/,
        /(\bOR\b.*=.*|1=1|1=1--)/i,
        /(\bAND\b.*=.*)/i
      ];

      const checkForSQL = (obj, path = '') => {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          const value = obj[key];
          
          if (typeof value === 'string') {
            for (const pattern of sqlPatterns) {
              if (pattern.test(value)) {
                console.error('🚨 Tentative d\'injection SQL détectée:', {
                  path: currentPath,
                  value: value.substring(0, 100),
                  ip: req.ip,
                  userAgent: req.get('User-Agent')
                });
                
                return res.status(400).json({
                  success: false,
                  error: 'Requête invalide détectée',
                  code: 'SUSPICIOUS_QUERY'
                });
              }
            }
          } else if (typeof value === 'object' && value !== null) {
            const result = checkForSQL(value, currentPath);
            if (result) return result;
          }
        }
        return null;
      };

      const sqlCheck = checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params);
      if (sqlCheck) return sqlCheck;

      next();
    };
  }

  /**
   * Log des tentatives d'attaque
   */
  static logSecurityEvent(eventType, details) {
    const timestamp = new Date().toISOString();
    console.error(`🚨 [SECURITY-${eventType}] ${timestamp}:`, details);
    
    // TODO: Implémenter un système de logs persistant
    // - Sauvegarder dans fichier de log
    // - Envoyer alerte email/webhook
    // - Bloquer IP automatiquement après X tentatives
  }
}

module.exports = SecurityMiddleware;
