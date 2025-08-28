/**
 * 📊 SERVICE MONITORING APIs - CADOK
 * Surveillance des performances et usage des APIs externes
 */

class APIMonitoringService {

  constructor() {
    this.stats = {
      ebay: { calls: 0, successes: 0, errors: 0, totalTime: 0 },
      google_maps: { calls: 0, successes: 0, errors: 0, totalTime: 0 },
      government_api: { calls: 0, successes: 0, errors: 0, totalTime: 0 },
      osrm: { calls: 0, successes: 0, errors: 0, totalTime: 0 }
    };
    this.dailyLimits = {
      ebay: 5000,           // Limite gratuite eBay
      google_maps: 40000,   // ~200$ crédit gratuit
      government_api: 50000, // Pas de limite officielle
      osrm: 100000          // Service public
    };
    this.startDate = new Date();
  }

  /**
   * 📈 Enregistrer un appel API
   */
  recordAPICall(service, success, responseTime, error = null) {
    if (!this.stats[service]) {
      this.stats[service] = { calls: 0, successes: 0, errors: 0, totalTime: 0 };
    }

    this.stats[service].calls++;
    this.stats[service].totalTime += responseTime;

    if (success) {
      this.stats[service].successes++;
    } else {
      this.stats[service].errors++;
      if (error) {
        console.warn(`⚠️ API Error [${service}]:`, error);
      }
    }
  }

  /**
   * 📊 Obtenir les statistiques
   */
  getStats() {
    const now = new Date();
    const uptimeHours = (now - this.startDate) / (1000 * 60 * 60);

    const summary = {};
    
    Object.keys(this.stats).forEach(service => {
      const stat = this.stats[service];
      const avgResponseTime = stat.calls > 0 ? stat.totalTime / stat.calls : 0;
      const successRate = stat.calls > 0 ? (stat.successes / stat.calls) * 100 : 0;
      const callsPerHour = uptimeHours > 0 ? stat.calls / uptimeHours : 0;
      const dailyProjection = callsPerHour * 24;
      const limitUsage = (dailyProjection / (this.dailyLimits[service] || 1000)) * 100;

      summary[service] = {
        total_calls: stat.calls,
        successes: stat.successes,
        errors: stat.errors,
        success_rate: Math.round(successRate * 100) / 100,
        avg_response_time_ms: Math.round(avgResponseTime),
        calls_per_hour: Math.round(callsPerHour * 100) / 100,
        daily_projection: Math.round(dailyProjection),
        daily_limit: this.dailyLimits[service],
        limit_usage_percent: Math.round(limitUsage * 100) / 100,
        status: this.getServiceStatus(successRate, limitUsage, stat.calls)
      };
    });

    return {
      uptime_hours: Math.round(uptimeHours * 100) / 100,
      monitoring_since: this.startDate,
      services: summary,
      overall_health: this.calculateOverallHealth(summary)
    };
  }

  /**
   * 🩺 Déterminer le statut d'un service
   */
  getServiceStatus(successRate, limitUsage, totalCalls) {
    if (totalCalls === 0) return '⚪ Non utilisé';
    if (limitUsage > 90) return '🔴 Limite proche';
    if (successRate < 50) return '🟡 Instable';
    if (successRate >= 95) return '🟢 Excellent';
    if (successRate >= 80) return '🟠 Correct';
    return '🟡 À surveiller';
  }

  /**
   * 💚 Calculer la santé globale
   */
  calculateOverallHealth(summary) {
    const services = Object.values(summary);
    const activeServices = services.filter(s => s.total_calls > 0);
    
    if (activeServices.length === 0) {
      return { status: '⚪ Aucun service utilisé', score: 0 };
    }

    const avgSuccessRate = activeServices.reduce((sum, s) => sum + s.success_rate, 0) / activeServices.length;
    const criticalServices = activeServices.filter(s => s.status.includes('🔴')).length;
    
    if (criticalServices > 0) {
      return { status: '🔴 Services critiques', score: 25 };
    }
    
    if (avgSuccessRate >= 95) {
      return { status: '🟢 Excellent', score: 100 };
    } else if (avgSuccessRate >= 80) {
      return { status: '🟠 Bon', score: 75 };
    } else if (avgSuccessRate >= 60) {
      return { status: '🟡 Moyen', score: 50 };
    } else {
      return { status: '🔴 Problème', score: 25 };
    }
  }

  /**
   * ⚠️ Obtenir les alertes
   */
  getAlerts() {
    const alerts = [];
    const stats = this.getStats();

    Object.entries(stats.services).forEach(([service, data]) => {
      // Alerte limite API
      if (data.limit_usage_percent > 80) {
        alerts.push({
          type: 'warning',
          service,
          message: `${service} approche de sa limite (${data.limit_usage_percent}%)`,
          recommendation: 'Considérer un upgrade ou optimiser les appels'
        });
      }

      // Alerte taux d'erreur
      if (data.success_rate < 70 && data.total_calls > 10) {
        alerts.push({
          type: 'error',
          service,
          message: `Taux d'erreur élevé pour ${service} (${100 - data.success_rate}%)`,
          recommendation: 'Vérifier la configuration et les clés API'
        });
      }

      // Alerte temps de réponse
      if (data.avg_response_time_ms > 5000) {
        alerts.push({
          type: 'performance',
          service,
          message: `Temps de réponse lent pour ${service} (${data.avg_response_time_ms}ms)`,
          recommendation: 'Considérer le cache ou un service alternatif'
        });
      }
    });

    return alerts;
  }

  /**
   * 💡 Obtenir des recommandations d'optimisation
   */
  getOptimizationRecommendations() {
    const stats = this.getStats();
    const recommendations = [];

    // Recommandations générales
    if (stats.overall_health.score < 75) {
      recommendations.push({
        priority: 'high',
        title: 'Améliorer la fiabilité des APIs',
        description: 'Plusieurs services ont des problèmes de performance',
        actions: [
          'Vérifier les clés API',
          'Implémenter des fallbacks',
          'Augmenter les timeouts'
        ]
      });
    }

    // Recommandations spécifiques par service
    Object.entries(stats.services).forEach(([service, data]) => {
      if (data.limit_usage_percent > 50 && data.daily_limit < 50000) {
        recommendations.push({
          priority: 'medium',
          title: `Optimiser l'usage de ${service}`,
          description: `Usage élevé détecté (${data.limit_usage_percent}% de la limite)`,
          actions: [
            'Implémenter un cache plus agressif',
            'Regrouper les appels API',
            'Considérer un plan payant'
          ]
        });
      }
    });

    // Recommandations de configuration
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      recommendations.push({
        priority: 'medium',
        title: 'Configurer Google Maps API',
        description: 'Pour une précision géographique maximale',
        actions: [
          'Obtenir une clé Google Maps API',
          'Configurer GOOGLE_MAPS_API_KEY dans .env',
          'Définir GEOCODING_SERVICE=google'
        ]
      });
    }

    if (!process.env.EBAY_API_KEY) {
      recommendations.push({
        priority: 'medium',
        title: 'Configurer eBay API',
        description: 'Pour des prix d\'occasion réels',
        actions: [
          'Créer un compte développeur eBay',
          'Obtenir les clés API',
          'Configurer dans .env'
        ]
      });
    }

    return recommendations;
  }

  /**
   * 🔄 Réinitialiser les statistiques
   */
  resetStats() {
    Object.keys(this.stats).forEach(service => {
      this.stats[service] = { calls: 0, successes: 0, errors: 0, totalTime: 0 };
    });
    this.startDate = new Date();
  }
}

module.exports = APIMonitoringService;
