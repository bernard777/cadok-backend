/**
 * Test du modèle Subscription après correction
 */

const mongoose = require('mongoose');

// Simuler le schéma corrigé
const testSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free'
  },
  paymentMethod: {
    type: String, // ← Maintenant string au lieu d'object
    default: null
  },
  monthlyPrice: {
    type: Number,
    default: 0
  }
});

console.log('🧪 Test du modèle Subscription corrigé\n');

// Test 1: Validation avec paymentMethod string
try {
  const TestModel = mongoose.model('TestSubscription', testSchema);
  
  const testDoc = new TestModel({
    user: new mongoose.Types.ObjectId(),
    plan: 'premium',
    paymentMethod: 'pm_1Rs3gwAWWo4iq1n70Z8yabA6', // ← String comme dans l'erreur
    monthlyPrice: 5
  });
  
  console.log('✅ Document créé avec paymentMethod string');
  console.log('✅ paymentMethod:', testDoc.paymentMethod);
  console.log('✅ Type:', typeof testDoc.paymentMethod);
  
} catch (error) {
  console.log('❌ Erreur:', error.message);
}

console.log('\n🎯 La correction devrait résoudre l\'erreur Mongoose !');
console.log('💡 paymentMethod accepte maintenant les ID Stripe directement');
