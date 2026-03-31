"""
Comprehensive tests for Forum Enhancement Features
Tests: Sorting, Filtering, Edit/Delete, Bookmarks, Nested Replies, 
       Trending, Notifications, Reports, Pagination
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://family-support-17.preview.emergentagent.com')

# Test user credentials
TEST_EMAIL = "forumtester@test.com"
TEST_PASSWORD = "TestPass123!"
TEST_NAME = "Forum Tester"


class TestSetup:
    """Setup tests - seed data and user registration"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_seed_data(self, session):
        """Seed forum categories if not present"""
        response = session.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        print(f"Seed response: {response.json()}")
    
    def test_register_user(self, session):
        """Register test user"""
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        # 200 or 400 (already exists) are both acceptable
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            print(f"User registered: {response.json()}")
        else:
            print(f"User already exists: {response.json()}")


class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        # Login
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_login(self, auth_session):
        """Test login returns token"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        print(f"Logged in as: {data['name']}")


class TestForumCategories:
    """Forum categories tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_categories(self, auth_session):
        """Test categories endpoint returns enhanced data"""
        response = auth_session.get(f"{BASE_URL}/api/forums/categories")
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) > 0
        
        # Check enhanced category data
        cat = categories[0]
        assert "category_id" in cat
        assert "name" in cat
        assert "post_count" in cat
        assert "active_users" in cat  # New field
        assert "last_activity" in cat  # New field
        print(f"Found {len(categories)} categories with enhanced data")
    
    def test_get_single_category(self, auth_session):
        """Test getting a single category"""
        # First get all categories
        response = auth_session.get(f"{BASE_URL}/api/forums/categories")
        categories = response.json()
        category_id = categories[0]["category_id"]
        
        # Get single category
        response = auth_session.get(f"{BASE_URL}/api/forums/categories/{category_id}")
        assert response.status_code == 200
        cat = response.json()
        assert cat["category_id"] == category_id


class TestForumPostsSortingFiltering:
    """Tests for sorting and filtering posts"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def category_id(self, auth_session):
        response = auth_session.get(f"{BASE_URL}/api/forums/categories")
        return response.json()[0]["category_id"]
    
    def test_get_posts_newest(self, auth_session, category_id):
        """Test sorting by newest"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&sort=newest")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "total" in data
        print(f"Newest sort: {data['total']} posts")
    
    def test_get_posts_oldest(self, auth_session, category_id):
        """Test sorting by oldest"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&sort=oldest")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
    
    def test_get_posts_popular(self, auth_session, category_id):
        """Test sorting by popular (most likes)"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&sort=popular")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
    
    def test_get_posts_most_replies(self, auth_session, category_id):
        """Test sorting by most replies"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&sort=most_replies")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
    
    def test_filter_unanswered(self, auth_session, category_id):
        """Test filtering unanswered posts"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&filter_type=unanswered")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        # All posts should have reply_count = 0
        for post in data["posts"]:
            assert post["reply_count"] == 0
        print(f"Unanswered filter: {len(data['posts'])} posts")
    
    def test_filter_trending(self, auth_session, category_id):
        """Test filtering trending posts"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&filter_type=trending")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
    
    def test_pagination(self, auth_session, category_id):
        """Test pagination with skip and limit"""
        # Get first page
        response1 = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&limit=5&skip=0")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Get second page
        response2 = auth_session.get(f"{BASE_URL}/api/forums/posts?category_id={category_id}&limit=5&skip=5")
        assert response2.status_code == 200
        data2 = response2.json()
        
        assert "total" in data1
        assert "limit" in data1
        assert "skip" in data1
        print(f"Pagination: total={data1['total']}, limit={data1['limit']}")


class TestTrendingPosts:
    """Tests for trending posts endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_trending_posts(self, auth_session):
        """Test trending posts endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/forums/posts/trending?limit=5")
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list)
        
        # Check trending posts have category info
        if len(posts) > 0:
            post = posts[0]
            assert "category_name" in post
            assert "category_icon" in post
        print(f"Trending posts: {len(posts)}")


class TestPostCRUD:
    """Tests for creating, reading, updating, deleting posts"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def category_id(self, auth_session):
        response = auth_session.get(f"{BASE_URL}/api/forums/categories")
        return response.json()[0]["category_id"]
    
    def test_create_post(self, auth_session, category_id):
        """Test creating a new post"""
        response = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Forum Enhancement Test Post",
            "content": "This is a test post for forum enhancements testing. Testing character count and post creation.",
            "is_anonymous": False
        })
        assert response.status_code == 200
        post = response.json()
        assert "post_id" in post
        assert post["title"] == "TEST_Forum Enhancement Test Post"
        print(f"Created post: {post['post_id']}")
        return post["post_id"]
    
    def test_get_post_with_user_status(self, auth_session, category_id):
        """Test getting a post shows user liked/bookmarked status"""
        # Create a post first
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Post Status Test",
            "content": "Testing user status fields",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        
        # Get the post
        response = auth_session.get(f"{BASE_URL}/api/forums/posts/{post_id}")
        assert response.status_code == 200
        post = response.json()
        
        # Check user status fields
        assert "user_liked" in post
        assert "user_bookmarked" in post
        assert "is_own_post" in post
        assert post["is_own_post"] == True  # We created it
        print(f"Post has user status fields: liked={post['user_liked']}, bookmarked={post['user_bookmarked']}")
    
    def test_edit_own_post(self, auth_session, category_id):
        """Test editing own post"""
        # Create a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Original Title",
            "content": "Original content",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        
        # Edit the post
        response = auth_session.put(f"{BASE_URL}/api/forums/posts/{post_id}", json={
            "title": "TEST_Updated Title",
            "content": "Updated content"
        })
        assert response.status_code == 200
        updated = response.json()
        assert updated["title"] == "TEST_Updated Title"
        assert updated["is_edited"] == True
        print(f"Post edited successfully: {updated['title']}")
    
    def test_delete_own_post(self, auth_session, category_id):
        """Test deleting own post"""
        # Create a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Post to Delete",
            "content": "This post will be deleted",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        
        # Delete the post
        response = auth_session.delete(f"{BASE_URL}/api/forums/posts/{post_id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        get_resp = auth_session.get(f"{BASE_URL}/api/forums/posts/{post_id}")
        assert get_resp.status_code == 404
        print("Post deleted successfully")


class TestBookmarks:
    """Tests for bookmark functionality"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def category_id(self, auth_session):
        response = auth_session.get(f"{BASE_URL}/api/forums/categories")
        return response.json()[0]["category_id"]
    
    def test_bookmark_post(self, auth_session, category_id):
        """Test bookmarking a post"""
        # Create a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Bookmark Test Post",
            "content": "This post will be bookmarked",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        
        # Bookmark the post
        response = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/bookmark")
        assert response.status_code == 200
        data = response.json()
        assert data["bookmarked"] == True
        print("Post bookmarked successfully")
        return post_id
    
    def test_get_bookmarks(self, auth_session, category_id):
        """Test getting user's bookmarks"""
        # First bookmark a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Bookmark List Test",
            "content": "Testing bookmark list",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/bookmark")
        
        # Get bookmarks
        response = auth_session.get(f"{BASE_URL}/api/bookmarks")
        assert response.status_code == 200
        bookmarks = response.json()
        assert isinstance(bookmarks, list)
        
        # Check bookmark has category info
        if len(bookmarks) > 0:
            bm = bookmarks[0]
            assert "category_name" in bm
            assert "category_icon" in bm
            assert "bookmarked_at" in bm
        print(f"Found {len(bookmarks)} bookmarks")
    
    def test_unbookmark_post(self, auth_session, category_id):
        """Test removing a bookmark"""
        # Create and bookmark a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Unbookmark Test",
            "content": "This bookmark will be removed",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/bookmark")
        
        # Unbookmark (toggle)
        response = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/bookmark")
        assert response.status_code == 200
        data = response.json()
        assert data["bookmarked"] == False
        print("Bookmark removed successfully")


class TestReplies:
    """Tests for reply functionality including nested replies"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def test_post(self, auth_session):
        # Get category
        cat_resp = auth_session.get(f"{BASE_URL}/api/forums/categories")
        category_id = cat_resp.json()[0]["category_id"]
        
        # Create a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Reply Test Post",
            "content": "This post is for testing replies",
            "is_anonymous": False
        })
        return create_resp.json()
    
    def test_create_reply(self, auth_session, test_post):
        """Test creating a reply"""
        post_id = test_post["post_id"]
        
        response = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "This is a test reply with character count visible",
            "is_anonymous": False
        })
        assert response.status_code == 200
        reply = response.json()
        assert "reply_id" in reply
        assert reply["content"] == "This is a test reply with character count visible"
        print(f"Created reply: {reply['reply_id']}")
        return reply["reply_id"]
    
    def test_create_nested_reply(self, auth_session, test_post):
        """Test creating a nested/threaded reply"""
        post_id = test_post["post_id"]
        
        # Create parent reply
        parent_resp = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "Parent reply for nesting test",
            "is_anonymous": False
        })
        parent_reply_id = parent_resp.json()["reply_id"]
        
        # Create nested reply
        response = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "This is a nested reply to the parent",
            "is_anonymous": False,
            "parent_reply_id": parent_reply_id
        })
        assert response.status_code == 200
        nested = response.json()
        assert nested["parent_reply_id"] == parent_reply_id
        print(f"Created nested reply: {nested['reply_id']} -> parent: {parent_reply_id}")
    
    def test_like_reply(self, auth_session, test_post):
        """Test liking a reply"""
        post_id = test_post["post_id"]
        
        # Create a reply
        reply_resp = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "Reply to be liked",
            "is_anonymous": False
        })
        reply_id = reply_resp.json()["reply_id"]
        
        # Like the reply
        response = auth_session.post(f"{BASE_URL}/api/forums/replies/{reply_id}/like")
        assert response.status_code == 200
        data = response.json()
        assert data["liked"] == True
        print("Reply liked successfully")
    
    def test_get_replies_with_user_status(self, auth_session, test_post):
        """Test getting replies shows user liked status"""
        post_id = test_post["post_id"]
        
        response = auth_session.get(f"{BASE_URL}/api/forums/posts/{post_id}/replies")
        assert response.status_code == 200
        replies = response.json()
        
        if len(replies) > 0:
            reply = replies[0]
            assert "user_liked" in reply
            assert "is_own_reply" in reply
        print(f"Got {len(replies)} replies with user status")
    
    def test_edit_reply(self, auth_session, test_post):
        """Test editing own reply"""
        post_id = test_post["post_id"]
        
        # Create a reply
        reply_resp = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "Original reply content",
            "is_anonymous": False
        })
        reply_id = reply_resp.json()["reply_id"]
        
        # Edit the reply
        response = auth_session.put(f"{BASE_URL}/api/forums/replies/{reply_id}", json={
            "content": "Updated reply content"
        })
        assert response.status_code == 200
        updated = response.json()
        assert updated["content"] == "Updated reply content"
        assert updated["is_edited"] == True
        print("Reply edited successfully")
    
    def test_delete_reply(self, auth_session, test_post):
        """Test deleting own reply"""
        post_id = test_post["post_id"]
        
        # Create a reply
        reply_resp = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "Reply to be deleted",
            "is_anonymous": False
        })
        reply_id = reply_resp.json()["reply_id"]
        
        # Delete the reply
        response = auth_session.delete(f"{BASE_URL}/api/forums/replies/{reply_id}")
        assert response.status_code == 200
        print("Reply deleted successfully")


class TestNotifications:
    """Tests for notification functionality"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_notifications(self, auth_session):
        """Test getting notifications"""
        response = auth_session.get(f"{BASE_URL}/api/notifications?limit=10")
        assert response.status_code == 200
        notifications = response.json()
        assert isinstance(notifications, list)
        print(f"Found {len(notifications)} notifications")
    
    def test_get_unread_count(self, auth_session):
        """Test getting unread notification count"""
        response = auth_session.get(f"{BASE_URL}/api/notifications/unread-count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"Unread count: {data['count']}")
    
    def test_mark_all_read(self, auth_session):
        """Test marking all notifications as read"""
        response = auth_session.post(f"{BASE_URL}/api/notifications/mark-read")
        assert response.status_code == 200
        print("All notifications marked as read")


class TestReports:
    """Tests for report functionality"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def test_post(self, auth_session):
        # Get category
        cat_resp = auth_session.get(f"{BASE_URL}/api/forums/categories")
        category_id = cat_resp.json()[0]["category_id"]
        
        # Create a post
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Report Test Post",
            "content": "This post is for testing reports",
            "is_anonymous": False
        })
        return create_resp.json()
    
    def test_report_post(self, auth_session, test_post):
        """Test reporting a post"""
        response = auth_session.post(f"{BASE_URL}/api/reports", json={
            "content_type": "post",
            "content_id": test_post["post_id"],
            "reason": "spam",
            "details": "Test report - please ignore"
        })
        assert response.status_code == 200
        data = response.json()
        assert "report_id" in data
        print(f"Report submitted: {data['report_id']}")
    
    def test_report_reply(self, auth_session, test_post):
        """Test reporting a reply"""
        post_id = test_post["post_id"]
        
        # Create a reply
        reply_resp = auth_session.post(f"{BASE_URL}/api/forums/posts/{post_id}/replies", json={
            "content": "Reply to be reported",
            "is_anonymous": False
        })
        reply_id = reply_resp.json()["reply_id"]
        
        # Report the reply
        response = auth_session.post(f"{BASE_URL}/api/reports", json={
            "content_type": "reply",
            "content_id": reply_id,
            "reason": "harassment",
            "details": "Test report for reply"
        })
        assert response.status_code == 200
        print("Reply reported successfully")
    
    def test_duplicate_report_rejected(self, auth_session, test_post):
        """Test that duplicate reports are rejected"""
        # Create a new post to report
        cat_resp = auth_session.get(f"{BASE_URL}/api/forums/categories")
        category_id = cat_resp.json()[0]["category_id"]
        
        create_resp = auth_session.post(f"{BASE_URL}/api/forums/posts", json={
            "category_id": category_id,
            "title": "TEST_Duplicate Report Test",
            "content": "Testing duplicate report rejection",
            "is_anonymous": False
        })
        post_id = create_resp.json()["post_id"]
        
        # First report
        auth_session.post(f"{BASE_URL}/api/reports", json={
            "content_type": "post",
            "content_id": post_id,
            "reason": "spam"
        })
        
        # Second report should fail
        response = auth_session.post(f"{BASE_URL}/api/reports", json={
            "content_type": "post",
            "content_id": post_id,
            "reason": "harassment"
        })
        assert response.status_code == 400
        print("Duplicate report correctly rejected")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_cleanup_test_posts(self, auth_session):
        """Clean up TEST_ prefixed posts"""
        # Get all posts
        response = auth_session.get(f"{BASE_URL}/api/forums/posts?limit=100")
        if response.status_code == 200:
            data = response.json()
            posts = data.get("posts", data)
            deleted = 0
            for post in posts:
                if post.get("title", "").startswith("TEST_"):
                    del_resp = auth_session.delete(f"{BASE_URL}/api/forums/posts/{post['post_id']}")
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"Cleaned up {deleted} test posts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
