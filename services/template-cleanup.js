/**
 * SCRIPT DE NETTOYAGE - UNIFICATION DES TEMPLATES
 * ==============================================
 * 
 * Supprime les anciens templates et utilise CadokEmailTemplates
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateCleanup {

  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  /**
   * Nettoie EmailVerificationService.js
   */
  async cleanEmailVerificationService() {
    const filePath = path.join(__dirname, 'EmailVerificationService.js');
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Supprimer les anciens templates (tout après la dernière méthode utile)
      const cleanContent = content.replace(
        /\/\*\*\s*\*\s*Template email de vérification[\s\S]*$/m,
        `  /**
   * TEMPLATES UNIFIÉS
   * =================
   * 
   * Tous les templates ont été déplacés vers CadokEmailTemplates.js
   * pour maintenir la cohérence visuelle et éviter les confusions.
   * 
   * Design de référence : EmailTemplates.js (2-email-templates-verification)
   */
}

module.exports = EmailVerificationService;`
      );

      await fs.writeFile(filePath, cleanContent, 'utf8');
      console.log('✅ EmailVerificationService.js nettoyé');
      
    } catch (error) {
      console.error('❌ Erreur nettoyage EmailVerificationService:', error.message);
    }
  }

  /**
   * Supprime les anciens dossiers de templates
   */
  async removeOldTemplateDirs() {
    const dirsToRemove = [
      path.join(this.projectRoot, 'template-validation'),
      path.join(this.projectRoot, 'templates'),
      path.join(this.projectRoot, 'email-previews'),
      path.join(this.projectRoot, 'email-previews-complete'),
      path.join(this.projectRoot, 'email-previews-super-complet')
    ];

    for (const dir of dirsToRemove) {
      try {
        await fs.access(dir);
        await this.removeDirectory(dir);
        console.log(`✅ Supprimé: ${path.basename(dir)}`);
      } catch (error) {
        console.log(`ℹ️  N'existe pas: ${path.basename(dir)}`);
      }
    }
  }

  /**
   * Supprime récursivement un dossier
   */
  async removeDirectory(dir) {
    try {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }
      
      await fs.rmdir(dir);
    } catch (error) {
      console.warn(`⚠️ Erreur suppression ${dir}:`, error.message);
    }
  }

  /**
   * Génère un aperçu du nouveau système unifié
   */
  async generateUnifiedPreview() {
    const CadokEmailTemplates = require('./CadokEmailTemplates');
    const outputDir = path.join(this.projectRoot, 'email-preview-unifie');
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      const testUser = {
        pseudo: 'Jean Dupont',
        email: 'jean.dupont@example.com'
      };
      
      // Template de vérification
      const verificationHtml = CadokEmailTemplates.getVerificationTemplate(
        testUser.pseudo,
        '123456',
        'https://cadok.com/verify?token=abc123',
        testUser.email
      );
      
      // Template de bienvenue
      const welcomeHtml = CadokEmailTemplates.getWelcomeTemplate(
        testUser.pseudo,
        'https://cadok.com/login'
      );
      
      // Template reset password
      const resetHtml = CadokEmailTemplates.getPasswordResetTemplate(
        testUser.pseudo,
        'https://cadok.com/reset?token=def456'
      );
      
      // Template simple
      const simpleHtml = CadokEmailTemplates.getSimpleTemplate(
        testUser.pseudo,
        'Voici un message de notification important de votre équipe CADOK.',
        'Voir les détails',
        'https://cadok.com/dashboard'
      );

      // Sauvegarder les templates
      await fs.writeFile(path.join(outputDir, 'verification.html'), verificationHtml, 'utf8');
      await fs.writeFile(path.join(outputDir, 'bienvenue.html'), welcomeHtml, 'utf8');
      await fs.writeFile(path.join(outputDir, 'reset-password.html'), resetHtml, 'utf8');
      await fs.writeFile(path.join(outputDir, 'notification.html'), simpleHtml, 'utf8');

      // Index unifié
      const indexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CADOK - Templates Unifiés</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 40px; background: #f5f5f5; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            background: linear-gradient(135deg, #022601 0%, #2E7D32 100%); 
            color: white; padding: 40px; border-radius: 16px; text-align: center; margin-bottom: 40px; 
        }
        .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .card { 
            background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-left: 4px solid #FF8F00;
        }
        .btn { 
            display: inline-block; background: linear-gradient(135deg, #FF8F00 0%, #F57C00 100%); 
            color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; 
            font-weight: 600; transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        
        <div class="header">
            <h1 style="margin: 0; font-size: 42px;">✅ Templates CADOK Unifiés</h1>
            <p style="margin: 10px 0 0; font-size: 20px; opacity: 0.9;">Design cohérent basé sur EmailTemplates.js</p>
        </div>
        
        <div class="success">
            <h3 style="margin: 0 0 10px;">🎉 Nettoyage terminé avec succès !</h3>
            <p style="margin: 0;">Tous les anciens templates ont été supprimés. Seuls les templates unifiés de CadokEmailTemplates.js sont utilisés.</p>
        </div>
        
        <div class="info">
            <h4 style="margin: 0 0 10px;">📋 Templates disponibles :</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>getVerificationTemplate()</strong> - Email de vérification avec code</li>
                <li><strong>getWelcomeTemplate()</strong> - Email de bienvenue après vérification</li>
                <li><strong>getPasswordResetTemplate()</strong> - Réinitialisation mot de passe</li>
                <li><strong>getSimpleTemplate()</strong> - Template générique pour notifications</li>
            </ul>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3 style="color: #022601;">📧 Template Vérification</h3>
                <p>Design de référence avec code de vérification et bouton CTA.</p>
                <a href="verification.html" class="btn" target="_blank">👀 Voir</a>
            </div>
            
            <div class="card">
                <h3 style="color: #022601;">🎉 Template Bienvenue</h3>
                <p>Message de félicitations avec avantages et call-to-action.</p>
                <a href="bienvenue.html" class="btn" target="_blank">👀 Voir</a>
            </div>
            
            <div class="card">
                <h3 style="color: #022601;">🔐 Template Reset Password</h3>
                <p>Email sécurisé pour la réinitialisation de mot de passe.</p>
                <a href="reset-password.html" class="btn" target="_blank">👀 Voir</a>
            </div>
            
            <div class="card">
                <h3 style="color: #022601;">📬 Template Notification</h3>
                <p>Template générique pour toutes les notifications.</p>
                <a href="notification.html" class="btn" target="_blank">👀 Voir</a>
            </div>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 40px; text-align: center;">
            <h3 style="color: #022601; margin: 0 0 15px;">✨ Design Unifié</h3>
            <p style="color: #666; margin: 0;">
                Tous les templates utilisent maintenant le même design cohérent basé sur <strong>EmailTemplates.js</strong><br>
                avec les couleurs officielles CADOK (#022601, #2E7D32, #FF8F00).
            </p>
        </div>
        
    </div>
</body>
</html>`;

      await fs.writeFile(path.join(outputDir, 'index.html'), indexHtml, 'utf8');
      
      console.log(`✅ Aperçu unifié généré: ${outputDir}`);
      
    } catch (error) {
      console.error('❌ Erreur génération aperçu:', error.message);
    }
  }

  /**
   * Nettoyage complet
   */
  async cleanup() {
    console.log('🧹 NETTOYAGE COMPLET DES TEMPLATES');
    console.log('=================================\n');
    
    // 1. Nettoyer EmailVerificationService
    console.log('1. Nettoyage EmailVerificationService...');
    await this.cleanEmailVerificationService();
    
    // 2. Supprimer anciens dossiers
    console.log('\n2. Suppression anciens dossiers templates...');
    await this.removeOldTemplateDirs();
    
    // 3. Générer aperçu unifié
    console.log('\n3. Génération aperçu unifié...');
    await this.generateUnifiedPreview();
    
    console.log('\n✅ NETTOYAGE TERMINÉ !');
    console.log('======================');
    console.log('📂 Aperçu unifié: email-preview-unifie/index.html');
    console.log('🎯 Service unifié: CadokEmailTemplates.js');
    console.log('📧 Service principal: EmailVerificationService.js (nettoyé)');
    console.log('\n🚀 Tous les emails utilisent maintenant le design de référence !');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const cleanup = new TemplateCleanup();
  cleanup.cleanup().catch(error => {
    console.error('💥 Erreur nettoyage:', error);
  });
}

module.exports = TemplateCleanup;
