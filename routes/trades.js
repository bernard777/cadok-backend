const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const sanitizeHtml = require('sanitize-html');

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

    // Vérif: only the receiver can accept
    if (trade.toUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to accept this trade.' });

    if (trade.status !== TRADE_STATUS.PROPOSED)
      return res.status(400).json({ message: 'Trade must be in proposed state to accept.' });

    if (!trade.offeredObject)
      return res.status(400).json({ message: 'No offered objects to accept.' });

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

// ========== REFUSER UNE PROPOSITION ==========
router.put('/:id/refuse', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });
    if (trade.toUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to refuse this trade.' });

    if (trade.status !== TRADE_STATUS.PENDING)
      return res.status(400).json({ message: 'Trade already processed.' });

    trade.status = TRADE_STATUS.REFUSED;
    await trade.save();

    await Notification.create({
      user: trade.toUser,
      message: "Votre proposition de troc a été refusée.",
      type: NOTIFICATION_TYPE.TRADE_REFUSED,
      trade: trade._id
    });

    res.json({ message: 'Trade refused.', trade });

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

    // Seul l'initiateur peut annuler/refuser
    if (trade.fromUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to cancel this trade.' });

    if (trade.status !== TRADE_STATUS.PROPOSED)
      return res.status(400).json({ message: 'Trade is not in proposed state.' });

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

module.exports = router;
