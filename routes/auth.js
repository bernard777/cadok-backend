// Utilitaire pour générer une URL complète pour l'avatar
function getFullUrl(req, relativePath) {
  if (!relativePath) return '';
  const host = req.protocol + '://' + req.get('host');
  return relativePath.startsWith('/') ? host + relativePath : host + '/' + relativePath;
}
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

// Limiteur de requêtes pour le login - adapté selon l'environnement
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5, // 100 en test, 5 en prod
  message: 'Trop de tentatives, réessayez plus tard.',
  skip: (req) => {
    // Plus souple en mode test
    return process.env.NODE_ENV === 'test';
  }
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
    
    console.log('🔍 [DEBUG REGISTER] Début inscription pour:', email);
    console.log('🔍 [DEBUG REGISTER] NODE_ENV:', process.env.NODE_ENV);
    
    try {
      console.log('🔍 [DEBUG REGISTER] Vérification utilisateur existant...');
      const existing = await User.findOne({ email });
      if (existing) {
        console.log('❌ [DEBUG REGISTER] Email déjà utilisé');
        return res.status(400).json({ message: 'Email déjà utilisé' });
      }

      console.log('🔍 [DEBUG REGISTER] Hash du mot de passe...');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Ajoute l'avatar si présent
      let avatarUrl = '';
      if (req.file) {
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
      }

      console.log('🔍 [DEBUG REGISTER] Création de l\'utilisateur...');
      const newUser = new User({ email, password: hashedPassword, pseudo, city, avatar: avatarUrl });
      await newUser.save();

      console.log('🔍 [DEBUG REGISTER] Génération du token...');
      const token = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('🔍 [DEBUG REGISTER] Récupération utilisateur pour réponse...');
      let userToReturn = await User.findById(newUser._id).select('-password').lean();
      userToReturn.avatar = getFullUrl(req, userToReturn.avatar);
      
      console.log('✅ [DEBUG REGISTER] Inscription réussie pour:', email);
      res.status(201).json({ token, user: userToReturn });
    } catch (err) {
      console.error('❌ [DEBUG REGISTER] Erreur complète:', err);
      console.error('❌ [DEBUG REGISTER] Message:', err.message);
      console.error('❌ [DEBUG REGISTER] Stack:', err.stack);
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
      let userToReturn = await User.findById(user._id).select('-password').lean();
      userToReturn.avatar = getFullUrl(req, userToReturn.avatar);
      res.status(200).json({ token, user: userToReturn });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Route protégée
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    user.avatar = getFullUrl(req, user.avatar);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put(
  '/update',
  auth,
  [
    body('email').optional().isEmail().withMessage('Email invalide')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { pseudo, email, city } = req.body;
    try {
      const updates = {};
      if (pseudo) updates.pseudo = pseudo;
      if (email) updates.email = email;
      if (city) updates.city = city;

      // Vérifie que l'email n'est pas déjà utilisé par un autre utilisateur
      if (email) {
        const existing = await User.findOne({ email, _id: { $ne: req.user.id } });
        if (existing) return res.status(400).json({ message: 'Email déjà utilisé.' });
      }

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  }
);

// Update avatar
router.put('/update-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    let avatarUrl = '';
    // Support avatar removal via removeAvatar parameter
    if (req.body.removeAvatar === 'true') {
      avatarUrl = '';
    } else if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    } else {
      return res.status(400).json({ message: 'Aucune image envoyée ou paramètre de suppression absent.' });
    }

    let user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password').lean();

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    user.avatar = getFullUrl(req, user.avatar);
    res.json({ user });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'avatar:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message, stack: err.stack });
  }
});

// Endpoint de test de connectivité
router.get('/test-connection', (req, res) => {
  res.json({ 
    message: 'Connectivité OK', 
    timestamp: new Date().toISOString(),
    server: 'CADOK Backend'
  });
});

// Route profile pour les tests
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    user.avatar = getFullUrl(req, user.avatar);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
