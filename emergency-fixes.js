#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚑 CORRECTIFS D\'URGENCE - PHASE FINALE');

// 1. Corriger le setup-simple.js - problème de récursion
const setupSimpleContent = `// Mock simple et sûr pour les tests
const OriginalDate = Date;

global.mockDate = new OriginalDate('2024-01-01T00:00:00.000Z');

// Mock console sûr
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {}
};

// Mock process.env avec toutes les variables nécessaires
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.STRIPE_SECRET_KEY = 'sk_test_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/cadok-test';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';

console.log('✅ Setup simple configuré');
`;

try {
  fs.writeFileSync(path.join(__dirname, 'tests', 'setup-simple.js'), setupSimpleContent);
  console.log('✅ setup-simple.js corrigé');
} catch (error) {
  console.log('❌ Erreur setup-simple:', error.message);
}

// 2. Corriger les imports manquants dans les tests
const moduleFixes = [
  {
    file: 'tests/services/deliveryLabelService.test.js',
    search: `jest.mock('node-fetch', () => {`,
    replace: `// Mock node-fetch
const mockFetch = jest.fn();
jest.doMock('node-fetch', () => mockFetch);

jest.mock('node-fetch', () => {`
  },
  {
    file: 'tests/security/encryption-security.test.js', 
    search: `jest.mock('bcrypt', () => {`,
    replace: `// Mock bcrypt
const mockBcrypt = {
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt')
};
jest.doMock('bcrypt', () => mockBcrypt);

jest.mock('bcrypt', () => {`
  }
];

moduleFixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Module fix appliqué: ${fix.file}`);
      }
    }
  } catch (error) {
    console.log(`❌ Erreur module fix ${fix.file}:`, error.message);
  }
});

// 3. Corriger les erreurs de syntaxe dans les fichiers de test
const syntaxFixes = [
  {
    pattern: 'tests/**/*.test.js',
    fixes: [
      // Corriger les points-virgules orphelins
      { search: /;\s*\n\s*(?=describe|it|test|beforeEach|afterEach)/g, replace: '\n' },
      // Corriger les return en dehors de fonction
      { search: /^\s*return this;\s*$/gm, replace: '' },
      // Corriger les virgules manquantes
      { search: /}\s*\n\s*([a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g, replace: '},\n$1' }
    ]
  }
];

// Fonction pour appliquer les corrections de syntaxe
function applySyntaxFixes() {
  const testDir = path.join(__dirname, 'tests');
  
  function processDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        processDirectory(itemPath);
      } else if (item.endsWith('.test.js')) {
        try {
          let content = fs.readFileSync(itemPath, 'utf8');
          let modified = false;
          
          // Appliquer les corrections
          syntaxFixes[0].fixes.forEach(fix => {
            const newContent = content.replace(fix.search, fix.replace);
            if (newContent !== content) {
              content = newContent;
              modified = true;
            }
          });
          
          if (modified) {
            fs.writeFileSync(itemPath, content);
            console.log(`✅ Syntaxe corrigée: ${path.relative(__dirname, itemPath)}`);
          }
        } catch (error) {
          console.log(`❌ Erreur syntaxe ${item}:`, error.message);
        }
      }
    });
  }
  
  if (fs.existsSync(testDir)) {
    processDirectory(testDir);
  }
}

applySyntaxFixes();

// 4. Créer un .env.test minimal
const envTestContent = `NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-purposes-only
ENCRYPTION_KEY=test-encryption-key-32-characters-long
STRIPE_SECRET_KEY=sk_test_51234567890abcdef
STRIPE_WEBHOOK_SECRET=whsec_test
MONGODB_URI=mongodb://localhost:27017/cadok-test
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=test-secret
EMAIL_USER=test@example.com
EMAIL_PASS=testpassword
FRONTEND_URL=http://localhost:3000
`;

try {
  fs.writeFileSync(path.join(__dirname, '.env.test'), envTestContent);
  console.log('✅ .env.test créé');
} catch (error) {
  console.log('❌ Erreur .env.test:', error.message);
}

// 5. Installer les modules manquants
const { execSync } = require('child_process');

const requiredModules = ['node-fetch@2', 'bcrypt'];

requiredModules.forEach(module => {
  try {
    console.log(`📦 Installation de ${module}...`);
    execSync(`npm install --save-dev ${module}`, { stdio: 'inherit' });
    console.log(`✅ ${module} installé`);
  } catch (error) {
    console.log(`❌ Erreur installation ${module}:`, error.message);
  }
});

console.log('🏁 CORRECTIFS D\'URGENCE TERMINÉS !');
console.log('Relancer les tests maintenant...');
