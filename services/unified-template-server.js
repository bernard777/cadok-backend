/**
 * SERVEUR TEMPLATES UNIFIÉS
 * ========================
 * 
 * Serveur simple pour visualiser les templates CADOK unifiés
 */

const express = require('express');
const path = require('path');
const { exec } = require('child_process');

class UnifiedTemplateServer {
  
  constructor() {
    this.app = express();
    this.port = 3003;
    this.previewDir = path.join(__dirname, '..', 'email-preview-unifie');
    this.setupRoutes();
  }

  setupRoutes() {
    // Servir les fichiers statiques
    this.app.use(express.static(this.previewDir));
    
    // Route principale
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(this.previewDir, 'index.html'));
    });
    
    // Info API
    this.app.get('/api/info', (req, res) => {
      res.json({
        message: 'Templates CADOK Unifiés',
        design: 'Basé sur EmailTemplates.js',
        templates: [
          'verification.html - Email de vérification',
          'bienvenue.html - Email de bienvenue', 
          'reset-password.html - Réinitialisation mot de passe',
          'notification.html - Template générique'
        ],
        colors: {
          primary: '#022601',
          secondary: '#2E7D32', 
          accent: '#FF8F00'
        }
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      const url = `http://localhost:${this.port}`;
      
      console.log('\n🚀 SERVEUR TEMPLATES UNIFIÉS DÉMARRÉ');
      console.log('===================================');
      console.log(`📱 URL: ${url}`);
      console.log('📂 Dossier: email-preview-unifie/');
      console.log('🎨 Design: EmailTemplates.js unifié');
      console.log('✨ Couleurs CADOK officielles');
      
      // Ouvrir automatiquement Chrome
      console.log('\n🌐 Ouverture de Chrome...');
      
      const openChrome = () => {
        const commands = [
          `start chrome "${url}"`, // Windows
          `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" "${url}"`, // Chrome direct
          `"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" "${url}"` // Chrome x86
        ];
        
        let attempts = 0;
        const tryNext = () => {
          if (attempts >= commands.length) {
            console.log('❌ Impossible d\'ouvrir Chrome automatiquement');
            console.log(`🔗 Ouvrez manuellement: ${url}`);
            return;
          }
          
          exec(commands[attempts], (error) => {
            if (error) {
              attempts++;
              setTimeout(tryNext, 500);
            } else {
              console.log('✅ Chrome ouvert avec succès !');
            }
          });
        };
        
        tryNext();
      };
      
      setTimeout(openChrome, 1000);
    });
  }
}

// Démarrage si script principal
if (require.main === module) {
  console.log('🎯 LANCEMENT DU SERVEUR TEMPLATES UNIFIÉS');
  console.log('=========================================\n');
  
  const server = new UnifiedTemplateServer();
  server.start();
  
  // Gestion propre de l'arrêt
  process.on('SIGINT', () => {
    console.log('\n\n👋 Arrêt du serveur templates unifiés...');
    console.log('✅ Templates CADOK standardisés avec succès !');
    process.exit(0);
  });
}

module.exports = UnifiedTemplateServer;
