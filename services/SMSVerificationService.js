/**
 * 📱 SERVICE DE VÉRIFICATION SMS - CADOK
 * Gestion des codes SMS de vérification (Twilio gratuit)
 */

const twilio = require('twilio');
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

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
   * Codes de test fixes pour différents numéros
   * Permet de tester avec différents scénarios
   */
  getTestCodes() {
    return {
      // Numéros de test spéciaux avec codes fixes
      '+33123456789': '123456',   // France - Code standard
      '+33987654321': '654321',   // France - Code inverse
      '+1234567890': '111111',    // USA - Code répétitif
      '+447700900123': '222222',  // UK - Code répétitif
      '+49123456789': '333333',   // Allemagne - Code répétitif
      
      // Code universel pour tous les autres numéros
      'default': '000000'
    };
  }

  /**
   * Générer un code de vérification
   * En mode test, utilise des codes fixes selon le numéro
   */
  generateVerificationCode(phoneNumber = null) {
    if (this.isDevelopment) {
      const testCodes = this.getTestCodes();
      
      // Si numéro spécifique avec code fixe
      if (phoneNumber && testCodes[phoneNumber]) {
        console.log(`📱 [SMS DEV] Code fixe pour ${phoneNumber}: ${testCodes[phoneNumber]}`);
        return testCodes[phoneNumber];
      }
      
      // Sinon code par défaut
      console.log(`📱 [SMS DEV] Code par défaut: ${testCodes.default}`);
      return testCodes.default;
    }
    
    // Mode production : code aléatoire
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Formater le numéro de téléphone international
   */
  formatPhoneNumber(phone) {
    try {
      const phoneObj = parsePhoneNumber(phone);
      if (phoneObj && phoneObj.isValid()) {
        return phoneObj.format('E.164');
      }
      
      // Fallback pour numéros français
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
        cleaned = '+33' + cleaned.substring(1);
      } else if (!cleaned.startsWith('+')) {
        cleaned = '+33' + cleaned;
      }
      
      return cleaned;
    } catch (error) {
      console.error('Erreur formatage téléphone:', error);
      return phone;
    }
  }

  /**
   * Envoyer code de vérification par SMS
   * Utilise soit la simulation (dev) soit Twilio (prod)
   */
  async sendSMS(phone, code) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      if (this.isDevelopment) {
        // Mode développement : simulation complète
        console.log(`📱 [SMS DEV] ════════════════════════════════════`);
        console.log(`📱 [SMS DEV] 📲 SMS SIMULÉ`);
        console.log(`📱 [SMS DEV] 📱 Destinataire: ${formattedPhone}`);
        console.log(`📱 [SMS DEV] 🔐 Code: ${code}`);
        console.log(`📱 [SMS DEV] 💬 Message: "CADOK - Votre code: ${code}"`);
        console.log(`📱 [SMS DEV] ⏰ Valide 10 minutes`);
        console.log(`📱 [SMS DEV] ════════════════════════════════════`);
        
        return { 
          success: true, 
          phoneNumber: formattedPhone,
          code: code, // Debug uniquement
          mode: 'development',
          message: 'SMS simulé envoyé avec succès'
        };
      } else {
        // Mode production : vrai SMS via Twilio
        return await this.sendRealSMS(formattedPhone, code);
      }
    } catch (error) {
      console.error('❌ [SMS] Erreur envoi SMS:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Envoi SMS réel via Twilio (production)
   */
  async sendRealSMS(phone, code) {
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
    if (!this.isDevelopment) return false;
    
    // 🧪 CODES DE TEST UNIVERSELS (mode développement uniquement)
    const testCodes = [
      '123456', // Code de test principal
      '000000', // Code de test alternatif
      '999999', // Code de test admin
      '111111', // Code de test rapide
      '555555'  // Code de test démo
    ];
    
    console.log(`📱 [SMS DEV] Vérification code test: ${code} -> ${testCodes.includes(code) ? 'VALIDE' : 'INVALIDE'}`);
    return testCodes.includes(code);
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
