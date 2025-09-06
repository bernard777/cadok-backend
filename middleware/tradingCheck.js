/**
 * 🔄 MIDDLEWARE DE CONTRÔLE DU TRADING
 * Vérifie les paramètres et limites de trading
 */

const Settings = require('../models/Settings');

const tradingCheck = async (req, res, next) => {
  try {
    // Récupérer les paramètres de trading
    const settings = await Settings.findOne().select('trading features');
    
    if (!settings) {
      return next(); // Si pas de paramètres, autoriser
    }
    
    // Vérifier si le trading est activé globalement
    if (settings.features && !settings.features.tradingEnabled) {
      console.log('🚫 [TRADING] Trading désactivé globalement');
      return res.status(403).json({
        success: false,
        error: 'Trading désactivé',
        message: 'Le système d\'échanges est temporairement désactivé.',
        tradingEnabled: false
      });
    }
    
    // Vérifier si le trading est activé dans les paramètres détaillés
    if (settings.trading && !settings.trading.enabled) {
      console.log('🚫 [TRADING] Trading désactivé dans les paramètres');
      return res.status(403).json({
        success: false,
        error: 'Trading désactivé',
        message: 'Le système d\'échanges est temporairement désactivé.',
        tradingEnabled: false
      });
    }
    
    // Vérifier les heures de trading si activées
    if (settings.trading && settings.trading.tradingHours && settings.trading.tradingHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const startTime = settings.trading.tradingHours.start;
      const endTime = settings.trading.tradingHours.end;
      
      if (currentTime < startTime || currentTime > endTime) {
        console.log(`🚫 [TRADING] Hors heures de trading: ${currentTime} (${startTime}-${endTime})`);
        return res.status(403).json({
          success: false,
          error: 'Hors heures de trading',
          message: `Les échanges sont autorisés entre ${startTime} et ${endTime}.`,
          tradingHours: {
            enabled: true,
            start: startTime,
            end: endTime,
            currentTime
          }
        });
      }
    }
    
    // Ajouter les paramètres à la requête
    req.tradingSettings = settings.trading;
    
    next();
    
  } catch (error) {
    console.error('❌ [TRADING] Erreur middleware:', error);
    // En cas d'erreur, laisser passer
    next();
  }
};

module.exports = tradingCheck;
