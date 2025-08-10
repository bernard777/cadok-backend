# 📁 Scripts Locaux - Cadok Backend

Ce répertoire contient les scripts d'administration locaux qui ne sont **PAS versionnés** pour des raisons de sécurité.

## 🔒 Scripts Non Versionnés

Les fichiers suivants sont automatiquement exclus par `.gitignore` :
- `create-admin-*.js` - Scripts de création d'admin
- `init-admin-*.js` - Scripts d'initialisation  
- `setup-*.js` - Scripts de configuration
- `deploy-*.js` - Scripts de déploiement

## 📝 Utilisation

### Créer un Admin Local
```bash
# 1. Copier le template
cp ../create-admin-template.js ./create-admin-local.js

# 2. Modifier les credentials dans le fichier
nano create-admin-local.js

# 3. Exécuter
node create-admin-local.js

# 4. Supprimer après usage
rm create-admin-local.js
```

### Variables d'Environnement
```env
MONGODB_URI=mongodb://localhost:27017/cadok
SUPER_ADMIN_EMAIL=admin@domain.com
SUPER_ADMIN_PASSWORD=***
```

## 🛡️ Sécurité

- ✅ **Fichiers exclus** du contrôle de version
- ✅ **Credentials séparés** des variables d'environnement
- ✅ **Suppression automatique** après utilisation
- ✅ **Template sécurisé** sans vraies valeurs

## 📋 Templates Disponibles

- `../create-admin-template.js` - Template pour création admin
- `../admin-utils/` - Fonctions utilitaires réutilisables

---

**⚠️ ATTENTION : Ne jamais committer de scripts contenant de vraies credentials dans ce répertoire !**
