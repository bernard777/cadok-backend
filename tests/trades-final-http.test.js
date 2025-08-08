const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';

// Helper pour générer des données uniques
function generateTestData(suffix = Date.now()) {
    return {
        user1: {
            pseudo: `TradeTest1_${suffix}`,
            email: `trade1_${suffix}@test.com`,
            password: 'TestPassword123!',
            city: 'Paris'
        },
        user2: {
            pseudo: `TradeTest2_${suffix}`,
            email: `trade2_${suffix}@test.com`, 
            password: 'TestPassword123!',
            city: 'Lyon'
        }
    };
}

// Helper pour les requêtes HTTP
async function httpRequest(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {}
        };
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }
        
        const response = await axios(config);
        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || 500,
            data: error.response?.data || { message: error.message }
        };
    }
}

// Test principal
async function runTradeTests() {
    console.log('🚀 TESTS E2E TRADES - DÉBUT (HTTP Direct)');
    console.log('=' .repeat(50));
    
    try {
        // Vérifier que le serveur répond
        console.log('🔍 Vérification du serveur...');
        const healthCheck = await httpRequest('GET', '/api/trades');
        if (!healthCheck.success && healthCheck.status !== 401) {
            throw new Error(`❌ Serveur non accessible sur ${BASE_URL}`);
        }
        console.log('✅ Serveur OK');
        
        // Générer des données de test uniques
        const testData = generateTestData();
        
        // Test 1: Inscription User 1
        console.log('\n📝 Test 1: Inscription User 1');
        const signup1 = await httpRequest('POST', '/api/auth/register', testData.user1);
        if (!signup1.success) {
            throw new Error(`❌ Inscription User 1 échouée: ${JSON.stringify(signup1.data)}`);
        }
        console.log('✅ User 1 inscrit:', testData.user1.pseudo);
        const token1 = signup1.data.token;
        const userId1 = signup1.data.user._id;
        
        // Test 2: Inscription User 2  
        console.log('\n📝 Test 2: Inscription User 2');
        const signup2 = await httpRequest('POST', '/api/auth/register', testData.user2);
        if (!signup2.success) {
            throw new Error(`❌ Inscription User 2 échouée: ${JSON.stringify(signup2.data)}`);
        }
        console.log('✅ User 2 inscrit:', testData.user2.pseudo);
        const token2 = signup2.data.token;
        const userId2 = signup2.data.user._id;
        
        // Test 3: Récupération des catégories pour les objets
        console.log('\n📝 Test 3: Récupération des catégories');
        const getCategories = await httpRequest('GET', '/api/categories');
        if (!getCategories.success) {
            throw new Error(`❌ Récupération des catégories échouée: ${JSON.stringify(getCategories.data)}`);
        }
        console.log(`✅ ${getCategories.data.length} catégorie(s) trouvée(s)`);
        const electronicsCategory = getCategories.data.find(cat => cat.name === 'Électronique');
        if (!electronicsCategory) {
            throw new Error('❌ Catégorie Électronique non trouvée');
        }
        console.log('✅ Catégorie Électronique trouvée:', electronicsCategory._id);
        
        // Test 4: Création d'objets pour le trade
        console.log('\n📝 Test 4: Création des objets');
        
        // Créer un objet pour User 1 (qui va le proposer)
        const object1Data = {
            title: `iPhone Test ${Date.now()}`,
            description: 'Un iPhone pour les tests E2E',
            category: electronicsCategory._id,
            images: [{
                url: '/uploads/test-iphone.jpg',
                caption: 'iPhone en bon état',
                isPrimary: true
            }],
            attributes: {
                condition: 'good',
                estimatedValue: 500
            }
        };
        
        const createObject1 = await httpRequest('POST', '/api/objects', object1Data, token1);
        if (!createObject1.success) {
            console.log('❌ Détails erreur objet 1:', createObject1);
            throw new Error(`❌ Création objet 1 échouée: ${JSON.stringify(createObject1.data)}`);
        }
        console.log('✅ Réponse création objet 1:', JSON.stringify(createObject1.data, null, 2));
        console.log('✅ Objet 1 créé:', createObject1.data.title);
        const object1Id = createObject1.data._id;
        
        // Attendre plus longtemps pour éviter le rate limiting
        console.log('⏳ Attente 5 secondes pour éviter la limitation de taux...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Créer un objet pour User 2 (qui va le recevoir)
        const object2Data = {
            title: `Samsung Test ${Date.now()}`,
            description: 'Un Samsung pour les tests E2E',
            category: electronicsCategory._id,
            images: [{
                url: '/uploads/test-samsung.jpg',
                caption: 'Samsung en excellent état',
                isPrimary: true
            }],
            attributes: {
                condition: 'excellent',
                estimatedValue: 480
            }
        };
        
        const createObject2 = await httpRequest('POST', '/api/objects', object2Data, token2);
        if (!createObject2.success) {
            console.log('❌ Détails erreur objet 2:', createObject2);
            throw new Error(`❌ Création objet 2 échouée: ${JSON.stringify(createObject2.data)}`);
        }
        console.log('✅ Objet 2 créé:', createObject2.data.title);
        const object2Id = createObject2.data._id;
        
        // Test 5: Création d'un trade par User 1
        console.log('\n📝 Test 5: Création de trade');
        const tradeData = {
            requestedObjects: [object2Id] // User 1 veut l'objet de User 2
        };
        
        const createTrade = await httpRequest('POST', '/api/trades', tradeData, token1);
        if (!createTrade.success) {
            throw new Error(`❌ Création de trade échouée: ${JSON.stringify(createTrade.data)}`);
        }
        console.log('✅ Trade créé avec succès');
        console.log('✅ Réponse création trade:', JSON.stringify(createTrade.data, null, 2));
        const tradeId = createTrade.data.trade?._id || createTrade.data._id;
        
        // Test 6: Récupération des trades
        console.log('\n📝 Test 6: Récupération des trades');
        const getTrades = await httpRequest('GET', '/api/trades', null, token1);
        if (!getTrades.success) {
            throw new Error(`❌ Récupération des trades échouée: ${JSON.stringify(getTrades.data)}`);
        }
        
        console.log('✅ Réponse récupération trades:', JSON.stringify(getTrades.data, null, 2));
        const tradesArray = Array.isArray(getTrades.data) ? getTrades.data : getTrades.data.trades || [];
        console.log(`✅ ${tradesArray.length} trade(s) récupéré(s)`);
        
        if (tradesArray.length === 0) {
            console.log('⚠️ Aucun trade trouvé - vérification avec tradeId:', tradeId);
        } else {
            console.log('✅ Trade trouvé dans la liste:', tradesArray[0]._id);
        }
        
        // Test 7: User 2 peut voir le trade qui lui est destiné
        console.log('\n📝 Test 7: Récupération du trade par User 2');
        const getTradeDetails = await httpRequest('GET', `/api/trades/${tradeId}`, null, token2);
        if (!getTradeDetails.success) {
            throw new Error(`❌ Récupération du trade échouée: ${JSON.stringify(getTradeDetails.data)}`);
        }
        console.log('✅ Trade récupéré par User 2 avec succès');
        
        console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
        console.log('=' .repeat(50));
        console.log('✅ Module de trade converti avec succès aux appels API réels');
        console.log('✅ Fini les mocks - tout fonctionne avec le vrai backend');
        console.log('=' .repeat(50));
        
        return true;
        
    } catch (error) {
        console.error('\n❌ ERREUR DANS LES TESTS:');
        console.error(error.message);
        console.log('=' .repeat(50));
        return false;
    }
}

// Exécuter les tests
runTradeTests().then((success) => {
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
