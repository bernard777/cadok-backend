const mongoose = require('mongoose');

const TRADE_STATUS = {
  PENDING: 'pending', // Demande envoyée, en attente de sélection d'objet par toUser
  PROPOSED: 'proposed', // Objet proposé par toUser, en attente de validation par fromUser
  ACCEPTED: 'accepted',
  REFUSED: 'refused',
  DISPUTED: 'disputed', // En litige
  SECURED: 'secured', // Avec dépôt de garantie
  // Nouveaux statuts pour le système de sécurité pur
  SECURITY_PENDING: 'security_pending', // En attente des preuves de sécurité
  PHOTOS_REQUIRED: 'photos_required', // Photos requises avant expédition
  SHIPPING_PREPARED: 'shipping_prepared', // Bordereau généré, prêt à expédier
  SHIPPING_CONFIRMED: 'shipping_confirmed', // Expédition confirmée
  SHIPPED: 'shipped', // Colis en transit
  ARRIVED_AT_PICKUP: 'arrived_at_pickup', // Colis arrivé au point relais
  DELIVERY_CONFIRMED: 'delivery_confirmed', // Livraison confirmée
  COMPLETED: 'completed', // Échange terminé avec succès
  CANCELLED: 'cancelled' // Annulé (avec remboursement si applicable)
};

const tradeSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who proposes the trade
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // User who receives the trade offer
  offeredObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Object' }],
  requestedObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Object', required: true }],
  status: {
    type: String,
    enum: Object.values(TRADE_STATUS),
    default: TRADE_STATUS.PENDING
  },

  // Dépôt de garantie (Escrow)
  escrow: {
    paymentIntentId: String, // ID Stripe du Payment Intent
    amount: Number, // Montant du dépôt en euros
    status: {
      type: String,
      enum: ['none', 'held', 'released', 'cancelled'],
      default: 'none'
    },
    createdAt: Date,
    expiresAt: Date,
    releasedAt: Date,
    cancelledAt: Date,
    releaseReason: String,
    cancelReason: String,
    releaseConditions: {
      deliveryConfirmed: { type: Boolean, default: false },
      recipientApproval: { type: Boolean, default: false },
      disputePeriodExpired: { type: Boolean, default: false }
    },
    dispute: {
      status: {
        type: String,
        enum: ['none', 'open', 'in_review', 'resolved'],
        default: 'none'
      },
      details: String,
      createdAt: Date,
      resolution: {
        decision: String, // 'release', 'refund', 'partial'
        amount: Number,
        reason: String,
        resolvedAt: Date,
        resolvedBy: String
      }
    }
  },

  // Score de confiance et sécurité
  security: {
    trustScores: {
      sender: Number,
      recipient: Number
    },
    riskLevel: {
      type: String,
      enum: ['LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'VERY_HIGH_RISK'],
      default: 'MEDIUM_RISK'
    },
    requiresEscrow: { type: Boolean, default: false },
    requiresIdentityVerification: { type: Boolean, default: false },
    secureDeliveryRequired: { type: Boolean, default: false },
    
    // Système de sécurité pour troc pur (sans argent)
    pureTradeValidation: {
      // Étapes de validation
      steps: {
        photosSubmitted: {
          fromUser: { type: Boolean, default: false },
          toUser: { type: Boolean, default: false }
        },
        shippingConfirmed: {
          fromUser: { type: Boolean, default: false },
          toUser: { type: Boolean, default: false }
        },
        deliveryConfirmed: {
          fromUser: { type: Boolean, default: false },
          toUser: { type: Boolean, default: false }
        }
      },
      
      // Preuves photographiques
      proofs: {
        fromUser: {
          beforeShipping: [String], // URLs des photos avant expédition
          packaging: [String], // Photos de l'emballage
          trackingNumber: String,
          submittedAt: Date
        },
        toUser: {
          beforeShipping: [String],
          packaging: [String],
          trackingNumber: String,
          submittedAt: Date
        }
      },
      
      // Contraintes de sécurité
      constraints: {
        photosRequired: { type: Boolean, default: false },
        trackingRequired: { type: Boolean, default: false },
        maxDeliveryDays: { type: Number, default: 7 },
        requiresInsurance: { type: Boolean, default: false }
      },
      
      // Timeline de validation
      timeline: [{
        step: String, // 'photos_submitted', 'shipping_confirmed', etc.
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        data: mongoose.Schema.Types.Mixed // Données associées (photos, tracking, etc.)
      }],
      
      // Système de reporting
      reports: [{
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: {
          type: String,
          enum: ['not_shipped', 'wrong_item', 'damaged', 'fake', 'communication_issue']
        },
        description: String,
        evidence: [String], // URLs des preuves
        status: {
          type: String,
          enum: ['pending', 'investigating', 'resolved', 'dismissed'],
          default: 'pending'
        },
        createdAt: { type: Date, default: Date.now },
        resolvedAt: Date,
        resolution: String
      }]
    }
  },

  // Évaluations finales
  ratings: {
    fromUserRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    },
    toUserRating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    }
  },

  // Dates importantes
  createdAt: Date,
  acceptedAt: Date, // Date d'acceptation de l'échange
  refusedAt: Date, // Date de refus de l'échange
  completedAt: Date, // Date de finalisation

  // Gestion admin
  adminNotes: String, // Notes administratives
  disputeReason: String, // Raison du litige si status = 'disputed'
  disputeResolution: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolution: String,
    action: String, // 'approve', 'cancel'
    reason: String
  },

  // Système de livraison (point relais, etc.)
  delivery: {
    method: {
      type: String,
      enum: ['pickup_point', 'direct_delivery', 'manual'],
      default: 'manual'
    },
    
    // Données spécifiques au point relais
    pickupPoint: {
      id: String,
      partner: String, // 'mondial_relay', 'pickup', etc.
      name: String,
      address: {
        street: String,
        city: String,
        zipCode: String,
        country: String
      },
      openingHours: String,
      phone: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    
    // Code de retrait unique
    withdrawalCode: String,
    
    // Statut de la livraison
    status: {
      type: String,
      enum: ['none', 'label_generated', 'in_transit', 'arrived_at_pickup', 'delivered'],
      default: 'none'
    },
    
    // Dates importantes
    createdAt: Date,
    shippedAt: Date,
    arrivedAt: Date,
    deliveredAt: Date,
    
    // Numéro de suivi transporteur
    trackingNumber: String,
    
    // Instructions spéciales
    specialInstructions: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
