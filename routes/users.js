const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');

// --- Préférences de notification ---
// GET /me/notification-preferences
router.get('/me/notification-preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json({ notificationPreferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /me/notification-preferences
router.put('/me/notification-preferences', auth, async (req, res) => {
  const allowedFields = ['notifications_push', 'notifications_email', 'promotions', 'sound', 'vibration'];
  const updates = {};
  for (const key of allowedFields) {
    if (typeof req.body[key] === 'boolean') {
      updates[`notificationPreferences.${key}`] = req.body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Aucune préférence valide fournie.' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, select: 'notificationPreferences' }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json({ notificationPreferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});
const Category = require('../models/Category'); // Assurez-vous d'importer le modèle Category
const bcrypt = require('bcryptjs');

const MIN_CATEGORY_COUNT = 4;
const MAX_CATEGORY_COUNT = 8; // Modifiez ce nombre selon la limite souhaitée

router.post('/me/favorites', auth, async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories) || categories.length < MIN_CATEGORY_COUNT || categories.length > MAX_CATEGORY_COUNT) {
    return res.status(400).json({ message: `Vous devez sélectionner entre ${MIN_CATEGORY_COUNT} et ${MAX_CATEGORY_COUNT} catégories.` });
  }
  // Vérifie que toutes les catégories existent
  try {
    const found = await Category.find({ _id: { $in: categories } });
    if (found.length < MIN_CATEGORY_COUNT || found.length !== categories.length) {
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

// Changement de mot de passe sécurisé
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, password } = req.body;

  // Vérification que les champs requis sont présents
  if (!currentPassword || !password) {
    return res.status(400).json({ message: 'Les champs currentPassword et password sont requis.' });
  }

  // Vérification de la force du mot de passe (au moins 8 caractères, une lettre et un chiffre)
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
    const hashed = await bcrypt.hash(password, 12);
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect." });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashed });
    res.json({ message: 'Mot de passe changé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors du changement de mot de passe." });
  }
});

// Récupérer les objets d'un utilisateur (pour la vitrine publique)
router.get('/:userId/objects', auth, async (req, res) => {
  try {
    const ObjectModel = require('../models/Object');
    const { userId } = req.params;

    const objects = await ObjectModel.find({ 
      owner: userId, 
      status: 'available' // Seulement les objets disponibles
    })
    .populate('owner', 'pseudo city')
    .sort({ createdAt: -1 });

    res.json(objects);
  } catch (err) {
    console.error('Erreur lors de la récupération des objets:', err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des objets." });
  }
});

module.exports = router;