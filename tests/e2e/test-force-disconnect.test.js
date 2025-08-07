/**
 * 🔧 TEST AVEC DÉCONNEXION FORCÉE DANS CHAQUE TEST
 */

const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');

describe('🔧 TEST AVEC DÉCONNEXION FORCÉE', () => {
  const logFile = 'c:\\Users\\JB\\Music\\cadok-backend\\test-force-disconnect.log';
  
  function log(msg) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  }
  
  beforeAll(() => {
    try { fs.unlinkSync(logFile); } catch {}
    log('=== DÉBUT TESTS AVEC DÉCONNEXION FORCÉE ===');
  });

  test('Test inscription avec déconnexion forcée AVANT chaque requête', async () => {
    log('🔧 TEST - Déconnexion forcée');
    log(`État Mongoose initial: ${mongoose.connection.readyState}`);
    log(`Base initiale: ${mongoose.connection.name || 'undefined'}`);
    log(`URI environnement: ${process.env.MONGODB_URI}`);
    
    // 1. FORCER LA DÉCONNEXION TOTALE
    if (mongoose.connection.readyState !== 0) {
      log('🔌 Force déconnexion...');
      await mongoose.disconnect();
      
      // Attendre que ce soit vraiment déconnecté
      let attempts = 0;
      while (mongoose.connection.readyState !== 0 && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      log(`État après déconnexion forcée: ${mongoose.connection.readyState}`);
    }
    
    // 2. Maintenant charger l'app (qui va se reconnecter à la bonne base)
    const app = require('../../app');
    log('📦 App chargée APRÈS déconnexion');
    
    // 3. Attendre que l'app se reconnecte
    await new Promise(resolve => setTimeout(resolve, 500));
    log(`État après rechargement app: ${mongoose.connection.readyState}`);
    log(`Base après rechargement: ${mongoose.connection.name || 'undefined'}`);
    
    // 4. Test d'inscription
    const timestamp = Date.now();
    const userData = {
      pseudo: `forced_${timestamp}`,
      email: `forced_${timestamp}@example.com`,
      password: 'Password123!'
    };

    log(`📤 Inscription avec déconnexion forcée: ${userData.email}`);

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    log(`📊 Status: ${response.status}`);
    log(`📋 Body: ${JSON.stringify(response.body)}`);
    
    if (response.status === 201) {
      log('✅ SUCCESS - Déconnexion forcée a fonctionné !');
      expect(response.status).toBe(201);
    } else if (response.status === 400 && response.body?.message === 'Email déjà utilisé') {
      log('❌ ENCORE échec - Déconnexion forcée insuffisante');
      log('🔴 Le problème est plus profond que la connexion Mongoose');
      // Pour debug, on fait échouer clairement
      expect(response.status).toBe(201);
    } else {
      log(`❌ Autre erreur: ${response.body?.message}`);
      expect(response.status).toBe(201);
    }
    
    log('=== FIN TEST DÉCONNEXION FORCÉE ===');
  });
});
