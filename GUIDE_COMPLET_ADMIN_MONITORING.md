# 🚨 INTERFACE ADMIN MONITORING - GUIDE COMPLET D'UTILISATION

## 🎯 Vue d'Ensemble

L'interface d'administration monitoring de Cadok vous permet de surveiller la santé de votre plateforme en temps réel et de réagir rapidement aux problèmes. Cette interface traduit tout le monitoring que nous avons mis en place en visualisations et actions administratives concrètes.

---

## 📊 **1. DASHBOARD PRINCIPAL**

### **Accès :** `GET /api/admin/monitoring/dashboard`

### **Fonctionnalités :**
- **Vue d'ensemble système** : Statut global (Opérationnel/Dégradé)
- **Santé base de données** : Connexion, ping temps réel, statistiques complètes
- **Métriques système** : Mémoire, CPU, uptime, version Node.js
- **Statistiques métier** : Utilisateurs actifs, trades en cours, objets disponibles
- **Alertes automatiques** : Problèmes détectés en temps réel
- **Performance** : Temps de réponse de l'API

### **Données Retournées :**
```json
{
  "status": "operational",
  "responseTime": "45ms",
  "database": {
    "health": { "status": "healthy", "message": "Base accessible" },
    "stats": { "collections": 8, "dataSize": 12.45, "indexes": 15 }
  },
  "system": {
    "uptime": 3661.45,
    "memory": { "used": 67, "total": 128 }
  },
  "statistics": {
    "users": { "total": 1256, "active": 845, "newToday": 23 },
    "trades": { "pending": 12, "completed": 89, "todayCreated": 15 }
  },
  "alerts": [...]
}
```

---

## ⚡ **2. MÉTRIQUES TEMPS RÉEL**

### **Accès :** `GET /api/admin/monitoring/metrics/realtime`

### **Usage :** 
Parfait pour graphiques en temps réel dans votre dashboard React. Actualisation recommandée toutes les 30 secondes.

### **Métriques Disponibles :**
- **Connexion DB** : État de la connexion MongoDB (connecté/déconnecté/en cours)
- **Mémoire** : Heap utilisé/total, mémoire externe, RSS
- **Processus** : Handles actifs, requêtes en cours
- **Uptime** : Temps depuis le dernier redémarrage

---

## 📋 **3. CONSULTATION DES LOGS**

### **Endpoints :**
```
GET /api/admin/monitoring/logs/application   # Logs généraux
GET /api/admin/monitoring/logs/security      # Logs sécurité/authentification
GET /api/admin/monitoring/logs/business      # Logs métier Cadok (trades, objets)
GET /api/admin/monitoring/logs/error         # Erreurs uniquement
GET /api/admin/monitoring/logs/http          # Requêtes HTTP
```

### **Paramètres de Filtrage :**
- `limit=100` : Nombre de logs à récupérer (défaut: 100)
- `level=error` : Filtrer par niveau (error, warn, info, debug, all)

### **Cas d'Usage :**
- **Debugging** : Consulter les erreurs récentes
- **Audit** : Vérifier les connexions et actions sensibles
- **Analyse** : Comprendre le comportement des utilisateurs
- **Performance** : Identifier les requêtes lentes

---

## 🚨 **4. SYSTÈME D'ALERTES**

### **4.1 Consultation des Alertes**

#### **Accès :** `GET /api/admin/monitoring/alerts`

#### **Paramètres :**
- `status=unread` : Filtrer par statut (unread, read, all)
- `severity=critical` : Filtrer par sévérité (critical, warning, info, all)
- `limit=50` : Nombre d'alertes à retourner

#### **Types d'Alertes Automatiques :**

##### **🔴 ALERTES CRITIQUES :**
- **Base de données inaccessible** : Perte de connexion MongoDB
- **Mémoire critique** : >90% d'utilisation mémoire
- **Système de monitoring en panne** : Erreur du système de surveillance

##### **🟠 ALERTES WARNING :**
- **Mémoire élevée** : >80% d'utilisation mémoire
- **Accumulation de trades** : >50 trades en attente
- **Requêtes lentes** : Temps de réponse >2 secondes

##### **🔵 ALERTES INFO :**
- **Redémarrage récent** : Uptime <5 minutes
- **Maintenance programmée** : Actions admin effectuées

### **4.2 Gestion des Alertes**

#### **Marquer comme lu :** `PATCH /api/admin/monitoring/alerts/:id/read`
```json
{
  "success": true,
  "message": "Alerte marquée comme lue",
  "alert": { "read": true, "acknowledgedBy": "admin_id" }
}
```

#### **Statistiques :** `GET /api/admin/monitoring/alerts/stats`
- Analyse par période (1d, 7d, 30d)
- Répartition par sévérité
- Top des types d'alertes
- Tendances temporelles

---

## 🔧 **5. ACTIONS ADMINISTRATIVES**

### **5.1 Redémarrage Base de Données**
```http
POST /api/admin/monitoring/actions/restart-database
```
**Usage :** En cas de problème de connexion MongoDB, redémarre proprement la connexion.

**⚠️ Attention :** Action critique, logguée et tracée.

### **5.2 Nettoyage Cache**
```http
POST /api/admin/monitoring/actions/clear-cache
```
**Usage :** Force le garbage collector et nettoie les caches mémoire.

### **5.3 Export Rapport Santé**
```http
GET /api/admin/monitoring/export/health-report
```
**Usage :** Génère un rapport complet de santé pour archivage ou analyse.

---

## 🚨 **6. SURVEILLANCE CONTINUE AUTOMATIQUE**

### **Fonctionnement :**
Le système surveille automatiquement votre plateforme **toutes les 2 minutes** et génère des alertes selon les seuils configurés.

### **Seuils de Surveillance :**

#### **Mémoire :**
- **Warning** : 80% d'utilisation
- **Critique** : 90% d'utilisation

#### **Trades en Attente :**
- **Warning** : 50 trades en attente
- **Critique** : 100 trades en attente

#### **Temps de Réponse :**
- **Warning** : >2 secondes
- **Critique** : >5 secondes

#### **Uptime :**
- **Info** : <5 minutes (redémarrage récent)

### **Cooldown Anti-Spam :**
Chaque type d'alerte a un cooldown de **15 minutes** pour éviter le spam.

---

## 🎯 **7. INTÉGRATION FRONTEND REACT**

### **Composants Fournis :**

#### **7.1 Dashboard Principal**
```jsx
import AdminMonitoringDashboard from './components/AdminMonitoringDashboard';

// Usage
<AdminMonitoringDashboard />
```

#### **7.2 Gestion des Alertes**
```jsx
import AdminAlertsPage from './components/AdminAlertsPage';

// Usage  
<AdminAlertsPage />
```

### **Fonctionnalités Interface :**
- **Actualisation automatique** toutes les 30 secondes
- **Filtres temps réel** par sévérité, statut, période
- **Actions en un clic** : marquer lu, redémarrer DB, nettoyer cache
- **Graphiques temps réel** pour mémoire, uptime, métriques
- **Notifications navigateur** pour alertes critiques (à venir)

---

## 📱 **8. NOTIFICATIONS PUSH (EXTENSION FUTURE)**

### **Service Worker pour Notifications Navigateur :**
```javascript
// Demander permission notifications
if (Notification.permission === 'default') {
  await Notification.requestPermission();
}

// Recevoir alertes critiques
const notifyAdmin = (alert) => {
  if (alert.severity === 'critical') {
    new Notification(`🚨 Alerte Cadok: ${alert.title}`, {
      body: alert.message,
      icon: '/favicon.ico',
      tag: alert.id,
      requireInteraction: true
    });
  }
};
```

### **Extensions Possibles :**
- **Email** : Notifications par email pour alertes critiques
- **SMS** : Messages urgents pour pannes système
- **Slack/Teams** : Intégration channels admin
- **Webhook** : Intégration systèmes externes

---

## 🔧 **9. INSTALLATION & CONFIGURATION**

### **9.1 Backend - Ajout Routes**
```javascript
// app.js
const adminMonitoringRoutes = require('./routes/admin/monitoring');
app.use('/api/admin/monitoring', adminMonitoringRoutes);
```

### **9.2 Démarrage Monitoring**
```javascript
// start-enhanced.js ou app.js
const { startMonitoring } = require('./middleware/continuousMonitoring');
startMonitoring();
```

### **9.3 Middleware Surveillance**
```javascript
// app.js
const { responseTimeMonitoring } = require('./middleware/continuousMonitoring');
app.use(responseTimeMonitoring);
```

### **9.4 Variables d'Environnement**
```env
# Optionnel - Personnalisation seuils
ALERT_MEMORY_WARNING=80
ALERT_MEMORY_CRITICAL=90
ALERT_TRADES_WARNING=50
ALERT_TRADES_CRITICAL=100
MONITORING_INTERVAL=120000  # 2 minutes
```

---

## 📊 **10. EXEMPLES D'USAGE CONCRETS**

### **Scénario 1 : Pic de Charge**
1. **Détection** : Alerte mémoire >80%
2. **Dashboard** : Graphique mémoire montre tendance croissante
3. **Action** : Nettoyage cache via interface admin
4. **Suivi** : Vérification retour à la normale

### **Scénario 2 : Problème Base de Données**
1. **Détection** : Alerte critique "Base inaccessible"
2. **Logs** : Consultation logs erreurs pour diagnostic
3. **Action** : Redémarrage connexion DB via interface
4. **Validation** : Health check confirme retour normal

### **Scénario 3 : Accumulation Trades**
1. **Détection** : >50 trades en attente (warning)
2. **Investigation** : Consultation logs business
3. **Analyse** : Identification problème notifications
4. **Résolution** : Action corrective sur système notifications

### **Scénario 4 : Performance Dégradée**
1. **Détection** : Alertes temps de réponse >2s
2. **Métriques** : Analyse métriques temps réel
3. **Logs** : Identification requêtes lentes
4. **Optimisation** : Amélioration requêtes DB identifiées

---

## 🎯 **RÉSULTAT FINAL**

Avec cette interface d'administration monitoring, vous avez maintenant :

✅ **Visibilité complète** sur la santé de votre plateforme  
✅ **Alertes proactives** avant que les problèmes n'impactent les utilisateurs  
✅ **Actions de maintenance** en un clic pour résolution rapide  
✅ **Historique et trends** pour analyse et amélioration continue  
✅ **Interface moderne** React avec actualisation temps réel  
✅ **Logs structurés** pour debugging et audit  

**Votre plateforme Cadok est maintenant 100% observable et gérée de manière proactive !** 🚀
