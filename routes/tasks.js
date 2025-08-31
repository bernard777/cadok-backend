/**
 * 🎯 ROUTES DES TÂCHES QUOTIDIENNES - CADOK
 * API pour les tâches d'événements et récompenses
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/roleBasedAccess');
const DailyTaskService = require('../services/DailyTaskService');

const dailyTaskService = new DailyTaskService();

/**
 * GET /api/tasks/daily
 * Récupérer les tâches quotidiennes de l'utilisateur
 */
router.get('/daily', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    console.log(`🎯 [DEBUG] Récupération tâches quotidiennes - User: ${userId}, Date: ${date}`);
    
    const userTasks = await dailyTaskService.getUserDailyTasks(userId, date);
    
    // Formater pour l'interface
    const formattedTasks = userTasks.map(({ task, event, progress }) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      difficulty: task.difficulty,
      targetValue: task.targetValue,
      currentProgress: progress.currentProgress,
      status: progress.status,
      rewards: task.calculateReward(event.bonusMultiplier),
      event: {
        id: event._id,
        name: event.name,
        theme: event.theme,
        icon: event.icon,
        color: event.color,
        bonusMultiplier: event.bonusMultiplier,
        realWorldEvent: event.realWorldEvent
      },
      canClaim: progress.status === 'completed',
      progressPercentage: Math.round((progress.currentProgress / task.targetValue) * 100),
      completedAt: progress.completedAt,
      claimedAt: progress.claimedAt
    }));
    
    // Statistiques du jour
    const dailyStats = {
      totalTasks: formattedTasks.length,
      completedTasks: formattedTasks.filter(t => t.status === 'completed' || t.status === 'claimed').length,
      claimedTasks: formattedTasks.filter(t => t.status === 'claimed').length,
      totalXPAvailable: formattedTasks.reduce((sum, t) => sum + t.rewards.xp, 0),
      totalXPEarned: formattedTasks.filter(t => t.status === 'claimed').reduce((sum, t) => sum + t.rewards.xp, 0)
    };
    
    console.log(`✅ [DEBUG] Tâches récupérées: ${formattedTasks.length}, Complétées: ${dailyStats.completedTasks}`);
    
    res.json({
      success: true,
      date,
      tasks: formattedTasks,
      dailyStats
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération tâches quotidiennes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des tâches' 
    });
  }
});

/**
 * POST /api/tasks/:taskId/claim
 * Réclamer les récompenses d'une tâche terminée
 */
router.post('/:taskId/claim', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    
    console.log(`🎁 [DEBUG] Réclamation récompenses - User: ${userId}, Task: ${taskId}`);
    
    const rewards = await dailyTaskService.claimTaskRewards(userId, taskId);
    
    console.log(`✅ [DEBUG] Récompenses réclamées:`, rewards);
    
    res.json({
      success: true,
      message: 'Récompenses réclamées avec succès !',
      rewards
    });
    
  } catch (error) {
    console.error('❌ Erreur réclamation récompenses:', error);
    
    let statusCode = 500;
    let message = 'Erreur serveur lors de la réclamation';
    
    if (error.message === 'Tâche non terminée') {
      statusCode = 400;
      message = 'Cette tâche n\'est pas encore terminée';
    } else if (error.message === 'Récompenses déjà réclamées') {
      statusCode = 400;
      message = 'Les récompenses ont déjà été réclamées';
    } else if (error.message === 'Progression de tâche non trouvée') {
      statusCode = 404;
      message = 'Tâche non trouvée';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: message 
    });
  }
});

/**
 * POST /api/tasks/action
 * Traiter une action utilisateur pour les tâches
 */
router.post('/action', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { actionType, actionData } = req.body;
    
    console.log(`⚡ [DEBUG] Action utilisateur - User: ${userId}, Action: ${actionType}`);
    
    await dailyTaskService.processUserAction(userId, actionType, actionData);
    
    res.json({
      success: true,
      message: 'Action traitée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur traitement action:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors du traitement de l\'action' 
    });
  }
});

/**
 * GET /api/tasks/user/stats
 * Récupérer les statistiques de tâches de l'utilisateur
 */
router.get('/user/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period } = req.query; // 'week', 'month', 'all'
    
    console.log(`📊 [DEBUG] Statistiques tâches utilisateur - User: ${userId}, Period: ${period}`);
    
    // Calculer les dates selon la période
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      default:
        startDate = new Date('2020-01-01'); // Toutes les données
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Récupérer les progressions de l'utilisateur
    const UserTaskProgress = require('../models/UserTaskProgress');
    const progressions = await UserTaskProgress.find({
      userId,
      date: { $gte: startDateStr, $lte: endDateStr }
    }).populate('taskId', 'title difficulty rewards')
      .populate('eventId', 'name theme');
    
    // Calculer les statistiques
    const stats = {
      totalTasks: progressions.length,
      completedTasks: progressions.filter(p => p.status === 'completed' || p.status === 'claimed').length,
      claimedTasks: progressions.filter(p => p.status === 'claimed').length,
      totalXPEarned: progressions.filter(p => p.status === 'claimed').reduce((sum, p) => sum + p.rewardsReceived.xp, 0),
      totalCoinsEarned: progressions.filter(p => p.status === 'claimed').reduce((sum, p) => sum + p.rewardsReceived.coins, 0),
      badgesEarned: progressions.filter(p => p.status === 'claimed' && p.rewardsReceived.badge).length,
      byDifficulty: {
        easy: progressions.filter(p => p.taskId?.difficulty === 'easy').length,
        medium: progressions.filter(p => p.taskId?.difficulty === 'medium').length,
        hard: progressions.filter(p => p.taskId?.difficulty === 'hard').length
      },
      byEvent: {}
    };
    
    // Calculer les stats par événement
    progressions.forEach(p => {
      if (p.eventId) {
        const eventName = p.eventId.name;
        if (!stats.byEvent[eventName]) {
          stats.byEvent[eventName] = { total: 0, completed: 0, claimed: 0 };
        }
        stats.byEvent[eventName].total++;
        if (p.status === 'completed' || p.status === 'claimed') {
          stats.byEvent[eventName].completed++;
        }
        if (p.status === 'claimed') {
          stats.byEvent[eventName].claimed++;
        }
      }
    });
    
    stats.completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
    stats.claimRate = stats.completedTasks > 0 ? Math.round((stats.claimedTasks / stats.completedTasks) * 100) : 0;
    
    console.log(`✅ [DEBUG] Statistiques calculées: ${stats.totalTasks} tâches, ${stats.completionRate}% complétées`);
    
    res.json({
      success: true,
      period,
      dateRange: { start: startDateStr, end: endDateStr },
      stats
    });
    
  } catch (error) {
    console.error('❌ Erreur statistiques utilisateur:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des statistiques' 
    });
  }
});

/**
 * GET /api/tasks/event/:eventId/details
 * Récupérer les détails des tâches d'un événement
 */
router.get('/event/:eventId/details', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;
    
    console.log(`📋 [DEBUG] Détails tâches événement - User: ${userId}, Event: ${eventId}`);
    
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Événement non trouvé' 
      });
    }
    
    // Récupérer les progressions de l'utilisateur pour cet événement
    const UserTaskProgress = require('../models/UserTaskProgress');
    const progressions = await UserTaskProgress.find({ userId, eventId })
      .populate('taskId', 'title description taskType targetValue difficulty rewards date')
      .sort({ date: -1 });
    
    // Formater les données
    const tasksByDate = {};
    progressions.forEach(progress => {
      const date = progress.date;
      if (!tasksByDate[date]) {
        tasksByDate[date] = [];
      }
      
      tasksByDate[date].push({
        id: progress.taskId._id,
        title: progress.taskId.title,
        description: progress.taskId.description,
        taskType: progress.taskId.taskType,
        difficulty: progress.taskId.difficulty,
        targetValue: progress.targetValue,
        currentProgress: progress.currentProgress,
        status: progress.status,
        rewards: progress.taskId.calculateReward(event.bonusMultiplier),
        progressPercentage: Math.round((progress.currentProgress / progress.targetValue) * 100),
        completedAt: progress.completedAt,
        claimedAt: progress.claimedAt
      });
    });
    
    // Statistiques de l'événement pour l'utilisateur
    const eventStats = await dailyTaskService.getEventTaskStats(eventId);
    const userEventStats = {
      totalTasks: progressions.length,
      completedTasks: progressions.filter(p => p.status === 'completed' || p.status === 'claimed').length,
      claimedTasks: progressions.filter(p => p.status === 'claimed').length,
      totalXPEarned: progressions.filter(p => p.status === 'claimed').reduce((sum, p) => sum + p.rewardsReceived.xp, 0)
    };
    
    console.log(`✅ [DEBUG] Détails récupérés: ${Object.keys(tasksByDate).length} jours, ${userEventStats.totalTasks} tâches`);
    
    res.json({
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
        realWorldEvent: event.realWorldEvent
      },
      tasksByDate,
      userStats: userEventStats,
      globalStats: eventStats
    });
    
  } catch (error) {
    console.error('❌ Erreur détails tâches événement:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération des détails' 
    });
  }
});

module.exports = router;
