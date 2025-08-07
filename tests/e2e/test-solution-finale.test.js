/**
 * 🎯 TEST AUTH AVEC CONNEXION FORCÉE AVANT APP
 * Solution finale pour les tests d'inscription
 */

const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');

describe('🎯 TEST AUTH - CONNEXION FORCÉE AVANT APP', () => {
  const logFile = 'c:\\Users\\JB\\Music\\cadok-backend\\test-solution-finale.log';
  
  function log(msg) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
  }
  
  beforeAll(() => {
    try { fs.unlinkSync(logFile); } catch {}
    log('=== TEST AVEC CONNEXION FORCÉE AVANT APP ===');
  });

  test('Test inscription avec connexion forcée AVANT app', async () => {
    log('🎯 DÉBUT - Test connexion forcée avant app');
    log(`État Mongoose initial: ${mongoose.connection.readyState}`);
    log(`URI environnement: ${process.env.MONGODB_URI}`);
    
    // 1. FORCER LA DÉCONNEXION COMPLÈTE
    if (mongoose.connection.readyState !== 0) {
      log('🔌 Déconnexion forcée...');
      await mongoose.disconnect();
      
      // Attendre la déconnexion
      let attempts = 0;
      while (mongoose.connection.readyState !== 0 && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      log(`État après déconnexion: ${mongoose.connection.readyState}`);
    }
    
    // 2. CONNEXION MANUELLE À LA BONNE BASE
    const targetUri = process.env.MONGODB_URI;
    log(`🔗 Connexion manuelle à: ${targetUri}`);
    
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    log(`✅ Connecté manuellement - readyState: ${mongoose.connection.readyState}`);
    log(`✅ Base connectée: ${mongoose.connection.name || 'undefined'}`);
    
    // 3. MAINTENANT charger l'app (qui va réutiliser la connexion)
    const app = require('../../app');
    log('📦 App chargée APRÈS connexion manuelle');
    
    // 4. Attendre un peu pour stabiliser
    await new Promise(resolve => setTimeout(resolve, 200));
    log(`État final avant test: ${mongoose.connection.readyState}`);
    log(`Base finale: ${mongoose.connection.name || 'undefined'}`);
    
    // 5. TEST D'INSCRIPTION
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(7);
    
    const userData = {
      pseudo: `forced_conn_${timestamp}_${randomPart}`,
      email: `forced_${timestamp}_${randomPart}@example.com`,
      password: 'Password123!'
    };

    log(`📤 Inscription avec connexion manuelle: ${userData.email}`);

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    log(`📊 Status: ${response.status}`);
    log(`📋 Body: ${JSON.stringify(response.body)}`);
    
    if (response.status === 201) {
      log('🎉 SUCCESS ! La connexion forcée avant app a fonctionné !');
      log('🎉 SOLUTION TROUVÉE : Il faut connecter MongoDB AVANT de charger app.js');
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    } else if (response.status === 400 && response.body?.message === 'Email déjà utilisé') {
      log('❌ Toujours "Email déjà utilisé" même avec connexion forcée');
      log('🔴 Le problème est ailleurs - peut-être dans les routes/auth.js');
      expect(response.status).toBe(201); // Faire échouer pour debug
    } else {
      log(`❌ Autre erreur: ${response.body?.message || 'Erreur inconnue'}`);
      expect(response.status).toBe(201);
    }
    
    log('=== FIN TEST CONNEXION FORCÉE ===');
  });
  
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
});
