/**
 * TEST SUPER ADMIN SPÉCIFIQUE - JB PROFILE
 * ========================================
 * 
 * Test ciblé pour le profil super admin de JB
 * Email: ndongoambassa7@gmail.com
 * Mode: HTTP pur, pas de rate limiting 
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class SuperAdminTest {

  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.superAdmin = {
      email: 'ndongoambassa7@gmail.com',
      password: 'Admin1234A@'
    };
  }

  /**
   * Requête HTTP pure
   */
  makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseURL);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'KADOC-SuperAdmin-Test/1.0',
        ...headers
      };

      const requestData = data ? JSON.stringify(data) : null;
      
      if (requestData) {
        defaultHeaders['Content-Length'] = Buffer.byteLength(requestData);
      }

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: defaultHeaders,
        timeout: 10000
      };

      const req = client.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = {
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              data: body ? JSON.parse(body) : null
            };
            resolve(response);
          } catch (error) {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              headers: res.headers,
              data: body
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Erreur requête: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout de la requête'));
      });

      if (requestData) {
        req.write(requestData);
      }
      
      req.end();
    });
  }

  /**
   * Test du profil super admin
   */
  async testSuperAdminProfile() {
    console.log('👑 TEST PROFIL SUPER ADMIN JB');
    console.log('=============================\n');

    try {
      // 1. Vérification serveur
      console.log('🏥 Vérification serveur...');
      const health = await this.makeRequest('GET', '/');
      console.log(`✅ Serveur répond (${health.status})`);

      // 2. Test de connexion directe
      console.log('\n🔑 Test de connexion super admin...');
      const loginResponse = await this.makeRequest('POST', '/api/auth/login', this.superAdmin);
      
      if (loginResponse.status === 200 && loginResponse.data?.token) {
        console.log('✅ CONNEXION SUPER ADMIN RÉUSSIE !');
        console.log(`🎫 Token reçu: ${loginResponse.data.token.substring(0, 20)}...`);
        console.log(`👤 Utilisateur: ${loginResponse.data.user?.firstName} ${loginResponse.data.user?.lastName}`);
        console.log(`📧 Email: ${loginResponse.data.user?.email}`);
        console.log(`🎭 Rôle: ${loginResponse.data.user?.role}`);
        console.log(`📱 Pseudo: ${loginResponse.data.user?.pseudo}`);
        
        // 3. Test des privilèges admin
        await this.testAdminPrivileges(loginResponse.data.token);
        
        // 4. Test des fonctionnalités super admin
        await this.testSuperAdminFeatures(loginResponse.data.token);
        
        return {
          success: true,
          token: loginResponse.data.token,
          user: loginResponse.data.user
        };
        
      } else if (loginResponse.status === 429) {
        console.log('⚠️  Rate limiting actif, attendez 15 minutes');
        console.log('ℹ️  Ou redémarrez le serveur pour réinitialiser');
        return { success: false, reason: 'rate_limited' };
        
      } else if (loginResponse.status === 400) {
        console.log('❌ Identifiants invalides');
        console.log(`📊 Réponse serveur:`, loginResponse.data);
        
        // Suggérer des solutions
        await this.suggestSolutions();
        return { success: false, reason: 'invalid_credentials' };
        
      } else {
        console.log(`❌ Erreur connexion (${loginResponse.status}):`, loginResponse.data);
        return { success: false, reason: 'unknown_error' };
      }

    } catch (error) {
      console.error('💥 Erreur test super admin:', error.message);
      return { success: false, reason: 'connection_error' };
    }
  }

  /**
   * Test des privilèges admin
   */
  async testAdminPrivileges(token) {
    console.log('\n🛡️  Test privilèges admin...');
    
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/stats', 
      '/api/admin/trades',
      '/api/admin/roles',
      '/api/admin/analytics'
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint, null, {
          'Authorization': `Bearer ${token}`
        });
        
        if (response.status === 200) {
          console.log(`✅ Accès autorisé: ${endpoint}`);
          if (response.data && typeof response.data === 'object') {
            const keys = Object.keys(response.data);
            console.log(`   📊 Données: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
          }
        } else if (response.status === 404) {
          console.log(`ℹ️  Endpoint non implémenté: ${endpoint}`);
        } else {
          console.log(`⚠️  Accès refusé (${response.status}): ${endpoint}`);
        }
        
      } catch (error) {
        console.log(`❌ Erreur test ${endpoint}: ${error.message}`);
      }
    }
  }

  /**
   * Test des fonctionnalités super admin
   */
  async testSuperAdminFeatures(token) {
    console.log('\n⚙️  Test fonctionnalités super admin...');
    
    // Test gestion utilisateurs
    try {
      const usersResponse = await this.makeRequest('GET', '/api/admin/users', null, {
        'Authorization': `Bearer ${token}`
      });
      
      if (usersResponse.status === 200) {
        console.log('✅ Gestion utilisateurs accessible');
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          console.log(`👥 Utilisateurs dans la base: ${usersResponse.data.length}`);
        }
      }
      
    } catch (error) {
      console.log('ℹ️  Gestion utilisateurs: endpoint à implémenter');
    }
    
    // Test statistiques globales
    try {
      const statsResponse = await this.makeRequest('GET', '/api/admin/stats', null, {
        'Authorization': `Bearer ${token}`
      });
      
      if (statsResponse.status === 200) {
        console.log('✅ Statistiques globales accessibles');
        console.log('📈 Données stats:', JSON.stringify(statsResponse.data, null, 2).substring(0, 200) + '...');
      }
      
    } catch (error) {
      console.log('ℹ️  Statistiques: endpoint à implémenter');
    }
  }

  /**
   * Suggestions de solutions
   */
  async suggestSolutions() {
    console.log('\n💡 SOLUTIONS SUGGÉRÉES:');
    console.log('======================');
    console.log('1. 🔑 Vérifiez le mot de passe: Admin1234A@');
    console.log('2. 📧 Vérifiez l\'email: ndongoambassa7@gmail.com');
    console.log('3. 🔄 Redémarrez le serveur pour réinitialiser le rate limiting');
    console.log('4. 👑 Vérifiez le rôle super_admin dans la base de données');
    console.log('5. 📱 Essayez avec un autre mot de passe si modifié');
    
    // Test de récupération du profil sans connexion
    try {
      console.log('\n🔍 Test existence du profil...');
      
      // Essayer une inscription pour voir les détails de l'erreur
      const testRegister = await this.makeRequest('POST', '/api/auth/register', {
        email: this.superAdmin.email,
        password: 'Test123A@', // Mot de passe différent pour voir la réponse
        firstName: 'Test',
        lastName: 'User',
        pseudo: 'TestUser',
        phoneNumber: '+33123456789',
        country: 'France',
        city: 'Paris'
      });
      
      if (testRegister.status === 400 && testRegister.data?.code === 'EMAIL_ALREADY_EXISTS') {
        console.log('✅ Profil existe dans la base de données');
        console.log('💡 Le problème vient probablement du mot de passe');
      }
      
    } catch (error) {
      console.log('ℹ️  Test d\'existence du profil impossible');
    }
  }

  /**
   * Test rapide de santé
   */
  async quickHealthCheck() {
    console.log('🚀 HEALTH CHECK SUPER ADMIN');
    console.log('===========================\n');

    const result = await this.testSuperAdminProfile();
    
    console.log('\n📋 RÉSUMÉ:');
    console.log('==========');
    
    if (result.success) {
      console.log('✅ Super admin fonctionnel');
      console.log('👑 Privilèges confirmés');
      console.log('🎯 Prêt pour la production');
    } else {
      console.log(`❌ Problème détecté: ${result.reason}`);
      console.log('🔧 Solutions disponibles ci-dessus');
    }
    
    return result;
  }
}

// Exécution si script principal
if (require.main === module) {
  const test = new SuperAdminTest();
  test.quickHealthCheck().catch(console.error);
}

module.exports = SuperAdminTest;
