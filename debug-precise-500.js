/**
 * Debug précis de l'erreur 500 sur les filtres
 */
const http = require('http');

console.log('🔍 DIAGNOSTIC PRÉCIS - ERREUR 500\n');

const testEndpoint = (path) => {
  return new Promise((resolve) => {
    console.log(`Testing: ${path}`);
    const req = http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`Type de réponse: ${typeof json}`);
          console.log(`Est un tableau: ${Array.isArray(json)}`);
          if (Array.isArray(json)) {
            console.log(`Nombre d'éléments: ${json.length}`);
            if (json.length > 0) {
              console.log(`Premier élément: ${JSON.stringify(json[0], null, 2).substring(0, 200)}...`);
            }
          } else {
            console.log(`Clés de l'objet: ${Object.keys(json).join(', ')}`);
            console.log(`Contenu: ${JSON.stringify(json).substring(0, 200)}...`);
          }
        } catch (e) {
          console.log(`Erreur JSON: ${e.message}`);
          console.log(`Raw data: ${data.substring(0, 200)}...`);
        }
        console.log('---\n');
        resolve();
      });
    });
    req.on('error', (err) => {
      console.log(`Erreur réseau: ${err.message}\n`);
      resolve();
    });
    req.setTimeout(5000, () => {
      console.log('Timeout\n');
      resolve();
    });
  });
};

async function diagnose() {
  await testEndpoint('/api/objects?status=available');
  await testEndpoint('/api/objects?status=available&category=Books');
  await testEndpoint('/api/categories');
}

diagnose().catch(console.error);
