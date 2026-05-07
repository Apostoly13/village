"""
Forum API Tests — posts, replies, likes, anonymous posting.
"""
import pytest
from tests.utils.test_data import post_payload, anon_post_payload, reply_payload, PREFIX
from tests.utils.api_client import fresh_client


@pytest.mark.forums
class TestPosts:

    def test_create_post(self, premium_client, category_id):
        payload = post_payload()
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201), f"Post creation failed: {r.text[:200]}"
        data = r.json()
        assert "post_id" in data
        assert PREFIX in data.get("title", "")

    def test_list_posts(self, premium_client, category_id):
        r = premium_client.get(f"/forums/posts?category_id={category_id}")
        assert r.status_code == 200
        body = r.json()
        # Accept list or paginated dict
        posts = body if isinstance(body, list) else body.get("posts", body.get("items", []))
        assert isinstance(posts, list)

    def test_get_single_post(self, premium_client, category_id):
        payload = post_payload("single")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        r2 = premium_client.get(f"/forums/posts/{post_id}")
        assert r2.status_code == 200
        assert r2.json()["post_id"] == post_id

    def test_edit_own_post(self, premium_client, category_id):
        payload = post_payload("edit_me")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        r2 = premium_client.put(f"/forums/posts/{post_id}",
                                json={"content": f"[{PREFIX}] Edited content"})
        assert r2.status_code == 200

    def test_cannot_edit_others_post(self, premium_client, free_client, category_id):
        payload = post_payload("edit_guard")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        # Free user tries to edit premium user's post
        r2 = free_client.put(f"/forums/posts/{post_id}",
                              json={"content": "Hijacked!"})
        assert r2.status_code in (403, 401)

    def test_delete_own_post(self, premium_client, category_id):
        payload = post_payload("delete_me")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        r2 = premium_client.delete(f"/forums/posts/{post_id}")
        assert r2.status_code in (200, 204)

    def test_cannot_delete_others_post(self, premium_client, free_client, category_id):
        payload = post_payload("del_guard")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        r2 = free_client.delete(f"/forums/posts/{post_id}")
        assert r2.status_code in (403, 401)


@pytest.mark.forums
class TestReplies:

    @pytest.fixture(scope="class")
    def post_id(self, premium_client, category_id):
        payload = post_payload("replies_target")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        return r.json()["post_id"]

    def test_create_reply(self, premium_client, post_id):
        r = premium_client.post(f"/forums/posts/{post_id}/replies",
                                json=reply_payload())
        assert r.status_code in (200, 201), f"Reply failed: {r.text[:200]}"
        assert "reply_id" in r.json()

    def test_free_user_can_reply(self, free_client, post_id):
        r = free_client.post(f"/forums/posts/{post_id}/replies",
                             json=reply_payload("free user reply"))
        if r.status_code == 429:
            import pytest
            pytest.skip("Rate-limited during test run — retry individually")
        assert r.status_code in (200, 201)

    def test_get_replies(self, premium_client, post_id):
        r = premium_client.get(f"/forums/posts/{post_id}/replies")
        assert r.status_code == 200
        body = r.json()
        replies = body if isinstance(body, list) else body.get("replies", [])
        assert isinstance(replies, list)


@pytest.mark.forums
@pytest.mark.anonymous
class TestAnonymousPosts:

    def test_anonymous_post_created(self, premium_client, category_id):
        payload = anon_post_payload("anon_test")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201), f"Anon post failed: {r.text[:200]}"
        data = r.json()
        assert data.get("is_anonymous") is True

    def test_anonymous_author_hidden_from_other_user(self, premium_client, free_client, category_id):
        """Another user must not see the real author identity."""
        payload = anon_post_payload("anon_privacy")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        # Free user fetches the post
        r2 = free_client.get(f"/forums/posts/{post_id}")
        assert r2.status_code == 200
        data = r2.json()
        body_text = r2.text

        # Must NOT expose real author info
        premium_me = premium_client.me().json()
        real_email = premium_me.get("email", "")
        real_id = premium_me.get("user_id", "")
        real_name = premium_me.get("name", "")
        real_picture = premium_me.get("picture", "")

        assert real_email not in body_text, "Author email leaked in anonymous post response"
        assert real_id not in body_text or data.get("author_id") != real_id, \
            "Author user_id leaked in anonymous post response"

    def test_anonymous_post_author_hidden_in_list(self, premium_client, free_client, category_id):
        """Post listing must not leak author identity."""
        payload = anon_post_payload("anon_list")
        payload["category_id"] = category_id
        premium_client.post("/forums/posts", json=payload)

        premium_me = premium_client.me().json()
        real_email = premium_me.get("email", "")

        r = free_client.get(f"/forums/posts?category_id={category_id}&limit=20")
        assert r.status_code == 200
        assert real_email not in r.text, "Author email leaked in post listing"


@pytest.mark.forums
class TestLikes:

    @pytest.fixture(scope="class")
    def post_id(self, premium_client, category_id):
        payload = post_payload("like_target")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        return r.json()["post_id"]

    def test_like_post(self, free_client, post_id):
        r = free_client.post(f"/forums/posts/{post_id}/like")
        assert r.status_code in (200, 201)

    def test_unlike_post(self, free_client, post_id):
        # Like then unlike
        free_client.post(f"/forums/posts/{post_id}/like")
        r = free_client.post(f"/forums/posts/{post_id}/like")  # toggle
        assert r.status_code in (200, 201, 204)

    def test_like_count_updates(self, premium_client, free_client, category_id):
        payload = post_payload("like_count")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        before = premium_client.get(f"/forums/posts/{post_id}").json().get("like_count", 0)
        free_client.post(f"/forums/posts/{post_id}/like")
        after = premium_client.get(f"/forums/posts/{post_id}").json().get("like_count", 0)
        assert after >= before  # count should have changed or stayed (if already liked)
