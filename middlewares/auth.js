const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Accès refusé' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Assurer que req.user.id est défini (gérer les différents formats de JWT)
    const userId = verified.id || verified.userId || verified._id;
    
    // Vérifier si l'utilisateur existe encore et son statut
    const user = await User.findById(userId).select('status bannedUntil bannedAt deactivatedAt');
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'utilisateur est banni
    if (user.status === 'banned') {
      // Ban temporaire et expiré ?
      if (user.bannedUntil && new Date() > user.bannedUntil) {
        // Débannir automatiquement
        await User.findByIdAndUpdate(userId, {
          status: 'active',
          bannedAt: null,
          bannedUntil: null,
          banReason: null
        });
        console.log(`✅ [AUTH] Ban expiré, utilisateur ${userId} automatiquement débanni`);
      } else {
        // Ban encore actif
        console.log(`🚫 [AUTH] Utilisateur banni tentant d'accéder à l'API: ${userId}`);
        return res.status(403).json({ 
          message: 'Votre compte est suspendu. Contactez l\'administration.',
          code: 'ACCOUNT_BANNED'
        });
      }
    }
    
    // Permettre l'accès aux utilisateurs inactifs pour les endpoints de suppression/désactivation
    const isAccountManagement = req.path.includes('/me/account');
    if (user.status === 'inactive' && !isAccountManagement) {
      return res.status(403).json({ 
        message: 'Votre compte est désactivé. Reconnectez-vous pour le réactiver.',
        code: 'ACCOUNT_INACTIVE'
      });
    }
    
    req.user = {
      id: userId,
      userId: userId,
      ...verified,
      status: user.status
    };
    
    next();
  } catch (err) {
    console.error('❌ [AUTH] Erreur token:', err.message);
    res.status(401).json({ message: 'Token invalide' });
  }
}

module.exports = auth;
