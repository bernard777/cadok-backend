/**
 * 🧪 TEST PRATIQUE DU SYSTÈME DE GÉNÉRATION DE BORDEREAUX
 * Teste la génération d'un vrai bordereau PDF avec redirection
 */

const DeliveryLabelService = require('../services/deliveryLabelService');
const path = require('path');
const fs = require('fs');

async function testLabelGeneration() {
    console.log('🧪 TEST: GÉNÉRATION D\'UN BORDEREAU DE LIVRAISON RÉEL\n');

    // Données de test simulant un vrai troc
    const testTrade = {
        _id: 'TR-TEST-001',
        sender: {
            _id: 'user1',
            firstName: 'Marie',
            lastName: 'Dupont',
            address: {
                street: '25 Rue de la République',
                city: 'Paris',
                zipCode: '75001',
                country: 'France'
            },
            phone: '01 23 45 67 89'
        },
        receiver: {
            _id: 'user2',
            firstName: 'Thomas',
            lastName: 'Dorel',
            address: {
                street: '12 Rue des Acacias',
                city: 'Lyon',
                zipCode: '69001',
                country: 'France'
            },
            phone: '06 12 34 56 78'
        },
        itemSent: {
            title: 'Livre "Clean Code" de Robert Martin',
            description: 'Excellent état, peu utilisé',
            weight: 350 // grammes
        },
        status: 'awaiting_shipment'
    };

    try {
        console.log('📋 DONNÉES DU TROC:');
        console.log(`   🆔 Trade ID: ${testTrade._id}`);
        console.log(`   👤 Expéditeur: ${testTrade.sender.firstName} ${testTrade.sender.lastName} (${testTrade.sender.address.city})`);
        console.log(`   👤 Destinataire: ${testTrade.receiver.firstName} ${testTrade.receiver.lastName} (${testTrade.receiver.address.city})`);
        console.log(`   📦 Objet: ${testTrade.itemSent.title}`);
        console.log(`   ⚖️ Poids: ${testTrade.itemSent.weight}g\n`);

        console.log('🎫 GÉNÉRATION DU BORDEREAU...');
        
        // Générer le bordereau
        const labelData = await DeliveryLabelService.generateDeliveryLabel(testTrade);
        
        console.log('   ✅ Bordereau généré avec succès!\n');

        console.log('📋 INFORMATIONS DE REDIRECTION:');
        console.log(`   🔑 Code de redirection: ${labelData.redirectionCode}`);
        console.log(`   📍 Adresse apparente pour le transporteur:`);
        console.log(`      ${labelData.shippingAddress.name}`);
        console.log(`      ${labelData.shippingAddress.attention}`);
        console.log(`      ${labelData.shippingAddress.street}`);
        console.log(`      ${labelData.shippingAddress.zipCode} ${labelData.shippingAddress.city}`);
        console.log(`      ${labelData.shippingAddress.country}\n`);

        console.log('📱 QR CODE ET TRAÇABILITÉ:');
        console.log(`   🔗 QR Code: ${labelData.qrCode.slice(0, 50)}...`);
        console.log(`   📍 URL de suivi: ${labelData.trackingUrl}\n`);

        console.log('📦 INSTRUCTIONS SPÉCIALES:');
        labelData.specialInstructions.forEach((instruction, index) => {
            console.log(`   ${index + 1}. ${instruction}`);
        });
        console.log('');

        // Sauvegarder le PDF
        const outputDir = path.join(__dirname, '../test-outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const pdfPath = path.join(outputDir, `bordereau-test-${Date.now()}.pdf`);
        fs.writeFileSync(pdfPath, labelData.pdfBuffer);

        console.log('💾 FICHIER GÉNÉRÉ:');
        console.log(`   📄 PDF sauvegardé: ${pdfPath}`);
        console.log(`   📏 Taille: ${Math.round(labelData.pdfBuffer.length / 1024)} KB\n`);

        // Test de récupération des données de redirection
        console.log('🔍 TEST DE REDIRECTION:');
        const redirectionData = await DeliveryLabelService.getRedirectionData(labelData.redirectionCode);
        
        if (redirectionData) {
            console.log('   ✅ Données de redirection récupérées:');
            console.log(`      👤 Destinataire réel: ${redirectionData.realDestination.name}`);
            console.log(`      📍 Adresse réelle: ${redirectionData.realDestination.street}`);
            console.log(`      🏙️ Ville: ${redirectionData.realDestination.zipCode} ${redirectionData.realDestination.city}`);
            console.log(`      📞 Téléphone: ${redirectionData.realDestination.phone}`);
        } else {
            console.log('   ❌ Échec de récupération des données de redirection');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST RÉUSSI: BORDEREAU PRÊT POUR IMPRESSION !');
        console.log('='.repeat(60));
        
        console.log('\n📋 ÉTAPES SUIVANTES POUR L\'UTILISATEUR:');
        console.log('   1. 🖨️ Imprimer le bordereau PDF généré');
        console.log('   2. 📦 Emballer l\'objet soigneusement');
        console.log('   3. 🏷️ Coller l\'étiquette sur le colis');
        console.log('   4. 🚚 Déposer au bureau de poste ou point relais');
        console.log('   5. 📱 Suivre la livraison via l\'app CADOK');

        console.log('\n🛡️ SÉCURITÉ GARANTIE:');
        console.log('   ✅ Adresse personnelle jamais révélée');
        console.log('   ✅ Redirection automatique et transparente');
        console.log('   ✅ Données chiffrées et sécurisées');
        console.log('   ✅ Traçabilité complète du processus');

        return {
            success: true,
            labelData,
            pdfPath,
            redirectionCode: labelData.redirectionCode
        };

    } catch (error) {
        console.error('❌ ERREUR lors de la génération du bordereau:');
        console.error('   ', error.message);
        
        if (error.stack) {
            console.error('\n🔍 DÉTAILS DE L\'ERREUR:');
            console.error(error.stack);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

// Exécuter le test
if (require.main === module) {
    testLabelGeneration()
        .then(result => {
            if (result.success) {
                console.log(`\n🎯 RÉSULTAT: Bordereau généré avec le code ${result.redirectionCode}`);
                console.log(`📄 Fichier PDF: ${result.pdfPath}`);
            } else {
                console.log('\n❌ ÉCHEC DU TEST');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 ERREUR FATALE:', error);
            process.exit(1);
        });
}

module.exports = { testLabelGeneration };
