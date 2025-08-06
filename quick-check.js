console.log('🔍 VÉRIFICATION RAPIDE DES TESTS');

const { spawn } = require('child_process');

const testProcess = spawn('npm', ['test', '--', '--passWithNoTests', '--maxWorkers=1'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let output = '';

testProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  output += chunk;
  
  // Chercher les statistiques finales
  if (chunk.includes('Test Suites:') || chunk.includes('Tests:')) {
    console.log(chunk.trim());
  }
});

testProcess.stderr.on('data', (data) => {
  const chunk = data.toString();
  if (chunk.includes('Test Suites:') || chunk.includes('Tests:')) {
    console.log(chunk.trim());
  }
});

testProcess.on('close', (code) => {
  console.log('\n🏁 TESTS TERMINÉS');
  
  // Extraire les résultats finaux
  const lines = output.split('\n');
  let foundSummary = false;
  
  lines.forEach(line => {
    if (line.includes('Test Suites:') && line.includes('total')) {
      console.log('📊 ' + line.trim());
      foundSummary = true;
    }
    if (line.includes('Tests:') && line.includes('total')) {
      console.log('📊 ' + line.trim());
      
      // Extraire le nombre de tests passés
      const match = line.match(/(\d+) passed, (\d+) total/);
      if (match) {
        const passed = parseInt(match[1]);
        const total = parseInt(match[2]);
        
        console.log(`\n🎯 RÉSULTAT: ${passed}/${total} tests passés (${(passed/total*100).toFixed(1)}%)`);
        
        if (passed >= 200) {
          console.log('🎉 OBJECTIF ATTEINT ! Plus de 200 tests fonctionnels !');
        } else {
          console.log(`🔧 Progrès: ${passed}/200+ (encore ${200-passed} à corriger)`);
        }
        
        // Amélioration depuis le début
        const improvement = ((passed - 26) / 26 * 100).toFixed(0);
        console.log(`📈 Amélioration: +${improvement}% depuis le début (26 → ${passed})`);
      }
    }
  });
  
  if (!foundSummary) {
    console.log('⚠️ Aucun résumé trouvé dans la sortie');
  }
});
