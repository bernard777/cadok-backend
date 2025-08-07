/**
 * DIAGNOSTIC DIRECT - COMPARAISON JEST vs NODE
 */

async function diagnosticComplet() {
  console.log('🔍 === DIAGNOSTIC COMPLET INSCRIPTION ===\n');
  
  try {
    // Charger dotenv
    require('dotenv').config();
    console.log('📝 Variables d\'environnement:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- MONGODB_URI:', process.env.MONGODB_URI);
    console.log('- JWT_SECRET défini:', !!process.env.JWT_SECRET);
    console.log('- PORT:', process.env.PORT);
    
    // Connecter MongoDB
    const { connectToDatabase, mongoose } = require('../../db');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok';
    await connectToDatabase(mongoUri);
    
    console.log('\n🔗 État MongoDB:');
    console.log('- readyState:', mongoose.connection.readyState);
    console.log('- database:', mongoose.connection.db?.databaseName);
    console.log('- host:', mongoose.connection.host);
    
    // Nettoyer la base
    const User = require('../../models/User');
    await User.deleteMany({});
    const userCount = await User.countDocuments();
    console.log('- utilisateurs après nettoyage:', userCount);
    
    // Charger l'app
    const app = require('../../app');
    const request = require('supertest');
    
    console.log('\n🧪 Test d\'inscription direct:');
    
    const testUser = {
      pseudo: `DirectTest_${Date.now()}`,
      email: `direct_${Date.now()}@test.com`,
      password: 'DirectTestPassword123!',
      city: 'Paris'
    };
    
    console.log('- Données envoyées:', testUser);
    
    // Vérifier avant envoi
    const existingBefore = await User.findOne({ email: testUser.email });
    console.log('- Email existe avant envoi:', !!existingBefore);
    
    // Faire la requête
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    console.log('- Status reçu:', response.status);
    console.log('- Headers:', response.headers);
    console.log('- Body reçu:', JSON.stringify(response.body, null, 2));
    
    // Vérifier après envoi
    const existingAfter = await User.findOne({ email: testUser.email });
    console.log('- Utilisateur créé en base:', !!existingAfter);
    
    if (existingAfter) {
      console.log('- Détails utilisateur créé:', {
        id: existingAfter._id,
        email: existingAfter.email,
        pseudo: existingAfter.pseudo,
        createdAt: existingAfter.createdAt
      });
    }
    
    // Analyser l'erreur si status 400
    if (response.status === 400) {
      console.log('\n❌ ANALYSE ERREUR 400:');
      
      if (response.body.message === 'Email déjà utilisé') {
        console.log('- Problème: Email en conflit');
        
        // Chercher tous les utilisateurs avec des emails similaires
        const pattern = testUser.email.split('@')[0]; // partie avant @
        const similarUsers = await User.find({
          email: { $regex: pattern, $options: 'i' }
        });
        console.log('- Utilisateurs avec emails similaires:', similarUsers.length);
        
        if (similarUsers.length > 0) {
          console.log('- Détails des conflits:', similarUsers.map(u => ({
            email: u.email,
            pseudo: u.pseudo,
            id: u._id
          })));
        }
        
      } else if (response.body.errors) {
        console.log('- Problème: Validation des champs');
        response.body.errors.forEach(error => {
          console.log(`  * ${error.msg} (champ: ${error.path || error.param})`);
        });
        
      } else {
        console.log('- Problème: Inconnu');
        console.log('- Response complète:', response);
      }
    }
    
    console.log('\n🔄 Test avec email ultra-unique:');
    
    const ultraUniqueUser = {
      pseudo: `Ultra_${Date.now()}_${process.pid}_${Math.random().toString(36)}`,
      email: `ultra_${Date.now()}_${process.pid}_${Math.random().toString(36)}_${Math.random()}@nowhere.test`,
      password: 'UltraTestPassword123!',
      city: 'Paris'
    };
    
    console.log('- Email ultra-unique:', ultraUniqueUser.email);
    
    const ultraResponse = await request(app)
      .post('/api/auth/register')
      .send(ultraUniqueUser);
    
    console.log('- Status ultra-unique:', ultraResponse.status);
    console.log('- Body ultra-unique:', ultraResponse.body);
    
    await mongoose.disconnect();
    
    console.log('\n🎯 === FIN DU DIAGNOSTIC ===');
    
    // Résumé final
    if (response.status === 201) {
      console.log('✅ VERDICT: L\'inscription fonctionne en direct');
    } else {
      console.log('❌ VERDICT: L\'inscription échoue même en direct');
      console.log('🔍 CAUSE PROBABLE:', 
        response.status === 400 ? 'Problème de validation ou conflit email' :
        response.status === 500 ? 'Erreur serveur interne' :
        'Cause inconnue'
      );
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
}

diagnosticComplet();
