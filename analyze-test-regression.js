#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ANALYSE DE LA RÉGRESSION DE TESTS');

// 1. Compter tous les fichiers de test
function countTestFiles() {
  const testDir = path.join(__dirname, 'tests');
  let files = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        walkDir(itemPath);
      } else if (item.endsWith('.test.js')) {
        files.push(itemPath);
      }
    });
  }
  
  walkDir(testDir);
  return files;
}

const testFiles = countTestFiles();
console.log(`📁 Fichiers de test trouvés: ${testFiles.length}`);

// 2. Compter les tests individuels dans chaque fichier
let totalTests = 0;
let totalDescribes = 0;
let fileAnalysis = [];

testFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(__dirname, file);
    
    // Compter les tests (it, test)
    const testMatches = content.match(/(it|test)\s*\(/g) || [];
    const describeMatches = content.match(/describe\s*\(/g) || [];
    
    totalTests += testMatches.length;
    totalDescribes += describeMatches.length;
    
    fileAnalysis.push({
      file: relativePath,
      tests: testMatches.length,
      describes: describeMatches.length
    });
    
  } catch (error) {
    console.log(`❌ Erreur lecture ${file}: ${error.message}`);
  }
});

console.log(`\n📊 STATISTIQUES ACTUELLES:`);
console.log(`- Fichiers de test: ${testFiles.length}`);
console.log(`- Tests individuels: ${totalTests}`);
console.log(`- Describe blocks: ${totalDescribes}`);

// 3. Analyser les fichiers avec le plus de tests
fileAnalysis.sort((a, b) => b.tests - a.tests);
console.log(`\n🏆 TOP 10 FICHIERS (par nombre de tests):`);
fileAnalysis.slice(0, 10).forEach((analysis, index) => {
  console.log(`${index + 1}. ${analysis.file}: ${analysis.tests} tests, ${analysis.describes} describes`);
});

// 4. Identifier les fichiers sans tests
const emptyFiles = fileAnalysis.filter(f => f.tests === 0);
if (emptyFiles.length > 0) {
  console.log(`\n⚠️ FICHIERS SANS TESTS (${emptyFiles.length}):`);
  emptyFiles.forEach(f => console.log(`- ${f.file}`));
}

// 5. Comparer avec l'objectif
console.log(`\n🎯 COMPARAISON OBJECTIF:`);
console.log(`- Objectif: 235 tests`);
console.log(`- Actuel: ${totalTests} tests`);
console.log(`- Différence: ${totalTests - 235} tests`);

if (totalTests < 235) {
  console.log(`❌ Perte de ${235 - totalTests} tests détectée`);
} else if (totalTests > 235) {
  console.log(`✅ Gain de ${totalTests - 235} tests`);
} else {
  console.log(`✅ Nombre de tests maintenu`);
}

// 6. Vérifier s'il y a des fichiers corrompus ou avec des erreurs de syntaxe
console.log(`\n🔧 VÉRIFICATION SYNTAXE:`);
let syntaxErrors = 0;

testFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Vérifications basiques
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    
    if (openBraces !== closeBraces) {
      console.log(`❌ ${path.relative(__dirname, file)}: Accolades non équilibrées`);
      syntaxErrors++;
    }
    if (openParens !== closeParens) {
      console.log(`❌ ${path.relative(__dirname, file)}: Parenthèses non équilibrées`);
      syntaxErrors++;
    }
    
    // Vérifier les tests incomplets
    if (content.includes('it(') && !content.includes('});')) {
      console.log(`⚠️ ${path.relative(__dirname, file)}: Tests possiblement incomplets`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur syntaxe ${file}: ${error.message}`);
    syntaxErrors++;
  }
});

console.log(`\n📋 RÉSUMÉ:`);
console.log(`- Fichiers analysés: ${testFiles.length}`);
console.log(`- Tests trouvés: ${totalTests}`);
console.log(`- Erreurs syntaxe: ${syntaxErrors}`);
console.log(`- Status vs objectif: ${totalTests >= 235 ? '✅ OK' : '❌ En dessous'}`);

// 7. Lancer un test rapide pour voir le nombre réel de tests exécutés
console.log(`\n🚀 LANCEMENT TEST RAPIDE...`);
try {
  const result = execSync('npm test -- --passWithNoTests --maxWorkers=1 --detectOpenHandles', { 
    encoding: 'utf8',
    timeout: 60000 
  });
  
  const testMatch = result.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (testMatch) {
    const [, failed, passed, total] = testMatch;
    console.log(`📊 RÉSULTATS Jest: ${passed}/${total} tests passés (${failed} échecs)`);
    
    if (parseInt(total) !== totalTests) {
      console.log(`⚠️ DISCORDANCE: Jest compte ${total} tests, analyse manuelle trouve ${totalTests}`);
    }
  }
} catch (error) {
  console.log(`❌ Erreur test rapide: ${error.message}`);
}
