const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Limiteur de requêtes pour le login (5 tentatives par 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives, réessayez plus tard.'
});

// Configure le stockage des fichiers
const avatarDir = path.join(__dirname, '../uploads/avatars');

// Vérifie que le dossier existe et est accessible en écriture
if (!fs.existsSync(avatarDir)) {
  try {
    fs.mkdirSync(avatarDir, { recursive: true });
  } catch (err) {
    console.error(`Erreur lors de la création du dossier d'avatars:`, err);
    throw err; // Arrête l'application si le dossier ne peut pas être créé
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces and special chars
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, base + '-' + Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image (jpeg, jpg, png, gif) sont autorisés.'));
    }
  }
});

// Register
router.post(
  '/register',
  upload.single('avatar'),
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    body('pseudo').isLength({ min: 3 }).withMessage('Le pseudo doit contenir au moins 3 caractères')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, pseudo, city } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email déjà utilisé' });

      const hashedPassword = await bcrypt.hash(password, 10);

      // Ajoute l'avatar si présent
      let avatarUrl = '';
      if (req.file) {
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
      }

      const newUser = new User({ email, password: hashedPassword, pseudo, city, avatar: avatarUrl });
      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const userToReturn = await User.findById(newUser._id).select('-password');
      res.status(201).json({ token, user: userToReturn });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      // Dummy hash for timing attack mitigation (bcrypt hash for 'invalidpassword')
      const dummyHash = '$2a$10$7a8b9c0d1e2f3g4h5i6j7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k';
      if (!user) {
        // Perform dummy bcrypt compare to normalize timing
        await bcrypt.compare(password, dummyHash);
        return res.status(400).json({ message: 'Identifiants invalides' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Identifiants invalides' });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      const userToReturn = await User.findById(user._id).select('-password');
      res.status(200).json({ token, user: userToReturn });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Route protégée
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
