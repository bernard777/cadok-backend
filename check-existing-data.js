/**
 * Script pour vérifier les données existantes et éviter les rate limits
 */
const mongoose = require('mongoose');

async function checkExistingData() {
    try {
        console.log('🔍 Connexion à MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/cadok_test');
        
        // Vérifier utilisateurs existants
        console.log('\n👥 UTILISATEURS EXISTANTS (test/pool):');
        const users = await mongoose.connection.db.collection('users')
            .find({
                $or: [
                    {email: {$regex: /test|pool/i}},
                    {pseudo: {$regex: /test|pool/i}}
                ]
            })
            .limit(15)
            .toArray();
        
        users.forEach((u, i) => {
            console.log(`  ${i+1}. ${u.pseudo} | ${u.email} | ${u._id}`);
        });
        
        // Vérifier objets existants
        console.log('\n📦 OBJETS EXISTANTS (test/pool):');
        const objects = await mongoose.connection.db.collection('objects')
            .find({
                $or: [
                    {title: {$regex: /test|pool/i}},
                    {description: {$regex: /test|pool/i}}
                ]
            })
            .limit(15)
            .toArray();
            
        objects.forEach((o, i) => {
            console.log(`  ${i+1}. ${o.title} | ${o.owner} | ${o._id} | ${o.estimatedValue}€`);
        });
        
        // Vérifier catégories
        console.log('\n🏷️ CATÉGORIES EXISTANTES:');
        const categories = await mongoose.connection.db.collection('categories')
            .find({})
            .limit(10)
            .toArray();
            
        categories.forEach((c, i) => {
            console.log(`  ${i+1}. ${c.name} | ${c._id}`);
        });
        
        console.log('\n📊 STATISTIQUES:');
        console.log(`  - Utilisateurs test/pool: ${users.length}`);
        console.log(`  - Objets test/pool: ${objects.length}`);
        console.log(`  - Catégories disponibles: ${categories.length}`);
        
        return { users, objects, categories };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Déconnexion MongoDB');
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    checkExistingData();
}

module.exports = { checkExistingData };
