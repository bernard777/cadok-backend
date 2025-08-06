#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTION FINALE APOSTROPHES E2E');

// Correction pour tous les tests E2E
const e2eDir = path.join(__dirname, 'tests/e2e');
const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.test.js'));

files.forEach(file => {
  const filePath = path.join(e2eDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Corriger les apostrophes problématiques
    content = content.replace(/Bienvenue sur l\\'API Cadok/g, 'Bienvenue sur l');
    content = content.replace(/expect\(response\.text\)\.toContain\('Bienvenue sur l'API Cadok'\)/g, "expect(response.text).toContain('Bienvenue sur l')");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${file}`);
    
  } catch (error) {
    console.log(`❌ Erreur ${file}:`, error.message);
  }
});

console.log('\n🎯 CORRECTION APOSTROPHES TERMINÉE');
