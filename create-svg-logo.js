/**
 * CRÉATION LOGO SVG SIMPLE POUR EMAILS
 * ====================================
 * 
 * Crée un logo SVG simple inspiré de l'adaptive-icon
 */

function createKadocLogoSvg() {
    console.log('🎨 === CRÉATION LOGO SVG KADOC ===\n');
    
    // Logo SVG simple inspiré du concept de troc/échange
    const logoSvg = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <!-- Cercle background -->
        <circle cx="24" cy="24" r="22" fill="#FF6B35" stroke="#F7931E" stroke-width="2"/>
        
        <!-- Lettre K stylisée -->
        <path d="M16 12 L16 36 M16 24 L20 18 M16 24 L20 30" 
              stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Symbole échange/troc -->
        <path d="M28 16 L32 20 L28 24 M32 20 L26 20" 
              stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M32 28 L28 32 L32 36 M28 32 L34 32" 
              stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // Version encodée en base64 pour les emails
    const base64Logo = Buffer.from(logoSvg).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64Logo}`;

    console.log('✅ Logo SVG créé !');
    console.log('📏 Taille: ~500 bytes (très léger pour emails)');
    console.log('🎨 Design: K + symboles échange');
    console.log('🎯 Couleurs: Orange KADOC (#FF6B35)');
    
    console.log('\n📋 Code HTML pour templates:');
    console.log(`<img src="${dataUri}" alt="KADOC" style="width: 48px; height: 48px; border-radius: 50%;">`);

    return dataUri;
}

// Génération du logo
const logoDataUri = createKadocLogoSvg();

// Export pour utilisation
module.exports = {
    getKadocSvgLogo: () => logoDataUri
};
