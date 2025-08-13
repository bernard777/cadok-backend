# 🧪 Scripts de Gestion des Données de Test - CADOK

Ce répertoire contient les scripts pour créer, gérer et vérifier les données de test de la plateforme CADOK.

## 📋 Scripts Disponibles

### 🦸‍♂️ Super Admin
```bash
npm run super-admin:create     # Créer uniquement le super admin
```
**Email**: `ndongoambassa7@gmail.com`  
**Mot de passe**: `SuperAdmin2024!`  
**Permissions**: Toutes les permissions administrateur

### 🧪 Données de Test Complètes
```bash
npm run test-data:create       # Créer toutes les données de test
npm run test-data:clean        # Nettoyer et recréer toutes les données
npm run test-data:verify       # Vérifier l'intégrité des données
```

### 🌍 Environnements Spécifiques
```bash
npm run seed:production        # Créer sur la base de production
npm run seed:test             # Créer sur la base de test
```

## 🎯 Données Créées

### 👤 Utilisateurs (8 comptes de test)

| Pseudo | Email | Mot de passe | Rôle | Plan | Ville |
|--------|-------|--------------|------|------|--------|
| **SuperAdminKadoc** | ndongoambassa7@gmail.com | SuperAdmin2024! | super_admin | premium | Nantes |
| MarieCollectionneuse | marie.test@cadok.app | Marie2024! | user | premium | Paris |
| TechLover_Alex | alex.tech@cadok.app | Tech2024! | user | basic | Lyon |
| ClaraBookworm | clara.books@cadok.app | Books2024! | moderator | premium | Bordeaux |
| JulienBricoleur | julien.bricoleur@cadok.app | Bricolage2024! | user | basic | Toulouse |
| SophieFitness | sophie.sport@cadok.app | Sport2024! | user | premium | Nice |
| MarkusCollector | markus.collector@cadok.app | Collection2024! | user | basic | Strasbourg |
| EmmaCreative | emma.creative@cadok.app | Creative2024! | user | premium | Rennes |

### 📦 Objets (18 objets répartis par utilisateur)

**Super Admin (2 objets):**
- Guide d'utilisation CADOK Premium
- Kit de démarrage Écologique

**Marie - Mode/Vintage (3 objets):**
- Robe vintage années 70
- Sac à main en cuir vintage  
- Collier en perles de culture

**Alexandre - Tech (3 objets):**
- iPhone 13 Pro 256GB
- MacBook Air M2 2022
- Casque Sony WH-1000XM4

**Clara - Livres (2 objets):**
- Collection Harry Potter complète
- Encyclopédie Universalis (20 volumes)

**Julien - Bricolage (2 objets):**
- Perceuse-visseuse Bosch Professional
- Établi en bois massif

**Sophie - Sport (2 objets):**
- Vélo elliptique NordicTrack
- Set d'haltères ajustables 50kg

**Markus - Collection (2 objets):**
- Montre mécanique Omega 1965
- Appareil photo Leica M6

**Emma - Créatif (2 objets):**
- Machine à coudre Singer Vintage
- Coffret complet de peinture acrylique

### 🔄 Échanges (9 échanges dans tous les états)

| Statut | Description | Participants |
|--------|-------------|--------------|
| **PENDING** | En attente | Super Admin ↔ Marie |
| **PROPOSED** | Proposé | Alexandre ↔ Sophie |
| **ACCEPTED** | Accepté | Clara ↔ Julien |
| **SECURED** | Sécurisé (avec dépôt) | Markus ↔ Alexandre |
| **SHIPPED** | Expédié | Emma ↔ Marie |
| **COMPLETED** | Terminé avec évaluations | Sophie ↔ Julien |
| **DISPUTED** | En litige | Alexandre ↔ Markus |
| **CANCELLED** | Annulé | Clara ↔ Emma |
| **REFUSED** | Refusé | Marie ↔ Super Admin |

### 🚨 Signalements (3 exemples)

- **Description non conforme** : Alexandre signale Markus
- **Comportement suspect** : Clara signale Markus  
- **Contenu inapproprié** : Sophie signale Emma (résolu)

## 🛠️ Fonctionnalités Testées

### ✅ Système d'Authentification
- Utilisateurs avec différents niveaux de vérification
- Comptes admin avec permissions granulaires
- Téléphones vérifiés/non vérifiés pour tester la sécurité

### ✅ Géolocalisation
- Tous les objets ont des coordonnées GPS réalistes
- Répartition géographique sur toute la France
- Recherche par proximité fonctionnelle

### ✅ Système d'Échanges Complet
- Tous les statuts possibles représentés
- Échanges avec dépôt de garantie (SECURED)
- Système d'évaluations bidirectionnelles
- Gestion des litiges et annulations

### ✅ Modération et Sécurité
- Signalements avec preuves
- Utilisateurs non vérifiés pour tester les restrictions
- Différents niveaux de risque d'échange

### ✅ Abonnements
- Mix utilisateurs Premium/Basic
- Abonnements actifs/inactifs
- Test des limitations par plan

## 🔍 Vérification des Données

Le script `npm run test-data:verify` affiche :
- Statistiques générales
- Détails du super admin
- Liste des utilisateurs de test
- Répartition des objets
- États des échanges
- Vérification de la géolocalisation

## 🧹 Nettoyage

Le script `npm run test-data:clean` :
- Supprime tous les anciens utilisateurs de test
- Préserve le super admin principal
- Nettoie les objets et échanges orphelins
- Recrée des données fraîches

## 🚀 Tests Possibles avec ces Données

### Administration
- Connexion avec le super admin
- Gestion des utilisateurs et modération
- Résolution de litiges
- Gestion des signalements

### Fonctionnalités Utilisateur
- Recherche d'objets par proximité
- Proposition et gestion d'échanges
- Système d'évaluations
- Signalement d'utilisateurs/objets

### Sécurité et Paiements
- Échanges avec dépôt de garantie
- Vérification d'identité pour échanges à haut risque
- Gestion des remboursements

### Notifications et Communication
- Notifications d'échange
- Système de messagerie
- Alertes de sécurité

## 📝 Notes Importantes

- **Base de production** : Les scripts utilisent `mongodb://localhost:27017/cadok`
- **Géolocalisation** : Coordonnées réelles des villes françaises
- **Sécurité** : Mots de passe hashés avec bcrypt
- **Cohérence** : Données interconnectées et réalistes
- **Évolutivité** : Scripts facilement modifiables pour ajouter plus de données

## 🆘 Dépannage

Si les scripts échouent :

1. **Vérifier MongoDB** : `npm run db:status`
2. **Vérifier les catégories** : `npm run categories:list`
3. **Nettoyer et recréer** : `npm run test-data:clean`
4. **Vérifier le résultat** : `npm run test-data:verify`

---

✅ **Données cohérentes et prêtes pour les tests complets de CADOK !** 🚀
