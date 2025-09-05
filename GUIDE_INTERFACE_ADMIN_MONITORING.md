# 📊 INTERFACE ADMIN MONITORING - DASHBOARD SANTÉ PLATEFORME

Ce composant React fournit une interface d'administration complète pour surveiller la santé de la plateforme Cadok en temps réel.

## 🎯 Fonctionnalités Clés

### 1. **Dashboard Principal** (`GET /api/admin/monitoring/dashboard`)
- Vue d'ensemble santé système
- Métriques base de données temps réel
- Statistiques utilisateurs/trades/objets
- Alertes système automatiques
- Temps de réponse API

### 2. **Métriques Temps Réel** (`GET /api/admin/monitoring/metrics/realtime`)
- Graphiques mémoire en direct
- État connexion base de données
- Uptime serveur
- Handles/requêtes actives

### 3. **Consultation Logs** (`GET /api/admin/monitoring/logs/:type`)
- Logs application, sécurité, business, erreurs
- Filtrage par niveau (error, warn, info, debug)
- Recherche temps réel
- Export et archivage

### 4. **Système d'Alertes** (`GET /api/admin/monitoring/alerts`)
- Alertes critiques/warning/info
- Surveillance proactive
- Notifications push pour problèmes
- Historique des incidents

### 5. **Actions Administratives**
- Redémarrage base de données (`POST /api/admin/monitoring/actions/restart-database`)
- Nettoyage cache (`POST /api/admin/monitoring/actions/clear-cache`)
- Export rapports santé (`GET /api/admin/monitoring/export/health-report`)

## 🚀 Usage

```javascript
// Exemple d'intégration dans app.js
const adminMonitoringRoutes = require('./routes/admin/monitoring');
app.use('/api/admin/monitoring', adminMonitoringRoutes);
```

## 📈 Interface Dashboard Exemple

```jsx
import React, { useState, useEffect } from 'react';
import { Card, Alert, Button, Progress, Badge, Table } from 'antd';
import { 
  DatabaseOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  ReloadOutlined 
} from '@ant-design/icons';

const AdminMonitoringDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);

  // Chargement initial
  useEffect(() => {
    loadDashboardData();
    loadAlerts();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(() => {
      loadDashboardData();
      loadRealtimeMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/alerts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/metrics/realtime', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRealtimeMetrics(data);
    } catch (error) {
      console.error('Erreur métriques temps réel:', error);
    }
  };

  const handleRestartDatabase = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/actions/restart-database', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      
      if (result.success) {
        Alert.success('Base de données redémarrée avec succès');
        loadDashboardData();
      } else {
        Alert.error('Erreur redémarrage: ' + result.message);
      }
    } catch (error) {
      Alert.error('Erreur action redémarrage');
    }
  };

  if (loading) {
    return <div>Chargement dashboard...</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>🎯 Dashboard Monitoring Cadok</h1>
      
      {/* Statut Global */}
      <Card title="📊 État Général de la Plateforme" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Badge 
            status={getStatusColor(dashboardData?.status)} 
            text={dashboardData?.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
          />
          <span>Temps de réponse: {dashboardData?.responseTime}</span>
          <span>Uptime: {Math.round(dashboardData?.system?.uptime / 3600)}h</span>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadDashboardData}
            size="small"
          >
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card title="🚨 Alertes Actives" style={{ marginBottom: '16px' }}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              type={getSeverityColor(alert.severity)}
              message={alert.title}
              description={`${alert.message} - Action: ${alert.action}`}
              style={{ marginBottom: '8px' }}
              showIcon
            />
          ))}
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Base de Données */}
        <Card title="🔍 Base de Données" extra={<DatabaseOutlined />}>
          <div>
            <p><strong>Statut:</strong> 
              <Badge 
                status={dashboardData?.database?.health?.status === 'healthy' ? 'success' : 'error'} 
                text={dashboardData?.database?.health?.message}
              />
            </p>
            <p><strong>Nom:</strong> {dashboardData?.database?.stats?.databaseName}</p>
            <p><strong>Collections:</strong> {dashboardData?.database?.stats?.collections}</p>
            <p><strong>Taille données:</strong> {dashboardData?.database?.stats?.dataSize} MB</p>
            <p><strong>Index:</strong> {dashboardData?.database?.stats?.indexes}</p>
            
            <Button 
              type="primary" 
              danger 
              onClick={handleRestartDatabase}
              style={{ marginTop: '8px' }}
            >
              Redémarrer Connexion DB
            </Button>
          </div>
        </Card>

        {/* Système */}
        <Card title="💻 Système">
          <div>
            <p><strong>Mémoire utilisée:</strong></p>
            <Progress 
              percent={Math.round((dashboardData?.system?.memory?.used / dashboardData?.system?.memory?.total) * 100)}
              format={() => `${dashboardData?.system?.memory?.used}/${dashboardData?.system?.memory?.total} MB`}
            />
            <p><strong>Plateforme:</strong> {dashboardData?.system?.platform}</p>
            <p><strong>Version Node:</strong> {dashboardData?.system?.version}</p>
            <p><strong>Architecture:</strong> {dashboardData?.system?.arch}</p>
          </div>
        </Card>

        {/* Statistiques Utilisateurs */}
        <Card title="👥 Utilisateurs">
          <div>
            <p><strong>Total:</strong> {dashboardData?.statistics?.users?.total}</p>
            <p><strong>Actifs:</strong> {dashboardData?.statistics?.users?.active}</p>
            <p><strong>Nouveaux aujourd'hui:</strong> {dashboardData?.statistics?.users?.newToday}</p>
            <p><strong>Vus récemment:</strong> {dashboardData?.statistics?.users?.activeRecently}</p>
          </div>
        </Card>

        {/* Statistiques Trades */}
        <Card title="🔄 Échanges">
          <div>
            <p><strong>Total:</strong> {dashboardData?.statistics?.trades?.total}</p>
            <p><strong>En attente:</strong> 
              <span style={{ color: dashboardData?.statistics?.trades?.pending > 20 ? 'red' : 'inherit' }}>
                {dashboardData?.statistics?.trades?.pending}
              </span>
            </p>
            <p><strong>Complétés:</strong> {dashboardData?.statistics?.trades?.completed}</p>
            <p><strong>Créés aujourd'hui:</strong> {dashboardData?.statistics?.trades?.todayCreated}</p>
          </div>
        </Card>
      </div>

      {/* Métriques Temps Réel */}
      {realtimeMetrics && (
        <Card title="📈 Métriques Temps Réel" style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <p><strong>Connexion DB:</strong> {realtimeMetrics.database.connectionStates}</p>
            </div>
            <div>
              <p><strong>Handles actifs:</strong> {realtimeMetrics.activeHandles}</p>
            </div>
            <div>
              <p><strong>Requêtes actives:</strong> {realtimeMetrics.activeRequests}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminMonitoringDashboard;
```

## 🔧 Configuration Requise

1. **Authentification Admin** - Routes protégées par role 'admin'
2. **Base de données** - Models User, Trade, Object
3. **Logs** - Répertoire `/logs` avec rotation quotidienne
4. **Monitoring** - Winston + cadokLogger configurés

## 📱 Notifications Push (Extension Future)

```javascript
// Service worker pour notifications navigateur
const notifyAdmin = (alert) => {
  if (Notification.permission === 'granted') {
    new Notification(`Alerte Cadok: ${alert.title}`, {
      body: alert.message,
      icon: '/favicon.ico',
      tag: alert.id
    });
  }
};
```

## 🎯 Intégration

Ajouter dans votre `app.js`:

```javascript
// Routes monitoring admin
const adminMonitoringRoutes = require('./routes/admin/monitoring');
app.use('/api/admin/monitoring', adminMonitoringRoutes);
```
