#!/bin/bash
# 🔧 SCRIPT DE CORRECTION AUTOMATIQUE DES TESTS

echo "🔧 Correction automatique des tests CADOK"
echo "========================================="

# 1. Nettoyage des caches
echo "🧹 Nettoyage des caches..."
rm -rf node_modules/.cache
rm -rf coverage

# 2. Réinstallation des dépendances
echo "📦 Réinstallation des dépendances..."
npm ci

# 3. Tests avec diagnostic
echo "🧪 Exécution tests avec diagnostic..."
npm test -- --verbose --detectOpenHandles

echo "✅ Correction terminée !"
