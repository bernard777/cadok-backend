const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const publicDir = path.join(__dirname, 'public', 'verification');

console.log('📁 Dossier public:', publicDir);

const server = http.createServer((req, res) => {
  let pathname = req.url;
  
  console.log(`🔗 Requête: ${req.method} ${pathname}`);
  
  // Route racine vers index.html
  if (pathname === '/') {
    pathname = '/modern.html';
  }
  
  // Ajouter .html si pas d'extension
  if (!path.extname(pathname)) {
    pathname += '.html';
  }
  
  const filePath = path.join(publicDir, pathname);
  console.log('📄 Chemin fichier:', filePath);
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    console.log('❌ Fichier non trouvé');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <h1>404 - Fichier non trouvé</h1>
      <p>Fichier demandé: ${pathname}</p>
      <p>Chemin complet: ${filePath}</p>
      <a href="/modern.html">Page moderne</a>
    `);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);
    
    let contentType = 'text/html; charset=utf-8';
    if (ext === '.js') contentType = 'text/javascript';
    if (ext === '.css') contentType = 'text/css';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    console.log('✅ Fichier servi avec succès');
    
  } catch (error) {
    console.log('❌ Erreur lecture:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Erreur serveur: ' + error.message);
  }
});

server.listen(PORT, () => {
  console.log('🚀 =======================================');
  console.log('   KADOC - SERVEUR SIMPLE');
  console.log('🚀 =======================================');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📁 Dossier: ${publicDir}`);
  console.log('');
  console.log('📄 Pages disponibles:');
  console.log(`   http://localhost:${PORT}/modern.html`);
  console.log('');
  console.log('✅ Serveur démarré avec succès !');
});

// Gestion des erreurs
server.on('error', (err) => {
  console.error('❌ Erreur serveur:', err.message);
});
