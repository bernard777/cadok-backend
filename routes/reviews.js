const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Review = require('../models/Review');
const Trade = require('../models/Trade');
const User = require('../models/User');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/roleBasedAccess');

// ========================================
// 📝 CRÉATION D'UNE REVIEW
// ========================================

/**
 * POST /api/reviews
 * Créer une nouvelle review pour un échange
 */
router.post('/', [
  requireAuth,
  body('tradeId').isMongoId().withMessage('ID échange invalide'),
  body('revieweeId').isMongoId().withMessage('ID utilisateur invalide'),
  body('overallRating').isInt({ min: 1, max: 5 }).withMessage('Note globale doit être entre 1 et 5'),
  body('ratings.communication').isInt({ min: 1, max: 5 }).withMessage('Note communication invalide'),
  body('ratings.objectCondition').isInt({ min: 1, max: 5 }).withMessage('Note état objet invalide'),
  body('ratings.deliverySpeed').isInt({ min: 1, max: 5 }).withMessage('Note rapidité invalide'),
  body('ratings.reliability').isInt({ min: 1, max: 5 }).withMessage('Note fiabilité invalide'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Commentaire trop long'),
  body('tags').optional().isArray().withMessage('Tags doivent être un tableau')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { tradeId, revieweeId, overallRating, ratings, comment, tags } = req.body;
    const reviewerId = req.user.id;

    // Vérifier si l'utilisateur peut donner cette review
    const canReview = await Review.canUserReview(tradeId, reviewerId);
    if (!canReview.can) {
      return res.status(403).json({ 
        message: 'Impossible de donner cette évaluation',
        reason: canReview.reason 
      });
    }

    // Créer la review
    const review = new Review({
      trade: tradeId,
      reviewer: reviewerId,
      reviewee: revieweeId,
      overallRating,
      ratings,
      comment,
      tags: tags || []
    });

    await review.save();
    
    // Populer les données pour la réponse
    await review.populate([
      { path: 'reviewer', select: 'pseudo avatar' },
      { path: 'reviewee', select: 'pseudo avatar' },
      { path: 'trade', select: 'requestedObjects offeredObjects status' }
    ]);

    res.status(201).json({
      message: 'Évaluation créée avec succès',
      review
    });

  } catch (error) {
    console.error('Erreur création review:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création de l\'évaluation' 
    });
  }
});

// ========================================
// 📖 RÉCUPÉRATION DES REVIEWS
// ========================================

/**
 * GET /api/reviews/user/:userId
 * Récupérer toutes les reviews d'un utilisateur (reçues)
 */
router.get('/user/:userId', [
  param('userId').isMongoId().withMessage('ID utilisateur invalide'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite invalide'),
  query('sort').optional().isIn(['recent', 'rating', 'helpful']).withMessage('Tri invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Paramètres invalides', 
        errors: errors.array() 
      });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'recent';

    // Définir l'ordre de tri
    let sortOptions = { createdAt: -1 }; // Par défaut: plus récent
    if (sort === 'rating') {
      sortOptions = { overallRating: -1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortOptions = { 'helpfulVotes.helpful': -1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    // Récupérer les reviews
    const reviews = await Review.find({ 
      reviewee: userId, 
      status: 'published' 
    })
    .populate('reviewer', 'pseudo avatar')
    .populate('trade', 'requestedObjects.title offeredObjects.title')
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .lean();

    // Compter le total
    const total = await Review.countDocuments({ 
      reviewee: userId, 
      status: 'published' 
    });

    // Calculer les statistiques
    const userStats = await Review.calculateUserRating(userId);

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      statistics: userStats
    });

  } catch (error) {
    console.error('Erreur récupération reviews utilisateur:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des évaluations' 
    });
  }
});

/**
 * GET /api/reviews/trade/:tradeId
 * Récupérer les reviews d'un échange spécifique
 */
router.get('/trade/:tradeId', [
  requireAuth,
  param('tradeId').isMongoId().withMessage('ID échange invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'ID échange invalide', 
        errors: errors.array() 
      });
    }

    const { tradeId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de l'échange
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: 'Échange non trouvé' });
    }

    const isParticipant = trade.requester.toString() === userId || 
                         trade.owner.toString() === userId;
    
    if (!isParticipant) {
      return res.status(403).json({ 
        message: 'Accès refusé - vous ne faites pas partie de cet échange' 
      });
    }

    // Récupérer les reviews de cet échange
    const reviews = await Review.find({ trade: tradeId })
      .populate('reviewer', 'pseudo avatar')
      .populate('reviewee', 'pseudo avatar')
      .sort({ createdAt: -1 });

    res.json({ reviews });

  } catch (error) {
    console.error('Erreur récupération reviews échange:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des évaluations' 
    });
  }
});

/**
 * GET /api/reviews/my-reviews
 * Récupérer les reviews données par l'utilisateur connecté
 */
router.get('/my-reviews', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewer: userId })
      .populate('reviewee', 'pseudo avatar')
      .populate('trade', 'requestedObjects.title offeredObjects.title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ reviewer: userId });

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur récupération mes reviews:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération de vos évaluations' 
    });
  }
});

// ========================================
// 🔄 MODIFICATION D'UNE REVIEW
// ========================================

/**
 * PUT /api/reviews/:reviewId
 * Modifier une review existante (dans les 24h)
 */
router.put('/:reviewId', [
  requireAuth,
  param('reviewId').isMongoId().withMessage('ID review invalide'),
  body('overallRating').optional().isInt({ min: 1, max: 5 }).withMessage('Note globale invalide'),
  body('ratings.communication').optional().isInt({ min: 1, max: 5 }),
  body('ratings.objectCondition').optional().isInt({ min: 1, max: 5 }),
  body('ratings.deliverySpeed').optional().isInt({ min: 1, max: 5 }),
  body('ratings.reliability').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Commentaire trop long'),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    // Vérifier que c'est le bon utilisateur
    if (review.reviewer.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez modifier que vos propres évaluations' 
      });
    }

    // Vérifier la limite de temps (24h)
    const dayAgo = new Date();
    dayAgo.setHours(dayAgo.getHours() - 24);
    
    if (review.createdAt < dayAgo) {
      return res.status(403).json({ 
        message: 'Impossible de modifier une évaluation après 24h' 
      });
    }

    // Mettre à jour les champs autorisés
    const updateFields = ['overallRating', 'ratings', 'comment', 'tags'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    await review.save();
    
    await review.populate([
      { path: 'reviewer', select: 'pseudo avatar' },
      { path: 'reviewee', select: 'pseudo avatar' }
    ]);

    res.json({
      message: 'Évaluation modifiée avec succès',
      review
    });

  } catch (error) {
    console.error('Erreur modification review:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la modification' 
    });
  }
});

// ========================================
// 👍 VOTES D'UTILITÉ
// ========================================

/**
 * POST /api/reviews/:reviewId/vote
 * Voter pour l'utilité d'une review
 */
router.post('/:reviewId/vote', [
  requireAuth,
  param('reviewId').isMongoId().withMessage('ID review invalide'),
  body('vote').isIn(['helpful', 'not_helpful']).withMessage('Vote invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { reviewId } = req.params;
    const { vote } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    // Supprimer tout vote précédent de cet utilisateur
    review.helpfulVotes.helpful = review.helpfulVotes.helpful.filter(
      v => v.user.toString() !== userId
    );
    review.helpfulVotes.notHelpful = review.helpfulVotes.notHelpful.filter(
      v => v.user.toString() !== userId
    );

    // Ajouter le nouveau vote
    if (vote === 'helpful') {
      review.helpfulVotes.helpful.push({ user: userId });
    } else {
      review.helpfulVotes.notHelpful.push({ user: userId });
    }

    await review.save();

    res.json({
      message: 'Vote enregistré',
      helpfulCount: review.helpfulVotes.helpful.length,
      notHelpfulCount: review.helpfulVotes.notHelpful.length,
      helpfulnessScore: review.helpfulnessScore
    });

  } catch (error) {
    console.error('Erreur vote review:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors du vote' 
    });
  }
});

// ========================================
// 💬 RÉPONSE À UNE REVIEW
// ========================================

/**
 * POST /api/reviews/:reviewId/response
 * Répondre à une review reçue
 */
router.post('/:reviewId/response', [
  requireAuth,
  param('reviewId').isMongoId().withMessage('ID review invalide'),
  body('content').isLength({ min: 1, max: 500 }).withMessage('Réponse invalide (1-500 caractères)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { reviewId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    // Vérifier que c'est le reviewee qui répond
    if (review.reviewee.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Vous ne pouvez répondre qu\'aux évaluations vous concernant' 
      });
    }

    // Vérifier qu'il n'y a pas déjà une réponse
    if (review.response && review.response.content) {
      return res.status(400).json({ 
        message: 'Vous avez déjà répondu à cette évaluation' 
      });
    }

    review.response = {
      content,
      submittedAt: new Date()
    };

    await review.save();

    res.json({
      message: 'Réponse ajoutée avec succès',
      response: review.response
    });

  } catch (error) {
    console.error('Erreur réponse review:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de l\'ajout de la réponse' 
    });
  }
});

// ========================================
// 🚩 SIGNALEMENT D'UNE REVIEW
// ========================================

/**
 * POST /api/reviews/:reviewId/report
 * Signaler une review inappropriée
 */
router.post('/:reviewId/report', [
  requireAuth,
  param('reviewId').isMongoId().withMessage('ID review invalide'),
  body('reason').isIn(['inappropriate', 'fake', 'spam', 'abusive', 'irrelevant']).withMessage('Raison invalide'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description trop longue')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors: errors.array() 
      });
    }

    const { reviewId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    // Vérifier que l'utilisateur n'a pas déjà signalé cette review
    const existingReport = review.reports.find(
      report => report.reportedBy.toString() === userId
    );

    if (existingReport) {
      return res.status(400).json({ 
        message: 'Vous avez déjà signalé cette évaluation' 
      });
    }

    review.reports.push({
      reportedBy: userId,
      reason,
      description
    });

    await review.save();

    res.json({ message: 'Signalement enregistré' });

  } catch (error) {
    console.error('Erreur signalement review:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors du signalement' 
    });
  }
});

// ========================================
// 📊 STATISTIQUES
// ========================================

/**
 * GET /api/reviews/stats/:userId
 * Récupérer les statistiques détaillées d'un utilisateur
 */
router.get('/stats/:userId', [
  param('userId').isMongoId().withMessage('ID utilisateur invalide')
], async (req, res) => {
  try {
    const { userId } = req.params;

    const [basicStats, detailedStats] = await Promise.all([
      Review.calculateUserRating(userId),
      Review.aggregate([
        { $match: { reviewee: new mongoose.Types.ObjectId(userId), status: 'published' } },
        {
          $group: {
            _id: null,
            avgCommunication: { $avg: '$ratings.communication' },
            avgObjectCondition: { $avg: '$ratings.objectCondition' },
            avgDeliverySpeed: { $avg: '$ratings.deliverySpeed' },
            avgReliability: { $avg: '$ratings.reliability' },
            totalHelpfulVotes: { $sum: { $size: '$helpfulVotes.helpful' } },
            recentReviews: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const stats = {
      ...basicStats,
      detailedRatings: detailedStats[0] ? {
        communication: Math.round(detailedStats[0].avgCommunication * 10) / 10,
        objectCondition: Math.round(detailedStats[0].avgObjectCondition * 10) / 10,
        deliverySpeed: Math.round(detailedStats[0].avgDeliverySpeed * 10) / 10,
        reliability: Math.round(detailedStats[0].avgReliability * 10) / 10
      } : null,
      engagement: {
        totalHelpfulVotes: detailedStats[0]?.totalHelpfulVotes || 0,
        recentReviews: detailedStats[0]?.recentReviews || 0
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('Erreur stats reviews:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors du calcul des statistiques' 
    });
  }
});

module.exports = router;
