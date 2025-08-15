/**
 * SERVEUR HTTP SIMPLE - VISUALISATION TEMPLATES
 * =============================================
 * 
 * Lance un serveur web local pour visualiser tous les templates email
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

class TemplateServer {
  constructor(port = 3001) {
    this.port = port;
    this.templatesDir = path.join(__dirname, '..', 'email-previews-complete');
  }

  /**
   * Démarre le serveur
   */
  async start() {
    const server = http.createServer(async (req, res) => {
      try {
        console.log(`📥 ${req.method} ${req.url}`);
        
        // Nettoyage de l'URL - suppression des paramètres VS Code
        const url = new URL(req.url, `http://localhost:${this.port}`);
        const pathname = url.pathname;
        
        console.log(`🔍 Pathname nettoyé: ${pathname}`);
        
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
                <title>404 - Fichier non trouvé</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1 class="error">404 - Fichier non trouvé</h1>
                <p>Le fichier <code>${req.url}</code> n'existe pas.</p>
                <a href="/">← Retour à l'accueil</a>
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
          <body>
              <h1>Erreur serveur</h1>
              <pre>${error.message}</pre>
          </body>
          </html>
        `);
      }
    });

    server.listen(this.port, () => {
      console.log(`
🌐 SERVEUR TEMPLATES CADOK DÉMARRÉ !
═══════════════════════════════════════
📂 Dossier: ${this.templatesDir}
🌍 URL: http://localhost:${this.port}
📧 Templates: ${this.port === 3001 ? '5 templates disponibles' : 'Multiples templates'}
═══════════════════════════════════════

🚀 Ouvrez votre navigateur sur: http://localhost:${this.port}

Appuyez sur Ctrl+C pour arrêter le serveur.
      `);
    });

    return server;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const server = new TemplateServer(3001);
  server.start().catch(error => {
    console.error('💥 Impossible de démarrer le serveur:', error);
    process.exit(1);
  });
}

module.exports = TemplateServer;
