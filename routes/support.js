const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const mongoose = require('mongoose');

// Modèles
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const FAQ = require('../models/FAQ');
const Tutorial = require('../models/Tutorial');

// ========== STATISTIQUES GÉNÉRALES DU SUPPORT ==========
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalTickets: await SupportTicket.countDocuments(),
      resolvedTickets: await SupportTicket.countDocuments({ status: 'resolved' }),
      avgResponseTime: '2h', // À calculer dynamiquement plus tard
      supportRating: 4.9,
      activeTickets: await SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      lastUpdate: new Date()
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur récupération stats support:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GESTION DES TICKETS DE SUPPORT ==========

// Créer un nouveau ticket
router.post('/tickets', auth, async (req, res) => {
  try {
    const {
      type,
      priority,
      subject,
      description,
      email,
      attachments = [],
      userInfo = {},
      diagnosticData
    } = req.body;

    // Validation
    if (!subject || !description || !email) {
      return res.status(400).json({
        success: false,
        message: 'Sujet, description et email sont requis'
      });
    }

    // Générer un numéro de ticket unique
    const ticketNumber = `KADOC-${Date.now().toString().slice(-6)}`;

    const ticket = new SupportTicket({
      ticketNumber,
      user: req.user.id,
      type: type || 'general',
      priority: priority || 'normal',
      subject: subject.trim(),
      description: description.trim(),
      email: email.trim(),
      attachments,
      userInfo: {
        ...userInfo,
        pseudo: req.user.pseudo,
        city: req.user.city,
        subscriptionStatus: req.user.subscriptionStatus
      },
      diagnosticData,
      status: 'open',
      createdAt: new Date()
    });

    await ticket.save();

    // TODO: Envoyer email de confirmation à l'utilisateur
    // TODO: Notifier l'équipe support selon la priorité

    console.log(`✅ Nouveau ticket créé: ${ticketNumber} - ${type} - ${priority}`);

    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        estimatedResponseTime: getEstimatedResponseTime(priority)
      }
    });

  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du ticket'
    });
  }
});

// Récupérer les tickets d'un utilisateur
router.get('/tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('ticketNumber type priority subject status createdAt updatedAt');

    res.json({
      success: true,
      tickets: tickets.map(ticket => ({
        ...ticket.toObject(),
        estimatedResponseTime: getEstimatedResponseTime(ticket.priority)
      }))
    });

  } catch (error) {
    console.error('Erreur récupération tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Récupérer un ticket spécifique
router.get('/tickets/:ticketId', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket
      .findOne({ 
        _id: req.params.ticketId, 
        user: req.user.id 
      })
      .populate('user', 'pseudo email')
      .populate('messages.from', 'pseudo');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    res.json({ success: true, ticket });

  } catch (error) {
    console.error('Erreur récupération ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ajouter un message à un ticket
router.post('/tickets/:ticketId/messages', auth, async (req, res) => {
  try {
    const { message, attachments = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message requis'
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      user: req.user.id
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    ticket.messages.push({
      from: req.user.id,
      message: message.trim(),
      attachments,
      isFromUser: true,
      createdAt: new Date()
    });

    ticket.status = 'awaiting_response';
    ticket.updatedAt = new Date();

    await ticket.save();

    res.json({
      success: true,
      message: 'Message ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur ajout message ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== FAQ DYNAMIQUE ==========

// Récupérer toutes les FAQs
router.get('/faq', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    let faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

    // Recherche textuelle si spécifiée
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      faqs = faqs.filter(faq => 
        searchRegex.test(faq.question) ||
        searchRegex.test(faq.answer) ||
        faq.tags.some(tag => searchRegex.test(tag))
      );
    }

    res.json({
      success: true,
      faqs: faqs.map(faq => ({
        id: faq._id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        tags: faq.tags,
        viewCount: faq.viewCount,
        helpfulCount: faq.helpfulCount,
        order: faq.order
      }))
    });

  } catch (error) {
    console.error('Erreur récupération FAQ:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Marquer une FAQ comme utile
router.post('/faq/:faqId/helpful', auth, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.faqId);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ non trouvée'
      });
    }

    // Éviter les votes multiples du même utilisateur
    if (!faq.helpfulUsers.includes(req.user.id)) {
      faq.helpfulUsers.push(req.user.id);
      faq.helpfulCount = faq.helpfulUsers.length;
      await faq.save();
    }

    res.json({ success: true, helpfulCount: faq.helpfulCount });

  } catch (error) {
    console.error('Erreur vote FAQ:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Incrémenter le compteur de vues d'une FAQ
router.post('/faq/:faqId/view', async (req, res) => {
  try {
    await FAQ.findByIdAndUpdate(
      req.params.faqId,
      { $inc: { viewCount: 1 } }
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Erreur incrémentation vue FAQ:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== TUTORIELS ==========

// Récupérer tous les tutoriels
router.get('/tutorials', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    const tutorials = await Tutorial
      .find(query)
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      tutorials: tutorials.map(tutorial => ({
        id: tutorial._id,
        category: tutorial.category,
        title: tutorial.title,
        description: tutorial.description,
        duration: tutorial.duration,
        difficulty: tutorial.difficulty,
        thumbnail: tutorial.thumbnail,
        videoUrl: tutorial.videoUrl,
        steps: tutorial.steps,
        tags: tutorial.tags,
        viewCount: tutorial.viewCount,
        rating: tutorial.rating,
        order: tutorial.order
      }))
    });

  } catch (error) {
    console.error('Erreur récupération tutoriels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Marquer un tutoriel comme vu
router.post('/tutorials/:tutorialId/view', auth, async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.tutorialId);
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Tutoriel non trouvé'
      });
    }

    // Incrémenter vues et ajouter à l'historique utilisateur
    tutorial.viewCount += 1;
    if (!tutorial.viewedBy.includes(req.user.id)) {
      tutorial.viewedBy.push(req.user.id);
    }
    await tutorial.save();

    // Mettre à jour l'historique utilisateur
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { 
        'tutorialsViewed': {
          tutorial: req.params.tutorialId,
          viewedAt: new Date()
        }
      }
    });

    res.json({ success: true, viewCount: tutorial.viewCount });

  } catch (error) {
    console.error('Erreur vue tutoriel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Noter un tutoriel
router.post('/tutorials/:tutorialId/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Note requise entre 1 et 5'
      });
    }

    const tutorial = await Tutorial.findById(req.params.tutorialId);
    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message: 'Tutoriel non trouvé'
      });
    }

    // Éviter les notes multiples du même utilisateur
    const existingRating = tutorial.ratings.find(r => r.user.toString() === req.user.id);
    
    if (existingRating) {
      existingRating.rating = rating;
    } else {
      tutorial.ratings.push({
        user: req.user.id,
        rating,
        createdAt: new Date()
      });
    }

    // Recalculer la moyenne
    const totalRating = tutorial.ratings.reduce((sum, r) => sum + r.rating, 0);
    tutorial.rating = Math.round((totalRating / tutorial.ratings.length) * 10) / 10;

    await tutorial.save();

    res.json({ 
      success: true, 
      rating: tutorial.rating,
      totalRatings: tutorial.ratings.length
    });

  } catch (error) {
    console.error('Erreur notation tutoriel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== DIAGNOSTIC SYSTÈME ==========

// Health check pour le diagnostic
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Endpoint de test pour vérifier la connectivité
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date()
  });
});

// ========== FONCTIONS UTILITAIRES ==========

function getEstimatedResponseTime(priority) {
  switch (priority) {
    case 'urgent': return '< 2h';
    case 'high': return '2-8h';
    case 'normal': return '12-24h';
    case 'low': return '24-48h';
    default: return '12-24h';
  }
}

module.exports = router;
