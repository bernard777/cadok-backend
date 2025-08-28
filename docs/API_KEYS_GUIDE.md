# 🔑 GUIDE D'OBTENTION DES CLÉS API - CADOK

Ce guide vous explique comment obtenir toutes les clés API nécessaires pour le système d'impact écologique avec données réelles.

## 🛒 eBay API (Prix réels d'objets d'occasion)

### **Pourquoi eBay ?**
- Plus grande base de données de prix d'occasion au monde
- API officielle gratuite (limite: 5000 appels/jour)
- Données de prix réels et récents

### **Étapes d'inscription :**

1. **Créer un compte développeur eBay**
   - Aller sur : https://developer.ebay.com/
   - Cliquer "Get Started" → "Create an eBay Developers Account"
   - Utiliser votre compte eBay existant ou en créer un

2. **Créer une application**
   - Dashboard → "Create App"
   - Nom: "Cadok Eco Impact Calculator"
   - Description: "Application calculant l'impact écologique des échanges d'objets"
   - Environnement: "Production" (pour vraies données)

3. **Récupérer les clés**
   ```
   EBAY_CLIENT_ID=VotreCleClient
   EBAY_CLIENT_SECRET=VotreCleSecrete
   EBAY_API_KEY=VotreApiKey (App ID)
   ```

4. **Configurer les permissions**
   - Activer: "Browse API" 
   - Activer: "Shopping API"
   - Marketplace: "EBAY_FR" (France)

### **Coût :** GRATUIT (5000 appels/jour)

---

## 🗺️ Google Maps API (Géolocalisation précise)

### **Pourquoi Google Maps ?**
- Géocodage le plus précis au monde
- Calcul de distances routières exacts
- APIs fiables et bien documentées

### **Étapes d'inscription :**

1. **Console Google Cloud**
   - Aller sur : https://console.cloud.google.com/
   - Créer un projet ou utiliser un existant
   - Nom du projet: "Cadok Mobile App"

2. **Activer les APIs nécessaires**
   - APIs & Services → Bibliothèque
   - Activer ces APIs :
     * **Geocoding API** (adresses → coordonnées)
     * **Directions API** (calcul distances routières)
     * **Places API** (recherche d'adresses)

3. **Créer une clé API**
   - APIs & Services → Identifiants
   - "+ CRÉER DES IDENTIFIANTS" → "Clé API"
   - Nommer: "Cadok Geolocation Key"

4. **Restreindre la clé (sécurité)**
   - Modifier la clé créée
   - Restrictions d'API : Sélectionner les 3 APIs activées
   - Restrictions d'application : Adresses IP (ajouter l'IP de votre serveur)

### **Configuration environnement :**
```
GOOGLE_MAPS_API_KEY=AIzaSyA...VotreClé
GEOCODING_SERVICE=google
ROUTING_SERVICE=google
```

### **Coût :** 
- **Geocoding** : $5 pour 1000 requêtes (200$/mois gratuits)
- **Directions** : $5 pour 1000 requêtes
- **Places** : $17 pour 1000 requêtes
- **Crédit gratuit** : 200$/mois = ~40 000 géolocalisations gratuites

---

## 🛍️ APIs Alternatives (Optionnelles)

### **Amazon Product Advertising API**
1. Amazon Associates → Product Advertising API
2. Inscription : https://webservices.amazon.fr/paapi5/
3. Nécessite un compte vendeur Amazon

### **Rakuten API** 
1. Rakuten Advertising → Developer Portal
2. APIs pour prix et produits Rakuten/PriceMinister

### **Leboncoin** (Non officielle)
- Pas d'API publique officielle
- Utilisation du scraping web (légal avec limitations)
- Notre système utilise des simulations réalistes

---

## ⚡ Configuration Optimale Recommandée

### **Pour démarrer (GRATUIT) :**
```env
# APIs gratuites
GEOCODING_SERVICE=government  # API française gratuite
ROUTING_SERVICE=osrm         # OpenStreetMap gratuit
EBAY_API_KEY=VotreCléeBay    # 5000 appels/jour gratuits

# Simulation pour les autres
LEBONCOIN_API_KEY=simulation
VINTED_API_KEY=simulation
```

### **Pour production (PAYANT mais précis) :**
```env
# APIs premium
GEOCODING_SERVICE=google
ROUTING_SERVICE=google
GOOGLE_MAPS_API_KEY=VotreCléGoogle

# Toutes les APIs prix
EBAY_API_KEY=VotreCléeBay
AMAZON_API_KEY=VotreCléAmazon
RAKUTEN_API_KEY=VotreCléRakuten
```

---

## 🔧 Configuration dans Cadok

### **1. Modifier le fichier .env**
```bash
# Copier vos clés dans cadok-backend/.env
EBAY_API_KEY=VotreVraieClé
GOOGLE_MAPS_API_KEY=VotreVraieClé
```

### **2. Redémarrer le serveur**
```bash
cd cadok-backend
npm start
```

### **3. Tester les APIs**
```bash
# Test avec vraies clés
curl http://localhost:5000/api/eco/demo-real-data
```

---

## 📊 Impact sur la Précision

### **Avant (Estimations) :**
- Prix : ±50% d'erreur
- Distances : ±30% d'erreur  
- Impact carbone : Approximatif

### **Après (APIs réelles) :**
- Prix : ±5% d'erreur (données marché)
- Distances : ±1% d'erreur (GPS précis)
- Impact carbone : Calculs exacts

### **Bénéfices utilisateur :**
- Confiance dans les calculs écologiques
- Décisions d'échange plus éclairées
- Motivation accrue pour l'économie circulaire

---

## ⚠️ Considérations Importantes

### **Sécurité :**
- Ne JAMAIS exposer les clés API côté client
- Utiliser des restrictions IP et domaine
- Monitorer l'usage pour éviter les abus

### **Coûts :**
- Commencer avec les APIs gratuites
- Migrer vers payantes selon le volume
- Budget estimé : 50-200€/mois selon utilisation

### **Alternatives :**
- Toujours avoir un fallback en cas d'échec API
- Système hybride : APIs payantes + données cached + estimations

---

## 🚀 Étapes Suivantes

1. **Obtenir les clés eBay** (gratuit, impact immédiat)
2. **Configurer Google Maps** (crédit gratuit 200$/mois)
3. **Tester avec vraies données**
4. **Optimiser selon l'usage réel**
5. **Ajouter plus d'APIs selon les besoins**

Le système fonctionne déjà avec des simulations réalistes, les vraies APIs apporteront la précision finale !
