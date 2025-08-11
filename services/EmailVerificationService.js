/**
 * 📧 SERVICE DE VÉRIFICATION EMAIL - CADOK
 * Gestion des emails de vérification et confirmation
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailVerificationService {
  constructor() {
    // Configuration avec un service email gratuit (Gmail, Outlook, etc.)
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Ou votre service préféré
      auth: {
        user: process.env.EMAIL_USER || 'votre-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'votre-mot-de-passe-app'
      }
    });
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
   * Envoyer email de vérification
   */
  async sendVerificationEmail(user, token) {
    try {
      const verificationLink = this.createVerificationLink(token);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@cadok.app',
        to: user.email,
        subject: '🔐 Vérifiez votre adresse email - CADOK',
        html: this.getVerificationEmailTemplate(user.pseudo, verificationLink)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de vérification envoyé à ${user.email}`);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Erreur envoi email de vérification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Template HTML pour l'email de vérification
   */
  getVerificationEmailTemplate(pseudo, verificationLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Vérification Email - CADOK</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #022601; margin: 0;">🔐 CADOK</h1>
            <p style="color: #666; margin: 5px 0;">Plateforme d'échange et de troc</p>
          </div>

          <h2 style="color: #FF8F00;">Bonjour ${pseudo} ! 👋</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Bienvenue sur CADOK ! Pour finaliser votre inscription et accéder à toutes les fonctionnalités, 
            veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #FF8F00; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              ✅ Vérifier mon email
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            <strong>Ce lien expire dans 24 heures.</strong><br>
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
            <a href="${verificationLink}" style="color: #FF8F00; word-break: break-all;">
              ${verificationLink}
            </a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Cet email a été envoyé automatiquement. Merci de ne pas y répondre.<br>
            © 2025 CADOK - Plateforme d'échange et de troc
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
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@cadok.app',
        to: user.email,
        subject: '🎉 Bienvenue sur CADOK !',
        html: this.getWelcomeEmailTemplate(user.pseudo)
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erreur envoi email de bienvenue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Template HTML pour l'email de bienvenue
   */
  getWelcomeEmailTemplate(pseudo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenue - CADOK</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 30px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #022601; margin: 0;">🎉 CADOK</h1>
            <p style="color: #666; margin: 5px 0;">Plateforme d'échange et de troc</p>
          </div>

          <h2 style="color: #FF8F00;">Félicitations ${pseudo} ! 🎊</h2>
          
          <p style="color: #333; line-height: 1.6;">
            Votre email a été vérifié avec succès ! Vous pouvez maintenant profiter de toutes 
            les fonctionnalités de CADOK :
          </p>

          <ul style="color: #333; line-height: 1.8;">
            <li>📱 Publier vos objets à échanger</li>
            <li>🔍 Rechercher des objets qui vous intéressent</li>
            <li>💬 Échanger avec la communauté</li>
            <li>⭐ Évaluer vos échanges</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">
              <strong>Prochaine étape :</strong> Vérifiez votre numéro de téléphone 📱
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 CADOK - Plateforme d'échange et de troc
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = EmailVerificationService;
