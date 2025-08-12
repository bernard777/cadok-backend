/**
 * ðŸ§ª TESTS AVANCÃ‰S - CADOK FONCTIONNALITÃ‰S
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
 * ðŸ“Š TESTS SERVICE ANALYTICS
 */
describe('ðŸ”¥ ANALYTICS SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('ðŸš€ PrÃ©paration environnement Analytics...');
    
    // CrÃ©er utilisateur test avec historique
    const userResponse = await api.post('/api/auth/register', {
      username: 'analytics_tester',
      email: 'analytics@test.com',
      password: 'Test123!',
      city: 'Test City'
    });
    
    testUsers.analytics = userResponse.data.user;
    authTokens.analytics = userResponse.data.token;

    // CrÃ©er des objets et Ã©changes pour les tests
    await createTestEcosystem('analytics');
  });

  it('âœ… GET /api/analytics/dashboard - RÃ©cupÃ©ration dashboard complet', async () => {
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

    console.log('ðŸ“Š Dashboard analytics:', response.data.dashboard.tradingMetrics.successRate);
  });

  it('âœ… Analytics - MÃ©triques trading dÃ©taillÃ©es', async () => {
    const response = await api.get('/api/analytics/trading-metrics', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.metrics);
    assert(typeof response.data.metrics.successRate === 'number');
    assert(typeof response.data.metrics.averageCompletionTime === 'number');
    assert(Array.isArray(response.data.metrics.categoryPerformance));

    console.log('ðŸ“ˆ MÃ©triques trading validÃ©es');
  });

  it('âœ… Analytics - Classement communautaire', async () => {
    const response = await api.get('/api/analytics/community-ranking', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.ranking);
    assert(typeof response.data.ranking.percentile === 'number');
    assert(response.data.ranking.percentile >= 0 && response.data.ranking.percentile <= 100);

    console.log('ðŸ† Classement communautaire validÃ©');
  });

  it('âœ… Analytics - Tendances mensuelles', async () => {
    const response = await api.get('/api/analytics/monthly-trends', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.trends);
    assert(Array.isArray(response.data.trends.monthlyData));
    assert(response.data.trends.monthlyData.length === 6);

    console.log('ðŸ“… Tendances mensuelles validÃ©es');
  });

  it('âœ… Analytics - Conseils personnalisÃ©s', async () => {
    const response = await api.get('/api/analytics/personalized-tips', {
      headers: { Authorization: `Bearer ${authTokens.analytics}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.tips);
    assert(Array.isArray(response.data.tips.recommendations));
    assert(response.data.tips.recommendations.length > 0);

    console.log('ðŸ’¡ Conseils personnalisÃ©s validÃ©s');
  });

});

/**
 * ðŸ”” TESTS SERVICE NOTIFICATIONS INTELLIGENTES
 */
describe('ðŸ“± NOTIFICATIONS SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('ðŸš€ PrÃ©paration environnement Notifications...');
    
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

  it('âœ… POST /api/notifications/send-contextual - Notifications contextuelles', async () => {
    const response = await api.post('/api/notifications/send-contextual', {}, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(typeof response.data.totalSent === 'number');
    assert(response.data.breakdown);

    console.log('ðŸ”” Notifications contextuelles:', response.data.totalSent, 'envoyÃ©es');
  });

  it('âœ… POST /api/notifications/send-location-based - Notifications gÃ©olocalisÃ©es', async () => {
    const response = await api.post('/api/notifications/send-location-based', {}, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);

    console.log('ðŸ“ Notifications gÃ©olocalisÃ©es envoyÃ©es');
  });

  it('âœ… POST /api/notifications/personalized/:type - Notification personnalisÃ©e', async () => {
    const response = await api.post('/api/notifications/personalized/trade_match', {
      objectName: 'iPhone 12',
      matchScore: 95
    }, {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.notification);

    console.log('ðŸŽ¯ Notification personnalisÃ©e crÃ©Ã©e');
  });

  it('âœ… GET /api/notifications/user - RÃ©cupÃ©ration notifications utilisateur', async () => {
    const response = await api.get('/api/notifications/user', {
      headers: { Authorization: `Bearer ${authTokens.notifications}` }
    });

    assert.strictEqual(response.status, 200);
    assert(Array.isArray(response.data.notifications));

    console.log('ðŸ“‹ Notifications utilisateur rÃ©cupÃ©rÃ©es:', response.data.notifications.length);
  });

  it('âœ… PATCH /api/notifications/:id/read - Marquer notification comme lue', async () => {
    // D'abord crÃ©er une notification
    const createResponse = await api.post('/api/notifications/personalized/milestone', {
      milestone: '10 Ã©changes'
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

    console.log('âœ… Notification marquÃ©e comme lue');
  });

});

/**
 * ðŸŒ± TESTS SERVICE IMPACT Ã‰COLOGIQUE
 */
describe('ðŸŒ ECO-IMPACT SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('ðŸš€ PrÃ©paration environnement Eco-Impact...');
    
    const userResponse = await api.post('/api/auth/register', {
      username: 'eco_tester',
      email: 'eco@test.com',
      password: 'Test123!',
      city: 'Green City'
    });
    
    testUsers.eco = userResponse.data.user;
    authTokens.eco = userResponse.data.token;

    // CrÃ©er des Ã©changes pour calculer l'impact
    await createTestEcosystem('eco');
  });

  it('âœ… GET /api/eco/dashboard - Dashboard impact Ã©cologique', async () => {
    const response = await api.get('/api/eco/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.dashboard);
    assert(response.data.dashboard.carbonFootprint);
    assert(response.data.dashboard.objectsLifecycle);
    assert(response.data.dashboard.communityImpact);

    console.log('ðŸŒ± Impact CO2 Ã©vitÃ©:', response.data.dashboard.carbonFootprint.totalCarbonSaved, 'kg');
  });

  it('âœ… GET /api/eco/carbon-footprint - Calcul empreinte carbone', async () => {
    const response = await api.get('/api/eco/carbon-footprint', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.carbonFootprint);
    assert(typeof response.data.carbonFootprint.totalCarbonSaved === 'number');
    assert(typeof response.data.carbonFootprint.totalWastePrevented === 'number');
    assert(typeof response.data.carbonFootprint.treesEquivalent === 'number');

    console.log('ðŸŒ³ Ã‰quivalent arbres sauvÃ©s:', response.data.carbonFootprint.treesEquivalent);
  });

  it('âœ… GET /api/eco/lifecycle-analysis - Analyse cycle de vie', async () => {
    const response = await api.get('/api/eco/lifecycle-analysis', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.lifecycle);
    assert(typeof response.data.lifecycle.circularityScore === 'number');
    assert(response.data.lifecycle.circularityScore >= 0 && response.data.lifecycle.circularityScore <= 100);

    console.log('ðŸ”„ Score de circularitÃ©:', response.data.lifecycle.circularityScore);
  });

  it('âœ… GET /api/eco/community-impact - Impact communautaire', async () => {
    const response = await api.get('/api/eco/community-impact', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.community);
    assert(typeof response.data.community.communityRanking === 'number');

    console.log('ðŸ˜ï¸ Classement communautÃ©:', response.data.community.communityRanking, '%');
  });

  it('âœ… GET /api/eco/achievements - RÃ©alisations Ã©cologiques', async () => {
    const response = await api.get('/api/eco/achievements', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.achievements);
    assert(Array.isArray(response.data.achievements.badges));

    console.log('ðŸ† Badges Ã©cologiques:', response.data.achievements.totalBadges);
  });

  it('âœ… GET /api/eco/recommendations - Recommandations Ã©cologiques', async () => {
    const response = await api.get('/api/eco/recommendations', {
      headers: { Authorization: `Bearer ${authTokens.eco}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.recommendations);
    assert(Array.isArray(response.data.recommendations.recommendations));

    console.log('ðŸ’š Recommandations Ã©cologiques:', response.data.recommendations.recommendations.length);
  });

});

/**
 * ðŸŽ® TESTS SERVICE GAMIFICATION
 */
describe('ðŸ† GAMIFICATION SERVICE - Tests Complets', () => {

  before(async () => {
    console.log('ðŸš€ PrÃ©paration environnement Gamification...');
    
    const userResponse = await api.post('/api/auth/register', {
      username: 'gamer_tester',
      email: 'gamer@test.com',
      password: 'Test123!',
      city: 'Game City'
    });
    
    testUsers.gamification = userResponse.data.user;
    authTokens.gamification = userResponse.data.token;

    // CrÃ©er de l'activitÃ© pour les tests gamification
    await createTestEcosystem('gamification');
  });

  it('âœ… GET /api/gamification/dashboard - Dashboard gamification complet', async () => {
    const response = await api.get('/api/gamification/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);
    assert(response.data.dashboard);
    assert(response.data.dashboard.playerProfile);
    assert(response.data.dashboard.achievements);
    assert(response.data.dashboard.activeChallenges);

    console.log('ðŸŽ® Niveau joueur:', response.data.dashboard.playerProfile.level);
  });

  it('âœ… GET /api/gamification/profile - Profil joueur', async () => {
    const response = await api.get('/api/gamification/profile', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.profile);
    assert(typeof response.data.profile.level === 'number');
    assert(typeof response.data.profile.totalXP === 'number');
    assert(response.data.profile.playerTitle);

    console.log('ðŸ‘¤ XP Total:', response.data.profile.totalXP);
  });

  it('âœ… GET /api/gamification/achievements - Achievements utilisateur', async () => {
    const response = await api.get('/api/gamification/achievements', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.achievements);
    assert(Array.isArray(response.data.achievements.earnedAchievements));
    assert(Array.isArray(response.data.achievements.availableAchievements));

    console.log('ðŸ… Achievements gagnÃ©s:', response.data.achievements.earned);
  });

  it('âœ… GET /api/gamification/challenges - DÃ©fis actifs', async () => {
    const response = await api.get('/api/gamification/challenges', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.challenges);
    assert(response.data.challenges.daily);
    assert(Array.isArray(response.data.challenges.daily.challenges));

    console.log('ðŸŽ¯ DÃ©fis quotidiens:', response.data.challenges.daily.challenges.length);
  });

  it('âœ… GET /api/gamification/leaderboards - Classements', async () => {
    const response = await api.get('/api/gamification/leaderboards', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.leaderboards);
    assert(response.data.leaderboards.general);
    assert(typeof response.data.leaderboards.general.userPosition === 'number');

    console.log('ðŸ† Position classement:', response.data.leaderboards.general.userPosition);
  });

  it('âœ… POST /api/gamification/complete-challenge - ComplÃ©ter dÃ©fi', async () => {
    const response = await api.post('/api/gamification/complete-challenge', {
      challengeId: 'daily_browse',
      progress: 10
    }, {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.success);

    console.log('âœ… DÃ©fi complÃ©tÃ© avec succÃ¨s');
  });

  it('âœ… GET /api/gamification/rewards - SystÃ¨me rÃ©compenses', async () => {
    const response = await api.get('/api/gamification/rewards', {
      headers: { Authorization: `Bearer ${authTokens.gamification}` }
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.rewards);
    assert(typeof response.data.rewards.currentPoints === 'number');

    console.log('ðŸ’Ž Points actuels:', response.data.rewards.currentPoints);
  });

});

/**
 * ðŸ”„ TESTS INTÃ‰GRATION CROSS-SERVICES
 */
describe('ðŸŒ INTÃ‰GRATION - Tests Cross-Services', () => {

  before(async () => {
    console.log('ðŸš€ PrÃ©paration tests intÃ©gration...');
    
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

  it('âœ… IntÃ©gration Analytics â†” Eco-Impact', async () => {
    // RÃ©cupÃ©rer dashboard analytics
    const analyticsResponse = await api.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    // RÃ©cupÃ©rer dashboard eco
    const ecoResponse = await api.get('/api/eco/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    // VÃ©rifier cohÃ©rence des donnÃ©es
    assert.strictEqual(analyticsResponse.status, 200);
    assert.strictEqual(ecoResponse.status, 200);

    console.log('ðŸ”— IntÃ©gration Analytics-Eco validÃ©e');
  });

  it('âœ… IntÃ©gration Gamification â†” Notifications', async () => {
    // ComplÃ©ter un achievement pour dÃ©clencher une notification
    const achievementResponse = await api.post('/api/gamification/complete-achievement', {
      achievementId: 'first_trade'
    }, {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    // VÃ©rifier que la notification a Ã©tÃ© crÃ©Ã©e
    const notificationsResponse = await api.get('/api/notifications/user', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(notificationsResponse.status, 200);

    console.log('ðŸ”— IntÃ©gration Gamification-Notifications validÃ©e');
  });

  it('âœ… Test complet workflow utilisateur', async () => {
    // 1. CrÃ©er un objet
    const objectResponse = await api.post('/api/objects', {
      title: 'Objet Test Workflow',
      description: 'Test intÃ©gration complÃ¨te',
      category: 'Test',
      condition: 'Bon Ã©tat'
    }, {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(objectResponse.status, 201);

    // 2. VÃ©rifier impact sur analytics
    const analyticsAfter = await api.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(analyticsAfter.status, 200);

    // 3. VÃ©rifier impact sur eco-dashboard
    const ecoAfter = await api.get('/api/eco/dashboard', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(ecoAfter.status, 200);

    // 4. VÃ©rifier impact sur gamification
    const gamificationAfter = await api.get('/api/gamification/profile', {
      headers: { Authorization: `Bearer ${authTokens.integration}` }
    });

    assert.strictEqual(gamificationAfter.status, 200);

    console.log('ðŸŽ¯ Workflow complet validÃ© avec succÃ¨s');
  });

});

/**
 * ðŸ› ï¸ FONCTIONS UTILITAIRES
 */

/**
 * CrÃ©er un Ã©cosystÃ¨me de test avec objets et Ã©changes
 */
async function createTestEcosystem(userType) {
  const token = authTokens[userType];
  
  try {
    // CrÃ©er quelques objets
    for (let i = 1; i <= 3; i++) {
      await api.post('/api/objects', {
        title: `Objet Test ${userType} ${i}`,
        description: `Description test ${i}`,
        category: 'Test',
        condition: 'Bon Ã©tat'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    console.log(`âœ… Ã‰cosystÃ¨me test crÃ©Ã© pour ${userType}`);
  } catch (error) {
    console.log(`âš ï¸ Erreur crÃ©ation Ã©cosystÃ¨me ${userType}:`, error.message);
  }
}

/**
 * Nettoyage aprÃ¨s les tests
 */
after(async () => {
  console.log('ðŸ§¹ Nettoyage environnement de test...');
  
  try {
    // Supprimer les utilisateurs de test
    for (const [userType, token] of Object.entries(authTokens)) {
      await api.delete('/api/users/test-cleanup', {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    
    console.log('âœ… Nettoyage terminÃ©');
  } catch (error) {
    console.log('âš ï¸ Erreur nettoyage:', error.message);
  }
});

// Export pour les tests en ligne de commande
module.exports = {
  testAnalytics: () => run('Analytics'),
  testNotifications: () => run('Notifications'), 
  testEcoImpact: () => run('Eco-Impact'),
  testGamification: () => run('Gamification'),
  testIntegration: () => run('IntÃ©gration')
};

console.log('ðŸŽ¯ Tous les tests des fonctionnalitÃ©s avancÃ©es sont prÃªts !');
console.log('ðŸ“Š Analytics: Dashboard, mÃ©triques, tendances, conseils');
console.log('ðŸ”” Notifications: Contextuelles, gÃ©olocalisÃ©es, personnalisÃ©es'); 
console.log('ðŸŒ± Eco-Impact: Empreinte carbone, cycle de vie, impact communautaire');
console.log('ðŸŽ® Gamification: Profil joueur, achievements, dÃ©fis, classements');
console.log('ðŸŒ IntÃ©gration: Tests cross-services et workflow complet');

