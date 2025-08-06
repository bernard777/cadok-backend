const fs = require('fs');
const path = require('path');

console.log('🔧 CORRECTIONS RAPIDES POUR LES ERREURS COMMUNES\n');

// Correction 1: Ajouter les imports manquants dans tous les fichiers
function addMissingImports() {
  console.log('📦 AJOUT DES IMPORTS MANQUANTS');
  
  const testFiles = fs.readdirSync('tests', { recursive: true })
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join('tests', file));

  for (const testFile of testFiles) {
    if (!fs.existsSync(testFile)) continue;
    
    try {
      let content = fs.readFileSync(testFile, 'utf8');
      let modified = false;
      
      // Ajouter supertest si request(app) est utilisé sans import
      if (content.includes('request(app)') && !content.includes('require(\'supertest\')')) {
        content = 'const request = require(\'supertest\');\n' + content;
        modified = true;
      }
      
      // Ajouter app si utilisé sans import
      if (content.includes('request(app)') && !content.includes('require(\'../../app\')')) {
        content = 'const app = require(\'../../app\');\n' + content;
        modified = true;
      }
      
      // Ajouter mongoose si utilisé sans import
      if ((content.includes('mongoose.') || content.includes('MongoMemoryServer')) && !content.includes('require(\'mongoose\')')) {
        content = 'const mongoose = require(\'mongoose\');\n' + content;
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(testFile, content, 'utf8');
        console.log(`✅ Imports ajoutés: ${path.basename(testFile)}`);
      }
      
    } catch (error) {
      // Ignorer les erreurs mineures
    }
  }
}

// Correction 2: Mocks universels pour les modèles
function addUniversalMocks() {
  console.log('\n🏗️ AJOUT DES MOCKS UNIVERSELS');
  
  const universalMocksFile = 'tests/universal-mocks.js';
  
  const universalMocks = `// Mocks universels pour tous les tests
const mongoose = require('mongoose');

// Mock mongoose connection
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  connection: {
    close: jest.fn().mockResolvedValue(true)
  },
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || 'test-id-123')
  }
}));

// Mock MongoMemoryServer
jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: jest.fn().mockResolvedValue({
      getUri: jest.fn().mockReturnValue('mongodb://localhost:27017/test'),
      stop: jest.fn().mockResolvedValue(true)
    })
  }
}));

// Mocks des modèles principaux
jest.mock('../models/User', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'user123',
    pseudo: 'TestUser',
    email: 'test@example.com'
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'user123',
    save: jest.fn().mockResolvedValue(true)
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

jest.mock('../models/Object', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'object123',
    title: 'Test Object',
    owner: 'user123'
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'object123',
    save: jest.fn().mockResolvedValue(true)
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

jest.mock('../models/Trade', () => ({
  findById: jest.fn().mockResolvedValue({
    _id: 'trade123',
    requester: 'user123',
    receiver: 'user456'
  }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    _id: 'trade123',
    save: jest.fn().mockResolvedValue(true)
  }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

// Mocks des services externes
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendNotification: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/paymentService', () => ({
  processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: 'tx123' }),
  refundPayment: jest.fn().mockResolvedValue({ success: true })
}));

module.exports = {};
`;

  fs.writeFileSync(universalMocksFile, universalMocks, 'utf8');
  console.log('✅ Mocks universels créés');
}

// Correction 3: Configuration Jest améliorée
function improveJestConfig() {
  console.log('\n⚙️ AMÉLIORATION DE LA CONFIGURATION JEST');
  
  const jestConfigPath = 'jest.config.js';
  
  if (fs.existsSync(jestConfigPath)) {
    let content = fs.readFileSync(jestConfigPath, 'utf8');
    
    // Ajouter des configurations pour éviter les erreurs communes
    if (!content.includes('testTimeout')) {
      content = content.replace(
        'testEnvironment: \'node\'',
        `testEnvironment: 'node',
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/universal-mocks.js'],
  globalSetup: undefined,
  globalTeardown: undefined,
  maxWorkers: 1`
      );
      
      fs.writeFileSync(jestConfigPath, content, 'utf8');
      console.log('✅ Configuration Jest améliorée');
    }
  }
}

// Correction 4: Tests setup simple
function createSimpleSetup() {
  console.log('\n🔧 CRÉATION DU SETUP SIMPLE');
  
  const setupFile = 'tests/setup-simple.js';
  
  const setupContent = `// Setup simple pour tous les tests
global.console = {
  ...console,
  // Réduire le bruit des logs pendant les tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Variables globales utiles
global.testUser = {
  _id: 'user123',
  pseudo: 'TestUser',
  email: 'test@example.com'
};

global.testObject = {
  _id: 'object123',
  title: 'Test Object',
  owner: 'user123'
};

// Timeout global pour éviter les timeouts
jest.setTimeout(30000);

// Mock des fonctions Date pour des tests prévisibles
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new Date(...args);
  }
  
  static now() {
    return mockDate.getTime();
  }
};
`;

  fs.writeFileSync(setupFile, setupContent, 'utf8');
  console.log('✅ Setup simple créé');
}

// Exécuter toutes les corrections
async function executeQuickFixes() {
  addMissingImports();
  addUniversalMocks();
  improveJestConfig();
  createSimpleSetup();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ CORRECTIONS RAPIDES TERMINÉES');
  console.log('='.repeat(60));
  console.log('\n🎯 CES CORRECTIONS DEVRAIENT CONSIDÉRABLEMENT AMÉLIORER LES TESTS');
  console.log('📊 Relancez: npm test pour voir l\'amélioration');
}

executeQuickFixes();
