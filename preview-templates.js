/**
 * 👀 APERÇU VISUEL DES TEMPLATES EMAIL - CADOK
 * Génère des fichiers HTML pour visualiser les templates
 */

require('dotenv').config();
const EmailVerificationService = require('./services/EmailVerificationService');
const fs = require('fs');
const path = require('path');

async function generateEmailPreviews() {
  console.log('👀 GÉNÉRATION DES APERÇUS EMAIL CADOK\n');
  console.log('═'.repeat(60));
  
  const emailService = new EmailVerificationService();
  
  // Créer le dossier de prévisualisation s'il n'existe pas
  const previewDir = path.join(__dirname, 'email-previews');
  if (!fs.existsSync(previewDir)) {
    fs.mkdirSync(previewDir);
  }
  
  console.log('📁 Dossier de prévisualisation:', previewDir);
  console.log('');
  
  // TEMPLATE 1: Email de bienvenue
  console.log('🎉 Génération template BIENVENUE...');
  const welcomeTemplate = emailService.getWelcomeEmailTemplate('JB_Preview');
  const welcomePath = path.join(previewDir, '1-email-bienvenue.html');
  fs.writeFileSync(welcomePath, welcomeTemplate);
  console.log('   ✅ Sauvegardé:', welcomePath);
  
  // TEMPLATE 2: Email de vérification
  console.log('✅ Génération template VÉRIFICATION...');
  const verificationTemplate = emailService.getVerificationEmailTemplate(
    'JB_Preview', 
    'http://localhost:3000/verify-email/abc123def456'
  );
  const verificationPath = path.join(previewDir, '2-email-verification.html');
  fs.writeFileSync(verificationPath, verificationTemplate);
  console.log('   ✅ Sauvegardé:', verificationPath);
  
  // TEMPLATE 3: Variante avec utilisateur différent
  console.log('👤 Génération variante avec autre utilisateur...');
  const welcomeVariant = emailService.getWelcomeEmailTemplate('Alice_Demo_Test');
  const variantPath = path.join(previewDir, '3-email-bienvenue-variante.html');
  fs.writeFileSync(variantPath, welcomeVariant);
  console.log('   ✅ Sauvegardé:', variantPath);
  
  // Créer un fichier index pour naviguer facilement
  const indexContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Aperçu Templates Email CADOK</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          background: #f4f4f4;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #022601;
          text-align: center;
          margin-bottom: 30px;
        }
        .template-card {
          border: 2px solid #2E7D32;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          background: linear-gradient(145deg, #f8fdf8, #e8f5e8);
        }
        .template-card h3 {
          color: #022601;
          margin: 0 0 10px 0;
        }
        .template-card p {
          color: #2E7D32;
          margin: 5px 0;
        }
        .preview-link {
          display: inline-block;
          background: linear-gradient(135deg, #FF8F00, #ff9f1a);
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin-top: 10px;
        }
        .preview-link:hover {
          background: linear-gradient(135deg, #ff9f1a, #FF8F00);
        }
        .info-box {
          background: #fff3cd;
          border: 2px solid #FF8F00;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .success-box {
          background: linear-gradient(145deg, #e8f5e8, #f0fff0);
          border: 2px solid #2E7D32;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏆 Aperçu Templates Email CADOK</h1>
        
        <div class="info-box">
          <h3>📋 Instructions de visualisation</h3>
          <p><strong>Objectif :</strong> Vérifier que les templates correspondent à vos attentes visuelles.</p>
          <p><strong>Action :</strong> Cliquez sur chaque aperçu pour voir le rendu final dans votre navigateur.</p>
          <p><strong>Points à vérifier :</strong></p>
          <ul>
            <li>🎨 Couleurs du thème CADOK (#022601, #FF8F00, #2E7D32)</li>
            <li>📱 Responsive design</li>
            <li>✍️ Contenu et messaging</li>
            <li>🔗 Liens et boutons</li>
          </ul>
        </div>
        
        <div class="template-card">
          <h3>🎉 Template 1 : Email de Bienvenue</h3>
          <p><strong>Usage :</strong> Envoyé après création du compte</p>
          <p><strong>Contenu :</strong> Message de bienvenue + étapes suivantes</p>
          <p><strong>Pseudo exemple :</strong> JB_Preview</p>
          <a href="./1-email-bienvenue.html" class="preview-link" target="_blank">👀 Voir l'aperçu</a>
        </div>
        
        <div class="template-card">
          <h3>✅ Template 2 : Email de Vérification</h3>
          <p><strong>Usage :</strong> Envoyé pour vérifier l'adresse email</p>
          <p><strong>Contenu :</strong> Lien de vérification + instructions</p>
          <p><strong>Pseudo exemple :</strong> JB_Preview</p>
          <a href="./2-email-verification.html" class="preview-link" target="_blank">👀 Voir l'aperçu</a>
        </div>
        
        <div class="template-card">
          <h3>👤 Template 3 : Bienvenue Variante</h3>
          <p><strong>Usage :</strong> Même template avec utilisateur différent</p>
          <p><strong>Contenu :</strong> Test de personnalisation du pseudo</p>
          <p><strong>Pseudo exemple :</strong> Alice_Demo_Test</p>
          <a href="./3-email-bienvenue-variante.html" class="preview-link" target="_blank">👀 Voir l'aperçu</a>
        </div>
        
        <div class="success-box">
          <h3>🎯 Mode Hybride prêt !</h3>
          <p>Une fois les templates validés, vous pourrez lancer le test du mode hybride qui :</p>
          <ul>
            <li>✅ Utilise ces templates pour les vrais emails (Resend)</li>
            <li>🔄 Les simule automatiquement si restriction</li>
            <li>📊 Fournit des statistiques complètes</li>
            <li>🚀 Permet les tests multi-utilisateurs</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #666;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p style="color: #2E7D32; font-weight: bold;">🏆 CADOK - Plateforme d'échange et de troc</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const indexPath = path.join(previewDir, 'index.html');
  fs.writeFileSync(indexPath, indexContent);
  
  console.log('📋 Page d\'index créée:', indexPath);
  console.log('');
  console.log('🎉 APERÇUS GÉNÉRÉS AVEC SUCCÈS !');
  console.log('═'.repeat(60));
  console.log('');
  console.log('👀 POUR VOIR LES TEMPLATES :');
  console.log(`   1. Ouvrez dans votre navigateur: file:///${indexPath}`);
  console.log('   2. Ou naviguez vers:', previewDir);
  console.log('   3. Double-cliquez sur index.html');
  console.log('');
  console.log('📝 FICHIERS GÉNÉRÉS :');
  console.log('   • index.html (page de navigation)');
  console.log('   • 1-email-bienvenue.html');
  console.log('   • 2-email-verification.html');  
  console.log('   • 3-email-bienvenue-variante.html');
  console.log('');
  console.log('✅ Validez les templates, puis lancez: node test-mode-hybride.js');
  
  // Essayer d'ouvrir automatiquement dans le navigateur (Windows)
  try {
    const { exec } = require('child_process');
    console.log('🌐 Tentative d\'ouverture automatique dans le navigateur...');
    exec(`start "${indexPath}"`, (error) => {
      if (error) {
        console.log('   ℹ️  Ouverture manuelle nécessaire');
      } else {
        console.log('   ✅ Ouvert dans le navigateur !');
      }
    });
  } catch (error) {
    console.log('   ℹ️  Ouverture manuelle: double-cliquez sur index.html');
  }
}

// Exécution
generateEmailPreviews().catch(console.error);
