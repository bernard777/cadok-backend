/**
 * PAGES DE VÉRIFICATION KADOC - THÈME UNIFIÉ
 * ==========================================
 * 
 * Générateur de pages de vérification avec le design KADOC
 * - Vérification email
 * - Vérification SMS
 * - Pages de succès/erreur
 */

const fs = require('fs').promises;
const path = require('path');

class KadocVerificationPages {

  constructor() {
    this.outputDir = path.join(__dirname, '..', 'public', 'verification');
    this.colors = {
      primary: '#022601',
      secondary: '#2E7D32', 
      accent: '#FF8F00',
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      background: '#f8f9fa',
      white: '#ffffff',
      dark: '#212529',
      muted: '#6c757d'
    };
  }

  /**
   * CSS de base KADOC
   */
  getBaseCSS() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%);
        min-height: 100vh;
        color: ${this.colors.dark};
        line-height: 1.6;
      }
      
      .container {
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .verification-card {
        background: ${this.colors.white};
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        padding: 40px;
        text-align: center;
        width: 100%;
        position: relative;
        overflow: hidden;
      }
      
      .verification-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, ${this.colors.accent} 0%, ${this.colors.secondary} 100%);
      }
      
      .logo {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%);
        border-radius: 50%;
        margin: 0 auto 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        color: ${this.colors.white};
        box-shadow: 0 8px 24px rgba(2, 38, 1, 0.3);
      }
      
      .title {
        font-size: 28px;
        font-weight: 700;
        color: ${this.colors.primary};
        margin-bottom: 12px;
      }
      
      .subtitle {
        font-size: 16px;
        color: ${this.colors.muted};
        margin-bottom: 30px;
      }
      
      .verification-form {
        margin-bottom: 30px;
      }
      
      .input-group {
        margin-bottom: 20px;
      }
      
      .input-label {
        display: block;
        font-weight: 600;
        color: ${this.colors.dark};
        margin-bottom: 8px;
        text-align: left;
      }
      
      .input-field {
        width: 100%;
        padding: 16px;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        font-size: 16px;
        transition: all 0.3s ease;
        text-align: center;
        letter-spacing: 2px;
        font-weight: 600;
      }
      
      .input-field:focus {
        outline: none;
        border-color: ${this.colors.accent};
        box-shadow: 0 0 0 4px rgba(255, 143, 0, 0.1);
      }
      
      .btn {
        background: linear-gradient(135deg, ${this.colors.accent} 0%, #F57C00 100%);
        color: ${this.colors.white};
        border: none;
        padding: 16px 32px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        margin: 8px;
        min-width: 160px;
      }
      
      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 143, 0, 0.3);
      }
      
      .btn-secondary {
        background: transparent;
        color: ${this.colors.muted};
        border: 2px solid #e9ecef;
      }
      
      .btn-secondary:hover {
        background: ${this.colors.background};
        border-color: ${this.colors.muted};
      }
      
      .status-icon {
        width: 100px;
        height: 100px;
        margin: 0 auto 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
      }
      
      .status-success {
        background: linear-gradient(135deg, ${this.colors.success} 0%, #34ce57 100%);
        color: ${this.colors.white};
      }
      
      .status-error {
        background: linear-gradient(135deg, ${this.colors.error} 0%, #e74c3c 100%);
        color: ${this.colors.white};
      }
      
      .status-warning {
        background: linear-gradient(135deg, ${this.colors.warning} 0%, #f39c12 100%);
        color: ${this.colors.white};
      }
      
      .message {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      
      .code-display {
        background: ${this.colors.background};
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        font-family: 'Courier New', monospace;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 4px;
        color: ${this.colors.primary};
      }
      
      .info-box {
        background: rgba(255, 143, 0, 0.1);
        border: 1px solid rgba(255, 143, 0, 0.3);
        border-radius: 12px;
        padding: 16px;
        margin: 20px 0;
        color: ${this.colors.dark};
      }
      
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
        font-size: 14px;
        color: ${this.colors.muted};
      }
      
      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid ${this.colors.accent};
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .fade-in {
        animation: fadeIn 0.6s ease-in;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @media (max-width: 576px) {
        .container {
          padding: 16px;
        }
        
        .verification-card {
          padding: 24px;
        }
        
        .title {
          font-size: 24px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          font-size: 24px;
        }
      }
    `;
  }

  /**
   * Page de vérification email
   */
  generateEmailVerificationPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification Email - KADOC</title>
    <style>${this.getBaseCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="verification-card fade-in">
            <div class="logo">K</div>
            
            <h1 class="title">Vérifiez votre email</h1>
            <p class="subtitle">Entrez le code de vérification envoyé à votre adresse email</p>
            
            <form class="verification-form" id="emailVerificationForm">
                <div class="input-group">
                    <label class="input-label">Code de vérification (6 chiffres)</label>
                    <input type="text" class="input-field" id="emailCode" maxlength="6" 
                           placeholder="123456" autocomplete="one-time-code">
                </div>
                
                <button type="submit" class="btn">Vérifier mon email</button>
                <button type="button" class="btn btn-secondary" id="resendEmailBtn">
                    Renvoyer le code
                </button>
            </form>
            
            <div class="info-box">
                <strong>💡 Conseil :</strong> Vérifiez votre dossier spam si vous ne recevez pas l'email dans les 2 minutes.
            </div>
            
            <div class="footer">
                <p>© 2025 KADOC - Votre marketplace de troc local</p>
                <p>Besoin d'aide ? <a href="mailto:support@kadoc.com">Contactez-nous</a></p>
            </div>
        </div>
    </div>

    <script>
        // Gestion du formulaire de vérification email
        document.getElementById('emailVerificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const code = document.getElementById('emailCode').value;
            const btn = e.target.querySelector('button[type="submit"]');
            
            if (code.length !== 6) {
                alert('Le code doit contenir 6 chiffres');
                return;
            }
            
            // Animation de chargement
            btn.innerHTML = '<div class="spinner"></div>Vérification...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: code,
                        email: new URLSearchParams(window.location.search).get('email')
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    window.location.href = '/verification/success?type=email';
                } else {
                    throw new Error(data.message || 'Erreur de vérification');
                }
                
            } catch (error) {
                alert('Erreur: ' + error.message);
                btn.innerHTML = 'Vérifier mon email';
                btn.disabled = false;
            }
        });
        
        // Renvoyer le code
        document.getElementById('resendEmailBtn').addEventListener('click', async () => {
            const btn = document.getElementById('resendEmailBtn');
            const email = new URLSearchParams(window.location.search).get('email');
            
            btn.innerHTML = 'Envoi en cours...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });
                
                if (response.ok) {
                    alert('Code renvoyé avec succès !');
                } else {
                    throw new Error('Erreur lors du renvoi');
                }
                
            } catch (error) {
                alert('Erreur: ' + error.message);
            }
            
            btn.innerHTML = 'Renvoyer le code';
            btn.disabled = false;
        });
        
        // Auto-focus sur le champ de code
        document.getElementById('emailCode').focus();
        
        // Format automatique du code (espacement)
        document.getElementById('emailCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\\D/g, '').substring(0, 6);
        });
    </script>
</body>
</html>`;
  }

  /**
   * Page de vérification SMS
   */
  generateSMSVerificationPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification SMS - KADOC</title>
    <style>${this.getBaseCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="verification-card fade-in">
            <div class="logo">K</div>
            
            <h1 class="title">Vérifiez votre téléphone</h1>
            <p class="subtitle">Entrez le code de vérification envoyé par SMS</p>
            
            <div class="code-display" id="phoneDisplay">
                +** **** ****
            </div>
            
            <form class="verification-form" id="smsVerificationForm">
                <div class="input-group">
                    <label class="input-label">Code SMS (6 chiffres)</label>
                    <input type="text" class="input-field" id="smsCode" maxlength="6" 
                           placeholder="123456" autocomplete="one-time-code">
                </div>
                
                <button type="submit" class="btn">Vérifier mon téléphone</button>
                <button type="button" class="btn btn-secondary" id="resendSMSBtn">
                    Renvoyer le SMS
                </button>
            </form>
            
            <div class="info-box">
                <strong>📱 Note :</strong> La réception du SMS peut prendre jusqu'à 2 minutes selon votre opérateur.
            </div>
            
            <div class="footer">
                <p>© 2025 KADOC - Votre marketplace de troc local</p>
                <p>Problème avec le SMS ? <a href="mailto:support@kadoc.com">Contactez-nous</a></p>
            </div>
        </div>
    </div>

    <script>
        // Afficher le numéro masqué
        const phone = new URLSearchParams(window.location.search).get('phone');
        if (phone) {
            const masked = phone.replace(/(.{3}).*(.{4})/, '$1****$2');
            document.getElementById('phoneDisplay').textContent = masked;
        }
        
        // Gestion du formulaire de vérification SMS
        document.getElementById('smsVerificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const code = document.getElementById('smsCode').value;
            const btn = e.target.querySelector('button[type="submit"]');
            
            if (code.length !== 6) {
                alert('Le code doit contenir 6 chiffres');
                return;
            }
            
            btn.innerHTML = '<div class="spinner"></div>Vérification...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/verify-sms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: code,
                        phone: phone
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    window.location.href = '/verification/success?type=sms';
                } else {
                    throw new Error(data.message || 'Erreur de vérification');
                }
                
            } catch (error) {
                alert('Erreur: ' + error.message);
                btn.innerHTML = 'Vérifier mon téléphone';
                btn.disabled = false;
            }
        });
        
        // Renvoyer le SMS
        document.getElementById('resendSMSBtn').addEventListener('click', async () => {
            const btn = document.getElementById('resendSMSBtn');
            
            btn.innerHTML = 'Envoi en cours...';
            btn.disabled = true;
            
            try {
                const response = await fetch('/api/auth/resend-sms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phone })
                });
                
                if (response.ok) {
                    alert('SMS renvoyé avec succès !');
                } else {
                    throw new Error('Erreur lors du renvoi');
                }
                
            } catch (error) {
                alert('Erreur: ' + error.message);
            }
            
            btn.innerHTML = 'Renvoyer le SMS';
            btn.disabled = false;
        });
        
        // Auto-focus et format
        document.getElementById('smsCode').focus();
        document.getElementById('smsCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\\D/g, '').substring(0, 6);
        });
    </script>
</body>
</html>`;
  }

  /**
   * Page de succès
   */
  generateSuccessPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification Réussie - KADOC</title>
    <style>${this.getBaseCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="verification-card fade-in">
            <div class="status-icon status-success">
                ✓
            </div>
            
            <h1 class="title">Vérification réussie !</h1>
            <p class="subtitle" id="successMessage">Votre compte a été vérifié avec succès</p>
            
            <div class="message">
                <p>🎉 Félicitations ! Votre vérification est terminée.</p>
                <p>Vous pouvez maintenant profiter pleinement de KADOC.</p>
            </div>
            
            <div class="verification-form">
                <a href="/login" class="btn">Se connecter</a>
                <a href="/dashboard" class="btn btn-secondary">Tableau de bord</a>
            </div>
            
            <div class="info-box">
                <strong>🚀 Prochaines étapes :</strong><br>
                • Complétez votre profil<br>
                • Explorez les objets disponibles<br>
                • Proposez vos premiers trocs
            </div>
            
            <div class="footer">
                <p>© 2025 KADOC - Votre marketplace de troc local</p>
                <p>Bienvenue dans la communauté ! 🎊</p>
            </div>
        </div>
    </div>

    <script>
        // Personnaliser le message selon le type
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const messageEl = document.getElementById('successMessage');
        
        if (type === 'email') {
            messageEl.textContent = 'Votre adresse email a été vérifiée avec succès';
        } else if (type === 'sms') {
            messageEl.textContent = 'Votre numéro de téléphone a été vérifié avec succès';
        } else if (type === 'complete') {
            messageEl.textContent = 'Votre email et téléphone ont été vérifiés avec succès';
        }
        
        // Redirection automatique après 10 secondes
        setTimeout(() => {
            if (confirm('Voulez-vous être redirigé vers votre tableau de bord ?')) {
                window.location.href = '/dashboard';
            }
        }, 10000);
    </script>
</body>
</html>`;
  }

  /**
   * Page d'erreur
   */
  generateErrorPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erreur de Vérification - KADOC</title>
    <style>${this.getBaseCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="verification-card fade-in">
            <div class="status-icon status-error">
                ✗
            </div>
            
            <h1 class="title">Erreur de vérification</h1>
            <p class="subtitle" id="errorMessage">Une erreur s'est produite lors de la vérification</p>
            
            <div class="message">
                <p>😔 Nous n'avons pas pu vérifier votre compte.</p>
                <p>Veuillez réessayer ou contacter notre support.</p>
            </div>
            
            <div class="verification-form">
                <button onclick="history.back()" class="btn">Réessayer</button>
                <a href="/support" class="btn btn-secondary">Contacter le support</a>
            </div>
            
            <div class="info-box">
                <strong>🔧 Causes possibles :</strong><br>
                • Code expiré (validité : 15 minutes)<br>
                • Code incorrect saisi<br>
                • Problème de connexion réseau
            </div>
            
            <div class="footer">
                <p>© 2025 KADOC - Votre marketplace de troc local</p>
                <p>Notre équipe est là pour vous aider !</p>
            </div>
        </div>
    </div>

    <script>
        // Personnaliser le message d'erreur
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const messageEl = document.getElementById('errorMessage');
        
        if (error === 'expired') {
            messageEl.textContent = 'Le code de vérification a expiré';
        } else if (error === 'invalid') {
            messageEl.textContent = 'Code de vérification incorrect';
        } else if (error === 'network') {
            messageEl.textContent = 'Problème de connexion réseau';
        } else if (error === 'limit') {
            messageEl.textContent = 'Trop de tentatives. Réessayez dans 15 minutes';
        }
    </script>
</body>
</html>`;
  }

  /**
   * Page d'attente (en cours de vérification)
   */
  generatePendingPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification en cours - KADOC</title>
    <style>${this.getBaseCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="verification-card fade-in">
            <div class="status-icon status-warning">
                ⏳
            </div>
            
            <h1 class="title">Vérification en cours</h1>
            <p class="subtitle">Nous vérifions vos informations...</p>
            
            <div class="spinner"></div>
            
            <div class="message">
                <p>⌛ Veuillez patienter quelques instants.</p>
                <p>La vérification est en cours de traitement.</p>
            </div>
            
            <div class="info-box">
                <strong>🔄 Processus de vérification :</strong><br>
                • Validation des informations<br>
                • Vérification des codes<br>
                • Activation du compte
            </div>
            
            <div class="footer">
                <p>© 2025 KADOC - Votre marketplace de troc local</p>
                <p>Merci pour votre patience !</p>
            </div>
        </div>
    </div>

    <script>
        // Vérifier le statut toutes les 3 secondes
        setInterval(async () => {
            try {
                const response = await fetch('/api/auth/verification-status');
                const data = await response.json();
                
                if (data.verified) {
                    window.location.href = '/verification/success?type=complete';
                }
            } catch (error) {
                console.log('Vérification du statut...');
            }
        }, 3000);
        
        // Redirection de sécurité après 2 minutes
        setTimeout(() => {
            alert('La vérification prend plus de temps que prévu. Vous allez être redirigé.');
            window.location.href = '/verification/error?error=timeout';
        }, 120000);
    </script>
</body>
</html>`;
  }

  /**
   * Générer toutes les pages
   */
  async generateAllPages() {
    console.log('🎨 GÉNÉRATION PAGES VÉRIFICATION KADOC');
    console.log('=====================================\n');

    const pages = [
      { name: 'email.html', content: this.generateEmailVerificationPage(), desc: 'Vérification email' },
      { name: 'sms.html', content: this.generateSMSVerificationPage(), desc: 'Vérification SMS' },
      { name: 'success.html', content: this.generateSuccessPage(), desc: 'Page de succès' },
      { name: 'error.html', content: this.generateErrorPage(), desc: 'Page d\'erreur' },
      { name: 'pending.html', content: this.generatePendingPage(), desc: 'Page d\'attente' }
    ];

    try {
      // Créer le dossier si nécessaire
      await fs.mkdir(this.outputDir, { recursive: true });
      
      for (const page of pages) {
        const filePath = path.join(this.outputDir, page.name);
        await fs.writeFile(filePath, page.content, 'utf8');
        console.log(`✅ ${page.desc}: ${page.name}`);
      }
      
      // Créer aussi une page d'index
      const indexContent = this.generateIndexPage();
      await fs.writeFile(path.join(this.outputDir, 'index.html'), indexContent, 'utf8');
      console.log('✅ Page d\'index: index.html');
      
      console.log('\n🎉 TOUTES LES PAGES GÉNÉRÉES !');
      console.log('============================');
      console.log(`📁 Dossier: ${this.outputDir}`);
      console.log(`🌐 Accès: http://localhost:5000/verification/`);
      console.log('🎨 Design: Thème KADOC unifié');
      console.log('📱 Responsive: Compatible mobile');
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur génération:', error.message);
      return false;
    }
  }

  /**
   * Page d'index pour tester
   */
  generateIndexPage() {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pages de Vérification - KADOC</title>
    <style>${this.getBaseCSS()}</style>
</head>
<body>
    <div class="container">
        <div class="verification-card fade-in">
            <div class="logo">K</div>
            
            <h1 class="title">Pages de Vérification KADOC</h1>
            <p class="subtitle">Aperçu des pages de vérification avec thème unifié</p>
            
            <div class="verification-form">
                <h3>📧 Vérification Email</h3>
                <a href="email.html?email=test@example.com" class="btn">Voir page email</a>
                
                <h3>📱 Vérification SMS</h3>
                <a href="sms.html?phone=+33123456789" class="btn">Voir page SMS</a>
                
                <h3>✅ Page de Succès</h3>
                <a href="success.html?type=complete" class="btn">Voir succès</a>
                
                <h3>❌ Page d'Erreur</h3>
                <a href="error.html?error=expired" class="btn btn-secondary">Voir erreur</a>
                
                <h3>⏳ Page d'Attente</h3>
                <a href="pending.html" class="btn btn-secondary">Voir attente</a>
            </div>
            
            <div class="info-box">
                <strong>🎨 Caractéristiques :</strong><br>
                • Design unifié avec l'app KADOC<br>
                • Couleurs officielles (#022601, #2E7D32, #FF8F00)<br>
                • Responsive mobile<br>
                • Animations et transitions<br>
                • Validation en temps réel
            </div>
            
            <div class="footer">
                <p>© 2025 KADOC - Pages de vérification thème unifié</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

// Exécution si script principal
if (require.main === module) {
  const generator = new KadocVerificationPages();
  generator.generateAllPages().catch(console.error);
}

module.exports = KadocVerificationPages;
