const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log('Requête reçue:', req.url);
  
  // Servir modern.html par défaut
  let filePath = path.join(__dirname, 'public', 'verification', 'modern.html');
  
  if (req.url !== '/' && req.url !== '/modern.html') {
    const requestedFile = req.url.startsWith('/') ? req.url.slice(1) : req.url;
    filePath = path.join(__dirname, 'public', 'verification', requestedFile);
  }
  
  console.log('Fichier demandé:', filePath);
  
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.log('Erreur:', err.message);
      res.writeHead(404);
      res.end('Page non trouvée');
      return;
    }
    
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
    console.log('Fichier servi avec succès');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('✅ Serveur KADOC démarré sur http://127.0.0.1:' + PORT);
  console.log('📄 Accédez à: http://127.0.0.1:' + PORT + '/modern.html');
});
