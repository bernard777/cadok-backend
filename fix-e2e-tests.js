#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚑 CORRECTION FINALE DES TESTS E2E');

// 1. Corriger les erreurs de syntaxe dans les fichiers de test E2E
const syntaxFixes = [
  {
    file: 'tests/e2e/security-flows.test.js',
    fixes: [
      {
        search: /}\)\s*$/,
        replace: '});'
      }
    ]
  },
  {
    file: 'tests/e2e/basic-connectivity.test.js',
    fixes: [
      {
        search: /}\)\s*$/,
        replace: '});'
      }
    ]
  }
];

syntaxFixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      fix.fixes.forEach(f => {
        content = content.replace(f.search, f.replace);
      });
      fs.writeFileSync(filePath, content);
      console.log(`✅ Syntaxe corrigée: ${fix.file}`);
    }
  } catch (error) {
    console.log(`❌ Erreur correction syntaxe ${fix.file}:`, error.message);
  }
});

// 2. Créer un fichier e2e-setup.js pour l'initialisation
const e2eSetupContent = `
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
`;

try {
  fs.writeFileSync(path.join(__dirname, 'tests', 'e2e-setup.js'), e2eSetupContent);
  console.log('✅ Fichier e2e-setup.js créé');
} catch (error) {
  console.log('❌ Erreur création e2e-setup.js:', error.message);
}

// 3. Installer les dépendances nécessaires
const { execSync } = require('child_process');

const requiredModules = ['mongodb-memory-server'];

requiredModules.forEach(module => {
  try {
    console.log(`📦 Installation de ${module}...`);
    execSync(`npm install --save-dev ${module}`, { stdio: 'inherit' });
    console.log(`✅ ${module} installé`);
  } catch (error) {
    console.log(`❌ Erreur installation ${module}:`, error.message);
  }
});

console.log('🏁 CORRECTIONS E2E TERMINÉES !');
console.log('Relancer les tests E2E maintenant...');
