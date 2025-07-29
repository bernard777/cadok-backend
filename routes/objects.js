const express = require('express');
const ObjectModel = require('../models/Object');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Nombre de catégories favorites attendu (doit être cohérent avec routes/users.js)
const FAVORITE_CATEGORIES_COUNT = 4;

// Statuts valides pour les objets
const VALID_STATUSES = ['available', 'traded', 'reserved'];

// 🛠️ Fonction utilitaire pour valider et traiter les images
const validateAndProcessImages = (images) => {
  if (!Array.isArray(images)) {
    return { error: 'Le champ images doit être un tableau.' };
  }
  
  if (images.length > 10) {
    return { error: 'Maximum 10 images autorisées par objet.' };
  }

  const processedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    if (!image.url || typeof image.url !== 'string' || image.url.trim().length === 0) {
      return { error: `L'URL de l'image ${i + 1} est requise et doit être une chaîne de caractères non vide.` };
    }

    if (image.caption && (typeof image.caption !== 'string' || image.caption.length > 200)) {
      return { error: `La légende de l'image ${i + 1} doit être une chaîne de caractères de maximum 200 caractères.` };
    }

    processedImages.push({
      url: image.url.trim(),
      caption: image.caption ? image.caption.trim() : '',
      isPrimary: Boolean(image.isPrimary)
    });
  }

  // S'assurer qu'une seule image est marquée comme principale
  const primaryImages = processedImages.filter(img => img.isPrimary);
  if (primaryImages.length > 1) {
    return { error: 'Une seule image peut être marquée comme principale.' };
  }
  
  // Si aucune image n'est marquée comme principale, marquer la première
  if (processedImages.length > 0 && primaryImages.length === 0) {
    processedImages[0].isPrimary = true;
  }

  return { processedImages };
};

console.log('objects.js chargé');

// Limiteur de taux pour la création d'objets
const createObjectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 objets par 15 min
  message: 'Trop de créations d\'objets, réessayez plus tard.'
});

// 🔼 1. Ajouter un objet
// POST /api/objects
router.post('/', createObjectLimiter, auth, async (req, res) => {
  const { title, description, category, imageUrl, images, attributes } = req.body;
  console.log('POST /api/objects', req.body);

  // Validate required fields
  if (
    !title || typeof title !== 'string' || title.trim().length === 0 ||
    !description || typeof description !== 'string' || description.trim().length === 0 ||
    !category || typeof category !== 'string' || category.trim().length === 0
  ) {
    return res.status(400).json({ error: 'Les champs title, description et category sont requis et ne peuvent pas être vides.' });
  }

  // Validate title and description length
  if (title.trim().length > 100) {
    return res.status(400).json({ error: 'Le titre ne peut pas dépasser 100 caractères.' });
  }
  
  if (description.trim().length > 1000) {
    return res.status(400).json({ error: 'La description ne peut pas dépasser 1000 caractères.' });
  }

  // Validate imageUrl format if provided (pour compatibilité descendante)
  if (imageUrl && (typeof imageUrl !== 'string' || imageUrl.trim().length === 0)) {
    return res.status(400).json({ error: 'L\'URL de l\'image doit être une chaîne de caractères non vide.' });
  }

  // Validate images array
  let processedImages = [];
  if (images && Array.isArray(images)) {
    const imageValidation = validateAndProcessImages(images);
    if (imageValidation.error) {
      return res.status(400).json({ error: imageValidation.error });
    }
    processedImages = imageValidation.processedImages;
  }

  try {
    const newObject = new ObjectModel({
      title,
      description,
      category,
      imageUrl,
      images: processedImages,
      owner: req.user.id,
      attributes: attributes || {}
    });
    const saved = await newObject.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Erreur POST /api/objects:', err); // Ajoute ce log
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});


// 👀 2. Récupérer tous les objets
// GET /api/objects?status=available&category=Games&city=Paris
router.get('/', async (req, res) => {
  const { status, category, city, page = 1, limit = 10 } = req.query;
  
  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Limite max de 50
  const skip = (pageNum - 1) * limitNum;
  
  const filters = {};
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide. Valeurs autorisées : ' + VALID_STATUSES.join(', ') });
    }
    filters.status = status;
  }
  if (category) filters.category = category;

  try {
    // Si un filtre ville est demandé, on récupère les utilisateurs de cette ville
    let ownerFilter = {};
    if (city) {
      const usersInCity = await User.find({ city }).select('_id');
      ownerFilter = { owner: { $in: usersInCity.map(u => u._id) } };
    }

    const objects = await ObjectModel.find({ ...filters, ...ownerFilter })
      .skip(skip)
      .limit(limitNum)
      .populate('owner', 'pseudo city');
      
    const total = await ObjectModel.countDocuments({ ...filters, ...ownerFilter });
    
    res.json({
      objects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// 📰 2.1. Récupérer le fil d'actualités
// GET /api/objects/feed
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    if (!user.favoriteCategories || user.favoriteCategories.length !== FAVORITE_CATEGORIES_COUNT) {
      return res.status(400).json({ message: "Catégories favorites non définies." });
    }
    const objects = await ObjectModel.find({
      category: { $in: user.favoriteCategories },
      owner: { $ne: req.user.id }
    })
      .sort({ createdAt: -1 })
      .populate('owner', 'pseudo city');
    res.json(objects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔽 Récupérer les objets de l'utilisateur connecté
// GET /api/objects/me
router.get('/me', auth, async (req, res) => {
  try {
    console.log('req.user:', req.user);
    const objects = await ObjectModel.find({ owner: req.user.id }).populate('owner', 'pseudo city');
    res.json({ objects });
  } catch (err) {
    console.error('Erreur /objects/me:', err);
    res.status(500).json({ error: 'Impossible de charger vos objets.' });
  }
});

// 👁️ 2.2. Récupérer le détail d'un objet
// GET /api/objects/:id
router.get('/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'objet invalide.' });
    }

    const object = await ObjectModel.findById(req.params.id).populate('owner', 'pseudo city');
    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    res.json(object);
  } catch (err) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// 🖊️ 3. Modifier un objet
// PUT /api/objects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'objet invalide.' });
    }

    const object = await ObjectModel.findById(req.params.id);

    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    if (object.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé' });

    // Only allow specific fields to be updated and validate their types
    const allowedUpdates = ['title', 'description', 'category', 'imageUrl', 'images', 'status'];
    const updates = {};

    // Handle images field separately to avoid duplicate logic
    if (req.body.images !== undefined) {
      if (req.body.images) {
        const imageValidation = validateAndProcessImages(req.body.images);
        if (imageValidation.error) {
          return res.status(400).json({ error: imageValidation.error });
        }
        updates.images = imageValidation.processedImages;
      }
      // If images is undefined or falsy, do not update images field
    }

    for (const field of allowedUpdates) {
      if (field === 'images') continue; // Already handled above
      if (req.body[field] !== undefined) {
        // Validate string fields
        if (['title', 'description', 'category'].includes(field)) {
          if (typeof req.body[field] !== 'string' || req.body[field].trim().length === 0) {
            return res.status(400).json({ error: `Le champ ${field} doit être une chaîne de caractères non vide.` });
          }

          // Validate length constraints
          if (field === 'title' && req.body[field].trim().length > 100) {
            return res.status(400).json({ error: 'Le titre ne peut pas dépasser 100 caractères.' });
          }
          if (field === 'description' && req.body[field].trim().length > 1000) {
            return res.status(400).json({ error: 'La description ne peut pas dépasser 1000 caractères.' });
          }
        }

        // Validate imageUrl field
        if (field === 'imageUrl' && req.body[field] && (typeof req.body[field] !== 'string' || req.body[field].trim().length === 0)) {
          return res.status(400).json({ error: 'L\'URL de l\'image doit être une chaîne de caractères non vide.' });
        }

        // Validate status field
        if (field === 'status' && !VALID_STATUSES.includes(req.body[field])) {
          return res.status(400).json({ error: 'Statut invalide. Valeurs autorisées : ' + VALID_STATUSES.join(', ') });
        }

        updates[field] = req.body[field];
      }
    }
    const updated = await ObjectModel.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/objects/:id:', err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// 📸 3.1. Gérer les images d'un objet
// PUT /api/objects/:id/images - Remplacer toutes les images
router.put('/:id/images', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'objet invalide.' });
    }

    const object = await ObjectModel.findById(req.params.id);
    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    if (object.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé' });

    const { images } = req.body;
    
    const imageValidation = validateAndProcessImages(images);
    if (imageValidation.error) {
      return res.status(400).json({ error: imageValidation.error });
    }

    const updated = await ObjectModel.findByIdAndUpdate(
      req.params.id, 
      { images: imageValidation.processedImages }, 
      { new: true }
    );
    
    res.json(updated);
  } catch (err) {
    console.error('Erreur PUT /api/objects/:id/images:', err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// 📸 3.2. Ajouter une image à un objet
// POST /api/objects/:id/images
router.post('/:id/images', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'objet invalide.' });
    }

    const object = await ObjectModel.findById(req.params.id);
    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    if (object.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé' });

    const { url, caption, isPrimary } = req.body;
    
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({ error: 'L\'URL de l\'image est requise et doit être une chaîne de caractères non vide.' });
    }

    if (caption && (typeof caption !== 'string' || caption.length > 200)) {
      return res.status(400).json({ error: 'La légende doit être une chaîne de caractères de maximum 200 caractères.' });
    }

    // Vérifier le nombre maximum d'images
    if (object.images && object.images.length >= 10) {
      return res.status(400).json({ error: 'Maximum 10 images autorisées par objet.' });
    }

    let newImage = {
      url: url.trim(),
      caption: caption ? caption.trim() : '',
      isPrimary: Boolean(isPrimary)
    };

    // Si c'est la première image, la marquer comme principale
    if (!object.images || object.images.length === 0) {
      newImage.isPrimary = true;
    }

    if (newImage.isPrimary) {
      // Unset all isPrimary flags atomically, then push the new image
      await ObjectModel.updateOne(
        { _id: req.params.id },
        { $set: { "images.$[].isPrimary": false } }
      );
    }

    const updated = await ObjectModel.findByIdAndUpdate(
      req.params.id,
      { $push: { images: newImage } },
      { new: true }
    );

    res.status(201).json(updated);
  } catch (err) {
    console.error('Erreur POST /api/objects/:id/images:', err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// 🗑️ 3.3. Supprimer une image d'un objet
// DELETE /api/objects/:id/images/:imageIndex
router.delete('/:id/images/:imageIndex', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'objet invalide.' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0) {
      return res.status(400).json({ error: 'Index d\'image invalide.' });
    }

    const object = await ObjectModel.findById(req.params.id);
    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    if (object.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé' });

    if (!object.images || imageIndex >= object.images.length) {
      return res.status(404).json({ error: 'Image introuvable.' });
    }

    // Get the image to remove
    const imageToRemove = object.images[imageIndex];

    // Remove the image using $pull and the exact image object
    await ObjectModel.updateOne(
      { _id: req.params.id },
      { $pull: { images: { _id: imageToRemove._id } } }
    );

    // After removal, check if there are images left and if none isPrimary, set the first as primary
    const updatedObject = await ObjectModel.findById(req.params.id);
    if (updatedObject.images.length > 0 && !updatedObject.images.some(img => img.isPrimary)) {
      updatedObject.images[0].isPrimary = true;
      await updatedObject.save();
    }

    res.json(updatedObject);
  } catch (err) {
    console.error('Erreur DELETE /api/objects/:id/images/:imageIndex:', err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});

// 🗑️ 4. Supprimer un objet
// DELETE /api/objects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID d\'objet invalide.' });
    }

    const object = await ObjectModel.findById(req.params.id);

    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    if (object.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé' });

    await object.deleteOne();
    res.json({ message: 'Objet supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
