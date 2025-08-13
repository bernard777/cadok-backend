/**
 * 🦸‍♂️ CRÉATION RAPIDE DU SUPER ADMIN - CADOK PRODUCTION
 * Script simple pour créer uniquement le compte super admin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cadok_database';
const SUPER_ADMIN_EMAIL = 'ndongoambassa7@gmail.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin2024!';

async function createSuperAdmin() {
  try {
    console.log('🦸‍♂️ Création du Super Admin CADOK...');
    console.log('🎯 Base de données:', MONGODB_URI);
    
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Vérifier si le super admin existe déjà
    const existingAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingAdmin) {
      console.log(`⚠️ Super Admin ${SUPER_ADMIN_EMAIL} existe déjà !`);
      console.log('   Statut:', existingAdmin.role);
      console.log('   Admin:', existingAdmin.isAdmin ? 'Oui' : 'Non');
      
      if (!existingAdmin.isAdmin || existingAdmin.role !== 'super_admin') {
        console.log('🔄 Mise à niveau vers super admin...');
        
        await User.findByIdAndUpdate(existingAdmin._id, {
          role: 'super_admin',
          isAdmin: true,
          adminPermissions: {
            manageEvents: true,
            createEvents: true,
            moderateEvents: true,
            manageUsers: true,
            banUsers: true,
            viewUserDetails: true,
            manageTrades: true,
            approveTrades: true,
            resolveDisputes: true,
            moderateContent: true,
            deleteReports: true,
            manageReports: true,
            viewAnalytics: true,
            systemConfig: true,
            manageAdmins: true
          },
          adminActivatedAt: new Date()
        });
        
        console.log('✅ Compte mis à niveau vers super admin !');
      }
      
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    
    // Créer le super admin
    const superAdmin = new User({
      pseudo: 'SuperAdminKadoc',
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Administrateur',
      phoneNumber: '+33612345678',
      city: 'Nantes',
      address: {
        street: '1 Avenue des Administrateurs',
        zipCode: '44000',
        city: 'Nantes',
        country: 'France',
        additionalInfo: 'Centre de commande CADOK',
        isDefault: true,
        coordinates: [-1.5534, 47.2184], // Nantes
        precision: 'exact'
      },
      dateOfBirth: new Date('1985-01-01'),
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      
      // 🛡️ PERMISSIONS MAXIMALES
      role: 'super_admin',
      isAdmin: true,
      adminPermissions: {
        manageEvents: true,
        createEvents: true,
        moderateEvents: true,
        manageUsers: true,
        banUsers: true,
        viewUserDetails: true,
        manageTrades: true,
        approveTrades: true,
        resolveDisputes: true,
        moderateContent: true,
        deleteReports: true,
        manageReports: true,
        viewAnalytics: true,
        systemConfig: true,
        manageAdmins: true
      },
      adminActivatedAt: new Date(),
      
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      
      profile: {
        bio: 'Super Administrateur CADOK - Responsable de la plateforme et de la communauté.',
        interests: ['Administration', 'Sécurité', 'Développement'],
        preferredCategories: []
      },
      
      tradeStats: {
        totalTrades: 0,
        completedTrades: 0,
        successRate: 0,
        avgRating: 0,
        totalRatings: 0
      },
      
      createdAt: new Date(),
      lastLoginAt: new Date()
    });

    await superAdmin.save();
    
    console.log('\n🎉 SUPER ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('=' .repeat(50));
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Mot de passe:', SUPER_ADMIN_PASSWORD);
    console.log('🛡️ Rôle: super_admin');
    console.log('⚡ Permissions: TOUTES');
    console.log('📍 Localisation: Nantes, France');
    console.log('✅ Statut: Vérifié et Actif');
    console.log('\n🚀 Prêt pour l\'administration de CADOK !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
if (require.main === module) {
  createSuperAdmin();
}

module.exports = { createSuperAdmin };