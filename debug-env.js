/**
 * 🔍 DEBUG VARIABLES D'ENVIRONNEMENT
 * Vérification des variables pour l'email
 */

require('dotenv').config();

console.log('🔍 [DEBUG] Variables d\'environnement:');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0,8) + '...' : 'NON DÉFINIE');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NON DÉFINIE');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NON DÉFINIE');

console.log('\n📧 [TEST] Création EmailVerificationService...');
const EmailVerificationService = require('./services/EmailVerificationService');
const emailService = new EmailVerificationService();
