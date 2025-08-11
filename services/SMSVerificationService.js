/**
 * 📱 SERVICE DE VÉRIFICATION SMS - CADOK
 * Gestion des codes SMS de vérification (Twilio gratuit)
 */

const twilio = require('twilio');

class SMSVerificationService {
  constructor() {
    // Vérification du mode développement
    this.isDevelopment = process.env.VERIFICATION_DEV_MODE === 'true' || 
                         process.env.NODE_ENV === 'development' ||
                         !process.env.TWILIO_ACCOUNT_SID ||
                         !process.env.TWILIO_ACCOUNT_SID.startsWith('AC');

    if (this.isDevelopment) {
      console.log('📱 [SMS] Mode développement activé - SMS simulés');
      this.client = null;
    } else {
      // Configuration Twilio (gratuit jusqu'à 15$ de crédit)
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID, 
        process.env.TWILIO_AUTH_TOKEN
      );
    }
    
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
  }

  /**
   * Générer un code de vérification à 6 chiffres
   */
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Formater le numéro de téléphone français
   */
  formatPhoneNumber(phone) {
    // Nettoyer le numéro
    let cleaned = phone.replace(/\D/g, '');
    
    // Si commence par 0, remplacer par +33
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }
    // Si ne commence pas par +33, l'ajouter
    else if (!cleaned.startsWith('+33')) {
      cleaned = '+33' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Envoyer code de vérification par SMS
   */
  async sendVerificationCode(phone, code) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      if (this.isDevelopment) {
        // Mode développement : simulation
        console.log(`📱 [SMS DEV] Simulation d'envoi SMS au ${formattedPhone}`);
        console.log(`📱 [SMS DEV] Code de vérification : ${code}`);
        console.log(`📱 [SMS DEV] Message : 🔐 CADOK - Votre code de vérification : ${code}`);
        
        return { 
          success: true, 
          messageId: `dev_${Date.now()}`, 
          phone: formattedPhone,
          code: code,
          message: 'SMS simulé en mode développement' 
        };
      }
      
      const message = await this.client.messages.create({
        body: `🔐 CADOK - Votre code de vérification : ${code}\n\nCe code expire dans 5 minutes.\nNe le communiquez à personne.`,
        from: this.phoneNumber,
        to: formattedPhone
      });

      console.log(`✅ SMS envoyé au ${formattedPhone} - SID: ${message.sid}`);
      return { success: true, messageId: message.sid };
      
    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si le code est valide (pour tests en développement)
   */
  isValidTestCode(code) {
    // Code de test universel pour le développement
    return code === '123456' && this.isDevelopment;
  }

  /**
   * Simuler l'envoi SMS en mode développement (sans Twilio)
   */
  async sendMockVerificationCode(phone, code) {
    console.log(`📱 [MODE TEST] SMS simulé au ${phone}:`);
    console.log(`🔐 Code de vérification CADOK: ${code}`);
    console.log('📝 Utilisez ce code dans l\'app mobile');
    
    return { success: true, messageId: 'mock_' + Date.now() };
  }

  /**
   * Envoyer SMS (avec fallback en mode test)
   */
  async sendSMS(phone, code) {
    // En développement, utiliser le mode mock
    if (this.isDevelopment) {
      return await this.sendMockVerificationCode(phone, code);
    }
    
    // En production, utiliser le vrai service Twilio
    return await this.sendVerificationCode(phone, code);
  }
}

module.exports = SMSVerificationService;
