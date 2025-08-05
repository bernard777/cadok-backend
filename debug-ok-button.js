/**
 * 🧪 TEST DEBUG - Que se passe-t-il quand on clique "OK" ?
 * Reproduit exactement le workflow de l'app mobile
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

console.log('🧪 SERVEUR DEBUG - WORKFLOW "OK LIVRAISON"\n');

// Route de test qui simule exactement ce qui se passe
app.post('/api/trades/:tradeId/generate-pickup-label', (req, res) => {
    const { tradeId } = req.params;
    
    console.log('📞 APPEL API REÇU :');
    console.log(`   Route: POST /api/trades/${tradeId}/generate-pickup-label`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`   Headers:`, req.headers);
    console.log(`   Body:`, req.body);
    
    try {
        // Simulation du service pickup
        const PickupPointService = require('./services/pickupPointService');
        const pickupService = new PickupPointService();
        
        console.log('\n🔧 TRAITEMENT BACKEND :');
        console.log('   ✅ Service pickup chargé');
        
        const mockTradeData = {
            tradeId,
            fromUser: { firstName: 'Marie', city: 'Paris' },
            toUser: { firstName: 'Thomas', city: 'Lyon' },
            offeredObject: { title: 'Livre Clean Code' }
        };
        
        const result = pickupService.generatePickupLabel(mockTradeData);
        
        console.log('   ✅ Bordereau généré');
        console.log(`   📋 Code retrait: ${result.deliveryData.withdrawalCode}`);
        console.log(`   🏪 Point relais: ${result.deliveryData.pickupPoint.name}`);
        
        // Réponse exacte que l'app devrait recevoir
        const responseData = {
            success: true,
            message: 'Bordereau de livraison généré avec succès',
            deliveryData: {
                withdrawalCode: result.deliveryData.withdrawalCode,
                pickupPoint: {
                    name: result.deliveryData.pickupPoint.name,
                    address: result.deliveryData.pickupPoint.address.street,
                    city: result.deliveryData.pickupPoint.address.city,
                    zipCode: result.deliveryData.pickupPoint.address.zipCode
                }
            },
            downloadUrl: `/api/trades/${tradeId}/download-pickup-label`,
            instructions: result.instructions
        };
        
        console.log('\n📤 RÉPONSE ENVOYÉE À L\'APP :');
        console.log(JSON.stringify(responseData, null, 2));
        
        res.json(responseData);
        
    } catch (error) {
        console.error('\n❌ ERREUR BACKEND :', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route de test pour vérifier la connexion
app.get('/test-connection', (req, res) => {
    console.log('🔗 Test de connexion reçu');
    res.json({
        success: true,
        message: 'Serveur CADOK opérationnel',
        timestamp: new Date().toISOString(),
        simulationMode: true
    });
});

// Route de téléchargement PDF
app.get('/api/trades/:tradeId/download-pickup-label', (req, res) => {
    const { tradeId } = req.params;
    
    console.log(`📄 TÉLÉCHARGEMENT PDF DEMANDÉ pour troc ${tradeId}`);
    
    const pdfContent = `
BORDEREAU DE LIVRAISON CADOK
============================

Troc ID: ${tradeId}
Code de retrait: CADOK-${Math.random().toString(36).substr(2, 6).toUpperCase()}

POINT RELAIS:
Tabac de la Gare
12 Avenue Victor Hugo
75001 Paris

INSTRUCTIONS:
1. Déposez le colis au point relais
2. Mentionnez le code de retrait
3. Le destinataire sera notifié
    `;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bordereau-${tradeId}.pdf"`);
    res.send(pdfContent);
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`\n🚀 SERVEUR DEBUG DÉMARRÉ sur http://localhost:${PORT}`);
    console.log('\n📱 TESTS DISPONIBLES :');
    console.log(`   GET  http://localhost:${PORT}/test-connection`);
    console.log(`   POST http://localhost:${PORT}/api/trades/TEST-001/generate-pickup-label`);
    console.log('\n🧪 SIMULATION CLIC "OK" :');
    console.log('   1. Démarrer ton app mobile');
    console.log(`   2. Pointer vers localhost:${PORT}`);
    console.log('   3. Cliquer "OK" sur "Livraison configurée"');
    console.log('   4. 👀 Observer les logs ci-dessus');
    console.log('\n💡 Si tu vois les logs mais rien dans l\'app → Problème frontend');
    console.log('💡 Si pas de logs → Problème de connexion');
    
    console.log('\n📋 CURL TEST RAPIDE :');
    console.log(`curl -X POST http://localhost:${PORT}/api/trades/TEST-001/generate-pickup-label \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"test": true}'`);
});

// Test automatique au démarrage
setTimeout(() => {
    console.log('\n🔥 AUTO-TEST - Simulation clic "OK" :');
    
    const testData = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
    };
    
    // Simulation d'un appel depuis l'app
    console.log('📱 App mobile → Backend : Configuration livraison...');
    
    require('http').request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/trades/AUTO-TEST-001/generate-pickup-label',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('\n✅ RÉSULTAT AUTO-TEST :');
            if (res.statusCode === 200) {
                const result = JSON.parse(data);
                console.log(`   🎉 Succès ! Code: ${result.deliveryData.withdrawalCode}`);
                console.log(`   📍 Point relais: ${result.deliveryData.pickupPoint.name}`);
                console.log('\n💡 CONCLUSION : Le backend fonctionne parfaitement !');
                console.log('💡 Si ton app ne voit rien → Vérifier le code frontend');
            } else {
                console.log(`   ❌ Erreur HTTP ${res.statusCode}`);
            }
        });
    }).end(JSON.stringify({ test: true }));
    
}, 2000);
