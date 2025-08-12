/**
 * VÉRIFICATION STATUS PROVIDER COURIER
 * ===================================
 * 
 * Script pour vérifier si un provider email a été configuré dans Courier
 */

require('dotenv').config();

async function checkCourierStatus() {
    console.log('🔍 === VÉRIFICATION STATUS COURIER ===\n');

    try {
        const { CourierClient } = require('@trycourier/courier');
        const courier = new CourierClient({ 
            authorizationToken: process.env.COURIER_AUTH_TOKEN 
        });

        console.log('✅ Client Courier connecté');
        console.log(`🔑 Token: ${process.env.COURIER_AUTH_TOKEN.substring(0, 15)}...\n`);

        // Test d'envoi simple pour voir l'erreur
        const testEmail = 'ndongoambassa7@gmail.com';
        
        console.log('📧 Test d\'envoi pour vérifier les providers...');
        console.log(`📍 Destinataire: ${testEmail}`);
        
        try {
            const result = await courier.send({
                message: {
                    to: { email: testEmail },
                    content: {
                        title: "Test Status Provider",
                        body: "<p>Test de vérification du provider Courier</p>"
                    }
                }
            });

            console.log('\n✅ ENVOI RÉUSSI:');
            console.log(`📮 Message ID: ${result.requestId}`);
            console.log('🎉 Un provider email est configuré et fonctionnel !');
            
            // Délai pour laisser le temps au processing
            console.log('\n⏱️  Attente 10 secondes pour vérifier la délivrance...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            console.log('\n📊 RECOMMANDATIONS:');
            console.log('   1. Vérifiez votre email (boîte + spam)');
            console.log('   2. Vérifiez les logs Courier: https://app.courier.com/logs');
            console.log('   3. Si pas reçu, le provider peut nécessiter une configuration');
            
            return { success: true, messageId: result.requestId };

        } catch (error) {
            console.log('\n❌ ERREUR LORS DE L\'ENVOI:');
            console.log(`   Type: ${error.name || 'Erreur inconnue'}`);
            console.log(`   Message: ${error.message}`);
            
            if (error.message.includes('No providers') || error.message.includes('NO_PROVIDERS')) {
                console.log('\n🔧 DIAGNOSTIC: Provider non configuré');
                console.log('   Solutions:');
                console.log('   1. Aller sur https://app.courier.com');
                console.log('   2. Settings → Providers');
                console.log('   3. Ajouter un provider SMTP (Gmail recommandé)');
                console.log('   4. Tester la connexion');
                console.log('\n📋 Configuration Gmail SMTP:');
                console.log('   • Host: smtp.gmail.com');
                console.log('   • Port: 587');
                console.log('   • Username: ndongoambassa7@gmail.com');
                console.log('   • Password: [mot de passe d\'application]');
                console.log('   • TLS: activé');
            }
            
            return { success: false, error: error.message };
        }

    } catch (error) {
        console.error('\n❌ Erreur de connexion Courier:', error.message);
        
        if (error.message.includes('Cannot find module')) {
            console.log('\n💡 Solution: npm install @trycourier/courier');
        }
        
        return { success: false, error: error.message };
    }
}

// Fonction pour tester après configuration
async function testAfterProviderConfig() {
    console.log('\n🧪 === TEST APRÈS CONFIGURATION PROVIDER ===\n');
    
    const emails = [
        'ndongoambassa7@gmail.com',
        'ndongojba@gmail.com'
    ];
    
    for (const email of emails) {
        console.log(`📧 Test avec ${email}...`);
        
        try {
            const { CourierClient } = require('@trycourier/courier');
            const courier = new CourierClient({ 
                authorizationToken: process.env.COURIER_AUTH_TOKEN 
            });
            
            const result = await courier.send({
                message: {
                    to: { email },
                    content: {
                        title: "✅ KADOC - Provider Configuré !",
                        body: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                            color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="margin: 0; font-size: 28px;">🎉 KADOC</h1>
                                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
                                        Provider Email Configuré avec Succès !
                                    </p>
                                </div>
                                
                                <div style="padding: 30px; background: white; border: 1px solid #e5e7eb;">
                                    <h2 style="color: #1f2937; margin-top: 0;">Félicitations ! 🚀</h2>
                                    
                                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                                        Votre système email KADOC avec Courier est maintenant <strong>complètement opérationnel</strong>.
                                    </p>
                                    
                                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                                        <h3 style="color: #166534; margin-top: 0; font-size: 16px;">✨ Système prêt :</h3>
                                        <ul style="color: #166534; margin: 10px 0;">
                                            <li>✅ Provider email configuré</li>
                                            <li>✅ Templates HTML professionnels</li>
                                            <li>✅ 10,000 emails gratuits/mois</li>
                                            <li>✅ Intégration KADOC complète</li>
                                        </ul>
                                    </div>
                                    
                                    <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                                        🕒 Email de test envoyé le ${new Date().toLocaleString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        `
                    }
                }
            });
            
            console.log(`   ✅ Succès - ID: ${result.requestId}`);
            
        } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
        }
        
        // Pause entre les envois
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎯 Si vous recevez ces emails, votre configuration est parfaite !');
}

// Exécution selon l'argument
if (process.argv.includes('--test-after-config')) {
    testAfterProviderConfig();
} else {
    checkCourierStatus();
}
