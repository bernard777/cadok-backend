const axios = require('axios');

const testServer = async () => {
  try {
    console.log('🔍 Test du serveur backend...');
    const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    console.log('✅ Serveur backend répond:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Serveur backend ne répond pas:', error.message);
    return false;
  }
};

testServer();
