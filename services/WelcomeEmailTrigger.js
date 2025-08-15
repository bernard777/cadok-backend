/**
 * Service pour gérer l'envoi de l'email de bienvenue
 * Envoyé uniquement après vérification complète (email + téléphone)
 */

const User = require('../models/User');
const EmailVerificationService = require('./EmailVerificationService');

class WelcomeEmailTrigger {
  constructor() {
    this.emailService = new EmailVerificationService();
  }

  /**
   * Vérifie si l'utilisateur a complété toutes les vérifications
   * et envoie l'email de bienvenue si c'est le cas
   */
  async checkAndSendWelcomeEmail(userId) {
    try {
      console.log(`🔍 [WELCOME] Vérification statut complet pour utilisateur: ${userId}`);

      const user = await User.findById(userId).select('pseudo email emailVerified phoneVerified welcomeEmailSent');
      
      if (!user) {
        console.error('❌ [WELCOME] Utilisateur non trouvé:', userId);
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      // Vérifier que les deux vérifications sont complètes
      const isFullyVerified = user.emailVerified && user.phoneVerified;
      const welcomeAlreadySent = user.welcomeEmailSent;

      console.log(`📊 [WELCOME] Statut utilisateur ${user.pseudo}:`);
      console.log(`   • Email vérifié: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   • Téléphone vérifié: ${user.phoneVerified ? '✅' : '❌'}`);
      console.log(`   • Email bienvenue envoyé: ${welcomeAlreadySent ? '✅' : '❌'}`);

      if (!isFullyVerified) {
        console.log('ℹ️ [WELCOME] Vérification incomplète - email de bienvenue en attente');
        return { 
          success: false, 
          reason: 'verification_incomplete',
          message: 'Vérification email ou téléphone non terminée'
        };
      }

      if (welcomeAlreadySent) {
        console.log('ℹ️ [WELCOME] Email de bienvenue déjà envoyé');
        return { 
          success: false, 
          reason: 'already_sent',
          message: 'Email de bienvenue déjà envoyé'
        };
      }

      // 🎉 TOUTES LES CONDITIONS SONT REMPLIES - ENVOI EMAIL DE BIENVENUE
      console.log('🎉 [WELCOME] Conditions remplies - envoi email de bienvenue...');

      const welcomeResult = await this.emailService.sendWelcomeEmail(user);

      if (welcomeResult.success) {
        // Marquer l'email de bienvenue comme envoyé
        await User.findByIdAndUpdate(userId, {
          welcomeEmailSent: true,
          welcomeEmailSentAt: new Date()
        });

        console.log(`✅ [WELCOME] Email de bienvenue envoyé avec succès à: ${user.email}`);
        console.log(`📧 [WELCOME] Service: ${welcomeResult.service}`);

        return {
          success: true,
          messageId: welcomeResult.messageId,
          service: welcomeResult.service,
          user: {
            email: user.email,
            pseudo: user.pseudo
          }
        };
      } else {
        console.error(`❌ [WELCOME] Échec envoi email de bienvenue:`, welcomeResult.error);
        return {
          success: false,
          error: welcomeResult.error,
          reason: 'email_send_failed'
        };
      }

    } catch (error) {
      console.error('❌ [WELCOME] Erreur critique dans checkAndSendWelcomeEmail:', error);
      return {
        success: false,
        error: error.message,
        reason: 'system_error'
      };
    }
  }

  /**
   * Méthode helper pour les routes - vérifie et envoie email de bienvenue
   * Utilisé après vérification email ou téléphone
   */
  async tryTriggerWelcomeEmail(userId) {
    const result = await this.checkAndSendWelcomeEmail(userId);
    
    if (result.success) {
      console.log('🌟 [WELCOME] Déclenchement réussi - utilisateur complètement vérifié !');
    } else if (result.reason === 'verification_incomplete') {
      console.log('⏳ [WELCOME] En attente de vérification complète...');
    } else if (result.reason === 'already_sent') {
      console.log('✓ [WELCOME] Email déjà envoyé précédemment');
    } else {
      console.log('⚠️ [WELCOME] Échec déclenchement:', result.error);
    }

    return result;
  }
}

module.exports = WelcomeEmailTrigger;
