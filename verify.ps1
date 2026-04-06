# Verification script for backend setup
# Run this before starting the server

param()

$backendDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "backend"
$projectRoot = Split-Path -Parent $backendDir
$allGood = $true

Write-Host ""
Write-Host "=== Checking Backend Prerequisites ===" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Gray
$pythonVersion = python --version 2>&1
if ($?) {
    Write-Host "  OK: Python found - $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Python not found. Install from https://www.python.org" -ForegroundColor Red
    $allGood = $false
}

# Check .env
Write-Host ""
Write-Host "Checking .env file..." -ForegroundColor Gray
$envFile = Join-Path $backendDir ".env"
if (Test-Path $envFile) {
    Write-Host "  OK: .env file exists" -ForegroundColor Green
} else {
    Write-Host "  ERROR: .env file not found" -ForegroundColor Red
    Write-Host "         Copy backend/.env.example to backend/.env" -ForegroundColor Yellow
    $allGood = $false
}

# Check main.py
Write-Host ""
Write-Host "Checking source files..." -ForegroundColor Gray
$mainFile = Join-Path $backendDir "main.py"
if (Test-Path $mainFile) {
    Write-Host "  OK: main.py exists" -ForegroundColor Green
} else {
    Write-Host "  ERROR: main.py not found" -ForegroundColor Red
    $allGood = $false
}

# Check routers
$routers = @("businesses.py", "webhooks.py", "calls.py", "appointments.py")
$routersDir = Join-Path $backendDir "routers"
foreach ($router in $routers) {
    $routerPath = Join-Path $routersDir $router
    if (Test-Path $routerPath) {
        Write-Host "  OK: routers/$router exists" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: routers/$router not found" -ForegroundColor Red
        $allGood = $false
    }
}

# Check requirements.txt
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Gray
$reqFile = Join-Path $backendDir "requirements.txt"
if (Test-Path $reqFile) {
    Write-Host "  OK: requirements.txt exists" -ForegroundColor Green
} else {
    Write-Host "  ERROR: requirements.txt not found" -ForegroundColor Red
    $allGood = $false
}

# Check schema
Write-Host ""
Write-Host "Checking database schema..." -ForegroundColor Gray
$schemaFile = Join-Path $backendDir "supabase_schema.sql"
if (Test-Path $schemaFile) {
    Write-Host "  OK: supabase_schema.sql exists" -ForegroundColor Green
} else {
    Write-Host "  ERROR: supabase_schema.sql not found" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "=== Verification Results ===" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "All checks passed! Ready to start backend." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run: powershell .\start.ps1" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Some checks failed. See errors above." -ForegroundColor Red
    exit 1
}
