#!/usr/bin/env pwsh
# ================================================================
# Mobile App Startup Script (Windows PowerShell)
# Starts the React Native Expo development server
# ================================================================

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   AI Agent Platform - Mobile Startup (Windows)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobileDir = Join-Path $projectRoot "mobile"

if (-not (Test-Path $mobileDir)) {
    Write-Host "ERROR Mobile directory not found at: $mobileDir" -ForegroundColor Red
    exit 1
}

Write-Host "Mobile directory: $mobileDir" -ForegroundColor Gray

# Check if node_modules exists
if (-not (Test-Path "$mobileDir\node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Set-Location $mobileDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK Dependencies installed" -ForegroundColor Green
}

# Start Expo
Write-Host ""
Write-Host "Starting Expo development server..." -ForegroundColor Cyan
Write-Host "   Open your phone and scan the QR code below" -ForegroundColor Gray
Write-Host "   Press 'i' for iOS simulator, 'a' for Android emulator, 'w' for web" -ForegroundColor Gray
Write-Host ""

Set-Location $mobileDir
npx expo start
