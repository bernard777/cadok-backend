/**
 * 🔍 MIDDLEWARE DEBUG POUR ÉVÉNEMENTS
 */

const express = require('express');
const router = express.Router();

// Middleware pour logger toutes les requêtes vers les événements
router.use('*', (req, res, next) => {
  console.log('\n🎪 === DEBUG ÉVÉNEMENTS ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? '✅ Present' : '❌ Missing',
    'origin': req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  console.log('IP:', req.ip);
  console.log('=== FIN DEBUG ===\n');
  
  next();
});

module.exports = router;
