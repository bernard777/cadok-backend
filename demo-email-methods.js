/**
 * TEST COMPLET - TEMPLATES HTML PERSONNALISÉS VS COURIER
 * =====================================================
 * 
 * Démonstration des différentes façons d'envoyer des emails avec Courier
 */

require('dotenv').config();

async function demonstrateEmailMethods() {
    console.log('🎨 === DÉMONSTRATION TEMPLATES EMAIL KADOC ===\n');

    try {
        // Import du service
        const CourierEmailService = require('./services/CourierEmailService');

        console.log('📋 MÉTHODES DISPONIBLES:\n');
        
        console.log('1. ✅ TEMPLATES HTML PERSONNALISÉS (Recommandé)');
        console.log('   → Utilise vos beaux designs HTML');
        console.log('   → Templates dans EmailTemplates.js');
        console.log('   → Contrôle total du design\n');
        
        console.log('2. 🎯 TEMPLATES COURIER (Optionnel)');
        console.log('   → Interface graphique Courier');
        console.log('   → Éditeur drag & drop');
        console.log('   → A/B testing intégré\n');

        console.log('3. 📧 EMAILS SIMPLES (Notifications)');
        console.log('   → Messages courts');
        console.log('   → Template réutilisable');
        console.log('   → Idéal pour notifications\n');

        // Choix de l'email de test
        const testEmail = 'test@example.com'; // Changez par votre email
        console.log(`🧪 Email de test: ${testEmail}\n`);

        // Vérification configuration
        if (!process.env.COURIER_AUTH_TOKEN || process.env.COURIER_AUTH_TOKEN === 'pk_prod_VOTRE_TOKEN_COURIER_ICI') {
            console.log('⚠️  CONFIGURATION REQUISE:');
            console.log('1. Configurez votre clé Courier dans .env');
            console.log('2. COURIER_AUTH_TOKEN=pk_prod_VOTRE_VRAIE_CLE');
            console.log('3. Relancez ce script\n');
            console.log('📚 Guide: GUIDE_SETUP_COURIER_DETAILLE.md');
            return;
        }

        console.log('🔧 Configuration détectée ✅');
        console.log(`   Token: ${process.env.COURIER_AUTH_TOKEN.substring(0, 15)}...`);
        console.log(`   From: ${process.env.EMAIL_FROM_NAME}\n`);

        // Test des méthodes
        console.log('🚀 LANCEMENT DES TESTS...\n');
        
        const results = await CourierEmailService.testEmailMethods(testEmail);
        
        console.log('\n📊 === RÉSULTATS DES TESTS ===\n');
        
        results.forEach((result, index) => {
            const statusIcon = result.success === true ? '✅' : 
                              result.success === false ? '❌' : '⏭️';
            console.log(`${statusIcon} ${result.method}`);
            console.log(`   Message ID: ${result.messageId}`);
            console.log('');
        });

        // Recommandations
        console.log('💡 === RECOMMANDATIONS ===\n');
        
        const successCount = results.filter(r => r.success === true).length;
        
        if (successCount > 0) {
            console.log('✅ Configuration Courier opérationnelle !');
            console.log('📧 Vos templates HTML personnalisés sont utilisés');
            console.log('🎨 Designs professionnels préservés');
            console.log('');
            
            console.log('🚀 PROCHAINES ÉTAPES:');
            console.log('1. Vérifiez la réception des emails de test');
            console.log('2. Configurez des templates Courier (optionnel)');
            console.log('3. Intégrez dans votre application');
            console.log('');
            
            console.log('📈 UTILISATION EN PRODUCTION:');
            console.log('```javascript');
            console.log('// Email de vérification avec vos templates');
            console.log('await emailService.sendVerificationEmail(');
            console.log('  "user@example.com", "ABC123", "Jean Dupont"');
            console.log(');');
            console.log('');
            console.log('// Email de notification simple');
            console.log('await emailService.sendNotificationEmail(');
            console.log('  "user@example.com",');
            console.log('  "Échange confirmé",');
            console.log('  "Votre proposition a été acceptée !",');
            console.log('  "Voir l\'échange",');
            console.log('  "https://kadoc.com/exchange/123"');
            console.log(');');
            console.log('```');
            
        } else {
            console.log('❌ Problème de configuration détecté');
            console.log('🔧 Actions recommandées:');
            console.log('1. Vérifiez votre clé API Courier');
            console.log('2. Testez la connexion internet');
            console.log('3. Consultez les logs d\'erreur');
        }

    } catch (error) {
        console.error('💥 Erreur lors de la démonstration:', error.message);
        console.log('\n🔧 DÉPANNAGE:');
        console.log('1. Vérifiez votre configuration .env');
        console.log('2. Assurez-vous que Courier est installé');
        console.log('3. Testez avec: node check-courier-config.js');
    }
}

// Fonction pour afficher l'architecture
function showEmailArchitecture() {
    console.log('🏗️  === ARCHITECTURE EMAIL KADOC ===\n');
    
    console.log('📁 STRUCTURE:');
    console.log('```');
    console.log('services/');
    console.log('├── EmailTemplates.js        ← Vos designs HTML');
    console.log('├── CourierEmailService.js   ← Service Courier');
    console.log('└── (Gmail SMTP backup)      ← Fallback');
    console.log('');
    console.log('Méthodes disponibles:');
    console.log('├── sendVerificationEmail()  ← Template vérification');
    console.log('├── sendPasswordResetEmail() ← Template reset password');
    console.log('├── sendWelcomeEmail()       ← Template bienvenue');
    console.log('├── sendNotificationEmail()  ← Template simple');
    console.log('└── sendEmailWithCourierTemplate() ← Templates Courier');
    console.log('```\n');

    console.log('⚡ FLUX D\'ENVOI:');
    console.log('1. 🎨 EmailTemplates.js génère le HTML');
    console.log('2. 📧 CourierEmailService.js envoie via API');
    console.log('3. 🚀 Courier livre l\'email');
    console.log('4. 📊 Analytics dans dashboard Courier\n');

    console.log('💰 COÛTS:');
    console.log('✅ 10,000 emails/mois GRATUITS');
    console.log('💳 Après: ~$20/mois pour 50k emails');
    console.log('📈 Évolutif selon vos besoins\n');
}

// Menu interactif
async function runInteractiveDemo() {
    console.clear();
    showEmailArchitecture();
    
    console.log('🎯 CHOISISSEZ UNE ACTION:');
    console.log('1. 🧪 Tester l\'envoi d\'emails');
    console.log('2. 📋 Voir l\'architecture');
    console.log('3. 🔧 Vérifier la configuration');
    console.log('4. 📚 Ouvrir les guides\n');
    
    // Pour ce script, on lance directement les tests
    await demonstrateEmailMethods();
}

// Exécution
if (require.main === module) {
    runInteractiveDemo().catch(console.error);
}

module.exports = { demonstrateEmailMethods, showEmailArchitecture };
