/**
 * Script de test pour les actions de troc
 */

console.log('\n=== TEST DES ACTIONS DE TROC ===\n');

// Scénarios de test
const scenarios = [
  {
    name: "USER 1 (Initiateur) - Statut PENDING",
    isRequester: true,
    status: 'pending',
    description: "L'utilisateur qui a initié le troc peut annuler sa demande",
    expectedActions: ["Annuler ma demande"]
  },
  {
    name: "USER 2 (Destinataire) - Statut PENDING", 
    isRequester: false,
    status: 'pending',
    description: "L'utilisateur qui reçoit la demande peut choisir un objet ou refuser",
    expectedActions: ["Choisir un objet en retour", "Refuser la demande"]
  },
  {
    name: "USER 1 (Initiateur) - Statut PROPOSED",
    isRequester: true, 
    status: 'proposed',
    description: "L'utilisateur qui a initié reçoit une contre-proposition",
    expectedActions: ["Accepter", "Refuser", "Demander autre chose"]
  },
  {
    name: "USER 2 (Destinataire) - Statut PROPOSED",
    isRequester: false,
    status: 'proposed', 
    description: "L'utilisateur qui a proposé attend la réponse",
    expectedActions: ["Aucune action (attente)"]
  }
];

// Logique simplifiée du ChatScreen
function getTradeActions(isRequester, status, trade = {}) {
  const actions = [];
  
  // Cas 1: L'utilisateur qui a fait la demande initiale
  if (isRequester && status === 'pending') {
    actions.push("Annuler ma demande");
  }
  
  // Cas 2: L'utilisateur reçoit une demande initiale
  if (!isRequester && status === 'pending') {
    actions.push("Choisir un objet en retour");
    actions.push("Refuser la demande");
  }
  
  // Cas 3: Le demandeur initial reçoit une contre-proposition
  if (isRequester && (status === 'proposed' || trade.offeredObjects?.length > 0)) {
    actions.push("Accepter");
    actions.push("Refuser"); 
    actions.push("Demander autre chose");
  }
  
  return actions.length > 0 ? actions : ["Aucune action (attente)"];
}

// Exécuter les tests
scenarios.forEach(scenario => {
  console.log(`📋 ${scenario.name}`);
  console.log(`   Description: ${scenario.description}`);
  console.log(`   Attendu: ${scenario.expectedActions.join(', ')}`);
  
  const actualActions = getTradeActions(scenario.isRequester, scenario.status);
  console.log(`   Réel: ${actualActions.join(', ')}`);
  
  const isCorrect = JSON.stringify(scenario.expectedActions.sort()) === JSON.stringify(actualActions.sort());
  console.log(`   ✅ ${isCorrect ? 'CORRECT' : '❌ INCORRECT'}\n`);
});

console.log('=== TEST TERMINÉ ===\n');
