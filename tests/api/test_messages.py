"""
Direct Messaging API Tests — send, read, privacy.
"""
import pytest
from tests.utils.test_data import message_payload, PREFIX
from tests.utils.api_client import fresh_client
from tests.utils.test_users import login_as


@pytest.mark.messages
class TestDirectMessages:

    def test_send_dm(self, premium_client, free_client):
        free_uid = free_client.me().json()["user_id"]
        payload = message_payload()
        payload["receiver_id"] = free_uid
        r = premium_client.post("/messages", json=payload)
        assert r.status_code in (200, 201), f"DM send failed: {r.text[:200]}"

    def test_cannot_send_dm_unauthenticated(self, anon_client, free_client):
        free_uid = free_client.me().json()["user_id"]
        payload = message_payload()
        payload["receiver_id"] = free_uid
        r = anon_client.post("/messages", json=payload)
        assert r.status_code in (401, 403)

    def test_get_conversation(self, premium_client, free_client):
        free_uid = free_client.me().json()["user_id"]
        # Send a message first
        payload = message_payload()
        payload["receiver_id"] = free_uid
        premium_client.post("/messages", json=payload)

        r = premium_client.get(f"/messages/{free_uid}")
        assert r.status_code == 200
        messages = r.json()
        assert isinstance(messages, list)

    def test_third_party_cannot_read_conversation(self, premium_client, free_client):
        """A third user must not be able to read another pair's DMs."""
        free_uid = free_client.me().json()["user_id"]
        premium_uid = premium_client.me().json()["user_id"]

        # Send message between premium and free
        premium_client.post("/messages", json={**message_payload(), "receiver_id": free_uid})

        # Moderator tries to read premium↔free conversation
        mod = login_as("moderator")
        r = mod.get(f"/messages/{free_uid}")
        # Moderator fetching their own convo with free is fine (returns empty)
        # But the content must not include premium↔free messages
        if r.status_code == 200:
            msgs = r.json()
            for msg in msgs:
                assert msg.get("sender_id") not in (premium_uid,) or \
                       msg.get("receiver_id") not in (free_uid,), \
                    "Third party can read another user's DM conversation"
        else:
            assert r.status_code in (401, 403)

    def test_conversations_list(self, premium_client):
        r = premium_client.get("/messages/conversations")
        assert r.status_code == 200

    def test_unread_count(self, premium_client):
        r = premium_client.get("/messages/unread-count")
        assert r.status_code == 200
        assert "count" in r.json()

    def test_no_message_content_in_notification(self, premium_client, free_client):
        """Notification triggered by DM must not contain full message body."""
        free_uid = free_client.me().json()["user_id"]
        secret = f"SECRET_CONTENT_{PREFIX}"
        premium_client.post("/messages", json={"receiver_id": free_uid, "content": secret})

        r = free_client.get("/notifications")
        if r.status_code != 200:
            pytest.skip("Notifications endpoint not available")
        body = r.text
        assert secret not in body, "Full DM content leaked in notification response"
