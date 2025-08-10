/**
 * 🎪 MIDDLEWARE DE VALIDATION ÉVÉNEMENTS - CADOK
 * Validation et sécurité pour les opérations sur les événements
 */

const Event = require('../models/Event');

/**
 * 🔒 Middleware pour empêcher les inscriptions multiples
 * Vérifie si l'utilisateur participe déjà à un événement
 */
const preventDuplicateParticipation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    console.log(`[VALIDATION] Vérification inscription multiple - User: ${userId}, Event: ${eventId}`);
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Événement non trouvé',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    // Vérifier si l'utilisateur participe déjà
    const existingParticipant = event.participants.find(
      participant => participant.userId.toString() === userId.toString()
    );
    
    if (existingParticipant) {
      console.log(`[VALIDATION BLOCKED] Inscription multiple tentée par ${userId} pour l'événement ${eventId}`);
      return res.status(409).json({
        success: false,
        error: 'Vous participez déjà à cet événement',
        code: 'ALREADY_PARTICIPATING',
        participation: {
          joinedAt: existingParticipant.joinedAt,
          progress: existingParticipant.progress
        }
      });
    }
    
    // Ajouter l'événement aux données de la requête pour éviter une requête supplémentaire
    req.event = event;
    next();
    
  } catch (error) {
    console.error('[VALIDATION ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de validation',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * ⏰ Middleware pour vérifier si un événement est dans sa période active
 */
const validateEventTiming = async (req, res, next) => {
  try {
    // Si l'événement est déjà dans req (via preventDuplicateParticipation)
    const event = req.event || await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Événement non trouvé',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    const now = new Date();
    
    // Vérifier si l'événement est actif
    if (!event.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Cet événement n\'est pas actif',
        code: 'EVENT_NOT_ACTIVE'
      });
    }
    
    // Vérifier si l'événement a commencé
    if (now < event.startDate) {
      return res.status(403).json({
        success: false,
        error: 'Cet événement n\'a pas encore commencé',
        code: 'EVENT_NOT_STARTED',
        startDate: event.startDate
      });
    }
    
    // Vérifier si l'événement n'est pas terminé
    if (now > event.endDate) {
      return res.status(410).json({
        success: false,
        error: 'Cet événement est terminé',
        code: 'EVENT_ENDED',
        endDate: event.endDate
      });
    }
    
    req.event = event;
    next();
    
  } catch (error) {
    console.error('[TIMING VALIDATION ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de validation temporelle',
      code: 'TIMING_VALIDATION_ERROR'
    });
  }
};

/**
 * 👤 Middleware pour vérifier que l'utilisateur participe à un événement
 * Utilisé pour les actions qui nécessitent une participation (compléter des défis, etc.)
 */
const requireEventParticipation = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    const event = req.event || await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Événement non trouvé',
        code: 'EVENT_NOT_FOUND'
      });
    }
    
    const participant = event.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        error: 'Vous devez participer à cet événement pour effectuer cette action',
        code: 'PARTICIPATION_REQUIRED'
      });
    }
    
    // Ajouter les informations de participation à la requête
    req.event = event;
    req.participation = participant;
    next();
    
  } catch (error) {
    console.error('[PARTICIPATION VALIDATION ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Erreur de validation de participation',
      code: 'PARTICIPATION_VALIDATION_ERROR'
    });
  }
};

/**
 * 📊 Middleware pour enregistrer les tentatives d'inscriptions multiples (analytics)
 */
const logDuplicateAttempts = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Si c'est une tentative d'inscription multiple, l'enregistrer
    if (data && !data.success && data.code === 'ALREADY_PARTICIPATING') {
      console.log(`[ANALYTICS] Tentative d'inscription multiple - User: ${req.user.id}, Event: ${req.params.eventId}, Time: ${new Date().toISOString()}`);
      
      // Ici on pourrait envoyer vers un système d'analytics
      // ou incrémenter un compteur dans la base de données
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * 🎯 Validation complète pour inscription aux événements
 * Combine toutes les validations nécessaires
 */
const validateEventParticipation = [
  logDuplicateAttempts,
  preventDuplicateParticipation,
  validateEventTiming
];

module.exports = {
  preventDuplicateParticipation,
  validateEventTiming,
  requireEventParticipation,
  logDuplicateAttempts,
  validateEventParticipation
};
