const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Trade = require('../models/Trade');
const auth = require('../middlewares/auth');

// Utilitaire pour générer une URL complète pour l'avatar
function getFullUrl(req, relativePath) {
  if (!relativePath) return '';
  const host = req.protocol + '://' + req.get('host');
  return relativePath.startsWith('/') ? host + relativePath : host + '/' + relativePath;
}

// GET /conversations - Récupérer toutes les conversations de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    // Récupérer tous les trades auxquels l'utilisateur participe
    const trades = await Trade.find({
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]
    })
    .populate([
      { path: 'fromUser', select: 'pseudo city avatar' },
      { path: 'toUser', select: 'pseudo city avatar' },
      { path: 'requestedObjects', select: 'title category imageUrl images' },
      { path: 'offeredObjects', select: 'title category imageUrl images' }
    ])
    .sort({ updatedAt: -1 });

    const conversations = [];

    for (const trade of trades) {
      // Récupérer le dernier message pour ce trade
      const lastMessage = await Message.findOne({ trade: trade._id })
        .populate('from', 'pseudo avatar')
        .sort({ createdAt: -1 });

      // Compter les messages non lus (messages des autres utilisateurs non lus)
      const unreadCount = await Message.countDocuments({
        trade: trade._id,
        from: { $ne: req.user.id },
        read: false
      });

      // Convertir les avatars en URLs complets
      if (trade.fromUser && trade.fromUser.avatar)
        trade.fromUser.avatar = getFullUrl(req, trade.fromUser.avatar);
      if (trade.toUser && trade.toUser.avatar)
        trade.toUser.avatar = getFullUrl(req, trade.toUser.avatar);
      if (lastMessage && lastMessage.from && lastMessage.from.avatar)
        lastMessage.from.avatar = getFullUrl(req, lastMessage.from.avatar);

      const conversation = {
        trade: {
          _id: trade._id,
          status: trade.status,
          requester: trade.fromUser,
          owner: trade.toUser,
          requestedObjects: trade.requestedObjects,
          offeredObjects: trade.offeredObjects,
          createdAt: trade.createdAt,
          updatedAt: trade.updatedAt
        },
        lastMessage: lastMessage ? {
          _id: lastMessage._id,
          content: lastMessage.content,
          from: lastMessage.from._id,
          createdAt: lastMessage.createdAt,
          avatar: lastMessage.from.avatar // Ajout de l'avatar complet
        } : null,
        hasUnreadMessages: unreadCount > 0,
        unreadCount: unreadCount
      };

      conversations.push(conversation);
    }

    // Trier par dernier message ou date de création du trade
    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.trade.createdAt);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.trade.createdAt);
      return dateB - dateA;
    });

    res.json(conversations);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des conversations' });
  }
});

// GET /:tradeId/messages - Récupérer les messages d'une conversation
router.get('/:tradeId/messages', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;

    // Vérifier que l'utilisateur fait partie de ce trade
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade introuvable' });
    }

    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
    }

    // Récupérer tous les messages de ce trade
    const messages = await Message.find({ trade: tradeId })
      .populate('from', 'pseudo avatar')
      .sort({ createdAt: 1 }); // Du plus ancien au plus récent

    const messagesWithFullAvatar = messages.map(msg => {
      if (msg.from && msg.from.avatar)
        msg.from.avatar = getFullUrl(req, msg.from.avatar);
      return msg;
    });

    res.json(messagesWithFullAvatar);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des messages' });
  }
});

// POST /:tradeId/messages - Envoyer un message
router.post('/:tradeId/messages', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le contenu du message ne peut pas être vide' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Le message ne peut pas dépasser 1000 caractères' });
    }

    // Vérifier que l'utilisateur fait partie de ce trade
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade introuvable' });
    }

    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
    }

    // Créer le message
    const message = new Message({
      trade: tradeId,
      from: req.user.id,
      content: content.trim()
    });

    await message.save();

    // Mettre à jour la date de modification du trade
    trade.updatedAt = new Date();
    await trade.save();

    // Populer le message avant de le renvoyer
    await message.populate('from', 'pseudo avatar');

    // Créer une notification pour l'autre utilisateur
    const Notification = require('../models/Notification');
    const otherUserId = trade.fromUser.toString() === req.user.id ? trade.toUser : trade.fromUser;
    
    await Notification.create({
      user: otherUserId,
      message: `Nouveau message de ${req.user.pseudo} dans votre conversation`,
      type: 'message',
      trade: tradeId
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'envoi du message' });
  }
});

// PATCH /:tradeId/read - Marquer tous les messages d'une conversation comme lus
router.patch('/:tradeId/read', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;

    // Vérifier que l'utilisateur fait partie de ce trade
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Trade introuvable' });
    }

    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
    }

    // Marquer tous les messages non lus de ce trade (envoyés par les autres) comme lus
    await Message.updateMany(
      {
        trade: tradeId,
        from: { $ne: req.user.id },
        read: false
      },
      {
        read: true
      }
    );

    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({ message: 'Erreur serveur lors du marquage comme lu' });
  }
});

module.exports = router;
