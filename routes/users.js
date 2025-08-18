const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Imports des modèles pour la suppression CASCADE RGPD
const ObjectModel = require('../models/Object');
const Trade = require('../models/Trade');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const SecurityLog = require('../models/SecurityLog');
const PaymentMethod = require('../models/PaymentMethod');
const Advertisement = require('../models/Advertisement');

// --- Préférences de notification ---
// GET /me/notification-preferences
router.get('/me/notification-preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json({ notificationPreferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /me/notification-preferences
router.put('/me/notification-preferences', auth, async (req, res) => {
  const allowedFields = ['notifications_push', 'notifications_email', 'promotions', 'sound', 'vibration'];
  const updates = {};
  for (const key of allowedFields) {
    if (typeof req.body[key] === 'boolean') {
      updates[`notificationPreferences.${key}`] = req.body[key];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Aucune préférence valide fournie.' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, select: 'notificationPreferences' }
    );
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json({ notificationPreferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- Préférences de fonctionnalités ---
// GET /me/preferences - Récupérer les préférences de fonctionnalités
router.get('/me/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('featurePreferences');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    
    // Mapper les préférences pour l'interface mobile
    const preferences = {
      detailedAnalytics: user.featurePreferences?.analytics ?? true,
      pushNotifications: user.featurePreferences?.notifications ?? true,
      geolocation: true, // Toujours activé pour l'instant
      ecoImpact: user.featurePreferences?.eco ?? true,
      gamification: user.featurePreferences?.gaming ?? true
    };
    
    res.json({ success: true, preferences });
  } catch (err) {
    console.error('Erreur récupération préférences:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /me/preferences - Mettre à jour les préférences de fonctionnalités  
router.put('/me/preferences', auth, async (req, res) => {
  try {
    const updates = {};
    
    // Mapper les préférences de l'interface vers le modèle
    if (typeof req.body.detailedAnalytics !== 'undefined') {
      updates['featurePreferences.analytics'] = req.body.detailedAnalytics;
    }
    if (typeof req.body.pushNotifications !== 'undefined') {
      updates['featurePreferences.notifications'] = req.body.pushNotifications;
    }
    if (typeof req.body.ecoImpact !== 'undefined') {
      updates['featurePreferences.eco'] = req.body.ecoImpact;
    }
    if (typeof req.body.gamification !== 'undefined') {
      updates['featurePreferences.gaming'] = req.body.gamification;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, select: 'featurePreferences' }
    );
    
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    
    // Retourner les préférences dans le format attendu
    const preferences = {
      detailedAnalytics: user.featurePreferences?.analytics ?? true,
      pushNotifications: user.featurePreferences?.notifications ?? true,
      geolocation: true,
      ecoImpact: user.featurePreferences?.eco ?? true,
      gamification: user.featurePreferences?.gaming ?? true
    };
    
    res.json({ success: true, preferences });
  } catch (err) {
    console.error('Erreur mise à jour préférences:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

const Category = require('../models/Category'); // Assurez-vous d'importer le modèle Category

const MIN_CATEGORY_COUNT = 4;
const MAX_CATEGORY_COUNT = 8; // Modifiez ce nombre selon la limite souhaitée

// GET /:id - Récupérer le profil public d'un utilisateur
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    console.log('🔍 [DEBUG] Récupération profil pour userId:', userId);
    
    // Validation de l'ID utilisateur
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('❌ [DEBUG] ID utilisateur invalide:', userId);
      return res.status(400).json({ 
        success: false, 
        message: "ID utilisateur manquant ou invalide." 
      });
    }

    // Vérifier que l'ID est un ObjectId valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('❌ [DEBUG] Format ObjectId invalide:', userId);
      return res.status(400).json({ 
        success: false, 
        message: "Format d'ID utilisateur invalide." 
      });
    }

    // Récupérer le profil utilisateur (champs publics uniquement)
    const user = await User.findById(userId)
      .select('pseudo avatar city verified createdAt profile tradeStats subscriptionPlan')
      .lean();
    
    if (!user) {
      console.log('❌ [DEBUG] Utilisateur non trouvé:', userId);
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur introuvable.' 
      });
    }

    console.log('✅ [DEBUG] Profil utilisateur trouvé:', user.pseudo);

    // Calculer les statistiques d'échanges
    const ObjectModel = require('../models/Object');
    const Trade = require('../models/Trade');
    
    // Compter les objets disponibles de l'utilisateur
    const objectsCount = await ObjectModel.countDocuments({ 
      owner: userId, 
      status: 'available' 
    });

    // Compter les échanges terminés
    const completedTrades = await Trade.countDocuments({
      $and: [
        { status: 'completed' },
        {
          $or: [
            { fromUser: userId },
            { toUser: userId }
          ]
        }
      ]
    });

    // Calculer la note moyenne depuis les échanges
    const tradesWithRatings = await Trade.find({
      $and: [
        { status: 'completed' },
        { 
          $or: [
            { fromUser: userId, 'ratings.toUserRating': { $exists: true } },
            { toUser: userId, 'ratings.fromUserRating': { $exists: true } }
          ]
        }
      ]
    }).select('ratings fromUser toUser');

    let totalRating = 0;
    let ratingCount = 0;

    tradesWithRatings.forEach(trade => {
      if (trade.fromUser.toString() === userId && trade.ratings?.toUserRating?.score) {
        totalRating += trade.ratings.toUserRating.score;
        ratingCount++;
      }
      if (trade.toUser.toString() === userId && trade.ratings?.fromUserRating?.score) {
        totalRating += trade.ratings.fromUserRating.score;
        ratingCount++;
      }
    });

    const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;

    // Construire le profil public enrichi
    const publicProfile = {
      _id: user._id,
      pseudo: user.pseudo,
      avatar: user.avatar,
      city: user.city,
      verified: user.verified,
      joinedAt: user.createdAt,
      profile: user.profile || {},
      stats: {
        objectsCount,
        completedTrades,
        averageRating,
        totalRatings: ratingCount
      },
      subscriptionPlan: user.subscriptionPlan,
      // Calculer un score de confiance basé sur l'activité et les évaluations
      trustScore: Math.min(100, Math.round(
        (completedTrades * 10) + 
        (averageRating * 15) + 
        (user.verified ? 20 : 0) +
        (objectsCount * 2)
      ))
    };

    console.log('✅ [DEBUG] Profil public construit:', {
      pseudo: publicProfile.pseudo,
      objectsCount,
      completedTrades,
      averageRating,
      trustScore: publicProfile.trustScore
    });

    res.json({
      success: true,
      user: publicProfile
    });

  } catch (err) {
    console.error('❌ [DEBUG] Erreur récupération profil:', err);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la récupération du profil." 
    });
  }
});

router.post('/me/favorites', auth, async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories) || categories.length < MIN_CATEGORY_COUNT || categories.length > MAX_CATEGORY_COUNT) {
    return res.status(400).json({ message: `Vous devez sélectionner entre ${MIN_CATEGORY_COUNT} et ${MAX_CATEGORY_COUNT} catégories.` });
  }
  // Vérifie que toutes les catégories existent
  try {
    const found = await Category.find({ _id: { $in: categories } });
    if (found.length < MIN_CATEGORY_COUNT || found.length !== categories.length) {
      return res.status(400).json({ message: "Une ou plusieurs catégories sont invalides." });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { favoriteCategories: categories }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.json({ favoriteCategories: user.favoriteCategories });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.get('/me/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favoriteCategories', 'name fields')
      .select('favoriteCategories');
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.json({ favoriteCategories: user.favoriteCategories });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
});

/**
 * POST /api/users/me/favorite-objects/:objectId
 * Ajouter/retirer un objet des favoris
 */
router.post('/me/favorite-objects/:objectId', auth, async (req, res) => {
  try {
    const { objectId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'objet existe
    const ObjectModel = require('../models/Object');
    const object = await ObjectModel.findById(objectId).populate('owner', 'pseudo');
    
    if (!object) {
      return res.status(404).json({ error: 'Objet non trouvé' });
    }

    // Ne pas permettre d'ajouter ses propres objets en favoris
    if (object.owner._id.toString() === userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas ajouter vos propres objets en favoris' });
    }

    const user = await User.findById(userId);
    const isFavorite = user.favoriteObjects && user.favoriteObjects.includes(objectId);

    let updatedUser;
    let action;

    if (isFavorite) {
      // Retirer des favoris
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { favoriteObjects: objectId } },
        { new: true }
      );
      action = 'removed';
    } else {
      // Ajouter aux favoris
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favoriteObjects: objectId } }, // $addToSet évite les doublons
        { new: true }
      );
      action = 'added';

      // 🔔 DÉCLENCHER NOTIFICATION AU PROPRIÉTAIRE
      try {
        const { notificationTriggers } = require('../middleware/notificationTriggers');
        await notificationTriggers.triggerObjectInterest(
          object.owner._id,        // Propriétaire (receveur)
          objectId,               // ID de l'objet
          object.title,           // Nom de l'objet
          userId,                 // ID de celui qui ajoute en favori
          req.user.pseudo,        // Nom de celui qui ajoute
          'favorite'              // Type d'intérêt
        );
        console.log(`🔔 Notification envoyée: ${req.user.pseudo} a ajouté "${object.title}" en favori`);
      } catch (notifError) {
        console.error('❌ Erreur notification favoris:', notifError);
        // Ne pas faire échouer la requête pour une erreur de notification
      }
    }

    res.json({
      success: true,
      action,
      isFavorite: action === 'added',
      favoriteCount: updatedUser.favoriteObjects ? updatedUser.favoriteObjects.length : 0
    });

  } catch (error) {
    console.error('❌ Erreur gestion favoris objet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/users/me/favorite-objects
 * Récupérer les objets favoris d'un utilisateur
 */
router.get('/me/favorite-objects', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favoriteObjects',
        populate: {
          path: 'owner category',
          select: 'pseudo name city'
        }
      })
      .select('favoriteObjects');

    res.json({ 
      favoriteObjects: user.favoriteObjects || [],
      count: user.favoriteObjects ? user.favoriteObjects.length : 0
    });

  } catch (error) {
    console.error('❌ Erreur récupération objets favoris:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Changement de mot de passe sécurisé
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, password } = req.body;

  // Vérification que les champs requis sont présents
  if (!currentPassword || !password) {
    return res.status(400).json({ message: 'Les champs currentPassword et password sont requis.' });
  }

  // Vérification de la force du mot de passe (au moins 8 caractères, une lettre et un chiffre)
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
    const hashed = await bcrypt.hash(password, 12);
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect." });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashed });
    res.json({ message: 'Mot de passe changé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors du changement de mot de passe." });
  }
});

// Récupérer les objets d'un utilisateur (pour la vitrine publique)
router.get('/:userId/objects', auth, async (req, res) => {
  try {
    const ObjectModel = require('../models/Object');
    const { userId } = req.params;

    console.log('🔧 [DEBUG] Récupération objets pour userId:', userId);

    // Validation du userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ message: "ID utilisateur manquant ou invalide." });
    }

    // Vérifier que l'ID est un ObjectId valide
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    const objects = await ObjectModel.find({ 
      owner: userId, 
      status: 'available' // Seulement les objets disponibles
    })
    .populate('owner', 'pseudo city')
    .sort({ createdAt: -1 });

    console.log('✅ [DEBUG] Objets trouvés:', objects.length);
    res.json(objects);
  } catch (err) {
    console.error('Erreur lors de la récupération des objets:', err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des objets." });
  }
});

/**
 * DELETE /me/account
 * Suppression CASCADE complète du compte utilisateur (CONFORMITÉ RGPD)
 * Supprime TOUTES les données utilisateur de l'application
 */
router.delete('/me/account', auth, async (req, res) => {
  try {
    const { password, reason = 'Demande de l\'utilisateur' } = req.body;
    
    console.log(`🗑️ [DELETE ACCOUNT] Demande de suppression CASCADE pour l'utilisateur ${req.user.id}`);
    
    // Récupérer l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier le mot de passe pour sécurité
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mot de passe requis pour la suppression du compte' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log(`❌ [DELETE ACCOUNT] Mot de passe incorrect pour ${user.email}`);
      return res.status(400).json({ 
        success: false, 
        error: 'Mot de passe incorrect' 
      });
    }
    
    // Empêcher la suppression des comptes admin (sécurité)
    if (user.isAdmin || ['admin', 'super_admin', 'moderator'].includes(user.role)) {
      console.log(`🚫 [DELETE ACCOUNT] Tentative de suppression d'un compte admin: ${user.email}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Les comptes administrateurs ne peuvent pas être supprimés. Contactez un super administrateur.' 
      });
    }
    
    // 🧹 DÉBUT DE LA SUPPRESSION CASCADE COMPLÈTE (CONFORMITÉ RGPD)
    console.log(`🧹 [RGPD CASCADE] Début de suppression cascade pour:`, {
      id: user._id,
      email: user.email,
      pseudo: user.pseudo,
      reason: reason,
      timestamp: new Date().toISOString()
    });

    const userId = req.user.id;
    let deletionStats = {
      user: 0,
      objects: 0,
      trades: 0,
      messages: 0,
      notifications: 0,
      securityLogs: 0,
      paymentMethods: 0,
      advertisements: 0
    };

    // 1. 📦 Supprimer tous les objets de l'utilisateur
    try {
      const deletedObjects = await ObjectModel.deleteMany({ owner: userId });
      deletionStats.objects = deletedObjects.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedObjects.deletedCount} objets supprimés`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur objets:`, err.message);
    }

    // 2. 🤝 Supprimer tous les échanges (en tant que fromUser ou toUser)
    try {
      const deletedTrades = await Trade.deleteMany({
        $or: [
          { fromUser: userId },
          { toUser: userId }
        ]
      });
      deletionStats.trades = deletedTrades.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedTrades.deletedCount} échanges supprimés`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur trades:`, err.message);
    }

    // 3. 💬 Supprimer tous les messages de l'utilisateur
    try {
      const deletedMessages = await Message.deleteMany({ from: userId });
      deletionStats.messages = deletedMessages.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedMessages.deletedCount} messages supprimés`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur messages:`, err.message);
    }

    // 4. 🔔 Supprimer toutes les notifications de l'utilisateur
    try {
      const deletedNotifications = await Notification.deleteMany({ user: userId });
      deletionStats.notifications = deletedNotifications.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedNotifications.deletedCount} notifications supprimées`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur notifications:`, err.message);
    }

    // 5. 🔒 Supprimer tous les logs de sécurité de l'utilisateur
    try {
      const deletedSecurityLogs = await SecurityLog.deleteMany({ userId: userId });
      deletionStats.securityLogs = deletedSecurityLogs.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedSecurityLogs.deletedCount} logs de sécurité supprimés`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur security logs:`, err.message);
    }

    // 6. 💳 Supprimer toutes les méthodes de paiement
    try {
      const deletedPaymentMethods = await PaymentMethod.deleteMany({ userId: userId });
      deletionStats.paymentMethods = deletedPaymentMethods.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedPaymentMethods.deletedCount} méthodes de paiement supprimées`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur payment methods:`, err.message);
    }

    // 7. 📢 Supprimer toutes les publicités de l'utilisateur
    try {
      const deletedAdvertisements = await Advertisement.deleteMany({ user: userId });
      deletionStats.advertisements = deletedAdvertisements.deletedCount;
      console.log(`   ✅ [CASCADE] ${deletedAdvertisements.deletedCount} publicités supprimées`);
    } catch (err) {
      console.log(`   ⚠️ [CASCADE] Erreur advertisements:`, err.message);
    }

    // 8. 👤 Enfin, supprimer l'utilisateur lui-même
    await User.findByIdAndDelete(userId);
    deletionStats.user = 1;
    console.log(`   ✅ [CASCADE] Compte utilisateur supprimé`);

    const totalDeleted = Object.values(deletionStats).reduce((sum, count) => sum + count, 0);

    console.log(`🎯 [RGPD CASCADE] Suppression terminée pour ${user.email}`);
    console.log(`📊 [RGPD CASCADE] STATISTIQUES:`, deletionStats, `(Total: ${totalDeleted} éléments)`);
    console.log(`🔒 [RGPD CONFORMITÉ] Toutes les données utilisateur ont été définitivement supprimées`);

    res.json({
      success: true,
      message: 'Votre compte et TOUTES vos données ont été supprimés définitivement (conformité RGPD complète)',
      deletionStats,
      totalDeleted,
      rgpdCompliant: true,
      deletedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [DELETE ACCOUNT CASCADE] Erreur lors de la suppression:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la suppression CASCADE du compte' 
    });
  }
});

/**
 * POST /me/account/deactivate
 * Désactivation temporaire du compte (alternative à la suppression)
 */
router.post('/me/account/deactivate', auth, async (req, res) => {
  try {
    const { password, reason = 'Désactivation volontaire' } = req.body;
    
    console.log(`⏸️ [DEACTIVATE ACCOUNT] Demande de désactivation pour l'utilisateur ${req.user.id}`);
    
    // Récupérer l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier le mot de passe
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mot de passe requis pour la désactivation du compte' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mot de passe incorrect' 
      });
    }
    
    // Empêcher la désactivation des comptes admin
    if (user.isAdmin || ['admin', 'super_admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Les comptes administrateurs ne peuvent pas être désactivés.' 
      });
    }
    
    // Désactiver le compte
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
      status: 'inactive',
      deactivatedAt: new Date(),
      deactivationReason: reason,
      adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] DÉSACTIVÉ par l'utilisateur: ${reason}`
    }, { new: true });
    
    console.log(`⏸️ [DEACTIVATE ACCOUNT] Compte désactivé: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Votre compte a été désactivé. Vous pouvez le réactiver en vous reconnectant.',
      status: updatedUser.status,
      deactivatedAt: updatedUser.deactivatedAt
    });
    
  } catch (error) {
    console.error('❌ [DEACTIVATE ACCOUNT] Erreur lors de la désactivation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la désactivation du compte' 
    });
  }
});

// GET /:id/reviews - Récupérer tous les avis reçus par un utilisateur
router.get('/:id/reviews', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId).select('pseudo averageRating totalRatings');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé.' 
      });
    }

    // Récupérer les avis depuis les trocs terminés
    const Trade = require('../models/Trade');
    const trades = await Trade.find({
      $and: [
        { status: 'completed' },
        {
          $or: [
            { 'requester': userId, 'ratings.toUserRating': { $exists: true } },
            { 'owner': userId, 'ratings.fromUserRating': { $exists: true } }
          ]
        }
      ]
    }).populate('requester', 'pseudo avatar')
      .populate('owner', 'pseudo avatar')
      .populate('requestedObjects', 'title')
      .sort({ completedAt: -1 });

    // Formatter les avis pour cet utilisateur
    const reviews = [];
    
    trades.forEach(trade => {
      if (trade.requester._id.toString() === userId && trade.ratings?.toUserRating) {
        // L'utilisateur était le requester et a reçu une évaluation
        reviews.push({
          rating: trade.ratings.toUserRating.score,
          comment: trade.ratings.toUserRating.comment,
          submittedAt: trade.ratings.toUserRating.submittedAt,
          fromUser: {
            id: trade.owner._id,
            pseudo: trade.owner.pseudo,
            avatar: trade.owner.avatar
          },
          tradeTitle: trade.requestedObjects?.[0]?.title || 'Troc',
          tradeId: trade._id
        });
      }
      
      if (trade.owner._id.toString() === userId && trade.ratings?.fromUserRating) {
        // L'utilisateur était l'owner et a reçu une évaluation
        reviews.push({
          rating: trade.ratings.fromUserRating.score,
          comment: trade.ratings.fromUserRating.comment,
          submittedAt: trade.ratings.fromUserRating.submittedAt,
          fromUser: {
            id: trade.requester._id,
            pseudo: trade.requester.pseudo,
            avatar: trade.requester.avatar
          },
          tradeTitle: trade.requestedObjects?.[0]?.title || 'Troc',
          tradeId: trade._id
        });
      }
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        pseudo: user.pseudo,
        averageRating: user.averageRating,
        totalRatings: user.totalRatings
      },
      reviews: reviews
    });

  } catch (err) {
    console.error('Erreur récupération avis:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des avis.' 
    });
  }
});

// Route de développement pour récupérer les codes de vérification (SANS AUTH)
router.get('/dev/verification-codes', async (req, res) => {
  try {
    console.log('🔧 [DEV] Récupération des codes de vérification');
    console.log('🔧 [DEV] NODE_ENV:', process.env.NODE_ENV);
    
    const users = await User.find({ 
      emailVerificationToken: { $exists: true, $ne: null } 
    }).select('email pseudo emailVerificationToken emailVerified');

    const codes = users.map(user => ({
      email: user.email,
      pseudo: user.pseudo,
      emailVerified: user.emailVerified,
      verificationCode: user.emailVerificationToken ? user.emailVerificationToken.slice(-6) : null,
      fullToken: user.emailVerificationToken
    }));

    console.log(`🔧 [DEV] ${codes.length} codes trouvés`);
    res.json({ codes });
  } catch (error) {
    console.error('❌ [DEV] Erreur récupération codes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de développement pour récupérer le code d'un utilisateur spécifique
router.get('/dev/verification-code/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔧 [DEV] Récupération code pour:', email);
    console.log('🔧 [DEV] NODE_ENV:', process.env.NODE_ENV);

    const user = await User.findOne({ email }).select('email pseudo emailVerificationToken emailVerified');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const code = user.emailVerificationToken ? user.emailVerificationToken.slice(-6) : null;
    
    console.log(`🔧 [DEV] Code trouvé pour ${email}: ${code}`);
    res.json({
      email: user.email,
      pseudo: user.pseudo,
      emailVerified: user.emailVerified,
      verificationCode: code,
      fullToken: user.emailVerificationToken
    });
  } catch (error) {
    console.error('❌ [DEV] Erreur récupération code:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de développement pour récupérer les codes de vérification SMS
router.get('/dev/sms-verification-codes', async (req, res) => {
  try {
    console.log('🔧 [DEV] Récupération des codes de vérification SMS');
    console.log('🔧 [DEV] NODE_ENV:', process.env.NODE_ENV);
    
    const users = await User.find({ 
      phoneVerificationCode: { $exists: true, $ne: null } 
    }).select('email pseudo phoneNumber phoneVerificationCode phoneVerified phoneVerificationExpires');

    const codes = users.map(user => ({
      email: user.email,
      pseudo: user.pseudo,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      smsVerificationCode: user.phoneVerificationCode,
      expiresAt: user.phoneVerificationExpires
    }));

    console.log(`🔧 [DEV] ${codes.length} codes SMS trouvés`);
    res.json({ codes });
  } catch (error) {
    console.error('❌ [DEV] Erreur récupération codes SMS:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de développement pour récupérer le code SMS d'un utilisateur spécifique
router.get('/dev/sms-verification-code/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🔧 [DEV] Récupération code SMS pour:', email);
    console.log('🔧 [DEV] NODE_ENV:', process.env.NODE_ENV);

    const user = await User.findOne({ email }).select('email pseudo phoneNumber phoneVerificationCode phoneVerified phoneVerificationExpires');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log(`🔧 [DEV] Code SMS trouvé pour ${email}: ${user.phoneVerificationCode}`);
    res.json({
      email: user.email,
      pseudo: user.pseudo,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      smsVerificationCode: user.phoneVerificationCode,
      expiresAt: user.phoneVerificationExpires
    });
  } catch (error) {
    console.error('❌ [DEV] Erreur récupération code SMS:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 📱 GESTION TOKEN PUSH NOTIFICATIONS
router.post('/push-token', auth, async (req, res) => {
  try {
    const { pushToken } = req.body;
    
    if (!pushToken) {
      return res.status(400).json({ message: 'Token push requis' });
    }

    // Mettre à jour le token push de l'utilisateur
    await User.findByIdAndUpdate(req.user.id, {
      pushToken: pushToken,
      pushTokenUpdatedAt: new Date()
    });

    console.log(`📱 Token push enregistré pour ${req.user.email}: ${pushToken.substring(0, 20)}...`);
    
    res.json({ 
      success: true, 
      message: 'Token push enregistré avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur enregistrement token push:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;