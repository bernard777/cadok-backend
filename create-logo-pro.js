/**
 * LOGO KADOC PROFESSIONNEL POUR EMAILS
 * ====================================
 * 
 * Crée un logo simple mais efficace avec CSS pur
 */

function createKadocEmailLogo() {
    console.log('🎨 === CRÉATION LOGO KADOC PROFESSIONNEL ===\n');
    
    // Version 1: Logo simple avec K stylisé
    const logoSimple = `
    <!-- Logo KADOC professionnel -->
    <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(255,107,53,0.3);">
            <span style="color: white; font-size: 32px; font-weight: bold; font-family: Arial, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">K</span>
        </div>
    </div>`;

    // Version 2: Logo avec votre design exact (cercle blanc + K orange)
    const logoExact = `
    <!-- Logo KADOC style exact -->
    <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: #FF6B35; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif;">K</span>
        </div>
    </div>`;

    // Version 3: Logo avec effet de profondeur
    const logoProfondeur = `
    <!-- Logo KADOC avec profondeur -->
    <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(0,0,0,0.15); border: 3px solid #F7931E;">
        <div style="width: 50px; height: 50px; background: #FF6B35; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative;">
            <span style="color: white; font-size: 24px; font-weight: bold; font-family: 'Arial Black', Arial, sans-serif;">K</span>
        </div>
    </div>`;

    console.log('✅ 3 versions de logo créées:');
    console.log('   1️⃣  Simple: K blanc sur fond orange');
    console.log('   2️⃣  Exact: K orange sur fond blanc (comme votre design)');
    console.log('   3️⃣  Profondeur: Avec bordure et ombre');

    return {
        simple: logoSimple,
        exact: logoExact,
        profondeur: logoProfondeur
    };
}

// Test des versions
const logos = createKadocEmailLogo();

console.log('\n🎯 VERSION RECOMMANDÉE (exact):');
console.log(logos.exact);

module.exports = { createKadocEmailLogo };
