/**
 * 🔍 DIAGNOSTIC TESTS CADOK
 * Script pour identifier et corriger tous les tests défaillants
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestDiagnostic {
  constructor() {
    this.results = {
      totalSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      skippedSuites: 0,
      failedTests: [],
      skippedTests: []
    };
  }

  async diagnoseAllTests() {
    console.log('🔍 DIAGNOSTIC COMPLET DES TESTS CADOK');
    console.log('====================================');

    try {
      // 1. Test configuration Jest
      console.log('\n1️⃣ Diagnostic configuration Jest...');
      await this.testJestConfig();

      // 2. Test des fichiers de setup
      console.log('\n2️⃣ Diagnostic fichiers setup...');
      await this.testSetupFiles();

      // 3. Test des mocks
      console.log('\n3️⃣ Diagnostic mocks et dépendances...');
      await this.testMocks();

      // 4. Test par suite individuelle
      console.log('\n4️⃣ Test des suites individuelles...');
      await this.testIndividualSuites();

      // 5. Génération rapport et solutions
      console.log('\n5️⃣ Génération solutions...');
      await this.generateSolutions();

    } catch (error) {
      console.error('❌ Erreur diagnostic:', error.message);
    }
  }

  async testJestConfig() {
    try {
      // Test basique Jest
      const output = execSync('npm test -- --listTests', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const testFiles = output.split('\n').filter(line => line.includes('.test.js'));
      console.log(`✅ Configuration Jest OK - ${testFiles.length} fichiers test détectés`);
      
    } catch (error) {
      console.log('❌ Problème configuration Jest:', error.message);
      this.results.failedTests.push({
        type: 'config',
        issue: 'Jest configuration',
        error: error.message
      });
    }
  }

  async testSetupFiles() {
    const setupFiles = [
      'tests/setup-simple.js',
      'tests/jest.env.js',
      'tests/e2e-setup.js'
    ];

    for (const file of setupFiles) {
      try {
        if (fs.existsSync(file)) {
          console.log(`✅ Setup file existe: ${file}`);
          
          // Test syntaxe
          require(path.resolve(file));
          console.log(`✅ Syntaxe OK: ${file}`);
        } else {
          console.log(`⚠️ Setup file manquant: ${file}`);
          this.results.skippedTests.push({
            type: 'setup',
            file: file,
            issue: 'File missing'
          });
        }
      } catch (error) {
        console.log(`❌ Erreur setup ${file}:`, error.message);
        this.results.failedTests.push({
          type: 'setup',
          file: file,
          error: error.message
        });
      }
    }
  }

  async testMocks() {
    // Test disponibilité des mocks essentiels
    const requiredMocks = [
      'mongoose',
      'stripe',
      'nodemailer'
    ];

    console.log('Vérification mocks disponibles...');
    for (const mock of requiredMocks) {
      try {
        const mockPath = `__mocks__/${mock}.js`;
        if (fs.existsSync(mockPath)) {
          console.log(`✅ Mock disponible: ${mock}`);
        } else {
          console.log(`⚠️ Mock manquant: ${mock}`);
          await this.createMissingMock(mock);
        }
      } catch (error) {
        console.log(`❌ Erreur mock ${mock}:`, error.message);
      }
    }
  }

  async createMissingMock(mockName) {
    const mockDir = path.join(process.cwd(), '__mocks__');
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }

    let mockContent = '';
    
    switch (mockName) {
      case 'mongoose':
        mockContent = `
// Mock Mongoose pour les tests
const mongoose = {
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    close: jest.fn().mockResolvedValue(true),
    db: {
      dropDatabase: jest.fn().mockResolvedValue(true)
    }
  },
  Schema: jest.fn(),
  model: jest.fn().mockReturnValue({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    deleteMany: jest.fn()
  })
};

module.exports = mongoose;
`;
        break;
        
      case 'stripe':
        mockContent = `
// Mock Stripe pour les tests
const stripe = jest.fn(() => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      amount: 999,
      currency: 'eur'
    })
  },
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_test_123' })
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_test_123',
      status: 'active'
    })
  }
}));

module.exports = stripe;
`;
        break;
        
      case 'nodemailer':
        mockContent = `
// Mock Nodemailer pour les tests
const nodemailer = {
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id'
    })
  })
};

module.exports = nodemailer;
`;
        break;
    }

    if (mockContent) {
      fs.writeFileSync(path.join(mockDir, `${mockName}.js`), mockContent);
      console.log(`✅ Mock créé: ${mockName}`);
    }
  }

  async testIndividualSuites() {
    const testDirs = [
      'tests/services',
      'tests/routes', 
      'tests/subscription',
      'tests/security'
    ];

    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) continue;
      
      console.log(`\n📁 Test du dossier: ${dir}`);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js'));
      
      for (const file of files) {
        await this.testSingleFile(path.join(dir, file));
      }
    }
  }

  async testSingleFile(filePath) {
    try {
      console.log(`  🧪 Test: ${filePath}`);
      
      // Test syntaxe du fichier
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Vérifications basiques
      if (!content.includes('describe') && !content.includes('test')) {
        console.log(`    ⚠️ Aucun test trouvé dans ${filePath}`);
        this.results.skippedTests.push({
          type: 'empty',
          file: filePath,
          issue: 'No tests found'
        });
        return;
      }

      // Test exécution rapide
      const output = execSync(`npm test -- ${filePath} --passWithNoTests --silent`, {
        encoding: 'utf8',
        timeout: 30000
      });

      if (output.includes('PASS')) {
        console.log(`    ✅ OK`);
        this.results.passedSuites++;
      } else {
        console.log(`    ⚠️ Warnings`);
      }

    } catch (error) {
      console.log(`    ❌ Échec: ${error.message.substring(0, 100)}...`);
      this.results.failedSuites++;
      this.results.failedTests.push({
        type: 'execution',
        file: filePath,
        error: error.message
      });
    }
  }

  async generateSolutions() {
    console.log('\n🛠️ SOLUTIONS RECOMMANDÉES');
    console.log('==========================');

    if (this.results.failedTests.length === 0 && this.results.skippedTests.length === 0) {
      console.log('🎉 TOUS LES TESTS SONT FONCTIONNELS !');
      return;
    }

    // Solutions pour les tests échoués
    if (this.results.failedTests.length > 0) {
      console.log('\n❌ CORRECTIONS NÉCESSAIRES:');
      this.results.failedTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.file || test.type}:`);
        console.log(`   Problème: ${test.issue || 'Execution failed'}`);
        console.log(`   Solution: ${this.getSolution(test)}`);
      });
    }

    // Solutions pour les tests skippés
    if (this.results.skippedTests.length > 0) {
      console.log('\n⚠️ AMÉLIORATIONS RECOMMANDÉES:');
      this.results.skippedTests.forEach((test, index) => {
        console.log(`\n${index + 1}. ${test.file}:`);
        console.log(`   Problème: ${test.issue}`);
        console.log(`   Solution: ${this.getSolution(test)}`);
      });
    }

    // Génération script de correction automatique
    await this.generateFixScript();
  }

  getSolution(test) {
    switch (test.type) {
      case 'config':
        return 'Corriger la configuration Jest (jest.config.js)';
      case 'setup':
        return 'Créer ou corriger le fichier de setup';
      case 'mock':
        return 'Créer les mocks manquants';
      case 'execution':
        return 'Corriger les erreurs de code ou dépendances manquantes';
      case 'empty':
        return 'Ajouter des tests ou supprimer le fichier vide';
      default:
        return 'Analyser et corriger le problème manuellement';
    }
  }

  async generateFixScript() {
    const fixScript = `#!/bin/bash
# 🔧 SCRIPT DE CORRECTION AUTOMATIQUE DES TESTS

echo "🔧 Correction automatique des tests CADOK"
echo "========================================="

# 1. Nettoyage des caches
echo "🧹 Nettoyage des caches..."
rm -rf node_modules/.cache
rm -rf coverage

# 2. Réinstallation des dépendances
echo "📦 Réinstallation des dépendances..."
npm ci

# 3. Tests avec diagnostic
echo "🧪 Exécution tests avec diagnostic..."
npm test -- --verbose --detectOpenHandles

echo "✅ Correction terminée !"
`;

    fs.writeFileSync('fix-tests.sh', fixScript);
    console.log('\n📄 Script de correction généré: fix-tests.sh');
  }
}

// Exécution
if (require.main === module) {
  const diagnostic = new TestDiagnostic();
  diagnostic.diagnoseAllTests()
    .then(() => {
      console.log('\n🎯 Diagnostic terminé !');
    })
    .catch(error => {
      console.error('💥 Erreur diagnostic:', error);
    });
}

module.exports = TestDiagnostic;
