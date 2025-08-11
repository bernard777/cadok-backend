/**
 * 🧪 GÉNÉRATEUR DE DONNÉES UTILISATEUR POUR TESTS
 * Génère des données utilisateur complètes avec tous les champs obligatoires
 */

class UserDataGenerator {
  
  /**
   * Génère des données utilisateur complètes avec tous les champs obligatoires
   */
  static generateCompleteUserData(customData = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    const baseData = {
      pseudo: `TestUser${timestamp}${random}`,
      email: `test${timestamp}${random}@cadok.com`,
      password: 'TestSecurePass123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      phoneNumber: '+33612345678',
      city: 'Paris',
      address: {
        street: '123 rue de la République',
        zipCode: '75001',
        city: 'Paris',
        country: 'France',
        additionalInfo: 'Bâtiment A, 2ème étage'
      }
    };
    
    // Fusionner avec les données personnalisées
    const userData = { ...baseData, ...customData };
    
    // Si l'adresse est personnalisée, fusionner intelligemment
    if (customData.address) {
      userData.address = { ...baseData.address, ...customData.address };
    }
    
    return userData;
  }
  
  /**
   * Génère des données utilisateur admin
   */
  static generateAdminUserData(customData = {}) {
    return this.generateCompleteUserData({
      pseudo: `AdminUser${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      email: `admin${Date.now()}${Math.random().toString(36).substr(2, 9)}@cadok.com`,
      firstName: 'Admin',
      lastName: 'System',
      city: 'Lyon',
      address: {
        street: '456 avenue de l\'Administration',
        zipCode: '69001',
        city: 'Lyon',
        country: 'France',
        additionalInfo: 'Bureau administratif'
      },
      ...customData
    });
  }
  
  /**
   * Génère des données utilisateur avec des variantes pour tester différents cas
   */
  static generateUserVariants() {
    const timestamp = Date.now();
    
    return {
      // Utilisateur français standard
      french: this.generateCompleteUserData({
        firstName: 'Marie',
        lastName: 'Martin',
        city: 'Marseille',
        address: {
          street: '789 boulevard de la Liberté',
          zipCode: '13001',
          city: 'Marseille',
          country: 'France'
        }
      }),
      
      // Utilisateur avec nom composé
      composedName: this.generateCompleteUserData({
        firstName: 'Jean-Pierre',
        lastName: 'Dubois-Martin',
        city: 'Toulouse',
        phoneNumber: '+33678901234',
        address: {
          street: '12 place Saint-Georges',
          zipCode: '31000',
          city: 'Toulouse',
          country: 'France',
          additionalInfo: 'Résidence Les Jardins'
        }
      }),
      
      // Utilisateur avec adresse complexe
      complexAddress: this.generateCompleteUserData({
        firstName: 'Sophie',
        lastName: 'Leclerc',
        city: 'Bordeaux',
        address: {
          street: '145 cours de l\'Intendance',
          zipCode: '33000',
          city: 'Bordeaux',
          country: 'France',
          additionalInfo: 'Résidence Le Grand Théâtre, Bât. C, Apt 42'
        }
      }),
      
      // Utilisateur DOM-TOM
      overseas: this.generateCompleteUserData({
        firstName: 'Antoine',
        lastName: 'Morel',
        city: 'Fort-de-France',
        phoneNumber: '+596696123456',
        address: {
          street: '23 rue Victor Hugo',
          zipCode: '97200',
          city: 'Fort-de-France',
          country: 'France',
          additionalInfo: 'Quartier Bellevue'
        }
      })
    };
  }
  
  /**
   * Génère des données pour tester la validation
   */
  static generateInvalidDataVariants() {
    const base = this.generateCompleteUserData();
    
    return {
      // Email invalide
      invalidEmail: { ...base, email: 'invalid-email' },
      
      // Mot de passe trop faible
      weakPassword: { ...base, password: '123' },
      
      // Numéro de téléphone invalide
      invalidPhone: { ...base, phoneNumber: '123456' },
      
      // Code postal invalide
      invalidZipCode: { ...base, address: { ...base.address, zipCode: '1234' } },
      
      // Prénom manquant
      missingFirstName: { ...base, firstName: '' },
      
      // Nom manquant
      missingLastName: { ...base, lastName: '' },
      
      // Adresse manquante
      missingAddress: { ...base, address: undefined },
      
      // Ville dans l'adresse manquante
      missingAddressCity: { ...base, address: { ...base.address, city: '' } }
    };
  }
}

module.exports = UserDataGenerator;
