const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 RÉPARATION MASSIVE DE TOUS LES TESTS CADOK\n');

// Corrections communes
const commonFixes = [
  // Erreurs de syntaxe courantes
  { 
    pattern: /jest\.setTimeout\(\d+\);\s*\(\)\s*=>\s*{/g, 
    replacement: (match) => match.replace(/;\s*\(\)\s*=>\s*{/, ';\n\n  beforeEach(() => {'),
    description: 'Correction jest.setTimeout() malformé'
  },
  
  // Accolades manquantes
  { 
    pattern: /describe\('([^']+)',\s*\(\)\s*=>\s*{\s*jest\.setTimeout/g, 
    replacement: 'describe(\'$1\', () => {\n  jest.setTimeout',
    description: 'Correction describe() malformé'
  },
  
  // Import/require manquants
  {
    pattern: /^(?!.*require.*supertest)/m,
    replacement: (content) => {
      if (!content.includes('supertest') && content.includes('request(app)')) {
        return `const request = require('supertest');\n${content}`;
      }
      return content;
    },
    description: 'Ajout import supertest manquant'
  },
  
  // Variables non définies
  {
    pattern: /^(?!.*const app)/m,
    replacement: (content) => {
      if (!content.includes('const app') && content.includes('request(app)')) {
        return `const app = require('../../app');\n${content}`;
      }
      return content;
    },
    description: 'Ajout import app manquant'
  }
];

// Fonction pour réparer un fichier
function repairTestFile(filePath) {
  try {
    console.log(`🔧 Réparation: ${path.relative(process.cwd(), filePath)}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Appliquer les corrections communes
    for (const fix of commonFixes) {
      const before = content;
      
      if (typeof fix.replacement === 'function') {
        content = fix.replacement(content);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
      
      if (content !== before) {
        console.log(`   ✅ ${fix.description}`);
        modified = true;
      }
    }
    
    // Corrections spécifiques par type de fichier
    if (filePath.includes('bidirectionalTradeService')) {
      // Correction spécifique pour ce fichier
      content = content.replace(
        /jest\.setTimeout\(30000\);\s*\(\)\s*=>\s*{/g,
        'jest.setTimeout(30000);\n\n  beforeEach(() => {'
      );
      
      // Fermer les blocs ouverts
      if (!content.includes('});') && content.includes('beforeEach(() => {')) {
        content = content.replace(
          /beforeEach\(\(\) => {$/m,
          'beforeEach(() => {\n    // Setup\n  });'
        );
        modified = true;
      }
    }
    
    // Vérification de la syntaxe de base
    const braceCount = (content.match(/{/g) || []).length - (content.match(/}/g) || []).length;
    if (braceCount > 0) {
      content += '\n' + '}'.repeat(braceCount);
      console.log(`   ✅ Ajout ${braceCount} accolade(s) fermante(s)`);
      modified = true;
    }
    
    // Sauvegarde si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   💾 Fichier sauvegardé`);
      return true;
    } else {
      console.log(`   ⚪ Aucune modification nécessaire`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    return false;
  }
}

// Fonction pour tester un fichier après réparation
function testRepairedFile(filePath) {
  try {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`🧪 Test post-réparation: ${relativePath}`);
    
    const result = execSync(`npm test "${relativePath}"`, {
      timeout: 15000,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.includes('PASS')) {
      console.log(`   ✅ SUCCÈS !`);
      return true;
    } else {
      console.log(`   ⚠️  Test incomplet`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Toujours en erreur`);
    return false;
  }
}

// Fonction pour trouver tous les fichiers de test
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

// Réparation principale
async function repairAllTests() {
  const testsDir = path.join(process.cwd(), 'tests');
  const testFiles = findTestFiles(testsDir);
  
  console.log(`📊 ${testFiles.length} fichiers de test à réparer\n`);
  
  const results = {
    total: testFiles.length,
    repaired: 0,
    working: 0,
    stillBroken: 0
  };
  
  for (const testFile of testFiles) {
    const wasRepaired = repairTestFile(testFile);
    if (wasRepaired) {
      results.repaired++;
    }
    
    // Test après réparation
    const isWorking = testRepairedFile(testFile);
    if (isWorking) {
      results.working++;
    } else {
      results.stillBroken++;
    }
    
    console.log(''); // Ligne vide pour lisibilité
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSUMÉ RÉPARATION MASSIVE');
  console.log('='.repeat(60));
  
  console.log(`\n📊 STATISTIQUES:`);
  console.log(`• Total des tests: ${results.total}`);
  console.log(`• 🔧 Fichiers réparés: ${results.repaired}`);
  console.log(`• ✅ Tests maintenant fonctionnels: ${results.working}`);
  console.log(`• ❌ Tests encore cassés: ${results.stillBroken}`);
  
  const successRate = Math.round((results.working / results.total) * 100);
  console.log(`\n📈 Taux de réussite après réparation: ${successRate}%`);
  
  if (results.stillBroken > 0) {
    console.log(`\n🔧 ${results.stillBroken} tests nécessitent encore une réparation manuelle`);
    console.log(`💡 Lancez "npm test" pour voir les erreurs restantes`);
  } else {
    console.log(`\n🎉 TOUS VOS TESTS SONT MAINTENANT FONCTIONNELS !`);
  }
}

// Lancer la réparation
repairAllTests().catch(console.error);
