// Script d'insertion rapide d'objets de test pour la collection Object
const mongoose = require('mongoose');
const ObjectModel = require('../models/Object');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';

const objects = [
  {
    title: "Harry Potter à l'école des sorciers",
    description: "Livre en bon état, édition poche.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c75"),
    owner: new mongoose.Types.ObjectId("68836e3c5aa604567a758466"),
    status: "available",
    images: []
  },
  {
    title: "Veste en jean Levi's",
    description: "Veste taille M, très bon état, peu portée.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c76"),
    owner: new mongoose.Types.ObjectId("6883c70e16bb723336ce17ee"),
    status: "available",
    images: []
  },
  {
    title: "iPhone 12",
    description: "iPhone 12, 64Go, bleu, excellent état.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c7d"),
    owner: new mongoose.Types.ObjectId("68836e3c5aa604567a758466"),
    status: "available",
    images: []
  },
  {
    title: "Table basse scandinave",
    description: "Meuble en bois massif, style scandinave.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c79"),
    owner: new mongoose.Types.ObjectId("688b33501d66a7228cae424b"),
    status: "available",
    images: []
  },
  {
    title: "Monopoly édition 2020",
    description: "Jeu de société complet, comme neuf.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c78"),
    owner: new mongoose.Types.ObjectId("6883c70e16bb723336ce17ee"),
    status: "available",
    images: []
  },
  {
    title: "Chaussures Nike Air Max",
    description: "Pointure 42, très bon état.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c7e"),
    owner: new mongoose.Types.ObjectId("68836e3c5aa604567a758466"),
    status: "available",
    images: []
  },
  {
    title: "Ordinateur portable Dell XPS 13",
    description: "8Go RAM, 256Go SSD, parfait état.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c7c"),
    owner: new mongoose.Types.ObjectId("688b33501d66a7228cae424b"),
    status: "available",
    images: []
  },
  {
    title: "DVD Inception",
    description: "DVD original, très bon état.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c7b"),
    owner: new mongoose.Types.ObjectId("6883c70e16bb723336ce17ee"),
    status: "available",
    images: []
  },
  {
    title: "Voiture télécommandée",
    description: "Jouet pour enfant, fonctionne parfaitement.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c7a"),
    owner: new mongoose.Types.ObjectId("688b33501d66a7228cae424b"),
    status: "available",
    images: []
  },
  {
    title: "Casque audio Sony",
    description: "Électronique, bluetooth, très bon état.",
    category: new mongoose.Types.ObjectId("6884fc70b2a1044aef1d6c77"),
    owner: new mongoose.Types.ObjectId("68836e3c5aa604567a758466"),
    status: "available",
    images: []
  }
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  const result = await ObjectModel.insertMany(objects);
  console.log(`Objets insérés : ${result.length}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Erreur lors de l\'insertion :', err);
  process.exit(1);
});
