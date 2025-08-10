/**
 * 🔍 INTERCEPTEUR DE REQUÊTES ÉVÉNEMENTS
 * Ce script va intercepter et logger toutes les requêtes vers les événements
 */

const express = require('express');
const morgan = require('morgan');
const app = express();

// Middleware de logging détaillé
app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

// Middleware pour intercepter toutes les requêtes
app.use('*', (req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.log('\n🎯 === REQUÊTE INTERCEPTÉE ===');
  console.log(`⏰ ${timestamp}`);
  console.log(`📍 ${req.method} ${req.originalUrl}`);
  console.log(`🌐 Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`🔑 Auth: ${req.headers.authorization ? '✅ Present (' + req.headers.authorization.substring(0, 20) + '...)' : '❌ Missing'}`);
  console.log(`📝 Content-Type: ${req.headers['content-type'] || 'N/A'}`);
  console.log(`💻 User-Agent: ${(req.headers['user-agent'] || '').substring(0, 60)}...`);
  console.log(`📍 IP: ${req.ip || req.connection.remoteAddress}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`🔍 Query:`, req.query);
  }
  
  if (req.params && Object.keys(req.params).length > 0) {
    console.log(`🎯 Params:`, req.params);
  }
  
  console.log('================================\n');
  
  // Continuer vers le serveur principal
  next();
});

const PORT = 5555; // Port d'écoute différent

app.listen(PORT, () => {
  console.log(`🔍 MONITEUR D'ÉVÉNEMENTS CADOK`);
  console.log(`================================`);
  console.log(`✅ Écoute sur le port ${PORT}`);
  console.log(`🎯 Surveillant toutes les requêtes HTTP`);
  console.log(`⏳ En attente des requêtes...\n`);
  console.log(`💡 INSTRUCTIONS :`);
  console.log(`1. Gardez ce terminal ouvert`);
  console.log(`2. Allez sur votre interface web`); 
  console.log(`3. Essayez de créer un événement`);
  console.log(`4. Observez les logs qui apparaîtront ici\n`);
});

// Gestion des erreurs
process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non gérée:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée:', reason);
});
