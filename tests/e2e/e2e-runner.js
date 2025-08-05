/**
 * 🧪 RUNNER TESTS E2E CADOK
 * Script d'exécution des tests End-to-End complets
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
  constructor() {
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      coverage: {},
      suites: []
    };
  }

  async runAllE2ETests() {
    console.log('🚀 DÉMARRAGE TESTS E2E CADOK');
    console.log('=====================================');
    
    const startTime = Date.now();
    
    try {
      // 1. Tests parcours utilisateur complet
      console.log('\n📝 Tests Parcours Utilisateur...');
      await this.runTestSuite('complete-user-journey.test.js');
      
      // 2. Tests sécurité
      console.log('\n🛡️ Tests Sécurité...');
      await this.runTestSuite('security-flows.test.js');
      
      // 3. Tests paiements
      console.log('\n💳 Tests Paiements...');
      await this.runTestSuite('payment-flows.test.js');
      
      // 4. Génération rapport final
      this.results.duration = Date.now() - startTime;
      await this.generateReport();
      
      console.log('\n✅ TOUS LES TESTS E2E TERMINÉS !');
      return this.results;
      
    } catch (error) {
      console.error('❌ Erreur lors des tests E2E:', error);
      throw error;
    }
  }

  async runTestSuite(testFile) {
    try {
      const command = `npm test -- tests/e2e/${testFile} --verbose --coverage`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      // Parse résultats
      const suiteResults = this.parseTestOutput(output, testFile);
      this.results.suites.push(suiteResults);
      
      this.results.totalTests += suiteResults.totalTests;
      this.results.passedTests += suiteResults.passedTests;
      this.results.failedTests += suiteResults.failedTests;
      
      console.log(`✅ ${testFile}: ${suiteResults.passedTests}/${suiteResults.totalTests} tests passés`);
      
    } catch (error) {
      console.error(`❌ Erreur suite ${testFile}:`, error.message);
      this.results.suites.push({
        name: testFile,
        status: 'failed',
        error: error.message
      });
    }
  }

  parseTestOutput(output, suiteName) {
    // Parse basique de la sortie Jest
    const lines = output.split('\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    lines.forEach(line => {
      if (line.includes('Tests:')) {
        const matches = line.match(/(\d+) passed.*?(\d+) total/);
        if (matches) {
          passedTests = parseInt(matches[1]);
          totalTests = parseInt(matches[2]);
          failedTests = totalTests - passedTests;
        }
      }
    });
    
    return {
      name: suiteName,
      totalTests,
      passedTests,
      failedTests,
      status: failedTests === 0 ? 'passed' : 'failed'
    };
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        successRate: this.results.totalTests > 0 ? 
          Math.round((this.results.passedTests / this.results.totalTests) * 100) : 0,
        duration: `${Math.round(this.results.duration / 1000)}s`
      },
      suites: this.results.suites,
      recommendations: this.generateRecommendations()
    };

    // Sauvegarde rapport JSON
    const reportPath = path.join(__dirname, '../../reports/e2e-report.json');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Génération rapport HTML
    await this.generateHTMLReport(report, reportPath.replace('.json', '.html'));

    console.log(`\n📊 RAPPORT E2E GÉNÉRÉ:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${reportPath.replace('.json', '.html')}`);
    console.log(`\n📈 RÉSULTATS:`);
    console.log(`   ✅ Tests réussis: ${report.summary.passedTests}`);
    console.log(`   ❌ Tests échoués: ${report.summary.failedTests}`);
    console.log(`   📊 Taux de réussite: ${report.summary.successRate}%`);
    console.log(`   ⏱️ Durée: ${report.summary.duration}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.failedTests > 0) {
      recommendations.push({
        type: 'critical',
        message: `${this.results.failedTests} tests échoués - À corriger avant déploiement`,
        action: 'Analyser les logs d\'erreur et corriger les problèmes'
      });
    }

    if (this.results.passedTests / this.results.totalTests < 0.95) {
      recommendations.push({
        type: 'warning',
        message: 'Taux de réussite < 95% - Améliorer la robustesse',
        action: 'Ajouter plus de tests et améliorer la gestion d\'erreurs'
      });
    }

    if (this.results.duration > 300000) { // 5 minutes
      recommendations.push({
        type: 'info',
        message: 'Tests E2E lents - Optimiser les performances',
        action: 'Paralléliser les tests ou optimiser les requêtes'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: '🎉 Tous les tests E2E passent - Prêt pour la bêta !',
        action: 'Procéder au déploiement'
      });
    }

    return recommendations;
  }

  async generateHTMLReport(report, htmlPath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>CADOK E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .suite { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .recommendation { padding: 10px; margin: 5px 0; border-radius: 5px; }
        .recommendation.critical { background: #f8d7da; }
        .recommendation.warning { background: #fff3cd; }
        .recommendation.success { background: #d4edda; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 CADOK E2E Test Report</h1>
        <p>Généré le: ${report.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <h2>${report.summary.totalTests}</h2>
        </div>
        <div class="metric">
            <h3>Réussis</h3>
            <h2 class="success">${report.summary.passedTests}</h2>
        </div>
        <div class="metric">
            <h3>Échoués</h3>
            <h2 class="error">${report.summary.failedTests}</h2>
        </div>
        <div class="metric">
            <h3>Taux de Réussite</h3>
            <h2>${report.summary.successRate}%</h2>
        </div>
        <div class="metric">
            <h3>Durée</h3>
            <h2>${report.summary.duration}</h2>
        </div>
    </div>

    <h2>📋 Suites de Tests</h2>
    ${report.suites.map(suite => `
        <div class="suite">
            <h3>${suite.name}</h3>
            <p>Status: <span class="${suite.status === 'passed' ? 'success' : 'error'}">${suite.status}</span></p>
            ${suite.totalTests ? `<p>Tests: ${suite.passedTests}/${suite.totalTests}</p>` : ''}
            ${suite.error ? `<p class="error">Erreur: ${suite.error}</p>` : ''}
        </div>
    `).join('')}

    <h2>💡 Recommandations</h2>
    ${report.recommendations.map(rec => `
        <div class="recommendation ${rec.type}">
            <strong>${rec.message}</strong><br>
            Action: ${rec.action}
        </div>
    `).join('')}
</body>
</html>`;

    await fs.promises.writeFile(htmlPath, html);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllE2ETests()
    .then(results => {
      console.log('\n🎯 Tests E2E terminés avec succès !');
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Erreur fatale tests E2E:', error);
      process.exit(1);
    });
}

module.exports = E2ETestRunner;
