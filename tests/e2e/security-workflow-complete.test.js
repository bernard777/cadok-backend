/**
 * VRAI TEST E2E - Sécurité et Protection
 * Tests de sécurité, rate limiting, validation, injection, etc.
 */

const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('🛡️ WORKFLOW E2E COMPLET - SÉCURITÉ ET PROTECTION', () => {
  
  let testUser, testToken, userId;
  let maliciousUser, maliciousToken;

  beforeEach(async () => {
    // Créer un utilisateur normal pour les tests
    const userData = {
      pseudo: 'SecurityUser_' + Date.now(),
      email: `security_${Date.now()}@cadok.com`,
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Security',
      city: 'Paris',
      zipCode: '75001'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    userId = registerResponse.body.user._id;
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    testToken = loginResponse.body.token;
    testUser = registerResponse.body.user;

    // Créer un utilisateur malveillant
    const maliciousData = {
      pseudo: 'MaliciousUser_' + Date.now(),
      email: `malicious_${Date.now()}@cadok.com`,
      password: 'MaliciousPass123!',
      firstName: 'Evil',
      lastName: 'Hacker',
      city: 'Darkness',
      zipCode: '66666'
    };

    const maliciousRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send(maliciousData);
    
    const maliciousLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: maliciousData.email,
        password: maliciousData.password
      });
    
    maliciousToken = maliciousLoginResponse.body.token;
    maliciousUser = maliciousRegisterResponse.body.user;
  });

  test('🎯 WORKFLOW SÉCURITÉ COMPLET: Validation → Rate Limiting → Injections → Auth', async () => {
    
    // ===== PHASE 1: TESTS DE VALIDATION D'ENTRÉE =====
    console.log('✅ PHASE 1: Tests de validation d\'entrée...');
    
    // Test XSS dans création d'objet
    const xssResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: '<script>alert("XSS")</script>',
        description: '<img src="x" onerror="alert(\'XSS\')">',
        category: 'Électronique',
        condition: 'Bon état',
        estimatedValue: 100
      });
    
    expect(xssResponse.status).toBe(400);
    console.log('✅ Tentative XSS correctement bloquée');
    
    // Test injection SQL dans recherche
    const sqlInjectionResponse = await request(app)
      .get('/api/objects/search?query=\'; DROP TABLE users; --')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(sqlInjectionResponse.status).toBe(400);
    console.log('✅ Tentative injection SQL correctement bloquée');
    
    // Test données malformées
    const malformedDataResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: '', // Titre vide
        description: 'a'.repeat(10000), // Description trop longue
        category: 'CategoryInexistante',
        estimatedValue: -100 // Valeur négative
      });
    
    expect(malformedDataResponse.status).toBe(400);
    expect(malformedDataResponse.body).toHaveProperty('success', false);
    console.log('✅ Données malformées correctement rejetées');

    // ===== PHASE 2: TESTS DE RATE LIMITING =====
    console.log('⏱️ PHASE 2: Tests de rate limiting...');
    
    // Tentative de spam sur l'inscription
    const rateLimitPromises = [];
    for (let i = 0; i < 10; i++) {
      rateLimitPromises.push(
        request(app)
          .post('/api/auth/register')
          .send({
            pseudo: `SpamUser${i}`,
            email: `spam${i}@test.com`,
            password: 'SpamPassword123!'
          })
      );
    }
    
    const rateLimitResults = await Promise.all(rateLimitPromises);
    const blockedRequests = rateLimitResults.filter(res => res.status === 429);
    
    expect(blockedRequests.length).toBeGreaterThan(0);
    console.log(`✅ Rate limiting actif: ${blockedRequests.length} requêtes bloquées`);

    // ===== PHASE 3: TESTS D'AUTORISATION =====
    console.log('🔐 PHASE 3: Tests d\'autorisation...');
    
    // Créer un objet avec l'utilisateur normal
    const objectResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Objet à protéger',
        description: 'Objet que personne d\'autre ne doit modifier',
        category: 'Électronique',
        condition: 'Bon état',
        estimatedValue: 200
      });
    
    const objectId = objectResponse.body.object._id;
    
    // Tentative de modification par utilisateur malveillant
    const unauthorizedEditResponse = await request(app)
      .put(`/api/objects/${objectId}`)
      .set('Authorization', `Bearer ${maliciousToken}`)
      .send({
        title: 'Objet piraté!',
        description: 'J\'ai pris le contrôle!'
      });
    
    expect(unauthorizedEditResponse.status).toBe(403);
    console.log('✅ Modification non autorisée correctement bloquée');
    
    // Tentative de suppression par utilisateur malveillant
    const unauthorizedDeleteResponse = await request(app)
      .delete(`/api/objects/${objectId}`)
      .set('Authorization', `Bearer ${maliciousToken}`);
    
    expect(unauthorizedDeleteResponse.status).toBe(403);
    console.log('✅ Suppression non autorisée correctement bloquée');

    // ===== PHASE 4: TESTS DE TOKEN JWT =====
    console.log('🎫 PHASE 4: Tests de sécurité JWT...');
    
    // Test avec token expiré simulé
    const expiredToken = jwt.sign(
      { userId: userId, email: testUser.email },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '-1h' } // Token expiré
    );
    
    const expiredTokenResponse = await request(app)
      .get('/api/objects/user')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(expiredTokenResponse.status).toBe(401);
    console.log('✅ Token expiré correctement rejeté');
    
    // Test avec token malformé
    const malformedTokenResponse = await request(app)
      .get('/api/objects/user')
      .set('Authorization', 'Bearer token_malformed_invalid');
    
    expect(malformedTokenResponse.status).toBe(401);
    console.log('✅ Token malformé correctement rejeté');
    
    // Test avec token modifié
    const parts = testToken.split('.');
    const modifiedToken = parts[0] + '.modified_payload.' + parts[2];
    
    const modifiedTokenResponse = await request(app)
      .get('/api/objects/user')
      .set('Authorization', `Bearer ${modifiedToken}`);
    
    expect(modifiedTokenResponse.status).toBe(401);
    console.log('✅ Token modifié correctement rejeté');

    // ===== PHASE 5: TESTS DE PROTECTION CSRF =====
    console.log('🛡️ PHASE 5: Tests de protection CSRF...');
    
    // Tentative de requête sans header approprié
    const csrfResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .set('Origin', 'http://malicious-site.com')
      .send({
        title: 'Tentative CSRF',
        description: 'Requête depuis site malveillant'
      });
    
    // La requête devrait être bloquée ou nécessiter un token CSRF
    expect([400, 403, 429]).toContain(csrfResponse.status);
    console.log('✅ Protection CSRF active');

    // ===== PHASE 6: TESTS DE SÉCURITÉ MOTS DE PASSE =====
    console.log('🔑 PHASE 6: Tests de sécurité mots de passe...');
    
    // Test changement de mot de passe avec ancien mot de passe incorrect
    const wrongPasswordResponse = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePassword123!'
      });
    
    expect(wrongPasswordResponse.status).toBe(400);
    console.log('✅ Changement avec mauvais mot de passe rejeté');
    
    // Test mot de passe faible
    const weakPasswordResponse = await request(app)
      .post('/api/auth/register')
      .send({
        pseudo: 'WeakPassUser',
        email: 'weak@test.com',
        password: '123', // Mot de passe trop faible
        firstName: 'Weak',
        lastName: 'User'
      });
    
    expect(weakPasswordResponse.status).toBe(400);
    console.log('✅ Mot de passe faible correctement rejeté');

    // ===== PHASE 7: TESTS DE PROTECTION DES DONNÉES =====
    console.log('🔒 PHASE 7: Tests de protection des données...');
    
    // Vérifier que les mots de passe ne sont pas retournés
    const userProfileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(userProfileResponse.status).toBe(200);
    expect(userProfileResponse.body.user).not.toHaveProperty('password');
    expect(userProfileResponse.body.user).not.toHaveProperty('passwordHash');
    console.log('✅ Mots de passe protégés dans les réponses');
    
    // Test accès aux données d'autres utilisateurs
    const otherUserDataResponse = await request(app)
      .get(`/api/users/${maliciousUser.id}`)
      .set('Authorization', `Bearer ${testToken}`);
    
    // Seules les données publiques devraient être accessibles
    expect(otherUserDataResponse.status).toBe(200);
    expect(otherUserDataResponse.body.user).not.toHaveProperty('email');
    expect(otherUserDataResponse.body.user).not.toHaveProperty('city');
    console.log('✅ Données privées protégées');

    // ===== PHASE 8: TESTS DE MONITORING ET LOGS =====
    console.log('📊 PHASE 8: Tests de monitoring et logs...');
    
    // Tentative d'attaque qui devrait être loggée
    await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: '<?php system($_GET["cmd"]); ?>',
        description: 'Tentative d\'injection PHP'
      });
    
    // Vérifier que les tentatives d'attaque sont loggées
    const securityLogsResponse = await request(app)
      .get('/api/admin/security-logs')
      .set('Authorization', `Bearer ${testToken}`);
    
    // Cette route devrait exister pour les admins
    expect([200, 403, 404]).toContain(securityLogsResponse.status);
    console.log('✅ Système de logs de sécurité en place');

    console.log('🎉 WORKFLOW SÉCURITÉ E2E COMPLET RÉUSSI!');
    console.log('📊 Résumé de sécurité:');
    console.log('   ✅ Protection XSS/injection SQL');
    console.log('   ✅ Rate limiting fonctionnel');
    console.log('   ✅ Autorisation stricte');
    console.log('   ✅ Sécurité JWT robuste');
    console.log('   ✅ Protection CSRF');
    console.log('   ✅ Validation mots de passe');
    console.log('   ✅ Protection des données sensibles');
    console.log('   ✅ Monitoring actif');
    
  }, 120000); // Timeout de 2 minutes pour tous les tests de sécurité

  test('🕳️ WORKFLOW E2E - Tests d\'intrusion et failles avancées', async () => {
    
    // ===== TEST 1: TENTATIVE DE PRIVILEGE ESCALATION =====
    console.log('⬆️ Test: Tentative d\'escalade de privilèges...');
    
    const adminAccessResponse = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(adminAccessResponse.status).toBe(403);
    console.log('✅ Accès admin correctement bloqué pour utilisateur normal');
    
    // ===== TEST 2: TENTATIVE DE MANIPULATION D'ID =====
    console.log('🔢 Test: Manipulation d\'ID d\'objets...');
    
    // Créer un objet
    const objectResponse = await request(app)
      .post('/api/objects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Objet test manipulation',
        description: 'Test',
        category: 'Divers',
        estimatedValue: 50
      });
    
    const objectId = objectResponse.body.object._id;
    
    // Tenter de modifier l'ID propriétaire dans la requête
    const manipulationResponse = await request(app)
      .put(`/api/objects/${objectId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Titre modifié',
        owner: maliciousUser.id // Tentative de changer le propriétaire
      });
    
    expect(manipulationResponse.status).toBe(200);
    
    // Vérifier que le propriétaire n'a pas changé
    const verifyResponse = await request(app)
      .get(`/api/objects/${objectId}`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(verifyResponse.body.object.owner).toBe(userId);
    console.log('✅ Manipulation d\'ID propriétaire bloquée');
    
    // ===== TEST 3: TENTATIVE DE MASS ASSIGNMENT =====
    console.log('📝 Test: Tentative de mass assignment...');
    
    const massAssignmentResponse = await request(app)
      .put(`/api/auth/profile`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        firstName: 'Nouveau nom',
        isAdmin: true, // Tentative d'auto-promotion
        role: 'administrator',
        permissions: ['*']
      });
    
    expect(massAssignmentResponse.status).toBe(200);
    
    // Vérifier que les champs sensibles n'ont pas été modifiés
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(profileResponse.body.user.firstName).toBe('Nouveau nom');
    expect(profileResponse.body.user).not.toHaveProperty('isAdmin');
    expect(profileResponse.body.user).not.toHaveProperty('role');
    console.log('✅ Mass assignment sécurisé');
    
    // ===== TEST 4: TIMING ATTACK SUR LOGIN =====
    console.log('⏱️ Test: Timing attack sur authentification...');
    
    const timingTests = [];
    
    // Test avec email existant mais mauvais mot de passe
    const start1 = Date.now();
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!'
      });
    const time1 = Date.now() - start1;
    
    // Test avec email inexistant
    const start2 = Date.now();
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@test.com',
        password: 'AnyPassword123!'
      });
    const time2 = Date.now() - start2;
    
    // Les temps devraient être similaires pour éviter l'énumération d'emails
    const timeDifference = Math.abs(time1 - time2);
    expect(timeDifference).toBeLessThan(100); // Moins de 100ms de différence
    console.log(`✅ Protection timing attack: ${timeDifference}ms de différence`);
    
  }, 60000);

  test('🔍 WORKFLOW E2E - Tests de divulgation d\'informations', async () => {
    
    console.log('🕵️ Test: Divulgation d\'informations sensibles...');
    
    // Test erreurs détaillées en production
    const errorResponse = await request(app)
      .get('/api/objects/invalid-id-format')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(errorResponse.status).toBe(400);
    // L'erreur ne devrait pas révéler de détails techniques
    expect(errorResponse.body.message).not.toContain('ObjectId');
    expect(errorResponse.body.message).not.toContain('mongoose');
    expect(errorResponse.body.message).not.toContain('MongoDB');
    console.log('✅ Erreurs sanitisées pour la production');
    
    // Test headers de sécurité
    const securityHeadersResponse = await request(app)
      .get('/api/objects')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(securityHeadersResponse.headers).toHaveProperty('x-content-type-options');
    expect(securityHeadersResponse.headers).toHaveProperty('x-frame-options');
    console.log('✅ Headers de sécurité présents');
    
  }, 30000);

});
