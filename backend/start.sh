#!/bin/bash
# ================================================================
# BACKEND QUICK START SCRIPT
# Automates Day 1 setup: dependencies, env, verification, startup
# ================================================================

set -e

echo "🚀 AI Agent Platform — Backend Quick Start"
echo "================================================\n"

# Step 1: Install dependencies
echo "📦 Step 1: Installing Python dependencies..."
if command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    python -m pip install -r requirements.txt
fi
echo "✅ Dependencies installed\n"

# Step 2: Run startup verification
echo "🔍 Step 2: Verifying configuration..."
if command -v python3 &> /dev/null; then
    python3 verify_startup.py
else
    python verify_startup.py
fi
echo ""

# Step 3: Start the server
echo "🌐 Step 3: Starting FastAPI server..."
echo "   Server will be available at: http://localhost:8000"
echo "   Health check endpoint: http://localhost:8000/health\n"
echo "   Press Ctrl+C to stop\n"
echo "================================================\n"

if command -v uvicorn &> /dev/null; then
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
fi
