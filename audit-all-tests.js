const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 AUDIT COMPLET DE TOUS LES TESTS CADOK\n');

// Fonction pour lister tous les fichiers de test
function findTestFiles(dir) {
  const testFiles = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.test.js')) {
        testFiles.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return testFiles;
}

// Fonction pour tester un fichier spécifique
function testSingleFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    console.log(`\n📝 Test: ${relativePath}`);
    
    // Timeout de 10 secondes pour éviter les blocages
    const result = execSync(`npm test "${relativePath}"`, {
      timeout: 10000,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Analyser les résultats
    const output = result.toString();
    
    if (output.includes('PASS')) {
      console.log('✅ SUCCÈS');
      return { status: 'PASS', file: relativePath };
    } else if (output.includes('FAIL')) {
      console.log('❌ ÉCHEC');
      return { status: 'FAIL', file: relativePath };
    } else {
      console.log('⚠️  ÉTAT INCONNU');
      return { status: 'UNKNOWN', file: relativePath };
    }
    
  } catch (error) {
    console.log('💥 ERREUR');
    
    const errorOutput = error.stdout ? error.stdout.toString() : '';
    const errorMessage = error.stderr ? error.stderr.toString() : error.message;
    
    // Déterminer le type d'erreur
    if (errorMessage.includes('SyntaxError') || errorOutput.includes('SyntaxError')) {
      return { status: 'SYNTAX_ERROR', file: relativePath, error: 'Erreur de syntaxe' };
    } else if (errorMessage.includes('timeout') || error.signal === 'SIGTERM') {
      return { status: 'TIMEOUT', file: relativePath, error: 'Timeout' };
    } else if (errorOutput.includes('400') || errorOutput.includes('500')) {
      return { status: 'HTTP_ERROR', file: relativePath, error: 'Erreur HTTP' };
    } else {
      return { status: 'ERROR', file: relativePath, error: errorMessage.substring(0, 100) };
    }
  }
}

// Audit principal
async function auditAllTests() {
  const testsDir = path.join(process.cwd(), 'tests');
  const testFiles = findTestFiles(testsDir);
  
  console.log(`📊 ${testFiles.length} fichiers de test trouvés\n`);
  
  const results = {
    total: testFiles.length,
    pass: [],
    fail: [],
    syntaxError: [],
    timeout: [],
    httpError: [],
    other: []
  };
  
  // Tester chaque fichier
  for (const testFile of testFiles) {
    const result = testSingleFile(testFile);
    
    switch (result.status) {
      case 'PASS':
        results.pass.push(result);
        break;
      case 'FAIL':
        results.fail.push(result);
        break;
      case 'SYNTAX_ERROR':
        results.syntaxError.push(result);
        break;
      case 'TIMEOUT':
        results.timeout.push(result);
        break;
      case 'HTTP_ERROR':
        results.httpError.push(result);
        break;
      default:
        results.other.push(result);
        break;
    }
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ AUDIT COMPLET');
  console.log('='.repeat(60));
  
  console.log(`\n📊 STATISTIQUES:`);
  console.log(`• Total des tests: ${results.total}`);
  console.log(`• ✅ Succès: ${results.pass.length}`);
  console.log(`• ❌ Échecs: ${results.fail.length}`);
  console.log(`• 💥 Erreurs syntaxe: ${results.syntaxError.length}`);
  console.log(`• ⏰ Timeouts: ${results.timeout.length}`);
  console.log(`• 🌐 Erreurs HTTP: ${results.httpError.length}`);
  console.log(`• ❓ Autres: ${results.other.length}`);
  
  // Détails par catégorie
  if (results.pass.length > 0) {
    console.log(`\n✅ TESTS QUI PASSENT (${results.pass.length}):`);
    results.pass.forEach(r => console.log(`   • ${r.file}`));
  }
  
  if (results.syntaxError.length > 0) {
    console.log(`\n💥 ERREURS DE SYNTAXE (${results.syntaxError.length}):`);
    results.syntaxError.forEach(r => console.log(`   • ${r.file}: ${r.error}`));
  }
  
  if (results.httpError.length > 0) {
    console.log(`\n🌐 ERREURS HTTP (${results.httpError.length}):`);
    results.httpError.forEach(r => console.log(`   • ${r.file}: ${r.error}`));
  }
  
  if (results.timeout.length > 0) {
    console.log(`\n⏰ TIMEOUTS (${results.timeout.length}):`);
    results.timeout.forEach(r => console.log(`   • ${r.file}`));
  }
  
  if (results.fail.length > 0) {
    console.log(`\n❌ ÉCHECS (${results.fail.length}):`);
    results.fail.forEach(r => console.log(`   • ${r.file}`));
  }
  
  if (results.other.length > 0) {
    console.log(`\n❓ AUTRES PROBLÈMES (${results.other.length}):`);
    results.other.forEach(r => console.log(`   • ${r.file}: ${r.error || 'Inconnu'}`));
  }
  
  // Recommandations
  console.log('\n' + '='.repeat(60));
  console.log('💡 RECOMMANDATIONS');
  console.log('='.repeat(60));
  
  if (results.syntaxError.length > 0) {
    console.log('🔧 1. Corriger les erreurs de syntaxe en premier');
  }
  
  if (results.httpError.length > 0) {
    console.log('🔧 2. Vérifier la configuration serveur/DB pour les erreurs HTTP');
  }
  
  if (results.timeout.length > 0) {
    console.log('🔧 3. Optimiser les tests qui dépassent le timeout');
  }
  
  const successRate = Math.round((results.pass.length / results.total) * 100);
  console.log(`\n📈 Taux de réussite actuel: ${successRate}%`);
  
  if (successRate < 100) {
    console.log(`🎯 Objectif: Atteindre 100% de tests fonctionnels`);
  } else {
    console.log(`🎉 Félicitations ! Tous vos tests passent !`);
  }
}

// Lancer l'audit
auditAllTests().catch(console.error);
