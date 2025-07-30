// Test des statistiques
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Trade = require('./models/Trade');
const Object = require('./models/Object');

async function testStats() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB');

    // Calcul des statistiques
    console.log('📊 Calcul des statistiques...');

    const activeUsersCount = await User.countDocuments({
      _id: { $in: await Object.distinct('owner') }
    });

    const completedTradesCount = await Trade.countDocuments({ 
      status: 'accepted' 
    });

    const availableObjectsCount = await Object.countDocuments({ 
      status: 'available' 
    });

    const totalObjectsCount = await Object.countDocuments();
    const totalUsersCount = await User.countDocuments();

    const stats = {
      activeUsers: activeUsersCount,
      completedTrades: completedTradesCount,
      availableObjects: availableObjectsCount,
      totalObjects: totalObjectsCount,
      totalUsers: totalUsersCount
    };

    console.log('📈 Statistiques:', stats);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testStats();
