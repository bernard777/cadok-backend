# Script de lancement rapide du serveur CADOK
# Usage: .\start-cadok.ps1 [prod|test|dev] [server|nodemon]

param(
    [Parameter(Position=0)]
    [ValidateSet("prod", "test", "dev")]
    [string]$Database = "test",
    
    [Parameter(Position=1)]
    [ValidateSet("server", "nodemon", "dev")]
    [string]$Mode = "server"
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

# Configuration des bases de données
$DatabaseConfig = @{
    "prod" = @{
        Name = "PRODUCTION (cadok)"
        Icon = "🚀"
        URI = "mongodb://localhost:27017/cadok"
        Env = "production"
    }
    "test" = @{
        Name = "TEST (cadok_test)"
        Icon = "🧪"
        URI = "mongodb://localhost:27017/cadok_test"
        Env = "test"
    }
    "dev" = @{
        Name = "DÉVELOPPEMENT (cadok_dev)"
        Icon = "🛠️"
        URI = "mongodb://localhost:27017/cadok_dev"
        Env = "development"
    }
}

$SelectedDb = $DatabaseConfig[$Database]

Write-ColorOutput Yellow ""
Write-ColorOutput Yellow "LANCEMENT DU SERVEUR CADOK"
Write-ColorOutput Yellow "================================"
Write-ColorOutput Cyan "Base de donnees: $($SelectedDb.Name)"
Write-ColorOutput Cyan "URI: $($SelectedDb.URI)"
Write-ColorOutput Cyan "Mode: $Mode"
Write-ColorOutput Yellow ""

# Définir les variables d'environnement
$env:NODE_ENV = $SelectedDb.Env
$env:MONGODB_URI = $SelectedDb.URI

# S'assurer qu'on est dans le bon répertoire
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptPath

# Construire et exécuter la commande
switch ($Mode) {
    "server" {
        Write-ColorOutput Green "Demarrage du serveur en mode production..."
        node server.js
    }
    "nodemon" {
        Write-ColorOutput Green "Demarrage du serveur avec nodemon..."
        nodemon server.js
    }
    "dev" {
        Write-ColorOutput Green "Demarrage du serveur en mode developpement..."
        nodemon server.js
    }
}

Write-ColorOutput Yellow ""
Write-ColorOutput Yellow "Serveur arrete."
