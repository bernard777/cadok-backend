# 🚀 GUIDE COMPLET : CONFIGURATION COURIER.COM POUR KADOC

## 📋 **ÉTAPE 1 : CRÉATION DU COMPTE COURIER**

### **1.1 Aller sur le site**
1. **Ouvrir** : https://www.courier.com/
2. **Cliquer** sur **"Get Started for Free"** (en haut à droite)

### **1.2 Inscription**
```
📧 Email : votre-email@gmail.com (ou votre domaine)
🔐 Mot de passe : Choisir un mot de passe sécurisé
👤 Prénom + Nom
🏢 Nom de l'entreprise : KADOC
📱 Téléphone : (optionnel)
```

### **1.3 Vérification email**
1. **Vérifier** votre boîte email
2. **Cliquer** sur le lien de confirmation
3. **Se connecter** à Courier

---

## 🔑 **ÉTAPE 2 : RÉCUPÉRATION DES CLÉS API**

### **2.1 Accéder aux API Keys**
1. **Se connecter** sur https://app.courier.com/
2. **Dans le menu de gauche** → Cliquer sur **"Settings"** ⚙️
3. **Puis** → **"API Keys"** 🔑

### **2.2 Copier votre clé API**
```
🔍 Vous verrez quelque chose comme :

┌─────────────────────────────────────────┐
│ Production                              │
│                                         │
│ Publishable Key                         │
│ pk_prod_XXXXXXXXXXXXXXXXXXXXXXXXXX     │  ← COPIER CETTE CLÉ
│                                         │
│ [Copy] [Regenerate]                     │
└─────────────────────────────────────────┘
```

### **2.3 Types de clés disponibles**
- **`pk_prod_...`** : Clé de production (recommandée)
- **`pk_test_...`** : Clé de test (pour développement)

---

## 💾 **ÉTAPE 3 : CONFIGURATION DANS VOTRE .ENV**

### **3.1 Ouvrir votre fichier .env**
```bash
# Dans : cadok-backend/.env
```

### **3.2 Remplacer la clé API**
```bash
# AVANT (placeholder)
COURIER_AUTH_TOKEN=pk_prod_VOTRE_TOKEN_COURIER_ICI

# APRÈS (votre vraie clé)
COURIER_AUTH_TOKEN=pk_prod_VOTRE_VRAIE_CLE_COPIEE_ICI
```

**⚠️ ATTENTION** : Remplacez `pk_prod_VOTRE_VRAIE_CLE_COPIEE_ICI` par la clé que vous avez copiée !

### **3.3 Exemple concret**
```bash
# Configuration Email - Courier.com
EMAIL_PROVIDER=courier
COURIER_AUTH_TOKEN=pk_prod_ABC123DEF456GHI789JKL012MNO345
EMAIL_FROM_NAME=KADOC - Plateforme de Troc
EMAIL_FROM_ADDRESS=noreply@kadoc.com
```

---

## 🧪 **ÉTAPE 4 : TEST DE CONFIGURATION**

### **4.1 Test simple**
```bash
# Dans votre terminal (cadok-backend/)
node test-courier-email.js
```

### **4.2 Résultat attendu**
```
📧 === TEST SYSTÈME EMAIL COURIER ===

🔧 1. Vérification configuration...
✅ Configuration détectée:
   🔑 Token: pk_prod_ABC123D...
   📧 From: noreply@kadoc.com
   👤 Name: KADOC - Plateforme de Troc

📦 2. Import du service email...
✅ Service Courier importé avec succès

📧 3. Test email de vérification...
   📤 Envoi vers: test@example.com
   🔐 Code: TEST123
✅ Email de vérification envoyé avec succès!
   📩 Message ID: 1-63f8a2b4-abc123def456
```

### **4.3 Si erreur d'authentification**
```
❌ Erreur: Status code: 401 - Unauthorized
```
**→ Vérifiez que votre clé API est correcte dans .env**

---

## 🌐 **ÉTAPE 5 : CONFIGURATION DOMAINE (OPTIONNEL)**

### **5.1 Pourquoi configurer un domaine**
- **Email pro** : `noreply@kadoc.com` au lieu de `noreply@courier.com`
- **Meilleure délivrabilité**
- **Image professionnelle**

### **5.2 Ajouter votre domaine**
1. **Dashboard Courier** → **"Settings"** → **"Domains"**
2. **"Add Domain"** → Saisir : `kadoc.com`
3. **Suivre les instructions DNS** (voir étape suivante)

### **5.3 Configuration DNS**
Si vous avez un domaine (`kadoc.com`), ajoutez ces enregistrements :

```dns
Type: MX
Nom: @
Valeur: courier.com
Priorité: 10

Type: TXT
Nom: _courier
Valeur: [Valeur fournie par Courier]
```

**💡 Conseil** : Vous pouvez commencer sans domaine personnalisé !

---

## 📊 **ÉTAPE 6 : SURVEILLANCE & QUOTA**

### **6.1 Surveiller l'usage**
1. **Dashboard** → **"Analytics"**
2. **Voir** : Emails envoyés / 10,000 gratuits
3. **Graphiques** : Délivrabilité, bounces, etc.

### **6.2 Quota gratuit**
```
✅ 10,000 emails/mois GRATUITS
📈 Après : ~$20/mois pour 50k emails
📊 Analytics inclus
🛡️ Support communautaire
```

---

## 🔧 **DÉPANNAGE COURANT**

### **Erreur 401 Unauthorized**
```bash
# Vérifier votre .env
echo $COURIER_AUTH_TOKEN

# Doit afficher : pk_prod_XXXXXX...
# Si vide ou incorrect → Corriger dans .env
```

### **Emails pas reçus**
1. **Vérifier spam/junk**
2. **Changer email de test** vers Gmail personnel
3. **Vérifier Dashboard Courier** → Analytics

### **Service non disponible**
1. **Tester connexion** : https://status.courier.com/
2. **Vérifier internet**
3. **Redémarrer serveur** : `npm restart`

---

## ⚡ **RACCOURCI : CONFIGURATION RAPIDE**

### **En 5 minutes** :

1. **Aller** → https://app.courier.com/
2. **S'inscrire** → Email + mot de passe
3. **Settings** → **API Keys** → **Copier** `pk_prod_...`
4. **Coller dans .env** : `COURIER_AUTH_TOKEN=pk_prod_VOTRE_CLE`
5. **Tester** : `node test-courier-email.js`

---

## 🎯 **CHECKLIST FINAL**

### **Avant de continuer, vérifiez** :
- [ ] Compte Courier créé et vérifié
- [ ] Clé API copiée (commence par `pk_prod_`)
- [ ] `.env` mis à jour avec la vraie clé
- [ ] Test réussi (`node test-courier-email.js`)
- [ ] Pas d'erreur 401 Unauthorized

### **Configuration avancée (plus tard)** :
- [ ] Domaine personnalisé configuré
- [ ] DNS mis à jour
- [ ] Templates Courier personnalisés
- [ ] Webhooks configurés

---

## 📞 **SUPPORT**

### **Si problème technique** :
1. **Relire** ce guide étape par étape
2. **Vérifier** le fichier .env
3. **Tester** avec `node test-courier-email.js`
4. **Contacter** : support@courier.com

### **Aide communautaire** :
- **Documentation** : https://www.courier.com/docs/
- **Examples** : https://github.com/trycourier
- **Status** : https://status.courier.com/

---

## 🏆 **RÉSULTAT ATTENDU**

Une fois configuré, vous aurez :
- ✅ **10,000 emails/mois gratuits**
- ✅ **Emails KADOC professionnels**
- ✅ **Templates HTML magnifiques**
- ✅ **Analytics en temps réel**
- ✅ **Délivrabilité optimisée**

**Prêt à envoyer des emails professionnels ! 🚀**
