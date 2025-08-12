/**
 * COURIER EMAIL SERVICE - VERSION CORRIGÉE
 * ========================================
 * 
 * Service d'email utilisant Courier.com avec templates HTML personnalisés
 */

require('dotenv').config();
const EmailTemplates = require('./EmailTemplates');

class CourierEmailService {
  constructor() {
    try {
      // Initialiser le client Courier
      const { CourierClient } = require('@trycourier/courier');
      
      const token = process.env.COURIER_AUTH_TOKEN;
      if (!token) {
        throw new Error('COURIER_AUTH_TOKEN non trouvé dans .env');
      }

      this.courier = new CourierClient({ 
        authorizationToken: token 
      });
      
      console.log('✅ CourierEmailService initialisé avec succès');
      console.log(`🔑 Token: ${token.substring(0, 15)}...`);
      
    } catch (error) {
      console.error('❌ Erreur initialisation Courier:', error.message);
      this.courier = null;
    }
  }

  /**
   * Envoi email générique avec support HTML/Text
   */
  async sendEmail({ to, subject, html, text = null, templateId = null, templateData = {} }) {
    try {
      if (!this.courier) {
        throw new Error('Service Courier non initialisé');
      }

      const message = {
        message: {
          to: {
            email: to
          }
        }
      };

      if (templateId) {
        // Utiliser un template Courier prédéfini
        message.message.template = templateId;
        message.message.data = templateData;
        console.log(`📧 Envoi via template Courier: ${templateId}`);
      } else {
        // Utiliser templates HTML personnalisés avec la bonne structure
        message.message.content = {
          version: "2022-01-01",
          elements: [
            {
              type: "meta",
              title: subject
            },
            {
              type: "html",
              content: html
            }
          ]
        };
        
        console.log('📧 Envoi via template HTML personnalisé (structure v2022-01-01)');
      }

      const { requestId } = await this.courier.send(message);
      
      console.log('✅ Email envoyé avec succès:', {
        to,
        subject: subject.substring(0, 40) + '...',
        messageId: requestId,
        method: templateId ? 'Template Courier' : 'HTML personnalisé'
      });

      return { 
        success: true, 
        messageId: requestId,
        method: templateId ? 'courier-template' : 'custom-html'
      };

    } catch (error) {
      console.error('❌ Erreur Courier:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue',
        method: templateId ? 'courier-template' : 'custom-html'
      };
    }
  }

  /**
   * Email de vérification avec design professionnel
   */
  async sendVerificationEmail(email, verificationCode, userName = 'Utilisateur') {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?code=${verificationCode}&email=${encodeURIComponent(email)}`;
    
    const htmlContent = EmailTemplates.getVerificationTemplate(
      userName,
      verificationCode,
      verificationUrl,
      email
    );

    const textContent = EmailTemplates.getVerificationTextTemplate(
      userName,
      verificationCode,
      verificationUrl
    );

    return this.sendEmail({
      to: email,
      subject: '🎉 Bienvenue sur KADOC - Vérifiez votre compte',
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Email de réinitialisation mot de passe
   */
  async sendPasswordResetEmail(email, resetToken, userName = 'Utilisateur') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const htmlContent = EmailTemplates.getPasswordResetTemplate(
      userName,
      resetToken,
      resetUrl,
      email
    );

    const textContent = EmailTemplates.getPasswordResetTextTemplate(
      userName,
      resetToken,
      resetUrl
    );

    return this.sendEmail({
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe KADOC',
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Email de bienvenue (après vérification réussie)
   */
  async sendWelcomeEmail(email, userName = 'Utilisateur') {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
    
    const htmlContent = EmailTemplates.getWelcomeTemplate(
      userName,
      dashboardUrl,
      email
    );

    return this.sendEmail({
      to: email,
      subject: '🎉 Bienvenue sur KADOC - Votre compte est activé !',
      html: htmlContent
    });
  }

  /**
   * Email de notification simple
   */
  async sendNotificationEmail(email, title, message, buttonText = null, buttonUrl = null) {
    const htmlContent = EmailTemplates.getSimpleTemplate(
      title,
      message,
      buttonText,
      buttonUrl
    );

    return this.sendEmail({
      to: email,
      subject: `🔔 ${title} - KADOC`,
      html: htmlContent
    });
  }

  /**
   * Utiliser un template Courier prédéfini
   */
  async sendEmailWithCourierTemplate(templateId, email, data = {}) {
    console.log(`📧 Utilisation template Courier: ${templateId}`);
    return this.sendEmail({
      to: email,
      templateId,
      templateData: data
    });
  }

  /**
   * Test complet des méthodes d'envoi
   */
  async testEmailMethods(testEmail) {
    console.log('🧪 === TEST DES MÉTHODES EMAIL COURIER ===\n');
    const results = [];

    try {
      // Test 1: Template de vérification
      console.log('📧 Test 1: Email de vérification...');
      const result1 = await this.sendVerificationEmail(testEmail, 'VERIFY123', 'Utilisateur Test');
      results.push({ 
        method: 'Vérification', 
        success: result1.success, 
        messageId: result1.messageId,
        error: result1.error || null
      });

      await this.delay(2000); // Pause entre envois

      // Test 2: Email de notification
      console.log('📧 Test 2: Email de notification...');
      const result2 = await this.sendNotificationEmail(
        testEmail, 
        'Test Notification', 
        'Ceci est un test de notification depuis KADOC avec Courier.',
        'Accéder à KADOC',
        'https://kadoc.com'
      );
      results.push({ 
        method: 'Notification', 
        success: result2.success, 
        messageId: result2.messageId,
        error: result2.error || null
      });

      await this.delay(2000);

      // Test 3: Email de réinitialisation
      console.log('📧 Test 3: Email de réinitialisation...');
      const result3 = await this.sendPasswordResetEmail(testEmail, 'RESET789', 'Utilisateur Test');
      results.push({ 
        method: 'Réinitialisation', 
        success: result3.success, 
        messageId: result3.messageId,
        error: result3.error || null
      });

      // Afficher les résultats
      console.log('\n📊 === RÉSULTATS DES TESTS ===\n');
      results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`${status} Test ${index + 1} (${result.method}):`);
        console.log(`   Succès: ${result.success ? 'Oui' : 'Non'}`);
        console.log(`   Message ID: ${result.messageId || 'N/A'}`);
        if (result.error) {
          console.log(`   Erreur: ${result.error}`);
        }
        console.log('');
      });

      return results;

    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
      return results;
    }
  }

  /**
   * Pause utilitaire
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vérifier la configuration
   */
  checkConfiguration() {
    console.log('🔍 === VÉRIFICATION CONFIGURATION ===\n');
    
    const config = {
      'Token Courier': process.env.COURIER_AUTH_TOKEN ? 'Configuré' : 'Manquant',
      'Email From Name': process.env.EMAIL_FROM_NAME || 'Non défini',
      'Email From Address': process.env.EMAIL_FROM_ADDRESS || 'Non défini',
      'Frontend URL': process.env.FRONTEND_URL || 'Non défini (utilisera localhost:3000)',
      'Service initialisé': this.courier ? 'Oui' : 'Non'
    };

    Object.entries(config).forEach(([key, value]) => {
      const status = (value === 'Manquant' || value === 'Non') ? '❌' : '✅';
      console.log(`${status} ${key}: ${value}`);
    });

    console.log('');
    return config;
  }
}

// Export une instance unique (singleton)
module.exports = new CourierEmailService();
