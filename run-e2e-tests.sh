#!/bin/bash
# 🚀 SCRIPT EXECUTION TESTS E2E CADOK

echo "🧪 TESTS E2E CADOK - VALIDATION COMPLETE"
echo "========================================"

# Vérification prérequis
echo "🔍 Vérification environnement..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js non installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm non installé"
    exit 1
fi

# Vérification MongoDB
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️ MongoDB ne semble pas démarré"
    echo "Démarrage automatique..."
    # Tentative démarrage MongoDB (Windows)
    net start MongoDB 2>/dev/null || echo "Veuillez démarrer MongoDB manuellement"
fi

# Installation dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation dépendances..."
    npm install
fi

# Démarrage du serveur backend en arrière-plan
echo "🚀 Démarrage serveur backend..."
PORT=5001 npm start &
SERVER_PID=$!

# Attendre que le serveur soit prêt
echo "⏳ Attente démarrage serveur..."
sleep 5

# Test connectivité serveur
if curl -f http://localhost:5001/api/auth/test-connection &> /dev/null; then
    echo "✅ Serveur backend opérationnel"
else
    echo "❌ Serveur backend non accessible"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🧪 EXECUTION TESTS E2E..."
echo "========================="

# Tests unitaires rapides d'abord
echo "1️⃣ Tests unitaires de base..."
npm test -- --testPathIgnorePatterns=e2e --passWithNoTests

# Tests E2E complets
echo ""
echo "2️⃣ Tests E2E - Parcours utilisateur..."
node tests/e2e/e2e-runner.js

TEST_EXIT_CODE=$?

# Nettoyage
echo ""
echo "🧹 Nettoyage..."
kill $SERVER_PID 2>/dev/null

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 TOUS LES TESTS E2E ONT RÉUSSI !"
    echo "✅ Votre application CADOK est prête pour la bêta"
    echo ""
    echo "📋 Prochaines étapes recommandées :"
    echo "   1. Déploiement Docker (déjà configuré)"
    echo "   2. Configuration SSL/HTTPS"
    echo "   3. Monitoring production"
    echo "   4. Tests utilisateurs bêta"
    echo ""
    echo "🚀 Commande déploiement : ./deploy.sh"
else
    echo ""
    echo "❌ CERTAINS TESTS E2E ONT ÉCHOUÉ"
    echo "🔍 Consultez le rapport détaillé : tests/reports/e2e-report.html"
    echo "⚠️ Corrigez les erreurs avant le déploiement bêta"
fi

exit $TEST_EXIT_CODE
