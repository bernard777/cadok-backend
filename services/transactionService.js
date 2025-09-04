/**
 * 💾 SERVICE DE TRANSACTIONS MONGODB - CADOK
 * Gestion atomique des opérations multi-collections avec rollback automatique
 */

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const { DatabaseError, AppError } = require('../middleware/errorHandler');

/**
 * Service de gestion des transactions
 */
class TransactionService {
  /**
   * Exécuter une transaction avec retry automatique
   */
  static async executeTransaction(operations, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 100,
      sessionOptions = {}
    } = options;

    let attempt = 0;
    let lastError;
    const startTime = Date.now();

    while (attempt < maxRetries) {
      const session = await mongoose.startSession();
      
      try {
        attempt++;
        logger.info('Starting transaction', { 
          attempt, 
          maxRetries,
          operationsCount: operations.length 
        });

        // Démarrer la transaction
        session.startTransaction(sessionOptions);

        // Exécuter toutes les opérations
        const results = [];
        for (const operation of operations) {
          const result = await operation(session);
          results.push(result);
        }

        // Commit de la transaction
        await session.commitTransaction();
        
        const executionTime = Date.now() - startTime;
        
        logger.info('Transaction committed successfully', {
          attempt,
          operationsCount: operations.length,
          resultsCount: results.length,
          executionTime
        });

        return {
          success: true,
          results,
          attempt,
          executionTime
        };

      } catch (error) {
        // Rollback automatique
        await session.abortTransaction();
        lastError = error;

        logger.warn('Transaction failed, rolling back', {
          attempt,
          error: error.message,
          errorName: error.name,
          errorCode: error.code,
          willRetry: this.isRetryableError(error) && attempt < maxRetries
        });

        // Vérifier si l'erreur est retryable
        if (this.isRetryableError(error) && attempt < maxRetries) {
          await this.delay(retryDelay * attempt); // Backoff exponentiel
          continue; // Continuer la boucle pour retry
        }

        // Si l'erreur n'est pas retryable (comme ValidationError), la propager immédiatement
        break;

      } finally {
        await session.endSession();
      }
    }

    // Si on arrive ici, toutes les tentatives ont échoué
    logger.error('Transaction failed after all retries', {
      attempts: attempt,
      lastError: lastError.message,
      errorName: lastError.name
    });

    // Si c'est une ValidationError, la propager telle quelle
    if (lastError.name === 'ValidationError') {
      throw lastError;
    }

    // Sinon, créer une DatabaseError
    throw new DatabaseError(`Transaction failed after ${attempt} attempts: ${lastError.message}`);
  }

  /**
   * Vérifier si une erreur est "retryable"
   */
  static isRetryableError(error) {
    // Les erreurs de validation ne sont jamais retryables
    if (error.name === 'ValidationError') {
      return false;
    }

    // Erreurs de concurrence MongoDB
    const retryableCodes = [
      112, // WriteConflict
      117, // ConflictingOperationInProgress
      11000, // DuplicateKey (dans certains cas)
      16500 // TransientTransactionError
    ];

    return retryableCodes.includes(error.code) || 
           (error.hasErrorLabel && typeof error.hasErrorLabel === 'function' && error.hasErrorLabel('TransientTransactionError'));
  }

  /**
   * Delay pour le retry
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Transaction pour créer un trade avec toutes les validations
   */
  static async createTradeTransaction(tradeData, fromUserId, toUserId, requestedObjectIds, offeredObjectIds) {
    // Validation des paramètres requis
    if (!fromUserId || !toUserId || !requestedObjectIds) {
      throw new AppError('fromUser, toUser et requestedObjects sont requis', 400);
    }

    const operations = [
      // 1. Vérifier que les utilisateurs existent
      async (session) => {
        const User = require('../models/User');
        const users = await User.find({ 
          _id: { $in: [fromUserId, toUserId] } 
        }).session(session);
        
        if (users.length !== 2) {
          throw new AppError('One or more users not found', 404);
        }
        return users;
      },

      // 2. Vérifier et réserver les objets demandés
      async (session) => {
        const ObjectModel = require('../models/Object');
        const requestedObjects = await ObjectModel.find({
          _id: { $in: requestedObjectIds },
          owner: toUserId,
          status: 'available'
        }).session(session);

        if (requestedObjects.length !== requestedObjectIds.length) {
          throw new AppError('Some requested objects are not available', 409);
        }

        // Marquer comme "pending" de manière atomique
        await ObjectModel.updateMany(
          { _id: { $in: requestedObjectIds } },
          { status: 'pending' },
          { session }
        );

        return requestedObjects;
      },

      // 3. Vérifier et réserver les objets offerts (si présents)
      async (session) => {
        if (!offeredObjectIds || offeredObjectIds.length === 0) {
          return [];
        }

        const ObjectModel = require('../models/Object');
        const offeredObjects = await ObjectModel.find({
          _id: { $in: offeredObjectIds },
          owner: fromUserId,
          status: 'available'
        }).session(session);

        if (offeredObjects.length !== offeredObjectIds.length) {
          throw new AppError('Some offered objects are not available', 409);
        }

        // Marquer comme "pending"
        await ObjectModel.updateMany(
          { _id: { $in: offeredObjectIds } },
          { status: 'pending' },
          { session }
        );

        return offeredObjects;
      },

      // 4. Créer le trade
      async (session) => {
        const Trade = require('../models/Trade');
        const trade = new Trade({
          ...tradeData,
          fromUser: fromUserId,
          toUser: toUserId,
          requestedObjects: requestedObjectIds,
          offeredObjects: offeredObjectIds,
          status: 'pending',
          createdAt: new Date()
        });

        await trade.save({ session });
        return trade;
      }
    ];

    return await this.executeTransaction(operations);
  }

  /**
   * Transaction pour accepter un trade
   */
  static async acceptTradeTransaction(tradeId, userId) {
    // Validation des paramètres requis
    if (!tradeId || !userId) {
      throw new AppError('tradeId et userId sont requis', 400);
    }

    const operations = [
      // 1. Récupérer et vérifier le trade
      async (session) => {
        const Trade = require('../models/Trade');
        const trade = await Trade.findById(tradeId).session(session);
        
        if (!trade) {
          throw new AppError('Trade not found', 404);
        }

        if (trade.status !== 'pending') {
          throw new AppError('Trade is not in pending status', 409);
        }

        if (trade.toUser.toString() !== userId.toString()) {
          throw new AppError('Only the recipient can accept this trade', 403);
        }

        return trade;
      },

      // 2. Mettre à jour le statut du trade
      async (session) => {
        const Trade = require('../models/Trade');
        const updatedTrade = await Trade.findByIdAndUpdate(
          tradeId,
          { 
            status: 'accepted',
            acceptedAt: new Date()
          },
          { new: true, session }
        );
        return updatedTrade;
      },

      // 3. Mettre à jour le statut des objets
      async (session) => {
        const ObjectModel = require('../models/Object');
        const trade = await Trade.findById(tradeId).session(session);
        
        // Marquer les objets comme "traded"
        const allObjectIds = [
          ...(trade.requestedObjects || []),
          ...(trade.offeredObjects || [])
        ];

        if (allObjectIds.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: allObjectIds } },
            { status: 'traded' },
            { session }
          );
        }

        return allObjectIds.length;
      }
    ];

    return await this.executeTransaction(operations);
  }

  /**
   * Transaction pour refuser un trade
   */
  static async refuseTradeTransaction(tradeId, userId) {
    const operations = [
      // 1. Récupérer et vérifier le trade
      async (session) => {
        const Trade = require('../models/Trade');
        const trade = await Trade.findById(tradeId).session(session);
        
        if (!trade) {
          throw new AppError('Trade not found', 404);
        }

        if (trade.status !== 'pending') {
          throw new AppError('Trade is not in pending status', 409);
        }

        if (trade.toUser.toString() !== userId.toString()) {
          throw new AppError('Only the recipient can refuse this trade', 403);
        }

        return trade;
      },

      // 2. Mettre à jour le statut du trade
      async (session) => {
        const Trade = require('../models/Trade');
        const updatedTrade = await Trade.findByIdAndUpdate(
          tradeId,
          { 
            status: 'refused',
            refusedAt: new Date()
          },
          { new: true, session }
        );
        return updatedTrade;
      },

      // 3. Remettre les objets disponibles
      async (session) => {
        const ObjectModel = require('../models/Object');
        const trade = await Trade.findById(tradeId).session(session);
        
        const allObjectIds = [
          ...(trade.requestedObjects || []),
          ...(trade.offeredObjects || [])
        ];

        if (allObjectIds.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: allObjectIds } },
            { status: 'available' },
            { session }
          );
        }

        return allObjectIds.length;
      }
    ];

    return await this.executeTransaction(operations);
  }

  /**
   * Transaction pour annuler un trade
   */
  static async cancelTradeTransaction(tradeId, userId) {
    const operations = [
      // 1. Vérifier le trade et les permissions
      async (session) => {
        const Trade = require('../models/Trade');
        const trade = await Trade.findById(tradeId).session(session);
        
        if (!trade) {
          throw new AppError('Trade not found', 404);
        }

        if (!['pending', 'accepted'].includes(trade.status)) {
          throw new AppError('Trade cannot be cancelled in current status', 409);
        }

        if (![trade.fromUser.toString(), trade.toUser.toString()].includes(userId.toString())) {
          throw new AppError('Only trade participants can cancel', 403);
        }

        return trade;
      },

      // 2. Annuler le trade
      async (session) => {
        const Trade = require('../models/Trade');
        const updatedTrade = await Trade.findByIdAndUpdate(
          tradeId,
          { 
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: userId
          },
          { new: true, session }
        );
        return updatedTrade;
      },

      // 3. Remettre les objets disponibles
      async (session) => {
        const ObjectModel = require('../models/Object');
        const trade = await Trade.findById(tradeId).session(session);
        
        const allObjectIds = [
          ...(trade.requestedObjects || []),
          ...(trade.offeredObjects || [])
        ];

        if (allObjectIds.length > 0) {
          await ObjectModel.updateMany(
            { _id: { $in: allObjectIds } },
            { status: 'available' },
            { session }
          );
        }

        return allObjectIds.length;
      }
    ];

    return await this.executeTransaction(operations);
  }
}

module.exports = TransactionService;
