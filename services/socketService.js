const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:19006", "http://192.168.1.16:19006", "exp://192.168.1.16:19000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Token manquant'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('Utilisateur introuvable'));
        }

        socket.userId = user._id.toString();
        socket.userPseudo = user.pseudo;
        next();
      } catch (error) {
        console.error('❌ [SOCKET] Erreur d\'authentification:', error.message);
        next(new Error('Token invalide'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('🔌 [SOCKET] Service Socket.io initialisé');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    const userPseudo = socket.userPseudo;

    // Enregistrer la connexion
    this.userSockets.set(userId, socket.id);
    this.socketUsers.set(socket.id, userId);

    console.log(`🟢 [SOCKET] ${userPseudo} connecté (${userId})`);

    // Rejoindre les salles de conversation
    socket.on('join-conversation', (tradeId) => {
      socket.join(`trade_${tradeId}`);
      console.log(`📝 [SOCKET] ${userPseudo} a rejoint la conversation ${tradeId}`);
    });

    // Quitter une conversation
    socket.on('leave-conversation', (tradeId) => {
      socket.leave(`trade_${tradeId}`);
      console.log(`🚪 [SOCKET] ${userPseudo} a quitté la conversation ${tradeId}`);
    });

    // Gérer la déconnexion
    socket.on('disconnect', () => {
      this.userSockets.delete(userId);
      this.socketUsers.delete(socket.id);
      console.log(`🔴 [SOCKET] ${userPseudo} déconnecté`);
    });

    // Événement pour marquer les messages comme lus
    socket.on('messages-read', (tradeId) => {
      socket.to(`trade_${tradeId}`).emit('messages-read-by-other', { tradeId, userId });
    });
  }

  // Envoyer un nouveau message à tous les participants d'une conversation
  emitNewMessage(tradeId, message, senderId) {
    if (!this.io) return;

    console.log(`💬 [SOCKET] Diffusion nouveau message pour trade ${tradeId}`);
    
    // Envoyer à tous les clients dans la salle sauf l'expéditeur
    this.io.to(`trade_${tradeId}`).emit('new-message', {
      tradeId,
      message,
      senderId
    });
  }

  // Notifier qu'un utilisateur est en train d'écrire
  emitTyping(tradeId, userId, pseudo, isTyping) {
    if (!this.io) return;

    this.io.to(`trade_${tradeId}`).emit('user-typing', {
      tradeId,
      userId,
      pseudo,
      isTyping
    });
  }

  // Mettre à jour le statut d'un échange
  emitTradeStatusUpdate(tradeId, newStatus, participants) {
    if (!this.io) return;

    console.log(`🔄 [SOCKET] Mise à jour statut trade ${tradeId}: ${newStatus}`);
    
    this.io.to(`trade_${tradeId}`).emit('trade-status-updated', {
      tradeId,
      status: newStatus
    });

    // Notifier aussi via les IDs utilisateur directement
    participants.forEach(userId => {
      const socketId = this.userSockets.get(userId.toString());
      if (socketId) {
        this.io.to(socketId).emit('conversation-updated');
      }
    });
  }

  // Envoyer une notification en temps réel
  emitNotification(userId, notification) {
    if (!this.io) return;

    console.log(`🔔 [SOCKET] Tentative envoi notification à userId: ${userId}`);
    console.log(`🔔 [SOCKET] Utilisateurs connectés:`, Array.from(this.userSockets.keys()));

    const socketId = this.userSockets.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit('new-notification', notification);
      console.log(`✅ [SOCKET] Notification envoyée à ${userId} (socket: ${socketId})`);
    } else {
      console.log(`❌ [SOCKET] Utilisateur ${userId} non connecté en Socket.io`);
    }
  }

  // Envoyer un événement à plusieurs utilisateurs spécifiques
  emitToUsers(userIds, eventName, data) {
    if (!this.io) return;

    console.log(`📡 [SOCKET] Émission ${eventName} vers:`, userIds);
    
    userIds.forEach(userId => {
      const socketId = this.userSockets.get(userId.toString());
      if (socketId) {
        this.io.to(socketId).emit(eventName, data);
        console.log(`✅ [SOCKET] ${eventName} envoyé à ${userId}`);
      } else {
        console.log(`⚠️ [SOCKET] Utilisateur ${userId} non connecté`);
      }
    });
  }

  // Vérifier si un utilisateur est en ligne
  isUserOnline(userId) {
    return this.userSockets.has(userId.toString());
  }

  // Obtenir le nombre d'utilisateurs connectés
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Obtenir tous les utilisateurs connectés
  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }
}

module.exports = new SocketService();
