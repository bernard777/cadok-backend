# 📸 API Images Documentation - Objets Cadok

## Vue d'ensemble

L'API supporte maintenant les images multiples pour chaque objet, permettant une expérience visuelle moderne similaire aux applications de marketplace actuelles.

## Structure des Images

Chaque objet peut avoir jusqu'à **10 images** avec la structure suivante :

```javascript
{
  url: "string",        // URL de l'image (requis)
  caption: "string",    // Légende de l'image (optionnel, max 200 caractères)
  isPrimary: boolean    // Image principale pour l'affichage (une seule par objet)
}
```

## 🔼 Créer un objet avec images

### POST /api/objects

```javascript
{
  "title": "iPhone 12 Pro",
  "description": "iPhone en excellent état",
  "category": "Electronics",
  "imageUrl": "https://example.com/main.jpg", // Compatibilité descendante
  "images": [
    {
      "url": "https://example.com/front.jpg",
      "caption": "Vue de face",
      "isPrimary": true
    },
    {
      "url": "https://example.com/back.jpg",
      "caption": "Vue arrière",
      "isPrimary": false
    },
    {
      "url": "https://example.com/screen.jpg",
      "caption": "Écran allumé"
      // isPrimary non spécifié = false
    }
  ],
  "attributes": {}
}
```

**Validation automatique :**
- Maximum 10 images par objet
- Une seule image peut être `isPrimary: true`
- Si aucune image n'est marquée comme principale, la première le devient automatiquement

## 👁️ Consulter un objet avec images

### GET /api/objects/:id

```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "iPhone 12 Pro",
  "description": "iPhone en excellent état",
  "category": "Electronics",
  "imageUrl": "https://example.com/main.jpg",
  "images": [
    {
      "url": "https://example.com/front.jpg",
      "caption": "Vue de face",
      "isPrimary": true
    },
    {
      "url": "https://example.com/back.jpg",
      "caption": "Vue arrière",
      "isPrimary": false
    }
  ],
  "owner": {
    "_id": "507f1f77bcf86cd799439012",
    "pseudo": "JohnDoe",
    "city": "Paris"
  },
  "status": "available",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

## 🖊️ Modifier les images d'un objet

### 1. Modifier tout l'objet (y compris images)
**PUT /api/objects/:id**

```javascript
{
  "title": "iPhone 12 Pro - Mis à jour",
  "images": [
    {
      "url": "https://example.com/new-front.jpg",
      "caption": "Nouvelle vue de face",
      "isPrimary": true
    }
  ]
}
```

### 2. Remplacer toutes les images
**PUT /api/objects/:id/images**

```javascript
{
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "caption": "Image 1",
      "isPrimary": true
    },
    {
      "url": "https://example.com/image2.jpg",
      "caption": "Image 2",
      "isPrimary": false
    }
  ]
}
```

### 3. Ajouter une nouvelle image
**POST /api/objects/:id/images**

```javascript
{
  "url": "https://example.com/new-image.jpg",
  "caption": "Nouvelle image",
  "isPrimary": false
}
```

### 4. Supprimer une image
**DELETE /api/objects/:id/images/:imageIndex**

Supprime l'image à l'index spécifié (0-based).

## 📱 Interface utilisateur recommandée

### Affichage des objets dans la liste
- Utiliser l'image avec `isPrimary: true`
- Fallback sur `imageUrl` si pas d'images multiples
- Afficher un indicateur du nombre total d'images (ex: "📷 3")

### Page de détail de l'objet
- Carrousel/slider avec toutes les images
- Image principale en grand
- Miniatures pour navigation
- Afficher les légendes si disponibles

### Création/Édition d'objet
- Upload multiple d'images (glisser-déposer recommandé)
- Possibilité de réorganiser les images
- Bouton pour marquer une image comme principale
- Champs pour ajouter des légendes

## 🔒 Sécurité et Validation

- **Authentification requise** pour toutes les modifications
- **Ownership check** : seul le propriétaire peut modifier
- **Rate limiting** : 5 créations d'objets max par 15 minutes
- **Validation des URLs** : vérification format et longueur
- **Limite de 10 images** par objet pour les performances

## 📊 Codes de réponse

- **200** : Succès
- **201** : Création réussie
- **400** : Données invalides (validation failed)
- **401** : Non authentifié
- **403** : Non autorisé (pas le propriétaire)
- **404** : Objet ou image introuvable
- **429** : Rate limit dépassé
- **500** : Erreur serveur

## 🚀 Migration depuis l'ancien système

L'API reste **rétrocompatible** :
- Le champ `imageUrl` est toujours supporté
- Les objets existants continuent de fonctionner
- Vous pouvez migrer progressivement vers le système d'images multiples

## 💡 Bonnes pratiques

1. **Optimisation des images** : Compresser les images avant upload
2. **Images responsives** : Prévoir plusieurs tailles d'images
3. **Lazy loading** : Charger les images à la demande
4. **Fallback** : Toujours avoir une image par défaut
5. **Performance** : Utiliser un CDN pour les images
