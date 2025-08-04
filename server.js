require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connecté à MongoDB');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    console.log(`🌐 Accessible sur: http://192.168.1.16:${PORT}`);
  });
})
.catch((err) => {
  console.error('Erreur MongoDB :', err);
});
