/**
 * Tests unitaires pour TransactionService
 * 🎯 Tests avec mocks complets - Pas de DB réelle
 */

// Mock winston avant tout require
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
    child: jest.fn().mockReturnThis()
  }),
  addColors: jest.fn(),
  format: {
    combine: jest.fn().mockReturnValue({}),
    timestamp: jest.fn().mockReturnValue({}),
    errors: jest.fn().mockReturnValue({}),
    json: jest.fn().mockReturnValue({}),
    printf: jest.fn().mockReturnValue({}),
    colorize: jest.fn().mockReturnValue({}),
    simple: jest.fn().mockReturnValue({})
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

jest.mock('winston-daily-rotate-file', () => jest.fn());

const TransactionService = require('../../services/transactionService');

describe('🔄 TransactionService - Tests Unitaires', () => {
  let mockTrade, mockUser, mockObject;

  // Helper pour créer un mock session complet
  const createMockSession = () => ({
    withTransaction: jest.fn().mockImplementation((callback) => callback()),
    abortTransaction: jest.fn().mockResolvedValue(),
    commitTransaction: jest.fn().mockResolvedValue(),
    endSession: jest.fn().mockResolvedValue(),
    startTransaction: jest.fn().mockResolvedValue()
  });

  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();

    // Mock des modèles nécessaires
    const Trade = require('../../models/Trade');
    const ObjectModel = require('../../models/Object');
    const Message = require('../../models/Message');
    
    // Reset tous les mocks de modèles
    Object.keys(Trade).forEach(key => {
      if (typeof Trade[key] === 'function' && Trade[key].mockClear) {
        Trade[key].mockClear();
      }
    });
    
    Object.keys(ObjectModel).forEach(key => {
      if (typeof ObjectModel[key] === 'function' && ObjectModel[key].mockClear) {
        ObjectModel[key].mockClear();
      }
    });
    
    Object.keys(Message).forEach(key => {
      if (typeof Message[key] === 'function' && Message[key].mockClear) {
        Message[key].mockClear();
      }
    });

    // Reset du mock mongoose startSession pour éviter les interférences
    const mongoose = require('mongoose');
    mongoose.startSession.mockClear();

    // Mock objets de base
    mockTrade = {
      _id: 'trade123',
      fromUser: 'user1',
      toUser: 'user2',
      requestedObjects: ['obj1'],
      offeredObjects: ['obj2'],
      status: 'pending',
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(this)
    };

    mockUser = {
      _id: 'user123',
      pseudo: 'TestUser',
      save: jest.fn().mockResolvedValue(true)
    };

    mockObject = {
      _id: 'obj123',
      status: 'available',
      save: jest.fn().mockResolvedValue(true)
    };
  });

  describe('🎯 executeTransaction', () => {
    it('devrait exécuter une transaction simple avec succès', async () => {
      // Arrange
      const mockOperation = jest.fn().mockResolvedValue({ success: true });
      const operations = [mockOperation];
      
      // Mock mongoose session avec toutes les méthodes
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act
      const result = await TransactionService.executeTransaction(operations);

      // Assert
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith(mockSession);
    });

    it('devrait gérer les erreurs avec retry automatique', async () => {
      // Arrange
      const transientError = new Error('Temporary error');
      transientError.code = 112; // WriteConflict - retryable
      
      const mockCallback = jest.fn()
        .mockRejectedValueOnce(transientError)
        .mockResolvedValue({ success: true, attempt: 2 });
      
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act
      const result = await TransactionService.executeTransaction([mockCallback]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(2);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('devrait échouer après 3 tentatives', async () => {
      // Arrange - utiliser une erreur RETRYABLE qui persiste
      const persistentRetryableError = new Error('Persistent retryable error');
      persistentRetryableError.code = 112; // WriteConflict - retryable
      
      const mockCallback = jest.fn().mockRejectedValue(persistentRetryableError);
      
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act & Assert
      await expect(TransactionService.executeTransaction([mockCallback]))
        .rejects.toThrow('Persistent retryable error');
      expect(mockCallback).toHaveBeenCalledTimes(3);
    });
  });

  describe('🤝 createTradeTransaction', () => {
    it('devrait créer un trade avec transaction', async () => {
      // Arrange
      const tradeData = {
        fromUser: 'user1',
        toUser: 'user2',
        requestedObjects: ['obj1'],
        message: 'Test trade'
      };

      const Trade = require('../../models/Trade');
      const ObjectModel = require('../../models/Object');
      
      Trade.create.mockResolvedValue(mockTrade);
      ObjectModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

      // Mock executeTransaction pour simuler le succès
      jest.spyOn(TransactionService, 'executeTransaction')
        .mockResolvedValue({
          success: true,
          results: [mockTrade, { modifiedCount: 1 }],
          attempt: 1
        });

      // Act
      const result = await TransactionService.createTradeTransaction(
        tradeData, 
        'user1', 
        'user2', 
        ['obj1'], 
        ['obj2']
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.results[0]).toEqual(mockTrade);
      expect(TransactionService.executeTransaction).toHaveBeenCalled();
    });

    it('devrait valider les données requises', async () => {
      // Act & Assert
      await expect(TransactionService.createTradeTransaction({}))
        .rejects.toThrow('fromUser, toUser et requestedObjects sont requis');
    });
  });

  describe('✅ acceptTradeTransaction', () => {
    it('devrait accepter un trade avec transaction', async () => {
      // Arrange
      const tradeId = 'trade123';
      const userId = 'user1';

      const Trade = require('../../models/Trade');
      const ObjectModel = require('../../models/Object');
      
      Trade.findById.mockResolvedValue(mockTrade);
      ObjectModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      // Mock executeTransaction
      jest.spyOn(TransactionService, 'executeTransaction')
        .mockResolvedValue({
          success: true,
          results: [{ ...mockTrade, status: 'accepted' }, { modifiedCount: 2 }],
          attempt: 1
        });

      // Act
      const result = await TransactionService.acceptTradeTransaction(tradeId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(TransactionService.executeTransaction).toHaveBeenCalled();
    });

    it('devrait valider les paramètres', async () => {
      // Act & Assert
      await expect(TransactionService.acceptTradeTransaction())
        .rejects.toThrow('tradeId et userId sont requis');
    });
  });

  describe('❌ refuseTradeTransaction', () => {
    it('devrait refuser un trade avec transaction', async () => {
      // Arrange
      const tradeId = 'trade123';
      const userId = 'user1';

      const Trade = require('../../models/Trade');
      const ObjectModel = require('../../models/Object');
      
      Trade.findById.mockResolvedValue(mockTrade);
      ObjectModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

      // Mock executeTransaction
      jest.spyOn(TransactionService, 'executeTransaction')
        .mockResolvedValue({
          success: true,
          results: [{ ...mockTrade, status: 'refused' }, { modifiedCount: 2 }],
          attempt: 1
        });

      // Act
      const result = await TransactionService.refuseTradeTransaction(tradeId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(TransactionService.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('🚫 cancelTradeTransaction', () => {
    it('devrait annuler un trade avec transaction', async () => {
      // Arrange
      const tradeId = 'trade123';
      const userId = 'user1';

      const Trade = require('../../models/Trade');
      const ObjectModel = require('../../models/Object');
      const Message = require('../../models/Message');
      
      Trade.findById.mockResolvedValue(mockTrade);
      Trade.findByIdAndDelete.mockResolvedValue(mockTrade);
      ObjectModel.updateMany.mockResolvedValue({ modifiedCount: 2 });
      Message.deleteMany.mockResolvedValue({ deletedCount: 3 });

      // Mock executeTransaction
      jest.spyOn(TransactionService, 'executeTransaction')
        .mockResolvedValue({
          success: true,
          results: [
            { deletedCount: 1 },
            { modifiedCount: 2 },
            { deletedCount: 3 }
          ],
          attempt: 1
        });

      // Act
      const result = await TransactionService.cancelTradeTransaction(tradeId, userId);

      // Assert
      expect(result.success).toBe(true);
      expect(TransactionService.executeTransaction).toHaveBeenCalled();
    });
  });

  describe('📊 Métriques et logging', () => {
    it('devrait logger les performances des transactions', async () => {
      // Arrange
      const mockCallback = jest.fn().mockResolvedValue({ success: true });
      
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act
      const result = await TransactionService.executeTransaction([mockCallback]);

      // Assert
      expect(result.success).toBe(true);
      expect(typeof result.executionTime).toBe('number');
    });

    it('devrait tracker les tentatives de retry', async () => {
      // Arrange
      const retryableError = new Error('First fail');
      retryableError.code = 112; // WriteConflict - retryable
      
      let callCount = 0;
      const mockCallback = jest.fn().mockImplementation(async (session) => {
        callCount++;
        if (callCount === 1) {
          throw retryableError;
        }
        return { success: true };
      });
      
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act
      const result = await TransactionService.executeTransaction([mockCallback]);

      // Assert
      expect(result.attempt).toBe(2);
      expect(result.success).toBe(true);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('🔒 Gestion des erreurs', () => {
    it('devrait gérer les erreurs de validation MongoDB', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      // Créer une opération qui échoue réellement
      const mockCallback = jest.fn().mockImplementation(async (session) => {
        throw validationError;
      });
      
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act & Assert
      await expect(TransactionService.executeTransaction([mockCallback]))
        .rejects.toThrow('Validation failed');
    });

    it('devrait gérer les erreurs de concurrence', async () => {
      // Arrange
      const concurrencyError = new Error('WriteConflict');
      concurrencyError.code = 112;
      
      let callCount = 0;
      const mockCallback = jest.fn().mockImplementation(async (session) => {
        callCount++;
        if (callCount === 1) {
          throw concurrencyError;
        }
        return { success: true };
      });
      
      const mockSession = createMockSession();
      
      const mongoose = require('mongoose');
      mongoose.startSession.mockResolvedValue(mockSession);

      // Act
      const result = await TransactionService.executeTransaction([mockCallback]);

      // Assert
      expect(result.success).toBe(true);
      expect(result.attempt).toBe(2);
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });
});
