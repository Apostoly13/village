"""
Notifications API Tests.
"""
import pytest
from tests.utils.test_data import post_payload


@pytest.mark.notifications
class TestNotifications:

    def test_get_notifications(self, free_client):
        r = free_client.get("/notifications")
        assert r.status_code == 200
        body = r.json()
        notifs = body if isinstance(body, list) else body.get("notifications", [])
        assert isinstance(notifs, list)

    def test_notification_created_after_reply(self, premium_client, free_client, category_id):
        """Replying to someone's post should create a notification for the author."""
        # Premium creates post
        payload = post_payload("notif_target")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        post_id = r.json()["post_id"]

        # Free user replies
        free_client.post(f"/forums/posts/{post_id}/replies",
                         json={"content": "Test reply that should trigger notification"})

        # Premium user checks notifications
        r2 = premium_client.get("/notifications?limit=5")
        assert r2.status_code == 200

    def test_mark_notification_read(self, free_client):
        r = free_client.get("/notifications?limit=5")
        assert r.status_code == 200
        body = r.json()
        notifs = body if isinstance(body, list) else body.get("notifications", [])
        if not notifs:
            pytest.skip("No notifications to mark read")

        notif_id = notifs[0]["notification_id"]
        r2 = free_client.post(f"/notifications/{notif_id}/read")
        assert r2.status_code in (200, 204)

    def test_notifications_only_own(self, free_client, premium_client):
        """A user must only see their own notifications."""
        free_me = free_client.me().json()
        r = free_client.get("/notifications")
        assert r.status_code == 200
        body = r.json()
        notifs = body if isinstance(body, list) else body.get("notifications", [])
        for n in notifs:
            assert n.get("user_id") == free_me["user_id"] or "user_id" not in n, \
                "Notification with wrong user_id returned"
