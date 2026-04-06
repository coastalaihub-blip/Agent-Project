"""
Backend Startup Verification Script
Checks all critical configurations before starting the server.
Run this BEFORE uvicorn main:app
"""
import os
import sys
from pathlib import Path

def check_env_var(name: str, required=True) -> bool:
    """Check if env var is set and non-empty."""
    value = os.getenv(name, "").strip()
    status = "✓" if value else "✗"
    req_text = "[REQUIRED]" if required else "[OPTIONAL]"
    print(f"{status} {name:40} {req_text}")
    return bool(value) if required else True

def check_file(path: str) -> bool:
    """Check if file exists."""
    exists = Path(path).exists()
    status = "✓" if exists else "✗"
    print(f"{status} {path}")
    return exists

def main():
    print("\n" + "="*70)
    print("🔍 BACKEND STARTUP VERIFICATION")
    print("="*70 + "\n")
    
    all_ok = True
    
    # Check environment variables
    print("📋 Environment Variables:\n")
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_KEY",
        "DEEPGRAM_API_KEY",
        "ELEVENLABS_API_KEY",
    ]
    
    for var in required_vars:
        if not check_env_var(var, required=True):
            all_ok = False
    
    # Check optional but important vars
    print("\nOptional (for specific features):")
    optional_vars = [
        ("EXOTEL_SID", "Exotel integration"),
        ("EXOTEL_TOKEN", "Exotel integration"),
        ("EXOTEL_VIRTUAL_NUMBER", "Exotel integration"),
        ("OZONETEL_API_KEY", "Ozonetel integration"),
    ]
    
    has_exotel = check_env_var("EXOTEL_SID", required=False) and check_env_var("EXOTEL_TOKEN", required=False)
    has_ozonetel = check_env_var("OZONETEL_API_KEY", required=False)
    
    if not (has_exotel or has_ozonetel):
        print("\n⚠️  WARNING: Neither Exotel nor Ozonetel credentials found.")
        print("   You need at least one voice provider to handle calls.")
    
    # Check files
    print("\n✅ Required Files:\n")
    files_to_check = [
        "db/supabase.py",
        "routers/webhooks.py",
        "routers/businesses.py",
        "routers/calls.py",
        "models/schemas.py",
    ]
    
    for file in files_to_check:
        if not check_file(file):
            all_ok = False
    
    # Service URLs
    print("\n🔗 Service Dependencies:\n")
    agent_url = os.getenv("AGENT_SERVICE_URL", "").strip()
    tts_url = os.getenv("TTS_SERVICE_URL", "").strip()
    print(f"ℹ️  Agent Service: {agent_url or 'Not configured'}")
    print(f"ℹ️  TTS Service:   {tts_url or 'Not configured'}")
    print("\n⚠️  Make sure these services are running before making actual calls:")
    print("   - Agent service on :8001")
    print("   - TTS service on :8002")
    
    # Summary
    print("\n" + "="*70)
    if all_ok:
        print("✅ All critical checks passed! You can start the server.")
        print("\n   Start with:")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
    else:
        print("❌ Some critical checks failed. Please fix the issues above.")
        print("\n   See .env.example for configuration details.")
        sys.exit(1)
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
