const Subscription = require('../models/Subscription');

// Middleware pour vérifier l'abonnement Premium
const requirePremium = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription || !subscription.isPremium()) {
      return res.status(403).json({ 
        message: 'Abonnement Premium requis pour cette fonctionnalité',
        currentPlan: subscription ? subscription.plan : 'none',
        upgradeUrl: '/api/subscriptions/plans'
      });
    }
    
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification Premium:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Middleware pour vérifier l'abonnement Basic ou plus
const requireBasicOrHigher = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });
    
    if (!subscription || !subscription.isBasicOrHigher()) {
      return res.status(403).json({ 
        message: 'Abonnement Basic ou Premium requis pour cette fonctionnalité',
        currentPlan: subscription ? subscription.plan : 'none',
        upgradeUrl: '/api/subscriptions/plans'
      });
    }
    
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification Basic:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Middleware pour vérifier les limites d'utilisation
const checkUsageLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      const subscription = await Subscription.findOne({ user: req.user.id });
      
      if (!subscription) {
        return res.status(404).json({ message: 'Abonnement non trouvé' });
      }
      
      const limits = subscription.getLimits();
      
      if (resourceType === 'objects') {
        if (limits.maxObjects !== 'unlimited') {
          const Object = require('../models/Object');
          const currentCount = await Object.countDocuments({ owner: req.user.id });
          
          if (currentCount >= limits.maxObjects) {
            return res.status(403).json({
              message: `Limite d'objets atteinte (${limits.maxObjects})`,
              currentPlan: subscription.plan,
              upgradeUrl: '/api/subscriptions/plans'
            });
          }
        }
      } else if (resourceType === 'trades') {
        if (limits.maxTrades !== 'unlimited') {
          const Trade = require('../models/Trade');
          const currentCount = await Trade.countDocuments({
            $or: [
              { fromUser: req.user.id },
              { toUser: req.user.id }
            ]
          });
          
          if (currentCount >= limits.maxTrades) {
            return res.status(403).json({
              message: `Limite d'échanges atteinte (${limits.maxTrades})`,
              currentPlan: subscription.plan,
              upgradeUrl: '/api/subscriptions/plans'
            });
          }
        }
      }
      
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
};

module.exports = {
  requirePremium,
  requireBasicOrHigher,
  checkUsageLimits
};
