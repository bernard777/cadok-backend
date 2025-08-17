const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const ObjectModel = require('../models/Object');
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const sanitizeHtml = require('sanitize-html');
const PureTradeSecurityService = require('../services/pureTradeSecurityService');
const DeliveryLabelService = require('../services/deliveryLabelService');
const socketService = require('../services/socketService');

// Initialiser les services
const securityService = new PureTradeSecurityService();
const labelService = new DeliveryLabelService();

// Utilitaire pour générer une URL complète pour l'avatar
function getFullUrl(req, relativePath) {
  if (!relativePath) return '';
  // Si l'URL commence déjà par http, la retourner telle quelle
  if (relativePath.startsWith('http')) return relativePath;
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
    const { requestedObjects, offeredObjects } = req.body;
    
    if (!Array.isArray(requestedObjects) || requestedObjects.length === 0) {
      return res.status(400).json({ message: 'Vous devez sélectionner au moins un objet demandé.' });
    }

    // Vérifie que tous les objets demandés existent et appartiennent au même utilisateur (utilisateur 2)
    const requestedObjs = await ObjectModel.find({ _id: { $in: requestedObjects } });
    if (requestedObjs.length !== requestedObjects.length) {
      return res.status(404).json({ message: 'Un ou plusieurs objets demandés sont introuvables.' });
    }
    
    const ownerId = requestedObjs[0].owner.toString();
    if (!requestedObjs.every(obj => obj.owner.toString() === ownerId)) {
      return res.status(400).json({ message: 'Tous les objets demandés doivent appartenir au même utilisateur.' });
    }
    
    if (ownerId === req.user.id) {
      return res.status(400).json({ message: 'Impossible de troquer avec soi-même.' });
    }

    // Vérifier les objets offerts (optionnels)
    let offeredObjs = [];
    if (offeredObjects && Array.isArray(offeredObjects) && offeredObjects.length > 0) {
      offeredObjs = await ObjectModel.find({ _id: { $in: offeredObjects } });
      if (offeredObjs.length !== offeredObjects.length) {
        return res.status(404).json({ message: 'Un ou plusieurs objets offerts sont introuvables.' });
      }
      
      // Vérifier que les objets offerts appartiennent au demandeur
      if (!offeredObjs.every(obj => obj.owner.toString() === req.user.id)) {
        return res.status(400).json({ message: 'Vous ne pouvez offrir que vos propres objets.' });
      }
    }

    // Analyser le risque du troc avec le nouveau système de sécurité
    const riskAnalysis = await securityService.analyzeTradeRisk(req.user.id, ownerId);

    const newTrade = new Trade({
      fromUser: req.user.id,
      toUser: ownerId,
      requestedObjects,
      offeredObjects: offeredObjects || [], // ← Ajouter les objets offerts
      status: TRADE_STATUS.PENDING,
      security: {
        trustScores: {
          sender: riskAnalysis.fromUserScore,
          recipient: riskAnalysis.toUserScore
        },
        riskLevel: riskAnalysis.riskLevel,
        pureTradeValidation: {
          steps: {
            photosSubmitted: { fromUser: false, toUser: false },
            shippingConfirmed: { fromUser: false, toUser: false },
            deliveryConfirmed: { fromUser: false, toUser: false }
          },
          constraints: riskAnalysis.constraints,
          timeline: [{
            step: 'trade_created',
            userId: req.user.id,
            timestamp: new Date(),
            data: { riskLevel: riskAnalysis.riskLevel, recommendation: riskAnalysis.recommendation }
          }]
        }
      }
    });

    const saved = await newTrade.save();
    
    // Populer les champs nécessaires pour la réponse
    await saved.populate([
      { path: 'fromUser', select: 'pseudo city avatar' },
      { path: 'toUser', select: 'pseudo city avatar' },
      { path: 'requestedObjects' },
      { path: 'offeredObjects' }
    ]);

    // Notification pour l'utilisateur 2
    const notificationMessage = riskAnalysis.constraints.photosRequired 
      ? "Vous avez reçu une demande de troc sécurisé. Photos requises avant validation."
      : "Vous avez reçu une nouvelle demande de troc sur plusieurs objets.";

    const notificationTitle = riskAnalysis.constraints.photosRequired
      ? "Demande de troc sécurisé"
      : "Nouvelle demande de troc";

    await Notification.create({
      user: ownerId,
      title: notificationTitle,
      message: notificationMessage,
      type: NOTIFICATION_TYPE.TRADE_REQUEST,
      trade: saved._id
    });

    // Retourner une structure adaptée pour le frontend
    const responseData = {
      _id: saved._id,
      status: saved.status,
      message: saved.message,
      createdAt: saved.createdAt,
      requester: (saved.fromUser._id || saved.fromUser).toString(), // ← Convertir en string
      requested: (saved.toUser._id || saved.toUser).toString(),     // ← Convertir en string
      fromUser: saved.fromUser,
      toUser: saved.toUser,
      requestedObjects: saved.requestedObjects,
      offeredObjects: saved.offeredObjects,
      deliveryMethod: saved.deliveryMethod,
      deliveryCost: saved.deliveryCost
    };

    // 🔌 SOCKET.IO - Notifier les utilisateurs connectés que les trades ont été mis à jour
    console.log('🔄 [SOCKET] Émission événement trade-created pour:', {
      fromUser: saved.fromUser._id,
      toUser: saved.toUser._id
    });
    
    // Notifier les deux utilisateurs concernés
    socketService.emitToUsers([saved.fromUser._id.toString(), saved.toUser._id.toString()], 'conversation-updated', {
      type: 'trade-created',
      tradeId: saved._id,
      fromUser: saved.fromUser._id,
      toUser: saved.toUser._id
    });

    res.status(201).json({ success: true, trade: responseData });
  } catch (err) {
    console.error('❌ Erreur dans POST /trades:', err.message);
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
        { path: 'fromUser', select: 'pseudo city avatar' },
        { path: 'toUser', select: 'pseudo city avatar' }
      ]);
    
    // Adapter chaque trade pour le frontend
    const adaptedTrades = trades.map(trade => ({
      _id: trade._id,
      status: trade.status,
      message: trade.message,
      createdAt: trade.createdAt,
      acceptedAt: trade.acceptedAt,
      refusedAt: trade.refusedAt,
      requester: (trade.fromUser._id || trade.fromUser).toString(), // ← ID string pour compatibilité
      requested: { _id: (trade.toUser._id || trade.toUser).toString() }, // ← Objet avec _id pour les tests
      fromUser: trade.fromUser,
      toUser: trade.toUser,
      requestedObjects: trade.requestedObjects,
      offeredObjects: trade.offeredObjects,
      deliveryMethod: trade.deliveryMethod,
      deliveryCost: trade.deliveryCost
    }));
    
    res.json({ success: true, trades: adaptedTrades });
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
      requester: (trade.fromUser._id || trade.fromUser).toString(), // ← ID pour les tests
      requested: (trade.toUser._id || trade.toUser).toString(),     // ← ID pour les tests
      fromUser: trade.fromUser, // Garde l'objet complet avec pseudo, city, avatar
      toUser: trade.toUser,     // Garde l'objet complet avec pseudo, city, avatar
      requestedObjects: trade.requestedObjects,
      offeredObjects: trade.offeredObjects,
      deliveryMethod: trade.deliveryMethod,
      deliveryCost: trade.deliveryCost
    };

    res.json({ success: true, trade: adaptedTrade });
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

// ========== REFUSER UNE DEMANDE DE TROC (ALIAS) ==========
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate([
        { path: 'fromUser', select: 'pseudo city avatar' },
        { path: 'toUser', select: 'pseudo city avatar' }
      ]);

    if (!trade) return res.status(404).json({ message: 'Trade not found.' });
    
    // Seul le destinataire peut refuser
    if (trade.toUser._id.toString() !== req.user.id)
      return res.status(403).json({ message: 'Vous ne pouvez refuser que les trocs qui vous sont destinés.' });

    if (!['pending', 'proposed'].includes(trade.status))
      return res.status(400).json({ message: 'Ce troc ne peut plus être refusé.' });

    trade.status = TRADE_STATUS.REFUSED;
    trade.refusedAt = new Date();
    await trade.save();

    // Notification pour User 1 (celui qui avait fait la demande)
    await Notification.create({
      user: trade.fromUser._id,
      title: "Troc refusé",
      message: "Votre demande de troc a été refusée.",
      type: NOTIFICATION_TYPE.TRADE_REFUSED,
      trade: trade._id
    });

    // Retourner la structure adaptée
    const responseData = {
      _id: trade._id,
      status: trade.status,
      message: trade.message,
      createdAt: trade.createdAt,
      refusedAt: trade.refusedAt,
      requester: trade.fromUser._id || trade.fromUser,
      requested: trade.toUser._id || trade.toUser,
      fromUser: trade.fromUser,
      toUser: trade.toUser,
      requestedObjects: trade.requestedObjects,
      offeredObjects: trade.offeredObjects,
      deliveryMethod: trade.deliveryMethod,
      deliveryCost: trade.deliveryCost
    };

    res.json({ message: 'Demande de troc refusée.', trade: responseData });

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
    if (!['pending'].includes(trade.status)) {
      return res.status(400).json({ message: "Ce troc n'est pas en attente de proposition." });
    }
    if (!Array.isArray(offeredObjects) || offeredObjects.length !== trade.requestedObjects.length) {
      return res.status(400).json({ message: "Vous devez sélectionner exactement " + trade.requestedObjects.length + " objets à offrir en échange." });
    }

    const objects = await ObjectModel.find({ _id: { $in: offeredObjects }, owner: trade.toUser });
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
      title: "Proposition de troc",
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
      title: "Troc accepté",
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
      title: "Troc refusé",
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

    // Remettre le trade à l'état initial pour une nouvelle proposition
    trade.status = TRADE_STATUS.PENDING;
    trade.offeredObjects = []; // Vider les objets proposés précédemment
    await trade.save();

    await Notification.create({
      user: trade.toUser,
      message: "L'utilisateur a refusé votre proposition, veuillez proposer d'autres objets à la place.",
      type: NOTIFICATION_TYPE.TRADE_RETRY,
      trade: trade._id
    });

    res.json({ message: 'Trade proposal refused, waiting for a new selection.', trade });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ANALYSE SÉCURITÉ DU TRADE ==========
router.get('/:id/security-analysis', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found.' });
    }
    
    // Vérifier que l'utilisateur a accès à ce trade
    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé à ce trade.' });
    }
    
    // Calculer le score de sécurité basé sur les données du trade
    const securityScore = await securityService.calculateTradeSecurityScore(trade);
    
    res.json({
      tradeId: trade._id,
      securityScore: securityScore,
      riskLevel: trade.security?.riskLevel || 'medium',
      trustScores: trade.security?.trustScores || { sender: 0, recipient: 0 },
      analysis: {
        userTrustLevel: trade.security?.trustScores?.sender || 0,
        recipientTrustLevel: trade.security?.trustScores?.recipient || 0,
        overallRisk: trade.security?.riskLevel || 'medium'
      }
    });
    
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
      title: "Notification",
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
      title: "Notification",
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
      title: "Proposition de troc",
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
      title: "Demande de troc",
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

// ========== ROUTES DU SYSTÈME DE SÉCURITÉ PURE TRADE ==========

// Analyser un troc proposé (analyse de risque)
router.get('/:id/security-analysis', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ message: 'Troc non trouvé' });
    }

    // Vérifier que l'utilisateur fait partie du troc
    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const analysis = await securityService.analyzeTradeRisk(trade.fromUser, trade.toUser);
    res.json({
      success: true,
      tradeId: req.params.id,
      analysis
    });
  } catch (error) {
    console.error('Erreur analyse sécurité:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Soumettre des photos avant expédition
router.post('/:id/submit-photos', auth, async (req, res) => {
  try {
    const { photos, trackingNumber } = req.body;
    
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ success: false, error: 'Photos requises' });
    }

    const result = await securityService.submitPhotos(
      req.params.id,
      req.user.id,
      photos,
      trackingNumber
    );

    res.json(result);
  } catch (error) {
    console.error('Erreur soumission photos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirmer l'expédition
router.post('/:id/confirm-shipment', auth, async (req, res) => {
  try {
    const { trackingNumber } = req.body;

    const result = await securityService.confirmShipment(
      req.params.id,
      req.user.id,
      trackingNumber
    );

    res.json(result);
  } catch (error) {
    console.error('Erreur confirmation expédition:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirmer la réception et évaluer
router.post('/:id/confirm-delivery', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Note requise (1-5)' });
    }

    const result = await securityService.confirmDelivery(
      req.params.id,
      req.user.id,
      rating,
      comment
    );

    res.json(result);
  } catch (error) {
    console.error('Erreur confirmation livraison:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Signaler un problème
router.post('/:id/report-problem', auth, async (req, res) => {
  try {
    const { reason, description, evidence } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Raison et description requises' 
      });
    }

    const result = await securityService.reportProblem(
      req.params.id,
      req.user.id,
      reason,
      description,
      evidence || []
    );

    res.json(result);
  } catch (error) {
    console.error('Erreur signalement problème:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir le statut de sécurité d'un troc
router.get('/:id/security-status', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troc non trouvé' });
    }

    // Vérifier que l'utilisateur fait partie du troc
    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    const result = await securityService.getSecurityStatus(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Erreur statut sécurité:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir le score de confiance de l'utilisateur connecté
router.get('/my-trust-score', auth, async (req, res) => {
  try {
    const trustScore = await securityService.calculateTrustScore(req.user.id);
    res.json({
      success: true,
      trustScore,
      userId: req.user.id
    });
  } catch (error) {
    console.error('Erreur score confiance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GÉNÉRATION DE BORDEREAU D'ENVOI ==========

// Générer un bordereau d'envoi avec redirection automatique
router.post('/:id/generate-delivery-label', auth, async (req, res) => {
  try {
    const result = await labelService.generateDeliveryLabel(req.params.id, req.user.id);
    
    if (result.success) {
      // Sauvegarder les infos de livraison dans le troc
      await Trade.findByIdAndUpdate(req.params.id, {
        $set: {
          'security.pureTradeValidation.deliveryLabel': {
            labelUrl: result.labelUrl,
            redirectionCode: result.redirectionCode,
            generatedAt: new Date(),
            estimatedDelivery: result.estimatedDelivery
          }
        }
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erreur génération bordereau:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Télécharger le bordereau d'envoi
router.get('/:id/download-label', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Troc non trouvé' });
    }

    // Vérifier que l'utilisateur fait partie du troc
    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    const labelInfo = trade.security?.pureTradeValidation?.deliveryLabel;
    if (!labelInfo) {
      return res.status(404).json({ success: false, error: 'Bordereau non généré' });
    }

    const filepath = require('path').join(__dirname, '../uploads/labels', 
      require('path').basename(labelInfo.labelUrl));
    
    res.download(filepath, `bordereau-${trade._id}.pdf`);
  } catch (error) {
    console.error('Erreur téléchargement bordereau:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== COMPLETER UN ÉCHANGE ==========
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });

    // Seuls les participants peuvent compléter l'échange
    if (trade.fromUser.toString() !== req.user.id && trade.toUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not allowed.' });
    }

    // Doit être accepté avant completion
    if (trade.status !== TRADE_STATUS.ACCEPTED) {
      return res.status(400).json({ success: false, message: 'Trade must be accepted before completion.' });
    }

    trade.status = 'completed'; // statut attendu par les tests
    trade.completedAt = new Date();
    await trade.save();

    await Notification.create({
      user: trade.fromUser.toString() === req.user.id ? trade.toUser : trade.fromUser,
      message: 'L\'échange a été finalisé avec succès.',
      type: 'trade_completed',
      trade: trade._id
    }).catch(()=>{});

    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/trades/:id/rating - Évaluer un utilisateur après un troc terminé
router.post('/:id/rating', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const tradeId = req.params.id;

    // Validation des données
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'La note doit être entre 1 et 5.' 
      });
    }

    // Récupérer le trade
    const trade = await Trade.findById(tradeId)
      .populate('requester', 'pseudo')
      .populate('owner', 'pseudo');
    
    if (!trade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Troc non trouvé.' 
      });
    }

    // Vérifier que le trade est terminé
    if (trade.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Le troc doit être terminé pour être évalué.' 
      });
    }

    // Vérifier que l'utilisateur fait partie du troc
    const isRequester = trade.requester._id.toString() === req.user.id;
    const isOwner = trade.owner._id.toString() === req.user.id;
    
    if (!isRequester && !isOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous ne pouvez pas évaluer ce troc.' 
      });
    }

    // Initialiser ratings si nécessaire
    if (!trade.ratings) {
      trade.ratings = {};
    }

    // Déterminer quel utilisateur évalue l'autre
    if (isRequester) {
      // Le requester évalue l'owner
      if (trade.ratings.fromUserRating) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vous avez déjà évalué ce troc.' 
        });
      }
      
      trade.ratings.fromUserRating = {
        score: rating,
        comment: comment?.trim() || '',
        submittedAt: new Date(),
        submittedBy: req.user.id
      };
    } else {
      // L'owner évalue le requester
      if (trade.ratings.toUserRating) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vous avez déjà évalué ce troc.' 
        });
      }
      
      trade.ratings.toUserRating = {
        score: rating,
        comment: comment?.trim() || '',
        submittedAt: new Date(),
        submittedBy: req.user.id
      };
    }

    // Sauvegarder le trade
    await trade.save();

    // Mettre à jour les statistiques de l'utilisateur évalué
    const User = require('../models/User');
    const evaluatedUserId = isRequester ? trade.owner._id : trade.requester._id;
    const evaluatedUser = await User.findById(evaluatedUserId);
    
    if (evaluatedUser) {
      // Ajouter la nouvelle évaluation
      evaluatedUser.ratingsReceived.push({
        fromUser: req.user.id,
        rating: rating,
        comment: comment?.trim() || '',
        trade: tradeId,
        createdAt: new Date()
      });

      // Recalculer la moyenne
      const totalRatings = evaluatedUser.ratingsReceived.length;
      const sumRatings = evaluatedUser.ratingsReceived.reduce((sum, r) => sum + r.rating, 0);
      evaluatedUser.averageRating = Math.round((sumRatings / totalRatings) * 10) / 10;
      evaluatedUser.totalRatings = totalRatings;

      await evaluatedUser.save();
    }

    // Créer une notification pour l'utilisateur évalué
    await Notification.create({
      user: evaluatedUserId,
      message: `Vous avez reçu une nouvelle évaluation (${rating}/5) de votre troc avec ${req.user.pseudo || 'un utilisateur'}.`,
      type: 'trade_rated',
      trade: tradeId
    }).catch(() => {});

    res.json({ 
      success: true, 
      message: 'Évaluation enregistrée avec succès.',
      trade: await Trade.findById(tradeId)
        .populate('requester', 'pseudo avatar')
        .populate('owner', 'pseudo avatar')
    });

  } catch (err) {
    console.error('Erreur évaluation troc:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'évaluation.' 
    });
  }
});

module.exports = router;
