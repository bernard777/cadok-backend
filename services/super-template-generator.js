/**
 * SUPER GÉNÉRATEUR - TOUS LES TEMPLATES EMAIL DÉCOUVERTS
 * =====================================================
 * 
 * Génère les aperçus de TOUS les templates trouvés dans Git
 */

const fs = require('fs').promises;
const path = require('path');

// Import des services email
const EmailTemplates = require('./EmailTemplates');
const CourierEmailService = require('./CourierEmailService');

class SuperTemplateGenerator {
  
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'email-previews-super-complet');
    this.projectRoot = path.join(__dirname, '..');
    
    // Données de test
    this.testUser = {
      pseudo: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      username: 'jeandupont'
    };
    
    this.testData = {
      verificationCode: '123456',
      verificationUrl: 'https://cadok.com/verify?token=abc123',
      resetUrl: 'https://cadok.com/reset?token=def456',
      loginUrl: 'https://cadok.com/login'
    };

    // Répertoires de templates découverts
    this.templateDirs = [
      {
        path: path.join(this.projectRoot, 'template-validation'),
        name: 'Template Validation',
        description: 'Templates HTML de validation'
      },
      {
        path: path.join(this.projectRoot, 'templates'),
        name: 'Templates Directory',
        description: 'Dossier templates avec designs'
      }
    ];
  }

  /**
   * Templates du système hybride (existants)
   */
  getHybridTemplates() {
    return {
      'hybride-bienvenue': `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur CADOK</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header CADOK -->
        <div style="background: linear-gradient(135deg, #022601 0%, #2E7D32 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🎯 CADOK
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                Votre marketplace de troc local
            </p>
        </div>
        
        <!-- Contenu principal -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #022601; font-size: 28px; margin: 0 0 10px; font-weight: 600;">
                    Bienvenue ${this.testUser.pseudo} ! 🎉
                </h2>
                <p style="color: #666; font-size: 18px; margin: 0; line-height: 1.5;">
                    Votre compte CADOK a été créé avec succès
                </p>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${this.testData.loginUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #FF8F00 0%, #F57C00 100%); 
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 30px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(255,143,0,0.3);">
                    🚀 Commencer à troquer
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                © 2024 CADOK - Votre marketplace de troc local<br>
                Cet email a été envoyé à ${this.testUser.email}
            </p>
        </div>
        
    </div>
</body>
</html>`,

      'hybride-verification': `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérifiez votre compte CADOK</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
    
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header CADOK -->
        <div style="background: linear-gradient(135deg, #022601 0%, #2E7D32 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                🔐 CADOK
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">
                Sécurisez votre compte
            </p>
        </div>
        
        <!-- Contenu principal -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #022601; font-size: 28px; margin: 0 0 10px; font-weight: 600;">
                    Vérifiez votre email 📧
                </h2>
                <p style="color: #666; font-size: 18px; margin: 0; line-height: 1.5;">
                    Une dernière étape pour activer votre compte
                </p>
            </div>
            
            <!-- Code de vérification -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
                <h3 style="color: #022601; margin: 0 0 15px; font-size: 18px;">Votre code de vérification :</h3>
                <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; 
                            color: #FF8F00; background: white; padding: 15px 25px; border-radius: 8px; 
                            border: 2px solid #FF8F00; display: inline-block; letter-spacing: 4px;">
                    ${this.testData.verificationCode}
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                © 2024 CADOK - Votre marketplace de troc local
            </p>
        </div>
        
    </div>
</body>
</html>`
    };
  }

  /**
   * Génère TOUS les aperçus découverts
   */
  async generateSuperPreviews() {
    try {
      // Créer le dossier de sortie
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Super dossier créé: ${this.outputDir}`);

      const previews = [];

      // 1. Templates du système hybride
      console.log('📧 Génération templates hybrides...');
      const hybridTemplates = this.getHybridTemplates();
      for (const [name, template] of Object.entries(hybridTemplates)) {
        await this.saveTemplate(`1-${name}`, template, 'Service Hybride (EmailVerificationService)');
        previews.push({ name: `1-${name}`, service: 'Hybride', category: 'Service Principal' });
      }

      // 2. Templates d'EmailTemplates.js
      console.log('📧 Génération templates EmailTemplates...');
      try {
        const verificationTemplate = EmailTemplates.getVerificationTemplate(
          this.testUser.pseudo, 
          this.testData.verificationCode, 
          this.testData.verificationUrl, 
          this.testUser.email
        );
        await this.saveTemplate('2-email-templates-verification', verificationTemplate, 'Service EmailTemplates.js');
        previews.push({ name: '2-email-templates-verification', service: 'EmailTemplates', category: 'Service Avancé' });

        // Tentative d'autres méthodes d'EmailTemplates
        try {
          const welcomeTemplate = EmailTemplates.getWelcomeTemplate(this.testUser.pseudo, this.testData.loginUrl);
          await this.saveTemplate('2-email-templates-welcome', welcomeTemplate, 'Service EmailTemplates.js - Welcome');
          previews.push({ name: '2-email-templates-welcome', service: 'EmailTemplates', category: 'Service Avancé' });
        } catch {}

        try {
          const resetTemplate = EmailTemplates.getPasswordResetTemplate(this.testUser.pseudo, this.testData.resetUrl);
          await this.saveTemplate('2-email-templates-reset', resetTemplate, 'Service EmailTemplates.js - Reset');
          previews.push({ name: '2-email-templates-reset', service: 'EmailTemplates', category: 'Service Avancé' });
        } catch {}

      } catch (error) {
        console.log('⚠️ Erreur EmailTemplates:', error.message);
      }

      // 3. Templates des dossiers découverts
      for (const templateDir of this.templateDirs) {
        console.log(`📧 Génération templates ${templateDir.name}...`);
        try {
          const files = await fs.readdir(templateDir.path);
          const htmlFiles = files.filter(f => f.endsWith('.html'));
          
          for (const htmlFile of htmlFiles) {
            try {
              const filePath = path.join(templateDir.path, htmlFile);
              const content = await fs.readFile(filePath, 'utf8');
              const templateName = `3-${templateDir.name.toLowerCase().replace(/\s+/g, '-')}-${htmlFile.replace('.html', '')}`;
              
              await this.saveTemplate(templateName, content, `${templateDir.description} - ${htmlFile}`);
              previews.push({ 
                name: templateName, 
                service: templateDir.name, 
                category: 'Templates Découverts',
                original: htmlFile
              });
              
            } catch (error) {
              console.log(`⚠️ Erreur lecture ${htmlFile}:`, error.message);
            }
          }
          
        } catch (error) {
          console.log(`⚠️ Erreur dossier ${templateDir.name}:`, error.message);
        }
      }

      // 4. Template de emailService.js (mock)
      console.log('📧 Génération template mock...');
      const mockTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Template Mock - emailService.js</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: #333;">Template Mock Simple</h1>
        <p>Ce template provient du service <code>emailService.js</code> (service mock)</p>
        <h2>Exemple - Bienvenue ${this.testUser.pseudo}</h2>
        <p>Email envoyé à: ${this.testUser.email}</p>
        <p style="color: #666; font-size: 14px;">Service: emailService.js (Mock basique)</p>
    </div>
</body>
</html>`;
      await this.saveTemplate('4-email-service-mock', mockTemplate, 'Service Mock (emailService.js)');
      previews.push({ name: '4-email-service-mock', service: 'Mock', category: 'Service Basique' });

      // 5. Génération de l'index super complet
      await this.generateSuperIndex(previews);

      console.log('\n✅ SUPER GÉNÉRATION COMPLÈTE !');
      console.log(`📂 Dossier: ${this.outputDir}`);
      console.log(`🌐 Templates trouvés: ${previews.length}`);
      console.log(`🚀 Ouvrir: ${path.join(this.outputDir, 'index.html')}`);

      return this.outputDir;

    } catch (error) {
      console.error('❌ Erreur super génération:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un template avec métadonnées
   */
  async saveTemplate(filename, template, description) {
    const filePath = path.join(this.outputDir, `${filename}.html`);
    const enhancedTemplate = this.enhanceTemplate(template, description);
    await fs.writeFile(filePath, enhancedTemplate, 'utf8');
    console.log(`  ✓ ${filename}.html`);
  }

  /**
   * Améliore le template avec des infos debug
   */
  enhanceTemplate(template, description) {
    const debugInfo = `
<!-- 
=================================================
TEMPLATE CADOK - SUPER APERCU COMPLET
=================================================
Service: ${description}
Généré le: ${new Date().toLocaleString('fr-FR')}
Utilisateur test: ${this.testUser.pseudo} (${this.testUser.email})
Découvert par: Super Git Search
=================================================
-->
`;
    return debugInfo + template;
  }

  /**
   * Génère la page d'index super complète
   */
  async generateSuperIndex(previews) {
    // Grouper par catégorie
    const categories = {};
    previews.forEach(preview => {
      const cat = preview.category || 'Autres';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(preview);
    });

    const indexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CADOK - Super Aperçu Complet Git</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 40px; background: #f5f5f5; 
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { 
            background: linear-gradient(135deg, #022601 0%, #2E7D32 100%); 
            color: white; padding: 40px; border-radius: 16px; text-align: center; margin-bottom: 40px; 
        }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { 
            background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center; border-left: 4px solid #FF8F00;
        }
        .category-section { margin: 40px 0; }
        .category-title { 
            color: #022601; font-size: 24px; margin: 0 0 20px; padding: 15px 0; 
            border-bottom: 3px solid #FF8F00;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; }
        .card { 
            background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-left: 4px solid #FF8F00; transition: transform 0.2s;
        }
        .card:hover { transform: translateY(-5px); }
        .card h3 { color: #022601; margin: 0 0 10px; }
        .card p { color: #666; margin: 0 0 15px; }
        .btn { 
            display: inline-block; background: linear-gradient(135deg, #FF8F00 0%, #F57C00 100%); 
            color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; 
            font-weight: 600; transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .service-badge { 
            display: inline-block; background: #e3f2fd; color: #1976d2; 
            padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 500; margin-bottom: 10px;
        }
        .discovery-badge {
            display: inline-block; background: #fff3e0; color: #f57c00;
            padding: 4px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        
        <!-- En-tête -->
        <div class="header">
            <h1 style="margin: 0; font-size: 42px;">🔍 CADOK Super Git Search</h1>
            <p style="margin: 10px 0 0; font-size: 20px; opacity: 0.9;">Tous les templates email découverts dans le projet</p>
        </div>
        
        <!-- Statistiques -->
        <div class="stats-grid">
            <div class="stat-card">
                <h3 style="color: #022601; margin: 0 0 10px;">📧 Templates Total</h3>
                <div style="font-size: 32px; color: #FF8F00; font-weight: bold;">${previews.length}</div>
            </div>
            <div class="stat-card">
                <h3 style="color: #022601; margin: 0 0 10px;">🗂️ Catégories</h3>
                <div style="font-size: 32px; color: #FF8F00; font-weight: bold;">${Object.keys(categories).length}</div>
            </div>
            <div class="stat-card">
                <h3 style="color: #022601; margin: 0 0 10px;">📁 Sources</h3>
                <div style="font-size: 32px; color: #FF8F00; font-weight: bold;">${new Set(previews.map(p => p.service)).size}</div>
            </div>
            <div class="stat-card">
                <h3 style="color: #022601; margin: 0 0 10px;">🔍 Découverts</h3>
                <div style="font-size: 32px; color: #2E7D32; font-weight: bold;">${previews.filter(p => p.category === 'Templates Découverts').length}</div>
            </div>
        </div>
        
        <!-- Catégories de templates -->
        ${Object.entries(categories).map(([categoryName, categoryPreviews]) => `
        <div class="category-section">
            <h2 class="category-title">📂 ${categoryName} (${categoryPreviews.length})</h2>
            <div class="grid">
                ${categoryPreviews.map(preview => `
                <div class="card">
                    <div class="service-badge">${preview.service}</div>
                    ${preview.original ? `<div class="discovery-badge">📄 ${preview.original}</div>` : ''}
                    <h3>${preview.name}</h3>
                    <p>Template HTML avec le thème CADOK et les couleurs officielles.</p>
                    <a href="${preview.name}.html" class="btn" target="_blank">
                        👀 Voir l'aperçu
                    </a>
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}
        
        <!-- Informations techniques -->
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 40px;">
            <h3 style="color: #022601; margin: 0 0 20px;">🔧 Informations de Découverte Git</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div>
                    <h4 style="color: #FF8F00; margin: 0 0 10px;">📁 Dossiers explorés :</h4>
                    <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>cadok-backend/services/ (services email)</li>
                        <li>cadok-backend/template-validation/ (templates validation)</li>
                        <li>cadok-backend/templates/ (designs email)</li>
                        <li>Recherche récursive *.html</li>
                    </ul>
                </div>
                <div>
                    <h4 style="color: #FF8F00; margin: 0 0 10px;">🎯 Services découverts :</h4>
                    <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                        ${Array.from(new Set(previews.map(p => p.service))).map(service => `<li>${service}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #666; margin: 0; text-align: center;">
                    <strong>Généré le :</strong> ${new Date().toLocaleString('fr-FR')} • 
                    <strong>Utilisateur test :</strong> ${this.testUser.pseudo} (${this.testUser.email})
                </p>
            </div>
        </div>
        
    </div>
</body>
</html>`;

    const indexPath = path.join(this.outputDir, 'index.html');
    await fs.writeFile(indexPath, indexHtml, 'utf8');
    console.log('  ✓ Super index.html généré !');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const generator = new SuperTemplateGenerator();
  generator.generateSuperPreviews()
    .then((outputDir) => {
      console.log(`\n🎉 SUPER GÉNÉRATION TERMINÉE !`);
      console.log(`📂 ${outputDir}`);
      console.log('🌐 Tous les templates Git découverts !');
    })
    .catch(error => {
      console.error('💥 Erreur super génération:', error);
    });
}

module.exports = SuperTemplateGenerator;
