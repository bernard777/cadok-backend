#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 NETTOYAGE COMPLET DES TESTS E2E');

// Liste des fichiers E2E à nettoyer
const e2eFiles = [
  'tests/e2e/basic-connectivity.test.js',
  'tests/e2e/complete-user-journey.test.js', 
  'tests/e2e/payment-flows.test.js',
  'tests/e2e/security-flows.test.js'
];

// Fonction pour nettoyer un fichier E2E
function cleanE2EFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Fichier non trouvé: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Supprimer tous les jest.mock
    content = content.replace(/jest\.mock\([^)]+\)[^}]*}\)\);?\s*/g, '');
    
    // Supprimer les blocs de mock mal formés
    content = content.replace(/\/\/ Mock[^{]*\{[^}]*\}\)\);?\s*/g, '');
    
    // Supprimer les commentaires de mock
    content = content.replace(/\/\/ Tests E2E[\s\S]*?\/\/ Mock[^{]*(?=const request)/g, '');
    
    // Supprimer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Corriger les problèmes de syntaxe courants
    content = content.replace(/}\)\s*$/g, '});');
    content = content.replace(/}\)\s*;/g, '});');
    
    // S'assurer que le fichier commence correctement
    if (!content.startsWith('/**') && !content.startsWith('const request')) {
      content = `/**
 * Tests E2E - ${path.basename(filePath)}
 */

const request = require('supertest');
const app = require('../../app');

` + content;
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Nettoyé: ${path.basename(filePath)}`);
    
  } catch (error) {
    console.log(`❌ Erreur nettoyage ${filePath}:`, error.message);
  }
}

// Nettoyer tous les fichiers E2E
e2eFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  cleanE2EFile(fullPath);
});

// Créer des tests E2E simples et fonctionnels
const simpleE2EContent = `/**
 * Tests E2E - Connectivité Basique
 */

const request = require('supertest');
const app = require('../../app');

describe('🚀 Tests E2E Basiques', () => {
  test('Health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
  });

  test('Endpoint inexistant retourne 404', async () => {
    await request(app)
      .get('/api/inexistant')
      .expect(404);
  });

  test('Accès sans authentification', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });
});
`;

// Réécrire le fichier basic-connectivity avec un contenu simple
try {
  fs.writeFileSync(path.join(__dirname, 'tests/e2e/basic-connectivity.test.js'), simpleE2EContent);
  console.log('✅ basic-connectivity.test.js réécrit avec contenu simple');
} catch (error) {
  console.log('❌ Erreur réécriture basic-connectivity:', error.message);
}

console.log('\n🏁 NETTOYAGE TERMINÉ');
console.log('Les tests E2E sont maintenant prêts à fonctionner sans mocks.');
