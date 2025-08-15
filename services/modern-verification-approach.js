/**
 * APPROCHE MODERNE DE VÉRIFICATION - RECOMMANDATION
 * =================================================
 * 
 * Au lieu de 5 pages séparées, voici l'approche moderne recommandée
 */

// OPTION 1: SPA avec états (RECOMMANDÉ)
// =====================================

class ModernVerification {
  constructor() {
    this.currentStep = 'email'; // 'email' | 'sms' | 'success' | 'error' | 'pending'
    this.container = document.getElementById('verification-container');
  }

  render() {
    const content = this.getContentForStep(this.currentStep);
    this.container.innerHTML = content;
    this.attachEventListeners();
  }

  getContentForStep(step) {
    const templates = {
      email: `
        <div class="verification-step" data-step="email">
          <h2>Vérifiez votre email</h2>
          <input type="text" id="emailCode" placeholder="Code 6 chiffres">
          <button onclick="verification.verifyEmail()">Vérifier</button>
        </div>
      `,
      
      sms: `
        <div class="verification-step" data-step="sms">
          <h2>Vérifiez votre SMS</h2>
          <input type="text" id="smsCode" placeholder="Code 6 chiffres">
          <button onclick="verification.verifySMS()">Vérifier</button>
        </div>
      `,
      
      success: `
        <div class="verification-step success" data-step="success">
          <div class="success-icon">✅</div>
          <h2>Vérification réussie !</h2>
          <button onclick="verification.goToDashboard()">Continuer</button>
        </div>
      `,
      
      error: `
        <div class="verification-step error" data-step="error">
          <div class="error-icon">❌</div>
          <h2>Erreur de vérification</h2>
          <button onclick="verification.retry()">Réessayer</button>
        </div>
      `,
      
      pending: `
        <div class="verification-step pending" data-step="pending">
          <div class="spinner"></div>
          <h2>Vérification en cours...</h2>
          <p>Veuillez patienter</p>
        </div>
      `
    };
    
    return templates[step] || templates.error;
  }

  async verifyEmail() {
    this.showPending();
    
    try {
      const code = document.getElementById('emailCode').value;
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (response.ok) {
        this.showStep('sms'); // Passer au SMS
      } else {
        this.showError('Code email incorrect');
      }
    } catch (error) {
      this.showError('Erreur réseau');
    }
  }

  showStep(step) {
    this.currentStep = step;
    this.render();
  }

  showPending() {
    this.showStep('pending');
  }

  showError(message) {
    this.currentStep = 'error';
    this.errorMessage = message;
    this.render();
  }
}

// OPTION 2: Modal/Overlay (TRÈS POPULAIRE)
// =========================================

class ModalVerification {
  constructor() {
    this.modal = document.getElementById('verification-modal');
    this.currentContent = 'email';
  }

  show(type = 'email') {
    this.currentContent = type;
    this.modal.style.display = 'flex';
    this.updateContent();
  }

  hide() {
    this.modal.style.display = 'none';
  }

  updateContent() {
    const modalBody = this.modal.querySelector('.modal-body');
    modalBody.innerHTML = this.getContentForType(this.currentContent);
  }

  getContentForType(type) {
    // Même principe que SPA mais dans une modale
    return `<div class="modal-verification-${type}">...</div>`;
  }
}

// OPTION 3: Progressive Enhancement (HYBRIDE)
// ===========================================

class ProgressiveVerification {
  constructor() {
    // Commence avec du HTML statique
    // Améliore avec JavaScript si disponible
    this.enhanceWithJS();
  }

  enhanceWithJS() {
    // Transformer les pages statiques en SPA
    const links = document.querySelectorAll('a[href^="/verification/"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadPageAjax(link.href);
      });
    });
  }

  async loadPageAjax(url) {
    // Charger le contenu en AJAX au lieu de naviguer
    const response = await fetch(url);
    const html = await response.text();
    
    // Extraire juste le contenu de la carte
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('.verification-card');
    
    // Remplacer le contenu actuel
    document.querySelector('.verification-card').replaceWith(newContent);
    
    // Mettre à jour l'URL sans rechargement
    history.pushState(null, '', url);
  }
}

// RECOMMANDATION FINALE
// =====================

console.log(`
🎯 RECOMMANDATION POUR KADOC:

1. GARDER une page principale /verification
2. UTILISER JavaScript pour changer le contenu
3. FALLBACK vers pages séparées si JS désactivé
4. URLs propres pour le SEO: /verification#email, /verification#sms

AVANTAGES:
✅ Expérience utilisateur fluide
✅ Pas de rechargements de page
✅ SEO-friendly avec les URLs
✅ Accessible même sans JavaScript
✅ Plus moderne et responsive

EXEMPLE D'IMPLÉMENTATION:
- 1 page HTML principale
- JavaScript pour les transitions
- CSS pour les animations
- API REST pour la vérification
`);

module.exports = {
  ModernVerification,
  ModalVerification,
  ProgressiveVerification
};
