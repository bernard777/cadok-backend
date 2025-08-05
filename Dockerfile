# 🐳 Dockerfile CADOK Backend
# Compatible avec tous les hébergeurs Docker

# ===== STAGE 1: Dependencies =====
FROM node:18-alpine AS dependencies
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --only=production && npm cache clean --force

# ===== STAGE 2: Build & Test =====
FROM node:18-alpine AS builder
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation de TOUTES les dépendances (dev incluses pour les tests)
RUN npm ci

# Copie du code source
COPY . .

# Exécution des tests avec vos seuils élevés (95% pour securityService)
RUN npm test

# ===== STAGE 3: Production =====
FROM node:18-alpine AS production

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S cadok && \
    adduser -S cadok -u 1001

# Installation des outils système nécessaires
RUN apk add --no-cache \
    curl \
    tzdata

# Configuration du timezone (adaptez selon votre localisation)
ENV TZ=Europe/Paris

WORKDIR /app

# Copie des dépendances de production depuis le stage dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copie du code source (testé et validé)
COPY --chown=cadok:cadok . .

# Création du dossier uploads avec les bonnes permissions
RUN mkdir -p uploads && chown -R cadok:cadok uploads

# Changement vers l'utilisateur non-root
USER cadok

# Exposition du port (configurable via env)
EXPOSE ${PORT:-5000}

# Health check pour vérifier que l'API répond
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/auth/test-connection || exit 1

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Commande de démarrage
CMD ["npm", "start"]

# ===== MÉTADONNÉES =====
LABEL maintainer="CADOK Team"
LABEL version="1.0.0"
LABEL description="CADOK Backend API - Plateforme de troc sécurisée"
