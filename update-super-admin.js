// Utilisons npm exec pour avoir accès à mongoose depuis le projet parent
const { MongoClient } = require('mongodb');

async function updateSuperAdmin() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const email = 'ndongoambassa7@gmail.com';
    const db = client.db('cadok');
    const usersCollection = db.collection('users');
    
    // Vérifier si l'utilisateur existe
    const user = await usersCollection.findOne({ email });
    
    if (user) {
      console.log(`👤 Utilisateur trouvé: ${user.email}`);
      console.log(`📛 Nom: ${user.firstName} ${user.lastName}`);
      console.log(`🏷️  Rôle actuel: ${user.role || 'user'}`);
      
      // Mise à jour avec les permissions super admin
      const result = await usersCollection.updateOne(
        { email: email },
        {
          $set: {
            role: 'super_admin',
            isAdmin: true,
            permissions: {
              manageUsers: true,
              manageObjects: true,
              manageTrades: true,
              manageEvents: true,
              viewAnalytics: true,
              manageReviews: true,
              systemAdmin: true
            }
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('🔧 Permissions super admin accordées!');
        console.log('📋 Nouveau rôle: super_admin');
        console.log('🔑 isAdmin: true');
        console.log('✅ Vous pouvez maintenant vous connecter à l\'interface admin!');
      } else {
        console.log('⚠️  Aucune modification (déjà super admin?)');
      }
      
    } else {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('💡 Assurez-vous d\'avoir créé un compte avec cette adresse via l\'app mobile d\'abord');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.close();
    console.log('🔐 Déconnecté de MongoDB');
  }
}

updateSuperAdmin();
