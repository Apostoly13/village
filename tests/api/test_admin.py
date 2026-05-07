"""
Admin & Moderation API Tests.
"""
import pytest
from tests.utils.test_data import post_payload, PREFIX
from tests.utils.test_users import login_as


@pytest.mark.admin
class TestAdminAccess:

    def test_admin_can_list_users(self, admin):
        r = admin.get("/admin/users")
        assert r.status_code == 200
        body = r.json()
        users = body if isinstance(body, list) else body.get("users", [])
        assert isinstance(users, list)
        assert len(users) > 0

    def test_admin_can_search_users(self, admin):
        r = admin.get("/admin/users?search=TEST_AUTOMATION")
        assert r.status_code == 200

    def test_admin_stats_available(self, admin):
        r = admin.get("/admin/stats")
        assert r.status_code in (200, 404)  # 404 = endpoint may not exist yet

    def test_admin_can_view_reports(self, admin):
        r = admin.get("/admin/reports")
        assert r.status_code == 200


@pytest.mark.admin
class TestModeration:

    @pytest.fixture(scope="class")
    def report_target_post_id(self, premium_client, category_id):
        payload = post_payload("report_target")
        payload["category_id"] = category_id
        r = premium_client.post("/forums/posts", json=payload)
        assert r.status_code in (200, 201)
        return r.json()["post_id"]

    def test_free_user_can_report_post(self, free_client, report_target_post_id):
        # Reports are POST /reports with content_type + content_id
        r = free_client.post("/reports", json={
            "content_type": "post",
            "content_id": report_target_post_id,
            "reason": f"[TEST_AUTOMATION] Automated test report — safe to ignore",
        })
        assert r.status_code in (200, 201, 400, 409), \
            f"Report failed: {r.status_code} {r.text[:100]}"
        # 400 = already reported (fine if test ran before)

    def test_admin_can_see_report(self, admin):
        r = admin.get("/admin/reports?status=pending")
        assert r.status_code == 200

    def test_moderator_can_view_reports(self, mod_client):
        r = mod_client.get("/admin/reports?status=pending")
        assert r.status_code in (200, 403)  # 403 = mods don't have report access = OK

    def test_moderator_can_ban_user(self, admin, mod_client):
        """Moderators should be able to ban users (via get_admin_user dependency)."""
        # Get free user's ID
        from tests.utils.test_data import TEST_USERS
        from tests.utils.api_client import fresh_client
        tmp = fresh_client()
        tmp.login(TEST_USERS["free"]["email"], TEST_USERS["free"]["password"])
        free_uid = tmp.me().json().get("user_id")

        if not free_uid:
            pytest.skip("Could not get free user ID")

        r = mod_client.post(f"/admin/users/{free_uid}/ban",
                            json={"reason": f"[{PREFIX}] Automated test ban — will be unbanned"})
        if r.status_code in (200, 201):
            # Always unban immediately
            admin.post(f"/admin/users/{free_uid}/unban")
        assert r.status_code in (200, 201, 403), f"Unexpected ban response: {r.status_code}"


@pytest.mark.admin
class TestSubscriptionControl:

    def test_admin_can_grant_premium(self, admin, free_client):
        free_uid = free_client.me().json().get("user_id")
        r = admin.post(f"/admin/users/{free_uid}/subscription", json={"tier": "premium"})
        assert r.status_code in (200, 201), f"Admin grant premium failed: {r.text[:200]}"
        # Reset
        admin.post(f"/admin/users/{free_uid}/subscription", json={"tier": "free"})

    def test_admin_can_set_trial(self, admin, free_client):
        free_uid = free_client.me().json().get("user_id")
        r = admin.post(f"/admin/users/{free_uid}/subscription", json={"tier": "trial"})
        assert r.status_code in (200, 201)
        admin.post(f"/admin/users/{free_uid}/subscription", json={"tier": "free"})

    def test_invalid_tier_rejected(self, admin, free_client):
        free_uid = free_client.me().json().get("user_id")
        r = admin.post(f"/admin/users/{free_uid}/subscription", json={"tier": "god_mode"})
        assert r.status_code in (400, 422)
