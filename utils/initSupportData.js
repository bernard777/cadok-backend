const FAQ = require('../models/FAQ');
const Tutorial = require('../models/Tutorial');

const initializeSupportData = async () => {
  try {
    console.log('🎧 [SUPPORT] Initialisation des données de support...');

    // ========== DONNÉES FAQ INITIALES ==========
    const existingFAQs = await FAQ.countDocuments();
    if (existingFAQs === 0) {
      console.log('📋 [FAQ] Création des FAQs initiales...');
      
      const initialFAQs = [
        {
          category: 'general',
          question: 'Comment fonctionne Kadoc ?',
          answer: 'Kadoc est une plateforme d\'échange d\'objets qui permet de troquer vos affaires inutilisées contre celles d\'autres utilisateurs. Créez simplement un compte, ajoutez vos objets, parcourez les annonces et proposez des échanges !',
          tags: ['plateforme', 'échange', 'troc', 'fonctionnement'],
          order: 1
        },
        {
          category: 'account',
          question: 'Comment créer mon compte ?',
          answer: 'Téléchargez l\'application Kadoc, cliquez sur "S\'inscrire" et renseignez vos informations : email, mot de passe sécurisé, ville et pseudo. Vous recevrez un email de confirmation à valider.',
          tags: ['inscription', 'compte', 'email', 'validation'],
          order: 2
        },
        {
          category: 'trading',
          question: 'Comment proposer un échange ?',
          answer: 'Trouvez un objet qui vous intéresse, cliquez sur "Proposer un échange", sélectionnez un ou plusieurs de vos objets et ajoutez un message. L\'autre utilisateur recevra une notification.',
          tags: ['échange', 'proposition', 'objet', 'notification'],
          order: 3
        },
        {
          category: 'account',
          question: 'J\'ai oublié mon mot de passe, que faire ?',
          answer: 'Sur l\'écran de connexion, cliquez sur "Mot de passe oublié", saisissez votre email et suivez les instructions reçues par email pour créer un nouveau mot de passe.',
          tags: ['mot de passe', 'oublié', 'récupération', 'email'],
          order: 4
        },
        {
          category: 'trading',
          question: 'Peut-on annuler un échange ?',
          answer: 'Oui, tant que l\'échange n\'est pas confirmé par les deux parties, vous pouvez l\'annuler depuis l\'onglet "Mes échanges". Une fois confirmé, contactez l\'autre utilisateur pour discuter.',
          tags: ['annulation', 'échange', 'confirmation', 'mes échanges'],
          order: 5
        },
        {
          category: 'security',
          question: 'Mes données personnelles sont-elles sécurisées ?',
          answer: 'Absolument ! Vos données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos informations personnelles avec des tiers sans votre consentement explicite.',
          tags: ['sécurité', 'données', 'confidentialité', 'protection'],
          order: 6
        },
        {
          category: 'payment',
          question: 'Y a-t-il des frais sur Kadoc ?',
          answer: 'L\'utilisation de base de Kadoc est gratuite ! Nous proposons un abonnement Premium optionnel pour débloquer des fonctionnalités avancées comme la mise en avant d\'objets.',
          tags: ['gratuit', 'frais', 'premium', 'abonnement'],
          order: 7
        },
        {
          category: 'technical',
          question: 'L\'application plante ou fonctionne mal',
          answer: 'Essayez de fermer complètement l\'application et de la relancer. Si le problème persiste, vérifiez que vous avez la dernière version installée. Contactez-nous si les problèmes continuent.',
          tags: ['bug', 'plantage', 'performance', 'mise à jour'],
          order: 8
        },
        {
          category: 'trading',
          question: 'Comment évaluer la valeur de mes objets ?',
          answer: 'Consultez des sites de vente similaires pour estimer la valeur, tenez compte de l\'état de l\'objet et regardez les échanges similaires sur Kadoc. L\'équité est la clé d\'un bon échange !',
          tags: ['valeur', 'estimation', 'prix', 'équité'],
          order: 9
        },
        {
          category: 'general',
          question: 'Puis-je utiliser Kadoc sans smartphone ?',
          answer: 'Kadoc est actuellement disponible uniquement sur mobile (iOS et Android). Nous travaillons sur une version web qui sera bientôt disponible !',
          tags: ['mobile', 'smartphone', 'web', 'accessibilité'],
          order: 10
        }
      ];

      await FAQ.insertMany(initialFAQs);
      console.log(`✅ [FAQ] ${initialFAQs.length} FAQs créées avec succès`);
    } else {
      console.log(`ℹ️ [FAQ] ${existingFAQs} FAQs déjà présentes dans la base`);
    }

    // ========== DONNÉES TUTORIELS INITIALES ==========
    const existingTutorials = await Tutorial.countDocuments();
    if (existingTutorials === 0) {
      console.log('🎥 [TUTORIALS] Création des tutoriels initiaux...');
      
      const initialTutorials = [
        {
          category: 'basics',
          title: 'Premiers pas sur Kadoc',
          description: 'Découvrez comment naviguer dans l\'application, créer votre profil et comprendre les bases du troc sur Kadoc.',
          duration: '3:45',
          difficulty: 'débutant',
          thumbnail: 'https://via.placeholder.com/300x200/4A90E2/ffffff?text=Premiers+Pas',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          steps: [
            {
              title: 'Ouverture de l\'application',
              description: 'Lancez Kadoc et découvrez l\'interface principale',
              timestamp: '0:00'
            },
            {
              title: 'Navigation dans les onglets',
              description: 'Explorez les différents onglets : Accueil, Recherche, Ajouter, Échanges, Profil',
              timestamp: '0:30'
            },
            {
              title: 'Configuration du profil',
              description: 'Complétez votre profil avec photo et informations',
              timestamp: '1:15'
            },
            {
              title: 'Premier aperçu des objets',
              description: 'Parcourez les objets disponibles dans votre région',
              timestamp: '2:20'
            }
          ],
          tags: ['débutant', 'navigation', 'profil', 'interface'],
          order: 1
        },
        {
          category: 'basics',
          title: 'Ajouter votre premier objet',
          description: 'Apprenez à photographier, décrire et publier votre premier objet sur Kadoc en quelques étapes simples.',
          duration: '4:20',
          difficulty: 'débutant',
          thumbnail: 'https://via.placeholder.com/300x200/50C878/ffffff?text=Ajouter+Objet',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          steps: [
            {
              title: 'Accéder à l\'ajout d\'objet',
              description: 'Cliquez sur le bouton + au centre de la barre de navigation',
              timestamp: '0:00'
            },
            {
              title: 'Prendre de bonnes photos',
              description: 'Conseils pour des photos attractives et représentatives',
              timestamp: '0:45'
            },
            {
              title: 'Rédiger une description efficace',
              description: 'Comment décrire votre objet pour attirer les échangeurs',
              timestamp: '2:10'
            },
            {
              title: 'Choisir la catégorie et publier',
              description: 'Sélectionnez la bonne catégorie et finalisez la publication',
              timestamp: '3:30'
            }
          ],
          tags: ['ajout', 'objet', 'photos', 'description'],
          order: 2
        },
        {
          category: 'trading',
          title: 'Faire votre premier échange',
          description: 'Guide complet pour proposer, négocier et finaliser votre premier échange sur Kadoc.',
          duration: '6:15',
          difficulty: 'intermédiaire',
          thumbnail: 'https://via.placeholder.com/300x200/FF6B6B/ffffff?text=Premier+Échange',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          steps: [
            {
              title: 'Rechercher des objets intéressants',
              description: 'Utilisez les filtres et la recherche pour trouver ce que vous cherchez',
              timestamp: '0:00'
            },
            {
              title: 'Proposer un échange',
              description: 'Sélectionnez vos objets et rédigez une proposition attractive',
              timestamp: '1:30'
            },
            {
              title: 'Négocier avec le propriétaire',
              description: 'Communiquez efficacement via le chat intégré',
              timestamp: '3:20'
            },
            {
              title: 'Organiser la rencontre',
              description: 'Fixez un lieu sûr et un horaire pour l\'échange',
              timestamp: '4:45'
            },
            {
              title: 'Finaliser l\'échange',
              description: 'Confirmez la réception et laissez une évaluation',
              timestamp: '5:30'
            }
          ],
          tags: ['échange', 'proposition', 'négociation', 'rencontre'],
          order: 3
        },
        {
          category: 'features',
          title: 'Utiliser la recherche avancée',
          description: 'Maîtrisez tous les filtres et options de recherche pour trouver exactement ce que vous cherchez.',
          duration: '3:30',
          difficulty: 'intermédiaire',
          thumbnail: 'https://via.placeholder.com/300x200/9B59B6/ffffff?text=Recherche+Avancée',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          steps: [
            {
              title: 'Accéder à la recherche',
              description: 'Ouvrez l\'onglet recherche et ses options',
              timestamp: '0:00'
            },
            {
              title: 'Utiliser les filtres par catégorie',
              description: 'Filtrez par type d\'objet, état, et localisation',
              timestamp: '0:45'
            },
            {
              title: 'Recherche par mots-clés',
              description: 'Optimisez vos recherches textuelles',
              timestamp: '1:50'
            },
            {
              title: 'Sauvegarder vos recherches',
              description: 'Créez des alertes pour être notifié des nouveaux objets',
              timestamp: '2:40'
            }
          ],
          tags: ['recherche', 'filtres', 'alertes', 'navigation'],
          order: 4
        },
        {
          category: 'security',
          title: 'Sécurité et bonnes pratiques',
          description: 'Apprenez à échanger en toute sécurité et évitez les pièges courants sur les plateformes d\'échange.',
          duration: '5:45',
          difficulty: 'intermédiaire',
          thumbnail: 'https://via.placeholder.com/300x200/E74C3C/ffffff?text=Sécurité',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          steps: [
            {
              title: 'Vérifier les profils',
              description: 'Comment identifier les utilisateurs fiables',
              timestamp: '0:00'
            },
            {
              title: 'Choisir des lieux sûrs',
              description: 'Sélectionnez des points de rencontre publics et sécurisés',
              timestamp: '1:20'
            },
            {
              title: 'Reconnaître les arnaques',
              description: 'Signaux d\'alarme et comportements suspects à éviter',
              timestamp: '2:50'
            },
            {
              title: 'Utiliser le système de signalement',
              description: 'Comment signaler un utilisateur ou un comportement inapproprié',
              timestamp: '4:30'
            }
          ],
          tags: ['sécurité', 'prévention', 'signalement', 'bonnes pratiques'],
          order: 5
        },
        {
          category: 'advanced',
          title: 'Optimiser votre profil pour plus d\'échanges',
          description: 'Conseils d\'expert pour rendre votre profil attractif et augmenter vos chances d\'échange.',
          duration: '4:55',
          difficulty: 'avancé',
          thumbnail: 'https://via.placeholder.com/300x200/F39C12/ffffff?text=Optimisation+Profil',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          steps: [
            {
              title: 'Photo de profil impactante',
              description: 'Choisissez une photo qui inspire confiance',
              timestamp: '0:00'
            },
            {
              title: 'Rédiger une bio efficace',
              description: 'Présentez-vous de manière authentique et engageante',
              timestamp: '1:15'
            },
            {
              title: 'Gérer votre collection d\'objets',
              description: 'Organisez et mettez à jour régulièrement vos annonces',
              timestamp: '2:40'
            },
            {
              title: 'Construire votre réputation',
              description: 'Accumulez des évaluations positives et des badges',
              timestamp: '3:50'
            }
          ],
          tags: ['profil', 'optimisation', 'réputation', 'badges'],
          order: 6
        }
      ];

      await Tutorial.insertMany(initialTutorials);
      console.log(`✅ [TUTORIALS] ${initialTutorials.length} tutoriels créés avec succès`);
    } else {
      console.log(`ℹ️ [TUTORIALS] ${existingTutorials} tutoriels déjà présents dans la base`);
    }

    console.log('✅ [SUPPORT] Initialisation des données de support terminée');

  } catch (error) {
    console.error('❌ [SUPPORT] Erreur lors de l\'initialisation des données:', error.message);
    throw error;
  }
};

module.exports = { initializeSupportData };
