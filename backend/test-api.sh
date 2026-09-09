#!/bin/bash

echo "Testing TaskFlow Auth API..."
echo "============================"

# Test Registration
echo -e "\n📝 Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "name": "Test User",
    "jobTitle": "Developer"
  }')

echo $REGISTER_RESPONSE | json_pp

# Extract tokens
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo -e "\n❌ Registration failed. Trying login..."
  
  # Test Login
  echo -e "\n🔐 Testing Login..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "Test@123456"
    }')
  
  echo $LOGIN_RESPONSE | json_pp
  
  ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo -e "\n✅ Token obtained: ${ACCESS_TOKEN:0:50}..."
  
  # Test Get Profile
  echo -e "\n👤 Testing Get Profile..."
  curl -s -X GET http://localhost:5000/api/auth/profile \
    -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp
  
  # Test Update Profile
  echo -e "\n✏️ Testing Update Profile..."
  curl -s -X PATCH http://localhost:5000/api/auth/profile \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Test User",
      "bio": "This is my bio"
    }' | json_pp
  
  # Test Refresh Token
  echo -e "\n🔄 Testing Refresh Token..."
  curl -s -X POST http://localhost:5000/api/auth/refresh-token \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | json_pp
  
  # Test Logout
  echo -e "\n🚪 Testing Logout..."
  curl -s -X POST http://localhost:5000/api/auth/logout \
    -H "Authorization: Bearer $ACCESS_TOKEN" | json_pp
else
  echo -e "\n❌ Failed to get access token"
fi

echo -e "\n✅ API tests completed!"