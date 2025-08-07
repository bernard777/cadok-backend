/**
 * SÉQUENCEUR DE TESTS E2E MODULAIRES
 * Contrôle l'ordre d'exécution des features pour éviter les interférences
 */

const Sequencer = require('@jest/test-sequencer').default;

class E2ESequencer extends Sequencer {
  /**
   * Définir l'ordre d'exécution des features
   */
  sort(tests) {
    // Ordre logique des features
    const order = [
      'auth.test.js',       // 1. D'abord l'authentification
      'objects.test.js',    // 2. Puis la gestion d'objets
      'trades.test.js',     // 3. Ensuite les échanges
      'payments.test.js'    // 4. Enfin les paiements
    ];

    const orderMap = new Map();
    order.forEach((name, index) => {
      orderMap.set(name, index);
    });

    return tests.sort((testA, testB) => {
      const nameA = testA.path.split('/').pop();
      const nameB = testB.path.split('/').pop();
      
      const orderA = orderMap.get(nameA) ?? 999;
      const orderB = orderMap.get(nameB) ?? 999;
      
      return orderA - orderB;
    });
  }
}

module.exports = E2ESequencer;
