const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const sanitizeHtml = require('sanitize-html');

// Utilitaire pour générer une URL complète pour l'avatar
function getFullUrl(req, relativePath) {
  if (!relativePath) return '';
  const host = req.protocol + '://' + req.get('host');
  return relativePath.startsWith('/') ? host + relativePath : host + '/' + relativePath;
}

// ENUMS
const TRADE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REFUSED: 'refused',
  PROPOSED: 'proposed'
};
const OBJECT_STATUS = {
  AVAILABLE: 'available',
  TRADED: 'traded',
  PENDING: 'pending',
  RESERVED: 'reserved'
};
const NOTIFICATION_TYPE = {
  TRADE_REQUEST: "trade_request",
  TRADE_PROPOSED: "trade_proposed",
  TRADE_ACCEPTED: "trade_accepted",
  TRADE_REFUSED: "trade_refused",
  TRADE_RETRY: "trade_retry"
};

// ========== PROPOSER UN ÉCHANGE ==========
router.post('/', auth, async (req, res) => {
  try {
    const { requestedObjects } = req.body; // tableau d'IDs d'objets
    if (!Array.isArray(requestedObjects) || requestedObjects.length === 0) {
      return res.status(400).json({ message: 'Vous devez sélectionner au moins un objet.' });
    }

    // Vérifie que tous les objets existent et appartiennent au même utilisateur (utilisateur 2)
    const objects = await ObjectModel.find({ _id: { $in: requestedObjects } });
    if (objects.length !== requestedObjects.length) {
      return res.status(404).json({ message: 'Un ou plusieurs objets demandés sont introuvables.' });
    }
    const ownerId = objects[0].owner.toString();
    if (!objects.every(obj => obj.owner.toString() === ownerId)) {
      return res.status(400).json({ message: 'Tous les objets doivent appartenir au même utilisateur.' });
    }
    if (ownerId === req.user.id) {
      return res.status(400).json({ message: 'Impossible de troquer avec soi-même.' });
    }

    const newTrade = new Trade({
      fromUser: req.user.id,
      toUser: ownerId,
      requestedObjects,
      status: TRADE_STATUS.PENDING
    });

    const saved = await newTrade.save();

    // Notification pour l'utilisateur 2
    await Notification.create({
      user: ownerId,
      message: "Vous avez reçu une nouvelle demande de troc sur plusieurs objets.",
      type: NOTIFICATION_TYPE.TRADE_REQUEST,
      trade: saved._id
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== LISTER SES ÉCHANGES ==========
router.get('/', auth, async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]
    })
      .populate([
        { path: 'offeredObjects' },
        { path: 'requestedObjects' },
        { path: 'fromUser', select: 'pseudo city' },
        { path: 'toUser', select: 'pseudo city' }
      ]);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== RÉCUPÉRER LES DÉTAILS D'UN ÉCHANGE ==========
router.get('/:id', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate([
        { path: 'offeredObjects', populate: { path: 'owner', select: 'pseudo city avatar' } },
        { path: 'requestedObjects', populate: { path: 'owner', select: 'pseudo city avatar' } },
        { path: 'fromUser', select: 'pseudo city avatar' },
        { path: 'toUser', select: 'pseudo city avatar' }
      ]);

    if (!trade) {
      return res.status(404).json({ message: 'Échange introuvable' });
    }

    // Vérifier que l'utilisateur a accès à ce trade
    if (trade.fromUser._id.toString() !== req.user.id && trade.toUser._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à cet échange' });
    }

    // Convertir les avatars en URLs complètes
    if (trade.fromUser && trade.fromUser.avatar) {
      trade.fromUser.avatar = getFullUrl(req, trade.fromUser.avatar);
    }
    if (trade.toUser && trade.toUser.avatar) {
      trade.toUser.avatar = getFullUrl(req, trade.toUser.avatar);
    }

    // Adapter la structure pour correspondre à ce qu'attend le frontend
    const adaptedTrade = {
      _id: trade._id,
      status: trade.status,
      message: trade.message,
      createdAt: trade.createdAt,
      acceptedAt: trade.acceptedAt,
      refusedAt: trade.refusedAt,
      requester: trade.fromUser, // Garde l'objet complet avec pseudo, city, avatar
      owner: trade.toUser,       // Garde l'objet complet avec pseudo, city, avatar
      requestedObjects: trade.requestedObjects,
      offeredObjects: trade.offeredObjects,
      deliveryMethod: trade.deliveryMethod,
      deliveryCost: trade.deliveryCost
    };

    res.json(adaptedTrade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== LISTER SES NOTIFICATIONS ==========
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort('-createdAt');
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ACCEPTER UNE PROPOSITION ==========
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    console.log('🔧 [DEBUG] Accept trade - User:', req.user.id);
    console.log('🔧 [DEBUG] Accept trade - fromUser:', trade.fromUser.toString());
    console.log('🔧 [DEBUG] Accept trade - toUser:', trade.toUser.toString());
    console.log('🔧 [DEBUG] Accept trade - status:', trade.status);

    // Vérif: seul le demandeur initial (fromUser/User 1) peut accepter la proposition
    if (trade.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to accept this trade.' });
    }

    if (trade.status !== TRADE_STATUS.PROPOSED) {
      return res.status(400).json({ message: 'Trade must be in proposed state to accept.' });
    }

    if (!trade.offeredObjects || trade.offeredObjects.length === 0) {
      return res.status(400).json({ message: 'No offered objects to accept.' });
    }

    // Vérif: objets toujours disponibles
    const offeredObjects = await ObjectModel.find({ _id: { $in: trade.offeredObjects } });
    const requestedObjects = await ObjectModel.find({ _id: { $in: trade.requestedObjects } });

    if (
      offeredObjects.length !== (Array.isArray(trade.offeredObjects) ? trade.offeredObjects.length : 0) ||
      requestedObjects.length !== (Array.isArray(trade.requestedObjects) ? trade.requestedObjects.length : 0)
    ) {
      return res.status(404).json({ message: 'One or more objects not found.' });
    }
    if (
      !offeredObjects.every(obj => obj.status === OBJECT_STATUS.AVAILABLE) ||
      !requestedObjects.every(obj => obj.status === OBJECT_STATUS.AVAILABLE)
    ) {
      return res.status(400).json({ message: 'One or more objects are no longer available.' });
    }

    // Valider le trade et MAJ objets
    trade.status = TRADE_STATUS.ACCEPTED;
    await trade.save();

    for (const obj of offeredObjects) {
      obj.status = OBJECT_STATUS.TRADED;
      await obj.save();
    }
    for (const obj of requestedObjects) {
      obj.status = OBJECT_STATUS.TRADED;
      await obj.save();
    }

    // Notification pour l'utilisateur 2 (propriétaire initial)
    await Notification.create({
      user: trade.toUser,
      message: "Votre proposition de troc a été acceptée.",
      type: NOTIFICATION_TYPE.TRADE_ACCEPTED,
      trade: trade._id
    });

    res.json({ message: 'Trade accepted.', trade });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ========== REFUSER UNE DEMANDE DE TROC ==========
router.put('/:id/refuse', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });
    
    // Seul le destinataire peut refuser
    if (trade.toUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'Vous ne pouvez refuser que les trocs qui vous sont destinés.' });

    if (trade.status !== TRADE_STATUS.PENDING)
      return res.status(400).json({ message: 'Ce troc ne peut plus être refusé.' });

    trade.status = TRADE_STATUS.REFUSED;
    await trade.save();

    // Notification pour User 1 (celui qui avait fait la demande)
    await Notification.create({
      user: trade.fromUser,
      message: "Votre demande de troc a été refusée.",
      type: NOTIFICATION_TYPE.TRADE_REFUSED,
      trade: trade._id
    });

    res.json({ message: 'Demande de troc refusée.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== PROPOSER UN OBJET À L'ÉCHANGE ==========
router.put('/:id/propose', auth, async (req, res) => {
  try {
    const { offeredObjects } = req.body;
    const trade = await Trade.findById(req.params.id);
    if (!trade || trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed." });
    }
    if (trade.status !== TRADE_STATUS.PENDING) {
      return res.status(400).json({ message: "Ce troc n'est pas en attente de proposition." });
    }
    if (!Array.isArray(offeredObjects) || offeredObjects.length !== trade.requestedObjects.length) {
      return res.status(400).json({ message: "Vous devez sélectionner exactement " + trade.requestedObjects.length + " objets à offrir en échange." });
    }

    const objects = await ObjectModel.find({ _id: { $in: offeredObjects }, owner: trade.fromUser });
    if (objects.length !== offeredObjects.length) {
      return res.status(400).json({ message: "Un ou plusieurs objets offerts sont invalides." });
    }
    if (!objects.every(obj => obj.status === OBJECT_STATUS.AVAILABLE)) {
      return res.status(400).json({ message: "Un ou plusieurs objets ne sont pas disponibles." });
    }

    trade.offeredObjects = offeredObjects;
    trade.status = TRADE_STATUS.PROPOSED;
    await trade.save();

    // Notification pour l'utilisateur 1
    await Notification.create({
      user: trade.fromUser,
      message: "Une contre-proposition de troc a été faite.",
      type: NOTIFICATION_TYPE.TRADE_PROPOSED,
      trade: trade._id
    });

    res.json(trade);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== VALIDATION FINALE PAR L'INITIATEUR ==========
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    // Seul l'initiateur peut confirmer
    if (trade.fromUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to confirm this trade.' });

    // Vérif: offeredObjects doit être présent
    if (!trade.offeredObjects || !Array.isArray(trade.offeredObjects) || trade.offeredObjects.length === 0)
      return res.status(400).json({ message: 'No offered objects selected yet.' });

    // Vérif objets toujours disponibles
    const offered = await ObjectModel.find({ _id: { $in: trade.offeredObjects } });
    const requested = await ObjectModel.find({ _id: { $in: trade.requestedObjects } });

    // Vérif: les longueurs des tableaux doivent correspondre
    if (offered.length !== trade.offeredObjects.length || requested.length !== trade.requestedObjects.length)
      return res.status(404).json({ message: 'Object(s) not found.' });

    if (trade.status !== TRADE_STATUS.PROPOSED)
      return res.status(400).json({ message: 'Trade is not in proposed state.' });

    if (
      !offered.every(obj => obj.status === OBJECT_STATUS.AVAILABLE) ||
      !requested.every(obj => obj.status === OBJECT_STATUS.AVAILABLE)
    ) {
      return res.status(400).json({ message: 'One or more objects are no longer available.' });
    }

    // Valider le trade et MAJ objets
    trade.status = TRADE_STATUS.ACCEPTED;
    offered.forEach(obj => obj.status = OBJECT_STATUS.TRADED);
    requested.forEach(obj => obj.status = OBJECT_STATUS.TRADED);
    await Promise.all([...offered, ...requested].map(obj => obj.save()));
    await trade.save();

    await Notification.create({
      user: trade.toUser,
      message: "Votre proposition de troc a été acceptée.",
      type: NOTIFICATION_TYPE.TRADE_ACCEPTED,
      trade: trade._id
    });

    res.json({ message: 'Trade confirmed and accepted.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== REFUS FINAL PAR L'INITIATEUR ==========
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    // Seul l'initiateur peut annuler sa demande
    if (trade.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez annuler que vos propres demandes de troc.' });
    }

    // User 1 peut annuler en pending ou proposed
    if (trade.status !== TRADE_STATUS.PENDING && trade.status !== TRADE_STATUS.PROPOSED) {
      return res.status(400).json({ message: 'Ce troc ne peut plus être annulé.' });
    }

    trade.status = TRADE_STATUS.REFUSED;
    await trade.save();

    await Notification.create({
      user: trade.toUser,
      message: "Votre proposition de troc a été refusée.",
      type: NOTIFICATION_TYPE.TRADE_REFUSED,
      trade: trade._id
    });

    res.json({ message: 'Trade cancelled by initiator.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== REFUSER LA PROPOSITION MAIS RELANCER ==========
router.put('/:id/retry', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    // Seul l'initiateur peut demander une nouvelle proposition
    if (trade.fromUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to retry this trade.' });

    if (trade.status !== TRADE_STATUS.PROPOSED)
      return res.status(400).json({ message: 'Trade is not in proposed state.' });

    // Remettre le trade à l'état initial
    trade.status = TRADE_STATUS.PENDING;
    // Remettre le trade à l'état initial
    trade.status = TRADE_STATUS.PENDING;
    trade.offeredObjects = [];
    await trade.save();

    await Notification.create({
      user: trade.toUser,
      message: "L'utilisateur a refusé votre proposition, veuillez choisir un autre objet.",
      type: NOTIFICATION_TYPE.TRADE_RETRY,
      trade: trade._id
    });

    res.json({ message: 'Trade proposal refused, waiting for a new selection.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ENVOYER UN MESSAGE DANS UN TROC ==========
router.post('/:id/messages', auth, async (req, res) => {
  try {
    let { content } = req.body;

    // Input validation
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: "Message content cannot be empty." });
    }
    content = content.trim();
    if (content.length > 1000) {
      return res.status(400).json({ message: "Message content is too long (max 1000 characters)." });
    }

    // Find trade and check authorization before sanitizing content
    const trade = await Trade.findById(req.params.id);
    if (!trade || (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id)) {
      return res.status(403).json({ message: "Not allowed." });
    }

    // Sanitize input to prevent XSS
    content = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {}
    });

    const message = await Message.create({
      trade: trade._id,
      from: req.user.id,
      content
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade || (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id))
      return res.status(403).json({ message: "Not allowed." });
    const messages = await Message.find({ trade: trade._id }).populate('from', 'pseudo').sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ROUTES PATCH POUR FRONTEND ==========

// PATCH /trades/:id/accept - Accepter un trade (alias pour PUT)
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'Trade introuvable' });
    }

    console.log('🔧 [DEBUG] PATCH Accept trade - User:', req.user.id);
    console.log('🔧 [DEBUG] PATCH Accept trade - fromUser:', trade.fromUser.toString());
    console.log('🔧 [DEBUG] PATCH Accept trade - toUser:', trade.toUser.toString());
    console.log('🔧 [DEBUG] PATCH Accept trade - status:', trade.status);

    // Logique d'acceptation selon le statut
    if (trade.status === 'pending') {
      // User 2 peut accepter une demande initiale (rare, généralement il propose plutôt)
      if (trade.toUser.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accepter cette demande.' });
      }
    } else if (trade.status === 'proposed') {
      // User 1 peut accepter une proposition (cas le plus courant)
      if (trade.fromUser.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accepter cette proposition.' });
      }
    } else {
      return res.status(400).json({ message: 'Ce troc ne peut plus être accepté.' });
    }

    // Marquer les objets comme échangés
    if (trade.requestedObjects && trade.requestedObjects.length > 0) {
      await ObjectModel.updateMany(
        { _id: { $in: trade.requestedObjects } },
        { status: OBJECT_STATUS.TRADED }
      );
    }

    if (trade.offeredObjects && trade.offeredObjects.length > 0) {
      await ObjectModel.updateMany(
        { _id: { $in: trade.offeredObjects } },
        { status: OBJECT_STATUS.TRADED }
      );
    }

    // Créer notification pour l'autre utilisateur
    let notificationUser, notificationMessage;
    
    if (trade.status === 'pending') {
      // User 2 accepte la demande initiale -> notifier User 1
      notificationUser = trade.fromUser;
      notificationMessage = "Votre demande de troc a été acceptée !";
    } else if (trade.status === 'proposed') {
      // User 1 accepte la proposition -> notifier User 2  
      notificationUser = trade.toUser;
      notificationMessage = "Votre proposition de troc a été acceptée !";
    }

    trade.status = TRADE_STATUS.ACCEPTED;
    trade.acceptedAt = new Date();
    await trade.save();

    if (notificationUser) {
      await Notification.create({
        user: notificationUser,
        message: notificationMessage,
        type: NOTIFICATION_TYPE.TRADE_ACCEPTED,
        trade: trade._id
      });
    }

    res.json({ message: 'Troc accepté avec succès.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /trades/:id/decline - Refuser un trade (alias pour PUT)
router.patch('/:id/decline', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'Trade introuvable' });
    }

    console.log('🔧 [DEBUG] Decline trade - User:', req.user.id);
    console.log('🔧 [DEBUG] Decline trade - fromUser:', trade.fromUser.toString());
    console.log('🔧 [DEBUG] Decline trade - toUser:', trade.toUser.toString());
    console.log('🔧 [DEBUG] Decline trade - status:', trade.status);

    // Logique de refus selon le statut
    if (trade.status === 'pending') {
      // User 2 peut refuser une demande initiale
      if (trade.toUser.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à refuser cette demande.' });
      }
    } else if (trade.status === 'proposed') {
      // User 1 peut refuser une proposition
      if (trade.fromUser.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à refuser cette proposition.' });
      }
    } else {
      return res.status(400).json({ message: 'Ce troc ne peut plus être refusé.' });
    }

    // Créer notification pour l'autre utilisateur
    let notificationUser, notificationMessage;
    
    if (trade.status === 'pending') {
      // User 2 refuse la demande initiale -> notifier User 1
      notificationUser = trade.fromUser;
      notificationMessage = "Votre demande de troc a été refusée.";
    } else if (trade.status === 'proposed') {
      // User 1 refuse la proposition -> notifier User 2  
      notificationUser = trade.toUser;
      notificationMessage = "Votre proposition de troc a été refusée.";
    }

    trade.status = TRADE_STATUS.REFUSED;
    trade.refusedAt = new Date();
    await trade.save();

    if (notificationUser) {
      await Notification.create({
        user: notificationUser,
        message: notificationMessage,
        type: NOTIFICATION_TYPE.TRADE_REFUSED,
        trade: trade._id
      });
    }

    res.json({ message: 'Troc refusé.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== USER 2 PROPOSE SES OBJETS EN ÉCHANGE ==========
router.post('/:id/make-proposal', auth, async (req, res) => {
  try {
    const { selectedObjects, proposedObjectId } = req.body; // Support les deux formats
    const tradeId = req.params.id;

    // Normaliser en tableau
    let objectIds = [];
    if (proposedObjectId) {
      // Format mobile : un seul objet
      objectIds = [proposedObjectId];
    } else if (selectedObjects) {
      // Format tableau : plusieurs objets
      objectIds = selectedObjects;
    }

    if (!Array.isArray(objectIds) && typeof objectIds === 'string') {
      objectIds = [objectIds];
    }

    if (!objectIds || objectIds.length === 0) {
      return res.status(400).json({ message: 'Vous devez sélectionner au moins un objet.' });
    }

    console.log('🔧 [DEBUG] Make-proposal - objectIds:', objectIds);
    console.log('🔧 [DEBUG] Make-proposal - user:', req.user.id);

    // Récupérer le trade original
    const originalTrade = await Trade.findById(tradeId);
    if (!originalTrade) {
      return res.status(404).json({ message: 'Troc introuvable.' });
    }

    // Vérifier que l'utilisateur est le destinataire du troc
    if (originalTrade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez faire une proposition que sur les trocs qui vous sont destinés.' });
    }

    // Vérifier que le troc est en pending
    if (originalTrade.status !== TRADE_STATUS.PENDING) {
      return res.status(400).json({ message: 'Ce troc n\'est plus en attente de proposition.' });
    }

    // Vérifier le nombre d'objets sélectionnés correspond au nombre demandé
    if (objectIds.length !== originalTrade.requestedObjects.length) {
      return res.status(400).json({ 
        message: `Vous devez sélectionner exactement ${originalTrade.requestedObjects.length} objet(s) en échange.` 
      });
    }

    // Vérifier que les objets sélectionnés existent et appartiennent à User 1
    const objects = await ObjectModel.find({ _id: { $in: objectIds } });
    if (objects.length !== objectIds.length) {
      return res.status(404).json({ message: 'Un ou plusieurs objets sélectionnés sont introuvables.' });
    }
    
    // Vérifier que tous les objets appartiennent à User 1 (celui qui a fait la demande)
    if (!objects.every(obj => obj.owner.toString() === originalTrade.fromUser.toString())) {
      return res.status(403).json({ message: 'Vous ne pouvez choisir que des objets appartenant à l\'utilisateur qui vous propose l\'échange.' });
    }

    // Vérifier que tous les objets sont disponibles
    if (!objects.every(obj => obj.status === OBJECT_STATUS.AVAILABLE)) {
      return res.status(400).json({ message: 'Un ou plusieurs objets sélectionnés ne sont plus disponibles.' });
    }

    // Mettre à jour le troc avec la proposition
    originalTrade.offeredObjects = objectIds;
    originalTrade.status = TRADE_STATUS.PROPOSED;
    await originalTrade.save();

    // Notification pour User 1
    await Notification.create({
      user: originalTrade.fromUser,
      message: `Une proposition a été faite pour votre demande de troc.`,
      type: NOTIFICATION_TYPE.TRADE_PROPOSED,
      trade: originalTrade._id
    });

    // Re-fetch le trade avec toutes les données peuplées pour le retourner
    const updatedTrade = await Trade.findById(originalTrade._id)
      .populate([
        { path: 'offeredObjects', populate: { path: 'owner', select: 'pseudo city avatar' } },
        { path: 'requestedObjects', populate: { path: 'owner', select: 'pseudo city avatar' } },
        { path: 'fromUser', select: 'pseudo city avatar' },
        { path: 'toUser', select: 'pseudo city avatar' }
      ]);

    // Convertir les avatars en URLs complètes
    if (updatedTrade.fromUser && updatedTrade.fromUser.avatar) {
      updatedTrade.fromUser.avatar = getFullUrl(req, updatedTrade.fromUser.avatar);
    }
    if (updatedTrade.toUser && updatedTrade.toUser.avatar) {
      updatedTrade.toUser.avatar = getFullUrl(req, updatedTrade.toUser.avatar);
    }

    res.status(200).json(updatedTrade);
  } catch (err) {
    console.error('❌ Erreur lors de la proposition:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== DEMANDER DE CHOISIR AUTRE CHOSE ==========
router.patch('/:id/ask-different', auth, async (req, res) => {
  try {
    const tradeId = req.params.id;

    // Récupérer le trade
    const trade = await Trade.findById(tradeId).populate([
      { path: 'fromUser', select: 'pseudo city avatar' },
      { path: 'toUser', select: 'pseudo city avatar' },
      { path: 'requestedObjects', select: 'title category imageUrl images' },
      { path: 'offeredObjects', select: 'title category imageUrl images' }
    ]);
    if (!trade) {
      return res.status(404).json({ message: 'Troc introuvable.' });
    }

    // Vérifier que l'utilisateur est le demandeur initial
    if (trade.fromUser._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez demander de choisir autre chose que sur vos propres demandes.' });
    }

    // Remettre le trade en statut "pending" pour que l'autre personne puisse rechoisir
    trade.status = TRADE_STATUS.PENDING;
    trade.offeredObjects = []; // Effacer l'objet précédemment proposé
    await trade.save();

    // Notification pour l'autre utilisateur
    await Notification.create({
      user: trade.toUser._id,
      message: `${trade.fromUser.pseudo} vous demande de choisir un autre objet pour l'échange.`,
      type: NOTIFICATION_TYPE.TRADE_REQUEST,
      trade: tradeId
    });

    // Ajouter un message automatique dans la conversation
    await Message.create({
      from: req.user.id,
      trade: tradeId,
      content: "J'aimerais que vous choisissiez un autre objet pour l'échange."
    });

    res.json({ message: 'Demande envoyée avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la demande de choix différent:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
