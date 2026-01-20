# Error Detection and Fix Script
# This script checks for TypeScript, ESLint, and build errors in the project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Error Detection & Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to display section headers
function Show-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ">>> $Title" -ForegroundColor Yellow
    Write-Host "---" -ForegroundColor DarkGray
}

# Function to check command exit code
function Check-Result {
    param([string]$TaskName)
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $TaskName passed" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ $TaskName failed" -ForegroundColor Red
        return $false
    }
}

# Store results
$results = @{
    TypeCheck = $false
    Lint = $false
    Build = $false
}

# 1. TypeScript Type Checking
Show-Section "TypeScript Type Check"
npx tsc --noEmit --pretty
$results.TypeCheck = Check-Result "TypeScript"

# 2. ESLint Check
Show-Section "ESLint Check"
npx eslint . --ext .ts,.tsx --max-warnings 0
$results.Lint = Check-Result "ESLint"

# 3. Next.js Build Check (optional - can be slow)
$runBuild = Read-Host "Run full Next.js build? (y/n)"
if ($runBuild -eq 'y') {
    Show-Section "Next.js Build"
    npm run build
    $results.Build = Check-Result "Build"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allPassed = $true
foreach ($key in $results.Keys) {
    if ($results[$key]) {
        Write-Host "✓ $key" -ForegroundColor Green
    } else {
        Write-Host "✗ $key" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
if ($allPassed) {
    Write-Host "All checks passed! 🎉" -ForegroundColor Green
} else {
    Write-Host "Some checks failed. Review errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick Fix Commands:" -ForegroundColor Yellow
    Write-Host "  - Auto-fix ESLint: npx eslint . --ext .ts,.tsx --fix" -ForegroundColor Cyan
    Write-Host "  - Check specific file: npx eslint path/to/file.tsx" -ForegroundColor Cyan
}

Write-Host ""
