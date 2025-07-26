const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Category = require('../models/Category'); // Assurez-vous d'importer le modèle Category

const REQUIRED_CATEGORY_COUNT = 4;

router.post('/me/favorites', auth, async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories) || categories.length !== REQUIRED_CATEGORY_COUNT) {
    return res.status(400).json({ message: `Vous devez sélectionner exactement ${REQUIRED_CATEGORY_COUNT} catégories.` });
  }
  // Vérifie que toutes les catégories existent
  try {
    const found = await Category.find({ _id: { $in: categories } });
    if (found.length !== REQUIRED_CATEGORY_COUNT) {
      return res.status(400).json({ message: "Une ou plusieurs catégories sont invalides." });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { favoriteCategories: categories }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.json({ favoriteCategories: user.favoriteCategories });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.get('/me/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favoriteCategories', 'name fields')
      .select('favoriteCategories');
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.json({ favoriteCategories: user.favoriteCategories });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

module.exports = router;