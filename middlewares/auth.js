const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Accès refusé' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Assurer que req.user.id est défini (gérer les différents formats de JWT)
    req.user = {
      id: verified.id || verified.userId || verified._id,
      ...verified
    };
    
    next();
  } catch (err) {
    console.error('❌ [AUTH] Erreur token:', err.message);
    res.status(400).json({ message: 'Token invalide' });
  }
}

module.exports = auth;
