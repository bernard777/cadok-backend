# Script PowerShell pour nettoyer toutes les références à estimatedValue dans les tests

Write-Host "🧹 Nettoyage des références estimatedValue dans les tests..." -ForegroundColor Yellow

# Fonction pour nettoyer un fichier
function Clean-EstimatedValueFromFile {
    param($filePath)
    
    if (Test-Path $filePath) {
        Write-Host "  📁 Nettoyage de: $filePath" -ForegroundColor Cyan
        
        $content = Get-Content $filePath -Raw
        
        # Supprimer les lignes estimatedValue (différents patterns)
        $content = $content -replace '(?m)^\s*estimatedValue:\s*[^,\n]+,?\s*\n', ''
        $content = $content -replace '(?m)^\s*estimatedValue:\s*\{[^}]*\},?\s*\n', ''
        $content = $content -replace ',\s*estimatedValue:\s*[^,\n}]+', ''
        $content = $content -replace 'estimatedValue:\s*[^,\n}]+,?\s*', ''
        
        # Supprimer les expects sur estimatedValue
        $content = $content -replace '(?m)^\s*expect\([^)]*\.estimatedValue\)[^;\n]*;\s*\n', ''
        
        # Supprimer les commentaires sur valeur négative
        $content = $content -replace '\s*// Valeur négative', ''
        
        # Nettoyer les virgules orphelines
        $content = $content -replace '(?m),(\s*\n\s*})', '$1'
        $content = $content -replace '(?m){\s*,', '{'
        
        Set-Content $filePath $content -Encoding UTF8
    }
}

# Fichiers à nettoyer
$testFiles = @(
    "tests\e2e\security-workflow-complete-http-pure.test.js",
    "tests\e2e\mobile-interfaces-http-pure.test.js", 
    "tests\auth-objects-complete-suite.js",
    "tests\auth-objects-complete-suite.test.js",
    "test\advanced-features.test.js"
)

foreach ($file in $testFiles) {
    $fullPath = Join-Path $PWD $file
    Clean-EstimatedValueFromFile $fullPath
}

Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
