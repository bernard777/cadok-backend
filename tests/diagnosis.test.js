const mongoose = require('mongoose');
/**
 * Test de diagnostic simple
 */

describe('Test de diagnostic', () => {
  it('devrait passer un test simple', () => {
    expect(1 + 1).toBe(2);
  });

  it('devrait pouvoir accéder aux variables d\'environnement', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});
