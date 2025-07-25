const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');

// ENUMS
const TRADE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REFUSED: 'refused'
};
const OBJECT_STATUS = {
  AVAILABLE: 'available',
  TRADED: 'traded',
  PENDING: 'pending'
};

// ========== PROPOSER UN ÉCHANGE ==========
router.post('/', auth, async (req, res) => {
  const { offeredObject, requestedObject } = req.body;
  try {
    const offered = await ObjectModel.findById(offeredObject);
    const requested = await ObjectModel.findById(requestedObject);

    // Vérif 1 : Objets existants
    if (!offered || !requested)
      return res.status(404).json({ message: 'Object(s) not found.' });

    // Vérif 2 : Ownership
    if (offered.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only propose your own object.' });

    // Vérif 3 : Pas avec soi-même
    if (offered.owner.toString() === requested.owner.toString())
      return res.status(400).json({ message: 'Cannot trade with yourself.' });

    // Vérif 4 : Statuts des objets
    if (offered.status !== OBJECT_STATUS.AVAILABLE || requested.status !== OBJECT_STATUS.AVAILABLE)
      return res.status(400).json({ message: 'One or both objects are not available for trade.' });

    // Créer la proposition d’échange
    const newTrade = new Trade({
      fromUser: req.user.id,
      toUser: requested.owner,
      offeredObject,
      requestedObject,
      status: TRADE_STATUS.PENDING
    });

    const saved = await newTrade.save();
    res.status(201).json(saved);

  } catch (err) {
    return res.status(500).json({ error: err.message });
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
      .populate('offeredObject requestedObject fromUser toUser');
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ACCEPTER UNE PROPOSITION ==========
router.put('/:id/accept', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const trade = await Trade.findById(req.params.id).session(session);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    // Vérif: only the receiver can accept
    if (trade.toUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to accept this trade.' });

    if (trade.status !== TRADE_STATUS.PENDING)
      return res.status(400).json({ message: 'Trade already processed.' });

    // Vérif: objets toujours disponibles
    const offered = await ObjectModel.findById(trade.offeredObject).session(session);
    const requested = await ObjectModel.findById(trade.requestedObject).session(session);

    if (!offered || !requested) return res.status(404).json({ message: 'Object(s) not found.' });

    if (offered.status !== OBJECT_STATUS.AVAILABLE || requested.status !== OBJECT_STATUS.AVAILABLE)
      return res.status(400).json({ message: 'One or both objects are no longer available.' });

    // Valider le trade et MAJ objets
    trade.status = TRADE_STATUS.ACCEPTED;
    await trade.save({ session });

    offered.status = OBJECT_STATUS.TRADED;
    requested.status = OBJECT_STATUS.TRADED;
    await offered.save({ session });
    await requested.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Trade accepted.', trade });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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

    res.json({ message: 'Trade refused.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
