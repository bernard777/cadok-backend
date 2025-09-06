/**
 * 👥 MIDDLEWARE DE CONTRÔLE DES INSCRIPTIONS
 * Vérifie les limites et paramètres d'inscription
 */

const Settings = require('../models/Settings');
const User = require('../models/User');

const registrationCheck = async (req, res, next) => {
  try {
    // Récupérer les paramètres d'inscription
    const settings = await Settings.findOne().select('registration features');
    
    if (!settings) {
      return next(); // Si pas de paramètres, autoriser
    }
    
    // Vérifier si les inscriptions sont activées (feature flag)
    if (settings.features && !settings.features.registrationEnabled) {
      console.log('🚫 [REGISTRATION] Inscriptions désactivées globalement');
      return res.status(403).json({
        success: false,
        error: 'Inscriptions fermées',
        message: 'Les nouvelles inscriptions sont temporairement fermées.',
        registrationEnabled: false
      });
    }
    
    // Vérifier si les inscriptions sont activées (paramètre détaillé)
    if (settings.registration && !settings.registration.enabled) {
      console.log('🚫 [REGISTRATION] Inscriptions désactivées dans les paramètres');
      return res.status(403).json({
        success: false,
        error: 'Inscriptions fermées',
        message: 'Les nouvelles inscriptions sont temporairement fermées.',
        registrationEnabled: false
      });
    }
    
    // Vérifier la limite quotidienne
    if (settings.registration && settings.registration.maxUsersPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const usersToday = await User.countDocuments({
        createdAt: { $gte: today }
      });
      
      if (usersToday >= settings.registration.maxUsersPerDay) {
        console.log(`🚫 [REGISTRATION] Limite quotidienne atteinte: ${usersToday}/${settings.registration.maxUsersPerDay}`);
        return res.status(429).json({
          success: false,
          error: 'Limite quotidienne atteinte',
          message: `Limite de ${settings.registration.maxUsersPerDay} inscriptions par jour atteinte. Réessayez demain.`,
          limitReached: true,
          maxUsersPerDay: settings.registration.maxUsersPerDay,
          usersToday
        });
      }
    }
    
    // Ajouter les paramètres à la requête pour utilisation ultérieure
    req.registrationSettings = settings.registration;
    
    next();
    
  } catch (error) {
    console.error('❌ [REGISTRATION] Erreur middleware:', error);
    // En cas d'erreur, laisser passer pour éviter de bloquer complètement
    next();
  }
};

module.exports = registrationCheck;
