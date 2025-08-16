/**
 * 📧 SERVICE EMAIL UNIFIÉ CADOK
 * ==============================
 * 
 * Template unique basé sur CadokEmailTemplates.js
 * Mode hybride : Essaie Resend → Fallback Simulation si erreur
 */

// Chargement des variables d'environnement
require('dotenv').config();

const { Resend } = require('resend');
const crypto = require('crypto');
const CadokEmailTemplates = require('./CadokEmailTemplates');

class EmailVerificationService {
  constructor() {
    // Configuration Resend
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_MPjtULoo_H5gBbvcN3UHCJAsrgA6eyKRC');
    this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    
    // Mode hybride : toujours essayer Resend d'abord, puis fallback si erreur
    this.isHybridMode = true;
    this.allowedTestEmail = 'ndongoambassa7@gmail.com'; // Email autorisé par Resend
    
    console.log('🔄 [HYBRIDE] Service Email en mode hybride initialisé');
    console.log('📧 [HYBRIDE] From:', this.fromEmail);
    console.log('📧 [HYBRIDE] Email autorisé Resend:', this.allowedTestEmail);
    
    // Cache des emails (simulés et réels)
    this.emailCache = [];
  }

  /**
   * Détecter si un email peut être envoyé via Resend (mode gratuit)
   */
  canSendViaResend(email) {
    return email === this.allowedTestEmail;
  }

  /**
   * Simulation d'envoi email avec cache
   */
  simulateEmailSend(emailData, type = 'unknown', reason = 'simulation') {
    const simulatedEmail = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      type: type,
      reason: reason,
      timestamp: new Date().toISOString(),
      status: 'simulated_success',
      mode: 'simulation'
    };
    
    this.emailCache.push(simulatedEmail);
    
    console.log(`📧 [SIMULATION] Email simulé (${reason}):`, {
      id: simulatedEmail.id,
      to: emailData.to,
      type: type
    });
    
    return {
      data: { id: simulatedEmail.id },
      error: null
    };
  }

  /**
   * Envoi réel via Resend avec gestion d'erreur
   */
  async sendViaResend(emailData, type = 'unknown') {
    try {
      console.log(`📧 [RESEND] Tentative d'envoi réel vers: ${emailData.to}`);
      
      const result = await this.resend.emails.send(emailData);
      
      if (result.error) {
        console.log(`⚠️ [RESEND] Erreur API: ${result.error.error || JSON.stringify(result.error)}`);
        return { success: false, error: result.error, needsFallback: true };
      }
      
      // Succès - stocker dans le cache aussi
      const realEmail = {
        id: result.data.id,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        type: type,
        timestamp: new Date().toISOString(),
        status: 'sent_success',
        mode: 'real'
      };
      
      this.emailCache.push(realEmail);
      
      console.log(`✅ [RESEND] Email envoyé avec succès: ${result.data.id}`);
      return { 
        success: true, 
        result: result,
        messageId: result.data.id 
      };
      
    } catch (error) {
      console.log(`❌ [RESEND] Erreur technique: ${error.message}`);
      return { success: false, error: error.message, needsFallback: true };
    }
  }

  /**
   * MÉTHODE PRINCIPALE : Envoi email avec mode hybride
   * 1. Essaie Resend si email autorisé
   * 2. Sinon ou si erreur → Simulation automatique
   */
  async sendWelcomeEmail(emailOrUser, pseudo = null) {
    try {
      // Support des deux signatures : sendWelcomeEmail(email, pseudo) et sendWelcomeEmail(userObject)
      const email = typeof emailOrUser === 'string' ? emailOrUser : emailOrUser.email;
      const userPseudo = pseudo || (typeof emailOrUser === 'object' ? emailOrUser.pseudo : 'Utilisateur');

      const emailData = {
        from: this.fromEmail,
        to: email,
        subject: '🎉 Bienvenue sur CADOK !',
        html: CadokEmailTemplates.getWelcomeTemplate(userPseudo, 'https://cadok.com/login')
      };

      console.log(`\n🔄 [HYBRIDE] Traitement email pour: ${email} (${userPseudo})`);
      
      // ÉTAPE 1 : Vérifier si on peut envoyer via Resend
      if (this.canSendViaResend(email)) {
        console.log('✅ [HYBRIDE] Email autorisé pour Resend - tentative d\'envoi réel...');
        
        const resendResult = await this.sendViaResend(emailData, 'welcome');
        
        if (resendResult.success) {
          return {
            success: true,
            messageId: resendResult.messageId,
            mode: 'real',
            service: 'Resend',
            email: email
          };
        } else {
          console.log('⚠️ [HYBRIDE] Échec Resend - basculement en simulation...');
          // Fallback vers simulation
          const simResult = this.simulateEmailSend(emailData, 'welcome', 'resend_fallback');
          return {
            success: true,
            messageId: simResult.data.id,
            mode: 'simulation_fallback',
            originalError: resendResult.error,
            service: 'Resend → Simulation',
            email: email
          };
        }
      } else {
        // ÉTAPE 2 : Email non autorisé → Simulation directe
        console.log('🔄 [HYBRIDE] Email non autorisé par Resend - simulation directe...');
        const simResult = this.simulateEmailSend(emailData, 'welcome', 'email_restriction');
        
        return {
          success: true,
          messageId: simResult.data.id,
          mode: 'simulation_direct',
          reason: 'Email non autorisé par Resend (mode gratuit)',
          service: 'Simulation',
          email: email
        };
      }
      
    } catch (error) {
      console.error('❌ [HYBRIDE] Erreur critique dans sendWelcomeEmail:', error);
      return {
        success: false,
        error: error.message,
        service: 'Hybride'
      };
    }
  }

  /**
   * Récupérer l'historique des emails (réels + simulés)
   */
  getEmailHistory(email = null, type = null) {
    let history = [...this.emailCache];
    
    if (email) {
      history = history.filter(e => e.to === email);
    }
    
    if (type) {
      history = history.filter(e => e.type === type);
    }
    
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Statistiques du service hybride
   */
  getStats() {
    const total = this.emailCache.length;
    const real = this.emailCache.filter(e => e.mode === 'real').length;
    const simulated = this.emailCache.filter(e => e.mode === 'simulation').length;
    
    return {
      total,
      real,
      simulated,
      realPercentage: total > 0 ? Math.round((real / total) * 100) : 0,
      simulatedPercentage: total > 0 ? Math.round((simulated / total) * 100) : 0
    };
  }

  /**
   * Vider le cache (utile pour les tests)
   */
  clearCache() {
    this.emailCache = [];
    console.log('🗑️ [HYBRIDE] Cache des emails vidé');
  }

  /**
   * Template email de bienvenue CADOK
   */
  getWelcomeEmailTemplate(pseudo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur CADOK !</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header CADOK -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #022601;">
            <h1 style="color: #022601; font-size: 36px; margin: 0; font-weight: bold;">
              🏆 CADOK
            </h1>
            <p style="color: #2E7D32; margin: 8px 0 0 0; font-size: 16px; font-weight: 600;">
              Plateforme d'échange et de troc
            </p>
          </div>
          
          <!-- Message principal -->
          <div style="text-align: center; margin-bottom: 35px;">
            <h2 style="color: #022601; font-size: 32px; margin-bottom: 20px; font-weight: bold;">
              🎉 Bienvenue ${pseudo} !
            </h2>
            
            <div style="background: linear-gradient(135deg, #022601, #2E7D32); color: white; padding: 25px; border-radius: 12px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; font-size: 22px;">✅ Votre compte a été créé avec succès !</h3>
              <p style="margin: 0; font-size: 18px; opacity: 0.95;">
                Vous faites maintenant partie de la <strong>communauté CADOK</strong> 🌟
              </p>
            </div>
          </div>
          
          <!-- Note importante -->
          <div style="background-color: #fff3cd; border: 2px solid #FF8F00; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div style="text-align: center;">
              <span style="font-size: 28px; color: #FF8F00;">⚠️</span>
              <h4 style="color: #022601; margin: 10px 0; font-size: 16px;">
                Compte en cours d'activation
              </h4>
              <p style="margin: 0; color: #2E7D32; font-size: 14px; line-height: 1.5;">
                Votre compte sera <strong>pleinement actif</strong> une fois que vous aurez vérifié 
                votre <strong>email</strong> et votre <strong>numéro de téléphone</strong>.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <hr style="border: none; border-top: 2px solid #2E7D32; margin: 40px 0;">
          <div style="text-align: center; padding: 20px; background-color: #022601; border-radius: 8px;">
            <p style="color: white; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong style="color: #FF8F00;">© 2025 CADOK</strong><br>
              <span style="color: #E8F5E8;">Plateforme d'échange et de troc éco-responsable</span><br>
              <em style="color: #E8F5E8; font-size: 12px;">
                Compte créé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
              </em>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Générer un token de vérification avec code à 6 chiffres
   */
  generateVerificationToken() {
    // Générer token principal (pour le lien)
    const mainToken = crypto.randomBytes(32).toString('hex');
    
    // Générer code à 6 chiffres pour saisie manuelle
    const sixDigitCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Retourner le token avec le code à 6 chiffres à la fin
    return mainToken + sixDigitCode;
  }

  /**
   * Créer le lien de vérification
   */
  createVerificationLink(token) {
    const baseUrl = process.env.FRONTEND_URL || 'http://192.168.1.16:5000';
    return `${baseUrl}/verify-email/${token}`;
  }

  /**
   * Envoyer email de vérification (mode hybride aussi)
   */
  async sendVerificationEmail(user, token) {
    try {
      const verificationLink = this.createVerificationLink(token);
      
      const emailData = {
        from: this.fromEmail,
        to: user.email,
        subject: '✅ Vérifiez votre email - KADOC',
        html: CadokEmailTemplates.getVerificationTemplate(user.pseudo, token.slice(-6), verificationLink, user.email)
      };

      console.log(`\n🔄 [HYBRIDE] Email de vérification pour: ${user.email}`);
      
      if (this.canSendViaResend(user.email)) {
        const resendResult = await this.sendViaResend(emailData, 'verification');
        
        if (resendResult.success) {
          return {
            success: true,
            messageId: resendResult.messageId,
            mode: 'real',
            service: 'Resend'
          };
        } else {
          const simResult = this.simulateEmailSend(emailData, 'verification', 'resend_fallback');
          return {
            success: true,
            messageId: simResult.data.id,
            mode: 'simulation_fallback',
            service: 'Resend → Simulation'
          };
        }
      } else {
        const simResult = this.simulateEmailSend(emailData, 'verification', 'email_restriction');
        return {
          success: true,
          messageId: simResult.data.id,
          mode: 'simulation_direct',
          service: 'Simulation'
        };
      }
      
    } catch (error) {
      console.error('❌ [HYBRIDE] Erreur envoi email de vérification:', error);
      return {
        success: false,
        error: error.message,
        service: 'Hybride'
      };
    }
  }

    /**
   * TEMPLATES UNIFIÉS
   * =================
   * 
   * Tous les templates ont été déplacés vers CadokEmailTemplates.js
   * pour maintenir la cohérence visuelle et éviter les confusions.
   * 
   * Design de référence : EmailTemplates.js (2-email-templates-verification)
   */
}

module.exports = EmailVerificationService;