/**
 * TEST BASIQUE - Sans dépendances externes
 */

describe('🔧 TEST BASIQUE', () => {
  
  test('Addition simple', () => {
    console.log('✅ Test arithmétique');
    expect(2 + 2).toBe(4);
  });

  test('Check Jest fonctionne', () => {
    console.log('✅ Jest opérationnel');
    expect(true).toBe(true);
  });

});
