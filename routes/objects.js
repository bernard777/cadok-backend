const express = require('express');
const ObjectModel = require('../models/Object');
const auth = require('../middlewares/auth');

const router = express.Router();


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
// GET /api/objects?status=disponible&category=Jeux
router.get('/', async (req, res) => {
  const { status, category } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (category) filters.category = category;

  try {
    const objects = await ObjectModel.find(filters).populate('owner', 'pseudo');
    res.json(objects);
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
