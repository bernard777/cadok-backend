/**
 * 🎯 SERVICE DES TÂCHES QUOTIDIENNES - CADOK
 * Gestion des tâches d'événements et récompenses
 */

const Event = require('../models/Event');
const DailyTask = require('../models/DailyTask');
const UserTaskProgress = require('../models/UserTaskProgress');
const User = require('../models/User');

class DailyTaskService {
  
  /**
   * Génère les tâches quotidiennes pour un événement actif
   */
  async generateDailyTasksForEvent(eventId, date) {
    try {
      const event = await Event.findById(eventId);
      if (!event || !event.isActive) {
        return [];
      }
      
      // Vérifier si les tâches existent déjà pour cette date
      const existingTasks = await DailyTask.find({ eventId, date });
      if (existingTasks.length > 0) {
        return existingTasks;
      }
      
      console.log(`🎯 Génération des tâches quotidiennes pour: ${event.name} - ${date}`);
      
      // Définir les tâches selon le thème de l'événement
      const tasks = this.getTasksForEventTheme(event, date);
      
      // Créer les tâches en base
      const createdTasks = [];
      for (const taskData of tasks) {
        const task = new DailyTask({
          ...taskData,
          eventId,
          date,
          createdBy: event.createdBy
        });
        await task.save();
        createdTasks.push(task);
        console.log(`✅ Tâche créée: ${task.title}`);
      }
      
      return createdTasks;
      
    } catch (error) {
      console.error('❌ Erreur génération tâches quotidiennes:', error);
      throw error;
    }
  }
  
  /**
   * Définit les tâches selon le thème de l'événement
   */
  getTasksForEventTheme(event, date) {
    const baseXP = 50;
    const eventMultiplier = event.bonusMultiplier || 1.0;
    
    // Tâches communes à tous les événements écologiques
    const commonTasks = [
      {
        title: 'Connexion quotidienne',
        description: 'Connectez-vous à l\'application pour soutenir l\'événement écologique',
        taskType: 'LOGIN_APP',
        targetValue: 1,
        difficulty: 'easy',
        rewards: {
          xp: Math.round(baseXP * 0.5),
          multiplier: eventMultiplier
        }
      },
      {
        title: 'Échange écologique',
        description: 'Effectuez un échange d\'objet pour promouvoir la réutilisation',
        taskType: 'TRADE_OBJECTS',
        targetValue: 1,
        difficulty: 'medium',
        rewards: {
          xp: Math.round(baseXP * 1.5),
          multiplier: eventMultiplier
        }
      }
    ];
    
    // Tâches spécifiques selon l'événement réel
    const specificTasks = this.getSpecificTasksForEvent(event, baseXP, eventMultiplier);
    
    return [...commonTasks, ...specificTasks];
  }
  
  /**
   * Tâches spécifiques selon l'événement écologique réel
   */
  getSpecificTasksForEvent(event, baseXP, eventMultiplier) {
    const eventName = event.name.toLowerCase();
    
    // Journée Mondiale sans Voiture
    if (eventName.includes('sans voiture')) {
      return [
        {
          title: 'Transport alternatif',
          description: 'Échangez un objet lié à la mobilité douce (vélo, trottinette, etc.)',
          taskType: 'TRADE_OBJECTS',
          targetValue: 1,
          difficulty: 'medium',
          specificCategories: ['Vélos', 'Transport', 'Sport'],
          rewards: {
            xp: Math.round(baseXP * 2),
            
            badge: 'Mobilité Verte',
            multiplier: eventMultiplier
          }
        },
        {
          title: 'Exploration locale',
          description: 'Explorez les objets disponibles dans votre quartier',
          taskType: 'BROWSE_NEARBY',
          targetValue: 5,
          difficulty: 'easy',
          rewards: {
            xp: baseXP,
            
            multiplier: eventMultiplier
          }
        }
      ];
    }
    
    // Journée Mondiale de l'Environnement
    if (eventName.includes('environnement')) {
      return [
        {
          title: 'Objets écologiques',
          description: 'Ajoutez des objets respectueux de l\'environnement',
          taskType: 'ADD_OBJECTS',
          targetValue: 2,
          difficulty: 'medium',
          specificCategories: ['Écologique', 'Bio', 'Durable'],
          rewards: {
            xp: Math.round(baseXP * 2.5),
            
            badge: 'Gardien Planète',
            multiplier: eventMultiplier
          }
        },
        {
          title: 'Partage environnemental',
          description: 'Partagez un objet pour sensibiliser à l\'écologie',
          taskType: 'SHARE_OBJECT',
          targetValue: 1,
          difficulty: 'easy',
          rewards: {
            xp: baseXP,
            
            multiplier: eventMultiplier
          }
        }
      ];
    }
    
    // Semaine Européenne de la Réduction des Déchets
    if (eventName.includes('déchets') || eventName.includes('déchet')) {
      return [
        {
          title: 'Anti-gaspi',
          description: 'Échangez 2 objets pour éviter qu\'ils deviennent des déchets',
          taskType: 'TRADE_OBJECTS',
          targetValue: 2,
          difficulty: 'hard',
          rewards: {
            xp: Math.round(baseXP * 3),
            
            badge: 'Anti-Gaspi Champion',
            multiplier: eventMultiplier
          }
        },
        {
          title: 'Découverte catégories',
          description: 'Visitez 3 catégories différentes pour découvrir de nouveaux objets',
          taskType: 'VISIT_CATEGORIES',
          targetValue: 3,
          difficulty: 'easy',
          rewards: {
            xp: baseXP,
            
            multiplier: eventMultiplier
          }
        }
      ];
    }
    
    // Journée Mondiale du Recyclage
    if (eventName.includes('recyclage')) {
      return [
        {
          title: 'Seconde vie',
          description: 'Donnez une seconde vie à un objet électronique ou en plastique',
          taskType: 'TRADE_OBJECTS',
          targetValue: 1,
          difficulty: 'medium',
          specificCategories: ['Électronique', 'Plastique', 'Métal'],
          rewards: {
            xp: Math.round(baseXP * 2),
            
            badge: 'Maître Recyclage',
            multiplier: eventMultiplier
          }
        }
      ];
    }
    
    // Earth Hour
    if (eventName.includes('earth hour') || eventName.includes('heure de la terre')) {
      return [
        {
          title: 'Économie d\'énergie',
          description: 'Échangez un appareil électronique pour promouvoir les économies d\'énergie',
          taskType: 'TRADE_OBJECTS',
          targetValue: 1,
          difficulty: 'medium',
          specificCategories: ['Électronique', 'Éclairage'],
          rewards: {
            xp: Math.round(baseXP * 4), // Bonus spécial Earth Hour
            
            badge: 'Gardien Lumière',
            multiplier: eventMultiplier
          }
        }
      ];
    }
    
    // Semaine du Développement Durable
    if (eventName.includes('développement durable')) {
      return [
        {
          title: 'Consommation responsable',
          description: 'Effectuez un échange dans une catégorie liée au développement durable',
          taskType: 'TRADE_OBJECTS',
          targetValue: 1,
          difficulty: 'medium',
          specificCategories: ['Éducation', 'Santé', 'Durable'],
          rewards: {
            xp: Math.round(baseXP * 2),
            
            badge: 'Ambassadeur ODD',
            multiplier: eventMultiplier
          }
        },
        {
          title: 'Profil responsable',
          description: 'Mettez à jour votre profil avec vos engagements écologiques',
          taskType: 'UPDATE_PROFILE',
          targetValue: 1,
          difficulty: 'easy',
          rewards: {
            xp: baseXP,
            
            multiplier: eventMultiplier
          }
        }
      ];
    }
    
    // Tâches par défaut si pas de correspondance
    return [
      {
        title: 'Engagement écologique',
        description: 'Ajoutez un objet dans l\'esprit de l\'événement',
        taskType: 'ADD_OBJECTS',
        targetValue: 1,
        difficulty: 'medium',
        rewards: {
          xp: Math.round(baseXP * 1.5),
          
          multiplier: eventMultiplier
        }
      }
    ];
  }
  
  /**
   * Récupère les tâches du jour pour un utilisateur
   */
  async getUserDailyTasks(userId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      }
      
      // Récupérer tous les événements actifs
      const activeEvents = await Event.find({ isActive: true });
      
      const allTasks = [];
      
      for (const event of activeEvents) {
        // Générer les tâches pour cet événement si elles n'existent pas
        await this.generateDailyTasksForEvent(event._id, date);
        
        // Récupérer les tâches
        const tasks = await DailyTask.find({ eventId: event._id, date });
        
        for (const task of tasks) {
          // Récupérer ou créer la progression de l'utilisateur
          let progress = await UserTaskProgress.findOne({ 
            userId, 
            taskId: task._id, 
            date 
          });
          
          if (!progress) {
            progress = await UserTaskProgress.createProgressForUser(
              userId, 
              task._id, 
              event._id, 
              date, 
              task.targetValue
            );
          }
          
          allTasks.push({
            task,
            event,
            progress
          });
        }
      }
      
      return allTasks;
      
    } catch (error) {
      console.error('❌ Erreur récupération tâches utilisateur:', error);
      throw error;
    }
  }
  
  /**
   * Met à jour la progression d'une tâche pour un utilisateur
   */
  async updateTaskProgress(userId, taskId, incrementValue = 1, details = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const progress = await UserTaskProgress.findOne({ 
        userId, 
        taskId, 
        date: today 
      });
      
      if (!progress) {
        throw new Error('Progression de tâche non trouvée');
      }
      
      await progress.updateProgress(incrementValue, details);
      
      console.log(`📈 Progression mise à jour - User: ${userId}, Task: ${taskId}, Progress: ${progress.currentProgress}/${progress.targetValue}`);
      
      return progress;
      
    } catch (error) {
      console.error('❌ Erreur mise à jour progression:', error);
      throw error;
    }
  }
  
  /**
   * Réclame les récompenses d'une tâche terminée
   */
  async claimTaskRewards(userId, taskId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const progress = await UserTaskProgress.findOne({ 
        userId, 
        taskId, 
        date: today 
      });
      
      if (!progress) {
        throw new Error('Progression de tâche non trouvée');
      }
      
      const rewards = await progress.claimRewards();
      
      console.log(`🎁 Récompenses réclamées - User: ${userId}, XP: +${rewards.xp}, Coins: +${rewards.coins}`);
      
      return rewards;
      
    } catch (error) {
      console.error('❌ Erreur réclamation récompenses:', error);
      throw error;
    }
  }
  
  /**
   * Traite automatiquement les actions utilisateur pour les tâches
   */
  async processUserAction(userId, actionType, actionData = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer les tâches en cours pour cet utilisateur
      const userTasks = await this.getUserDailyTasks(userId, today);
      
      for (const { task, progress } of userTasks) {
        if (progress.status === 'completed' || progress.status === 'claimed') {
          continue;
        }
        
        // Vérifier si l'action correspond au type de tâche
        if (this.actionMatchesTask(actionType, task, actionData)) {
          await this.updateTaskProgress(userId, task._id, 1, actionData);
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur traitement action utilisateur:', error);
    }
  }
  
  /**
   * Vérifie si une action utilisateur correspond à un type de tâche
   */
  actionMatchesTask(actionType, task, actionData) {
    switch (task.taskType) {
      case 'LOGIN_APP':
        return actionType === 'user_login';
        
      case 'TRADE_OBJECTS':
        if (actionType === 'trade_completed') {
          // Vérifier les catégories spécifiques si définies
          if (task.specificCategories && task.specificCategories.length > 0) {
            return task.specificCategories.some(cat => 
              actionData.category && actionData.category.toLowerCase().includes(cat.toLowerCase())
            );
          }
          return true;
        }
        return false;
        
      case 'ADD_OBJECTS':
        if (actionType === 'object_added') {
          if (task.specificCategories && task.specificCategories.length > 0) {
            return task.specificCategories.some(cat => 
              actionData.category && actionData.category.toLowerCase().includes(cat.toLowerCase())
            );
          }
          return true;
        }
        return false;
        
      case 'VISIT_CATEGORIES':
        return actionType === 'category_visited';
        
      case 'RATE_TRADES':
        return actionType === 'trade_rated';
        
      case 'UPDATE_PROFILE':
        return actionType === 'profile_updated';
        
      case 'SHARE_OBJECT':
        return actionType === 'object_shared';
        
      case 'BROWSE_NEARBY':
        return actionType === 'nearby_browsed';
        
      default:
        return false;
    }
  }
  
  /**
   * Récupère les statistiques des tâches pour un événement
   */
  async getEventTaskStats(eventId) {
    try {
      const tasks = await DailyTask.find({ eventId });
      const totalTasks = tasks.length;
      
      let totalCompletions = 0;
      let totalUsers = 0;
      
      for (const task of tasks) {
        const completions = await UserTaskProgress.countDocuments({ 
          taskId: task._id, 
          status: { $in: ['completed', 'claimed'] } 
        });
        const users = await UserTaskProgress.countDocuments({ taskId: task._id });
        
        totalCompletions += completions;
        totalUsers += users;
        
        // Mettre à jour les stats de la tâche
        task.stats.completedUsers = completions;
        task.stats.totalUsers = users;
        await task.updateStats();
      }
      
      return {
        totalTasks,
        totalCompletions,
        totalUsers,
        averageCompletionRate: totalUsers > 0 ? Math.round((totalCompletions / totalUsers) * 100) : 0
      };
      
    } catch (error) {
      console.error('❌ Erreur statistiques tâches événement:', error);
      throw error;
    }
  }
}

module.exports = DailyTaskService;
