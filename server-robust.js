const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '127.0.0.1';

console.log('🚀 Démarrage du serveur KADOC...');
console.log('📁 Répertoire courant:', __dirname);

const server = http.createServer((req, res) => {
  console.log(`📡 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  
  try {
    // Déterminer le fichier à servir
    let requestedFile = 'modern.html';
    
    if (req.url && req.url !== '/' && req.url !== '/favicon.ico') {
      requestedFile = req.url.startsWith('/') ? req.url.slice(1) : req.url;
    }
    
    const filePath = path.join(__dirname, 'public', 'verification', requestedFile);
    console.log('📄 Fichier demandé:', filePath);
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log('❌ Fichier non trouvé:', filePath);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - KADOC</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: linear-gradient(135deg, #022601, #2E7D32);
              color: white; 
              text-align: center; 
              padding: 50px; 
            }
            .logo { font-size: 48px; margin-bottom: 20px; }
            a { color: #FF8F00; text-decoration: none; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="logo">K</div>
          <h1>404 - Page non trouvée</h1>
          <p>Fichier: ${requestedFile}</p>
          <p>Chemin: ${filePath}</p>
          <p><a href="/modern.html">→ Page moderne</a></p>
        </body>
        </html>
      `);
      return;
    }
    
    // Lire le fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Déterminer le type de contenu
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/html; charset=utf-8';
    
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.json') contentType = 'application/json';
    
    // Envoyer la réponse
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(content, 'utf8'),
      'Cache-Control': 'no-cache'
    });
    res.end(content);
    
    console.log('✅ Fichier servi avec succès:', requestedFile);
    
  } catch (error) {
    console.log('❌ Erreur serveur:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erreur serveur: ' + error.message);
  }
});

// Gestion des erreurs du serveur
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} déjà utilisé. Essayez un autre port.`);
  } else {
    console.log('❌ Erreur serveur:', err.message);
  }
  process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

// Démarrage du serveur
server.listen(PORT, HOST, () => {
  console.log('🎉 =======================================');
  console.log('   SERVEUR KADOC - VERIFICATION');
  console.log('🎉 =======================================');
  console.log(`🌐 Serveur: http://${HOST}:${PORT}`);
  console.log(`📄 Page principale: http://${HOST}:${PORT}/modern.html`);
  console.log(`📁 Dossier public: ${path.join(__dirname, 'public', 'verification')}`);
  console.log('');
  console.log('✅ Serveur prêt ! Appuyez sur Ctrl+C pour arrêter');
});
