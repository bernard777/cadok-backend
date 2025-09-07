/**
 * 🛡️ MIDDLEWARE DE SÉCURITÉ CADOK
 * Protection XSS, validation, sanitisation, rate limiting
 */

const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { parsePhoneNumber } = require('libphonenumber-js');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

class SecurityMiddleware {

  /**
   * Configuration Helmet pour headers sécurisés (Amélioré avec solution MedicalGo)
   */
  static setupHelmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
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
   * Rate limiting global (Amélioré avec solution MedicalGo)
   */
  static createGlobalRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 requêtes en dev, 100 en prod
      message: {
        status: 'error',
        message: 'Trop de requêtes, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const { logger } = require('../utils/logger');
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Trop de requêtes, réessayez plus tard'
        });
      }
    });
  }

  /**
   * Rate limiting strict pour inscription/connexion (Amélioré avec solution MedicalGo)
   */
  static createAuthRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 tentatives de connexion par IP (Solution MedicalGo)
      message: {
        status: 'error',
        message: 'Trop de tentatives de connexion, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      handler: (req, res) => {
        const { logger } = require('../utils/logger');
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Trop de tentatives de connexion, réessayez plus tard'
        });
      }
    });
  }

  /**
   * Rate limiting pour les trades (Solution MedicalGo adaptée à Cadok)
   */
  static createTradeRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // 20 créations de trades par IP
      message: {
        status: 'error',
        message: 'Trop de créations de trades, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const { logger } = require('../utils/logger');
        logger.warn(`Trade rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Trop de créations de trades, réessayez plus tard'
        });
      }
    });
  }

  /**
   * Rate limiting pour les recherches (Solution MedicalGo adaptée à Cadok)
   */
  static createSearchRateLimit() {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 30, // 30 recherches par minute
      message: {
        status: 'error',
        message: 'Trop de recherches, réessayez plus tard'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const { logger } = require('../utils/logger');
        logger.warn(`Search rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
          status: 'error',
          message: 'Trop de recherches, réessayez plus tard'
        });
      }
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
        .withMessage('La catégorie est requise')
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
        .notEmpty()
        .withMessage('Le prénom est obligatoire')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Le prénom doit contenir entre 1 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
        .withMessage('Le prénom contient des caractères non autorisés'),
      
      body('lastName')
        .notEmpty()
        .withMessage('Le nom est obligatoire')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Le nom doit contenir entre 1 et 50 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
        .withMessage('Le nom contient des caractères non autorisés'),
      
      body('phoneNumber')
        .notEmpty()
        .withMessage('Le numéro de téléphone est obligatoire')
        .custom((value) => {
          try {
            const phone = parsePhoneNumber(value);
            if (!phone || !phone.isValid()) {
              throw new Error('Numéro de téléphone invalide');
            }
            return true;
          } catch (error) {
            throw new Error('Format de numéro de téléphone invalide - utilisez le format international (+33...)');
          }
        })
        .customSanitizer((value) => {
          try {
            const phone = parsePhoneNumber(value);
            if (phone && phone.isValid()) {
              // Normaliser au format E.164
              return phone.format('E.164');
            }
            return value;
          } catch (error) {
            return value;
          }
        }),
      
      body('city')
        .notEmpty()
        .withMessage('La ville est obligatoire')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('La ville doit contenir entre 2 et 100 caractères')
        .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
        .withMessage('La ville contient des caractères non autorisés'),

      body('address')
        .optional()
        .custom((value, { req }) => {
          if (typeof value === 'string') {
            try {
              req.body.address = JSON.parse(value);
            } catch (e) {
              throw new Error('Format d\'adresse invalide');
            }
          }
          
          const address = req.body.address;
          if (!address || typeof address !== 'object') {
            throw new Error('L\'adresse est obligatoire');
          }
          
          if (!address.street || address.street.trim().length < 5) {
            throw new Error('L\'adresse doit contenir au moins 5 caractères');
          }
          
          if (!address.zipCode || !/^\d{5}$/.test(address.zipCode)) {
            throw new Error('Code postal invalide (5 chiffres requis)');
          }
          
          if (!address.city || address.city.trim().length < 2) {
            throw new Error('La ville dans l\'adresse est obligatoire');
          }
          
          if (!address.country || address.country.trim().length < 2) {
            throw new Error('Le pays est obligatoire');
          }
          
          return true;
        })
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
