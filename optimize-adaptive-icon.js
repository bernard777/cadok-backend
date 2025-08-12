/**
 * OPTIMISATION DU LOGO ADAPTIVE-ICON.SVG POUR EMAILS
 * ==================================================
 * 
 * Convertit votre logo SVG en format optimisé pour les emails
 */

const fs = require('fs');
const path = require('path');

function optimizeAdaptiveIconForEmail() {
    console.log('🎨 === OPTIMISATION ADAPTIVE-ICON.SVG ===\n');

    try {
        // Lire le fichier SVG
        const svgPath = path.join(__dirname, 'assets', 'adaptive-icon.svg');
        let svgContent = fs.readFileSync(svgPath, 'utf8');

        console.log('✅ Fichier SVG lu avec succès');
        console.log(`📏 Taille originale: ${(svgContent.length / 1024).toFixed(1)} KB`);

        // Optimisation pour emails :
        // 1. Supprimer les commentaires XML
        svgContent = svgContent.replace(/<!--[\s\S]*?-->/g, '');
        
        // 2. Supprimer les DOCTYPE et déclarations XML (problématiques dans certains clients email)
        svgContent = svgContent.replace(/<\?xml[^>]*\?>/g, '');
        svgContent = svgContent.replace(/<!DOCTYPE[^>]*>/g, '');
        
        // 3. Nettoyer les espaces multiples
        svgContent = svgContent.replace(/\s+/g, ' ').trim();
        
        // 4. Optimiser les attributs pour une taille réduite (compatible emails)
        svgContent = svgContent.replace(
            /width="1024\.000000pt" height="1024\.000000pt"/,
            'width="60" height="60"'
        );

        // 5. Ajouter les propriétés de style inline pour la compatibilité email
        svgContent = svgContent.replace(
            '<svg',
            '<svg style="display: block; border-radius: 50%;"'
        );

        console.log(`📦 Taille optimisée: ${(svgContent.length / 1024).toFixed(1)} KB`);

        // Encoder en base64 pour intégration dans les emails
        const base64 = Buffer.from(svgContent).toString('base64');
        const dataUri = `data:image/svg+xml;base64,${base64}`;

        console.log(`🔗 Base64 généré: ${base64.length} caractères`);

        // Sauvegarder les versions optimisées
        fs.writeFileSync(
            path.join(__dirname, 'assets', 'adaptive-icon-email.svg'),
            svgContent
        );

        fs.writeFileSync(
            path.join(__dirname, 'assets', 'adaptive-icon-email-base64.txt'),
            dataUri
        );

        console.log('\n💾 Fichiers sauvegardés:');
        console.log('   ✅ adaptive-icon-email.svg (version optimisée)');
        console.log('   ✅ adaptive-icon-email-base64.txt (data URI)');

        // Créer une prévisualisation HTML
        const previewHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Prévisualisation Adaptive Icon</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
        .preview { background: white; padding: 40px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .email-header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); padding: 30px; border-radius: 12px; color: white; }
        .logo-container { background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Prévisualisation Adaptive Icon KADOC</h1>
        
        <div class="preview">
            <h2>📧 Aperçu dans email</h2>
            <div class="email-header">
                <div class="logo-container">
                    <img src="${dataUri}" alt="KADOC Logo" style="width: 60px; height: 60px; display: block;">
                </div>
                <h1 style="margin: 0; font-size: 24px;">Bienvenue sur KADOC !</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">La plateforme de troc nouvelle génération</p>
            </div>
        </div>

        <div class="preview">
            <h2>🔍 Logo seul - Différentes tailles</h2>
            <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div style="text-align: center;">
                    <img src="${dataUri}" style="width: 40px; height: 40px; display: block; margin: 0 auto;">
                    <p>40px</p>
                </div>
                <div style="text-align: center;">
                    <img src="${dataUri}" style="width: 60px; height: 60px; display: block; margin: 0 auto;">
                    <p>60px</p>
                </div>
                <div style="text-align: center;">
                    <img src="${dataUri}" style="width: 80px; height: 80px; display: block; margin: 0 auto;">
                    <p>80px</p>
                </div>
            </div>
        </div>

        <div class="preview">
            <h2>⚙️ Informations techniques</h2>
            <ul style="text-align: left; display: inline-block;">
                <li>Format: SVG optimisé pour emails</li>
                <li>Taille: ${(svgContent.length / 1024).toFixed(1)} KB</li>
                <li>Base64: ${base64.length} caractères</li>
                <li>Compatible: Gmail, Outlook, Apple Mail, etc.</li>
                <li>Style: Border-radius appliqué automatiquement</li>
            </ul>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(
            path.join(__dirname, 'preview-adaptive-icon.html'),
            previewHtml
        );

        console.log('   ✅ preview-adaptive-icon.html (prévisualisation)');

        console.log('\n🚀 Prêt pour intégration dans les emails !');
        console.log('\n💡 Étapes suivantes:');
        console.log('1. Ouvrir preview-adaptive-icon.html pour voir le rendu');
        console.log('2. Valider que le logo s\'affiche correctement');
        console.log('3. Intégrer dans EmailTemplates.js');

        return {
            svgContent,
            dataUri,
            base64
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'optimisation:', error);
        return null;
    }
}

// Exécuter l'optimisation
const result = optimizeAdaptiveIconForEmail();

if (result) {
    console.log('\n✅ OPTIMISATION TERMINÉE AVEC SUCCÈS !');
} else {
    console.log('\n❌ Échec de l\'optimisation');
}

module.exports = { optimizeAdaptiveIconForEmail };
