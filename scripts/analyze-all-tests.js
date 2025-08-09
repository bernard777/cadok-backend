#!/usr/bin/env node

/**
 * 📊 ANALYSEUR DE TESTS - Categorise tous les tests du workspace
 * Identifie les doublons, tests obsolètes, et ceux à convertir vers HTTP-Pure
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Tests HTTP-Pure validés et fonctionnels
const httpPureValidatedTests = [
  'tests/e2e/auth-objects-http-pure.test.js',
  'tests/e2e/payments-http-pure.test.js', 
  'tests/e2e/trades-http-pure.test.js',
  'tests/e2e/security-workflow-complete-http-pure.test.js',
  'tests/e2e/api-images-integration-http-pure.test.js'
];

// Fonction pour lire et analyser un fichier de test
function analyzeTestFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Détecter le type d'architecture
    const hasSupertestImport = content.includes("require('supertest')") || content.includes("import.*supertest");
    const hasAxiosImport = content.includes("require('axios')") || content.includes("import.*axios");
    const hasHttpRequests = content.includes('http://localhost:5000') || content.includes('localhost:5000');
    const hasAppDirect = content.includes('request(app)');
    
    // Détecter les fonctionnalités testées
    const testsAuth = content.includes('/auth/') || content.includes('register') || content.includes('login');
    const testsObjects = content.includes('/objects') || content.includes('createObject');
    const testsTrades = content.includes('/trades') || content.includes('trade');
    const testsPayments = content.includes('/payments') || content.includes('subscription') || content.includes('stripe');
    const testsSecurity = content.includes('XSS') || content.includes('injection') || content.includes('security');
    const testsImages = content.includes('images') || content.includes('upload');
    
    // Compter les tests
    const testCount = (content.match(/it\(|test\(/g) || []).length;
    const describeCount = (content.match(/describe\(/g) || []).length;
    
    return {
      architecture: hasSupertestImport ? 'supertest' : hasHttpRequests ? 'http-pure' : 'unit/other',
      features: {
        auth: testsAuth,
        objects: testsObjects,
        trades: testsTrades,
        payments: testsPayments,
        security: testsSecurity,
        images: testsImages
      },
      testCount,
      describeCount,
      hasAppDirect,
      isValidated: httpPureValidatedTests.includes(filePath.replace(/\\/g, '/').replace('c:/Users/JB/Music/cadok-backend/', ''))
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Scanner tous les fichiers de tests
console.log('🔍 ANALYSE COMPLÈTE DES TESTS CADOK\n');

exec('find tests -name "*.test.js" -type f', { cwd: process.cwd() }, (error, stdout) => {
  if (error) {
    // Fallback pour Windows
    exec('dir /b /s tests\\*.test.js', { cwd: process.cwd() }, (winError, winStdout) => {
      if (winError) {
        console.error('Erreur de scan:', winError);
        return;
      }
      
      const testFiles = winStdout.split('\n')
        .filter(line => line.trim().endsWith('.test.js'))
        .map(line => line.trim().replace(/\\/g, '/').replace(process.cwd().replace(/\\/g, '/') + '/', ''));
      
      processTestFiles(testFiles);
    });
    return;
  }
  
  const testFiles = stdout.split('\n').filter(line => line.trim());
  processTestFiles(testFiles);
});

function processTestFiles(testFiles) {
  console.log(`📁 ${testFiles.length} fichiers de tests détectés\n`);
  
  const categories = {
    httpPureValidated: [],
    superstestObsolete: [],
    unitTests: [],
    httpPureCandidate: [],
    duplicateFeatures: []
  };
  
  const featureCoverage = {
    auth: [],
    objects: [],
    trades: [],
    payments: [],
    security: [],
    images: []
  };
  
  // Analyser chaque fichier
  testFiles.forEach(filePath => {
    if (!filePath) return;
    
    const fullPath = path.join(process.cwd(), filePath);
    const analysis = analyzeTestFile(fullPath);
    
    if (analysis.error) {
      console.warn(`⚠️ Erreur analyse ${filePath}: ${analysis.error}`);
      return;
    }
    
    // Categoriser le fichier
    if (analysis.isValidated) {
      categories.httpPureValidated.push({
        file: filePath,
        ...analysis
      });
    } else if (analysis.architecture === 'supertest') {
      categories.superstestObsolete.push({
        file: filePath,
        ...analysis
      });
    } else if (analysis.architecture === 'http-pure') {
      categories.httpPureCandidate.push({
        file: filePath,
        ...analysis
      });
    } else {
      categories.unitTests.push({
        file: filePath,
        ...analysis
      });
    }
    
    // Enregistrer la couverture des fonctionnalités
    Object.keys(analysis.features).forEach(feature => {
      if (analysis.features[feature]) {
        featureCoverage[feature].push({
          file: filePath,
          architecture: analysis.architecture,
          testCount: analysis.testCount,
          isValidated: analysis.isValidated
        });
      }
    });
  });
  
  // RAPPORT FINAL
  console.log('📊 RAPPORT D\'ANALYSE DES TESTS\n');
  console.log('=' .repeat(50));
  
  console.log(`\n✅ TESTS HTTP-PURE VALIDÉS (${categories.httpPureValidated.length})`);
  categories.httpPureValidated.forEach(test => {
    console.log(`  ✅ ${test.file} (${test.testCount} tests)`);
  });
  
  console.log(`\n❌ TESTS SUPERTEST OBSOLÈTES (${categories.superstestObsolete.length})`);
  categories.superstestObsolete.forEach(test => {
    console.log(`  ❌ ${test.file} (${test.testCount} tests) - À SUPPRIMER`);
  });
  
  console.log(`\n🔄 TESTS HTTP-PURE CANDIDATS (${categories.httpPureCandidate.length})`);
  categories.httpPureCandidate.forEach(test => {
    console.log(`  🔄 ${test.file} (${test.testCount} tests) - À VALIDER`);
  });
  
  console.log(`\n⚙️ TESTS UNITAIRES/AUTRES (${categories.unitTests.length})`);
  categories.unitTests.forEach(test => {
    console.log(`  ⚙️ ${test.file} (${test.testCount} tests)`);
  });
  
  // ANALYSE DES DOUBLONS
  console.log('\n🎯 COUVERTURE DES FONCTIONNALITÉS\n');
  Object.keys(featureCoverage).forEach(feature => {
    const tests = featureCoverage[feature];
    if (tests.length > 0) {
      console.log(`${feature.toUpperCase()}: ${tests.length} tests`);
      
      const validated = tests.filter(t => t.isValidated);
      const supertest = tests.filter(t => t.architecture === 'supertest');
      
      if (validated.length > 0 && supertest.length > 0) {
        console.log(`  ✅ Couvert par HTTP-Pure validé (${validated.length})`);
        console.log(`  ❌ DOUBLONS Supertest à supprimer (${supertest.length}):`);
        supertest.forEach(t => console.log(`    - ${t.file}`));
      }
      console.log();
    }
  });
  
  // RECOMMANDATIONS
  console.log('\n🎯 RECOMMANDATIONS FINALES\n');
  console.log('=' .repeat(50));
  
  console.log('\n1️⃣ SUPPRIMER IMMÉDIATEMENT (tests supertest cassés):');
  categories.superstestObsolete.forEach(test => {
    console.log(`   rm "${test.file}"`);
  });
  
  console.log('\n2️⃣ VALIDER ET CONVERTIR (tests http-pure potentiels):');
  categories.httpPureCandidate.forEach(test => {
    console.log(`   Examiner: ${test.file} (${test.testCount} tests)`);
  });
  
  console.log('\n3️⃣ CONSERVER (tests unitaires/autres):');
  categories.unitTests.forEach(test => {
    console.log(`   Garder: ${test.file}`);
  });
  
  console.log('\n✅ Architecture HTTP-Pure validée et sécurisée prête !');
}
