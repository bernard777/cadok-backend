#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📊 COMPTAGE PRÉCIS DES TESTS CADOK');
console.log('==================================\n');

let totalTests = 0;
let totalDescribes = 0;
let testsByFile = {};

// Fonction pour compter les tests dans un fichier
function countTestsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Compter les describe() et test()/it()
    const testMatches = content.match(/\b(test|it)\s*\(/g) || [];
    const describeMatches = content.match(/\bdescribe\s*\(/g) || [];
    
    const testsCount = testMatches.length;
    const describesCount = describeMatches.length;
    
    return { tests: testsCount, describes: describesCount };
  } catch (error) {
    return { tests: 0, describes: 0, error: error.message };
  }
}

// Parcourir tous les fichiers de tests
function scanTestDirectory(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanTestDirectory(fullPath, baseDir);
    } else if (entry.name.endsWith('.test.js')) {
      const relativePath = path.relative(baseDir, fullPath);
      const counts = countTestsInFile(fullPath);
      
      testsByFile[relativePath] = counts;
      totalTests += counts.tests;
      totalDescribes += counts.describes;
      
      console.log(`📄 ${relativePath}`);
      console.log(`   Tests: ${counts.tests}, Describes: ${counts.describes}`);
      if (counts.error) {
        console.log(`   ❌ Erreur: ${counts.error}`);
      }
    }
  }
}

// Scanner le dossier tests principal
const testsDir = path.join(__dirname, 'tests');
if (fs.existsSync(testsDir)) {
  console.log('🔍 Analyse du dossier tests/\n');
  scanTestDirectory(testsDir);
}

// Scanner le dossier mobile si présent
const mobileTestsDir = path.join(__dirname, '..', 'cadok-mobile', 'tests');
if (fs.existsSync(mobileTestsDir)) {
  console.log('\n🔍 Analyse des tests mobile/\n');
  scanTestDirectory(mobileTestsDir);
}

console.log('\n📈 RÉSUMÉ GLOBAL:');
console.log(`   🎯 Total de tests individuels: ${totalTests}`);
console.log(`   📋 Total de describe blocks: ${totalDescribes}`);
console.log(`   📁 Fichiers de tests: ${Object.keys(testsByFile).length}`);

// Tests E2E spécifiquement
const e2eTests = Object.keys(testsByFile)
  .filter(file => file.includes('e2e'))
  .reduce((sum, file) => sum + testsByFile[file].tests, 0);

console.log(`   🚀 Tests E2E: ${e2eTests}`);

// Catégorisation
const categories = {
  'E2E': 0,
  'Services': 0,
  'Models': 0,
  'Routes': 0,
  'Middlewares': 0,
  'Security': 0,
  'Integration': 0,
  'Other': 0
};

Object.keys(testsByFile).forEach(file => {
  const tests = testsByFile[file].tests;
  if (file.includes('e2e')) categories['E2E'] += tests;
  else if (file.includes('service')) categories['Services'] += tests;
  else if (file.includes('model')) categories['Models'] += tests;
  else if (file.includes('route')) categories['Routes'] += tests;
  else if (file.includes('middleware')) categories['Middlewares'] += tests;
  else if (file.includes('security')) categories['Security'] += tests;
  else if (file.includes('integration')) categories['Integration'] += tests;
  else categories['Other'] += tests;
});

console.log('\n📊 RÉPARTITION PAR CATÉGORIE:');
Object.keys(categories).forEach(cat => {
  console.log(`   ${cat}: ${categories[cat]} tests`);
});

console.log('\n🎯 RÉPONSE À LA QUESTION:');
console.log(`   Tests E2E fonctionnels: ${e2eTests} sur ${totalTests} tests total`);
console.log(`   Pourcentage E2E: ${((e2eTests / totalTests) * 100).toFixed(1)}%`);

if (totalTests >= 200) {
  console.log(`   ✅ Objectif "plus de 200 tests" atteint!`);
} else {
  console.log(`   ⏳ Vers l'objectif de 200+ tests (actuellement ${totalTests})`);
}
