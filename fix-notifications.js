// Script pour corriger toutes les notifications qui manquent le champ title
const fs = require('fs');
const path = './routes/trades.js';

console.log('🔧 Correction des notifications dans trades.js...');

let content = fs.readFileSync(path, 'utf8');

// Définir les mappings de messages vers des titres
const titleMappings = [
  { match: /message: "Votre proposition de troc a été acceptée\."/g, title: '"Troc accepté"' },
  { match: /message: "Votre demande de troc a été refusée\."/g, title: '"Troc refusé"' },
  { match: /message: "Une contre-proposition de troc a été faite\."/g, title: '"Contre-proposition reçue"' },
  { match: /message: "Votre proposition de troc a été acceptée\."/g, title: '"Proposition acceptée"' },
  { match: /message: "Votre proposition de troc a été refusée\."/g, title: '"Proposition refusée"' },
  { match: /message: "L'utilisateur a refusé votre proposition, veuillez proposer d'autres objets à la place\."/g, title: '"Nouvelle proposition demandée"' },
  { match: /message: "Votre demande de troc a été acceptée !"/g, title: '"Demande acceptée !"' },
  { match: /message: "Votre proposition de troc a été acceptée !"/g, title: '"Proposition acceptée !"' },
  { match: /message: "Votre demande de troc a été refusée\."/g, title: '"Demande refusée"' },
  { match: /message: "Une proposition a été faite pour votre demande de troc\."/g, title: '"Proposition reçue"' },
  { match: /message: `\${trade\.fromUser\.pseudo} vous demande de choisir un autre objet pour l'échange\.`/g, title: '"Changement demandé"' },
  { match: /message: 'L\\'échange a été finalisé avec succès\.'/g, title: '"Échange finalisé"' },
  { match: /message: `Vous avez reçu une nouvelle évaluation \(\${rating}\/5\) de votre troc avec \${req\.user\.pseudo \|\| 'un utilisateur'}\.`/g, title: '"Nouvelle évaluation"' }
];

// Remplacer toutes les notifications qui ont juste user et message
const notificationPattern = /await Notification\.create\(\{\s*user: ([^,\n]+),\s*message: ([^,\n]+),\s*type: ([^,\n]+),\s*trade: ([^,\n}]+)\s*\}\);/gm;

content = content.replace(notificationPattern, (match, user, message, type, trade) => {
  // Essayer de trouver un titre approprié basé sur le message
  let title = '"Notification"'; // titre par défaut
  
  if (message.includes('acceptée')) {
    title = '"Troc accepté"';
  } else if (message.includes('refusée') || message.includes('refusé')) {
    title = '"Troc refusé"';
  } else if (message.includes('proposition')) {
    title = '"Proposition de troc"';
  } else if (message.includes('évaluation')) {
    title = '"Nouvelle évaluation"';
  } else if (message.includes('finalisé')) {
    title = '"Échange finalisé"';
  } else if (message.includes('contre-proposition')) {
    title = '"Contre-proposition"';
  } else if (message.includes('demande')) {
    title = '"Demande de troc"';
  }
  
  return `await Notification.create({
      user: ${user},
      title: ${title},
      message: ${message},
      type: ${type},
      trade: ${trade}
    });`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Toutes les notifications ont été corrigées !');
