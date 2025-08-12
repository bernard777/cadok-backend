/**
 * PRÉVISUALISATION DES DESIGNS EMAIL KADOC
 * ========================================
 * 
 * Génère un fichier HTML avec tous les templates pour prévisualisation
 */

const EmailTemplates = require('./services/EmailTemplates');
const fs = require('fs');
const path = require('path');

function generatePreview() {
    console.log('🎨 Génération de la prévisualisation des emails...');

    // Données de test
    const testData = {
        userName: 'Jean Dupont',
        userEmail: 'jean.dupont@example.com',
        verificationCode: 'ABC123',
        verificationUrl: 'https://kadoc.com/verify?code=ABC123&email=jean.dupont%40example.com',
        resetToken: 'XYZ789',
        resetUrl: 'https://kadoc.com/reset-password?token=XYZ789',
        dashboardUrl: 'https://kadoc.com/dashboard'
    };

    // Génération des templates
    const verificationEmail = EmailTemplates.getVerificationTemplate(
        testData.userName,
        testData.verificationCode,
        testData.verificationUrl,
        testData.userEmail
    );

    const passwordResetEmail = EmailTemplates.getPasswordResetTemplate(
        testData.userName,
        testData.resetToken,
        testData.resetUrl,
        testData.userEmail
    );

    const welcomeEmail = EmailTemplates.getWelcomeTemplate(
        testData.userName,
        testData.dashboardUrl,
        testData.userEmail
    );

    const simpleEmail = EmailTemplates.getSimpleTemplate(
        'Notification importante',
        'Votre échange a été confirmé ! L\'autre utilisateur a accepté votre proposition. Vous pouvez maintenant organiser la remise.',
        'Voir l\'échange',
        'https://kadoc.com/exchanges/123'
    );

    // HTML de prévisualisation complète
    const previewHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prévisualisation Emails CADOK</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f0f2f5; 
        }
        .preview-container { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .email-section { 
            background: white; 
            margin: 30px 0; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
        }
        .section-header { 
            background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); 
            color: white; 
            padding: 20px 30px; 
            font-size: 20px; 
            font-weight: 600; 
        }
        .email-content { 
            padding: 0; 
        }
        .nav-menu {
            position: sticky;
            top: 20px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .nav-menu a {
            display: inline-block;
            margin: 0 15px;
            padding: 10px 20px;
            background: #FF6B35;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .nav-menu a:hover {
            transform: translateY(-2px);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #FF6B35;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="nav-menu">
            <h1 style="margin: 0 0 20px; color: #333;">🎨 Designs Email KADOC</h1>
            <a href="#verification">📧 Vérification</a>
            <a href="#password">🔐 Mot de passe</a>
            <a href="#welcome">🎉 Bienvenue</a>
            <a href="#notification">🔔 Notification</a>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">4</div>
                <div class="stat-label">Templates créés</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">100%</div>
                <div class="stat-label">Mobile responsive</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">Courier</div>
                <div class="stat-label">Service email</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">10k</div>
                <div class="stat-label">Emails/mois gratuits</div>
            </div>
        </div>

        <!-- Email de Vérification -->
        <div class="email-section" id="verification">
            <div class="section-header">
                📧 Email de Vérification de Compte
                <div style="font-size: 14px; opacity: 0.9; font-weight: normal; margin-top: 5px;">
                    Envoyé après l'inscription pour vérifier l'adresse email
                </div>
            </div>
            <div class="email-content">
                ${verificationEmail}
            </div>
        </div>

        <!-- Email Reset Mot de Passe -->
        <div class="email-section" id="password">
            <div class="section-header">
                🔐 Email de Réinitialisation de Mot de Passe
                <div style="font-size: 14px; opacity: 0.9; font-weight: normal; margin-top: 5px;">
                    Envoyé quand l'utilisateur oublie son mot de passe
                </div>
            </div>
            <div class="email-content">
                ${passwordResetEmail}
            </div>
        </div>

        <!-- Email de Bienvenue -->
        <div class="email-section" id="welcome">
            <div class="section-header">
                🎉 Email de Bienvenue
                <div style="font-size: 14px; opacity: 0.9; font-weight: normal; margin-top: 5px;">
                    Envoyé après la vérification réussie du compte
                </div>
            </div>
            <div class="email-content">
                ${welcomeEmail}
            </div>
        </div>

        <!-- Email de Notification Simple -->
        <div class="email-section" id="notification">
            <div class="section-header">
                🔔 Email de Notification Simple
                <div style="font-size: 14px; opacity: 0.9; font-weight: normal; margin-top: 5px;">
                    Template réutilisable pour toutes les notifications
                </div>
            </div>
            <div class="email-content">
                ${simpleEmail}
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3 style="color: #FF6B35; margin: 0 0 10px;">✅ Designs Email KADOC Terminés</h3>
            <p style="margin: 0 0 20px;">Templates modernes, responsifs et professionnels</p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h4 style="color: #333; margin: 0 0 15px;">🚀 Prochaines étapes</h4>
                <div style="text-align: left; max-width: 500px; margin: 0 auto;">
                    <p>✅ Templates HTML créés</p>
                    <p>✅ Service Courier intégré</p>
                    <p>✅ Versions texte (fallback)</p>
                    <p>🔧 Configuration Courier.com</p>
                    <p>🧪 Tests d'envoi</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Sauvegarde du fichier
    const outputPath = path.join(__dirname, 'email-preview.html');
    fs.writeFileSync(outputPath, previewHTML);
    
    console.log('✅ Prévisualisation générée !');
    console.log(`📄 Fichier : ${outputPath}`);
    console.log('');
    console.log('🌐 Pour voir le résultat :');
    console.log(`1. Ouvrez : file://${outputPath}`);
    console.log('2. Ou double-cliquez sur email-preview.html');
    console.log('');
    console.log('📧 Templates disponibles :');
    console.log('  - EmailTemplates.getVerificationTemplate()');
    console.log('  - EmailTemplates.getPasswordResetTemplate()');
    console.log('  - EmailTemplates.getWelcomeTemplate()');
    console.log('  - EmailTemplates.getSimpleTemplate()');

    return outputPath;
}

// Exécution si appelé directement
if (require.main === module) {
    generatePreview();
}

module.exports = { generatePreview };
