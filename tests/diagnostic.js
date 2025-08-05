/**
 * Script de vérification de l'état des tests
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC ÉTAT DES TESTS CADOK BACKEND\n');

// 1. Vérifier les fichiers de configuration
console.log('📝 Configuration:');
const configFiles = ['package.json', 'jest.config.js'];
configFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Vérifier les services
console.log('\n🔧 Services:');
const servicesDir = path.join(__dirname, '..', 'services');
if (fs.existsSync(servicesDir)) {
  const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
  console.log(`   📁 ${services.length} services trouvés:`);
  services.forEach(service => {
    console.log(`      - ${service}`);
  });
} else {
  console.log('   ❌ Dossier services introuvable');
}

// 3. Vérifier les modèles
console.log('\n📊 Modèles:');
const modelsDir = path.join(__dirname, '..', 'models');
if (fs.existsSync(modelsDir)) {
  const models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
  console.log(`   📁 ${models.length} modèles trouvés:`);
  models.forEach(model => {
    console.log(`      - ${model}`);
  });
} else {
  console.log('   ❌ Dossier models introuvable');
}

// 4. Vérifier les tests
console.log('\n🧪 Tests existants:');
const testsDir = path.join(__dirname);
function scanTestsRecursive(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  let testCount = 0;
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`   📁 ${prefix}${item}/`);
      testCount += scanTestsRecursive(fullPath, prefix + '  ');
    } else if (item.endsWith('.test.js')) {
      console.log(`   🧪 ${prefix}${item}`);
      testCount++;
    }
  });
  
  return testCount;
}

const totalTests = scanTestsRecursive(testsDir);
console.log(`\n📊 Total: ${totalTests} fichiers de test`);

// 5. Vérifier les dépendances critiques
console.log('\n📦 Dépendances critiques:');
try {
  const pkg = require('../package.json');
  const criticalDeps = ['jest', 'mongoose', 'express', 'axios'];
  
  criticalDeps.forEach(dep => {
    const hasInDeps = pkg.dependencies && pkg.dependencies[dep];
    const hasInDevDeps = pkg.devDependencies && pkg.devDependencies[dep];
    const exists = hasInDeps || hasInDevDeps;
    console.log(`   ${exists ? '✅' : '❌'} ${dep} ${exists ? '(' + (hasInDeps || hasInDevDeps) + ')' : ''}`);
  });
} catch (err) {
  console.log('   ❌ Erreur lecture package.json:', err.message);
}

// 6. Test de require basique
console.log('\n🔄 Test de chargement:');
const testRequires = [
  '../models/User',
  '../models/Trade', 
  '../services/bidirectionalTradeService',
  '../services/pickupPointService'
];

testRequires.forEach(modulePath => {
  try {
    require(modulePath);
    console.log(`   ✅ ${modulePath}`);
  } catch (err) {
    console.log(`   ❌ ${modulePath}: ${err.message}`);
  }
});

console.log('\n🎯 RECOMMANDATIONS:');

// Compter les problèmes
let issues = 0;

// Vérifier si tous les tests utilisent les bons champs
const testFiles = [
  'services/bidirectionalTradeService.test.js',
  'services/bidirectionalTradeService-advanced.test.js',
  'services/pickupPointService.test.js',
  'services/securityService.test.js'
];

console.log('\n🔍 Analyse des tests:');
testFiles.forEach(testFile => {
  const fullPath = path.join(__dirname, testFile);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasFirstName = content.includes('firstName');
    const hasLastName = content.includes('lastName');
    const hasZipCode = content.includes('zipCode');
    
    if (hasFirstName || hasLastName) {
      console.log(`   ⚠️  ${testFile}: utilise firstName/lastName (devrait être pseudo)`);
      issues++;
    } else {
      console.log(`   ✅ ${testFile}: champs corrects`);
    }
  } else {
    console.log(`   ❌ ${testFile}: fichier manquant`);
    issues++;
  }
});

if (issues === 0) {
  console.log('\n🎉 TOUS LES TESTS SONT PRÊTS À ÊTRE EXÉCUTÉS!');
  console.log('\nCommandes suggérées:');
  console.log('   npm run test:services');
  console.log('   npm run test:security');
  console.log('   npm run test:all');
} else {
  console.log(`\n⚠️  ${issues} problèmes détectés à corriger avant exécution`);
}
