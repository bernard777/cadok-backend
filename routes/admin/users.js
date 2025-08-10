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
      .select('pseudo email role isAdmin adminPermissions adminActivatedAt city createdAt')
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
      adminCount,
      moderatorCount,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'moderator' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        moderatorCount,
        regularUsers: totalUsers - adminCount - moderatorCount,
        recentUsers,
        adminPercentage: Math.round((adminCount / totalUsers) * 100 * 10) / 10
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

module.exports = router;
