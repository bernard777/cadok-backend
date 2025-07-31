// Script de migration pour ajouter les préférences de notification aux utilisateurs existants
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cadok';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const result = await User.updateMany(
    {
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null }
      ]
    },
    {
      $set: {
        notificationPreferences: {
          notifications_push: true,
          notifications_email: false,
          promotions: false,
          sound: true,
          vibration: true
        }
      }
    }
  );
  console.log('Migration terminée:', result.modifiedCount, 'utilisateurs mis à jour.');
  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
