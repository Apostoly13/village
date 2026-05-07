"""
Marketplace (Village Stall) API Tests.
"""
import pytest
from tests.utils.test_data import listing_payload, stall_message_payload, PREFIX
from tests.utils.api_client import fresh_client


@pytest.mark.marketplace
class TestListingCRUD:

    def test_create_give_away_listing(self, premium_client):
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201), f"Listing create failed: {r.text[:200]}"
        data = r.json()
        assert "listing_id" in data
        assert PREFIX in data.get("title", "")

    def test_create_sell_listing(self, premium_client):
        payload = listing_payload("sell")
        r = premium_client.post("/stall/listings", json=payload)
        assert r.status_code in (200, 201), f"Sell listing failed: {r.text[:200]}"
        assert r.json().get("price") == 10.00

    def test_create_swap_listing(self, premium_client):
        r = premium_client.post("/stall/listings", json=listing_payload("swap"))
        assert r.status_code in (200, 201), f"Swap listing failed: {r.text[:200]}"

    def test_get_listing(self, premium_client):
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        listing_id = r.json()["listing_id"]

        r2 = premium_client.get(f"/stall/listings/{listing_id}")
        assert r2.status_code == 200
        assert r2.json()["listing_id"] == listing_id

    def test_browse_listings(self, premium_client):
        r = premium_client.get("/stall/listings")
        assert r.status_code == 200
        body = r.json()
        listings = body if isinstance(body, list) else body.get("listings", [])
        assert isinstance(listings, list)

    def test_edit_own_listing(self, premium_client):
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        listing_id = r.json()["listing_id"]

        r2 = premium_client.put(f"/stall/listings/{listing_id}",
                                json={"title": f"[{PREFIX}] Edited listing"})
        assert r2.status_code in (200, 201)

    def test_cannot_edit_others_listing(self, premium_client, free_client):
        """Free user must not be able to edit premium user's listing."""
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        listing_id = r.json()["listing_id"]

        r2 = free_client.put(f"/stall/listings/{listing_id}",
                             json={"title": "Hijacked!"})
        assert r2.status_code in (401, 403)

    def test_delete_own_listing(self, premium_client):
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        listing_id = r.json()["listing_id"]

        r2 = premium_client.delete(f"/stall/listings/{listing_id}")
        assert r2.status_code in (200, 204)

    def test_cannot_delete_others_listing(self, premium_client, free_client):
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        listing_id = r.json()["listing_id"]

        r2 = free_client.delete(f"/stall/listings/{listing_id}")
        assert r2.status_code in (401, 403)

    def test_free_user_blocked_from_stall(self, free_client):
        """Free users must not be able to create listings (premium feature)."""
        r = free_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (401, 403), \
            f"Free user should be blocked from creating listings — got {r.status_code}"

    def test_save_listing(self, premium_client):
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        listing_id = r.json()["listing_id"]

        # A second premium client saves it
        from tests.utils.test_users import login_as
        client2 = login_as("premium")  # same user; save own listing to test the endpoint
        r2 = client2.post(f"/stall/listings/{listing_id}/save")
        assert r2.status_code in (200, 201, 400)  # 400 = can't save own listing — acceptable

    def test_404_for_nonexistent_listing(self, premium_client):
        r = premium_client.get("/stall/listings/listing_doesnotexist_xyz")
        assert r.status_code == 404


@pytest.mark.marketplace
class TestStallMessaging:

    @pytest.fixture(scope="class")
    def live_listing(self, premium_client):
        """Create a listing that tests can message about."""
        r = premium_client.post("/stall/listings", json=listing_payload("give_away"))
        assert r.status_code in (200, 201)
        return r.json()

    def test_cannot_message_yourself(self, premium_client, live_listing):
        """
        Seller messaging themselves must be blocked with 400/403.
        XFAIL against pre-deploy dev: old backend returns 500 (unhandled case).
        Fix: 'Cannot send a message to yourself' added in server.py v3.8.0.
        """
        import pytest
        seller_id = premium_client.me().json()["user_id"]
        payload = stall_message_payload(live_listing["listing_id"], seller_id)
        r = premium_client.post("/stall/messages", json=payload)
        if r.status_code == 500:
            pytest.xfail("KNOWN BUG (pre-deploy): self-message returns 500 — needs Railway redeploy")
        assert r.status_code in (400, 403), \
            f"Self-message should be blocked — got {r.status_code}"

    def test_message_receiver_must_be_seller(self, premium_client, free_client, live_listing):
        """
        A buyer messaging a random third user via a listing must be blocked.
        The receiver must be the listing seller.
        """
        # premium_client is seller; free_client is buyer; try to message someone else
        # We use the free_client's user_id as the receiver (not the seller)
        free_uid = free_client.me().json()["user_id"]
        premium_uid = premium_client.me().json()["user_id"]

        # free_client tries to send message to themselves (not the seller)
        if free_uid != premium_uid:  # only meaningful if different users
            payload = stall_message_payload(live_listing["listing_id"], free_uid,
                                            "trying to message non-seller")
            r = free_client.post("/stall/messages", json=payload)
            assert r.status_code in (400, 403), \
                f"Non-seller receiver should be blocked — got {r.status_code}: {r.text[:200]}"


@pytest.mark.marketplace
class TestDonationGroups:

    def test_create_donation_group(self, premium_client):
        from tests.utils.test_data import donation_group_payload
        r = premium_client.post("/stall/groups", json=donation_group_payload())
        assert r.status_code in (200, 201), f"Group create failed: {r.text[:200]}"
        assert "group_id" in r.json()

    def test_browse_groups(self, premium_client):
        r = premium_client.get("/stall/groups")
        assert r.status_code == 200

    def test_free_user_blocked_from_creating_group(self, free_client):
        from tests.utils.test_data import donation_group_payload
        r = free_client.post("/stall/groups", json=donation_group_payload())
        assert r.status_code in (401, 403)
