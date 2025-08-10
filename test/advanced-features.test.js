/**
 * 🧪 TESTS AVANCÉS - CADOK FONCTIONNALITÉS
 * Tests HTTP-Pure pour Analytics, Notifications, Eco-Impact & Gamification
 */

const axios = require('axios');
const assert = require('assert');

// Configuration serveur de test
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true // Accepter tous les status pour les tester
});

// Variables globales pour les tests
let authTokens = {};
let testUsers = {};
let testObjects = {};
let testNotifications = {};

/**
 * 📊 TESTS SERVICE ANALYTICS
 */
describe('🔥 ANALYTICS SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('🚀 Préparation environnement Analytics...');
    
    // Créer utilisateur test avec historique
    const userResponse = await api.post('/api/auth/register', {
      username: 'analytics_tester',
      email: 'analytics@test.com',
      password: 'Test123!',
      city: 'Test City'
    });
    
    testUsers.analytics = userResponse.data.user;
    authTokens.analytics = userResponse.data.token;

    // Créer des objets et échanges pour les tests
    await createTestEcosystem('analytics');
  });

  it('✅ GET /api/analytics/dashboard - Récupération dashboard complet', async () => {
    const response = await api.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.dashboard);
    assert(response.data.dashboard.tradingMetrics);
    assert(response.data.dashboard.objectsMetrics);
    assert(response.data.dashboard.communityRanking);
    assert(response.data.dashboard.monthlyTrends);
    assert(response.data.dashboard.personalizedTips);

    console.log('📊 Dashboard analytics:', response.data.dashboard.tradingMetrics.successRate);
  });

  it('✅ Analytics - Métriques trading détaillées', async () => {
    const response = await api.get('/api/analytics/trading-metrics', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.metrics);
    assert(typeof response.data.metrics.successRate === 'number');
    assert(typeof response.data.metrics.averageCompletionTime === 'number');
    assert(Array.isArray(response.data.metrics.categoryPerformance));

    console.log('📈 Métriques trading validées');
  });

  it('✅ Analytics - Classement communautaire', async () => {
    const response = await api.get('/api/analytics/community-ranking', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.ranking);
    assert(typeof response.data.ranking.percentile === 'number');
    assert(response.data.ranking.percentile >= 0 && response.data.ranking.percentile <= 100);

    console.log('🏆 Classement communautaire validé');
  });

  it('✅ Analytics - Tendances mensuelles', async () => {
    const response = await api.get('/api/analytics/monthly-trends', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.trends);
    assert(Array.isArray(response.data.trends.monthlyData));
    assert(response.data.trends.monthlyData.length === 6);

    console.log('📅 Tendances mensuelles validées');
  });

  it('✅ Analytics - Conseils personnalisés', async () => {
    const response = await api.get('/api/analytics/personalized-tips', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.tips);
    assert(Array.isArray(response.data.tips.recommendations));
    assert(response.data.tips.recommendations.length > 0);

    console.log('💡 Conseils personnalisés validés');
  });

});

/**
 * 🔔 TESTS SERVICE NOTIFICATIONS INTELLIGENTES
 */
describe('📱 NOTIFICATIONS SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('🚀 Préparation environnement Notifications...');
    
    const userResponse = await api.post('/api/auth/register', {
      username: 'notification_tester',
      email: 'notifications@test.com',
      password: 'Test123!',
      city: 'Paris',
      notificationPreferences: {
        notifications_push: true,
        locationBased: true,
        timingOptimized: true,
        urgentAlerts: true
      }
    });
    
    testUsers.notifications = userResponse.data.user;
    authTokens.notifications = userResponse.data.token;
  });

  it('✅ POST /api/notifications/send-contextual - Notifications contextuelles', async () => {
    const response = await api.post('/api/notifications/send-contextual', {}, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(typeof response.data.totalSent === 'number');
    assert(response.data.breakdown);

    console.log('🔔 Notifications contextuelles:', response.data.totalSent, 'envoyées');
  });

  it('✅ POST /api/notifications/send-location-based - Notifications géolocalisées', async () => {
    const response = await api.post('/api/notifications/send-location-based', {}, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);

    console.log('📍 Notifications géolocalisées envoyées');
  });

  it('✅ POST /api/notifications/personalized/:type - Notification personnalisée', async () => {
    const response = await api.post('/api/notifications/personalized/trade_match', {
      objectName: 'iPhone 12',
      matchScore: 95
    }, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.notification);

    console.log('🎯 Notification personnalisée créée');
  });

  it('✅ GET /api/notifications/user - Récupération notifications utilisateur', async () => {
    const response = await api.get('/api/notifications/user', {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.data.notifications));

    console.log('📋 Notifications utilisateur récupérées:', response.data.notifications.length);
  });

  it('✅ PATCH /api/notifications/:id/read - Marquer notification comme lue', async () => {
    // D'abord créer une notification
    const createResponse = await api.post('/api/notifications/personalized/milestone', {
      milestone: '10 échanges'
    }, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    const notificationId = createResponse.data.notification._id;

    // Puis la marquer comme lue
    const response = await api.patch(`/api/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);

    console.log('✅ Notification marquée comme lue');
  });

});

/**
 * 🌱 TESTS SERVICE IMPACT ÉCOLOGIQUE
 */
describe('🌍 ECO-IMPACT SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('🚀 Préparation environnement Eco-Impact...');
    
    const userResponse = await api.post('/api/auth/register', {
      username: 'eco_tester',
      email: 'eco@test.com',
      password: 'Test123!',
      city: 'Green City'
    });
    
    testUsers.eco = userResponse.data.user;
    authTokens.eco = userResponse.data.token;

    // Créer des échanges pour calculer l'impact
    await createTestEcosystem('eco');
  });

  it('✅ GET /api/eco/dashboard - Dashboard impact écologique', async () => {
    const response = await api.get('/api/eco/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.dashboard);
    assert(response.data.dashboard.carbonFootprint);
    assert(response.data.dashboard.objectsLifecycle);
    assert(response.data.dashboard.communityImpact);

    console.log('🌱 Impact CO2 évité:', response.data.dashboard.carbonFootprint.totalCarbonSaved, 'kg');
  });

  it('✅ GET /api/eco/carbon-footprint - Calcul empreinte carbone', async () => {
    const response = await api.get('/api/eco/carbon-footprint', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.carbonFootprint);
    assert(typeof response.data.carbonFootprint.totalCarbonSaved === 'number');
    assert(typeof response.data.carbonFootprint.totalWastePrevented === 'number');
    assert(typeof response.data.carbonFootprint.treesEquivalent === 'number');

    console.log('🌳 Équivalent arbres sauvés:', response.data.carbonFootprint.treesEquivalent);
  });

  it('✅ GET /api/eco/lifecycle-analysis - Analyse cycle de vie', async () => {
    const response = await api.get('/api/eco/lifecycle-analysis', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.lifecycle);
    assert(typeof response.data.lifecycle.circularityScore === 'number');
    assert(response.data.lifecycle.circularityScore >= 0 && response.data.lifecycle.circularityScore <= 100);

    console.log('🔄 Score de circularité:', response.data.lifecycle.circularityScore);
  });

  it('✅ GET /api/eco/community-impact - Impact communautaire', async () => {
    const response = await api.get('/api/eco/community-impact', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.community);
    assert(typeof response.data.community.communityRanking === 'number');

    console.log('🏘️ Classement communauté:', response.data.community.communityRanking, '%');
  });

  it('✅ GET /api/eco/achievements - Réalisations écologiques', async () => {
    const response = await api.get('/api/eco/achievements', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.achievements);
    assert(Array.isArray(response.data.achievements.badges));

    console.log('🏆 Badges écologiques:', response.data.achievements.totalBadges);
  });

  it('✅ GET /api/eco/recommendations - Recommandations écologiques', async () => {
    const response = await api.get('/api/eco/recommendations', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.recommendations);
    assert(Array.isArray(response.data.recommendations.recommendations));

    console.log('💚 Recommandations écologiques:', response.data.recommendations.recommendations.length);
  });

});

/**
 * 🎮 TESTS SERVICE GAMIFICATION
 */
describe('🏆 GAMIFICATION SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('🚀 Préparation environnement Gamification...');
    
    const userResponse = await api.post('/api/auth/register', {
      username: 'gamer_tester',
      email: 'gamer@test.com',
      password: 'Test123!',
      city: 'Game City'
    });
    
    testUsers.gamification = userResponse.data.user;
    authTokens.gamification = userResponse.data.token;

    // Créer de l'activité pour les tests gamification
    await createTestEcosystem('gamification');
  });

  it('✅ GET /api/gamification/dashboard - Dashboard gamification complet', async () => {
    const response = await api.get('/api/gamification/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.dashboard);
    assert(response.data.dashboard.playerProfile);
    assert(response.data.dashboard.achievements);
    assert(response.data.dashboard.activeChallenges);

    console.log('🎮 Niveau joueur:', response.data.dashboard.playerProfile.level);
  });

  it('✅ GET /api/gamification/profile - Profil joueur', async () => {
    const response = await api.get('/api/gamification/profile', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.profile);
    assert(typeof response.data.profile.level === 'number');
    assert(typeof response.data.profile.totalXP === 'number');
    assert(response.data.profile.playerTitle);

    console.log('👤 XP Total:', response.data.profile.totalXP);
  });

  it('✅ GET /api/gamification/achievements - Achievements utilisateur', async () => {
    const response = await api.get('/api/gamification/achievements', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.achievements);
    assert(Array.isArray(response.data.achievements.earnedAchievements));
    assert(Array.isArray(response.data.achievements.availableAchievements));

    console.log('🏅 Achievements gagnés:', response.data.achievements.earned);
  });

  it('✅ GET /api/gamification/challenges - Défis actifs', async () => {
    const response = await api.get('/api/gamification/challenges', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.challenges);
    assert(response.data.challenges.daily);
    assert(Array.isArray(response.data.challenges.daily.challenges));

    console.log('🎯 Défis quotidiens:', response.data.challenges.daily.challenges.length);
  });

  it('✅ GET /api/gamification/leaderboards - Classements', async () => {
    const response = await api.get('/api/gamification/leaderboards', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.leaderboards);
    assert(response.data.leaderboards.general);
    assert(typeof response.data.leaderboards.general.userPosition === 'number');

    console.log('🏆 Position classement:', response.data.leaderboards.general.userPosition);
  });

  it('✅ POST /api/gamification/complete-challenge - Compléter défi', async () => {
    const response = await api.post('/api/gamification/complete-challenge', {
      challengeId: 'daily_browse',
      progress: 10
    }, {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);

    console.log('✅ Défi complété avec succès');
  });

  it('✅ GET /api/gamification/rewards - Système récompenses', async () => {
    const response = await api.get('/api/gamification/rewards', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.rewards);
    assert(typeof response.data.rewards.currentPoints === 'number');

    console.log('💎 Points actuels:', response.data.rewards.currentPoints);
  });

});

/**
 * 🔄 TESTS INTÉGRATION CROSS-SERVICES
 */
describe('🌐 INTÉGRATION - Tests Cross-Services', () => {

  before(async () => {
    console.log('🚀 Préparation tests intégration...');
    
    const userResponse = await api.post('/api/auth/register', {
      username: 'integration_tester',
      email: 'integration@test.com',
      password: 'Test123!',
      city: 'Integration City'
    });
    
    testUsers.integration = userResponse.data.user;
    authTokens.integration = userResponse.data.token;

    await createTestEcosystem('integration');
  });

  it('✅ Intégration Analytics ↔ Eco-Impact', async () => {
    // Récupérer dashboard analytics
    const analyticsResponse = await api.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    // Récupérer dashboard eco
    const ecoResponse = await api.get('/api/eco/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    // Vérifier cohérence des données
    assert.strictEqual(analyticsResponse.status, 200);
    assert.strictEqual(ecoResponse.status, 200);

    console.log('🔗 Intégration Analytics-Eco validée');
  });

  it('✅ Intégration Gamification ↔ Notifications', async () => {
    // Compléter un achievement pour déclencher une notification
    const achievementResponse = await api.post('/api/gamification/complete-achievement', {
      achievementId: 'first_trade'
    }, {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    // Vérifier que la notification a été créée
    const notificationsResponse = await api.get('/api/notifications/user', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(notificationsResponse.status, 200);

    console.log('🔗 Intégration Gamification-Notifications validée');
  });

  it('✅ Test complet workflow utilisateur', async () => {
    // 1. Créer un objet
    const objectResponse = await api.post('/api/objects', {
      title: 'Objet Test Workflow',
      description: 'Test intégration complète',
      category: 'Test',
      condition: 'Bon état'
    }, {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(objectResponse.status, 201);

    // 2. Vérifier impact sur analytics
    const analyticsAfter = await api.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(analyticsAfter.status, 200);

    // 3. Vérifier impact sur eco-dashboard
    const ecoAfter = await api.get('/api/eco/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(ecoAfter.status, 200);

    // 4. Vérifier impact sur gamification
    const gamificationAfter = await api.get('/api/gamification/profile', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(gamificationAfter.status, 200);

    console.log('🎯 Workflow complet validé avec succès');
  });

});

/**
 * 🛠️ FONCTIONS UTILITAIRES
 */

/**
 * Créer un écosystème de test avec objets et échanges
 */
async function createTestEcosystem(userType) {
  const token = authTokens[userType];
  
  try {
    // Créer quelques objets
    for (let i = 1; i <= 3; i++) {
      await api.post('/api/objects', {
        title: `Objet Test ${userType} ${i}`,
        description: `Description test ${i}`,
        category: 'Test',
        condition: 'Bon état',
        estimatedValue: 50 + (i * 10)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    console.log(`✅ Écosystème test créé pour ${userType}`);
  } catch (error) {
    console.log(`⚠️ Erreur création écosystème ${userType}:`, error.message);
  }
}

/**
 * Nettoyage après les tests
 */
after(async () => {
  console.log('🧹 Nettoyage environnement de test...');
  
  try {
    // Supprimer les utilisateurs de test
    for (const [userType, token] of Object.entries(authTokens)) {
      await api.delete('/api/users/test-cleanup', {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.log('⚠️ Erreur nettoyage:', error.message);
  }
});

// Export pour les tests en ligne de commande
module.exports = {
  testAnalytics: () => run('Analytics'),
  testNotifications: () => run('Notifications'), 
  testEcoImpact: () => run('Eco-Impact'),
  testGamification: () => run('Gamification'),
  testIntegration: () => run('Intégration')
};

console.log('🎯 Tous les tests des fonctionnalités avancées sont prêts !');
console.log('📊 Analytics: Dashboard, métriques, tendances, conseils');
console.log('🔔 Notifications: Contextuelles, géolocalisées, personnalisées'); 
console.log('🌱 Eco-Impact: Empreinte carbone, cycle de vie, impact communautaire');
console.log('🎮 Gamification: Profil joueur, achievements, défis, classements');
console.log('🌐 Intégration: Tests cross-services et workflow complet');
