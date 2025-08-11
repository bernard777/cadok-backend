/**
 * 🔐 ROUTES DE VÉRIFICATION EMAIL + SMS - CADOK
 * Système complet de vérification à double authentification
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');
const EmailVerificationService = require('../services/EmailVerificationService');
const SMSVerificationService = require('../services/SMSVerificationService');

const emailService = new EmailVerificationService();
const smsService = new SMSVerificationService();

/**
 * POST /api/verification/resend-email
 * Renvoyer l'email de vérification
 */
router.post('/resend-email', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email déjà vérifié'
      });
    }

    // Générer nouveau token
    const token = emailService.generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Sauvegarder le token
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Envoyer l'email
    const result = await emailService.sendVerificationEmail(user, token);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email de vérification renvoyé'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Impossible d\'envoyer l\'email'
      });
    }
  } catch (error) {
    console.error('❌ Erreur renvoi email:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/verification/verify-email/:token
 * Vérifier l'email avec le token
 */
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }

    // Marquer l'email comme vérifié
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Envoyer email de bienvenue
    await emailService.sendWelcomeEmail(user);

    console.log(`✅ Email vérifié pour ${user.email}`);
    
    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      user: {
        id: user._id,
        pseudo: user.pseudo,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification email:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/verification/send-phone-code
 * Envoyer le code SMS de vérification
 */
router.post('/send-phone-code', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone requis'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        error: 'Téléphone déjà vérifié'
      });
    }

    // Vérifier les limites de taux
    if (!user.canReceivePhoneCode()) {
      return res.status(429).json({
        success: false,
        error: 'Trop de tentatives. Veuillez patienter.'
      });
    }

    // Générer code et expiration
    const code = smsService.generateVerificationCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Sauvegarder dans la DB
    user.phone = phone;
    user.phoneVerificationCode = code;
    user.phoneVerificationExpires = expires;
    user.phoneVerificationAttempts += 1;
    user.lastPhoneVerificationSent = new Date();
    await user.save();

    // Envoyer le SMS
    const result = await smsService.sendSMS(phone, code);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Code SMS envoyé',
        phone: phone.replace(/\d(?=\d{4})/g, '*') // Masquer le numéro
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Impossible d\'envoyer le SMS'
      });
    }
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/verification/verify-phone
 * Vérifier le code SMS
 */
router.post('/verify-phone', auth, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code de vérification requis'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Vérifier le code (ou accepter le code de test)
    const isValidCode = user.phoneVerificationCode === code || smsService.isValidTestCode(code);
    const isExpired = user.phoneVerificationExpires < new Date();
    
    if (!isValidCode || isExpired) {
      return res.status(400).json({
        success: false,
        error: 'Code invalide ou expiré'
      });
    }

    // Marquer le téléphone comme vérifié
    user.phoneVerified = true;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpires = null;
    user.phoneVerificationAttempts = 0;
    await user.save(); // Le middleware pre('save') mettra à jour verified automatiquement

    console.log(`✅ Téléphone vérifié pour ${user.email}`);
    
    res.json({
      success: true,
      message: 'Téléphone vérifié avec succès',
      user: {
        id: user._id,
        pseudo: user.pseudo,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification téléphone:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/verification/status
 * Obtenir le statut de vérification de l'utilisateur
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('pseudo email phone emailVerified phoneVerified verified');
    
    res.json({
      success: true,
      verification: {
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        verified: user.verified,
        hasPhone: !!user.phone
      }
    });
  } catch (error) {
    console.error('❌ Erreur statut vérification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
