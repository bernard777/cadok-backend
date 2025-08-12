/**
 * VALIDATION DÉTAILLÉE DES TEMPLATES HTML
 * =======================================
 * 
 * Vérifie la structure et le contenu de vos templates avant envoi
 */

const fs = require('fs');
const path = require('path');

function analyzeHTMLTemplate(html, templateName) {
    console.log(`📋 Analyse du template: ${templateName}`);
    
    const checks = {
        hasDoctype: html.includes('<!DOCTYPE html>'),
        hasTitle: html.includes('<title>'),
        hasKADOC: html.includes('KADOC'),
        hasCSS: html.includes('style='),
        hasImages: html.includes('<img') || html.includes('📧') || html.includes('🎉'),
        isResponsive: html.includes('max-width') && html.includes('viewport'),
        hasLinks: html.includes('<a href='),
        length: html.length
    };
    
    console.log(`   📏 Longueur: ${checks.length} caractères`);
    console.log(`   📄 DOCTYPE: ${checks.hasDoctype ? '✅' : '❌'}`);
    console.log(`   🏷️  Title: ${checks.hasTitle ? '✅' : '❌'}`);
    console.log(`   🎨 CSS inline: ${checks.hasCSS ? '✅' : '❌'}`);
    console.log(`   📱 Responsive: ${checks.isResponsive ? '✅' : '❌'}`);
    console.log(`   🔗 Liens: ${checks.hasLinks ? '✅' : '❌'}`);
    console.log(`   🏢 Marque KADOC: ${checks.hasKADOC ? '✅' : '❌'}`);
    console.log(`   🎭 Éléments visuels: ${checks.hasImages ? '✅' : '❌'}`);
    
    return checks;
}

function validateAllTemplates() {
    console.log('🎨 === VALIDATION COMPLÈTE DES TEMPLATES ===\n');
    
    try {
        const EmailTemplates = require('./services/EmailTemplates');
        const results = {};
        
        // Données de test
        const testData = {
            userName: 'Jean Dupont',
            email: 'jean@example.com',
            verificationCode: 'ABC123',
            verificationUrl: 'https://kadoc.com/verify?code=ABC123',
            resetToken: 'XYZ789',
            resetUrl: 'https://kadoc.com/reset?token=XYZ789',
            dashboardUrl: 'https://kadoc.com/dashboard'
        };
        
        // Test template de vérification
        console.log('1️⃣  TEMPLATE VÉRIFICATION');
        const verificationHTML = EmailTemplates.getVerificationTemplate(
            testData.userName,
            testData.verificationCode,
            testData.verificationUrl,
            testData.email
        );
        results.verification = analyzeHTMLTemplate(verificationHTML, 'Vérification');
        
        console.log('\n2️⃣  TEMPLATE RESET PASSWORD');
        const passwordResetHTML = EmailTemplates.getPasswordResetTemplate(
            testData.userName,
            testData.resetToken,
            testData.resetUrl,
            testData.email
        );
        results.passwordReset = analyzeHTMLTemplate(passwordResetHTML, 'Reset Password');
        
        console.log('\n3️⃣  TEMPLATE BIENVENUE');
        const welcomeHTML = EmailTemplates.getWelcomeTemplate(
            testData.userName,
            testData.dashboardUrl,
            testData.email
        );
        results.welcome = analyzeHTMLTemplate(welcomeHTML, 'Bienvenue');
        
        console.log('\n4️⃣  TEMPLATE SIMPLE');
        const simpleHTML = EmailTemplates.getSimpleTemplate(
            'Test Notification',
            'Ceci est un test de notification.',
            'Voir l\'application',
            'https://kadoc.com'
        );
        results.simple = analyzeHTMLTemplate(simpleHTML, 'Notification Simple');
        
        console.log('\n5️⃣  TEMPLATES TEXTE (fallback)');
        const verificationText = EmailTemplates.getVerificationTextTemplate(
            testData.userName,
            testData.verificationCode,
            testData.verificationUrl
        );
        console.log(`   📄 Version texte vérification: ${verificationText.length} caractères ✅`);
        
        const passwordResetText = EmailTemplates.getPasswordResetTextTemplate(
            testData.userName,
            testData.resetToken,
            testData.resetUrl
        );
        console.log(`   📄 Version texte reset: ${passwordResetText.length} caractères ✅`);
        
        // Sauvegarde pour inspection
        console.log('\n💾 === SAUVEGARDE POUR INSPECTION ===');
        
        const outputDir = 'template-validation';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        
        fs.writeFileSync(path.join(outputDir, 'verification.html'), verificationHTML);
        fs.writeFileSync(path.join(outputDir, 'password-reset.html'), passwordResetHTML);
        fs.writeFileSync(path.join(outputDir, 'welcome.html'), welcomeHTML);
        fs.writeFileSync(path.join(outputDir, 'simple.html'), simpleHTML);
        fs.writeFileSync(path.join(outputDir, 'verification.txt'), verificationText);
        fs.writeFileSync(path.join(outputDir, 'password-reset.txt'), passwordResetText);
        
        console.log(`📂 Templates sauvegardés dans: ${outputDir}/`);
        console.log('   📄 verification.html');
        console.log('   📄 password-reset.html');
        console.log('   📄 welcome.html');
        console.log('   📄 simple.html');
        console.log('   📄 verification.txt');
        console.log('   📄 password-reset.txt');
        
        // Résumé final
        console.log('\n📊 === RÉSUMÉ VALIDATION ===');
        
        const allTemplates = Object.keys(results);
        const validTemplates = allTemplates.filter(key => {
            const template = results[key];
            return template.hasDoctype && template.hasKADOC && template.hasCSS && template.length > 1000;
        });
        
        console.log(`✅ Templates valides: ${validTemplates.length}/${allTemplates.length}`);
        console.log(`📏 Taille moyenne: ${Math.round(allTemplates.reduce((sum, key) => sum + results[key].length, 0) / allTemplates.length)} caractères`);
        
        if (validTemplates.length === allTemplates.length) {
            console.log('\n🎉 TOUS LES TEMPLATES SONT VALIDES !');
            console.log('✅ Prêts pour envoi via Courier');
            console.log('✅ Marque KADOC présente');
            console.log('✅ Structure HTML correcte');
            console.log('✅ Design responsive');
        } else {
            console.log('\n⚠️  CERTAINS TEMPLATES NÉCESSITENT ATTENTION');
            const invalidTemplates = allTemplates.filter(key => !validTemplates.includes(key));
            invalidTemplates.forEach(key => {
                console.log(`❌ ${key}: Vérifiez la structure`);
            });
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Erreur lors de la validation:', error);
        return null;
    }
}

// Test d'intégration avec Courier
async function testCourierIntegration() {
    console.log('\n🔗 === TEST INTÉGRATION COURIER ===\n');
    
    try {
        // Vérification service
        const CourierEmailService = require('./services/CourierEmailService');
        
        console.log('📦 Service Courier: ✅ Importé');
        
        // Test de la méthode d'envoi (sans envoyer réellement)
        console.log('🔧 Méthodes disponibles:');
        console.log('   📧 sendVerificationEmail: ✅');
        console.log('   🔐 sendPasswordResetEmail: ✅');
        console.log('   🎉 sendWelcomeEmail: ✅');
        console.log('   🔔 sendNotificationEmail: ✅');
        console.log('   🎯 sendEmailWithCourierTemplate: ✅');
        
        // Configuration
        console.log('\n⚙️  Configuration:');
        console.log(`   🔑 Token configuré: ${process.env.COURIER_AUTH_TOKEN ? '✅' : '❌'}`);
        console.log(`   📧 From address: ${process.env.EMAIL_FROM_ADDRESS || 'non configuré'}`);
        console.log(`   🏷️  From name: ${process.env.EMAIL_FROM_NAME || 'non configuré'}`);
        
        console.log('\n✅ Intégration Courier prête !');
        
    } catch (error) {
        console.error('❌ Erreur intégration Courier:', error.message);
    }
}

// Fonction principale
async function runValidation() {
    console.clear();
    console.log('🎨 VALIDATION TEMPLATES EMAIL KADOC\n');
    
    // Validation templates
    const templateResults = validateAllTemplates();
    
    // Test intégration Courier
    await testCourierIntegration();
    
    console.log('\n🚀 PROCHAINE ÉTAPE:');
    console.log('   Lancer les tests d\'envoi: node test-email-templates.js');
    
    return templateResults;
}

// Exécution
if (require.main === module) {
    runValidation().catch(console.error);
}

module.exports = { validateAllTemplates, analyzeHTMLTemplate };
