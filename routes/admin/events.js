/**
 * 🎪 ADMINISTRATION DES ÉVÉNEMENTS - CADOK
 * Interface d'administration pour créer et gérer les événements gamification
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const { 
  requireEventManagement, 
  logAdminAction 
} = require('../../middlewares/adminAuth');
const GamificationService = require('../../services/gamificationService');

const gamificationService = new GamificationService();

/**
 * 🛡️ Middleware admin - Remplacé par le système d'authentification centralisé
 * Les middlewares requireEventManagement et logAdminAction sont maintenant utilisés
 */

/**
 * GET /api/admin/events
 * Liste tous les événements (actifs et à venir)
 */
router.get('/', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    console.log('📊 [DEBUG] Récupération événements admin...');
    
    const allEvents = await gamificationService.getAllEvents();
    const currentDate = new Date();
    
    console.log('📋 [DEBUG] Total événements trouvés:', allEvents.length);
    
    // Séparer les événements par statut
    const activeEvents = allEvents.filter(event => {
      const isInDateRange = currentDate >= event.startDate && currentDate <= event.endDate;
      const isActiveStatus = event.isActive === true;
      console.log(`🔍 [DEBUG] ${event.name}: dateRange=${isInDateRange}, active=${isActiveStatus}`);
      return isActiveStatus && isInDateRange;
    });
    
    const upcomingEvents = allEvents.filter(event => {
      const isFuture = currentDate < event.startDate;
      const isCurrentButInactive = (currentDate >= event.startDate && currentDate <= event.endDate && !event.isActive);
      console.log(`📅 [DEBUG] ${event.name}: future=${isFuture}, currentInactive=${isCurrentButInactive}`);
      return isFuture || isCurrentButInactive;
    });
    
    const pastEvents = allEvents.filter(event => {
      const isPast = currentDate > event.endDate;
      console.log(`📚 [DEBUG] ${event.name}: past=${isPast}`);
      return isPast;
    });
    
    console.log('✅ [DEBUG] Événements actifs:', activeEvents.length);
    console.log('📅 [DEBUG] Événements futurs:', upcomingEvents.length);
    console.log('📚 [DEBUG] Événements passés:', pastEvents.length);
    
    // Convertir au format attendu par l'interface mobile
    const formatEvent = (event) => ({
      id: event._id || event.id,
      name: event.name,
      description: event.description,
      theme: event.theme,
      icon: event.icon,
      color: event.color,
      startDate: event.startDate,
      endDate: event.endDate,
      bonusMultiplier: event.bonusMultiplier,
      isActive: event.isActive,
      participants: Array.isArray(event.participants) ? event.participants.length : 0,
      completedChallenges: event.statistics?.totalTrades || 0,
      specialRewards: event.specialRewards
    });
    
    const response = {
      success: true,
      active: activeEvents.map(formatEvent),
      upcoming: upcomingEvents.map(formatEvent),
      past: pastEvents.map(formatEvent),
      statistics: await gamificationService.getEventsStatistics()
    };
    
    console.log('📤 [DEBUG] Réponse envoyée:', JSON.stringify(response, null, 2));
    
    // Log de consultation
    logAdminAction(req, 'events_viewed', 'Viewed events dashboard');
    
    res.json(response);
  } catch (error) {
    console.error('❌ Erreur admin événements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/events
 * Créer un nouvel événement
 */
router.post('/', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    const eventData = req.body;
    
    // Ajouter l'ID de l'utilisateur créateur
    eventData.createdBy = req.user.id;
    
    console.log('🎪 [DEBUG] Création événement avec createdBy:', req.user.id);
    
    // Validation des données
    const validationErrors = validateEventData(eventData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données invalides', 
        details: validationErrors 
      });
    }

    const newEvent = await gamificationService.createEvent(eventData);
    
    // Log de l'action admin
    logAdminAction(req, 'event_created', `Event "${newEvent.name}" created`, { eventId: newEvent._id });
    
    res.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('❌ Erreur création événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/admin/events/:eventId
 * Modifier un événement existant
 */
router.put('/:eventId', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;
    
    const updatedEvent = await gamificationService.updateEvent(eventId, updateData);
    
    // Log de modification
    logAdminAction(req, 'event_updated', `Event "${updatedEvent.name}" updated`, { eventId });
    
    res.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('❌ Erreur modification événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/admin/events/:eventId
 * Supprimer un événement
 */
router.delete('/:eventId', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('🗑️ [DEBUG] Début suppression événement:', eventId);
    
    // Récupérer les infos avant suppression
    const event = await gamificationService.getEventById(eventId);
    console.log('📋 [DEBUG] Événement trouvé:', event?.name || 'Inconnu');
    
    await gamificationService.deleteEvent(eventId);
    console.log('✅ [DEBUG] Suppression terminée');
    
    // Log de suppression
    logAdminAction(req, 'event_deleted', `Event "${event?.name || eventId}" deleted`, { eventId });
    
    res.json({ success: true, message: 'Événement supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/events/:eventId/activate
 * Activer/Désactiver un événement manuellement
 */
router.post('/:eventId/activate', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { active } = req.body;
    
    const result = await gamificationService.toggleEventStatus(eventId, active);
    
    // Log d'activation/désactivation
    logAdminAction(req, 'event_status_changed', 
      `Event "${result.name}" ${active ? 'activated' : 'deactivated'}`, 
      { eventId, newStatus: active }
    );
    
    res.json({ success: true, event: result });
  } catch (error) {
    console.error('❌ Erreur activation événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/admin/events/:eventId/analytics
 * Statistiques détaillées d'un événement
 */
router.get('/:eventId/analytics', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    const { eventId } = req.params;
    const analytics = await gamificationService.getEventAnalytics(eventId);
    
    // Log de consultation analytics
    logAdminAction(req, 'event_analytics_viewed', `Viewed analytics for event ${eventId}`, { eventId });
    
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('❌ Erreur analytics événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * POST /api/admin/events/templates/:templateId/create
 * Créer un événement basé sur un template
 */
router.post('/templates/:templateId/create', authMiddleware, requireEventManagement, async (req, res) => {
  try {
    const { templateId } = req.params;
    const customizations = req.body;
    
    const event = await gamificationService.createEventFromTemplate(templateId, customizations);
    
    // Log de création depuis template
    logAdminAction(req, 'event_created_from_template', 
      `Event "${event.name}" created from template "${templateId}"`, 
      { eventId: event._id, templateId }
    );
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('❌ Erreur template événement:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * 📋 TEMPLATES D'ÉVÉNEMENTS PRÉDÉFINIS
 */
router.get('/templates', authMiddleware, requireEventManagement, (req, res) => {
  const templates = getEventTemplates();
  
  // Log de consultation templates
  logAdminAction(req, 'event_templates_viewed', 'Viewed event templates');
  
  res.json({ success: true, templates });
});

/**
 * 🔧 FONCTIONS UTILITAIRES
 */

function validateEventData(eventData) {
  const errors = [];
  
  if (!eventData.name) errors.push('Nom de l\'événement requis');
  if (!eventData.startDate) errors.push('Date de début requise');
  if (!eventData.endDate) errors.push('Date de fin requise');
  if (new Date(eventData.startDate) >= new Date(eventData.endDate)) {
    errors.push('Date de fin doit être après la date de début');
  }
  if (!eventData.theme) errors.push('Thème requis');
  if (!eventData.bonusMultiplier || eventData.bonusMultiplier < 1) {
    errors.push('Multiplicateur de bonus invalide');
  }
  
  return errors;
}

function getEventTemplates() {
  return [
    {
      id: 'ecology_week',
      name: 'Semaine Écologique',
      description: 'Événement axé sur les échanges verts',
      duration: 7, // jours
      theme: 'ecology',
      icon: '🌿',
      defaultChallenges: [
        'Échanger 5 objets écologiques',
        'Ajouter 10 plantes à sa collection',
        'Participer à 3 discussions environnement'
      ],
      bonusMultiplier: 1.5
    },
    {
      id: 'seasonal_celebration',
      name: 'Célébration Saisonnière',
      description: 'Événement adaptatif selon la saison',
      duration: 14,
      theme: 'seasonal',
      icon: '🎉',
      defaultChallenges: [
        'Partager des objets de saison',
        'Décorer son profil',
        'Inviter 2 nouveaux amis'
      ],
      bonusMultiplier: 1.8
    },
    {
      id: 'mega_challenge',
      name: 'Méga Défi Communautaire',
      description: 'Grand événement compétitif',
      duration: 30,
      theme: 'competition',
      icon: '🏆',
      hasGlobalGoal: true,
      bonusMultiplier: 2.5
    }
  ];
}

module.exports = router;
