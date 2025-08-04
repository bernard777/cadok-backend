/**
 * 🔐 MIDDLEWARE D'AUTHENTIFICATION
 * Gestion des tokens JWT pour sécuriser les APIs
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification principal
 */
const auth = (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      // En mode développement, on peut bypasser l'auth pour les tests
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Mode développement : Auth bypassée');
        req.user = { 
          id: 'dev-user', 
          firstName: 'Dev', 
          lastName: 'User',
          email: 'dev@cadok.fr'
        };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Extraire le token (format: "Bearer TOKEN")
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Format de token invalide'
      });
    }

    // Vérifier le token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter les infos utilisateur à la requête
    req.user = decoded;
    
    console.log(`✅ Utilisateur authentifié : ${decoded.firstName} ${decoded.lastName}`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification'
    });
  }
};

/**
 * Middleware d'authentification optionnelle
 * Utile pour des routes où l'auth améliore l'expérience mais n'est pas obligatoire
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    console.log(`✅ Utilisateur optionnel authentifié : ${decoded.firstName}`);
    
  } catch (error) {
    console.log('⚠️  Auth optionnelle échouée, on continue sans user');
    req.user = null;
  }
  
  next();
};

/**
 * Middleware pour vérifier le rôle admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès admin requis'
    });
  }
  
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur peut accéder à un troc
 */
const canAccessTrade = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }
    
    const { tradeId } = req.params;
    
    // En mode développement, on autorise tout
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️  Mode dev : Accès troc ${tradeId} autorisé`);
      return next();
    }
    
    // Ici tu peux ajouter la vérification en base de données
    // const trade = await Trade.findById(tradeId);
    // if (!trade || (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Accès non autorisé à ce troc'
    //   });
    // }
    
    next();
    
  } catch (error) {
    console.error('❌ Erreur vérification accès troc:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Génération de token JWT pour les tests
 */
const generateTestToken = (userData = {}) => {
  const defaultUser = {
    id: 'test-user-123',
    firstName: 'Marie',
    lastName: 'Test',
    email: 'marie.test@cadok.fr',
    role: 'user'
  };
  
  const user = { ...defaultUser, ...userData };
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
  
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  auth,
  optionalAuth,
  requireAdmin,
  canAccessTrade,
  generateTestToken
};
