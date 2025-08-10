/**
 * 🛡️ MIDDLEWARE ADMINISTRATION - CADOK
 * Vérification robuste des droits administrateur
 */

const User = require('../models/User');

/**
 * Vérifie les droits administrateur généraux
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentification requise' 
      });
    }

    // Récupérer les données utilisateur fraîches de la DB
    const user = await User.findById(req.user.id).select('role isAdmin adminPermissions');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    if (!user.isAdmin || !['admin', 'super_admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Droits administrateur requis' 
      });
    }

    // Ajouter les infos admin à la requête
    req.adminUser = user;
    next();

  } catch (error) {
    console.error('❌ Erreur vérification admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Vérifie une permission spécifique
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.adminUser) {
        // Si pas encore vérifié, faire la vérification admin d'abord
        await requireAdmin(req, res, () => {});
        if (!req.adminUser) {
          return; // Erreur déjà envoyée par requireAdmin
        }
      }

      // Super admin a toutes les permissions
      if (req.adminUser.role === 'super_admin') {
        return next();
      }

      // Vérifier la permission spécifique
      if (!req.adminUser.adminPermissions || !req.adminUser.adminPermissions[permission]) {
        return res.status(403).json({ 
          success: false, 
          error: `Permission '${permission}' requise` 
        });
      }

      next();
    } catch (error) {
      console.error('❌ Erreur vérification permission:', error);
      res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
  };
};

/**
 * Vérifie les droits super admin uniquement
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    await requireAdmin(req, res, () => {});
    
    if (!req.adminUser) {
      return; // Erreur déjà envoyée
    }

    if (req.adminUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Droits super administrateur requis' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Erreur vérification super admin:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Middleware combiné pour les événements
 */
const requireEventManagement = requirePermission('manageEvents');

/**
 * Middleware combiné pour la gestion utilisateurs
 */
const requireUserManagement = requirePermission('manageUsers');

/**
 * Log des actions admin
 */
const logAdminAction = (action, getDetails = () => ({})) => {
  return (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Logger l'action après succès
      if (data && data.success && req.adminUser) {
        const logEntry = {
          timestamp: new Date().toISOString(),
          adminId: req.adminUser._id,
          adminPseudo: req.adminUser.pseudo || req.user.pseudo,
          action,
          details: getDetails(req, data),
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };
        
        console.log('🛡️ ADMIN ACTION:', JSON.stringify(logEntry, null, 2));
        
        // En production, sauvegarder en base ou service de logs
        // await AdminLog.create(logEntry);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  requireAdmin,
  requirePermission,
  requireSuperAdmin,
  requireEventManagement,
  requireUserManagement,
  logAdminAction
};
