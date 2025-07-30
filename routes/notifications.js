const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middlewares/auth'); // Assuming you have auth middleware

// GET /notifications - Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('trade', 'status requestedObjects offeredObjects')
      .sort({ createdAt: -1 })
      .limit(50); // Limiter à 50 notifications récentes
    
    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des notifications' });
  }
});

// PATCH /notifications/:id/read - Marquer une notification comme lue
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ message: 'Erreur serveur lors du marquage comme lu' });
  }
});

// PATCH /notifications/mark-all-read - Marquer toutes les notifications comme lues
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors du marquage global comme lu:', error);
    res.status(500).json({ message: 'Erreur serveur lors du marquage global comme lu' });
  }
});

// GET /notifications/unread-count - Compter les notifications non lues
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id, 
      isRead: false 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    res.status(500).json({ message: 'Erreur serveur lors du comptage' });
  }
});

// DELETE /notifications/:id - Supprimer une notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
});

// Fonction utilitaire pour créer une notification
const createNotification = async (userId, message, type, tradeId = null) => {
  try {
    const notification = new Notification({
      user: userId,
      message,
      type,
      trade: tradeId,
      isRead: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

module.exports = router;
module.exports.createNotification = createNotification;
