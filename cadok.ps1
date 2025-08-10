# Script de gestion rapide des bases de données CADOK

param(
    [Parameter(Position=0)]
    [ValidateSet("status", "admin", "help")]
    [string]$Action = "help"
)

# Couleurs pour les messages
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Show-Help {
    Write-ColorOutput Yellow ""
    Write-ColorOutput Yellow "GESTIONNAIRE CADOK - AIDE"
    Write-ColorOutput Yellow "============================="
    Write-ColorOutput Cyan ""
    Write-ColorOutput Cyan "COMMANDES DISPONIBLES:"
    Write-ColorOutput White ""
    Write-ColorOutput Green "VERIFICATION DES BASES:"
    Write-ColorOutput White "   .\cadok.ps1 status          - Verifier le statut de toutes les bases"
    Write-ColorOutput White "   npm run db:status           - Meme chose via npm"
    Write-ColorOutput White ""
    Write-ColorOutput Green "GESTION DES ADMINS:"
    Write-ColorOutput White "   .\cadok.ps1 admin            - Creer un compte admin (interactif)"
    Write-ColorOutput White "   npm run admin:create         - Meme chose via npm"
    Write-ColorOutput White ""
    Write-ColorOutput Green "LANCEMENT DU SERVEUR:"
    Write-ColorOutput White "   .\start-cadok.ps1 prod       - Serveur sur base PRODUCTION"
    Write-ColorOutput White "   .\start-cadok.ps1 test       - Serveur sur base TEST"
    Write-ColorOutput White "   .\start-cadok.ps1 dev        - Serveur sur base DEVELOPPEMENT"
    Write-ColorOutput White ""
    Write-ColorOutput White "   .\start-cadok.ps1 test dev   - Serveur TEST en mode developpement (nodemon)"
    Write-ColorOutput White ""
    Write-ColorOutput Green "COMMANDES NPM ALTERNATIVES:"
    Write-ColorOutput White "   npm run server:prod          - Serveur PRODUCTION"
    Write-ColorOutput White "   npm run server:test          - Serveur TEST"
    Write-ColorOutput White "   npm run server:dev           - Serveur DEVELOPPEMENT"
    Write-ColorOutput White "   npm run dev:test             - Serveur TEST avec nodemon"
    Write-ColorOutput Yellow ""
}

switch ($Action) {
    "status" {
        Write-ColorOutput Cyan "Verification du statut des bases de donnees..."
        # S'assurer qu'on est dans le bon répertoire
        $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        Set-Location $ScriptPath
        node scripts/check-db-status.js
    }
    "admin" {
        Write-ColorOutput Cyan "Creation d'un compte administrateur..."
        # S'assurer qu'on est dans le bon répertoire
        $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        Set-Location $ScriptPath
        node scripts/create-admin-interactive.js
    }
    "help" {
        Show-Help
    }
    default {
        Write-ColorOutput Red "Action inconnue: $Action"
        Show-Help
    }
}

Write-ColorOutput Yellow ""
