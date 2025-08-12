# 🎨 COURIER + TEMPLATES HTML PERSONNALISÉS - GUIDE COMPLET

## 📋 **VOTRE SITUATION ACTUELLE**

Votre code utilise déjà la **bonne approche** ! Vos templates HTML personnalisés sont envoyés directement via l'API Courier, **sans utiliser l'éditeur Courier**.

---

## ⚡ **MÉTHODE 1 : ENVOI HTML DIRECT (ACTUEL)**

### **Comment ça fonctionne**

```javascript
// Votre code actuel dans CourierEmailService.js
async sendEmail({ to, subject, html, templateId = null, templateData = {} }) {
  const message = {
    to: { email: to },
    from: {
      name: process.env.EMAIL_FROM_NAME,
      email: process.env.EMAIL_FROM_ADDRESS
    }
  };

  if (templateId) {
    // Utiliser un template Courier (optionnel)
    message.template = templateId;
    message.data = templateData;
  } else {
    // ✅ EMAIL HTML PERSONNALISÉ (votre cas)
    message.content = {
      title: subject,
      body: html  // ← VOS TEMPLATES HTML SONT UTILISÉS ICI
    };
  }

  const response = await this.courier.send(message);
  return { success: true, messageId: response.messageId };
}
```

### **Vos templates sont bien utilisés** ✅

```javascript
// Dans sendVerificationEmail()
const htmlContent = EmailTemplates.getVerificationTemplate(
  userName, 
  verificationCode, 
  verificationUrl, 
  email
);

return this.sendEmail({
  to: email,
  subject: '🎉 Bienvenue sur KADOC - Vérifiez votre compte',
  html: htmlContent,  // ← VOTRE HTML PERSONNALISÉ
  text: textContent
});
```

---

## 🔧 **OPTIMISATION : MEILLEUR SUPPORT TEXT/HTML**

Améliorons votre service pour supporter à la fois HTML et texte :

```javascript
// Méthode améliorée
async sendEmail({ to, subject, html, text = null, templateId = null, templateData = {} }) {
  try {
    const message = {
      to: { email: to },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'KADOC',
        email: process.env.EMAIL_FROM_ADDRESS || 'noreply@kadoc.com'
      }
    };

    if (templateId) {
      // Utiliser template Courier
      message.template = templateId;
      message.data = templateData;
    } else {
      // Utiliser vos templates HTML personnalisés
      message.content = {
        title: subject,
        body: html
      };

      // Ajouter version texte si fournie
      if (text) {
        message.content.text = text;
      }
    }

    const response = await this.courier.send(message);
    
    console.log('✅ Email envoyé via Courier:', {
      to,
      subject,
      messageId: response.messageId,
      method: templateId ? 'Template Courier' : 'HTML personnalisé'
    });

    return { 
      success: true, 
      messageId: response.messageId,
      method: templateId ? 'courier-template' : 'custom-html'
    };

  } catch (error) {
    console.error('❌ Erreur Courier:', error);
    throw error;
  }
}
```

---

## 🎭 **MÉTHODE 2 : TEMPLATES COURIER (OPTIONNELLE)**

Si vous voulez **aussi** utiliser l'éditeur Courier pour certains emails :

### **Étape 1 : Créer templates dans Courier**

1. **Dashboard Courier** → **"Templates"**
2. **"Create Template"** → **"Email"**
3. **Designer visuel** → Créer votre template
4. **Récupérer l'ID** du template (ex: `VERIFICATION_TEMPLATE_123`)

### **Étape 2 : Configuration .env**

```bash
# Templates Courier (optionnels)
COURIER_TEMPLATE_VERIFICATION=VERIFICATION_TEMPLATE_123
COURIER_TEMPLATE_PASSWORD_RESET=PASSWORD_RESET_456
COURIER_TEMPLATE_WELCOME=WELCOME_TEMPLATE_789
```

### **Étape 3 : Usage hybride**

```javascript
// Utiliser template Courier
await emailService.sendEmail({
  to: 'user@example.com',
  templateId: process.env.COURIER_TEMPLATE_VERIFICATION,
  templateData: {
    userName: 'Jean',
    verificationCode: 'ABC123',
    verificationUrl: 'https://kadoc.com/verify'
  }
});

// OU utiliser vos templates HTML (actuel)
await emailService.sendVerificationEmail('user@example.com', 'ABC123', 'Jean');
```

---

## 🚀 **MISE À JOUR APPLIQUÉE**

Votre service `CourierEmailService.js` a été amélioré avec :

### **✅ Nouvelles fonctionnalités**

1. **Support HTML + Texte** : Meilleure délivrabilité
2. **Gestion d'erreurs améliorée** : Retour success/error
3. **Logs détaillés** : Suivi des envois
4. **Méthodes hybrides** : HTML personnalisé OU templates Courier

### **📧 Méthodes disponibles**

```javascript
const emailService = require('./services/CourierEmailService');

// 1. VOS TEMPLATES HTML (Recommandé - Déjà fonctionnel)
await emailService.sendVerificationEmail('user@example.com', 'ABC123', 'Jean');
await emailService.sendPasswordResetEmail('user@example.com', 'TOKEN456', 'Jean');
await emailService.sendWelcomeEmail('user@example.com', 'Jean');

// 2. NOTIFICATIONS SIMPLES (Nouveau)
await emailService.sendNotificationEmail(
  'user@example.com',
  'Échange confirmé',
  'Votre proposition a été acceptée !',
  'Voir l\'échange',
  'https://kadoc.com/exchange/123'
);

// 3. TEMPLATES COURIER (Optionnel - Si vous les créez)
await emailService.sendEmailWithCourierTemplate(
  'VERIFICATION_TEMPLATE_ID',
  'user@example.com',
  { userName: 'Jean', code: 'ABC123' }
);
```

---

## 🎯 **RÉSUMÉ : VOS TEMPLATES SONT UTILISÉS !**

### **✅ CE QUI FONCTIONNE DÉJÀ**

1. **Vos designs HTML** sont envoyés via Courier API
2. **Templates professionnels** préservés (EmailTemplates.js)
3. **Aucune configuration Courier UI** nécessaire
4. **Contrôle total** sur le rendu

### **⚡ MÉTHODES D'ENVOI**

| Méthode | Description | Avantage |
|---------|-------------|----------|
| **HTML Personnalisé** | Vos templates `.js` → Courier API | 🎨 Design contrôlé, 🚀 Prêt |
| **Templates Courier** | Interface Courier → API | 🔧 Éditeur visuel, 📊 A/B test |
| **Hybride** | Les deux selon l'email | 🎯 Flexibilité maximale |

### **🧪 TESTER VOS TEMPLATES**

```bash
# Tester tous vos templates HTML
node demo-email-methods.js

# Vérifier configuration
node check-courier-config.js
```

---

## 🎨 **TEMPLATES COURIER (OPTIONNEL)**

Si vous voulez **aussi** utiliser l'éditeur Courier :

### **Avantages des templates Courier**
- 🎨 **Éditeur drag & drop** visuel
- 📊 **A/B testing** intégré  
- 🔄 **Modifications sans code**
- 📈 **Analytics avancés**
- 👥 **Collaboration équipe**

### **Quand les utiliser**
- ✅ **Emails marketing** (newsletters)
- ✅ **Tests A/B** de contenu
- ✅ **Modifications fréquentes**
- ✅ **Équipe non-technique**

### **Quand garder vos templates HTML**
- ✅ **Emails transactionnels** (vérification, reset)
- ✅ **Design très spécifique**
- ✅ **Contrôle total requis**
- ✅ **Intégration avec votre code**

---

## 🏆 **RECOMMANDATION FINALE**

### **Configuration idéale pour KADOC** :

1. **Templates HTML personnalisés** (vos créations) pour :
   - 📧 Vérification email
   - 🔐 Reset mot de passe  
   - 🎉 Bienvenue
   - 🔔 Notifications importantes

2. **Templates Courier** (optionnel) pour :
   - 📰 Newsletters  
   - 🎁 Promotions
   - 📊 Emails marketing
   - 🧪 Tests A/B

### **Votre système actuel est PARFAIT** ! ✅

- 🎨 Designs magnifiques via HTML
- 🚀 10k emails/mois gratuits
- 📊 Analytics Courier
- 🔧 Code maintenable

**Pas besoin de configurer les templates Courier pour commencer ! Vos templates HTML sont déjà opérationnels ! 🎯**
