# Dossier Uploads

Ce dossier contient les fichiers uploadés par les utilisateurs de l'application CADOK.

## Structure

- `avatars/` - Photos de profil des utilisateurs
- `object-images/` - Images des objets à échanger

## Important ⚠️

**Ces fichiers ne sont PAS versionnés dans Git pour des raisons de :**

- **Sécurité** : Les données utilisateur ne doivent pas être dans le repository
- **Performance** : Éviter un repository trop lourd
- **Confidentialité** : Respecter la vie privée des utilisateurs

## Configuration serveur

En production, ce dossier doit avoir les permissions d'écriture appropriées :

```bash
chmod 755 uploads/
chmod 755 uploads/avatars/
chmod 755 uploads/object-images/
```

## Sauvegarde

En production, pensez à sauvegarder régulièrement ce dossier séparément du code source.
