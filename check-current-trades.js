const axios = require('axios');

async function checkCurrentTrades() {
  try {
    console.log('🔍 ÉTAT ACTUEL DES ÉCHANGES');
    console.log('===========================\n');

    // Connexion admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@cadok.test',
      password: 'AdminTest123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Connexion admin réussie\n');

    // Récupérer TOUS les échanges
    const allTradesResponse = await axios.get('http://localhost:5000/api/admin/trades', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const allTrades = allTradesResponse.data;
    console.log(`📊 ${allTrades.length} échanges au total:\n`);

    allTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade._id} - ${trade.status.toUpperCase()}`);
      console.log(`   De: ${trade.requester.username} → À: ${trade.owner.username}`);
      console.log(`   Créé le: ${new Date(trade.createdAt).toLocaleDateString()}`);
      if (trade.adminNotes) {
        console.log(`   Notes: ${trade.adminNotes.substring(0, 100)}...`);
      }
      console.log('');
    });

    // Statistiques
    const statsResponse = await axios.get('http://localhost:5000/api/admin/trades/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 STATISTIQUES:');
    console.log(JSON.stringify(statsResponse.data, null, 2));

  } catch (error) {
    console.log('\n❌ ERREUR:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.error || error.message);
  }
}

checkCurrentTrades();
