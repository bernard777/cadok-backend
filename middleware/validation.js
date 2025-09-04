/**
 * 🛡️ VALIDATION ET SANITISATION RENFORCÉES - CADOK
 * Système complet de validation des données avec sanitisation automatique
 */

const { body, param, query, validationResult } = require('express-validator');
const { JSDOM } = require('jsdom');
const { ValidationError } = require('./errorHandler');

// Configuration DOMPurify pour Node.js avec vérification
let purify;
try {
  const DOMPurify = require('dompurify');
  const window = new JSDOM('').window;
  purify = DOMPurify(window);
} catch (error) {
  // Fallback pour les tests ou si DOMPurify n'est pas disponible
  purify = {
    sanitize: (input) => String(input).replace(/<[^>]*>/g, '') // Simple HTML tag removal
  };
}

/**
 * Configuration de sanitisation avancée
 */
const sanitizationConfig = {
  // Configuration stricte pour les textes utilisateur
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORCE_BODY: false
  },
  
  // Configuration pour descriptions avec formatage basique
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    FORCE_BODY: false
  }
};

/**
 * Classe principale de validation
 */
class ValidationService {
  /**
   * Sanitiser une chaîne de caractères
   */
  static sanitizeString(str, level = 'strict') {
    if (!str || typeof str !== 'string') return str;
    
    const config = sanitizationConfig[level] || sanitizationConfig.strict;
    return purify.sanitize(str, config).trim();
  }

  /**
   * Sanitiser récursivement un objet
   */
  static sanitizeObject(obj, fieldsConfig = {}) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      const config = fieldsConfig[key] || 'strict';
      
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value, config);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, fieldsConfig);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Validation des mots de passe robuste
   */
  static validatePassword(password) {
    const requirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      forbiddenPatterns: [
        /(.)\1{3,}/, // Répétition du même caractère 4+ fois
        /^[0-9]+$/, // Que des chiffres
        /^[a-zA-Z]+$/, // Que des lettres
        /password/i, // Contient "password"
        /123456/, // Séquence numérique commune
        /qwerty/i // Séquence clavier commune
      ]
    };

    const errors = [];

    if (password.length < requirements.minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${requirements.minLength} caractères`);
    }

    if (password.length > requirements.maxLength) {
      errors.push(`Le mot de passe ne peut pas dépasser ${requirements.maxLength} caractères`);
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    // Vérifier les patterns interdits
    for (const pattern of requirements.forbiddenPatterns) {
      if (pattern.test(password)) {
        errors.push('Le mot de passe contient un pattern non sécurisé');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculer la force d'un mot de passe
   */
  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Complexité
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    
    // Diversité
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 1;
    
    if (score <= 3) return 'faible';
    if (score <= 5) return 'moyen';
    if (score <= 7) return 'fort';
    return 'très fort';
  }

  /**
   * Validation d'email avancée
   */
  static validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format d\'email invalide' };
    }

    // Vérifications supplémentaires
    const [localPart, domain] = email.split('@');
    
    if (localPart.length > 64) {
      return { isValid: false, error: 'Partie locale de l\'email trop longue' };
    }

    if (domain.length > 253) {
      return { isValid: false, error: 'Domaine de l\'email trop long' };
    }

    // Domaines suspects (liste basique)
    const suspiciousDomains = [
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com',
      'tempmail.org'
    ];

    if (suspiciousDomains.includes(domain.toLowerCase())) {
      return { isValid: false, error: 'Domaine email temporaire non autorisé' };
    }

    return { isValid: true };
  }
}

/**
 * Middlewares de validation pré-configurés
 */
const ValidationMiddlewares = {
  /**
   * Validation d'un ObjectId MongoDB
   */
  mongoId: (fieldName = 'id') => {
    return param(fieldName)
      .isMongoId()
      .withMessage(`${fieldName} doit être un ObjectId MongoDB valide`);
  },

  /**
   * Validation d'email
   */
  email: (fieldName = 'email') => {
    return body(fieldName)
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail();
  },

  /**
   * Validation de mot de passe
   */
  password: (fieldName = 'password') => {
    return body(fieldName)
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial');
  },

  /**
   * Sanitisation de texte
   */
  sanitizeText: (fieldName, maxLength = 1000) => {
    return body(fieldName)
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} ne peut pas dépasser ${maxLength} caractères`)
      .customSanitizer(value => {
        if (!value) return value;
        return ValidationService.sanitizeString(value, 'basic');
      });
  },

  /**
   * Validation de téléphone
   */
  phone: (fieldName = 'phone') => {
    return body(fieldName)
      .isMobilePhone('fr-FR')
      .withMessage('Numéro de téléphone invalide');
  },

  /**
   * Validation de longueur de tableau
   */
  arrayLength: (fieldName, min = 0, max = 100) => {
    return body(fieldName)
      .isArray({ min, max })
      .withMessage(`${fieldName} doit être un tableau de ${min} à ${max} éléments`);
  },

  /**
   * Validation de prix
   */
  price: (fieldName = 'price', min = 0, max = 999999) => {
    return body(fieldName)
      .isFloat({ min, max })
      .withMessage(`${fieldName} doit être un nombre entre ${min} et ${max}`);
  },

  /**
   * Validateur personnalisé
   */
  custom: (fieldName, validator, errorMessage) => {
    return body(fieldName)
      .custom(validator)
      .withMessage(errorMessage);
  },

  /**
   * Validation inscription utilisateur
   */
  userRegistration: [
    body('pseudo')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Le pseudo doit contenir entre 3 et 30 caractères')
      .matches(/^[a-zA-Z0-9À-ÿ_\-]+$/)
      .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores')
      .custom(async (value) => {
        const User = require('../models/User');
        const existingUser = await User.findOne({ pseudo: value });
        if (existingUser) {
          throw new Error('Ce pseudo est déjà utilisé');
        }
        return true;
      }),

    body('email')
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail()
      .custom(async (value) => {
        const validation = ValidationService.validateEmail(value);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
        
        const User = require('../models/User');
        const existingUser = await User.findOne({ email: value });
        if (existingUser) {
          throw new Error('Cet email est déjà utilisé');
        }
        return true;
      }),

    body('password')
      .custom((value) => {
        const validation = ValidationService.validatePassword(value);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        return true;
      }),

    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le prénom doit contenir entre 1 et 50 caractères')
      .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
      .withMessage('Le prénom contient des caractères non autorisés'),

    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le nom doit contenir entre 1 et 50 caractères')
      .matches(/^[a-zA-ZÀ-ÿ\s\-\']+$/)
      .withMessage('Le nom contient des caractères non autorisés')
  ],

  /**
   * Validation création d'objet
   */
  objectCreation: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Le titre doit contenir entre 1 et 100 caractères')
      .custom((value) => {
        const sanitized = ValidationService.sanitizeString(value);
        if (sanitized !== value) {
          throw new Error('Le titre contient des caractères non autorisés');
        }
        return true;
      }),

    body('description')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('La description doit contenir entre 1 et 2000 caractères')
      .custom((value) => {
        const sanitized = ValidationService.sanitizeString(value, 'basic');
        if (sanitized.length === 0) {
          throw new Error('La description ne peut pas être vide après sanitisation');
        }
        return true;
      }),

    body('category')
      .trim()
      .isMongoId()
      .withMessage('ID de catégorie invalide')
      .custom(async (value) => {
        const Category = require('../models/Category');
        const category = await Category.findById(value);
        if (!category) {
          throw new Error('Catégorie non trouvée');
        }
        return true;
      })
  ],

  /**
   * Validation ID MongoDB
   */
  mongoId: (fieldName) => [
    param(fieldName)
      .isMongoId()
      .withMessage(`${fieldName} invalide`)
  ],

  /**
   * Validation pagination
   */
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Le numéro de page doit être entre 1 et 1000'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La limite doit être entre 1 et 100')
  ]
};

/**
 * Middleware pour traiter les erreurs de validation
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    throw new ValidationError('Données invalides', errorMessages);
  }

  // Sanitiser automatiquement le body
  if (req.body) {
    req.body = ValidationService.sanitizeObject(req.body, {
      description: 'basic',
      bio: 'basic'
    });
  }

  next();
}

module.exports = {
  ValidationService,
  ValidationMiddlewares,
  handleValidationErrors
};
