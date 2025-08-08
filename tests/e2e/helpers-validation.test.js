/**
 * TEST SIMPLE POUR VALIDER LES HELPERS TRADES
 */

const E2EHelpers = require('./helpers/E2EHelpers');

describe('🧪 Test Helpers Trades', () => {
  
  test('createTrade en mode mock', async () => {
    // Force le mode mock
    global.isDbConnected = false;
    
    const mockToken = 'mock_token_123';
    const tradeData = {
      requestedObjects: ['obj1', 'obj2'],
      message: 'Test trade'
    };
    
    const result = await E2EHelpers.createTrade(mockToken, tradeData);
    
    expect(result.success).toBe(true);
    expect(result.trade).toBeDefined();
    expect(result.trade.status).toBe('pending');
    console.log('✅ createTrade helper fonctionne');
  });

  test('acceptTrade en mode mock', async () => {
    global.isDbConnected = false;
    
    const mockToken = 'mock_token_123';
    const tradeId = 'trade_123';
    
    const result = await E2EHelpers.acceptTrade(mockToken, tradeId);
    
    expect(result.success).toBe(true);
    expect(result.trade.status).toBe('accepted');
    console.log('✅ acceptTrade helper fonctionne');
  });

  test('makeCounterProposal en mode mock', async () => {
    global.isDbConnected = false;
    
    const mockToken = 'mock_token_123';
    const proposalData = {
      tradeId: 'trade_123',
      offeredObjects: ['obj3', 'obj4']
    };
    
    const result = await E2EHelpers.makeCounterProposal(mockToken, proposalData);
    
    expect(result.success).toBe(true);
    expect(result.trade.status).toBe('proposed');
    console.log('✅ makeCounterProposal helper fonctionne');
  });

  test('completeTrade en mode mock', async () => {
    global.isDbConnected = false;
    
    const mockToken = 'mock_token_123';
    const tradeId = 'trade_123';
    
    const result = await E2EHelpers.completeTrade(mockToken, tradeId);
    
    expect(result.success).toBe(true);
    expect(result.trade.status).toBe('completed');
    console.log('✅ completeTrade helper fonctionne');
  });

  test('sendTradeMessage en mode mock', async () => {
    global.isDbConnected = false;
    
    const mockToken = 'mock_token_123';
    const tradeId = 'trade_123';
    const messageData = { content: 'Test message' };
    
    const result = await E2EHelpers.sendTradeMessage(mockToken, tradeId, messageData);
    
    expect(result.success).toBe(true);
    expect(result.message.content).toBe('Test message');
    console.log('✅ sendTradeMessage helper fonctionne');
  });

  test('getUserTrades en mode mock', async () => {
    global.isDbConnected = false;
    
    const mockToken = 'mock_token_123';
    
    const result = await E2EHelpers.getUserTrades(mockToken);
    
    expect(result.success).toBe(true);
    expect(Array.isArray(result.trades)).toBe(true);
    console.log('✅ getUserTrades helper fonctionne');
  });

});
