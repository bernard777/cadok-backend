const express = require('express');
const router = express.Router();
const Advertisement = require('../models/Advertisement');
const Subscription = require('../models/Subscription');
const Object = require('../models/Object');
const auth = require('../middlewares/auth');

// @route   POST /api/advertisements
// @desc    Créer une nouvelle publicité (Premium uniquement)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { objectId, duration } = req.body;
    
    if (!objectId || !duration) {
      return res.status(400).json({ message: 'ObjectId et duration requis' });
    }
    
    // Vérifier que l'utilisateur a un abonnement Premium
    const subscription = await Subscription.findOne({ user: req.user.id });
    if (!subscription || !subscription.isPremium()) {
      return res.status(403).json({ message: 'Abonnement Premium requis' });
    }
    
    // Vérifier que l'objet existe et appartient à l'utilisateur
    const object = await Object.findOne({ _id: objectId, owner: req.user.id });
    if (!object) {
      return res.status(404).json({ message: 'Objet non trouvé' });
    }
    
    // Calculer le prix et la date de fin
    const pricePerDay = 0.5; // 0.5€ par jour
    const price = duration * pricePerDay;
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
    
    const advertisement = new Advertisement({
      user: req.user.id,
      object: objectId,
      duration,
      endDate,
      price,
      priority: 5 // Priorité moyenne pour Premium
    });
    
    await advertisement.save();
    await advertisement.populate('object', 'title description');
    
    res.status(201).json({
      message: 'Publicité créée avec succès',
      advertisement
    });
  } catch (error) {
    console.error('Erreur lors de la création de la publicité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/advertisements/my
// @desc    Obtenir les publicités de l'utilisateur
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const advertisements = await Advertisement.find({ user: req.user.id })
      .populate('object', 'title description imageUrl images')
      .sort({ createdAt: -1 });
    
    res.json(advertisements);
  } catch (error) {
    console.error('Erreur lors de la récupération des publicités:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/advertisements/active
// @desc    Obtenir les publicités actives (pour affichage)
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const advertisements = await Advertisement.find({
      status: 'active',
      endDate: { $gte: new Date() }
    })
      .populate('object', 'title description imageUrl images category')
      .populate('user', 'pseudo')
      .sort({ priority: -1, createdAt: -1 })
      .limit(10);
    
    res.json(advertisements);
  } catch (error) {
    console.error('Erreur lors de la récupération des publicités actives:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/advertisements/:id/stats
// @desc    Mettre à jour les statistiques d'une publicité
// @access  Public
router.put('/:id/stats', async (req, res) => {
  try {
    const { type } = req.body; // 'impression' ou 'click'
    
    if (!['impression', 'click'].includes(type)) {
      return res.status(400).json({ message: 'Type invalide' });
    }
    
    const updateField = type === 'impression' ? 'impressions' : 'clicks';
    
    const advertisement = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );
    
    if (!advertisement) {
      return res.status(404).json({ message: 'Publicité non trouvée' });
    }
    
    res.json({ message: `${type} enregistré` });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/advertisements/:id
// @desc    Supprimer une publicité
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!advertisement) {
      return res.status(404).json({ message: 'Publicité non trouvée' });
    }
    
    await Advertisement.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Publicité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la publicité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
