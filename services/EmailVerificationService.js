/**
 * 📧 SERVICE DE VÉRIFICATION EMAIL - CADOK
 * Migration vers Resend (service moderne et fiable)
 */

const { Resend } = require('resend');
const crypto = require('crypto');

class EmailVerificationService {
  constructor() {
    // Configuration Resend (service moderne et fiable)
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_MPjtULoo_H5gBbvcN3UHCJAsrgA6eyKRC');
    this.fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Domaine vérifié par défaut
    
    console.log('📧 [EMAIL] Service Resend initialisé');
    console.log('📧 [EMAIL] From:', this.fromEmail);
  }

  /**
   * Générer un token de vérification sécurisé
   */
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Créer le lien de vérification
   */
  createVerificationLink(token) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/verify-email/${token}`;
  }

  /**
   * Envoyer email de vérification avec Resend
   */
  async sendVerificationEmail(user, token) {
    try {
      const verificationLink = this.createVerificationLink(token);
      
      const emailData = {
        from: this.fromEmail,
        to: user.email,
        subject: '🔐 Vérifiez votre adresse email - CADOK',
        html: this.getVerificationEmailTemplate(user.pseudo, verificationLink)
      };

      console.log('📧 [RESEND] Envoi email de vérification à:', user.email);
      const result = await this.resend.emails.send(emailData);
      
      console.log('✅ [RESEND] Email de vérification envoyé avec succès');
      console.log('📧 [RESEND] ID:', result.data?.id);
      
      return { 
        success: true, 
        messageId: result.data?.id || 'resend_success',
        service: 'Resend'
      };
      
    } catch (error) {
      console.error('❌ [RESEND] Erreur envoi email de vérification:', error);
      return { 
        success: false, 
        error: error.message,
        service: 'Resend'
      };
    }
  }

  /**
   * Template HTML pour l'email de vérification
   */
  getVerificationEmailTemplate(pseudo, verificationLink) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification Email - CADOK</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bienvenue ${pseudo} !</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Merci de nous avoir rejoint sur CADOK</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">📧 Vérifiez votre adresse email</h2>
          
          <p style="margin-bottom: 25px;">
            Pour finaliser votre inscription et accéder à toutes les fonctionnalités de CADOK, 
            veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              ✅ Vérifier mon email
            </a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>⏰ Important :</strong> Ce lien expire dans 24 heures pour votre sécurité.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">
            Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :<br>
            <span style="word-break: break-all; color: #667eea;">${verificationLink}</span>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            © 2025 CADOK - Plateforme d'échange et de troc<br>
            Cet email a été envoyé via <strong>Resend</strong> 🚀
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envoyer email de confirmation après vérification
   */
  async sendWelcomeEmail(user) {
    try {
      const emailData = {
        from: this.fromEmail,
        to: user.email,
        subject: '🎉 Bienvenue sur CADOK !',
        html: this.getWelcomeEmailTemplate(user.pseudo)
      };

      console.log('📧 [RESEND] Envoi email de bienvenue à:', user.email);
      const result = await this.resend.emails.send(emailData);
      
      console.log('✅ [RESEND] Email de bienvenue envoyé avec succès');
      return { 
        success: true, 
        messageId: result.data?.id || 'resend_welcome_success',
        service: 'Resend'
      };
      
    } catch (error) {
      console.error('❌ [RESEND] Erreur envoi email de bienvenue:', error);
      return { 
        success: false, 
        error: error.message,
        service: 'Resend'
      };
    }
  }

  /**
   * Template HTML pour l'email de bienvenue
   */
  getWelcomeEmailTemplate(pseudo) {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue - CADOK</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Félicitations ${pseudo} !</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Votre compte CADOK est maintenant actif</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">✅ Email vérifié avec succès !</h2>
          
          <p>
            Votre adresse email a été vérifiée et votre compte CADOK est maintenant actif ! 
            Vous pouvez désormais profiter de toutes nos fonctionnalités :
          </p>
          
          <ul style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <li style="margin: 8px 0;">🔄 <strong>Échanger</strong> vos objets avec la communauté</li>
            <li style="margin: 8px 0;">🎯 <strong>Trouver</strong> des objets qui vous intéressent</li>
            <li style="margin: 8px 0;">💬 <strong>Discuter</strong> avec d'autres membres</li>
            <li style="margin: 8px 0;">⭐ <strong>Noter</strong> vos expériences d'échange</li>
          </ul>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;">
              <strong>Prochaine étape :</strong> Vérifiez votre numéro de téléphone 📱 pour sécuriser davantage votre compte
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            © 2025 CADOK - Plateforme d'échange et de troc<br>
            Email envoyé via <strong>Resend</strong> 🚀
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailVerificationService;
