/**
 * 🔐 MIDDLEWARE D'AUTHENTIFICATION OPTIONNELLE
 * Ajoute les infos utilisateur si token présent, sinon continue
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Pas de token, continuer sans utilisateur
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      // Token invalide ou utilisateur inexistant, continuer sans utilisateur
      req.user = null;
      return next();
    }

    // Utilisateur trouvé, l'ajouter à la requête
    req.user = user;
    next();

  } catch (error) {
    // Erreur de token, continuer sans utilisateur
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
