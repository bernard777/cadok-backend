const express = require('express');
const ObjectModel = require('../models/Object');
const User = require('../models/User');
const auth = require('../middlewares/auth');

const router = express.Router();

// Nombre de catégories favorites attendu (doit être cohérent avec routes/users.js)
const FAVORITE_CATEGORIES_COUNT = 4;


// 🔼 1. Ajouter un objet
// POST /api/objects
router.post('/', auth, async (req, res) => {
  const { title, description, category, imageUrl } = req.body;

  // Validate required fields
  if (
    !title || typeof title !== 'string' ||
    !description || typeof description !== 'string' ||
    !category || typeof category !== 'string'
  ) {
    return res.status(400).json({ error: 'Les champs title, description et category sont requis et doivent être des chaînes de caractères.' });
  }

  try {
    const newObject = new ObjectModel({
      title,
      description,
      category,
      imageUrl,
      owner: req.user.id,
    });

    const saved = await newObject.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});


// 👀 2. Récupérer tous les objets
// GET /api/objects?status=available&category=Games&city=Paris
router.get('/', async (req, res) => {
  const { status, category, city } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (category) filters.category = category;

  try {
    // Si un filtre ville est demandé, on récupère les utilisateurs de cette ville
    let ownerFilter = {};
    if (city) {
      const usersInCity = await User.find({ city }).select('_id');
      ownerFilter = { owner: { $in: usersInCity.map(u => u._id) } };
    }

    const objects = await ObjectModel.find({ ...filters, ...ownerFilter })
      .populate('owner', 'pseudo city');
    res.json(objects);
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

// 👁️ 2.2. Récupérer le détail d'un objet
// GET /api/objects/:id
router.get('/:id', async (req, res) => {
  try {
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
    const object = await ObjectModel.findById(req.params.id);

    if (!object) return res.status(404).json({ message: 'Objet introuvable' });
    if (object.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé' });

    // Only allow specific fields to be updated and validate their types
    const allowedUpdates = ['title', 'description', 'category', 'imageUrl'];
    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        // Validate string fields
        if (['title', 'description', 'category'].includes(field)) {
          if (typeof req.body[field] !== 'string') {
            return res.status(400).json({ error: `Le champ ${field} doit être une chaîne de caractères.` });
          }
        }
        updates[field] = req.body[field];
      }
    }

    const updated = await ObjectModel.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
});


// 🗑️ 4. Supprimer un objet
// DELETE /api/objects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
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
