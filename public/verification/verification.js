/**
 * SYSTÈME DE VÉRIFICATION MODERNE KADOC
 * =====================================
 * 
 * JavaScript pour la gestion d'une page de vérification SPA moderne
 * - Transitions fluides entre les étapes
 * - Validation en temps réel
 * - Gestion des timers
 * - Intégration API
 */

class KadocVerification {
  constructor() {
    this.currentStep = 'email';
    this.steps = ['email', 'sms', 'success', 'error', 'pending'];
    this.progress = { email: 33, sms: 66, success: 100, error: 0, pending: 50 };
    
    // Données de session
    this.userData = this.getUserDataFromURL();
    this.timers = {};
    this.attempts = { email: 0, sms: 0 };
    this.maxAttempts = 5;
    
    this.init();
  }

  init() {
    console.log('🚀 KADOC Verification System - Initialisation');
    
    // Configuration initiale
    this.setupEventListeners();
    this.setupKeyboardHandlers();
    this.displayUserData();
    this.startTimer('email');
    
    // Auto-focus sur le premier champ
    setTimeout(() => {
      const firstInput = document.getElementById('emailCode');
      if (firstInput) firstInput.focus();
    }, 500);
    
    console.log('✅ Système initialisé - Étape:', this.currentStep);
  }

  /**
   * Récupération des données utilisateur depuis l'URL
   */
  getUserDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1);
    
    return {
      email: urlParams.get('email') || 'votre adresse email',
      phone: urlParams.get('phone') || '+** **** ****',
      step: hash || 'email',
      userId: urlParams.get('userId') || null,
      token: urlParams.get('token') || null
    };
  }

  /**
   * Configuration des event listeners
   */
  setupEventListeners() {
    // Boutons de vérification
    document.getElementById('verifyEmailBtn')?.addEventListener('click', () => this.verifyEmail());
    document.getElementById('verifySmsBtn')?.addEventListener('click', () => this.verifySMS());
    
    // Boutons de renvoi
    document.getElementById('resendEmailBtn')?.addEventListener('click', () => this.resendEmail());
    document.getElementById('resendSmsBtn')?.addEventListener('click', () => this.resendSMS());
    
    // Bouton de retry
    document.getElementById('retryBtn')?.addEventListener('click', () => this.retry());
    
    // Inputs avec validation temps réel
    document.getElementById('emailCode')?.addEventListener('input', (e) => this.handleCodeInput(e, 'email'));
    document.getElementById('smsCode')?.addEventListener('input', (e) => this.handleCodeInput(e, 'sms'));
    
    // Navigation par hash
    window.addEventListener('hashchange', () => this.handleHashChange());
    
    // Prevent form submission
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleEnterKey();
      }
    });
  }

  /**
   * Gestion des raccourcis clavier
   */
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // ESC pour revenir en arrière
      if (e.key === 'Escape') {
        this.goToPreviousStep();
      }
      
      // Ctrl+R pour renvoyer le code
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (this.currentStep === 'email') this.resendEmail();
        if (this.currentStep === 'sms') this.resendSMS();
      }
    });
  }

  /**
   * Affichage des données utilisateur
   */
  displayUserData() {
    // Email dans le texte
    const emailElement = document.getElementById('emailAddress');
    if (emailElement && this.userData.email !== 'votre adresse email') {
      emailElement.textContent = this.userData.email;
    }
    
    // Téléphone masqué
    const phoneElement = document.getElementById('phoneDisplay');
    if (phoneElement && this.userData.phone !== '+** **** ****') {
      const masked = this.maskPhone(this.userData.phone);
      phoneElement.textContent = masked;
    }
    
    // Navigation directe selon l'URL
    if (this.userData.step && this.userData.step !== 'email') {
      setTimeout(() => {
        this.showStep(this.userData.step);
      }, 300);
    }
  }

  /**
   * Masquage du numéro de téléphone
   */
  maskPhone(phone) {
    if (phone.length < 8) return phone;
    return phone.replace(/(.{3}).*(.{4})/, '$1****$2');
  }

  /**
   * Gestion des inputs de code
   */
  handleCodeInput(event, type) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Garder uniquement les chiffres
    
    // Limiter à 6 chiffres
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    
    input.value = value;
    
    // Supprimer la classe d'erreur si présente
    input.classList.remove('error');
    
    // Auto-submit si 6 chiffres
    if (value.length === 6) {
      setTimeout(() => {
        if (type === 'email') this.verifyEmail();
        if (type === 'sms') this.verifySMS();
      }, 300);
    }
  }

  /**
   * Gestion de la touche Entrée
   */
  handleEnterKey() {
    if (this.currentStep === 'email') {
      this.verifyEmail();
    } else if (this.currentStep === 'sms') {
      this.verifySMS();
    } else if (this.currentStep === 'error') {
      this.retry();
    }
  }

  /**
   * Vérification du code email
   */
  async verifyEmail() {
    const codeInput = document.getElementById('emailCode');
    const code = codeInput.value.trim();
    const btn = document.getElementById('verifyEmailBtn');
    
    if (!code || code.length !== 6) {
      this.showInputError(codeInput, 'Le code doit contenir 6 chiffres');
      return;
    }
    
    if (this.attempts.email >= this.maxAttempts) {
      this.showError('Trop de tentatives. Veuillez patienter 15 minutes.');
      return;
    }
    
    this.attempts.email++;
    this.setButtonLoading(btn, true);
    this.showStep('pending');
    
    try {
      const response = await this.apiCall('/api/auth/verify-email', {
        email: this.userData.email,
        code: code,
        userId: this.userData.userId,
        token: this.userData.token
      });
      
      if (response.success) {
        console.log('✅ Email vérifié avec succès');
        this.stopTimer('email');
        this.showStep('sms');
        this.startTimer('sms');
        this.updateURL('sms');
      } else {
        throw new Error(response.message || 'Code incorrect');
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification email:', error.message);
      this.showError(`Erreur: ${error.message}`);
      this.attempts.email--;
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  /**
   * Vérification du code SMS
   */
  async verifySMS() {
    const codeInput = document.getElementById('smsCode');
    const code = codeInput.value.trim();
    const btn = document.getElementById('verifySmsBtn');
    
    if (!code || code.length !== 6) {
      this.showInputError(codeInput, 'Le code doit contenir 6 chiffres');
      return;
    }
    
    if (this.attempts.sms >= this.maxAttempts) {
      this.showError('Trop de tentatives. Veuillez patienter 15 minutes.');
      return;
    }
    
    this.attempts.sms++;
    this.setButtonLoading(btn, true);
    this.showStep('pending');
    
    try {
      const response = await this.apiCall('/api/auth/verify-sms', {
        phone: this.userData.phone,
        code: code,
        userId: this.userData.userId,
        token: this.userData.token
      });
      
      if (response.success) {
        console.log('✅ SMS vérifié avec succès');
        this.stopTimer('sms');
        this.showSuccess('Votre téléphone a été vérifié avec succès');
        this.updateURL('success');
      } else {
        throw new Error(response.message || 'Code incorrect');
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification SMS:', error.message);
      this.showError(`Erreur: ${error.message}`);
      this.attempts.sms--;
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  /**
   * Renvoyer le code email
   */
  async resendEmail() {
    const btn = document.getElementById('resendEmailBtn');
    this.setButtonLoading(btn, true, 'Envoi en cours...');
    
    try {
      const response = await this.apiCall('/api/auth/resend-verification', {
        email: this.userData.email,
        userId: this.userData.userId
      });
      
      if (response.success) {
        this.showToast('✅ Code renvoyé avec succès !', 'success');
        this.startTimer('email', true); // Reset timer
      } else {
        throw new Error(response.message || 'Erreur lors du renvoi');
      }
      
    } catch (error) {
      this.showToast(`❌ Erreur: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(btn, false, 'Renvoyer le code');
    }
  }

  /**
   * Renvoyer le code SMS
   */
  async resendSMS() {
    const btn = document.getElementById('resendSmsBtn');
    this.setButtonLoading(btn, true, 'Envoi en cours...');
    
    try {
      const response = await this.apiCall('/api/auth/resend-sms', {
        phone: this.userData.phone,
        userId: this.userData.userId
      });
      
      if (response.success) {
        this.showToast('✅ SMS renvoyé avec succès !', 'success');
        this.startTimer('sms', true); // Reset timer
      } else {
        throw new Error(response.message || 'Erreur lors du renvoi');
      }
      
    } catch (error) {
      this.showToast(`❌ Erreur: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(btn, false, 'Renvoyer le SMS');
    }
  }

  /**
   * Appel API générique
   */
  async apiCall(endpoint, data) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP Error ${response.status}`);
    }
    
    return result;
  }

  /**
   * Affichage des étapes
   */
  showStep(stepName) {
    if (!this.steps.includes(stepName)) {
      console.error('❌ Étape inconnue:', stepName);
      return;
    }
    
    // Masquer toutes les étapes
    this.steps.forEach(step => {
      const element = document.getElementById(`${step}Step`);
      if (element) {
        element.classList.remove('active');
      }
    });
    
    // Afficher l'étape demandée
    const targetElement = document.getElementById(`${stepName}Step`);
    if (targetElement) {
      targetElement.classList.add('active');
      this.currentStep = stepName;
      
      // Mettre à jour la barre de progression
      this.updateProgress(this.progress[stepName] || 0);
      
      // Auto-focus sur le champ approprié
      setTimeout(() => {
        const input = targetElement.querySelector('.verification-input');
        if (input) input.focus();
      }, 300);
      
      console.log('📍 Étape affichée:', stepName);
    }
  }

  /**
   * Mise à jour de la barre de progression
   */
  updateProgress(percentage) {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  }

  /**
   * Afficher le succès
   */
  showSuccess(message) {
    const messageElement = document.getElementById('successMessage');
    if (messageElement) {
      messageElement.textContent = message;
    }
    this.showStep('success');
  }

  /**
   * Afficher une erreur
   */
  showError(message) {
    const messageElement = document.getElementById('errorMessage');
    if (messageElement) {
      messageElement.textContent = message;
    }
    this.showStep('error');
  }

  /**
   * Réessayer
   */
  retry() {
    // Revenir à la première étape avec erreur
    if (this.attempts.email >= this.maxAttempts) {
      this.showStep('email');
    } else if (this.attempts.sms >= this.maxAttempts) {
      this.showStep('sms');
    } else {
      // Revenir à l'étape précédente
      this.showStep('email');
    }
  }

  /**
   * Gestion des erreurs d'input
   */
  showInputError(input, message) {
    input.classList.add('error');
    this.showToast(message, 'error');
    
    // Auto-focus et sélection
    input.focus();
    input.select();
    
    // Supprimer l'erreur après 3 secondes
    setTimeout(() => {
      input.classList.remove('error');
    }, 3000);
  }

  /**
   * Toast notifications
   */
  showToast(message, type = 'info') {
    // Créer l'élément toast s'il n'existe pas
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
      `;
      document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'success' ? 'var(--kadoc-success)' : type === 'error' ? 'var(--kadoc-error)' : 'var(--kadoc-primary)'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideInRight 0.3s ease-out;
      font-size: 14px;
      font-weight: 600;
    `;
    
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Supprimer après 4 secondes
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * État de chargement des boutons
   */
  setButtonLoading(btn, loading, text = null) {
    if (loading) {
      btn.disabled = true;
      btn.classList.add('loading');
      btn.originalText = btn.textContent;
      btn.innerHTML = '<div class="spinner"></div>' + (text || 'Vérification...');
    } else {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = text || btn.originalText || btn.textContent.replace('...', '');
    }
  }

  /**
   * Gestion des timers
   */
  startTimer(type, reset = false) {
    if (this.timers[type] && !reset) return;
    
    if (this.timers[type]) {
      clearInterval(this.timers[type]);
    }
    
    let timeLeft = 15 * 60; // 15 minutes en secondes
    const timerElement = document.getElementById(`${type}TimeLeft`);
    
    this.timers[type] = setInterval(() => {
      timeLeft--;
      
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (timerElement) {
        timerElement.textContent = display;
        
        // Changer la couleur selon le temps restant
        const timerContainer = timerElement.closest('.timer');
        if (timerContainer) {
          if (timeLeft < 60) {
            timerContainer.className = 'timer danger';
          } else if (timeLeft < 300) {
            timerContainer.className = 'timer warning';
          } else {
            timerContainer.className = 'timer';
          }
        }
      }
      
      if (timeLeft <= 0) {
        this.stopTimer(type);
        this.showError('Le code de vérification a expiré');
      }
    }, 1000);
  }

  stopTimer(type) {
    if (this.timers[type]) {
      clearInterval(this.timers[type]);
      delete this.timers[type];
    }
  }

  /**
   * Mise à jour de l'URL
   */
  updateURL(step) {
    const newURL = `${window.location.pathname}${window.location.search}#${step}`;
    history.pushState(null, '', newURL);
  }

  /**
   * Gestion du changement de hash
   */
  handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash && this.steps.includes(hash)) {
      this.showStep(hash);
    }
  }

  /**
   * Navigation vers l'étape précédente
   */
  goToPreviousStep() {
    const stepIndex = this.steps.indexOf(this.currentStep);
    if (stepIndex > 0) {
      this.showStep(this.steps[stepIndex - 1]);
    }
  }
}

// Ajout des animations CSS pour les toasts
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
  window.kadocVerification = new KadocVerification();
});

// Export pour utilisation modulaire
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KadocVerification;
}
