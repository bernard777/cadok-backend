/**
 * Routes d'administration pour la gestion des rôles et permissions
 * Accessible uniquement aux super_admin
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { requireAuth, requirePermission, getAvailableRoles, hasPermission } = require('../../middleware/roleBasedAccess');

// 🎯 GET /api/admin/roles - Liste des rôles disponibles
router.get('/', requireAuth, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const roles = getAvailableRoles();
    
    res.json({
      success: true,
      data: {
        roles,
        currentUserRole: req.user.role,
        currentUserPermissions: req.user.adminPermissions
      }
    });
  } catch (error) {
    console.error('Erreur récupération rôles:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des rôles'
    });
  }
});

// 🎯 GET /api/admin/users/admins - Liste des administrateurs
router.get('/users/admins', requireAuth, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const admins = await User.find({ 
      isAdmin: true,
      status: { $ne: 'banned' }
    }).select('pseudo email role adminPermissions adminActivatedAt adminActivatedBy adminNotes createdAt');
    
    res.json({
      success: true,
      data: {
        admins: admins.map(admin => ({
          id: admin._id,
          pseudo: admin.pseudo,
          email: admin.email,
          role: admin.role,
          permissions: admin.adminPermissions,
          activatedAt: admin.adminActivatedAt,
          activatedBy: admin.adminActivatedBy,
          notes: admin.adminNotes,
          createdAt: admin.createdAt
        })),
        total: admins.length
      }
    });
  } catch (error) {
    console.error('Erreur récupération admins:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des administrateurs'
    });
  }
});

// 🎯 PUT /api/admin/users/:userId/role - Modifier le rôle d'un utilisateur
router.put('/users/:userId/role', requireAuth, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions, notes } = req.body;
    
    // Vérifier que le rôle existe
    const availableRoles = getAvailableRoles().map(r => r.role);
    if (!availableRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rôle non valide',
        availableRoles
      });
    }
    
    // Seuls les super_admin peuvent créer d'autres super_admin
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les super administrateurs peuvent créer d\'autres super administrateurs'
      });
    }
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Empêcher la modification de son propre rôle
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }
    
    // Mise à jour du rôle et des permissions
    const isAdmin = role !== 'user';
    const updateData = {
      role,
      isAdmin,
      adminNotes: notes || targetUser.adminNotes
    };
    
    // Si devient admin pour la première fois
    if (isAdmin && !targetUser.isAdmin) {
      updateData.adminActivatedAt = new Date();
      updateData.adminActivatedBy = req.user._id;
    }
    
    // Réinitialiser les permissions puis appliquer les nouvelles
    if (permissions) {
      updateData.adminPermissions = permissions;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('pseudo email role adminPermissions isAdmin adminActivatedAt');
    
    res.json({
      success: true,
      message: `Rôle de ${targetUser.pseudo} mis à jour vers ${role}`,
      data: {
        user: {
          id: updatedUser._id,
          pseudo: updatedUser.pseudo,
          email: updatedUser.email,
          role: updatedUser.role,
          permissions: updatedUser.adminPermissions,
          isAdmin: updatedUser.isAdmin,
          activatedAt: updatedUser.adminActivatedAt
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur modification rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du rôle'
    });
  }
});

// 🎯 DELETE /api/admin/users/:userId/admin - Révoquer les droits admin
router.delete('/users/:userId/admin', requireAuth, requirePermission('manageAdmins'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Empêcher la révocation de ses propres droits
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas révoquer vos propres droits'
      });
    }
    
    // Seuls les super_admin peuvent révoquer d'autres super_admin
    if (targetUser.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Seuls les super administrateurs peuvent révoquer d\'autres super administrateurs'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        role: 'user',
        isAdmin: false,
        adminPermissions: {
          manageEvents: false,
          createEvents: false,
          moderateEvents: false,
          manageUsers: false,
          banUsers: false,
          viewUserDetails: false,
          manageTrades: false,
          approveTrades: false,
          resolveDisputes: false,
          moderateContent: false,
          deleteReports: false,
          manageReports: false,
          viewAnalytics: false,
          systemConfig: false,
          manageAdmins: false
        },
        adminNotes: (targetUser.adminNotes || '') + `\n[${new Date().toISOString()}] Droits révoqués par ${req.user.pseudo}${reason ? ` - Raison: ${reason}` : ''}`
      },
      { new: true }
    ).select('pseudo email role isAdmin');
    
    res.json({
      success: true,
      message: `Droits administrateur révoqués pour ${targetUser.pseudo}`,
      data: {
        user: {
          id: updatedUser._id,
          pseudo: updatedUser.pseudo,
          email: updatedUser.email,
          role: updatedUser.role,
          isAdmin: updatedUser.isAdmin
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur révocation admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la révocation des droits'
    });
  }
});

// 🎯 GET /api/admin/permissions/check - Vérifier les permissions de l'utilisateur actuel
router.get('/permissions/check', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        userId: user._id,
        pseudo: user.pseudo,
        role: user.role,
        isAdmin: user.isAdmin,
        permissions: user.adminPermissions,
        hasAdminAccess: user.isAdmin,
        hasPremiumAccess: user.isAdmin || user.subscriptionStatus === 'active',
        canAccessAdminPanel: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Erreur vérification permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification des permissions'
    });
  }
});

module.exports = router;
