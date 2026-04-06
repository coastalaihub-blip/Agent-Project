# ================================================================
# BACKEND QUICK START SCRIPT (Windows PowerShell)
# Automates Day 1 setup: dependencies, env, verification, startup
# ================================================================

Write-Host "🚀 AI Agent Platform — Backend Quick Start" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed`n" -ForegroundColor Green

# Step 2: Run startup verification
Write-Host "🔍 Step 2: Verifying configuration..." -ForegroundColor Yellow
python verify_startup.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Configuration verification failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Start the server
Write-Host "🌐 Step 3: Starting FastAPI server..." -ForegroundColor Yellow
Write-Host "   Server will be available at: http://localhost:8000" -ForegroundColor Gray
Write-Host "   Health check endpoint: http://localhost:8000/health" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Gray
Write-Host "================================================`n" -ForegroundColor Cyan

uvicorn main:app --host 0.0.0.0 --port 8000 --reload

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Server failed to start" -ForegroundColor Red
    exit 1
}
