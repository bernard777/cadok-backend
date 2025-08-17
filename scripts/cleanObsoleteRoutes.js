/**
 * Script pour supprimer les routes PUT obsolètes
 */

const fs = require('fs');
const path = require('path');

const tradesFilePath = path.join(__dirname, '../routes/trades.js');

console.log('🧹 Nettoyage des routes PUT obsolètes...');

try {
  let content = fs.readFileSync(tradesFilePath, 'utf8');
  
  // Supprimer la route PUT /accept (lignes ~284-378)
  const putAcceptStart = content.indexOf('// ========== ACCEPTER UNE PROPOSITION ==========');
  const putAcceptEnd = content.indexOf('// ========== REFUSER UNE DEMANDE DE TROC ==========');
  
  if (putAcceptStart !== -1 && putAcceptEnd !== -1) {
    const beforeSection = content.substring(0, putAcceptStart);
    const afterSection = content.substring(putAcceptEnd);
    
    content = beforeSection + afterSection;
    console.log('✅ Route PUT /accept supprimée');
  }
  
  // Supprimer la route PUT /refuse (après /reject)
  const putRefuseStart = content.indexOf('// ========== REFUSER UNE DEMANDE DE TROC ==========');
  const putRefuseEnd = content.indexOf('// ========== REFUSER UNE DEMANDE DE TROC (ALIAS) ==========');
  
  if (putRefuseStart !== -1 && putRefuseEnd !== -1) {
    const beforeSection = content.substring(0, putRefuseStart);
    const afterSection = content.substring(putRefuseEnd);
    
    content = beforeSection + afterSection;
    console.log('✅ Route PUT /refuse supprimée');
  }
  
  // Sauvegarder le fichier modifié
  fs.writeFileSync(tradesFilePath, content);
  console.log('💾 Fichier sauvegardé');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
