/**
 * 🧪 SCRIPT DE TEST DU SYSTÈME DE NOTIFICATIONS
 * Teste toutes les fonctionnalités du système de notifications intelligent
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SmartNotificationService = require('../services/smartNotificationService');

// Configuration de test
const TEST_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok-test',
  TEST_USER_ID: null
};

class NotificationSystemTester {
  constructor() {
    this.smartNotificationService = new SmartNotificationService();
    this.testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('🧪 DÉBUT DES TESTS DU SYSTÈME DE NOTIFICATIONS\n');

    try {
      // Connexion à la base de données
      await this.connectToDatabase();
      
      // Créer un utilisateur de test
      await this.createTestUser();
      
      // Tests des préférences
      await this.testNotificationPreferences();
      
      // Tests des différents types de notifications
      await this.testPersonalizedNotifications();
      
      // Tests des notifications intelligentes
      await this.testSmartNotifications();
      
      // Tests des heures silencieuses
      await this.testQuietHours();
      
      // Afficher les résultats
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
    } finally {
      await this.cleanup();
      await mongoose.connection.close();
    }
  }

  async connectToDatabase() {
    console.log('🔌 Connexion à la base de données...');
    await mongoose.connect(TEST_CONFIG.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB\n');
  }

  async createTestUser() {
    console.log('👤 Création d\'un utilisateur de test...');
    
    // Supprimer l'utilisateur de test s'il existe
    await User.deleteOne({ email: 'test-notifications@cadok.com' });
    
    const testUser = new User({
      pseudo: 'TestNotifications',
      email: 'test-notifications@cadok.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'Notifications',
      phoneNumber: '+33123456789',
      address: {
        street: '123 Test Street',
        city: 'Paris',
        zipCode: '75001',
        country: 'France'
      },
      city: 'Paris',
      notificationPreferences: {
        notifications_push: true,
        newMessages: true,
        tradeUpdates: true,
        objectInterest: true,
        marketingTips: false,
        communityUpdates: true,
        smartSuggestions: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        frequency: 'normal'
      }
    });

    const savedUser = await testUser.save();
    TEST_CONFIG.TEST_USER_ID = savedUser._id;
    console.log('✅ Utilisateur de test créé:', savedUser.pseudo, '\n');
  }

  async testNotificationPreferences() {
    console.log('⚙️ TEST DES PRÉFÉRENCES DE NOTIFICATIONS');
    
    try {
      const user = await User.findById(TEST_CONFIG.TEST_USER_ID);
      
      // Test 1: Vérifier que les préférences par défaut sont définies
      if (user.notificationPreferences && user.notificationPreferences.newMessages === true) {
        this.addTestResult(true, 'Préférences par défaut correctement définies');
      } else {
        this.addTestResult(false, 'Préférences par défaut manquantes');
      }
      
      // Test 2: Tester canReceiveNotification
      const canReceiveMessages = this.smartNotificationService.canReceiveNotification(user, 'new_messages');
      if (canReceiveMessages) {
        this.addTestResult(true, 'canReceiveNotification fonctionne pour new_messages');
      } else {
        this.addTestResult(false, 'canReceiveNotification défaillant pour new_messages');
      }
      
      // Test 3: Tester avec préférence désactivée
      await User.findByIdAndUpdate(TEST_CONFIG.TEST_USER_ID, {
        'notificationPreferences.marketingTips': false
      });
      
      const updatedUser = await User.findById(TEST_CONFIG.TEST_USER_ID);
      const canReceiveMarketing = this.smartNotificationService.canReceiveNotification(updatedUser, 'marketing_tips');
      
      if (!canReceiveMarketing) {
        this.addTestResult(true, 'Préférences désactivées respectées');
      } else {
        this.addTestResult(false, 'Préférences désactivées non respectées');
      }
      
    } catch (error) {
      this.addTestResult(false, `Erreur test préférences: ${error.message}`);
    }
    
    console.log('');
  }

  async testPersonalizedNotifications() {
    console.log('🎯 TEST DES NOTIFICATIONS PERSONNALISÉES');
    
    const notificationTypes = [
      {
        type: 'new_message',
        data: {
          senderName: 'Alice Test',
          messagePreview: 'Salut ! Comment ça va ?',
          conversationId: 'conv_test_123'
        }
      },
      {
        type: 'trade_update',
        data: {
          tradeId: 'trade_test_456',
          newStatus: 'accepted',
          otherUserName: 'Bob Test'
        }
      },
      {
        type: 'object_interest',
        data: {
          objectId: 'obj_test_789',
          objectName: 'Vélo de test',
          interestedUserName: 'Charlie Test',
          interestType: 'view'
        }
      }
    ];

    for (const { type, data } of notificationTypes) {
      try {
        const result = await this.smartNotificationService.sendPersonalizedNotification(
          TEST_CONFIG.TEST_USER_ID,
          type,
          data
        );

        if (result.success && result.notification) {
          this.addTestResult(true, `Notification ${type} créée avec succès`);
          
          // Vérifier que la notification est bien en base
          const dbNotification = await Notification.findById(result.notification._id);
          if (dbNotification) {
            this.addTestResult(true, `Notification ${type} sauvegardée en base`);
          } else {
            this.addTestResult(false, `Notification ${type} non sauvegardée`);
          }
        } else {
          this.addTestResult(false, `Échec création notification ${type}: ${result.error || result.reason}`);
        }
      } catch (error) {
        this.addTestResult(false, `Erreur notification ${type}: ${error.message}`);
      }
    }
    
    console.log('');
  }

  async testSmartNotifications() {
    console.log('🧠 TEST DES NOTIFICATIONS INTELLIGENTES');
    
    try {
      const results = await this.smartNotificationService.sendContextualNotifications();
      
      if (results.success) {
        this.addTestResult(true, `Notifications intelligentes: ${results.totalSent} envoyées`);
        
        // Vérifier le breakdown
        if (results.breakdown && typeof results.breakdown === 'object') {
          this.addTestResult(true, 'Breakdown des notifications fourni');
        } else {
          this.addTestResult(false, 'Breakdown manquant');
        }
      } else {
        this.addTestResult(false, `Échec notifications intelligentes: ${results.error}`);
      }
    } catch (error) {
      this.addTestResult(false, `Erreur notifications intelligentes: ${error.message}`);
    }
    
    console.log('');
  }

  async testQuietHours() {
    console.log('🌙 TEST DES HEURES SILENCIEUSES');
    
    try {
      const user = await User.findById(TEST_CONFIG.TEST_USER_ID);
      
      // Test avec heure silencieuse (23:30)
      const isQuiet1 = this.smartNotificationService.isInQuietHours('23:30', '22:00', '08:00');
      if (isQuiet1) {
        this.addTestResult(true, 'Heures silencieuses détectées correctement (23:30)');
      } else {
        this.addTestResult(false, 'Heures silencieuses non détectées (23:30)');
      }
      
      // Test avec heure normale (15:30)
      const isQuiet2 = this.smartNotificationService.isInQuietHours('15:30', '22:00', '08:00');
      if (!isQuiet2) {
        this.addTestResult(true, 'Heures normales détectées correctement (15:30)');
      } else {
        this.addTestResult(false, 'Heures normales mal détectées (15:30)');
      }
      
      // Test avec heure limite (08:00)
      const isQuiet3 = this.smartNotificationService.isInQuietHours('08:00', '22:00', '08:00');
      if (isQuiet3) {
        this.addTestResult(true, 'Heure limite gérée correctement (08:00)');
      } else {
        this.addTestResult(false, 'Heure limite mal gérée (08:00)');
      }
      
    } catch (error) {
      this.addTestResult(false, `Erreur test heures silencieuses: ${error.message}`);
    }
    
    console.log('');
  }

  addTestResult(passed, message) {
    if (passed) {
      this.testResults.passed++;
      console.log(`✅ ${message}`);
    } else {
      this.testResults.failed++;
      console.log(`❌ ${message}`);
    }
    this.testResults.details.push({ passed, message });
  }

  displayResults() {
    console.log('\n📊 RÉSULTATS DES TESTS');
    console.log('='.repeat(50));
    console.log(`✅ Tests réussis: ${this.testResults.passed}`);
    console.log(`❌ Tests échoués: ${this.testResults.failed}`);
    console.log(`📈 Taux de réussite: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ ÉCHECS DÉTAILLÉS:');
      this.testResults.details
        .filter(result => !result.passed)
        .forEach(result => console.log(`   - ${result.message}`));
    }
    
    console.log('\n🎉 Tests terminés !');
  }

  async cleanup() {
    console.log('\n🧹 Nettoyage...');
    
    if (TEST_CONFIG.TEST_USER_ID) {
      // Supprimer les notifications de test
      await Notification.deleteMany({ user: TEST_CONFIG.TEST_USER_ID });
      console.log('✅ Notifications de test supprimées');
      
      // Supprimer l'utilisateur de test
      await User.findByIdAndDelete(TEST_CONFIG.TEST_USER_ID);
      console.log('✅ Utilisateur de test supprimé');
    }
  }
}

// Exécuter les tests si ce script est lancé directement
if (require.main === module) {
  const tester = new NotificationSystemTester();
  tester.runAllTests().catch(console.error);
}

module.exports = NotificationSystemTester;
