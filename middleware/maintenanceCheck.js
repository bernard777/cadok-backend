/**
 * 🔧 MIDDLEWARE DE MAINTENANCE
 * Vérifie si le mode maintenance est activé
 */

const Settings = require('../models/Settings');

const maintenanceCheck = async (req, res, next) => {
  try {
    // Exemptions pour les routes d'administration et de connexion
    const exemptRoutes = [
      '/api/auth/login',
      '/api/admin/',
      '/api/health'
    ];
    
    // Vérifier si la route est exemptée
    const isExempt = exemptRoutes.some(route => req.path.startsWith(route));
    if (isExempt) {
      return next();
    }
    
    // Récupérer les paramètres de maintenance
    const settings = await Settings.findOne().select('maintenance');
    
    if (settings && settings.maintenance && settings.maintenance.enabled) {
      console.log('🚫 [MAINTENANCE] Accès bloqué - Mode maintenance actif');
      
      return res.status(503).json({
        success: false,
        error: 'Maintenance en cours',
        message: settings.maintenance.message,
        maintenanceMode: true,
        scheduledEnd: settings.maintenance.scheduledEnd,
        activatedBy: settings.maintenance.activatedBy,
        activatedAt: settings.maintenance.activatedAt
      });
    }
    
    next();
    
  } catch (error) {
    console.error('❌ [MAINTENANCE] Erreur middleware:', error);
    // En cas d'erreur, laisser passer pour éviter de bloquer l'application
    next();
  }
};

module.exports = maintenanceCheck;
