"""
Day 1 Backend Testing Script
Run this to verify your backend setup is working correctly.

Usage:
    python test_backend.py

Prerequisites:
    - Backend server running on http://localhost:8000
    - Supabase configured in .env
"""

import httpx
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_health():
    """Test 1: Health Check"""
    print("🏥 Testing Health Endpoint...")
    response = httpx.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("   ✅ Health check passed!\n")

def test_create_business():
    """Test 2: Create a Business"""
    print("🏢 Testing Business Signup...")
    payload = {
        "owner_id": "test-owner-123",
        "name": "Dr. Sharma Dental Clinic",
        "vertical": "clinic",
        "onboarding_config": {
            "business_hours": "9am-6pm",
            "doctors": ["Dr. Sharma", "Dr. Patel"],
            "services": ["General Checkup", "Dental", "X-Ray"],
            "emergency_contact": "+919876543210"
        }
    }
    
    response = httpx.post(f"{BASE_URL}/api/businesses/signup", json=payload)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Business created!")
        print(f"   Business ID: {data['id']}")
        print(f"   Assigned Phone: {data['phone_number']}")
        print(f"   Vertical: {data['vertical']}")
        return data
    else:
        print(f"   ❌ Failed: {response.text}")
        return None

def test_get_business(business_id):
    """Test 3: Get Business Details"""
    print(f"📋 Testing Get Business (ID: {business_id[:8]}...)...")
    response = httpx.get(f"{BASE_URL}/api/businesses/{business_id}")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Business retrieved!")
        print(f"   Name: {data['name']}")
        print(f"   Phone: {data['phone_number']}\n")
        return data
    else:
        print(f"   ❌ Failed: {response.text}\n")
        return None

def test_list_calls(business_id):
    """Test 4: List Calls (Should be empty initially)"""
    print(f"📞 Testing List Calls...")
    response = httpx.get(f"{BASE_URL}/api/calls/{business_id}")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Calls endpoint working!")
        print(f"   Call count: {len(data)}")
        if data:
            print(f"   Latest call: {data[0]}")
        print()
        return data
    else:
        print(f"   ❌ Failed: {response.text}\n")
        return None

def test_get_stats(business_id):
    """Test 5: Get Call Statistics"""
    print(f"📊 Testing Call Stats...")
    response = httpx.get(f"{BASE_URL}/api/calls/{business_id}/stats")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Stats retrieved!")
        print(f"   Total Calls: {data['total_calls']}")
        print(f"   Escalated: {data['escalated']}")
        print(f"   Appointments: {data['appointments_booked']}\n")
        return data
    else:
        print(f"   ❌ Failed: {response.text}\n")
        return None

def run_all_tests():
    """Run all tests in sequence"""
    print("=" * 60)
    print("🚀 AI Agent Platform — Day 1 Backend Test Suite")
    print("=" * 60)
    print()
    
    try:
        # Test 1: Health
        test_health()
        
        # Test 2: Create Business
        business = test_create_business()
        if not business:
            print("❌ Cannot continue — business creation failed")
            return
        
        business_id = business["id"]
        
        # Test 3: Get Business
        test_get_business(business_id)
        
        # Test 4: List Calls
        test_list_calls(business_id)
        
        # Test 5: Get Stats
        test_get_stats(business_id)
        
        print("=" * 60)
        print("✅ All Day 1 Tests Passed!")
        print("=" * 60)
        print()
        print("🎯 Next Steps:")
        print("   1. Save this business ID for mobile app testing:")
        print(f"      {business_id}")
        print("   2. Test the webhook endpoint with mock data")
        print("   3. Start building the React Native mobile app")
        print()
        
    except httpx.ConnectError:
        print("❌ Could not connect to backend server!")
        print("   Make sure the server is running:")
        print("   cd backend")
        print("   uvicorn main:app --host 0.0.0.0 --port 8000 --reload")
        print()
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
