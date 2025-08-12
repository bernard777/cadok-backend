# Nettoyage des references estimatedValue dans les tests

Write-Host "Nettoyage des tests..." -ForegroundColor Yellow

# Liste des fichiers a nettoyer
$files = @(
    "tests/e2e/security-workflow-complete-http-pure.test.js",
    "tests/e2e/mobile-interfaces-http-pure.test.js", 
    "tests/auth-objects-complete-suite.js",
    "tests/auth-objects-complete-suite.test.js",
    "test/advanced-features.test.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Nettoyage de: $file"
        
        $content = Get-Content $file -Raw
        
        # Supprimer les lignes estimatedValue
        $content = $content -replace '(?m)^\s*estimatedValue:\s*[^,\n]+,?\s*\r?\n', ''
        $content = $content -replace ',\s*estimatedValue:\s*[^,\n}]+', ''
        
        # Supprimer les expects
        $content = $content -replace '(?m)^\s*expect\([^)]*\.estimatedValue\)[^;\n]*;\s*\r?\n', ''
        
        # Nettoyer virgules orphelines  
        $content = $content -replace '(?m),(\s*\r?\n\s*})', '$1'
        
        Set-Content $file $content -Encoding UTF8
    }
}

Write-Host "Termine!" -ForegroundColor Green
