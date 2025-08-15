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

// 🛡️ IMPORTATION MIDDLEWARE DE SÉCURITÉ
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();

// 🛡️ LIMITEUR DE REQUÊTES POUR L'AUTHENTIFICATION - SÉCURISÉ
const authLimiter = SecurityMiddleware.createAuthRateLimit();

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
// 🛡️ INSCRIPTION SÉCURISÉE
router.post(
  '/register',
  authLimiter, // Rate limiting pour inscription
  upload.single('avatar'),
  SecurityMiddleware.validateUserRegistration(), // Validation sécurisée
  SecurityMiddleware.handleValidationErrors(), // Gestion des erreurs
  async (req, res) => {
    const { email, password, pseudo, city, firstName, lastName, phoneNumber } = req.body;
    
    // Parser l'objet address s'il est sérialisé en JSON
    let parsedAddress = {};
    try {
      if (req.body.address && typeof req.body.address === 'string') {
        parsedAddress = JSON.parse(req.body.address);
      } else {
        parsedAddress = req.body.address || {};
      }
    } catch (e) {
      console.log('� [SECURE REGISTER] Erreur parsing address, utilisation valeurs par défaut:', e.message);
      parsedAddress = {};
    }
    
    console.log('�🔍 [SECURE REGISTER] Début inscription sécurisée pour:', email);
    console.log('🔍 [SECURE REGISTER] NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 [SECURE REGISTER] Address parsée:', parsedAddress);
    
    try {
      console.log('🔍 [SECURE REGISTER] Vérification utilisateur existant...');
      const existing = await User.findOne({ 
        $or: [
          { email },
          { phoneNumber }
        ]
      });
      if (existing) {
        // Vérifier si l'utilisateur est banni définitivement
        if (existing.status === 'banned' && !existing.bannedUntil) {
          console.log('🚫 [SECURE REGISTER] Tentative d\'inscription d\'un utilisateur banni définitivement:', email);
          return res.status(403).json({ 
            success: false,
            error: 'Impossible de créer un compte. Contactez l\'administration si vous pensez qu\'il s\'agit d\'une erreur.',
            code: 'BANNED_USER_REGISTRATION_DENIED'
          });
        }
        
        // Vérifier si l'utilisateur est banni temporairement et que le ban est encore actif
        if (existing.status === 'banned' && existing.bannedUntil && new Date() < existing.bannedUntil) {
          console.log('🚫 [SECURE REGISTER] Tentative d\'inscription d\'un utilisateur banni temporairement:', email);
          return res.status(403).json({ 
            success: false,
            error: `Votre compte est suspendu jusqu'au ${existing.bannedUntil.toLocaleDateString()}. Contactez l\'administration pour plus d\'informations.`,
            code: 'TEMP_BANNED_USER_REGISTRATION_DENIED'
          });
        }
        
        const field = existing.email === email ? 'Email' : 'Numéro de téléphone';
        console.log('❌ [SECURE REGISTER]', field, 'déjà utilisé');
        return res.status(400).json({ 
          success: false,
          error: `${field} déjà utilisé`,
          code: field === 'Email' ? 'EMAIL_ALREADY_EXISTS' : 'PHONE_ALREADY_EXISTS'
        });
      }

      console.log('🔍 [SECURE REGISTER] Hash du mot de passe sécurisé...');
      const hashedPassword = await bcrypt.hash(password, 12); // Salt rounds augmenté pour plus de sécurité

      // Ajoute l'avatar si présent
      let avatarUrl = '';
      if (req.file) {
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
      }

      console.log('🔍 [SECURE REGISTER] Création de l\'utilisateur...');
      const newUser = new User({ 
        email, 
        password: hashedPassword, 
        pseudo, 
        city, 
        firstName,
        lastName,
        phoneNumber,
        address: {
          street: parsedAddress.street || 'Non renseigné',
          zipCode: parsedAddress.zipCode || '00000',
          city: parsedAddress.city || city,
          country: parsedAddress.country || 'France',
          additionalInfo: parsedAddress.additionalInfo || ''
        },
        avatar: avatarUrl,
        status: 'pending', // Utilisateur en attente de vérification
        verificationStatus: 'not_verified'
      });
      await newUser.save();

      console.log('🔍 [SECURE REGISTER] Génération du token...');
      const token = jwt.sign(
        { 
          id: newUser._id,
          email: newUser.email,
          role: newUser.role || 'user',
          isAdmin: newUser.isAdmin || false
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('🔍 [SECURE REGISTER] Récupération utilisateur pour réponse...');
      let userToReturn = await User.findById(newUser._id).select('-password').lean();
      userToReturn.avatar = getFullUrl(req, userToReturn.avatar);
      
      // S'assurer que les champs de vérification sont présents pour l'app mobile
      userToReturn.emailVerified = userToReturn.emailVerified || false;
      userToReturn.phoneVerified = userToReturn.phoneVerified || false;
      userToReturn.verified = userToReturn.verified || false;
      
      console.log('📊 [REGISTER] Utilisateur retourné - Statut vérifications:');
      console.log(`   • emailVerified: ${userToReturn.emailVerified}`);
      console.log(`   • phoneVerified: ${userToReturn.phoneVerified}`);
      console.log(`   • verified: ${userToReturn.verified}`);
      
      console.log('📧 [SECURE REGISTER] Envoi de l\'email de vérification...');
      
      // Envoi de l'email de vérification avec Resend
      try {
        const EmailVerificationService = require('../services/EmailVerificationService');
        const emailService = new EmailVerificationService();
        
        // Générer token de vérification
        const verificationToken = emailService.generateVerificationToken();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures
        
        // Sauvegarder le token dans l'utilisateur
        newUser.emailVerificationToken = verificationToken;
        newUser.emailVerificationExpires = expires;
        await newUser.save();
        
        // Envoyer l'email avec Resend
        const emailResult = await emailService.sendVerificationEmail(newUser, verificationToken);
        
        if (emailResult.success) {
          console.log('✅ [RESEND] Email de vérification envoyé à:', email);
          console.log('📧 [RESEND] Service:', emailResult.service);
        } else {
          console.error('⚠️ [RESEND] Échec envoi email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email de vérification:', emailError.message);
        // On ne fait pas échouer l'inscription pour un problème d'email
      }
      
      // 📧 EMAIL DE BIENVENUE sera envoyé APRÈS vérification complète (email + téléphone)
      console.log('ℹ️ [WELCOME] Email de bienvenue sera envoyé après vérification complète (email + téléphone)');
      
      console.log('✅ [SECURE REGISTER] Inscription sécurisée réussie pour:', email);
      res.status(201).json({ 
        token, 
        user: userToReturn,
        message: "Compte créé avec succès ! Consultez votre email pour les prochaines étapes."
      });
    } catch (err) {
      console.error('❌ [DEBUG REGISTER] Erreur complète:', err);
      console.error('❌ [DEBUG REGISTER] Message:', err.message);
      console.error('❌ [DEBUG REGISTER] Stack:', err.stack);
      res.status(500).json({ error: err.message });
    }
  }
);

// 🛡️ CONNEXION SÉCURISÉE
router.post(
  '/login',
  authLimiter, // Rate limiting sécurisé
  [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').notEmpty().withMessage('Mot de passe requis')
      .isLength({ min: 1, max: 128 }).withMessage('Mot de passe invalide')
  ],
  SecurityMiddleware.handleValidationErrors(), // Gestion des erreurs sécurisée
  async (req, res) => {
    const { email, password } = req.body;
    
    console.log('🔐 [SECURE LOGIN] Tentative connexion sécurisée pour:', email);
    
    try {
      const user = await User.findOne({ email });
      
      // Hash factice pour éviter les attaques temporelles
      const dummyHash = '$2a$12$7a8b9c0d1e2f3g4h5i6j7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k';
      
      if (!user) {
        // Effectuer une comparaison factice pour normaliser le temps
        await bcrypt.compare(password, dummyHash);
        console.warn('⚠️ [SECURE LOGIN] Tentative de connexion avec email inexistant:', email);
        
        // Log de sécurité
        SecurityMiddleware.logSecurityEvent('LOGIN_INVALID_EMAIL', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({ 
          success: false,
          error: 'Identifiants invalides',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn('⚠️ [SECURE LOGIN] Tentative avec mauvais mot de passe:', email);
        
        // Log de sécurité
        SecurityMiddleware.logSecurityEvent('LOGIN_INVALID_PASSWORD', {
          email,
          userId: user._id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({ 
          success: false,
          error: 'Identifiants invalides',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Réactiver automatiquement les comptes inactifs lors de la connexion
      console.log(`🔍 [DEBUG] Statut utilisateur avant réactivation: ${user.status}`);
      if (user.status === 'inactive') {
        console.log(`🔄 [DEBUG] DÉBUT de la réactivation pour: ${email}`);
        
        user = await User.findByIdAndUpdate(user._id, {
          status: 'active',
          deactivatedAt: null,
          deactivationReason: null,
          adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] RÉACTIVÉ automatiquement par connexion`
        }, { new: true });
        
        console.log(`🔄 [SECURE LOGIN] Compte inactif réactivé automatiquement: ${email}`);
        console.log(`📊 [SECURE LOGIN] Nouveau statut: ${user.status}`);
        console.log(`✅ [DEBUG] FIN de la réactivation - utilisateur mis à jour`);
      }

      console.log('✅ [SECURE LOGIN] Connexion sécurisée réussie pour:', email);

      const token = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          role: user.role || 'user',
          isAdmin: user.isAdmin || false
        },
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

// 🔑 CHANGEMENT DE MOT DE PASSE SÉCURISÉ
router.post(
  '/change-password',
  auth,
  authLimiter, // Rate limiting pour éviter les attaques par force brute
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis')
      .isLength({ min: 1, max: 128 }).withMessage('Mot de passe actuel invalide'),
    body('newPassword').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit faire au moins 8 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
  ],
  SecurityMiddleware.handleValidationErrors(),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔑 [SECURE CHANGE PASSWORD] Début changement mot de passe pour utilisateur:', req.user.id);
    
    try {
      // Récupérer l'utilisateur avec son mot de passe
      const user = await User.findById(req.user.id);
      if (!user) {
        console.log('❌ [SECURE CHANGE PASSWORD] Utilisateur non trouvé');
        return res.status(404).json({ 
          success: false,
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        console.warn('⚠️ [SECURE CHANGE PASSWORD] Tentative avec mauvais mot de passe actuel');
        
        // Log de sécurité
        SecurityMiddleware.logSecurityEvent('CHANGE_PASSWORD_INVALID_CURRENT', {
          userId: user._id,
          email: user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({ 
          success: false,
          error: 'Mot de passe actuel incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Vérifier que le nouveau mot de passe est différent de l'ancien
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        console.warn('⚠️ [SECURE CHANGE PASSWORD] Tentative de réutilisation du même mot de passe');
        return res.status(400).json({ 
          success: false,
          error: 'Le nouveau mot de passe doit être différent de l\'ancien',
          code: 'SAME_PASSWORD'
        });
      }

      // Hash du nouveau mot de passe avec salt élevé pour la sécurité
      console.log('🔍 [SECURE CHANGE PASSWORD] Hash du nouveau mot de passe...');
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await User.findByIdAndUpdate(req.user.id, { 
        password: hashedNewPassword 
      });

      console.log('✅ [SECURE CHANGE PASSWORD] Mot de passe changé avec succès');
      
      // Log de sécurité pour changement réussi
      SecurityMiddleware.logSecurityEvent('CHANGE_PASSWORD_SUCCESS', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({ 
        success: true,
        message: 'Mot de passe changé avec succès'
      });

    } catch (err) {
      console.error('❌ [SECURE CHANGE PASSWORD] Erreur:', err);
      res.status(500).json({ 
        success: false,
        error: 'Erreur serveur lors du changement de mot de passe',
        code: 'SERVER_ERROR'
      });
    }
  }
);

module.exports = router;
