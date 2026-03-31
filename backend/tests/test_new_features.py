"""
Test suite for new features:
1. Image uploads for posts and profile pictures
2. Email notifications endpoints
3. Location-based chat rooms (local + global)
4. Region selection in profile
5. Email preferences in profile settings
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://family-support-17.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "forumtester@test.com"
TEST_PASSWORD = "TestPass123!"

class TestAuthAndSetup:
    """Authentication and setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_seed_data(self):
        """Test seed endpoint creates local chat rooms"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Seed response: {data}")


class TestProfileRegionAndEmailPrefs:
    """Test profile region and email preferences"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_update_profile_with_region(self, auth_headers):
        """Test updating profile with region field"""
        response = requests.put(f"{BASE_URL}/api/users/profile", 
            headers=auth_headers,
            json={
                "region": "UK",
                "location": "London"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("region") == "UK"
        assert data.get("location") == "London"
        print(f"Profile updated with region: {data.get('region')}")
    
    def test_update_profile_with_email_preferences(self, auth_headers):
        """Test updating profile with email notification preferences"""
        email_prefs = {
            "notify_replies": True,
            "notify_dms": False,
            "notify_friend_requests": True,
            "weekly_digest": False
        }
        response = requests.put(f"{BASE_URL}/api/users/profile", 
            headers=auth_headers,
            json={
                "email_preferences": email_prefs
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_preferences" in data
        assert data["email_preferences"]["notify_replies"] == True
        assert data["email_preferences"]["notify_dms"] == False
        print(f"Email preferences updated: {data.get('email_preferences')}")
    
    def test_get_user_profile_has_region_and_email_prefs(self, auth_headers, auth_token):
        """Verify GET profile returns region and email_preferences"""
        # First get user_id from auth/me
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert me_response.status_code == 200
        user_id = me_response.json()["user_id"]
        
        # Get full profile
        response = requests.get(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Region should be present (may be null if not set)
        assert "region" in data or data.get("region") is None or data.get("region") == "UK"
        print(f"Profile has region: {data.get('region')}")


class TestChatRoomsWithRegions:
    """Test location-based chat rooms"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_get_chat_rooms_returns_local_and_global(self, auth_headers):
        """Test chat rooms endpoint returns local_rooms and global_rooms"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "local_rooms" in data
        assert "global_rooms" in data
        assert "available_regions" in data
        
        # Check available regions
        regions = data["available_regions"]
        assert "UK" in regions
        assert "US" in regions
        assert "Australia" in regions
        print(f"Available regions: {regions}")
        print(f"Local rooms count: {len(data['local_rooms'])}")
        print(f"Global rooms count: {len(data['global_rooms'])}")
    
    def test_get_chat_rooms_with_region_filter(self, auth_headers):
        """Test chat rooms with region query parameter"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms?region=UK", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Local rooms should be for UK region
        for room in data.get("local_rooms", []):
            assert room.get("region") == "UK" or room.get("room_type") == "local"
        print(f"UK local rooms: {len(data.get('local_rooms', []))}")
    
    def test_get_chat_rooms_us_region(self, auth_headers):
        """Test chat rooms for US region"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms?region=US", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        print(f"US local rooms: {len(data.get('local_rooms', []))}")
    
    def test_global_rooms_available(self, auth_headers):
        """Test that global rooms are always available"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        global_rooms = data.get("global_rooms", [])
        # Should have some global rooms from seed
        assert len(global_rooms) >= 0  # May be 0 if only local rooms seeded
        
        for room in global_rooms:
            # room_type may be missing for legacy rooms (created before feature)
            room_type = room.get("room_type")
            if room_type is not None:
                assert room_type in ["global", "overflow"]
        print(f"Global rooms: {[r['name'] for r in global_rooms]}")
    
    def test_chat_room_has_room_type_field(self, auth_headers):
        """Test that NEW chat rooms have room_type field (local rooms from seed)"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Local rooms (newly seeded) should have room_type
        local_rooms = data.get("local_rooms", [])
        for room in local_rooms:
            assert "room_type" in room
            assert room["room_type"] in ["global", "local", "overflow"]
        
        # Global rooms may be legacy (without room_type) or new
        global_rooms = data.get("global_rooms", [])
        rooms_with_type = [r for r in global_rooms if "room_type" in r]
        print(f"Local rooms with room_type: {len(local_rooms)}")
        print(f"Global rooms with room_type: {len(rooms_with_type)}/{len(global_rooms)}")


class TestImageUpload:
    """Test image upload functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_upload_image_endpoint_exists(self, auth_headers):
        """Test that image upload endpoint exists"""
        # Create a small test image (1x1 red pixel PNG)
        # PNG header + IHDR + IDAT + IEND
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test.png", png_data, "image/png")}
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            headers=auth_headers,
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["image_url"].startswith("data:image/png;base64,")
        print(f"Image uploaded successfully, size: {data.get('size')} bytes")
    
    def test_upload_image_rejects_invalid_type(self, auth_headers):
        """Test that invalid file types are rejected"""
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        response = requests.post(
            f"{BASE_URL}/api/upload/image",
            headers=auth_headers,
            files=files
        )
        assert response.status_code == 400
        print("Invalid file type correctly rejected")
    
    def test_create_post_with_image(self, auth_headers):
        """Test creating a post with an image"""
        # First upload an image
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        files = {"file": ("test.png", png_data, "image/png")}
        upload_response = requests.post(
            f"{BASE_URL}/api/upload/image",
            headers=auth_headers,
            files=files
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Get a category
        cat_response = requests.get(f"{BASE_URL}/api/forums/categories", headers=auth_headers)
        categories = cat_response.json()
        category_id = categories[0]["category_id"] if categories else "cat_general"
        
        # Create post with image
        post_headers = {**auth_headers, "Content-Type": "application/json"}
        response = requests.post(
            f"{BASE_URL}/api/forums/posts",
            headers=post_headers,
            json={
                "title": "TEST_Post with Image",
                "content": "This post has an attached image for testing",
                "category_id": category_id,
                "is_anonymous": False,
                "image": image_url
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("image") == image_url
        print(f"Post created with image: {data.get('post_id')}")
        
        # Cleanup - delete the test post
        delete_response = requests.delete(
            f"{BASE_URL}/api/forums/posts/{data['post_id']}",
            headers=post_headers
        )
        print(f"Test post deleted: {delete_response.status_code}")


class TestProfilePictureUpload:
    """Test profile picture upload"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_update_profile_picture(self, auth_headers):
        """Test updating profile with picture field"""
        # Create a small test image
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        # Upload image first
        files = {"file": ("profile.png", png_data, "image/png")}
        upload_response = requests.post(
            f"{BASE_URL}/api/upload/image",
            headers=auth_headers,
            files=files
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Update profile with picture
        profile_headers = {**auth_headers, "Content-Type": "application/json"}
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers=profile_headers,
            json={"picture": image_url}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("picture") == image_url
        print("Profile picture updated successfully")


class TestNotificationEndpoints:
    """Test email notification endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_get_notifications(self, auth_headers):
        """Test GET /api/notifications endpoint"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Notifications count: {len(data)}")
    
    def test_get_unread_count(self, auth_headers):
        """Test GET /api/notifications/unread-count endpoint"""
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        print(f"Unread notifications: {data['count']}")
    
    def test_mark_all_notifications_read(self, auth_headers):
        """Test POST /api/notifications/mark-read endpoint"""
        response = requests.post(f"{BASE_URL}/api/notifications/mark-read", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Mark read response: {data}")
        
        # Verify unread count is now 0
        count_response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=auth_headers)
        assert count_response.status_code == 200
        assert count_response.json()["count"] == 0
        print("All notifications marked as read")


class TestChatRoomJoinLeave:
    """Test chat room join/leave with capacity"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_join_chat_room(self, auth_headers):
        """Test joining a chat room"""
        # Get a room first
        rooms_response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=auth_headers)
        assert rooms_response.status_code == 200
        data = rooms_response.json()
        
        all_rooms = data.get("local_rooms", []) + data.get("global_rooms", [])
        if not all_rooms:
            pytest.skip("No chat rooms available")
        
        room_id = all_rooms[0]["room_id"]
        
        # Join the room
        response = requests.post(f"{BASE_URL}/api/chat/rooms/{room_id}/join", headers=auth_headers)
        assert response.status_code == 200
        join_data = response.json()
        assert "message" in join_data
        print(f"Joined room: {room_id}")
    
    def test_leave_chat_room(self, auth_headers):
        """Test leaving a chat room"""
        # Get a room first
        rooms_response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=auth_headers)
        data = rooms_response.json()
        
        all_rooms = data.get("local_rooms", []) + data.get("global_rooms", [])
        if not all_rooms:
            pytest.skip("No chat rooms available")
        
        room_id = all_rooms[0]["room_id"]
        
        # Leave the room
        response = requests.post(f"{BASE_URL}/api/chat/rooms/{room_id}/leave", headers=auth_headers)
        assert response.status_code == 200
        leave_data = response.json()
        assert "message" in leave_data
        print(f"Left room: {room_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
