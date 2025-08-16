/**
 * 🛡️ ROUTES ADMINISTRATION DES UTILISATEURS - CADOK
 * Gestion des rôles et permissions administrateur
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const authMiddleware = require('../../middlewares/auth');

/**
 * 🛡️ Middleware super admin seulement
 */
const superAdminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès super administrateur requis' 
    });
  }
  next();
};

/**
 * 🛡️ Middleware admin minimum
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Accès administrateur requis' 
    });
  }
  next();
};

/**
 * GET /api/admin/users
 * Liste des utilisateurs avec leurs rôles
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    
    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { pseudo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('pseudo email role isAdmin adminPermissions adminActivatedAt city createdAt status verified emailVerified bannedAt bannedUntil banReason suspendedAt suspendedUntil suspendReason')
      .populate('adminActivatedBy', 'pseudo email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit
      }
    });
  } catch (error) {
    console.error('❌ Erreur liste utilisateurs admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/promote
 * Promouvoir un utilisateur (user → moderator → admin)
 */
router.post('/:userId/promote', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions = {}, notes = '' } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rôle invalide' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Permissions par défaut selon le rôle
    const defaultPermissions = {
      user: {
        manageEvents: false,
        manageUsers: false,
        moderateContent: false,
        viewAnalytics: false,
        systemConfig: false
      },
      moderator: {
        manageEvents: false,
        manageUsers: false,
        moderateContent: true,
        viewAnalytics: true,
        systemConfig: false
      },
      admin: {
        manageEvents: true,
        manageUsers: true,
        moderateContent: true,
        viewAnalytics: true,
        systemConfig: true
      }
    };

    const updatedUser = await User.findByIdAndUpdate(userId, {
      role,
      isAdmin: ['admin', 'moderator'].includes(role),
      adminPermissions: { ...defaultPermissions[role], ...permissions },
      adminActivatedAt: new Date(),
      adminActivatedBy: req.user.id,
      adminNotes: notes
    }, { new: true });

    // Log de l'action
    console.log(`🛡️ PROMOTION: ${user.pseudo} (${user.email}) promu ${role} par ${req.user.pseudo}`);

    res.json({
      success: true,
      message: `Utilisateur promu ${role} avec succès`,
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        role: updatedUser.role,
        permissions: updatedUser.adminPermissions
      }
    });
  } catch (error) {
    console.error('❌ Erreur promotion utilisateur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/demote
 * Rétrograder un administrateur
 */
router.post('/:userId/demote', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = '' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Impossible de rétrograder un super admin' 
      });
    }

    await User.findByIdAndUpdate(userId, {
      role: 'user',
      isAdmin: false,
      adminPermissions: {
        manageEvents: false,
        manageUsers: false,
        moderateContent: false,
        viewAnalytics: false,
        systemConfig: false
      },
      adminNotes: `${user.adminNotes}\n[${new Date().toISOString()}] Rétrogradé par ${req.user.pseudo}: ${reason}`
    });

    console.log(`🛡️ DEMOTION: ${user.pseudo} rétrogradé par ${req.user.pseudo} - Raison: ${reason}`);

    res.json({
      success: true,
      message: 'Utilisateur rétrogradé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur rétrogradation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/users/stats
 * Statistiques des utilisateurs et admins
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      suspendedUsers,
      bannedUsers,
      regularUsers,
      moderators,
      admins,
      superAdmins,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'inactive' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ $or: [{ role: 'user' }, { role: { $exists: false } }] }),
      User.countDocuments({ role: 'moderator' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'super_admin' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);

    res.json({
      success: true,
      stats: {
        // Totaux
        totalUsers,
        recentUsers,
        
        // Par statut
        activeUsers,
        pendingUsers,
        inactiveUsers,
        suspendedUsers,
        bannedUsers,
        
        // Par rôle
        regularUsers,
        moderators,
        admins,
        superAdmins,
        
        // Statistiques dérivées
        adminPercentage: Math.round(((moderators + admins + superAdmins) / totalUsers) * 100 * 10) / 10,
        activePercentage: Math.round((activeUsers / totalUsers) * 100 * 10) / 10,
        
        // Métadonnées
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats utilisateurs:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/create-admin
 * Créer un compte administrateur (super admin uniquement)
 */
router.post('/create-admin', authMiddleware, superAdminMiddleware, async (req, res) => {
  try {
    const { email, pseudo, password, role = 'admin', permissions = {} } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Créer le compte admin
    const adminUser = new User({
      email,
      pseudo,
      password, // Sera hashé par le middleware pre-save
      city: 'Admin', // Ville par défaut pour les admins
      role,
      isAdmin: true,
      adminPermissions: {
        manageEvents: true,
        manageUsers: role === 'super_admin',
        moderateContent: true,
        viewAnalytics: true,
        systemConfig: role === 'admin',
        ...permissions
      },
      adminActivatedAt: new Date(),
      adminActivatedBy: req.user.id,
      adminNotes: `Compte admin créé par ${req.user.pseudo}`
    });

    await adminUser.save();

    console.log(`🛡️ ADMIN CREATED: ${pseudo} (${email}) créé par ${req.user.pseudo}`);

    res.json({
      success: true,
      message: 'Compte administrateur créé avec succès',
      admin: {
        id: adminUser._id,
        pseudo: adminUser.pseudo,
        email: adminUser.email,
        role: adminUser.role,
        permissions: adminUser.adminPermissions
      }
    });
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/ban
 * Bannir un utilisateur (suspendre définitivement)
 */
router.post('/:userId/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Violation des conditions d\'utilisation', duration = null } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Empêcher de bannir les admins (sauf pour super admin)
    if (user.isAdmin && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Seuls les super admins peuvent bannir des administrateurs' 
      });
    }

    // Calculer la date d'expiration du ban
    let bannedUntil = null;
    if (duration) {
      const durationMs = duration * 24 * 60 * 60 * 1000; // durée en jours
      bannedUntil = new Date(Date.now() + durationMs);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      status: 'banned',
      bannedAt: new Date(),
      bannedUntil: bannedUntil,
      banReason: reason,
      bannedBy: req.user.id,
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] BANNI par ${req.user.pseudo}: ${reason}${duration ? ` (${duration} jours)` : ' (définitif)'}`
    }, { new: true });

    console.log(`🚫 BAN: ${user.pseudo} banni par ${req.user.pseudo} - Raison: ${reason}${duration ? ` (${duration} jours)` : ' (définitif)'}`);

    res.json({
      success: true,
      message: `Utilisateur banni ${duration ? 'temporairement' : 'définitivement'}`,
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        status: updatedUser.status,
        bannedUntil: updatedUser.bannedUntil,
        banReason: updatedUser.banReason
      }
    });
  } catch (error) {
    console.error('❌ Erreur bannissement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/unban
 * Débannir un utilisateur banni ou désuspendre un utilisateur suspendu
 */
router.post('/:userId/unban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Révision du ban' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    if (user.status !== 'banned' && user.status !== 'suspended') {
      return res.status(400).json({ 
        success: false, 
        error: 'Utilisateur non banni ou suspendu' 
      });
    }

    // Déterminer les champs à nettoyer selon le statut actuel
    const fieldsToReset = {
      status: 'active',
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] DÉBANNI/DÉSUSPENDU par ${req.user.pseudo}: ${reason}`
    };

    if (user.status === 'banned') {
      fieldsToReset.bannedAt = null;
      fieldsToReset.bannedUntil = null;
      fieldsToReset.banReason = null;
      fieldsToReset.bannedBy = null;
    } else if (user.status === 'suspended') {
      fieldsToReset.suspendedAt = null;
      fieldsToReset.suspendedUntil = null;
      fieldsToReset.suspendReason = null;
      fieldsToReset.suspendedBy = null;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, fieldsToReset, { new: true });

    console.log(`✅ UNBAN/UNSUSPEND: ${user.pseudo} ${user.status === 'banned' ? 'débanni' : 'désuspendu'} par ${req.user.pseudo} - Raison: ${reason}`);

    res.json({
      success: true,
      message: user.status === 'banned' ? 'Utilisateur débanni avec succès' : 'Utilisateur désuspendu avec succès',
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('❌ Erreur débannissement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/suspend
 * Suspendre temporairement un utilisateur
 */
router.post('/:userId/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Vérification en cours', duration = 7 } = req.body; // 7 jours par défaut

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    const suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    const updatedUser = await User.findByIdAndUpdate(userId, {
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedUntil: suspendedUntil,
      suspendReason: reason,
      suspendedBy: req.user.id,
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] SUSPENDU par ${req.user.pseudo}: ${reason} (${duration} jours)`
    }, { new: true });

    console.log(`⏸️ SUSPEND: ${user.pseudo} suspendu par ${req.user.pseudo} pour ${duration} jours - Raison: ${reason}`);

    res.json({
      success: true,
      message: `Utilisateur suspendu pour ${duration} jours`,
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        status: updatedUser.status,
        suspendedUntil: updatedUser.suspendedUntil,
        suspendReason: updatedUser.suspendReason
      }
    });
  } catch (error) {
    console.error('❌ Erreur suspension:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/verify
 * Vérifier manuellement un utilisateur (admin)
 */
router.post('/:userId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Vérification manuelle par admin' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Mettre à jour les champs de vérification ET le statut
    const updateFields = {
      verified: true,
      emailVerified: true, // Considéré comme vérifié par admin
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] VÉRIFIÉ MANUELLEMENT par ${req.user.pseudo}: ${reason}`
    };

    // Si le statut est 'pending', le passer à 'active' lors de la vérification
    if (user.status === 'pending') {
      updateFields.status = 'active';
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

    console.log(`✅ VERIFY: ${user.pseudo} vérifié manuellement par ${req.user.pseudo}${user.status === 'pending' ? ' et activé' : ''}`);

    res.json({
      success: true,
      message: 'Utilisateur vérifié avec succès',
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        verified: updatedUser.verified,
        emailVerified: updatedUser.emailVerified,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification manuelle:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/activate
 * Activer un compte en attente (pending → active)
 */
router.post('/:userId/activate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Seuls les comptes en attente peuvent être activés'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      status: 'active',
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] ACTIVÉ par ${req.user.pseudo}`
    }, { new: true });

    console.log(`✅ ACTIVATE: ${user.pseudo} activé par ${req.user.pseudo}`);

    res.json({
      success: true,
      message: 'Compte activé avec succès',
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('❌ Erreur activation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/users/:userId/reactivate
 * Réactiver un compte inactif (inactive → active)
 */
router.post('/:userId/reactivate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    if (user.status !== 'inactive') {
      return res.status(400).json({
        success: false,
        error: 'Seuls les comptes inactifs peuvent être réactivés'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      status: 'active',
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] RÉACTIVÉ par ${req.user.pseudo}`
    }, { new: true });

    console.log(`🔄 REACTIVATE: ${user.pseudo} réactivé par ${req.user.pseudo}`);

    res.json({
      success: true,
      message: 'Compte réactivé avec succès',
      user: {
        id: updatedUser._id,
        pseudo: updatedUser.pseudo,
        email: updatedUser.email,
        status: updatedUser.status
      }
    });
  } catch (error) {
    console.error('❌ Erreur réactivation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * 🔧 GET /api/admin/users/verification-code/:email
 * Récupère le code de vérification d'un utilisateur spécifique
 * UNIQUEMENT pour les tests et le développement
 */
router.get('/verification-code/:email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Sécurité: Seulement en mode développement
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'Route disponible uniquement en développement' 
      });
    }

    const { email } = req.params;
    console.log(`🔧 [DEV] Recherche code pour: ${email}`);

    const user = await User.findOne({ email }).select('pseudo email emailVerificationToken phoneVerificationCode emailVerificationExpires phoneVerificationExpires emailVerified phoneVerified');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const emailCode = user.emailVerificationToken ? user.emailVerificationToken.slice(-6) : null;
    const phoneCode = user.phoneVerificationCode;

    console.log(`🔧 [DEV] Code email pour ${user.pseudo}: ${emailCode}`);
    console.log(`🔧 [DEV] Code phone pour ${user.pseudo}: ${phoneCode}`);

    res.json({
      success: true,
      data: {
        pseudo: user.pseudo,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        codes: {
          email: emailCode,
          emailExpires: user.emailVerificationExpires,
          phone: phoneCode,
          phoneExpires: user.phoneVerificationExpires
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération code utilisateur:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * 🔧 GET /api/admin/users/verification-codes
 * Récupère les codes de vérification en mode développement
 * UNIQUEMENT pour les tests et le développement
 */
router.get('/verification-codes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Sécurité: Seulement en mode développement
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'Route disponible uniquement en développement' 
      });
    }

    console.log('🔧 [DEV] Récupération des codes de vérification...');

    // Récupérer tous les utilisateurs avec des codes de vérification en attente
    const usersWithCodes = await User.find({
      $or: [
        { emailVerificationToken: { $ne: null, $exists: true } },
        { phoneVerificationCode: { $ne: null, $exists: true } }
      ]
    }).select('pseudo email phoneNumber emailVerificationToken phoneVerificationCode emailVerificationExpires phoneVerificationExpires emailVerified phoneVerified');

    const verificationCodes = usersWithCodes.map(user => {
      const emailCode = user.emailVerificationToken ? user.emailVerificationToken.slice(-6) : null;
      const phoneCode = user.phoneVerificationCode;
      
      return {
        pseudo: user.pseudo,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        codes: {
          email: emailCode,
          emailExpires: user.emailVerificationExpires,
          phone: phoneCode,
          phoneExpires: user.phoneVerificationExpires
        }
      };
    });

    console.log(`🔧 [DEV] ${verificationCodes.length} utilisateurs avec codes trouvés`);

    res.json({
      success: true,
      message: 'Codes de vérification récupérés (mode développement)',
      data: verificationCodes,
      count: verificationCodes.length
    });

  } catch (error) {
    console.error('❌ Erreur récupération codes:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
