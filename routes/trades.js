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
  REFUSED: 'refused',
  PROPOSED: 'proposed'
};
const OBJECT_STATUS = {
  AVAILABLE: 'available',
  TRADED: 'traded',
  PENDING: 'pending',
  RESERVED: 'reserved'
};

// ========== PROPOSER UN ÉCHANGE ==========
router.post('/', auth, async (req, res) => {
  const { requestedObject } = req.body;
  try {
    const requested = await ObjectModel.findById(requestedObject);
    if (!requested)
      return res.status(404).json({ message: 'Object not found.' });

    if (requested.owner.toString() === req.user.id)
      return res.status(400).json({ message: 'Cannot trade with yourself.' });

    if (requested.status !== OBJECT_STATUS.AVAILABLE)
      return res.status(400).json({ message: 'Object is not available for trade.' });

    const newTrade = new Trade({
      fromUser: req.user.id,
      toUser: requested.owner,
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
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    // Vérif: only the receiver can accept
    if (trade.toUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to accept this trade.' });

    if (trade.status !== TRADE_STATUS.PROPOSED)
      return res.status(400).json({ message: 'Trade must be in proposed state to accept.' });

    if (!trade.offeredObject)
      return res.status(400).json({ message: 'No offered object to accept.' });

    // Vérif: objets toujours disponibles
    const offered = await ObjectModel.findById(trade.offeredObject);
    const requested = await ObjectModel.findById(trade.requestedObject);

    if (!offered || !requested) return res.status(404).json({ message: 'Object(s) not found.' });

    if (offered.status !== OBJECT_STATUS.AVAILABLE || requested.status !== OBJECT_STATUS.AVAILABLE)
      return res.status(400).json({ message: 'One or both objects are no longer available.' });

    // Valider le trade et MAJ objets
    trade.status = TRADE_STATUS.ACCEPTED;
    await trade.save();

    offered.status = OBJECT_STATUS.TRADED;
    requested.status = OBJECT_STATUS.TRADED;
    await offered.save();
    await requested.save();

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

    res.json({ message: 'Trade refused.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== PROPOSER UN OBJET À L'ÉCHANGE ==========
router.put('/:id/propose', auth, async (req, res) => {
  const { offeredObject } = req.body;
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found.' });

    if (trade.toUser.toString() !== req.user.id)
      return res.status(403).json({ message: 'You are not authorized to propose an object for this trade.' });

    if (trade.status !== TRADE_STATUS.PENDING)
      return res.status(400).json({ message: 'Trade must be in pending state to propose an object.' });

    const offered = await ObjectModel.findById(offeredObject);
    if (!offered) return res.status(404).json({ message: 'Offered object not found.' });

    if (offered.owner.toString() !== trade.fromUser.toString())
      return res.status(400).json({ message: 'The offered object must belong to the trade initiator.' });

    if (offered.status !== OBJECT_STATUS.AVAILABLE)
      return res.status(400).json({ message: 'Offered object is not available.' });

    trade.offeredObject = offeredObject;
    trade.status = TRADE_STATUS.PROPOSED;
    await trade.save();

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

    if (trade.status !== TRADE_STATUS.PROPOSED)
      return res.status(400).json({ message: 'Trade is not in proposed state.' });

    // Vérif: offeredObject doit être présent
    if (!trade.offeredObject)
      return res.status(400).json({ message: 'No offered object selected yet.' });

    // Vérif objets toujours disponibles
    const offered = await ObjectModel.findById(trade.offeredObject);
    const requested = await ObjectModel.findById(trade.requestedObject);

    if (!offered || !requested) return res.status(404).json({ message: 'Object(s) not found.' });

    if (offered.status !== OBJECT_STATUS.AVAILABLE || requested.status !== OBJECT_STATUS.AVAILABLE)
      return res.status(400).json({ message: 'One or both objects are no longer available.' });

    // Valider le trade et MAJ objets
    trade.status = TRADE_STATUS.ACCEPTED;
    await trade.save();

    offered.status = OBJECT_STATUS.TRADED;
    requested.status = OBJECT_STATUS.TRADED;
    await offered.save();
    await requested.save();

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
    trade.offeredObject = undefined;
    await trade.save();

    res.json({ message: 'Trade proposal refused, waiting for a new selection.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
