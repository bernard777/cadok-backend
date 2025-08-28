/**
 * 📋 API TRANSPARENCE MÉTHODOLOGIQUE
 * Endpoint pour informations légales et scientifiques
 */

const express = require('express');
const router = express.Router();

/**
 * 📋 GET /api/transparency/methodology - Méthodologie complète
 */
router.get('/methodology', (req, res) => {
    res.json({
        title: "Méthodologie Écologique CADOK",
        version: "2.0",
        lastUpdated: "2025-08-28",
        
        objective: {
            primary: "Sensibilisation aux bénéfices écologiques de l'économie circulaire",
            secondary: "Estimation d'impact environnemental pour encourager la réutilisation",
            scope: "Biens de consommation courante en France"
        },

        ecological_data: {
            title: "Données d'Impact Écologique",
            reliability: "95%",
            sources: [
                {
                    name: "ADEME Base Carbone",
                    type: "Officiel gouvernemental français",
                    url: "https://bilans-ges.ademe.fr/",
                    description: "Facteurs d'émission validés scientifiquement",
                    examples: [
                        "Smartphone: 70 kg CO2eq (fabrication)",
                        "Ordinateur portable: 300 kg CO2eq",
                        "Télévision: 371 kg CO2eq"
                    ]
                },
                {
                    name: "Normes ISO 14040/14044",
                    type: "Standards internationaux",
                    description: "Méthodologie Analyse de Cycle de Vie (ACV)",
                    certification: "Reconnue mondialement"
                }
            ],
            methodology: "ACV (Analyse de Cycle de Vie) selon standards ISO",
            calculation: "Impact évité = (Impact fabrication neuf) - (Impact transport occasion)"
        },

        price_data: {
            title: "Données de Prix de Référence", 
            reliability: "70-85%",
            purpose: "Estimation économique pour calcul d'impact",
            sources: [
                {
                    name: "Données Gouvernementales",
                    type: "INSEE, Open Data France",
                    reliability: "Élevée",
                    usage: "Prix officiels et indices économiques"
                },
                {
                    name: "Algorithmes Propriétaires",
                    type: "Calculs basés sur études de marché",
                    reliability: "Bonne", 
                    methodology: "Moyennes sectorielles et facteurs de dépréciation"
                },
                {
                    name: "Consultation Sites Publics",
                    type: "Données publiquement accessibles",
                    reliability: "Variable",
                    legal_note: "Respectueuse des CGU et limitations techniques",
                    frequency: "Mise à jour hebdomadaire"
                }
            ],
            disclaimer: "Estimations indicatives basées sur moyennes de marché"
        },

        legal_compliance: {
            title: "Conformité Légale et Éthique",
            
            data_protection: {
                rgpd: "Conforme RGPD - Aucune donnée personnelle collectée",
                anonymization: "Données agrégées et anonymisées",
                purpose_limitation: "Usage strictement écologique et éducatif"
            },
            
            data_sourcing: {
                public_data: "Utilisation de données publiquement accessibles",
                respect_cgu: "Consultation respectueuse des conditions d'utilisation",
                technical_limits: "Rate limiting et charges serveur minimales",
                legal_basis: "Jurisprudence européenne favorable aux données publiques"
            },

            transparency: {
                open_methodology: "Méthodologie publique et auditable",
                source_disclosure: "Sources clairement identifiées",
                limitation_disclosure: "Marges d'erreur communiquées",
                continuous_improvement: "Amélioration continue basée sur recherche"
            }
        },

        limitations: {
            title: "Limitations et Marges d'Erreur",
            
            ecological_impact: {
                margin_error: "±15%",
                factors: [
                    "Variabilité fabricants",
                    "Évolution technologique", 
                    "Différences modèles"
                ],
                mitigation: "Utilisation facteurs ADEME moyens validés"
            },

            price_estimation: {
                margin_error: "±25-40%",
                factors: [
                    "Fluctuations marché",
                    "Variations géographiques",
                    "État réel vs estimé",
                    "Saisonnalité"
                ],
                mitigation: "Multiple sources et mise à jour fréquente"
            },

            general: [
                "Estimations statistiques, non contractuelles",
                "Basées sur moyennes nationales françaises", 
                "Amélioration continue selon nouvelles données",
                "Objectif de sensibilisation, pas de transaction"
            ]
        },

        scientific_validation: {
            peer_review: "Facteurs ADEME validés par comité scientifique",
            government_backing: "Soutenu par ministères français",
            international_standards: "Conforme normes ISO environnementales",
            academic_sources: "Basé sur publications scientifiques révisées"
        },

        contact: {
            transparency_requests: "contact@cadok.fr",
            methodology_questions: "science@cadok.fr", 
            legal_inquiries: "legal@cadok.fr",
            audit_requests: "Méthodologie auditable sur demande"
        },

        version_history: [
            {
                version: "2.0",
                date: "2025-08-28",
                changes: "Ajout transparence complète et conformité légale"
            },
            {
                version: "1.0", 
                date: "2025-08-15",
                changes: "Lancement méthodologie ADEME + estimations prix"
            }
        ]
    });
});

/**
 * 📊 GET /api/transparency/sources - Sources détaillées
 */
router.get('/sources', (req, res) => {
    res.json({
        ecological_sources: {
            primary: {
                name: "ADEME Base Carbone",
                status: "Source officielle française",
                reliability: "Très élevée (95%+)",
                last_update: "2024-12-01",
                url: "https://bilans-ges.ademe.fr/",
                methodology: "ACV complète validée scientifiquement"
            },
            standards: [
                "ISO 14040 - Principes ACV",
                "ISO 14044 - Exigences ACV", 
                "GHG Protocol - Standards carbone",
                "PEF - Product Environmental Footprint (EU)"
            ]
        },

        price_sources: {
            official: [
                {
                    name: "INSEE",
                    type: "Institut national statistiques",
                    data: "Indices prix à la consommation",
                    frequency: "Mensuelle",
                    reliability: "Très élevée"
                },
                {
                    name: "Open Data France",
                    type: "Données publiques gouvernementales",
                    data: "Économie circulaire, prix sectoriels",
                    frequency: "Variable",
                    reliability: "Élevée"
                }
            ],
            
            market_intelligence: [
                {
                    name: "Algorithmes propriétaires",
                    type: "Calculs basés études marché",
                    methodology: "Moyennes sectorielles + dépréciation",
                    reliability: "Bonne",
                    validation: "Comparaison multi-sources"
                },
                {
                    name: "Consultation respectueuse sites publics",
                    type: "Données accessibles publiquement",
                    legal_framework: "Conforme CGU et bonnes pratiques",
                    reliability: "Variable selon disponibilité",
                    update_frequency: "Hebdomadaire"
                }
            ]
        },

        data_quality: {
            ecological: "Gold standard (ADEME gouvernemental)",
            prices: "Estimation fiable pour sensibilisation",
            overall: "Optimisé pour objectif écologique",
            transparency: "Méthodologie complètement ouverte"
        }
    });
});

/**
 * ⚖️ GET /api/transparency/legal - Statut légal détaillé
 */
router.get('/legal', (req, res) => {
    res.json({
        scraping_legality: {
            france: {
                status: "Légal sous conditions",
                conditions: [
                    "Données publiquement accessibles",
                    "Respect robots.txt et CGU",
                    "Charge serveur raisonnable",
                    "Usage non commercial ou recherche",
                    "Pas de contournement protections"
                ],
                references: [
                    "Code de la propriété intellectuelle",
                    "Loi informatique et libertés", 
                    "RGPD Article 6 (intérêt légitime)"
                ]
            },
            
            europe: {
                status: "Encadré par réglementation",
                frameworks: [
                    "RGPD - Protection données personnelles",
                    "Directive 96/9/CE - Bases de données",
                    "DSA - Transparence algorithmes",
                    "Jurisprudence hiQ vs LinkedIn (favorable)"
                ]
            }
        },

        our_compliance: {
            data_protection: "Aucune donnée personnelle collectée",
            purpose: "Sensibilisation écologique d'intérêt public",
            methodology: "Respectueuse et transparente",
            technical: "Rate limiting et charges minimales",
            legal_review: "Validée par conseil juridique spécialisé"
        },

        risk_mitigation: [
            "Objectif écologique et social clairement établi",
            "Transparence méthodologique complète",
            "Sources multiples (pas uniquement scraping)",
            "Données agrégées, pas de revente",
            "Disclaimer et limitations claires",
            "Possibilité migration vers APIs officielles"
        ],

        disclaimer: `
        Les estimations fournies par CADOK sont à des fins de sensibilisation 
        écologique uniquement. Elles sont basées sur des données publiques 
        et des calculs statistiques comportant des marges d'erreur. 
        Les valeurs sont indicatives et non contractuelles.
        `
    });
});

module.exports = router;
