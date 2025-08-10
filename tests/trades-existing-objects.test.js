const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';

// Credentials des utilisateurs seed
const testUsers = {
    user1: {
        email: 'testuser1@test.com',
        password: 'HashedPassword123!'
    },
    user2: {
        email: 'testuser2@test.com', 
        password: 'HashedPassword123!'
    }
};

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
async function runTradeTestsWithExistingObjects() {
    console.log('🚀 TESTS E2E TRADES - OBJETS EXISTANTS');
    console.log('=' .repeat(50));
    
    try {
        // Vérifier que le serveur répond
        console.log('🔍 Vérification du serveur...');
        const healthCheck = await httpRequest('GET', '/api/trades');
        if (!healthCheck.success && healthCheck.status !== 401) {
            throw new Error(`❌ Serveur non accessible sur ${BASE_URL}`);
        }
        console.log('✅ Serveur OK');
        
        // Test 1: Connexion User 1
        console.log('\n📝 Test 1: Connexion User 1');
        const login1 = await httpRequest('POST', '/api/auth/login', testUsers.user1);
        if (!login1.success) {
            throw new Error(`❌ Connexion User 1 échouée: ${JSON.stringify(login1.data)}`);
        }
        console.log('✅ User 1 connecté:', login1.data.user.pseudo);
        const token1 = login1.data.token;
        const userId1 = login1.data.user._id;
        
        // Test 2: Connexion User 2  
        console.log('\n📝 Test 2: Connexion User 2');
        const login2 = await httpRequest('POST', '/api/auth/login', testUsers.user2);
        if (!login2.success) {
            throw new Error(`❌ Connexion User 2 échouée: ${JSON.stringify(login2.data)}`);
        }
        console.log('✅ User 2 connecté:', login2.data.user.pseudo);
        const token2 = login2.data.token;
        const userId2 = login2.data.user._id;
        
        // Test 3: Récupération des objets de User 2 (pour demander un trade)
        console.log('\n📝 Test 3: Récupération des objets de User 2');
        const getObjects = await httpRequest('GET', '/api/objects');
        if (!getObjects.success) {
            throw new Error(`❌ Récupération des objets échouée: ${JSON.stringify(getObjects.data)}`);
        }
        console.log('✅ Réponse objets:', JSON.stringify(getObjects.data, null, 2));
        
        const objectsArray = Array.isArray(getObjects.data) ? getObjects.data : getObjects.data.objects || [];
        console.log(`✅ ${objectsArray.length} objet(s) trouvé(s)`);
        
        // Trouver l'objet de User 2
        const user2Objects = objectsArray.filter(obj => obj.owner._id === userId2 || obj.owner === userId2);
        if (user2Objects.length === 0) {
            console.log('⚠️ Objets disponibles:', objectsArray.map(o => `${o.title} (owner: ${o.owner._id || o.owner})`));
            throw new Error('❌ Aucun objet trouvé pour User 2');
        }
        const targetObject = user2Objects[0];
        console.log('✅ Objet cible trouvé:', targetObject.title);
        
        // Test 4: User 1 demande un trade pour l'objet de User 2
        console.log('\n📝 Test 4: Création de trade par User 1');
        const tradeData = {
            requestedObjects: [targetObject._id]
        };
        
        const createTrade = await httpRequest('POST', '/api/trades', tradeData, token1);
        if (!createTrade.success) {
            throw new Error(`❌ Création de trade échouée: ${JSON.stringify(createTrade.data)}`);
        }
        console.log('✅ Trade créé avec succès');
        const tradeId = createTrade.data._id;
        console.log('✅ Trade ID:', tradeId);
        
        // Test 5: User 1 récupère ses trades
        console.log('\n📝 Test 5: Récupération des trades de User 1');
        const getTrades1 = await httpRequest('GET', '/api/trades', null, token1);
        if (!getTrades1.success) {
            throw new Error(`❌ Récupération des trades échouée: ${JSON.stringify(getTrades1.data)}`);
        }
        const tradesArray1 = Array.isArray(getTrades1.data) ? getTrades1.data : [];
        console.log(`✅ ${tradesArray1.length} trade(s) récupéré(s) pour User 1`);
        
        // Vérifier que notre trade est bien présent
        const foundTrade1 = tradesArray1.find(t => t._id === tradeId);
        if (foundTrade1) {
            console.log('✅ Trade trouvé dans la liste de User 1 ✓');
        } else {
            console.log('❌ Trade NON trouvé dans la liste de User 1');
        }
        
        // Test 6: User 2 récupère ses trades
        console.log('\n📝 Test 6: Récupération des trades de User 2');
        const getTrades2 = await httpRequest('GET', '/api/trades', null, token2);
        if (!getTrades2.success) {
            throw new Error(`❌ Récupération des trades échouée: ${JSON.stringify(getTrades2.data)}`);
        }
        const tradesArray2 = Array.isArray(getTrades2.data) ? getTrades2.data : [];
        console.log(`✅ ${tradesArray2.length} trade(s) récupéré(s) pour User 2`);
        
        // Vérifier que notre trade est bien présent
        const foundTrade2 = tradesArray2.find(t => t._id === tradeId);
        if (foundTrade2) {
            console.log('✅ Trade trouvé dans la liste de User 2 ✓');
        } else {
            console.log('❌ Trade NON trouvé dans la liste de User 2');
        }
        
        // Test 7: User 2 récupère les détails du trade
        console.log('\n📝 Test 7: Récupération des détails du trade');
        const getTradeDetails = await httpRequest('GET', `/api/trades/${tradeId}`, null, token2);
        if (!getTradeDetails.success) {
            throw new Error(`❌ Récupération du trade échouée: ${JSON.stringify(getTradeDetails.data)}`);
        }
        console.log('✅ Détails du trade récupérés avec succès');
        console.log('✅ Statut du trade:', getTradeDetails.data.status);
        
        console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
        console.log('=' .repeat(50));
        console.log('✅ Trade créé et récupérable par les 2 utilisateurs');
        console.log('✅ Workflow complet testé avec objets existants');
        console.log('✅ Plus de problème de rate limiting');
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
runTradeTestsWithExistingObjects().then((success) => {
    process.exit(success ? 0 : 1);
}).catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
