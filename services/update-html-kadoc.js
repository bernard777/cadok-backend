/**
 * SCRIPT DE CHANGEMENT CADOK -> KADOC DANS LES FICHIERS HTML
 * =========================================================
 */

const fs = require('fs').promises;
const path = require('path');

async function updateHtmlFiles() {
  const previewDir = path.join(__dirname, '..', 'email-preview-unifie');
  
  try {
    const files = await fs.readdir(previewDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log('🔄 Mise à jour des fichiers HTML avec KADOC...\n');
    
    for (const fileName of htmlFiles) {
      const filePath = path.join(previewDir, fileName);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Compter les occurrences avant
      const beforeCount = (content.match(/CADOK/gi) || []).length;
      
      // Remplacer toutes les occurrences (insensible à la casse)
      content = content.replace(/CADOK/gi, 'KADOC');
      
      // Compter après
      const afterCount = (content.match(/KADOC/gi) || []).length;
      
      // Sauvegarder
      await fs.writeFile(filePath, content, 'utf8');
      
      console.log(`✅ ${fileName}: ${beforeCount} → ${afterCount} occurrences KADOC`);
    }
    
    console.log('\n🎉 Tous les fichiers HTML mis à jour avec KADOC !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

updateHtmlFiles();
