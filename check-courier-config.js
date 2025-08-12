/**
 * VÉRIFICATION AUTOMATIQUE - CONFIGURATION COURIER
 * ==============================================
 * 
 * Script qui vérifie que votre configuration Courier est correcte
 */

require('dotenv').config();

function checkCourierConfiguration() {
    console.log('🔍 === VÉRIFICATION CONFIGURATION COURIER ===\n');

    const checks = [];
    let allGood = true;

    // Vérification 1: Variables d'environnement
    console.log('📋 1. Vérification variables d\'environnement...');
    
    const requiredEnvs = {
        'COURIER_AUTH_TOKEN': 'Clé API Courier',
        'EMAIL_FROM_ADDRESS': 'Adresse expéditeur',
        'EMAIL_FROM_NAME': 'Nom expéditeur'
    };

    for (const [env, description] of Object.entries(requiredEnvs)) {
        if (process.env[env]) {
            console.log(`   ✅ ${env}: ${description} configuré`);
            checks.push({ name: description, status: 'OK', details: 'Présent' });
        } else {
            console.log(`   ❌ ${env}: ${description} MANQUANT`);
            checks.push({ name: description, status: 'ERREUR', details: 'Manquant dans .env' });
            allGood = false;
        }
    }

    // Vérification 2: Format de la clé API
    console.log('\n🔑 2. Vérification format clé API...');
    
    const token = process.env.COURIER_AUTH_TOKEN;
    if (token) {
        if (token.startsWith('pk_prod_')) {
            console.log('   ✅ Clé de production détectée');
            checks.push({ name: 'Format clé API', status: 'OK', details: 'Clé de production' });
        } else if (token.startsWith('pk_test_')) {
            console.log('   ⚠️  Clé de test détectée (OK pour développement)');
            checks.push({ name: 'Format clé API', status: 'ATTENTION', details: 'Clé de test' });
        } else if (token === 'pk_prod_VOTRE_TOKEN_COURIER_ICI') {
            console.log('   ❌ Clé placeholder détectée - Remplacez par votre vraie clé !');
            console.log('   💡 Prendre la clé "Untitled key (published)" dans Courier');
            checks.push({ name: 'Format clé API', status: 'ERREUR', details: 'Placeholder non remplacé' });
            allGood = false;
        } else {
            console.log('   ❌ Format de clé non reconnu');
            console.log('   💡 Vérifiez que vous avez pris la clé "published" (pas "draft")');
            checks.push({ name: 'Format clé API', status: 'ERREUR', details: 'Format invalide' });
            allGood = false;
        }
        
        // Vérification longueur (les clés Courier font généralement 32+ caractères)
        if (token.length < 20) {
            console.log('   ⚠️  Clé très courte - Vérifiez qu\'elle est complète');
            checks.push({ name: 'Longueur clé API', status: 'ATTENTION', details: 'Clé tronquée ?' });
        }
    }

    // Vérification 3: Package Courier installé
    console.log('\n📦 3. Vérification package Courier...');
    
    try {
        require('@trycourier/courier');
        console.log('   ✅ Package @trycourier/courier installé');
        checks.push({ name: 'Package Courier', status: 'OK', details: 'Installé' });
    } catch (error) {
        console.log('   ❌ Package @trycourier/courier manquant');
        console.log('   💡 Installation: npm install @trycourier/courier');
        checks.push({ name: 'Package Courier', status: 'ERREUR', details: 'Pas installé' });
        allGood = false;
    }

    // Vérification 4: Service Email
    console.log('\n🎯 4. Vérification service email...');
    
    try {
        const CourierEmailService = require('./services/CourierEmailService');
        console.log('   ✅ Service Courier importé avec succès');
        checks.push({ name: 'Service Email', status: 'OK', details: 'Importé' });
    } catch (error) {
        console.log('   ❌ Erreur import service:', error.message);
        checks.push({ name: 'Service Email', status: 'ERREUR', details: error.message });
        allGood = false;
    }

    // Vérification 5: Configuration Email Provider
    console.log('\n📧 5. Vérification provider email...');
    
    const provider = process.env.EMAIL_PROVIDER;
    if (provider === 'courier') {
        console.log('   ✅ Provider configuré sur Courier');
        checks.push({ name: 'Email Provider', status: 'OK', details: 'Courier sélectionné' });
    } else if (provider === 'gmail') {
        console.log('   ⚠️  Provider configuré sur Gmail (backup)');
        checks.push({ name: 'Email Provider', status: 'ATTENTION', details: 'Gmail actif au lieu de Courier' });
    } else {
        console.log('   ❌ Provider non défini ou invalide');
        checks.push({ name: 'Email Provider', status: 'ERREUR', details: 'Non configuré' });
        allGood = false;
    }

    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('='.repeat(50));

    checks.forEach(check => {
        const statusIcon = check.status === 'OK' ? '✅' : 
                          check.status === 'ATTENTION' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${check.name}: ${check.details}`);
    });

    console.log('\n' + '='.repeat(50));

    if (allGood) {
        console.log('🎉 CONFIGURATION PARFAITE !');
        console.log('✅ Tous les éléments sont correctement configurés');
        console.log('🚀 Vous pouvez maintenant envoyer des emails via Courier');
        console.log('\n💡 Prochaine étape: node test-courier-email.js');
    } else {
        console.log('⚠️  CONFIGURATION INCOMPLÈTE');
        console.log('❌ Certains éléments nécessitent votre attention');
        console.log('\n🔧 Actions recommandées:');
        
        if (checks.some(c => c.name === 'Clé API Courier' && c.status === 'ERREUR')) {
            console.log('1. 🔑 Configurer votre clé Courier dans .env');
            console.log('   → Aller sur https://app.courier.com/');
            console.log('   → Settings > API Keys');
            console.log('   → Copier la clé "Untitled key (PUBLISHED)" ← Important !');
            console.log('   → PAS la clé "draft" ❌');
        }
        
        if (checks.some(c => c.name === 'Package Courier' && c.status === 'ERREUR')) {
            console.log('2. 📦 Installer le package:');
            console.log('   → npm install @trycourier/courier');
        }
        
        if (checks.some(c => c.name === 'Email Provider' && c.status === 'ERREUR')) {
            console.log('3. ⚙️  Configurer EMAIL_PROVIDER=courier dans .env');
        }
    }

    console.log('\n📚 Aide complète: GUIDE_SETUP_COURIER_DETAILLE.md');
    console.log('🌐 Guide visuel: guide-visual-courier.html');

    return allGood;
}

// Exécution si appelé directement
if (require.main === module) {
    checkCourierConfiguration();
}

module.exports = { checkCourierConfiguration };
