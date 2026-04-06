#!/usr/bin/env pwsh
# ================================================================
# Backend Startup Script (Windows PowerShell)
# ================================================================

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "     AI Agent Platform - Backend Startup (Windows)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $backendDir "backend"
$projectRoot = Split-Path -Parent $backendDir

# Check if .env exists
if (-not (Test-Path "$backendDir\.env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "   Copy .env.example to .env and fill in credentials:" -ForegroundColor Yellow
    Write-Host "   copy .env.example .env" -ForegroundColor Gray
    exit 1
}

Write-Host "OK .env file found" -ForegroundColor Green

# Check if venv exists, create if needed
$venvPath = "$projectRoot\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host ""
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK Virtual environment created" -ForegroundColor Green
}

# Activate venv
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& "$venvPath\Scripts\Activate.ps1"

# Install/upgrade dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pip install --upgrade pip setuptools wheel | Out-Null
pip install -r "$backendDir\requirements.txt" 2>&1 | Where-Object { $_ -match "(Successfully|ERROR|already)" } | Write-Host

if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "OK Dependencies installed" -ForegroundColor Green

# Start the server
Write-Host ""
Write-Host "Starting FastAPI server on http://0.0.0.0:8000" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

Set-Location $backendDir
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
