/**
 * Tests unitaires simplifiés pour le système de logging
 * 🎯 Tests avec mocks universels - Focalisés sur le fonctionnement essentiel
 */

const { logger, ContextualLogger, PerformanceMetrics } = require('../../utils/logger');

describe('📝 Logger System - Tests Unitaires Simplifiés', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('🔧 Configuration du Logger', () => {
    it('devrait avoir un logger fonctionnel', () => {
      // Act & Assert
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('devrait pouvoir utiliser les méthodes de logging', () => {
      // Act
      logger.info('Test message');
      logger.error('Test error');
      logger.warn('Test warning');

      // Assert - Les mocks winston devraient intercepter ces appels
      expect(logger.info).toHaveBeenCalledWith('Test message');
      expect(logger.error).toHaveBeenCalledWith('Test error');
      expect(logger.warn).toHaveBeenCalledWith('Test warning');
    });
  });

  describe('📊 ContextualLogger', () => {
    it('devrait créer un logger contextuel avec requestId', () => {
      // Arrange
      const requestId = 'test-request-123';

      // Act
      const contextualLogger = new ContextualLogger(requestId);

      // Assert
      expect(contextualLogger).toBeDefined();
      expect(contextualLogger.requestId).toBe(requestId);
    });

    it('devrait ajouter le requestId aux logs', () => {
      // Arrange
      const requestId = 'test-request-123';
      const contextualLogger = new ContextualLogger(requestId);

      // Act
      contextualLogger.info('Test message', { extra: 'data' });

      // Assert - Vérifier que le logger principal a été appelé avec le bon contexte
      expect(logger.info).toHaveBeenCalledWith('Test message', {
        requestId: 'test-request-123',
        userId: null,
        extra: 'data'
      });
    });

    it('devrait gérer les logs d\'erreur avec stack trace', () => {
      // Arrange
      const requestId = 'test-request-123';
      const contextualLogger = new ContextualLogger(requestId);
      const error = new Error('Test error');

      // Act
      contextualLogger.error('Error occurred', {
        error: error.message,
        stack: error.stack
      });

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        requestId: 'test-request-123',
        userId: null,
        error: error.message,
        stack: error.stack
      });
    });
  });

  describe('⏱️ PerformanceMetrics', () => {
    it('devrait avoir les méthodes de performance', () => {
      // Assert
      expect(PerformanceMetrics).toBeDefined();
      expect(PerformanceMetrics.startTimer).toBeDefined();
      expect(PerformanceMetrics.endTimer).toBeDefined();
    });

    it('devrait pouvoir démarrer et arrêter un timer', () => {
      // Act
      PerformanceMetrics.startTimer('test-operation');
      const duration = PerformanceMetrics.endTimer('test-operation');

      // Assert
      expect(duration).toBeGreaterThan(0); // Duration devrait être un nombre positif
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: test-operation'),
        expect.objectContaining({
          operation: 'test-operation'
        })
      );
    });

    it('devrait gérer les métriques avec requestId', () => {
      // Arrange
      const requestId = 'test-request-123';

      // Act
      PerformanceMetrics.startTimer('test-operation', requestId);
      PerformanceMetrics.endTimer('test-operation', requestId);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: test-operation'),
        expect.objectContaining({
          operation: 'test-operation',
          requestId: 'test-request-123'
        })
      );
    });
  });

  describe('🔍 Fonctionnalités avancées', () => {
    it('devrait gérer les objets complexes dans les logs', () => {
      // Arrange
      const contextualLogger = new ContextualLogger('test');
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      };

      // Act
      contextualLogger.info('Complex object', complexObject);

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Complex object', {
        requestId: 'test',
        userId: null,
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      });
    });

    it('devrait supporter les logs avec userId', () => {
      // Arrange
      const requestId = 'test-request';
      const userId = 'user-123';
      const contextualLogger = new ContextualLogger(requestId, userId);

      // Act
      contextualLogger.info('User action', { action: 'login' });

      // Assert
      expect(logger.info).toHaveBeenCalledWith('User action', {
        requestId: 'test-request',
        userId: 'user-123',
        action: 'login'
      });
    });
  });
});
