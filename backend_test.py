import requests
import sys
import json
from datetime import datetime

class NightOwlParentsAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "seed", 200)

    def test_register(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test.user.{timestamp}@example.com",
            "password": "testpass123"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, user_data)
        if result:
            self.token = result.get('token')
            self.user_id = result.get('user_id')
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Create a user first
        timestamp = int(datetime.now().timestamp())
        register_data = {
            "name": f"Login Test User {timestamp}",
            "email": f"login.test.{timestamp}@example.com", 
            "password": "logintest123"
        }
        
        # Register user
        register_result = self.run_test("Register for Login Test", "POST", "auth/register", 200, register_data)
        if not register_result:
            return False
            
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        result = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if result:
            self.token = result.get('token')
            self.user_id = result.get('user_id')
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200) is not None

    def test_logout(self):
        """Test user logout"""
        return self.run_test("User Logout", "POST", "auth/logout", 200) is not None

    def test_get_categories(self):
        """Test getting forum categories"""
        result = self.run_test("Get Forum Categories", "GET", "forums/categories", 200)
        return result is not None and isinstance(result, list)

    def test_get_feed(self):
        """Test getting feed posts"""
        result = self.run_test("Get Feed", "GET", "feed", 200)
        return result is not None and isinstance(result, list)

    def test_create_post(self):
        """Test creating a forum post"""
        # First get categories to use one
        categories = self.run_test("Get Categories for Post", "GET", "forums/categories", 200)
        if not categories or len(categories) == 0:
            self.log_test("Create Post", False, "No categories available")
            return False
            
        category_id = categories[0]['category_id']
        
        post_data = {
            "category_id": category_id,
            "title": "Test Post Title",
            "content": "This is a test post content for testing purposes.",
            "is_anonymous": False
        }
        
        result = self.run_test("Create Forum Post", "POST", "forums/posts", 200, post_data)
        return result is not None and result.get('post_id')

    def test_get_posts(self):
        """Test getting forum posts"""
        result = self.run_test("Get Forum Posts", "GET", "forums/posts", 200)
        return result is not None and isinstance(result, list)

    def test_search_posts(self):
        """Test searching posts"""
        result = self.run_test("Search Posts", "GET", "search?q=test", 200)
        return result is not None and isinstance(result, list)

    def test_get_chat_rooms(self):
        """Test getting chat rooms"""
        result = self.run_test("Get Chat Rooms", "GET", "chat/rooms", 200)
        return result is not None and isinstance(result, list)

    def test_profile_update(self):
        """Test updating user profile"""
        profile_data = {
            "nickname": "Test Nickname",
            "bio": "Test bio for testing",
            "parenting_stage": "newborn",
            "interests": ["sleep", "feeding"]
        }
        
        result = self.run_test("Update Profile", "PUT", "users/profile", 200, profile_data)
        return result is not None

    def test_get_conversations(self):
        """Test getting direct message conversations"""
        result = self.run_test("Get Conversations", "GET", "messages/conversations", 200)
        return result is not None and isinstance(result, list)

    def run_all_tests(self):
        """Run all API tests"""
        print("🦉 Starting NightOwl Parents API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)

        # Test basic endpoints first
        self.test_seed_data()
        
        # Test authentication flow
        if not self.test_register():
            print("❌ Registration failed, stopping auth tests")
            return False
            
        self.test_get_me()
        
        # Test a separate login flow
        self.test_login()
        
        # Test protected endpoints
        self.test_get_categories()
        self.test_get_feed()
        self.test_create_post()
        self.test_get_posts()
        self.test_search_posts()
        self.test_get_chat_rooms()
        self.test_profile_update()
        self.test_get_conversations()
        
        # Test logout
        self.test_logout()

        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    tester = NightOwlParentsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())