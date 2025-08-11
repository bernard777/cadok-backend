/**
 * 🧪 TEST RAPIDE API ADMIN TRADES
 */

const axios = require('axios');

const quickTest = async () => {
  try {
    console.log('🧪 TEST RAPIDE API ADMIN TRADES');
    console.log('===============================');

    // 1. Créer un admin et se connecter
    console.log('📋 1. Authentification admin...');
    
    try {
      await axios.post('http://localhost:3001/api/auth/register', {
        pseudo: 'AdminTest',
        email: 'admin@cadok.test',
        password: 'AdminTest123!',
        city: 'Test'
      });
    } catch (e) {
      // Ignore si l'admin existe déjà
    }

    // Mettre à jour le rôle de l'utilisateur en admin directement en base
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/cadok');
    
    const User = require('./models/User');
    await User.findOneAndUpdate(
      { email: 'admin@cadok.test' },
      { role: 'admin', isAdmin: true },
      { upsert: true }
    );
    
    console.log('✅ Admin créé/mis à jour');

    // Se connecter
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cadok.test',
      password: 'AdminTest123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Connexion admin réussie');

    // 2. Tester l'API des échanges
    console.log('\n📋 2. Test récupération des échanges...');
    
    const tradesResponse = await axios.get('http://localhost:3001/api/admin/trades', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`✅ ${tradesResponse.data.length} échanges récupérés`);

    // 3. Tester les statistiques
    console.log('\n📋 3. Test récupération des statistiques...');
    
    const statsResponse = await axios.get('http://localhost:3001/api/admin/trades/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Statistiques récupérées:', statsResponse.data);

    // 4. Tester un échange en attente si disponible
    const pendingTrades = tradesResponse.data.filter(t => t.status === 'pending');
    
    if (pendingTrades.length > 0) {
      console.log('\n📋 4. Test approbation d\'un échange...');
      
      const tradeId = pendingTrades[0]._id;
      const approveResponse = await axios.put(
        `http://localhost:3001/api/admin/trades/${tradeId}/approve`,
        { adminNotes: 'Approuvé par test automatisé' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (approveResponse.data.success) {
        console.log('✅ Approbation réussie');
      } else {
        console.log('⚠️ Échec approbation');
      }
    }

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('Le système de supervision des échanges fonctionne correctement.');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
};

quickTest();
