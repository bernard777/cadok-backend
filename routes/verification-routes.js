/**
 * ROUTES DE VÉRIFICATION KADOC
 * ============================
 * 
 * Configuration des routes pour servir les pages de vérification
 * avec le thème KADOC unifié
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// Middleware pour servir les pages statiques de vérification
router.use('/verification', express.static(path.join(__dirname, '../../public/verification')));

/**
 * Routes de vérification avec redirections intelligentes
 */

// Page principale de vérification (redirige selon le contexte)
router.get('/verify', (req, res) => {
  const { type, email, phone } = req.query;
  
  if (type === 'email' && email) {
    return res.redirect(`/verification/email.html?email=${encodeURIComponent(email)}`);
  }
  
  if (type === 'sms' && phone) {
    return res.redirect(`/verification/sms.html?phone=${encodeURIComponent(phone)}`);
  }
  
  // Par défaut, rediriger vers la page d'accueil des vérifications
  res.redirect('/verification/index.html');
});

// Route de vérification email avec paramètres
router.get('/verify-email', (req, res) => {
  const { email, code } = req.query;
  
  if (email) {
    let url = `/verification/email.html?email=${encodeURIComponent(email)}`;
    if (code) {
      url += `&code=${encodeURIComponent(code)}`;
    }
    return res.redirect(url);
  }
  
  res.redirect('/verification/email.html');
});

// Route de vérification SMS avec paramètres
router.get('/verify-sms', (req, res) => {
  const { phone, code } = req.query;
  
  if (phone) {
    let url = `/verification/sms.html?phone=${encodeURIComponent(phone)}`;
    if (code) {
      url += `&code=${encodeURIComponent(code)}`;
    }
    return res.redirect(url);
  }
  
  res.redirect('/verification/sms.html');
});

// Routes de statut
router.get('/verify-success', (req, res) => {
  const { type } = req.query;
  res.redirect(`/verification/success.html?type=${type || 'complete'}`);
});

router.get('/verify-error', (req, res) => {
  const { error } = req.query;
  res.redirect(`/verification/error.html?error=${error || 'unknown'}`);
});

router.get('/verify-pending', (req, res) => {
  res.redirect('/verification/pending.html');
});

/**
 * API Routes pour les vérifications (à connecter avec le système existant)
 */

// Vérifier un code email
router.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email et code requis'
      });
    }
    
    // TODO: Intégrer avec EmailVerificationService
    // const verified = await EmailVerificationService.verifyCode(email, code);
    
    // Simulation pour les tests
    if (code === '123456') {
      res.json({
        success: true,
        message: 'Email vérifié avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Code incorrect ou expiré'
      });
    }
    
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Vérifier un code SMS
router.post('/api/auth/verify-sms', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Téléphone et code requis'
      });
    }
    
    // TODO: Intégrer avec SMSVerificationService
    // const verified = await SMSVerificationService.verifyCode(phone, code);
    
    // Simulation pour les tests
    if (code === '123456') {
      res.json({
        success: true,
        message: 'Téléphone vérifié avec succès'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Code incorrect ou expiré'
      });
    }
    
  } catch (error) {
    console.error('Erreur vérification SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Renvoyer code de vérification email
router.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }
    
    // TODO: Intégrer avec EmailVerificationService
    // await EmailVerificationService.sendVerificationCode(email);
    
    res.json({
      success: true,
      message: 'Code de vérification renvoyé'
    });
    
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi'
    });
  }
});

// Renvoyer code SMS
router.post('/api/auth/resend-sms', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Téléphone requis'
      });
    }
    
    // TODO: Intégrer avec SMSVerificationService
    // await SMSVerificationService.sendVerificationCode(phone);
    
    res.json({
      success: true,
      message: 'Code SMS renvoyé'
    });
    
  } catch (error) {
    console.error('Erreur renvoi SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi'
    });
  }
});

// Vérifier le statut de vérification
router.get('/api/auth/verification-status', async (req, res) => {
  try {
    // TODO: Vérifier le statut réel de l'utilisateur
    // const user = await User.findById(req.user.id);
    
    res.json({
      verified: false, // Remplacer par la vraie vérification
      email_verified: false,
      phone_verified: false
    });
    
  } catch (error) {
    console.error('Erreur statut vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
