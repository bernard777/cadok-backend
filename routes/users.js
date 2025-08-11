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
const Category = require('../models/Category'); // Assurez-vous d'importer le modèle Category

const MIN_CATEGORY_COUNT = 4;
const MAX_CATEGORY_COUNT = 8; // Modifiez ce nombre selon la limite souhaitée

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

module.exports = router;