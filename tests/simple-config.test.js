/**
 * 🧪 TEST SIMPLE DE CONFIGURATION
 * Test minimal pour vérifier que Jest fonctionne
 */

describe('✅ Configuration Jest', () => {
  test('Doit fonctionner avec un test simple', () => {
    expect(1 + 1).toBe(2);
  });

  test('Doit avoir les variables d\'environnement', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('Doit pouvoir créer des objets JavaScript simples', () => {
    const testObject = {
      id: '123',
      name: 'Test',
      active: true
    };
    
    expect(testObject.id).toBe('123');
    expect(testObject.name).toBe('Test');
    expect(testObject.active).toBe(true);
  });
});
