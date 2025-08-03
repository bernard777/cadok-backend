/**
 * Test simple de l'environnement CADOK
 * Vérifie que tout est en place pour les tests
 */

// Test des variables d'environnement
require('dotenv').config();

console.log('🔧 CADOK - Vérification de l\'environnement');
console.log('===========================================\n');

// 1. Vérifier les variables d'environnement
console.log('1️⃣ Variables d\'environnement:');
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
  'NODE_ENV',
  'PORT'
];

let envOK = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${'*'.repeat(Math.min(value.length, 20))}`);
  } else {
    console.log(`   ❌ ${varName}: MANQUANT`);
    envOK = false;
  }
});

// 2. Vérifier les dépendances critiques
console.log('\n2️⃣ Dépendances critiques:');
const criticalDeps = ['crypto', 'jsonwebtoken', 'mongoose'];

criticalDeps.forEach(dep => {
  try {
    require(dep);
    console.log(`   ✅ ${dep}: Disponible`);
  } catch (error) {
    console.log(`   ❌ ${dep}: MANQUANT`);
    envOK = false;
  }
});

// 3. Vérifier les fichiers du système de protection
console.log('\n3️⃣ Fichiers du système de protection:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  './services/privacyProtectionService.js',
  './services/deliveryService.js',
  './models/Delivery.js'
];

requiredFiles.forEach(filePath => {
  if (fs.existsSync(path.resolve(__dirname, filePath))) {
    console.log(`   ✅ ${filePath}: Présent`);
  } else {
    console.log(`   ❌ ${filePath}: MANQUANT`);
    envOK = false;
  }
});

// 4. Test basique de crypto
console.log('\n4️⃣ Test cryptographique:');
try {
  const crypto = require('crypto');
  const testData = 'test-data-cadok';
  const hash = crypto.createHash('sha256').update(testData).digest('hex');
  console.log(`   ✅ Crypto fonctionne: ${hash.substring(0, 16)}...`);
} catch (error) {
  console.log(`   ❌ Crypto défaillant: ${error.message}`);
  envOK = false;
}

// Résultat final
console.log('\n' + '='.repeat(50));
if (envOK) {
  console.log('✅ ENVIRONNEMENT PRÊT POUR LES TESTS');
  console.log('\n🚀 Vous pouvez maintenant lancer:');
  console.log('   node test-privacy-protection.js');
  console.log('\n📱 Pour tester avec l\'app mobile:');
  console.log('   1. Démarrez le backend: node server.js');
  console.log('   2. Démarrez l\'app mobile: npx expo start');
} else {
  console.log('❌ ENVIRONNEMENT INCOMPLET');
  console.log('\n🔧 Actions requises:');
  console.log('   1. Vérifiez le fichier .env');
  console.log('   2. Installez les dépendances: npm install');
  console.log('   3. Assurez-vous que tous les fichiers sont présents');
}
console.log('='.repeat(50));
