# 🔑 GUIDE : CHOISIR LA BONNE CLÉ COURIER

## ✅ **RÉPONSE RAPIDE**

**Prenez la clé "Untitled key (published)" !**

---

## 📋 **EXPLICATION DES CLÉS COURIER**

### **🔍 Types de clés que vous voyez :**

| Clé | Description | À utiliser ? |
|-----|-------------|--------------|
| **Untitled key (draft)** | ❌ Brouillon, non active | **NON** |
| **Untitled key (published)** | ✅ Publiée, fonctionnelle | **OUI** |

### **💡 Pourquoi "published" ?**

1. **Clé active** : Seules les clés "published" fonctionnent pour envoyer des emails
2. **Clé stable** : Une fois publiée, elle reste active
3. **Clé de production** : Conçue pour l'usage réel

### **⚠️ Pourquoi pas "draft" ?**

- **Non fonctionnelle** : Les clés en brouillon ne peuvent pas envoyer d'emails
- **Temporaire** : Elles peuvent être supprimées ou modifiées
- **Test uniquement** : Prévues pour la configuration, pas l'utilisation

---

## 🚀 **ÉTAPES POUR RÉCUPÉRER LA BONNE CLÉ**

### **1. Dans votre Dashboard Courier :**

```
Settings > API Keys

Vous verrez quelque chose comme :

┌─────────────────────────────────────────┐
│ Untitled key (draft)                   │
│ pk_prod_XXXXXXXX... (draft)            │  ← ❌ NE PAS PRENDRE
│                                         │
│ Untitled key (published)               │
│ pk_prod_YYYYYYYY... (published)        │  ← ✅ PRENDRE CELLE-CI
│                                         │
│ [Copy] [Edit] [Delete]                  │
└─────────────────────────────────────────┘
```

### **2. Copier la clé "published" :**

1. **Cliquer sur "Copy"** à côté de **"Untitled key (published)"**
2. **Vérifier** que la clé commence bien par `pk_prod_`
3. **Coller dans votre .env**

---

## 💾 **CONFIGURATION .ENV**

### **Remplacer dans cadok-backend/.env :**

```bash
# AVANT
COURIER_AUTH_TOKEN=pk_prod_VOTRE_TOKEN_COURIER_ICI

# APRÈS (avec votre clé published)
COURIER_AUTH_TOKEN=pk_prod_YYYYYYYY_LA_CLE_PUBLISHED
```

### **⚠️ Vérifications importantes :**

1. **Commence par** `pk_prod_` ✅
2. **Contient** "published" dans le nom ✅  
3. **Pas de** "(draft)" ❌

---

## 🧪 **TEST DE VALIDATION**

### **Après configuration, tester :**

```bash
node test-courier-email.js
```

### **Résultat attendu avec la bonne clé :**

```
📧 === TEST SYSTÈME EMAIL COURIER ===

🔧 1. Vérification configuration...
✅ Configuration détectée:
   🔑 Token: pk_prod_YYYYYYYY...    ← Votre clé published
   📧 From: noreply@kadoc.com

📧 3. Test email de vérification...
✅ Email de vérification envoyé avec succès!  ← ✅ SUCCÈS
   📩 Message ID: 1-abc123...
```

### **❌ Erreur avec une clé "draft" :**

```
❌ Erreur: Status code: 401 - Unauthorized
❌ Erreur système: Invalid API key (draft keys cannot send)
```

---

## 🔄 **SI VOUS N'AVEZ QUE DES CLÉS "DRAFT"**

### **Publier votre clé :**

1. **Dashboard Courier** → **"Settings"** → **"API Keys"**
2. **Cliquer sur votre clé "draft"**
3. **Bouton "Publish"** ou **"Activate"**
4. **Confirmer** la publication
5. **Copier** la nouvelle clé "published"

### **Ou créer une nouvelle clé :**

1. **"Create new API Key"**
2. **Choisir** "Production" 
3. **Publier** immédiatement
4. **Copier** la clé générée

---

## 🎯 **RÉCAPITULATIF**

### **✅ À FAIRE :**
- [x] Prendre la clé **"Untitled key (published)"**
- [x] Vérifier qu'elle commence par `pk_prod_`
- [x] La coller dans `.env`
- [x] Tester avec `node test-courier-email.js`

### **❌ À ÉVITER :**
- [ ] ~~Prendre une clé "draft"~~
- [ ] ~~Utiliser une clé de test en production~~
- [ ] ~~Oublier de publier la clé~~

---

## 💡 **BONUS : RENOMMER VOS CLÉS**

### **Pour mieux s'y retrouver :**

1. **Cliquer sur "Edit"** à côté de votre clé
2. **Renommer** : "KADOC Production Key"
3. **Sauvegarder**

**Maintenant vous verrez :**
```
KADOC Production Key (published)
pk_prod_YYYYYYYY... (published)  ← Plus clair !
```

---

## 🏆 **VALIDATION FINALE**

**Une fois configurée, vous devriez avoir :**

- ✅ Clé "published" dans `.env`
- ✅ Test d'envoi réussi  
- ✅ Emails reçus (vérifiez spam)
- ✅ Message ID dans les logs

**Votre système email KADOC est opérationnel ! 🚀**
