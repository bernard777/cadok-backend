/**
 * DIAGNOSTIC ET CORRECTION SUPER ADMIN
 * ====================================
 * 
 * Script pour diagnostiquer et corriger le profil super admin JB
 * Gestion des mots de passe hashés en base de données
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

class SuperAdminDiagnostic {

  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kadoc';
    this.superAdminEmail = 'ndongoambassa7@gmail.com';
    this.newPassword = 'Admin1234A@';
  }

  /**
   * Connexion à MongoDB
   */
  async connectDatabase() {
    try {
      await mongoose.connect(this.mongoUri);
      console.log('✅ Connecté à MongoDB');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB:', error.message);
      return false;
    }
  }

  /**
   * Recherche du profil super admin
   */
  async findSuperAdminProfile() {
    try {
      // Import du modèle User
      const User = require('../models/User');
      
      const user = await User.findOne({ email: this.superAdminEmail });
      
      if (user) {
        console.log('✅ Profil super admin trouvé:');
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Nom: ${user.firstName} ${user.lastName}`);
        console.log(`   📱 Pseudo: ${user.pseudo}`);
        console.log(`   🎭 Rôle: ${user.role}`);
        console.log(`   📅 Créé: ${user.createdAt}`);
        console.log(`   ✅ Vérifié: ${user.isVerified}`);
        console.log(`   🔐 Mot de passe hashé: ${user.password?.substring(0, 20)}...`);
        
        return user;
      } else {
        console.log('❌ Profil super admin non trouvé');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Erreur recherche profil:', error.message);
      return null;
    }
  }

  /**
   * Test du mot de passe actuel
   */
  async testCurrentPassword(user, testPassword) {
    try {
      console.log(`\n🔐 Test mot de passe: ${testPassword}`);
      
      const isValid = await bcrypt.compare(testPassword, user.password);
      
      if (isValid) {
        console.log('✅ Mot de passe valide !');
        return true;
      } else {
        console.log('❌ Mot de passe invalide');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur test mot de passe:', error.message);
      return false;
    }
  }

  /**
   * Mise à jour du mot de passe
   */
  async updatePassword(userId, newPassword) {
    try {
      console.log(`\n🔄 Mise à jour du mot de passe...`);
      
      // Hash du nouveau mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, { 
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      console.log('✅ Mot de passe mis à jour avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur mise à jour mot de passe:', error.message);
      return false;
    }
  }

  /**
   * S'assurer que l'utilisateur est super admin
   */
  async ensureSuperAdminRole(userId) {
    try {
      console.log(`\n👑 Vérification rôle super admin...`);
      
      const User = require('../models/User');
      const updated = await User.findByIdAndUpdate(userId, { 
        role: 'super_admin',
        updatedAt: new Date()
      }, { new: true });
      
      if (updated) {
        console.log('✅ Rôle super_admin confirmé');
        return true;
      } else {
        console.log('❌ Erreur mise à jour rôle');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur mise à jour rôle:', error.message);
      return false;
    }
  }

  /**
   * Test de connexion API
   */
  async testApiLogin() {
    console.log('\n🌐 Test connexion API...');
    
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const loginData = JSON.stringify({
        email: this.superAdminEmail,
        password: this.newPassword
      });
      
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length
        }
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            
            if (res.statusCode === 200 && response.token) {
              console.log('✅ CONNEXION API RÉUSSIE !');
              console.log(`🎫 Token: ${response.token.substring(0, 20)}...`);
              console.log(`👑 Super Admin: ${response.user?.email}`);
              console.log(`🎭 Rôle: ${response.user?.role}`);
              resolve(response);
            } else {
              console.log(`❌ Échec connexion API (${res.statusCode}):`, response);
              resolve(null);
            }
            
          } catch (error) {
            console.log('❌ Réponse API non-JSON:', body);
            resolve(null);
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('❌ Erreur requête API:', error.message);
        resolve(null);
      });
      
      req.write(loginData);
      req.end();
    });
  }

  /**
   * Diagnostic complet
   */
  async runFullDiagnostic() {
    console.log('🔍 DIAGNOSTIC SUPER ADMIN JB');
    console.log('============================\n');

    // 1. Connexion base de données
    const dbConnected = await this.connectDatabase();
    if (!dbConnected) {
      return false;
    }

    // 2. Recherche du profil
    const user = await this.findSuperAdminProfile();
    if (!user) {
      await this.createSuperAdminProfile();
      return false;
    }

    // 3. Test des mots de passe possibles
    const possiblePasswords = [
      'Admin1234A@',
      'admin1234',
      'Admin123!',
      'Kadoc2024!',
      'SuperAdmin123@'
    ];

    let validPassword = null;
    for (const pwd of possiblePasswords) {
      const isValid = await this.testCurrentPassword(user, pwd);
      if (isValid) {
        validPassword = pwd;
        break;
      }
    }

    // 4. Si aucun mot de passe valide, mettre à jour
    if (!validPassword) {
      console.log('\n🔧 Aucun mot de passe valide trouvé, mise à jour...');
      const updated = await this.updatePassword(user._id, this.newPassword);
      if (updated) {
        validPassword = this.newPassword;
      }
    }

    // 5. S'assurer du rôle super admin
    await this.ensureSuperAdminRole(user._id);

    // 6. Test de connexion API
    if (validPassword) {
      const apiResult = await this.testApiLogin();
      
      if (apiResult) {
        console.log('\n🎉 SUPER ADMIN OPÉRATIONNEL !');
        console.log('=============================');
        console.log(`📧 Email: ${this.superAdminEmail}`);
        console.log(`🔐 Mot de passe: ${this.newPassword}`);
        console.log(`🎭 Rôle: super_admin`);
        console.log(`🎫 Token: Généré avec succès`);
      }
    }

    // 7. Fermeture connexion
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion MongoDB');
    
    return true;
  }

  /**
   * Création du profil super admin si inexistant
   */
  async createSuperAdminProfile() {
    try {
      console.log('\n👑 Création profil super admin...');
      
      const User = require('../models/User');
      const hashedPassword = await bcrypt.hash(this.newPassword, 12);
      
      const superAdmin = new User({
        email: this.superAdminEmail,
        password: hashedPassword,
        firstName: 'Jean-Baptiste',
        lastName: 'Ndongo Ambassa',
        pseudo: 'SuperAdminJB',
        phoneNumber: '+237612345678',
        country: 'Cameroun',
        city: 'Yaoundé',
        role: 'super_admin',
        isVerified: true,
        isActive: true
      });
      
      await superAdmin.save();
      console.log('✅ Profil super admin créé avec succès');
      
      return superAdmin;
      
    } catch (error) {
      console.error('❌ Erreur création profil:', error.message);
      return null;
    }
  }
}

// Exécution si script principal
if (require.main === module) {
  const diagnostic = new SuperAdminDiagnostic();
  diagnostic.runFullDiagnostic().catch(console.error);
}

module.exports = SuperAdminDiagnostic;
