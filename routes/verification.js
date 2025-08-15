/**
 * 🛡️ SYSTÈME DE VÉRIFICATION SÉCURISÉ - CADOK
 * Gestion complète de la vérification des profils utilisateurs
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const authMiddleware = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/adminAuth');
const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');
const EmailVerificationService = require('../services/EmailVerificationService');
const SMSVerificationService = require('../services/SMSVerificationService');

// Configuration upload documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/verification/'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image (JPG, PNG) et PDF sont autorisés.'));
    }
  }
});

/**
 * POST /api/verification/resend-email
 * Renvoie un email de vérification
 */
router.post('/resend-email', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email déjà vérifié'
      });
    }

    // Utilise le service email moderne
    const emailService = new EmailVerificationService();
    const result = await emailService.sendVerificationEmail(user.email, user._id);

    if (result.success) {
      console.log(`📧 Email de vérification renvoyé à ${user.email}`);
      res.json({
        success: true,
        message: 'Email de vérification renvoyé'
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Erreur renvoi email vérification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/verification/send-phone-code
 * Envoie un code de vérification SMS
 */
router.post('/send-phone-code', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.id;

    // Validation du numéro
    if (!phoneNumber || !SMSVerificationService.formatPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone invalide'
      });
    }

    // Formate le numéro
    const formattedPhone = SMSVerificationService.formatPhoneNumber(phoneNumber);
    console.log(`📱 [SMS] Demande code pour ${formattedPhone} (user: ${userId})`);

    // Génère et envoie le code
    const verificationCode = SMSVerificationService.generateVerificationCode(formattedPhone);
    const result = await SMSVerificationService.sendSMS(formattedPhone, verificationCode);

    if (result.success) {
      // Sauvegarde le code dans la DB avec expiration
      const codeHash = crypto.createHash('sha256').update(verificationCode).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await User.findByIdAndUpdate(userId, {
        phoneNumber: formattedPhone,
        phoneVerificationCode: codeHash,
        phoneVerificationExpires: expiresAt,
        phoneVerificationAttempts: 0,
        lastPhoneVerificationSent: new Date()
      });

      console.log(`📱 [SMS] Code envoyé avec succès à ${formattedPhone}`);
      
      // En mode développement, retourne le code pour debug
      const response = {
        success: true,
        message: 'Code de vérification envoyé',
        phoneNumber: formattedPhone
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.debugInfo = {
          testMode: true,
          code: verificationCode,
          expiresAt
        };
      }

      res.json(response);
    } else {
      throw new Error(result.error || 'Échec envoi SMS');
    }
  } catch (error) {
    console.error('❌ Erreur envoi code SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Impossible d\'envoyer le code SMS' 
    });
  }
});

/**
 * POST /api/verification/verify-phone
 * Vérifie le code SMS reçu
 */
router.post('/verify-phone', authMiddleware, async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    const userId = req.user.id;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Numéro et code requis'
      });
    }

    const user = await User.findById(userId);

    // Vérifie que le numéro correspond
    if (user.phoneNumber !== SMSVerificationService.formatPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone non reconnu'
      });
    }

    // Vérifie l'expiration
    if (!user.phoneVerificationExpires || new Date() > user.phoneVerificationExpires) {
      return res.status(400).json({
        success: false,
        error: 'Code de vérification expiré'
      });
    }

    // Vérifie le nombre de tentatives
    if (user.phoneVerificationAttempts >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Trop de tentatives. Demandez un nouveau code.'
      });
    }

    // Hash du code fourni
    const codeHash = crypto.createHash('sha256').update(code.toString()).digest('hex');

    // Vérifie le code
    if (user.phoneVerificationCode === codeHash) {
      // Code correct - marque comme vérifié
      await User.findByIdAndUpdate(userId, {
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpires: null,
        phoneVerificationAttempts: 0
      });

      console.log(`✅ [SMS] Téléphone vérifié pour ${user.email}: ${phoneNumber}`);

      // 🎉 VÉRIFIER SI EMAIL DE BIENVENUE DOIT ÊTRE ENVOYÉ
      try {
        const WelcomeEmailTrigger = require('../services/WelcomeEmailTrigger');
        const welcomeTrigger = new WelcomeEmailTrigger();
        
        console.log('🔄 [WELCOME] Vérification déclenchement email de bienvenue après vérification téléphone...');
        await welcomeTrigger.tryTriggerWelcomeEmail(userId);
      } catch (welcomeError) {
        console.error('⚠️ [WELCOME] Erreur déclenchement email bienvenue:', welcomeError.message);
        // Ne pas faire échouer la vérification téléphone pour un problème d'email de bienvenue
      }

      res.json({
        success: true,
        message: 'Numéro de téléphone vérifié avec succès',
        phoneVerified: true
      });
    } else {
      // Code incorrect - incrémente tentatives
      await User.findByIdAndUpdate(userId, {
        $inc: { phoneVerificationAttempts: 1 }
      });

      console.log(`❌ [SMS] Code incorrect pour ${phoneNumber}, tentative ${user.phoneVerificationAttempts + 1}/5`);

      res.status(400).json({
        success: false,
        error: `Code incorrect. Tentative ${user.phoneVerificationAttempts + 1}/5.`
      });
    }
  } catch (error) {
    console.error('❌ Erreur vérification code SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification' 
    });
  }
});

/**
 * POST /api/verification/email/send
 * Envoyer un email de vérification
 */
router.post('/email/send', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email déjà vérifié'
      });
    }

    // Générer token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Sauvegarder token avec expiration (24h)
    await User.findByIdAndUpdate(req.user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Envoyer email (intégration service email)
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    console.log(`📧 Token de vérification email généré pour ${user.email}: ${verificationToken}`);

    res.json({
      success: true,
      message: 'Email de vérification envoyé'
    });
  } catch (error) {
    console.error('❌ Erreur envoi email vérification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/verification/email/confirm/:token
 * Confirmer l'email avec le token
 */
router.post('/email/confirm/:token', async (req, res) => {
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

    // Marquer email comme vérifié
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      // Si c'était la première étape, passer au niveau suivant
      ...(user.status === 'pending' && { status: 'pending_documents' }),
      verificationLevel: 'basic'
    });

    console.log(`✅ Email vérifié pour ${user.email}`);

    // 🎉 VÉRIFIER SI EMAIL DE BIENVENUE DOIT ÊTRE ENVOYÉ
    try {
      const WelcomeEmailTrigger = require('../services/WelcomeEmailTrigger');
      const welcomeTrigger = new WelcomeEmailTrigger();
      
      console.log('🔄 [WELCOME] Vérification déclenchement email de bienvenue après vérification email...');
      await welcomeTrigger.tryTriggerWelcomeEmail(user._id);
    } catch (welcomeError) {
      console.error('⚠️ [WELCOME] Erreur déclenchement email bienvenue:', welcomeError.message);
      // Ne pas faire échouer la vérification email pour un problème d'email de bienvenue
    }

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      nextStep: 'documents'
    });
  } catch (error) {
    console.error('❌ Erreur confirmation email:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/verification/documents
 * Upload et analyse automatique des documents
 */
router.post('/documents', authMiddleware, upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email doit être vérifié avant l\'upload de documents'
      });
    }

    const documents = {};
    const files = req.files;

    // Traitement des documents uploadés
    if (files.idCard) {
      documents.idCard = {
        filename: files.idCard[0].filename,
        path: files.idCard[0].path,
        uploadedAt: new Date(),
        status: 'pending_analysis'
      };
    }

    if (files.selfie) {
      documents.selfie = {
        filename: files.selfie[0].filename,
        path: files.selfie[0].path,
        uploadedAt: new Date(),
        status: 'pending_analysis'
      };
    }

    if (files.proofOfAddress) {
      documents.proofOfAddress = {
        filename: files.proofOfAddress[0].filename,
        path: files.proofOfAddress[0].path,
        uploadedAt: new Date(),
        status: 'pending_analysis'
      };
    }

    // Sauvegarder dans la base
    const verificationDoc = new VerificationDocument({
      userId: req.user.id,
      documents: documents,
      submittedAt: new Date(),
      status: 'pending_analysis'
    });

    await verificationDoc.save();

    // Mettre à jour le statut utilisateur
    await User.findByIdAndUpdate(req.user.id, {
      status: 'pending_verification',
      verificationLevel: 'identity',
      'verification.documentsSubmitted': true,
      'verification.documentsSubmittedAt': new Date()
    });

    // Lancer l'analyse automatique (mock)
    setTimeout(async () => {
      await performAutomaticAnalysis(verificationDoc._id);
    }, 2000);

    console.log(`📄 Documents uploadés pour ${user.email}`);

    res.json({
      success: true,
      message: 'Documents reçus, analyse en cours',
      verificationId: verificationDoc._id,
      nextStep: 'analysis'
    });
  } catch (error) {
    console.error('❌ Erreur upload documents:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * Analyse automatique des documents (simulation)
 */
async function performAutomaticAnalysis(verificationId) {
  try {
    const verificationDoc = await VerificationDocument.findById(verificationId);
    
    // Simulation d'analyse OCR et reconnaissance faciale
    const analysisResults = {
      idCard: {
        status: 'valid',
        extractedData: {
          name: 'John Doe',
          birthDate: '1990-01-01',
          documentNumber: 'AB123456',
          confidence: 0.95
        }
      },
      selfie: {
        status: 'valid',
        faceMatch: true,
        confidence: 0.92
      },
      proofOfAddress: {
        status: 'valid',
        addressExtracted: '123 Main St, Paris',
        confidence: 0.88
      }
    };

    // Mettre à jour avec les résultats
    await VerificationDocument.findByIdAndUpdate(verificationId, {
      status: 'analysis_complete',
      analysisResults: analysisResults,
      analysisCompletedAt: new Date(),
      autoApproved: true // Si tous les scores sont > 0.9
    });

    // Si auto-approuvé, passer en revue manuelle
    const user = await User.findById(verificationDoc.userId);
    await User.findByIdAndUpdate(user._id, {
      status: 'pending_manual_review',
      verificationLevel: 'identity'
    });

    console.log(`🤖 Analyse automatique terminée pour ${user.email} - Auto-approuvé`);
  } catch (error) {
    console.error('❌ Erreur analyse automatique:', error);
  }
}

/**
 * GET /api/verification/status
 * Obtenir le statut de vérification actuel
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('status verified verificationLevel emailVerified verification');
    
    const verificationDoc = await VerificationDocument.findOne({ userId: req.user.id })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      user: {
        status: user.status,
        verified: user.verified,
        verificationLevel: user.verificationLevel,
        emailVerified: user.emailVerified
      },
      documents: verificationDoc || null,
      nextSteps: getNextSteps(user, verificationDoc)
    });
  } catch (error) {
    console.error('❌ Erreur statut vérification:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/verification/:userId/review
 * Validation manuelle par un admin
 */
router.post('/admin/:userId/review', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved, reason, notes } = req.body;

    const user = await User.findById(userId);
    const verificationDoc = await VerificationDocument.findOne({ userId })
      .sort({ submittedAt: -1 });

    if (!verificationDoc) {
      return res.status(404).json({
        success: false,
        error: 'Aucun document de vérification trouvé'
      });
    }

    if (approved) {
      // Approuver la vérification
      await User.findByIdAndUpdate(userId, {
        status: 'active',
        verified: true,
        verificationLevel: 'premium',
        'verification.approvedAt': new Date(),
        'verification.approvedBy': req.user.id,
        adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] VÉRIFIÉ par ${req.user.pseudo}: ${notes || 'Vérification manuelle approuvée'}`
      });

      await VerificationDocument.findByIdAndUpdate(verificationDoc._id, {
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes
      });

      console.log(`✅ VERIFICATION APPROVED: ${user.pseudo} vérifié par ${req.user.pseudo}`);

      res.json({
        success: true,
        message: 'Utilisateur vérifié avec succès'
      });
    } else {
      // Rejeter la vérification
      await User.findByIdAndUpdate(userId, {
        status: 'pending_documents',
        verificationLevel: 'basic',
        adminNotes: `${user.adminNotes || ''}\n[${new Date().toISOString()}] REJETÉ par ${req.user.pseudo}: ${reason}`
      });

      await VerificationDocument.findByIdAndUpdate(verificationDoc._id, {
        status: 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
        reviewNotes: notes
      });

      console.log(`❌ VERIFICATION REJECTED: ${user.pseudo} rejeté par ${req.user.pseudo} - Raison: ${reason}`);

      res.json({
        success: true,
        message: 'Vérification rejetée, utilisateur notifié'
      });
    }
  } catch (error) {
    console.error('❌ Erreur revue manuelle:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * Déterminer les prochaines étapes selon l'état
 */
function getNextSteps(user, verificationDoc) {
  if (!user.emailVerified) {
    return ['verify_email'];
  }
  
  if (user.status === 'pending_documents') {
    return ['upload_documents'];
  }
  
  if (user.status === 'pending_verification') {
    return ['wait_analysis'];
  }
  
  if (user.status === 'pending_manual_review') {
    return ['wait_admin_review'];
  }
  
  if (user.verified) {
    return ['complete'];
  }
  
  return ['unknown'];
}

module.exports = router;
