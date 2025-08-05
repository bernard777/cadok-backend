@echo off
REM 🚀 SCRIPT EXECUTION TESTS E2E CADOK (Windows)

echo 🧪 TESTS E2E CADOK - VALIDATION COMPLETE
echo ========================================

REM Vérification prérequis
echo 🔍 Vérification environnement...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js non installé
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm non installé
    exit /b 1
)

REM Vérification MongoDB
tasklist /FI "IMAGENAME eq mongod.exe" 2>nul | find /I /N "mongod.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ MongoDB ne semble pas démarré
    echo Tentative démarrage...
    net start MongoDB >nul 2>nul
)

REM Installation dépendances si nécessaire
if not exist "node_modules" (
    echo 📦 Installation dépendances...
    npm install
)

REM Démarrage du serveur backend en arrière-plan
echo 🚀 Démarrage serveur backend...
start /b cmd /c "set PORT=5001 && npm start"

REM Attendre que le serveur soit prêt
echo ⏳ Attente démarrage serveur...
timeout /t 8 /nobreak >nul

REM Test connectivité serveur
curl -f http://localhost:5001/api/auth/test-connection >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Serveur backend opérationnel
) else (
    echo ❌ Serveur backend non accessible
    taskkill /F /IM node.exe >nul 2>nul
    exit /b 1
)

echo.
echo 🧪 EXECUTION TESTS E2E...
echo =========================

REM Tests unitaires rapides d'abord
echo 1️⃣ Tests unitaires de base...
npm test -- --testPathIgnorePatterns=e2e --passWithNoTests

REM Tests E2E complets
echo.
echo 2️⃣ Tests E2E - Parcours utilisateur...
node tests/e2e/e2e-runner.js

set TEST_EXIT_CODE=%ERRORLEVEL%

REM Nettoyage
echo.
echo 🧹 Nettoyage...
taskkill /F /IM node.exe >nul 2>nul

if %TEST_EXIT_CODE% EQU 0 (
    echo.
    echo 🎉 TOUS LES TESTS E2E ONT RÉUSSI !
    echo ✅ Votre application CADOK est prête pour la bêta
    echo.
    echo 📋 Prochaines étapes recommandées :
    echo    1. Déploiement Docker (déjà configuré^)
    echo    2. Configuration SSL/HTTPS
    echo    3. Monitoring production
    echo    4. Tests utilisateurs bêta
    echo.
    echo 🚀 Commande déploiement : deploy.sh
) else (
    echo.
    echo ❌ CERTAINS TESTS E2E ONT ÉCHOUÉ
    echo 🔍 Consultez le rapport détaillé : tests\reports\e2e-report.html
    echo ⚠️ Corrigez les erreurs avant le déploiement bêta
)

exit /b %TEST_EXIT_CODE%
