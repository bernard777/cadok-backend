# 🚀 GUIDE DE LANCEMENT SERVEUR CADOK

## 📋 Vue d'ensemble

Ce guide vous présente plusieurs méthodes pour lancer le serveur CADOK sur la base de données de votre choix et éviter toute confusion entre les environnements.

---

## 🎯 Méthodes de lancement rapide

### **1. Scripts PowerShell (RECOMMANDÉ)**

#### 🚀 Lancement du serveur
```powershell
# Serveur sur base TEST (par défaut)
.\start-cadok.ps1

# Serveur sur base PRODUCTION
.\start-cadok.ps1 prod

# Serveur sur base DÉVELOPPEMENT
.\start-cadok.ps1 dev

# Mode développement avec nodemon sur base TEST
.\start-cadok.ps1 test dev
```

#### 🛠️ Gestion des bases et admins
```powershell
# Aide complète
.\cadok.ps1

# Vérifier le statut de toutes les bases
.\cadok.ps1 status

# Créer un compte admin (interactif)
.\cadok.ps1 admin
```

### **2. Commandes NPM**

#### 🚀 Lancement en mode production
```bash
npm run server:prod    # Base PRODUCTION (cadok)
npm run server:test    # Base TEST (cadok_test)  
npm run server:dev     # Base DÉVELOPPEMENT (cadok_dev)
```

#### 🔧 Lancement en mode développement (avec nodemon)
```bash
npm run dev:prod      # Base PRODUCTION + nodemon
npm run dev:test      # Base TEST + nodemon
npm run dev:dev       # Base DÉVELOPPEMENT + nodemon
```

#### 🔍 Utilitaires
```bash
npm run db:status     # Vérifier le statut des bases
npm run admin:create  # Créer un compte admin
npm run categories:init   # Initialiser les catégories (si vide)
npm run categories:reset  # Réinitialiser toutes les catégories
npm run categories:count  # Compter les catégories
npm run categories:list   # Lister toutes les catégories
```

---

## 🗄️ Bases de données disponibles

| Base | Nom technique | Usage | Icône |
|------|---------------|-------|-------|
| **PRODUCTION** | `cadok` | Données réelles, utilisateurs finaux | 🚀 |
| **TEST** | `cadok_test` | Tests, développement, démos | 🧪 |
| **DÉVELOPPEMENT** | `cadok_dev` | Développement local, expérimentations | 🛠️ |

---

## 📊 Vérification du statut des bases

Avant de commencer, vérifiez toujours l'état de vos bases :

```powershell
.\cadok.ps1 status
```

**Ou via NPM :**
```bash
npm run db:status
```

**Cette commande vous montre :**
- ✅ Statut de connexion de chaque base
- 👥 Nombre d'utilisateurs
- 👑 Nombre d'administrateurs  
- 📁 Collections présentes
- 🔗 URI de connexion
- 📦 **Nombre de catégories** (nouveau !)

---

## 👑 Création d'un compte administrateur

### Script interactif (RECOMMANDÉ)
```powershell
.\cadok.ps1 admin
```

**Le script vous demande :**
1. 🗄️ Choix de la base de données
2. 👤 Informations personnelles (nom, prénom, email)
3. 🔑 Mot de passe (minimum 8 caractères)
4. ✅ Confirmation avant création

**Permissions accordées automatiquement :**
- `manage_users` - Gestion des utilisateurs
- `manage_events` - Gestion des événements  
- `manage_trades` - Gestion des échanges
- `view_analytics` - Consultation des statistiques
- `system_admin` - Administration système

---

## 🔍 Identification visuelle de la base

Quand le serveur démarre, vous verrez clairement :

```
🚀 CADOK Backend Server
====================================
🗄️  Base de données: 🧪 TEST (cadok_test)
🔗 URI: mongodb://localhost:27017/cadok_test  
🌍 Environnement: test
✅ Connexion: Établie avec succès
📊 Collections: 5 trouvées
🚀 Serveur: Démarré sur le port 3000
====================================
```

---

## ⚡ Raccourcis pour situations courantes

### 🧪 Développement et tests
```powershell
# Lancement rapide en mode test
.\start-cadok.ps1 test dev

# Créer un admin de test
.\cadok.ps1 admin
# (Choisir option 2 : TEST)
```

### 🚀 Mise en production
```powershell
# Vérifier l'état avant production
.\cadok.ps1 status

# S'assurer qu'un admin existe en production
.\cadok.ps1 admin
# (Choisir option 1 : PRODUCTION)

# Lancer en mode production
.\start-cadok.ps1 prod
```

### 🛠️ Développement local
```powershell
# Mode développement complet
.\start-cadok.ps1 dev dev
```

---

## 🚨 Bonnes pratiques de sécurité

### ✅ À FAIRE :
- 🔍 **Toujours vérifier** sur quelle base vous êtes connecté
- 👑 **Créer des admins séparés** pour chaque environnement  
- 🔑 **Utiliser des mots de passe forts** (min 8 caractères)
- 💾 **Sauvegarder** les identifiants dans un lieu sûr

### ❌ À ÉVITER :
- 🚫 **Ne pas mélanger** les données test et production
- 🚫 **Ne pas utiliser** le même admin partout
- 🚫 **Ne pas lancer** le serveur sans vérifier la base
- 🚫 **Ne pas publier** les identifiants admin

---

## 🔧 Résolution de problèmes

### Problème de connexion MongoDB
```powershell
# Vérifier si MongoDB est démarré
Get-Process mongod

# Redémarrer MongoDB si nécessaire  
net start MongoDB
```

### Erreur "Port 3000 already in use"
```powershell
# Trouver le processus qui utilise le port
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID par l'ID du processus)
taskkill /PID 1234 /F
```

### Base de données vide après création d'admin
```powershell
# Vérifier le statut pour confirmer la création
.\cadok.ps1 status

# Recréer l'admin si nécessaire
.\cadok.ps1 admin
```

---

## 📞 Support

Pour tout problème ou question :
1. 🔍 Vérifiez d'abord le statut des bases avec `.\cadok.ps1 status`
2. 📋 Consultez les logs du serveur pour plus de détails
3. 🆘 Contactez l'équipe de développement avec les informations d'erreur

---

**💡 Conseil :** Gardez ce guide accessible et n'hésitez pas à utiliser `.\cadok.ps1` sans paramètre pour afficher l'aide rapide !
