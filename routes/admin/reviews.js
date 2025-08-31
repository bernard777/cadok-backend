/**
 * ⭐ ROUTES ADMIN - GESTION DES AVIS
 * API complète pour la supervision des avis et évaluations
 * Accès contrôlé par rôles (admin, super_admin)
 */

const express = require('express');

const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');

// Modèles
const Review = require('../../models/Review');
const User = require('../../models/User');
const Trade = require('../../models/Trade');

/**
 * GET /api/admin/reviews
 * Récupérer tous les avis avec filtres et pagination
 */
router.get('/', requireAuth, requirePermission('manageReviews'), async (req, res) => {
  try {
    const {
      rating,
      reported,
      search,
      limit = 50,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('⭐ [ADMIN REVIEWS] Récupération des avis...');

    // Construction de la requête
    let query = {};

    // Filtre par note
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    // Filtre par statut signalé
    if (reported && reported !== 'all') {
      query.reported = reported === 'true';
    }

    // Recherche textuelle
    if (search) {
      query.$or = [
        { comment: { $regex: search, $options: 'i' } }
      ];
    }

    // Récupération avec population
    const reviews = await Review.find(query)
      .populate('reviewer', 'pseudo email avatar city')
      .populate('reviewee', 'pseudo email avatar city')
      .populate('trade', 'status createdAt')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Statistiques rapides
    const totalReviews = await Review.countDocuments(query);
    const reportedReviews = await Review.countDocuments({...query, reported: true});
    const avgRating = await Review.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    // Formatage des données
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      reviewer: {
        _id: review.reviewer._id,
        pseudo: review.reviewer.pseudo,
        email: review.reviewer.email,
        avatar: review.reviewer.avatar,
        city: review.reviewer.city
      },
      reviewee: {
        _id: review.reviewee._id,
        pseudo: review.reviewee.pseudo,
        email: review.reviewee.email,
        avatar: review.reviewee.avatar,
        city: review.reviewee.city
      },
      trade: review.trade,
      reported: review.reported || false,
      reportReason: review.reportReason,
      created: review.createdAt,
      updated: review.updatedAt
    }));

    res.json({
      success: true,
      reviews: formattedReviews,
      pagination: {
        total: totalReviews,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalReviews > (parseInt(skip) + parseInt(limit))
      },
      statistics: {
        total: totalReviews,
        reported: reportedReviews,
        averageRating: avgRating[0]?.avgRating || 0
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN REVIEWS] Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des avis'
    });
  }
});

/**
 * GET /api/admin/reviews/stats
 * Statistiques détaillées des avis
 */
router.get('/stats', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📊 [ADMIN REVIEWS] Calcul des statistiques...');

    // Statistiques générales
    const totalReviews = await Review.countDocuments();
    const reportedReviews = await Review.countDocuments({ reported: true });

    // Distribution des notes
    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Note moyenne globale
    const avgRatingResult = await Review.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Avis par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyReviews = await Review.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top utilisateurs par nombre d'avis reçus
    const topReviewees = await Review.aggregate([
      {
        $group: {
          _id: '$reviewee',
          reviewCount: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $sort: { reviewCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      statistics: {
        overview: {
          total: totalReviews,
          reported: reportedReviews,
          averageRating: avgRatingResult[0]?.avgRating || 0
        },
        ratingDistribution,
        monthly: monthlyReviews,
        topReviewees
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ADMIN REVIEWS] Erreur calcul statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du calcul des statistiques'
    });
  }
});

/**
 * GET /api/admin/reviews/:id
 * Détails complets d'un avis
 */
router.get('/:id', requireAuth, requirePermission('viewReviews'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`⭐ [ADMIN REVIEWS] Récupération avis ${id}...`);

    const review = await Review.findById(id)
      .populate('reviewer', 'pseudo email avatar city phone')
      .populate('reviewee', 'pseudo email avatar city phone')
      .populate('trade', 'status requestedObjects offeredObjects createdAt')
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Avis non trouvé'
      });
    }

    // Autres avis entre les mêmes utilisateurs
    const relatedReviews = await Review.find({
      $or: [
        { reviewer: review.reviewer._id, reviewee: review.reviewee._id },
        { reviewer: review.reviewee._id, reviewee: review.reviewer._id }
      ],
      _id: { $ne: id }
    })
    .populate('reviewer', 'pseudo avatar')
    .populate('reviewee', 'pseudo avatar')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      review: {
        ...review,
        relatedReviews
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN REVIEWS] Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'avis'
    });
  }
});

/**
 * PUT /api/admin/reviews/:id/moderate
 * Modérer un avis (masquer/afficher)
 */
router.put('/:id/moderate', requireAuth, requirePermission('moderateContent'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'hide', 'show', 'delete'

    const validActions = ['hide', 'show', 'delete'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action invalide'
      });
    }

    let updateData = {
      moderatedAt: new Date(),
      moderatedBy: req.user.id,
      moderationReason: reason
    };

    if (action === 'hide') {
      updateData.hidden = true;
    } else if (action === 'show') {
      updateData.hidden = false;
    }

    if (action === 'delete') {
      await Review.findByIdAndDelete(id);
      console.log(`⭐ [ADMIN REVIEWS] Avis ${id} supprimé. Raison: ${reason}`);
      return res.json({
        success: true,
        message: 'Avis supprimé avec succès'
      });
    }

    const review = await Review.findByIdAndUpdate(id, updateData, { new: true });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Avis non trouvé'
      });
    }

    console.log(`⭐ [ADMIN REVIEWS] Avis ${id} modéré: ${action}`);

    res.json({
      success: true,
      message: `Avis ${action === 'hide' ? 'masqué' : 'affiché'} avec succès`,
      review
    });

  } catch (error) {
    console.error('❌ [ADMIN REVIEWS] Erreur modération avis:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modération de l\'avis'
    });
  }
});

/**
 * POST /api/admin/reviews/:id/respond
 * Répondre officiellement à un avis
 */
router.post('/:id/respond', requireAuth, requirePermission('manageReviews'), async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Réponse requise'
      });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      {
        adminResponse: response,
        adminResponseDate: new Date(),
        adminResponseBy: req.user.id
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Avis non trouvé'
      });
    }

    console.log(`⭐ [ADMIN REVIEWS] Réponse ajoutée à l'avis ${id}`);

    res.json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      review
    });

  } catch (error) {
    console.error('❌ [ADMIN REVIEWS] Erreur ajout réponse:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'ajout de la réponse'
    });
  }
});

module.exports = router;
