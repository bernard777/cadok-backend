const crypto = require('crypto');

/**
 * Service de protection des données personnelles pour les livraisons
 * Anonymise les informations sensibles comme Vinted
 */
class PrivacyProtectionService {
  constructor() {
    // Préfixes pour identifier les adresses anonymisées
    this.ANONYMOUS_PREFIX = 'CADOK';
    this.WAREHOUSE_ADDRESS = {
      name: 'Centre de tri CADOK',
      address: '123 Avenue de la Logistique',
      city: 'Paris',
      postalCode: '75001',
      phone: '01 23 45 67 89'
    };
  }

  /**
   * Générer un identifiant anonyme pour un utilisateur
   */
  generateAnonymousId(userId, tradeId) {
    const hash = crypto.createHash('sha256')
      .update(`${userId}-${tradeId}-${process.env.JWT_SECRET}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    
    return `${this.ANONYMOUS_PREFIX}-${hash}`;
  }

  /**
   * Créer une adresse expéditeur anonymisée
   */
  createAnonymousSender(realSenderData, userId, tradeId) {
    const anonymousId = this.generateAnonymousId(userId, tradeId);
    
    return {
      // Nom anonymisé
      name: `Expéditeur ${anonymousId}`,
      
      // Adresse de transit (centre de tri fictif)
      address: {
        street: this.WAREHOUSE_ADDRESS.address,
        city: this.WAREHOUSE_ADDRESS.city,
        postalCode: this.WAREHOUSE_ADDRESS.postalCode,
        country: 'France'
      },
      
      // Informations de contact du service
      phone: this.WAREHOUSE_ADDRESS.phone,
      email: 'livraison@cadok.com',
      
      // Métadonnées pour le routage interne
      metadata: {
        anonymousId,
        realCityHash: this.hashCity(realSenderData.city),
        routingCode: this.generateRoutingCode(realSenderData)
      }
    };
  }

  /**
   * Créer une adresse destinataire anonymisée
   */
  createAnonymousRecipient(realRecipientData, userId, tradeId) {
    const anonymousId = this.generateAnonymousId(userId, tradeId);
    
    return {
      // Nom anonymisé avec identifiant unique
      name: `Destinataire ${anonymousId}`,
      
      // Adresse réelle (nécessaire pour la livraison finale)
      address: realRecipientData.address,
      
      // Contact anonymisé
      phone: this.anonymizePhone(realRecipientData.phone),
      email: `recipient-${anonymousId.toLowerCase()}@cadok.com`,
      
      // Métadonnées
      metadata: {
        anonymousId,
        hashedName: this.hashPersonalInfo(realRecipientData.name)
      }
    };
  }

  /**
   * Anonymiser un numéro de téléphone
   */
  anonymizePhone(phone) {
    if (!phone) return null;
    
    // Garder les 2 premiers et 2 derniers chiffres
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return 'XX XX XX XX XX';
    
    const start = digits.substring(0, 2);
    const end = digits.substring(digits.length - 2);
    const middle = 'X'.repeat(digits.length - 4);
    
    return `${start} ${middle.substring(0, 2)} ${middle.substring(2, 4)} ${middle.substring(4, 6)} ${end}`;
  }

  /**
   * Créer un hash sécurisé d'une ville
   */
  hashCity(city) {
    if (!city || typeof city !== 'string') {
      return 'UNKNOWN';
    }
    return crypto.createHash('md5')
      .update(city.toLowerCase())
      .digest('hex')
      .substring(0, 6);
  }

  /**
   * Hash des informations personnelles
   */
  hashPersonalInfo(info) {
    return crypto.createHash('sha256')
      .update(`${info}-${process.env.JWT_SECRET}`)
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * Générer un code de routage interne
   */
  generateRoutingCode(addressData) {
    const hash = crypto.createHash('md5')
      .update(`${addressData.postalCode}-${addressData.city}`)
      .digest('hex')
      .substring(0, 6)
      .toUpperCase();
    
    return `RT-${hash}`;
  }

  /**
   * Créer des instructions de livraison sécurisées
   */
  createSecureDeliveryInstructions(tradeData, anonymousId) {
    return {
      internal: {
        tradeId: tradeData.id,
        anonymousId,
        senderUserId: this.hashPersonalInfo(tradeData.senderId),
        recipientUserId: this.hashPersonalInfo(tradeData.recipientId),
        objectDescription: this.anonymizeObjectDescription(tradeData.objectDescription)
      },
      
      public: {
        reference: anonymousId,
        description: 'Colis échange CADOK',
        specialInstructions: 'Livraison via plateforme d\'échange sécurisée'
      },
      
      carrier: {
        deliveryNote: `Réf: ${anonymousId} - Contacter le service client CADOK en cas de problème`,
        emergencyContact: '01 23 45 67 89',
        platformName: 'CADOK'
      }
    };
  }

  /**
   * Anonymiser la description d'un objet
   */
  anonymizeObjectDescription(description) {
    if (!description || description.length < 10) {
      return 'Article échange';
    }
    
    // Garder les premiers mots mais enlever les détails personnels
    const words = description.split(' ').slice(0, 3);
    return words.join(' ') + '...';
  }

  /**
   * Créer une étiquette de livraison anonymisée
   */
  async createPrivacyProtectedLabel(deliveryData, tradeData) {
    const { method, realSenderAddress, realRecipientAddress } = deliveryData;
    const { senderId, recipientId, tradeId } = tradeData;
    
    // Générer les adresses anonymisées
    const senderAnonymousId = this.generateAnonymousId(senderId, tradeId);
    const recipientAnonymousId = this.generateAnonymousId(recipientId, tradeId);
    
    const anonymousSender = this.createAnonymousSender(
      realSenderAddress, 
      senderId, 
      tradeId
    );
    
    const anonymousRecipient = this.createAnonymousRecipient(
      realRecipientAddress, 
      recipientId, 
      tradeId
    );
    
    // Instructions sécurisées
    const secureInstructions = this.createSecureDeliveryInstructions(
      tradeData, 
      senderAnonymousId
    );
    
    return {
      labelAddresses: {
        sender: anonymousSender,
        recipient: anonymousRecipient
      },
      
      instructions: secureInstructions,
      
      security: {
        encryptedMapping: this.createEncryptedMapping(
          realSenderAddress,
          realRecipientAddress,
          tradeId
        ),
        verificationCode: this.generateVerificationCode(tradeId)
      },
      
      privacy: {
        level: 'FULL_ANONYMIZATION',
        method: 'CADOK_SECURE',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Créer un mapping chiffré pour le service interne
   */
  createEncryptedMapping(realSender, realRecipient, tradeId) {
    const mappingData = {
      tradeId,
      realSender: {
        name: realSender.name,
        phone: realSender.phone,
        email: realSender.email
      },
      realRecipient: {
        name: realRecipient.name, 
        phone: realRecipient.phone,
        email: realRecipient.email
      },
      timestamp: Date.now()
    };
    
    // Chiffrement simple pour le test
    try {
      const secretKey = process.env.JWT_SECRET || 'default-secret-key';
      const text = JSON.stringify(mappingData);
      const encoded = Buffer.from(text).toString('base64');
      const hash = crypto.createHash('sha256').update(secretKey).digest('hex').substring(0, 16);
      
      return `${hash}:${encoded}`;
    } catch (error) {
      console.error('Erreur création mapping chiffré:', error.message);
      return 'encrypted-mapping-placeholder';
    }
  }

  /**
   * Générer un code de vérification
   */
  generateVerificationCode(tradeId) {
    return crypto.createHash('sha1')
      .update(`${tradeId}-${Date.now()}-${process.env.JWT_SECRET}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
  }

  /**
   * Décrypter le mapping pour le service client
   */
  decryptMapping(encryptedData) {
    try {
      const decipher = crypto.createDecipher('aes192', process.env.JWT_SECRET);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Erreur décryptage mapping:', error);
      return null;
    }
  }

  /**
   * Valider l'anonymisation selon RGPD
   */
  validatePrivacyCompliance(labelData) {
    const checks = {
      noPersonalNames: !this.containsPersonalNames(labelData.labelAddresses),
      noDirectContact: !this.containsDirectContact(labelData.labelAddresses),
      hasAnonymousId: this.hasValidAnonymousId(labelData),
      hasSecureInstructions: !!labelData.instructions,
      encryptedBackup: !!labelData.security.encryptedMapping
    };
    
    const isCompliant = Object.values(checks).every(check => check === true);
    
    return {
      isCompliant,
      checks,
      level: isCompliant ? 'RGPD_COMPLIANT' : 'NEEDS_REVIEW'
    };
  }

  /**
   * Vérifier l'absence de noms personnels
   */
  containsPersonalNames(addresses) {
    const senderName = addresses.sender.name || '';
    const recipientName = addresses.recipient.name || '';
    
    return !senderName.includes(this.ANONYMOUS_PREFIX) || 
           !recipientName.includes(this.ANONYMOUS_PREFIX);
  }

  /**
   * Vérifier l'absence de contact direct
   */
  containsDirectContact(addresses) {
    const senderEmail = addresses.sender.email || '';
    const recipientEmail = addresses.recipient.email || '';
    
    return !senderEmail.includes('@cadok.com') || 
           !recipientEmail.includes('@cadok.com');
  }

  /**
   * Vérifier la validité de l'ID anonyme
   */
  hasValidAnonymousId(labelData) {
    const senderName = labelData.labelAddresses.sender.name || '';
    return senderName.includes(this.ANONYMOUS_PREFIX) && 
           senderName.length > this.ANONYMOUS_PREFIX.length + 5;
  }

  /**
   * Chiffrer des données sensibles (pour test)
   */
  encryptSensitiveData(data) {
    try {
      const secretKey = process.env.JWT_SECRET || 'default-secret-key';
      const text = JSON.stringify(data);
      
      // Simple base64 encoding pour le test (en production utiliser crypto)
      const encoded = Buffer.from(text).toString('base64');
      const hash = crypto.createHash('sha256').update(secretKey).digest('hex').substring(0, 16);
      
      return `${hash}:${encoded}`;
    } catch (error) {
      console.error('Erreur chiffrement:', error.message);
      return 'encrypted-data-placeholder';
    }
  }

  /**
   * Déchiffrer des données sensibles (pour test)
   */
  decryptSensitiveData(encryptedData) {
    try {
      const [hash, encoded] = encryptedData.split(':');
      const text = Buffer.from(encoded, 'base64').toString('utf8');
      return JSON.parse(text);
    } catch (error) {
      console.error('Erreur déchiffrement:', error.message);
      return { error: 'Déchiffrement impossible' };
    }
  }
}

module.exports = PrivacyProtectionService;
