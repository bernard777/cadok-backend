/**
 * SCRIPT DE CHANGEMENT CADOK -> KADOC
 * ===================================
 */

const fs = require('fs').promises;
const path = require('path');

async function changeCadokToKadoc() {
  const filePath = path.join(__dirname, 'CadokEmailTemplates.js');
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Remplacer toutes les occurrences de CADOK par KADOC
    const updatedContent = content.replace(/CADOK/g, 'KADOC');
    
    await fs.writeFile(filePath, updatedContent, 'utf8');
    
    console.log('✅ Toutes les occurrences de CADOK ont été remplacées par KADOC');
    
    // Compter les remplacements
    const originalMatches = (content.match(/CADOK/g) || []).length;
    const newMatches = (updatedContent.match(/KADOC/g) || []).length;
    
    console.log(`📊 ${originalMatches} occurrences trouvées et remplacées`);
    console.log(`✅ ${newMatches} occurrences de KADOC maintenant présentes`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

changeCadokToKadoc();
