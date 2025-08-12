/**
 * CONVERTISSEUR IMAGE BASE64 POUR EMAILS
 * ======================================
 * 
 * Convertit l'adaptive-icon en base64 pour l'embarquer dans les emails
 */

const fs = require('fs');
const path = require('path');

function convertImageToBase64() {
    console.log('🖼️  === CONVERSION IMAGE POUR EMAILS ===\n');

    try {
        const iconPath = path.join(__dirname, 'assets', 'adaptive-icon.png');
        
        if (!fs.existsSync(iconPath)) {
            console.log('❌ Fichier non trouvé:', iconPath);
            return null;
        }

        // Lire l'image et convertir en base64
        const imageBuffer = fs.readFileSync(iconPath);
        const base64Image = imageBuffer.toString('base64');
        const dataUri = `data:image/png;base64,${base64Image}`;

        console.log('✅ Image convertie avec succès !');
        console.log(`📏 Taille: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
        console.log(`🔗 Base64 length: ${base64Image.length} caractères`);
        
        // Sauvegarder le base64 dans un fichier pour réutilisation
        const base64Path = path.join(__dirname, 'assets', 'adaptive-icon-base64.txt');
        fs.writeFileSync(base64Path, dataUri);
        
        console.log(`💾 Base64 sauvegardé: ${base64Path}`);
        console.log('\n📋 Data URI généré:');
        console.log(`${dataUri.substring(0, 100)}...`);

        return dataUri;

    } catch (error) {
        console.error('❌ Erreur lors de la conversion:', error);
        return null;
    }
}

// Test et génération
const base64DataUri = convertImageToBase64();

if (base64DataUri) {
    console.log('\n✨ Utilisez ce code dans vos templates :');
    console.log(`<img src="${base64DataUri.substring(0, 80)}..." alt="KADOC Logo" style="width: 60px; height: 60px; border-radius: 50%;">`);
    
    module.exports = {
        getKadocLogoDataUri: () => base64DataUri
    };
} else {
    console.log('\n❌ Conversion échouée');
    module.exports = {
        getKadocLogoDataUri: () => null
    };
}
