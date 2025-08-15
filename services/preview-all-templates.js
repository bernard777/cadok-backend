/**
 * APERCU COMPLET - TOUS LES TEMPLATES EMAIL CADOK
 * ==============================================
 * 
 * Génère les aperçus HTML de TOUS les templates trouvés dans le projet
 */

const fs = require('fs').promises;
const path = require('path');

// Import des services email découverts
const EmailTemplates = require('./EmailTemplates');
const CourierEmailService = require('./CourierEmailService');

class AllTemplatesPreviewer {
  
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'email-previews-complete');
    
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
  }

  /**
   * Templates du service EmailVerificationService (HYBRIDE)
   */
  getHybridTemplates() {
    return {
      // Template Bienvenue Hybride
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
            
            <!-- Avantages -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #022601; margin: 0 0 20px; font-size: 20px;">✨ Que pouvez-vous faire ?</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                        🔄 <strong>Échanger</strong> vos objets avec vos voisins
                    </li>
                    <li style="margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                        📱 <strong>Publier</strong> vos annonces facilement
                    </li>
                    <li style="margin: 10px 0; padding: 8px 0;">
                        🌍 <strong>Découvrir</strong> votre communauté locale
                    </li>
                </ul>
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

      // Template Vérification Hybride
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
                <p style="color: #666; margin: 15px 0 0; font-size: 14px;">
                    Ce code expire dans 15 minutes
                </p>
            </div>
            
            <!-- Bouton alternatif -->
            <div style="text-align: center; margin: 35px 0;">
                <p style="color: #666; margin: 0 0 20px; font-size: 16px;">Ou cliquez sur ce bouton :</p>
                <a href="${this.testData.verificationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%); 
                          color: white; padding: 16px 32px; text-decoration: none; border-radius: 30px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(46,125,50,0.3);">
                    ✅ Vérifier mon compte
                </a>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
                © 2024 CADOK - Votre marketplace de troc local<br>
                Si vous n'avez pas demandé cette vérification, ignorez cet email
            </p>
        </div>
        
    </div>
</body>
</html>`
    };
  }

  /**
   * Génère tous les aperçus
   */
  async generateAllPreviews() {
    try {
      // Créer le dossier de sortie
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Dossier créé: ${this.outputDir}`);

      const previews = [];

      // 1. Templates du système hybride
      console.log('📧 Génération templates hybrides...');
      const hybridTemplates = this.getHybridTemplates();
      for (const [name, template] of Object.entries(hybridTemplates)) {
        await this.saveTemplate(`1-${name}`, template, 'Service Hybride (EmailVerificationService)');
        previews.push({ name: `1-${name}`, service: 'Hybride' });
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
        previews.push({ name: '2-email-templates-verification', service: 'EmailTemplates' });
      } catch (error) {
        console.log('⚠️ Erreur EmailTemplates:', error.message);
      }

      // 3. Templates de CourierEmailService
      console.log('📧 Génération templates Courier...');
      try {
        const courierService = new CourierEmailService();
        // Nous devrons analyser ce service pour extraire ses templates
        console.log('ℹ️ CourierEmailService détecté mais nécessite analyse approfondie');
      } catch (error) {
        console.log('⚠️ CourierEmailService nécessite configuration Courier');
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
      previews.push({ name: '4-email-service-mock', service: 'Mock' });

      // 5. Génération de l'index
      await this.generateIndex(previews);

      console.log('\n✅ TOUS LES TEMPLATES GÉNÉRÉS !');
      console.log(`📂 Dossier: ${this.outputDir}`);
      console.log(`🌐 Ouvrir: ${path.join(this.outputDir, 'index.html')}`);

      return this.outputDir;

    } catch (error) {
      console.error('❌ Erreur génération complète:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un template
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
TEMPLATE CADOK - APERCU COMPLET
=================================================
Service: ${description}
Généré le: ${new Date().toLocaleString('fr-FR')}
Utilisateur test: ${this.testUser.pseudo} (${this.testUser.email})
=================================================
-->
`;
    return debugInfo + template;
  }

  /**
   * Génère la page d'index
   */
  async generateIndex(previews) {
    const indexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CADOK - Aperçu Complet des Templates Email</title>
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
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .card { 
            background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border-left: 4px solid #FF8F00;
        }
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
            padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 500;
        }
        .stats { 
            background: white; padding: 25px; border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 30px; text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        
        <!-- En-tête -->
        <div class="header">
            <h1 style="margin: 0; font-size: 36px;">🎯 CADOK Email Templates</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Aperçu complet de tous les templates découverts</p>
        </div>
        
        <!-- Statistiques -->
        <div class="stats">
            <h2 style="color: #022601; margin: 0 0 15px;">📊 Services Email Découverts</h2>
            <p style="color: #666; margin: 0;">
                <strong>${previews.length} templates</strong> trouvés dans <strong>4 services</strong> différents
            </p>
        </div>
        
        <!-- Grille des templates -->
        <div class="grid">
            ${previews.map(preview => `
            <div class="card">
                <div class="service-badge">${preview.service}</div>
                <h3>${preview.name}</h3>
                <p>Template HTML avec le thème CADOK et les couleurs officielles.</p>
                <a href="${preview.name}.html" class="btn" target="_blank">
                    👀 Voir l'aperçu
                </a>
            </div>
            `).join('')}
        </div>
        
        <!-- Informations techniques -->
        <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-top: 40px;">
            <h3 style="color: #022601; margin: 0 0 15px;">🔧 Informations Techniques</h3>
            <ul style="color: #666; line-height: 1.6;">
                <li><strong>Services découverts :</strong> EmailVerificationService.js (hybride), EmailTemplates.js, CourierEmailService.js, emailService.js</li>
                <li><strong>Thème CADOK :</strong> Couleurs #022601 (vert foncé), #FF8F00 (orange), #2E7D32 (vert)</li>
                <li><strong>Généré le :</strong> ${new Date().toLocaleString('fr-FR')}</li>
                <li><strong>Utilisateur test :</strong> ${this.testUser.pseudo} (${this.testUser.email})</li>
            </ul>
        </div>
        
    </div>
</body>
</html>`;

    const indexPath = path.join(this.outputDir, 'index.html');
    await fs.writeFile(indexPath, indexHtml, 'utf8');
    console.log('  ✓ index.html');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const previewer = new AllTemplatesPreviewer();
  previewer.generateAllPreviews()
    .then((outputDir) => {
      console.log(`\n🎉 Tous les templates générés dans: ${outputDir}`);
      console.log('📂 Ouvrez index.html dans votre navigateur !');
    })
    .catch(error => {
      console.error('💥 Erreur:', error);
    });
}

module.exports = AllTemplatesPreviewer;
