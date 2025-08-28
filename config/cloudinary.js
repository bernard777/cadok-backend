/**
 * 🌤️ CONFIGURATION CLOUDINARY POUR CADOK
 * 
 * Gestion centralisée du stockage et de l'optimisation des médias
 * Organisation par dossiers pour séparer les différents types de contenu
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary avec variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force HTTPS
});

// Organisation des dossiers par type de contenu
const CLOUDINARY_FOLDERS = {
  AVATARS: 'cadok/avatars',
  OBJECTS: 'cadok/objects',
  TRADES: 'cadok/trades',
  CATEGORIES: 'cadok/categories',
  TEMP: 'cadok/temp'
};

// Configuration du stockage pour les avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: CLOUDINARY_FOLDERS.AVATARS,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { format: 'webp' } // Conversion automatique en WebP
    ],
    public_id: (req, file) => `avatar_${req.user?.id || 'unknown'}_${Date.now()}`,
  },
});

// Configuration du stockage pour les objets
const objectStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: CLOUDINARY_FOLDERS.OBJECTS,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { format: 'webp' }
    ],
    public_id: (req, file) => `object_${req.user?.id || 'unknown'}_${Date.now()}`,
  },
});

// Configuration du stockage pour les échanges (preuves)
const tradeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: CLOUDINARY_FOLDERS.TRADES,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { format: 'webp' }
    ],
    public_id: (req, file) => `trade_${req.user?.id || 'unknown'}_${Date.now()}`,
  },
});

// Middleware Multer configuré pour chaque type
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

const uploadObject = multer({ 
  storage: objectStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max pour les objets
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

const uploadTrade = multer({ 
  storage: tradeStorage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB max pour les preuves d'échange
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Fonctions utilitaires
const cloudinaryUtils = {
  /**
   * Génère une URL optimisée pour un affichage donné
   */
  getOptimizedUrl: (publicId, options = {}) => {
    const defaultOptions = {
      quality: 'auto:good',
      format: 'webp',
      secure: true
    };
    
    return cloudinary.url(publicId, { ...defaultOptions, ...options });
  },

  /**
   * Génère des URLs responsives pour différentes tailles d'écran
   */
  getResponsiveUrls: (publicId) => {
    return {
      thumbnail: cloudinary.url(publicId, {
        width: 150, height: 150, crop: 'fill',
        quality: 'auto:good', format: 'webp'
      }),
      medium: cloudinary.url(publicId, {
        width: 400, height: 400, crop: 'limit',
        quality: 'auto:good', format: 'webp'
      }),
      large: cloudinary.url(publicId, {
        width: 800, height: 800, crop: 'limit',
        quality: 'auto:good', format: 'webp'
      }),
      original: cloudinary.url(publicId, {
        quality: 'auto:best', format: 'webp'
      })
    };
  },

  /**
   * Supprime une image de Cloudinary
   */
  deleteImage: async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ Image supprimée de Cloudinary:', publicId);
      return result;
    } catch (error) {
      console.error('❌ Erreur suppression Cloudinary:', error);
      throw error;
    }
  },

  /**
   * Nettoie les images temporaires plus anciennes que X jours
   */
  cleanupTempImages: async (daysOld = 7) => {
    try {
      const timestamp = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const result = await cloudinary.api.delete_resources_by_prefix(
        `${CLOUDINARY_FOLDERS.TEMP}/`,
        { created_at: { $lt: new Date(timestamp) } }
      );
      console.log('🧹 Nettoyage Cloudinary effectué:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur nettoyage Cloudinary:', error);
      throw error;
    }
  }
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadObject,
  uploadTrade,
  cloudinaryUtils,
  CLOUDINARY_FOLDERS
};
