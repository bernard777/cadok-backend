/**
 * 📦 ROUTES ADMIN - GESTION DES OBJETS
 * API complète pour la supervision des objets de la plateforme
 * Accès contrôlé par rôles (admin, super_admin)
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requirePermission } = require('../../middleware/roleBasedAccess');

// Modèles
const ObjectModel = require('../../models/Object');
const User = require('../../models/User');
const Trade = require('../../models/Trade');

/**
 * GET /api/admin/objects
 * Récupérer tous les objets avec filtres et pagination
 */
router.get('/', requireAuth, requirePermission('manageObjects'), async (req, res) => {
  try {
    const {
      status,
      category,
      search,
      limit = 50,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('📦 [ADMIN OBJECTS] Récupération des objets...');

    // Construction de la requête
    let query = {};

    // Filtre par statut
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filtre par catégorie
    if (category && category !== 'all') {
      query.category = category;
    }

    // Recherche textuelle
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Récupération avec population
    const objects = await ObjectModel.find(query)
      .populate('owner', 'pseudo email avatar city')
      .populate('category', 'name icon')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Statistiques rapides
    const totalObjects = await ObjectModel.countDocuments(query);
    const activeObjects = await ObjectModel.countDocuments({...query, status: 'available'});
    const pendingObjects = await ObjectModel.countDocuments({...query, status: 'reserved'});
    const reportedObjects = await ObjectModel.countDocuments({...query, status: 'traded'});

    // Formatage des données
    const formattedObjects = objects.map(obj => ({
      _id: obj._id,
      title: obj.title,
      description: obj.description,
      images: obj.images || [],
      category: obj.category,
      status: obj.status,
      condition: obj.condition,
      estimatedValue: obj.estimatedValue,
      owner: obj.owner ? {
        _id: obj.owner._id,
        pseudo: obj.owner.pseudo,
        email: obj.owner.email,
        avatar: obj.owner.avatar,
        city: obj.owner.city
      } : null,
      location: obj.location,
      created: obj.createdAt,
      updated: obj.updatedAt,
      reported: obj.reported || false,
      views: obj.views || 0,
      likes: obj.likes?.length || 0,
      isActive: obj.status === 'available'
    }));

    res.json({
      success: true,
      objects: formattedObjects,
      pagination: {
        total: totalObjects,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalObjects > (parseInt(skip) + parseInt(limit))
      },
      statistics: {
        total: totalObjects,
        active: activeObjects,
        pending: pendingObjects,
        reported: reportedObjects
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN OBJECTS] Erreur récupération objets:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des objets'
    });
  }
});

/**
 * GET /api/admin/objects/stats
 * Statistiques détaillées des objets
 */
router.get('/stats', requireAuth, requirePermission('viewAnalytics'), async (req, res) => {
  try {
    console.log('📊 [ADMIN OBJECTS] Calcul des statistiques...');

    // Statistiques générales
    const totalObjects = await ObjectModel.countDocuments();
    const activeObjects = await ObjectModel.countDocuments({ status: 'available' });
    const pendingObjects = await ObjectModel.countDocuments({ status: 'reserved' });
    const inactiveObjects = await ObjectModel.countDocuments({ status: 'inactive' });
    const reportedObjects = await ObjectModel.countDocuments({ status: 'traded' });

    // Statistiques par catégorie
    const categoryStats = await ObjectModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgValue: { $avg: '$estimatedValue' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Objets créés par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await ObjectModel.aggregate([
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
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top propriétaires par nombre d'objets
    const topOwners = await ObjectModel.aggregate([
      {
        $group: {
          _id: '$owner',
          objectCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      },
      {
        $sort: { objectCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      statistics: {
        overview: {
          total: totalObjects,
          active: activeObjects,
          pending: pendingObjects,
          inactive: inactiveObjects,
          reported: reportedObjects
        },
        categories: categoryStats,
        monthly: monthlyStats,
        topOwners: topOwners
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ADMIN OBJECTS] Erreur calcul statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du calcul des statistiques'
    });
  }
});

/**
 * GET /api/admin/objects/:id
 * Détails complets d'un objet
 */
router.get('/:id', requireAuth, requirePermission('viewObjects'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📦 [ADMIN OBJECTS] Récupération objet ${id}...`);

    const object = await ObjectModel.findById(id)
      .populate('owner', 'pseudo email avatar city phone subscriptionPlan')
      .populate('category', 'name icon description')
      .populate('likes', 'pseudo avatar')
      .lean();

    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Objet non trouvé'
      });
    }

    // Historique des échanges pour cet objet
    const tradeHistory = await Trade.find({
      $or: [
        { requestedObjects: id },
        { offeredObjects: id }
      ]
    })
    .populate('fromUser', 'pseudo avatar')
    .populate('toUser', 'pseudo avatar')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    res.json({
      success: true,
      object: {
        ...object,
        tradeHistory: tradeHistory
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN OBJECTS] Erreur récupération objet:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'objet'
    });
  }
});

/**
 * PUT /api/admin/objects/:id/status
 * Modifier le statut d'un objet
 */
router.put('/:id/status', requireAuth, requirePermission('moderateContent'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['available', 'traded', 'reserved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide. Statuts autorisés: ' + validStatuses.join(', ')
      });
    }

    const object = await ObjectModel.findByIdAndUpdate(
      id,
      { 
        status,
        moderationReason: reason,
        moderatedAt: new Date(),
        moderatedBy: req.user.id
      },
      { new: true }
    );

    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Objet non trouvé'
      });
    }

    console.log(`📦 [ADMIN OBJECTS] Statut objet ${id} modifié: ${status}`);

    res.json({
      success: true,
      message: 'Statut modifié avec succès',
      object
    });

  } catch (error) {
    console.error('❌ [ADMIN OBJECTS] Erreur modification statut:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification du statut'
    });
  }
});

/**
 * DELETE /api/admin/objects/:id
 * Supprimer un objet
 */
router.delete('/:id', requireAuth, requirePermission('manageObjects'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const object = await ObjectModel.findById(id);
    if (!object) {
      return res.status(404).json({
        success: false,
        error: 'Objet non trouvé'
      });
    }

    // Vérifier s'il y a des échanges en cours
    const activeTrades = await Trade.countDocuments({
      $or: [
        { requestedObjects: id },
        { offeredObjects: id }
      ],
      status: { $in: ['reserved', 'accepted', 'in_progress'] }
    });

    if (activeTrades > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un objet avec des échanges en cours'
      });
    }

    await ObjectModel.findByIdAndDelete(id);

    console.log(`📦 [ADMIN OBJECTS] Objet ${id} supprimé. Raison: ${reason}`);

    res.json({
      success: true,
      message: 'Objet supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ [ADMIN OBJECTS] Erreur suppression objet:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'objet'
    });
  }
});

module.exports = router;
