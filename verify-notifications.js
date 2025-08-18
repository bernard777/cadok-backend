const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/cadok').then(async () => {
  const db = mongoose.connection.db;
  
  // Vérifier les dernières notifications créées
  console.log('🔔 VÉRIFICATION DES NOTIFICATIONS EN BASE');
  console.log('=========================================\n');
  
  const notifications = await db.collection('notifications').find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  
  console.log('📊 5 dernières notifications créées :');
  notifications.forEach((notif, index) => {
    console.log(`${index + 1}. ${notif.title}`);
    console.log(`   Type: ${notif.type}`);
    console.log(`   Pour: ${notif.userId}`);
    console.log(`   Lue: ${notif.isRead ? '✅' : '❌'}`);
    console.log(`   Créée: ${new Date(notif.createdAt).toLocaleString()}`);
    console.log('');
  });
  
  // Vérifier les tokens push des utilisateurs
  console.log('📱 TOKENS PUSH DES UTILISATEURS DE TEST');
  console.log('=====================================\n');
  
  const users = await db.collection('users').find({
    pseudo: { $in: ['LeCollectionneur', 'Testeur2'] }
  }).project({
    pseudo: 1,
    email: 1,
    pushToken: 1,
    pushTokenUpdatedAt: 1
  }).toArray();
  
  users.forEach(user => {
    console.log(`👤 ${user.pseudo} (${user.email})`);
    console.log(`   Push Token: ${user.pushToken ? user.pushToken.substring(0, 30) + '...' : '❌ Pas de token'}`);
    console.log(`   Token mis à jour: ${user.pushTokenUpdatedAt ? new Date(user.pushTokenUpdatedAt).toLocaleString() : 'Jamais'}`);
    console.log('');
  });
  
  process.exit(0);
}).catch(console.error);
