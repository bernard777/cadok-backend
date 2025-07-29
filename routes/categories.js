// routes/categories.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const Category = require('../models/Category');

// Route POST pour créer une catégorie
router.post('/', categoryController.createCategory);

// Route GET pour récupérer toutes les catégories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().select('name fields -_id');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;  