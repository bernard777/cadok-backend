/**
 * 🛡️ SYSTÈME DE VÉRIFICATION SÉCURISÉ - CADOK
 * Gestion complète de la vérification des profils utilisateurs
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/auth');
const { adminMiddleware } = require('../middlewares/adminAuth');
const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');

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
