const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/roleBasedAccess');

// ========================================
// 📋 RÉCUPÉRATION DES ÉVÉNEMENTS PUBLICS
// ========================================

/**
 * GET /api/events
 * Récupérer tous les événements disponibles pour les utilisateurs
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('🎪 [DEBUG] Récupération événements pour utilisateur:', req.user.id);

    const now = new Date();
    
    // Récupérer tous les événements avec participants populés
    const [activeEvents, upcomingEvents, pastEvents] = await Promise.all([
      Event.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      }).populate('participants.userId', 'pseudo avatar').sort({ startDate: 1 }),
      
      Event.find({
        startDate: { $gt: now }
      }).populate('participants.userId', 'pseudo avatar').sort({ startDate: 1 }),
      
      Event.find({
        endDate: { $lt: now }
      }).populate('participants.userId', 'pseudo avatar').sort({ endDate: -1 }).limit(10)
    ]);

    // Vérifier les participations de l'utilisateur
    const userId = req.user.id;
    const userParticipations = {};

    [...activeEvents, ...upcomingEvents, ...pastEvents].forEach(event => {
      const isParticipating = event.participants.some(p => 
        p.userId._id.toString() === userId
      );
      userParticipations[event._id.toString()] = isParticipating;
    });

    // Formater les événements pour l'interface mobile
    const formatEvent = (event) => ({
      id: event._id,
      name: event.name,
      description: event.description,
      theme: event.theme,
      icon: event.icon,
      color: event.color,
      startDate: event.startDate,
      endDate: event.endDate,
      bonusMultiplier: event.bonusMultiplier,
      isActive: event.isActive,
      participants: event.participants.length,
      participantsList: event.participants.map(p => ({
        id: p.userId._id,
        pseudo: p.userId.pseudo,
        avatar: p.userId.avatar,
        joinedAt: p.joinedAt,
        progress: p.progress
      })),
      globalGoal: event.globalGoal,
      specialRewards: event.specialRewards,
      statistics: event.statistics,
      canParticipate: event.isActive && now >= event.startDate && now <= event.endDate,
      isParticipating: userParticipations[event._id.toString()] || false
    });

    const response = {
      success: true,
      events: {
        active: activeEvents.map(formatEvent),
        upcoming: upcomingEvents.map(formatEvent),
        past: pastEvents.map(formatEvent)
      },
      userParticipations,
      totalActiveEvents: activeEvents.length,
      totalUpcomingEvents: upcomingEvents.length
    };

    console.log('✅ [DEBUG] Événements formatés envoyés:', {
      active: activeEvents.length,
      upcoming: upcomingEvents.length,
      past: pastEvents.length
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Erreur récupération événements:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des événements' 
    });
  }
});

/**
 * GET /api/events/:eventId
 * Récupérer les détails d'un événement spécifique
 */
router.get('/:eventId', [
  requireAuth,
  param('eventId').isMongoId().withMessage('ID événement invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'ID événement invalide', 
        errors: errors.array() 
      });
    }

    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId)
      .populate('participants.userId', 'pseudo avatar gamification.level gamification.xp')
      .populate('createdBy', 'pseudo avatar');

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Événement non trouvé' 
      });
    }

    // Vérifier la participation de l'utilisateur
    const userParticipation = event.participants.find(p => 
      p.userId._id.toString() === userId
    );

    const now = new Date();
    const response = {
      success: true,
      event: {
        id: event._id,
        name: event.name,
        description: event.description,
        theme: event.theme,
        icon: event.icon,
        color: event.color,
        startDate: event.startDate,
        endDate: event.endDate,
        bonusMultiplier: event.bonusMultiplier,
        isActive: event.isActive,
        categories: event.categories,
        globalGoal: event.globalGoal,
        specialRewards: event.specialRewards,
        statistics: event.statistics,
        createdBy: {
          id: event.createdBy._id,
          pseudo: event.createdBy.pseudo,
          avatar: event.createdBy.avatar
        },
        participants: {
          total: event.participants.length,
          list: event.participants.map(p => ({
            id: p.userId._id,
            pseudo: p.userId.pseudo,
            avatar: p.userId.avatar,
            level: p.userId.gamification?.level || 1,
            xp: p.userId.gamification?.xp || 0,
            joinedAt: p.joinedAt,
            progress: p.progress
          }))
        },
        status: {
          canParticipate: event.isActive && now >= event.startDate && now <= event.endDate,
          hasStarted: now >= event.startDate,
          hasEnded: now > event.endDate,
          isParticipating: !!userParticipation,
          daysRemaining: Math.max(0, Math.ceil((event.endDate - now) / (1000 * 60 * 60 * 24)))
        },
        userProgress: userParticipation ? userParticipation.progress : null
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Erreur récupération détails événement:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des détails' 
    });
  }
});

// ========================================
// 🎯 PARTICIPATION AUX ÉVÉNEMENTS
// ========================================

/**
 * POST /api/events/:eventId/participate
 * S'inscrire à un événement
 */
router.post('/:eventId/participate', [
  requireAuth,
  param('eventId').isMongoId().withMessage('ID événement invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'ID événement invalide', 
        errors: errors.array() 
      });
    }

    const { eventId } = req.params;
    const userId = req.user.id;

    console.log(`🎯 [DEBUG] Tentative participation - User: ${userId}, Event: ${eventId}`);

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Événement non trouvé' 
      });
    }

    // Vérifications de validité
    if (!event.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet événement n\'est pas actif',
        code: 'EVENT_NOT_ACTIVE'
      });
    }

    const now = new Date();
    if (now < event.startDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet événement n\'a pas encore commencé',
        code: 'EVENT_NOT_STARTED',
        startDate: event.startDate
      });
    }

    if (now > event.endDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet événement est terminé',
        code: 'EVENT_ENDED',
        endDate: event.endDate
      });
    }

    // Vérifier si l'utilisateur participe déjà
    const existingParticipant = event.participants.find(p => 
      p.userId.toString() === userId
    );

    if (existingParticipant) {
      return res.status(400).json({ 
        success: false,
        message: 'Vous participez déjà à cet événement',
        code: 'ALREADY_PARTICIPATING',
        participation: {
          joinedAt: existingParticipant.joinedAt,
          progress: existingParticipant.progress
        }
      });
    }

    // Ajouter la participation
    event.participants.push({
      userId: userId,
      joinedAt: new Date(),
      progress: {
        challengesCompleted: 0,
        xpEarned: 0,
        tradesCompleted: 0
      }
    });

    // Mettre à jour les statistiques
    event.statistics.totalParticipants = event.participants.length;
    await event.save();

    console.log(`✅ [DEBUG] Participation réussie - Event: ${event.name}, Total participants: ${event.participants.length}`);

    // Mettre à jour les informations utilisateur si nécessaire
    const user = await User.findById(userId);
    if (user && user.gamification) {
      user.gamification.eventsParticipated = (user.gamification.eventsParticipated || 0) + 1;
      await user.save();
    }

    res.json({
      success: true,
      message: `Inscription réussie à l'événement: ${event.name}`,
      participation: {
        eventId: event._id,
        eventName: event.name,
        joinedAt: new Date(),
        participantNumber: event.participants.length,
        bonusMultiplier: event.bonusMultiplier,
        endDate: event.endDate
      }
    });

  } catch (error) {
    console.error('❌ Erreur participation événement:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur technique lors de l\'inscription' 
    });
  }
});

/**
 * DELETE /api/events/:eventId/participate
 * Se désinscrire d'un événement
 */
router.delete('/:eventId/participate', [
  requireAuth,
  param('eventId').isMongoId().withMessage('ID événement invalide')
], async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Événement non trouvé' 
      });
    }

    // Vérifier si l'utilisateur participe
    const participantIndex = event.participants.findIndex(p => 
      p.userId.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({ 
        success: false,
        message: 'Vous ne participez pas à cet événement' 
      });
    }

    // Empêcher la désinscription si l'événement a commencé et que l'utilisateur a du progrès
    const participant = event.participants[participantIndex];
    const hasProgress = participant.progress.challengesCompleted > 0 || 
                       participant.progress.tradesCompleted > 0;

    if (hasProgress && new Date() >= event.startDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Impossible de se désinscrire après avoir commencé à participer',
        code: 'HAS_PROGRESS'
      });
    }

    // Supprimer la participation
    event.participants.splice(participantIndex, 1);
    event.statistics.totalParticipants = event.participants.length;
    await event.save();

    res.json({
      success: true,
      message: `Désinscription réussie de l'événement: ${event.name}`
    });

  } catch (error) {
    console.error('❌ Erreur désinscription événement:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur technique lors de la désinscription' 
    });
  }
});

// ========================================
// 📊 STATISTIQUES ET CLASSEMENTS
// ========================================

/**
 * GET /api/events/:eventId/leaderboard
 * Récupérer le classement d'un événement
 */
router.get('/:eventId/leaderboard', [
  requireAuth,
  param('eventId').isMongoId().withMessage('ID événement invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide')
], async (req, res) => {
  try {
    const { eventId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const event = await Event.findById(eventId)
      .populate('participants.userId', 'pseudo avatar gamification.level');

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Événement non trouvé' 
      });
    }

    // Trier les participants par XP gagné dans l'événement
    const leaderboard = event.participants
      .map((p, index) => ({
        rank: index + 1,
        user: {
          id: p.userId._id,
          pseudo: p.userId.pseudo,
          avatar: p.userId.avatar,
          level: p.userId.gamification?.level || 1
        },
        progress: p.progress,
        joinedAt: p.joinedAt,
        totalScore: p.progress.xpEarned + (p.progress.tradesCompleted * 10)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // Position de l'utilisateur actuel
    const userPosition = leaderboard.findIndex(item => 
      item.user.id.toString() === req.user.id
    );

    res.json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        theme: event.theme,
        endDate: event.endDate
      },
      leaderboard,
      userPosition: userPosition !== -1 ? userPosition + 1 : null,
      totalParticipants: event.participants.length
    });

  } catch (error) {
    console.error('❌ Erreur classement événement:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération du classement' 
    });
  }
});

/**
 * GET /api/events/my-participations
 * Récupérer les participations de l'utilisateur connecté
 */
router.get('/my-participations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Récupérer tous les événements où l'utilisateur participe
    const events = await Event.find({
      'participants.userId': userId
    })
    .populate('participants.userId', 'pseudo avatar')
    .sort({ startDate: -1 });

    const participations = events.map(event => {
      const userParticipation = event.participants.find(p => 
        p.userId._id.toString() === userId
      );

      return {
        event: {
          id: event._id,
          name: event.name,
          theme: event.theme,
          icon: event.icon,
          startDate: event.startDate,
          endDate: event.endDate,
          bonusMultiplier: event.bonusMultiplier,
          isActive: event.isActive
        },
        participation: {
          joinedAt: userParticipation.joinedAt,
          progress: userParticipation.progress,
          participantNumber: event.participants.findIndex(p => 
            p.userId._id.toString() === userId
          ) + 1,
          totalParticipants: event.participants.length
        },
        status: {
          isActive: event.isActive && now >= event.startDate && now <= event.endDate,
          hasEnded: now > event.endDate,
          daysRemaining: Math.max(0, Math.ceil((event.endDate - now) / (1000 * 60 * 60 * 24)))
        }
      };
    });

    // Séparer par statut
    const activeParticipations = participations.filter(p => p.status.isActive);
    const pastParticipations = participations.filter(p => p.status.hasEnded);
    const upcomingParticipations = participations.filter(p => 
      !p.status.isActive && !p.status.hasEnded
    );

    res.json({
      success: true,
      participations: {
        active: activeParticipations,
        upcoming: upcomingParticipations,
        past: pastParticipations
      },
      statistics: {
        totalParticipations: participations.length,
        activeParticipations: activeParticipations.length,
        totalXpEarned: participations.reduce((sum, p) => 
          sum + p.participation.progress.xpEarned, 0
        ),
        totalTradesCompleted: participations.reduce((sum, p) => 
          sum + p.participation.progress.tradesCompleted, 0
        )
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération participations:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des participations' 
    });
  }
});

module.exports = router;
