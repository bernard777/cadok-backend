/**
 * Middleware de contrôle d'accès basé sur les rôles (RBAC)
 * Gestion granulaire des permissions d'administration
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🎯 DÉFINITION DES RÔLES ET PERMISSIONS
const ROLE_PERMISSIONS = {
  // Utilisateur normal - accès basique
  user: {
    label: 'Utilisateur',
    permissions: [],
    description: 'Utilisateur standard avec accès aux fonctionnalités de base'
  },
  
  // Modérateur - modération de contenu seulement
  moderator: {
    label: 'Modérateur',
    permissions: ['moderateContent', 'manageReports',
                  'viewObjects', 'viewReviews', 'moderateReviews'],
    description: 'Modération de contenu et gestion des signalements',
    premiumAccess: true
  },
  
  // Admin Événements - gestion événements uniquement
  admin_events: {
    label: 'Admin Événements',
    permissions: ['manageEvents', 'createEvents', 'moderateEvents'],
    description: 'Administration des événements et activités communautaires',
    premiumAccess: true
  },
  
  // Admin Utilisateurs - gestion utilisateurs uniquement  
  admin_users: {
    label: 'Admin Utilisateurs',
    permissions: ['manageUsers', 'banUsers', 'viewUserDetails'],
    description: 'Administration des comptes utilisateurs',
    premiumAccess: true
  },
  
  // Admin Échanges - gestion des trades uniquement
  admin_trades: {
    label: 'Admin Échanges',
    permissions: ['manageTrades', 'approveTrades', 'resolveDisputes'],
    description: 'Administration des échanges et résolution des litiges',
    premiumAccess: true
  },
  
  // Admin Contenu - modération avancée
  admin_content: {
    label: 'Admin Contenu',
    permissions: ['moderateContent', 'deleteReports', 'manageReports', 'viewAnalytics'],
    description: 'Administration du contenu et analytics',
    premiumAccess: true
  },
  
  // Super Admin - accès complet
  super_admin: {
    label: 'Super Administrateur',
    permissions: ['*',
      'manageObjects', 'viewObjects', 'moderateObjects', 'manageReviews', 'viewReviews', 'moderateReviews'], // Toutes les permissions
    description: 'Administration complète du système',
    premiumAccess: true
  }
};

// 🛡️ MIDDLEWARE D'AUTHENTIFICATION ADMIN
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token d\'authentification requis',
        code: 'NO_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        error: 'Utilisateur non trouvé ou inactif',
        code: 'INVALID_USER'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }
};

// 🎯 MIDDLEWARE DE VÉRIFICATION DES PERMISSIONS
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentification requise',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      // Vérifier si c'est un admin
      if (!user.isAdmin) {
        return res.status(403).json({ 
          success: false,
          error: 'Accès administrateur requis',
          code: 'NOT_ADMIN'
        });
      }
      
      // Super admin a accès à tout
      if (user.role === 'super_admin') {
        return next();
      }
      
      // Vérifier les permissions spécifiques
      const userRolePermissions = ROLE_PERMISSIONS[user.role];
      
      if (!userRolePermissions) {
        return res.status(403).json({ 
          success: false,
          error: 'Rôle non reconnu',
          code: 'INVALID_ROLE'
        });
      }
      
      // Vérifier si l'utilisateur a la permission requise
      const hasPermission = userRolePermissions.permissions.includes(requiredPermission) ||
                           userRolePermissions.permissions.includes('*') ||
                           user.adminPermissions[requiredPermission] === true;
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          error: `Permission manquante: ${requiredPermission}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredPermission,
          userRole: user.role
        });
      }
      
      next();
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erreur interne de vérification des permissions',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

// 🔐 MIDDLEWARE POUR ACCÈS PREMIUM AUTOMATIQUE DES ADMINS
const grantAdminPremiumAccess = (req, res, next) => {
  const user = req.user;
  
  if (user && user.isAdmin) {
    const userRolePermissions = ROLE_PERMISSIONS[user.role];
    
    // Les admins ont automatiquement accès premium
    if (userRolePermissions && userRolePermissions.premiumAccess) {
      req.user.hasAdminPremiumAccess = true;
    }
  }
  
  next();
};

// 🎯 HELPER - Vérifier si un utilisateur a une permission
const hasPermission = (user, permission) => {
  if (!user || !user.isAdmin) return false;
  if (user.role === 'super_admin') return true;
  
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (!rolePermissions) return false;
  
  return rolePermissions.permissions.includes(permission) ||
         rolePermissions.permissions.includes('*') ||
         user.adminPermissions[permission] === true;
};

// 🎯 HELPER - Obtenir les permissions d'un utilisateur
const getUserPermissions = (user) => {
  if (!user || !user.isAdmin) return [];
  if (user.role === 'super_admin') return ['*'];
  
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (!rolePermissions) return [];
  
  return rolePermissions.permissions;
};

// 🎯 HELPER - Obtenir les rôles disponibles
const getAvailableRoles = () => {
  return Object.keys(ROLE_PERMISSIONS).map(role => ({
    role,
    ...ROLE_PERMISSIONS[role]
  }));
};

module.exports = {
  requireAuth,
  requirePermission,
  grantAdminPremiumAccess,
  hasPermission,
  getUserPermissions,
  getAvailableRoles,
  ROLE_PERMISSIONS
};
