/**
 * 🌍 BASE CARBONE ADEME - FACTEURS D'ÉMISSION OFFICIELS
 * Source: Base Carbone ADEME 2024
 * Unité: kg CO2 équivalent
 */

const ADEME_CARBON_FACTORS = {
  // 📱 ÉLECTRONIQUE & HIGH-TECH
  'smartphone': {
    production: 70.0,      // kg CO2eq production
    transport: 3.5,        // kg CO2eq transport mondial
    usage_per_year: 8.2,   // kg CO2eq utilisation/an
    lifespan_years: 3,     // durée de vie moyenne
    end_of_life: 0.8       // kg CO2eq traitement fin de vie
  },
  'laptop': {
    production: 300.0,
    transport: 12.0,
    usage_per_year: 85.0,
    lifespan_years: 5,
    end_of_life: 3.2
  },
  'tablet': {
    production: 120.0,
    transport: 6.0,
    usage_per_year: 15.0,
    lifespan_years: 4,
    end_of_life: 1.5
  },
  'tv_55_inch': {
    production: 450.0,
    transport: 25.0,
    usage_per_year: 150.0,
    lifespan_years: 8,
    end_of_life: 12.0
  },
  'console_jeux': {
    production: 180.0,
    transport: 8.0,
    usage_per_year: 95.0,
    lifespan_years: 6,
    end_of_life: 2.5
  },

  // 👕 VÊTEMENTS & TEXTILE
  'jean': {
    production: 25.0,
    transport: 1.5,
    usage_per_year: 2.1,   // lavage, séchage
    lifespan_years: 5,
    end_of_life: 0.3
  },
  'tshirt_coton': {
    production: 8.5,
    transport: 0.8,
    usage_per_year: 1.2,
    lifespan_years: 3,
    end_of_life: 0.2
  },
  'chaussures_cuir': {
    production: 35.0,
    transport: 2.5,
    usage_per_year: 0.5,
    lifespan_years: 4,
    end_of_life: 1.2
  },
  'manteau_hiver': {
    production: 75.0,
    transport: 4.0,
    usage_per_year: 1.8,
    lifespan_years: 8,
    end_of_life: 2.1
  },

  // 🪑 MOBILIER & DÉCORATION
  'canape_3_places': {
    production: 850.0,
    transport: 45.0,
    usage_per_year: 2.0,
    lifespan_years: 15,
    end_of_life: 35.0
  },
  'table_bois': {
    production: 320.0,
    transport: 18.0,
    usage_per_year: 1.0,
    lifespan_years: 20,
    end_of_life: 12.0
  },
  'chaise': {
    production: 85.0,
    transport: 4.5,
    usage_per_year: 0.5,
    lifespan_years: 12,
    end_of_life: 3.2
  },
  'armoire': {
    production: 450.0,
    transport: 25.0,
    usage_per_year: 1.5,
    lifespan_years: 25,
    end_of_life: 18.0
  },

  // 🏠 ÉLECTROMÉNAGER
  'refrigerateur': {
    production: 520.0,
    transport: 28.0,
    usage_per_year: 185.0,
    lifespan_years: 12,
    end_of_life: 45.0
  },
  'lave_linge': {
    production: 420.0,
    transport: 22.0,
    usage_per_year: 95.0,
    lifespan_years: 10,
    end_of_life: 32.0
  },
  'micro_ondes': {
    production: 180.0,
    transport: 9.0,
    usage_per_year: 45.0,
    lifespan_years: 8,
    end_of_life: 8.5
  },
  'aspirateur': {
    production: 125.0,
    transport: 6.5,
    usage_per_year: 25.0,
    lifespan_years: 8,
    end_of_life: 5.2
  },

  // 🚗 VÉHICULES & TRANSPORT
  'voiture_essence': {
    production: 6500.0,
    transport: 200.0,
    usage_per_year: 2500.0, // 15000km/an
    lifespan_years: 12,
    end_of_life: 850.0
  },
  'velo_electrique': {
    production: 285.0,
    transport: 15.0,
    usage_per_year: 12.0,
    lifespan_years: 8,
    end_of_life: 25.0
  },
  'scooter': {
    production: 1200.0,
    transport: 45.0,
    usage_per_year: 680.0,
    lifespan_years: 10,
    end_of_life: 125.0
  },

  // 📚 CULTURE & LOISIRS
  'livre_papier': {
    production: 1.2,
    transport: 0.1,
    usage_per_year: 0.02,
    lifespan_years: 50,
    end_of_life: 0.05
  },
  'instrument_guitare': {
    production: 125.0,
    transport: 8.0,
    usage_per_year: 2.5,
    lifespan_years: 20,
    end_of_life: 12.0
  },
  'materiel_sport': {
    production: 45.0,
    transport: 3.0,
    usage_per_year: 1.5,
    lifespan_years: 8,
    end_of_life: 2.8
  },

  // 🌿 JARDIN & EXTÉRIEUR
  'tondeuse_electrique': {
    production: 285.0,
    transport: 12.0,
    usage_per_year: 35.0,
    lifespan_years: 12,
    end_of_life: 18.0
  },
  'mobilier_jardin': {
    production: 180.0,
    transport: 10.0,
    usage_per_year: 2.0,
    lifespan_years: 15,
    end_of_life: 8.5
  }
};

/**
 * Facteurs de transport selon la distance (kg CO2/km/kg de marchandise)
 */
const TRANSPORT_FACTORS = {
  local: 0.0001,      // < 50km (camion local)
  regional: 0.00015,  // 50-200km (camion régional)
  national: 0.0002,   // 200-800km (camion longue distance)
  international: 0.0005, // > 800km (bateau + camion)
  aviation: 0.002     // Transport aérien
};

/**
 * Facteurs de condition (impact de l'usure sur la valeur écologique)
 */
const CONDITION_FACTORS = {
  'neuf': 1.0,
  'excellent': 0.95,
  'tres_bon': 0.85,
  'bon': 0.75,
  'correct': 0.60,
  'use': 0.45,
  'pour_pieces': 0.20
};

/**
 * Mapping des catégories CADOK vers les facteurs ADEME
 */
const CATEGORY_MAPPING = {
  'Électronique': {
    'Smartphone': 'smartphone',
    'Ordinateur portable': 'laptop',
    'Tablette': 'tablet',
    'Télévision': 'tv_55_inch',
    'Console de jeux': 'console_jeux',
    'default': 'smartphone'
  },
  'Vêtements': {
    'Jean': 'jean',
    'T-shirt': 'tshirt_coton',
    'Chaussures': 'chaussures_cuir',
    'Manteau': 'manteau_hiver',
    'default': 'tshirt_coton'
  },
  'Meubles': {
    'Canapé': 'canape_3_places',
    'Table': 'table_bois',
    'Chaise': 'chaise',
    'Armoire': 'armoire',
    'default': 'chaise'
  },
  'Électroménager': {
    'Réfrigérateur': 'refrigerateur',
    'Lave-linge': 'lave_linge',
    'Micro-ondes': 'micro_ondes',
    'Aspirateur': 'aspirateur',
    'default': 'micro_ondes'
  },
  'Véhicules': {
    'Voiture': 'voiture_essence',
    'Vélo électrique': 'velo_electrique',
    'Scooter': 'scooter',
    'default': 'velo_electrique'
  },
  'Livres': {
    'default': 'livre_papier'
  },
  'Sport': {
    'Guitare': 'instrument_guitare',
    'default': 'materiel_sport'
  },
  'Jardin': {
    'Tondeuse': 'tondeuse_electrique',
    'default': 'mobilier_jardin'
  },
  'Décoration': {
    'default': 'chaise'
  },
  'Autre': {
    'default': 'livre_papier'
  }
};

module.exports = {
  ADEME_CARBON_FACTORS,
  TRANSPORT_FACTORS,
  CONDITION_FACTORS,
  CATEGORY_MAPPING
};
