/**
 * 📱 ROUTES DE VÉRIFICATION SMS - CADOK
 * Système complet avec codes de test en développement
 */

const express = require('express');
const SMSVerificationService = require('../services/SMSVerificationService');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const SecurityMiddleware = require('../middleware/security');

const router = express.Router();
const smsService = new SMSVerificationService();

// 🛡️ Limiteur de requêtes pour SMS
const smsLimiter = SecurityMiddleware.createSMSRateLimit();

/**
 * 📱 ENVOYER CODE DE VÉRIFICATION SMS
 * POST /api/sms/send-verification
 */
router.post('/send-verification', smsLimiter, async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;

    // Validation des paramètres
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone requis',
        code: 'PHONE_REQUIRED'
      });
    }

    // Générer le code de vérification
    const verificationCode = smsService.generateVerificationCode();
    
    console.log(`📱 [SMS] Génération code pour ${phoneNumber}: ${verificationCode}`);

    // Envoyer le SMS
    const smsResult = await smsService.sendSMS(phoneNumber, verificationCode);

    if (smsResult.success) {
      // Stocker le code dans la session ou base de données temporairement
      // Pour cette démo, on va utiliser un cache simple en mémoire
      if (!global.smsVerificationCodes) {
        global.smsVerificationCodes = new Map();
      }
      
      // Stocker avec expiration (5 minutes)
      const codeData = {
        code: verificationCode,
        phone: phoneNumber,
        userId: userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      };
      
      global.smsVerificationCodes.set(phoneNumber, codeData);
      
      // En mode développement, inclure le code dans la réponse
      const responseData = {
        success: true,
        message: 'Code de vérification envoyé avec succès',
        messageId: smsResult.messageId,
        phone: phoneNumber
      };
      
      // 🧪 EN MODE TEST : inclure le code dans la réponse
      if (smsService.isDevelopment) {
        responseData.developmentCode = verificationCode;
        responseData.testInfo = {
          mode: 'development',
          fixedCodes: ['123456', '000000', '999999', '111111', '555555'],
          message: 'En mode test, vous pouvez utiliser n\'importe quel code de test fixe'
        };
      }

      res.json(responseData);
      
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du SMS',
        error: smsResult.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur envoi code SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du SMS',
      error: error.message
    });
  }
});

/**
 * 📱 VÉRIFIER CODE SMS
 * POST /api/sms/verify-code
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code, userId } = req.body;

    // Validation des paramètres
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone et code requis',
        code: 'MISSING_PARAMETERS'
      });
    }

    console.log(`📱 [SMS] Vérification code ${code} pour ${phoneNumber}`);

    // 🧪 MODE DÉVELOPPEMENT : Vérifier les codes de test fixes
    if (smsService.isDevelopment && smsService.isValidTestCode(code)) {
      console.log('📱 [SMS DEV] Code de test valide accepté');
      
      // Marquer le téléphone comme vérifié si userId fourni
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.phoneVerified = true;
          user.phoneVerifiedAt = new Date();
          await user.save();
          console.log(`📱 [SMS DEV] Téléphone ${phoneNumber} marqué comme vérifié pour l'utilisateur ${userId}`);
        }
      }
      
      return res.json({
        success: true,
        message: 'Code de test valide - Téléphone vérifié',
        verified: true,
        isTestCode: true,
        testInfo: {
          mode: 'development',
          message: 'Code de test accepté en mode développement'
        }
      });
    }

    // MODE PRODUCTION : Vérifier le code stocké
    if (!global.smsVerificationCodes) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de vérification trouvé pour ce numéro',
        code: 'NO_CODE_FOUND'
      });
    }

    const storedCodeData = global.smsVerificationCodes.get(phoneNumber);
    
    if (!storedCodeData) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de vérification trouvé pour ce numéro',
        code: 'NO_CODE_FOUND'
      });
    }

    // Vérifier l'expiration
    if (new Date() > storedCodeData.expiresAt) {
      global.smsVerificationCodes.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'Code de vérification expiré',
        code: 'CODE_EXPIRED'
      });
    }

    // Vérifier le code
    if (storedCodeData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification invalide',
        code: 'INVALID_CODE'
      });
    }

    // Code valide ! Supprimer de la mémoire et marquer comme vérifié
    global.smsVerificationCodes.delete(phoneNumber);
    
    // Marquer le téléphone comme vérifié si userId fourni
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.phoneVerified = true;
        user.phoneVerifiedAt = new Date();
        await user.save();
        console.log(`📱 [SMS] Téléphone ${phoneNumber} vérifié pour l'utilisateur ${userId}`);
      }
    }

    res.json({
      success: true,
      message: 'Téléphone vérifié avec succès',
      verified: true,
      verifiedAt: new Date()
    });

  } catch (error) {
    console.error('❌ Erreur vérification code SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification',
      error: error.message
    });
  }
});

/**
 * 🧪 CODES DE TEST (mode développement uniquement)
 * GET /api/sms/test-codes
 */
router.get('/test-codes', (req, res) => {
  if (!smsService.isDevelopment) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint disponible uniquement en mode développement'
    });
  }

  res.json({
    success: true,
    developmentMode: true,
    message: 'Codes de test disponibles pour le développement',
    testCodes: [
      { code: '123456', description: 'Code de test principal' },
      { code: '000000', description: 'Code de test alternatif' },
      { code: '999999', description: 'Code de test admin' },
      { code: '111111', description: 'Code de test rapide' },
      { code: '555555', description: 'Code de test démo' }
    ],
    usage: {
      sendSMS: 'POST /api/sms/send-verification',
      verifyCode: 'POST /api/sms/verify-code',
      note: 'En mode développement, tous les codes de test sont acceptés automatiquement'
    }
  });
});

module.exports = router;
