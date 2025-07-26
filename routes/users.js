const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');

const REQUIRED_CATEGORY_COUNT = 4;

router.post('/me/favorites', auth, async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories) || categories.length !== REQUIRED_CATEGORY_COUNT) {
    return res.status(400).json({ message: `Vous devez sélectionner exactement ${REQUIRED_CATEGORY_COUNT} catégories.` });
  }
  try {
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
  const user = await User.findById(req.user.id).select('favoriteCategories');
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé." });
  }
  res.json({ favoriteCategories: user.favoriteCategories });
});

module.exports = router;