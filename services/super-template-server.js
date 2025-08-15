/**
 * SERVEUR SUPER TEMPLATES + OUVERTURE CHROME
 * ==========================================
 * 
 * Lance un serveur pour tous les templates et ouvre Chrome
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

class SuperTemplateServer {
  constructor(port = 3002) {
    this.port = port;
    this.templatesDir = path.join(__dirname, '..', 'email-previews-super-complet');
  }

  /**
   * Démarre le serveur
   */
  async start() {
    const server = http.createServer(async (req, res) => {
      try {
        // Nettoyage de l'URL - suppression des paramètres VS Code
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const pathname = url.pathname;
        
        console.log(`📥 ${req.method} ${pathname}`);
        
        // Route par défaut
        let filePath;
        if (pathname === '/' || pathname === '/index.html') {
          filePath = path.join(this.templatesDir, 'index.html');
        } else {
          // Nettoyage du pathname
          const cleanPath = pathname.replace(/^\//, '');
          filePath = path.join(this.templatesDir, cleanPath);
        }

        // Vérification existence fichier
        try {
          await fs.access(filePath);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>404 - Template non trouvé</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        text-align: center; padding: 100px; background: #f5f5f5; 
                    }
                    .error { 
                        background: white; padding: 40px; border-radius: 12px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;
                    }
                    h1 { color: #d32f2f; margin: 0 0 20px; }
                    a { color: #FF8F00; text-decoration: none; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h1>🔍 Template non trouvé</h1>
                    <p>Le fichier <code>${pathname}</code> n'existe pas dans les super templates.</p>
                    <a href="/">← Retour aux templates CADOK</a>
                </div>
            </body>
            </html>
          `);
          return;
        }

        // Lecture et envoi du fichier
        const content = await fs.readFile(filePath, 'utf8');
        const ext = path.extname(filePath);
        
        let contentType = 'text/html; charset=utf-8';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'application/javascript';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);

      } catch (error) {
        console.error('❌ Erreur serveur:', error);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html lang="fr">
          <head>
              <meta charset="UTF-8">
              <title>Erreur serveur</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 50px; text-align: center;">
              <h1 style="color: #d32f2f;">Erreur serveur</h1>
              <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px;">${error.message}</pre>
          </body>
          </html>
        `);
      }
    });

    server.listen(this.port, () => {
      console.log(`
🚀 SERVEUR SUPER TEMPLATES DÉMARRÉ !
════════════════════════════════════════════════
📂 Dossier: ${this.templatesDir}
🌍 URL: http://localhost:${this.port}
📧 Super templates: 11 templates découverts
🔍 Découverte Git: Template Validation + Templates Directory
════════════════════════════════════════════════

🌐 Ouverture Chrome en cours...
      `);
      
      // Ouverture automatique de Chrome
      this.openInChrome();
    });

    return server;
  }

  /**
   * Ouvre Chrome avec l'URL du serveur
   */
  openInChrome() {
    const url = `http://localhost:${this.port}`;
    
    // Tentative de différents emplacements Chrome sur Windows
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
    ];
    
    // Commande pour ouvrir Chrome
    const chromeCommand = `"${chromePaths[0]}" "${url}" --new-window`;
    
    exec(chromeCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('⚠️  Chrome introuvable au chemin par défaut');
        console.log('🔧 Tentative avec la commande système...');
        
        // Fallback: utiliser la commande système
        exec(`start chrome "${url}"`, (error2) => {
          if (error2) {
            console.log('⚠️  Impossible d\'ouvrir Chrome automatiquement');
            console.log(`🌐 Ouvrez manuellement: ${url}`);
          } else {
            console.log('✅ Chrome ouvert avec la commande système !');
          }
        });
      } else {
        console.log('✅ Chrome ouvert avec succès !');
      }
    });
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const server = new SuperTemplateServer(3002);
  server.start().catch(error => {
    console.error('💥 Impossible de démarrer le serveur:', error);
    process.exit(1);
  });
}

module.exports = SuperTemplateServer;
