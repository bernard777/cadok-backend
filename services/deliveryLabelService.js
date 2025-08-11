/**
 * Service de génération de bordereaux d'envoi avec redirection anonyme
 * Système CADOK de protection des adresses utilisateurs
 */

const User = require('../models/User');
const Trade = require('../models/Trade');
const QRCode = require('qrcode'); // npm install qrcode
const PDFDocument = require('pdfkit'); // npm install pdfkit
const fs = require('fs');
const path = require('path');
const PrivacyProtectionService = require('./PrivacyProtectionService');

class DeliveryLabelService {
  constructor() {
    // Adresse centrale CADOK (peut être votre bureau ou partenaire logistique)
    this.centralAddress = {
      company: "CADOK LOGISTICS",
      street: "15 Avenue des Trocs", // Votre adresse réelle ou partenaire
      city: "Paris",
      zipCode: "75001",
      country: "France",
      phone: "+33 1 XX XX XX XX"
    };

    // Initialiser le service de protection des données
    this.privacyService = new PrivacyProtectionService();
  }

  /**
   * Générer un bordereau d'envoi avec redirection automatique
   */
  async generateDeliveryLabel(tradeId, fromUserId) {
    try {
      const trade = await Trade.findById(tradeId)
        .populate('fromUser', 'pseudo email city firstName lastName phoneNumber address')
        .populate('toUser', 'pseudo email city firstName lastName phoneNumber address');
        
      if (!trade) {
        throw new Error('Troc non trouvé');
      }

      const fromUser = trade.fromUser;
      const toUser = trade.toUser;
      
      // Vérifier que l'utilisateur est bien l'expéditeur
      if (fromUser._id.toString() !== fromUserId) {
        throw new Error('Utilisateur non autorisé pour ce troc');
      }

      // Générer les codes de redirection
      const redirectionCode = await this.generateRedirectionCode(tradeId, fromUserId, toUser._id);
      
      // Créer les instructions de livraison spéciales
      const deliveryInstructions = await this.createDeliveryInstructions(trade, redirectionCode);
      
      // Générer le QR code de traçabilité
      const qrCodeData = await this.generateTrackingQRCode(tradeId, redirectionCode);
      
      // Créer le PDF du bordereau
      const labelPDF = await this.createLabelPDF(trade, deliveryInstructions, qrCodeData);
      
      return {
        success: true,
        labelUrl: labelPDF.url,
        redirectionCode: redirectionCode.code,
        instructions: deliveryInstructions,
        estimatedDelivery: this.calculateEstimatedDelivery(fromUser.city, toUser.city)
      };

    } catch (error) {
      console.error('Erreur génération bordereau:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un code de redirection unique
   */
  async generateRedirectionCode(tradeId, fromUserId, toUserId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `CADOK-${randomStr}-${timestamp.slice(-4)}`;
    
    // Stocker la redirection dans la base de données
    const redirectionData = {
      code: code,
      tradeId: tradeId,
      fromUserId: fromUserId,
      toUserId: toUserId,
      createdAt: new Date(),
      status: 'active',
      // IMPORTANT: Adresse réelle du destinataire (chiffrée)
      realDestination: await this.encryptUserAddress(toUserId)
    };

    // Sauvegarder dans une collection de redirections
    await this.saveRedirectionMapping(redirectionData);
    
    return redirectionData;
  }

  /**
   * Créer les instructions de livraison spéciales
   */
  async createDeliveryInstructions(trade, redirectionCode) {
    const toUser = trade.toUser;
    
    return {
      // Adresse d'envoi apparente (centre CADOK)
      shippingAddress: {
        name: `CADOK REDIRECTION`,
        attention: redirectionCode.code, // Code de redirection bien visible
        street: this.centralAddress.street,
        city: this.centralAddress.city,
        zipCode: this.centralAddress.zipCode,
        country: this.centralAddress.country
      },
      
      // Instructions spéciales pour le transporteur
      specialInstructions: [
        `🔄 REDIRECTION AUTOMATIQUE`,
        `Code: ${redirectionCode.code}`,
        `Troc: ${trade._id.toString().slice(-8)}`,
        `Livraison finale: ${toUser.city}`,
        `📞 Contact: ${this.centralAddress.phone}`
      ],
      
      // Instructions pour l'expéditeur
      senderInstructions: [
        "✅ Utilisez EXACTEMENT cette adresse",
        "✅ Mentionnez bien le code de redirection",
        "✅ Conservez votre numéro de suivi",
        "⚠️ Ne modifiez RIEN sur l'étiquette"
      ]
    };
  }

  /**
   * Générer le QR code de traçabilité
   */
  async generateTrackingQRCode(tradeId, redirectionCode) {
    const trackingData = {
      type: 'CADOK_DELIVERY',
      tradeId: tradeId,
      redirectionCode: redirectionCode.code,
      timestamp: new Date().toISOString(),
      trackingUrl: `https://cadok.com/track/${redirectionCode.code}`
    };
    
    const qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(trackingData), {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      buffer: qrCodeBuffer,
      data: trackingData
    };
  }

  /**
   * Créer le PDF du bordereau d'envoi
   */
  async createLabelPDF(trade, deliveryInstructions, qrCodeData) {
    const doc = new PDFDocument({ size: 'A4', margin: 20 });
    const filename = `delivery-label-${trade._id}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../uploads/labels', filename);
    
    // S'assurer que le dossier existe
    const labelDir = path.dirname(filepath);
    if (!fs.existsSync(labelDir)) {
      fs.mkdirSync(labelDir, { recursive: true });
    }
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // En-tête CADOK
    doc.fillColor('#2E86AB')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('CADOK DELIVERY LABEL', 50, 50);
    
    doc.fillColor('#666666')
       .fontSize(12)
       .font('Helvetica')
       .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 50, 80);
    
    // Cadre principal
    doc.rect(40, 110, 520, 350).stroke();
    
    // Section expéditeur
    doc.fillColor('#000000')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('EXPÉDITEUR:', 60, 130);
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`${trade.fromUser.pseudo}`, 60, 150)
       .text(`Ville: ${trade.fromUser.city}`, 60, 165)
       .text(`Troc ID: ${trade._id.toString().slice(-12)}`, 60, 180);
    
    // Section destinataire (avec redirection)
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('DESTINATAIRE (REDIRECTION CADOK):', 60, 220);
    
    const addr = deliveryInstructions.shippingAddress;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#E63946')
       .text(`${addr.name}`, 60, 245)
       .text(`${addr.attention}`, 60, 265)
       .fillColor('#000000')
       .fontSize(12)
       .font('Helvetica')
       .text(`${addr.street}`, 60, 285)
       .text(`${addr.zipCode} ${addr.city}`, 60, 300)
       .text(`${addr.country}`, 60, 315);
    
    // Instructions spéciales
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('INSTRUCTIONS SPÉCIALES:', 60, 350);
    
    deliveryInstructions.specialInstructions.forEach((instruction, index) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• ${instruction}`, 70, 370 + (index * 15));
    });
    
    // QR Code
    doc.image(qrCodeData.buffer, 450, 130, { width: 100, height: 100 });
    doc.fontSize(10)
       .text('Scan pour suivi', 465, 240);
    
    // Section instructions expéditeur
    doc.rect(40, 480, 520, 120).stroke();
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2E86AB')
       .text('INSTRUCTIONS POUR L\'EXPÉDITEUR:', 60, 500);
    
    deliveryInstructions.senderInstructions.forEach((instruction, index) => {
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica')
         .text(instruction, 70, 520 + (index * 18));
    });
    
    // Footer
    doc.fontSize(8)
       .fillColor('#999999')
       .text(`CADOK - Système de redirection automatique - ${this.centralAddress.phone}`, 50, 750);
    
    doc.end();
    
    // Attendre que le fichier soit créé
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });
    
    return {
      filepath: filepath,
      filename: filename,
      url: `/uploads/labels/${filename}` // URL relative pour l'app
    };
  }

  /**
   * Sauvegarder le mapping de redirection
   */
  async saveRedirectionMapping(redirectionData) {
    // Dans un vrai système, vous stockeriez dans une collection MongoDB
    // Pour l'exemple, on simule :
    
    const RedirectionMapping = {
      code: redirectionData.code,
      tradeId: redirectionData.tradeId,
      fromUserId: redirectionData.fromUserId,
      toUserId: redirectionData.toUserId,
      realDestination: redirectionData.realDestination,
      createdAt: redirectionData.createdAt,
      status: 'active'
    };
    
    // TODO: Sauvegarder en base
    console.log('💾 Mapping de redirection sauvegardé:', RedirectionMapping);
    
    return RedirectionMapping;
  }

  /**
   * Chiffrer l'adresse réelle de l'utilisateur avec PrivacyProtectionService
   */
  async encryptUserAddress(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Utilisateur non trouvé');
    
    // Vérifier que l'utilisateur a une adresse complète
    if (!user.address || !user.address.street || !user.address.zipCode) {
      throw new Error('Adresse utilisateur incomplète');
    }
    
    // Construire l'objet adresse complète avec toutes les données sensibles
    const realAddress = {
      // Informations personnelles
      firstName: user.firstName,
      lastName: user.lastName,
      pseudo: user.pseudo,
      phoneNumber: user.phoneNumber,
      
      // Adresse complète
      street: user.address.street,
      city: user.address.city,
      zipCode: user.address.zipCode,
      country: user.address.country,
      additionalInfo: user.address.additionalInfo || '',
      
      // Métadonnées pour la livraison
      userId: user._id.toString(),
      timestamp: new Date().toISOString()
    };
    
    // Utiliser le PrivacyProtectionService pour chiffrer avec AES-256
    return this.privacyService.encryptSensitiveData(realAddress);
  }

  /**
   * Calculer la livraison estimée
   */
  calculateEstimatedDelivery(fromCity, toCity) {
    const now = new Date();
    let deliveryDays = 2; // Défaut 2 jours
    
    // Logique simple selon les villes
    if (fromCity === toCity) {
      deliveryDays = 1; // Même ville
    } else if (this.isNearbyCity(fromCity, toCity)) {
      deliveryDays = 2; // Villes proches
    } else {
      deliveryDays = 3; // Plus éloignées
    }
    
    const estimatedDate = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
    return estimatedDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }

  /**
   * Vérifier si deux villes sont proches
   */
  isNearbyCity(city1, city2) {
    // Logique simplifiée - dans un vrai système, vous utiliseriez une API de géolocalisation
    const nearbyGroups = [
      ['Paris', 'Versailles', 'Boulogne', 'Neuilly'],
      ['Lyon', 'Villeurbanne', 'Caluire'],
      ['Marseille', 'Aix-en-Provence', 'Aubagne']
    ];
    
    return nearbyGroups.some(group => 
      group.includes(city1) && group.includes(city2)
    );
  }

  /**
   * Processus de redirection côté logistique (webhook)
   */
  async handleDeliveryRedirection(redirectionCode, carrierData) {
    try {
      // Récupérer les données de redirection
      const mapping = await this.getRedirectionMapping(redirectionCode);
      if (!mapping) {
        throw new Error('Code de redirection invalide');
      }

      // Déchiffrer l'adresse réelle
      const realAddress = await this.decryptUserAddress(mapping.realDestination);
      
      // Notifier le transporteur de la redirection
      const redirectionInstructions = {
        newDestination: realAddress,
        specialInstructions: [
          `Livraison finale pour troc CADOK`,
          `Destinataire: ${realAddress.name}`,
          `Code de référence: ${redirectionCode}`,
          `Contacter si problème: ${this.centralAddress.phone}`
        ]
      };
      
      // Dans un vrai système, ceci serait envoyé à l'API du transporteur
      console.log('🚚 Instructions de redirection:', redirectionInstructions);
      
      return {
        success: true,
        redirectionInstructions
      };

    } catch (error) {
      console.error('Erreur redirection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer un mapping de redirection
   */
  async getRedirectionMapping(code) {
    // TODO: Requête MongoDB
    console.log(`🔍 Recherche mapping pour code: ${code}`);
    return null; // Placeholder
  }

  /**
   * Déchiffrer une adresse avec PrivacyProtectionService
   */
  async decryptUserAddress(encryptedAddress) {
    try {
      // Utiliser le PrivacyProtectionService pour déchiffrer
      const decryptedData = this.privacyService.decryptSensitiveData(encryptedAddress);
      
      // Vérifier que les données déchiffrées sont valides
      if (decryptedData.error) {
        throw new Error('Erreur lors du déchiffrement: ' + decryptedData.error);
      }
      
      // Valider la structure des données déchiffrées
      if (!decryptedData.street || !decryptedData.zipCode || !decryptedData.city) {
        throw new Error('Données d\'adresse invalides après déchiffrement');
      }
      
      return {
        // Informations personnelles
        firstName: decryptedData.firstName,
        lastName: decryptedData.lastName,
        pseudo: decryptedData.pseudo,
        phoneNumber: this.privacyService.anonymizePhone(decryptedData.phoneNumber), // Anonymiser le téléphone pour affichage
        
        // Adresse
        street: decryptedData.street,
        city: decryptedData.city,
        zipCode: decryptedData.zipCode,
        country: decryptedData.country,
        additionalInfo: decryptedData.additionalInfo,
        
        // Métadonnées
        userId: decryptedData.userId,
        timestamp: decryptedData.timestamp
      };
    } catch (error) {
      console.error('Erreur déchiffrement adresse:', error.message);
      throw new Error('Impossible de déchiffrer l\'adresse de livraison');
    }
  }
}

module.exports = DeliveryLabelService;
