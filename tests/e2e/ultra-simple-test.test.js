/**
 * ⚡ TEST ULTRA-SIMPLE SANS DB.JS
 */

const mongoose = require('mongoose');
const fs = require('fs');

describe('⚡ Test ultra-simple', () => {
  test('Connexion directe MongoDB', async () => {
    const resultFile = 'c:\\Users\\JB\\Music\\cadok-backend\\simple-test.txt';
    
    try { fs.unlinkSync(resultFile); } catch {}
    
    function log(msg) {
      fs.appendFileSync(resultFile, `${msg}\n`);
    }
    
    log('=== TEST ULTRA-SIMPLE ===');
    log(`URI environnement: ${process.env.MONGODB_URI}`);
    log(`État initial: ${mongoose.connection.readyState}`);
    
    // Connexion directe
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    const testUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cadok_simple_test';
    log(`Connexion à: ${testUri}`);
    
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 3000 });
    log(`Connecté ! Base: ${mongoose.connection.name}`);
    
    // Test basique
    const User = require('../../models/User');
    const count = await User.countDocuments();
    log(`Users dans base: ${count}`);
    
    await mongoose.disconnect();
    log('Déconnecté avec succès');
    log('=== FIN TEST ===');
    
    expect(true).toBe(true);
  });
});
