/**
 * 🌤️ ROUTES CLOUDINARY POUR CADOK
 * 
 * Gestion de l'upload et de la restitution des médias via Cloudinary
 */

const express = require('express');
const router = express.Router();
const { uploadAvatar, uploadObject, uploadTrade, cloudinaryUtils } = require('../config/cloudinary');
const auth = require('../middlewares/auth');

// Upload d'avatar utilisateur
router.post('/upload/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier fourni' 
      });
    }

    // Génération des URLs optimisées
    const responsiveUrls = cloudinaryUtils.getResponsiveUrls(req.file.public_id);

    res.json({
      success: true,
      message: 'Avatar uploadé avec succès',
      data: {
        publicId: req.file.public_id,
        url: req.file.path,
        urls: responsiveUrls,
        filename: req.file.filename,
        size: req.file.bytes,
        format: req.file.format
      }
    });

    console.log('✅ Avatar uploadé:', {
      userId: req.user.id,
      publicId: req.file.public_id,
      size: req.file.bytes
    });

  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'avatar'
    });
  }
});

// Upload d'images d'objets (multiple)
router.post('/upload/object', auth, uploadObject.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier fourni' 
      });
    }

    // Traitement des fichiers uploadés
    const uploadedImages = req.files.map(file => {
      const responsiveUrls = cloudinaryUtils.getResponsiveUrls(file.public_id);
      
      return {
        publicId: file.public_id,
        url: file.path,
        urls: responsiveUrls,
        filename: file.filename,
        size: file.bytes,
        format: file.format
      };
    });

    res.json({
      success: true,
      message: `${uploadedImages.length} image(s) uploadée(s) avec succès`,
      data: uploadedImages
    });

    console.log('✅ Images objet uploadées:', {
      userId: req.user.id,
      count: uploadedImages.length,
      totalSize: req.files.reduce((sum, file) => sum + file.bytes, 0)
    });

  } catch (error) {
    console.error('❌ Erreur upload images objet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des images'
    });
  }
});

// Upload de preuves d'échange
router.post('/upload/trade-proof', auth, uploadTrade.array('proofs', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier fourni' 
      });
    }

    const uploadedProofs = req.files.map(file => {
      const responsiveUrls = cloudinaryUtils.getResponsiveUrls(file.public_id);
      
      return {
        publicId: file.public_id,
        url: file.path,
        urls: responsiveUrls,
        filename: file.filename,
        size: file.bytes,
        format: file.format
      };
    });

    res.json({
      success: true,
      message: `${uploadedProofs.length} preuve(s) uploadée(s) avec succès`,
      data: uploadedProofs
    });

    console.log('✅ Preuves échange uploadées:', {
      userId: req.user.id,
      count: uploadedProofs.length
    });

  } catch (error) {
    console.error('❌ Erreur upload preuves échange:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des preuves'
    });
  }
});

// Génération d'URL optimisée à la demande
router.get('/optimize/:publicId', (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, quality = 'auto:good' } = req.query;

    const optimizedUrl = cloudinaryUtils.getOptimizedUrl(publicId, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      quality
    });

    res.json({
      success: true,
      optimizedUrl
    });

  } catch (error) {
    console.error('❌ Erreur génération URL optimisée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération de l\'URL optimisée'
    });
  }
});

// Suppression d'image
router.delete('/delete/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinaryUtils.deleteImage(publicId);

    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      result
    });

  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image'
    });
  }
});

// Nettoyage automatique (endpoint admin)
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Admin requis'
      });
    }

    const { daysOld = 7 } = req.body;
    const result = await cloudinaryUtils.cleanupTempImages(daysOld);

    res.json({
      success: true,
      message: `Nettoyage effectué - images de plus de ${daysOld} jours supprimées`,
      result
    });

  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage'
    });
  }
});

module.exports = router;
