"""
Events API Tests — create, RSVP, access control.
"""
import pytest
from tests.utils.test_data import event_payload, PREFIX


@pytest.mark.events
class TestEvents:

    @pytest.fixture(scope="class")
    def event_id(self, premium_client):
        r = premium_client.post("/events", json=event_payload())
        if r.status_code not in (200, 201):
            pytest.skip(f"Event creation not available: {r.status_code} {r.text[:100]}")
        return r.json()["event_id"]

    def test_create_event(self, premium_client):
        r = premium_client.post("/events", json=event_payload())
        assert r.status_code in (200, 201), f"Event creation failed: {r.text[:200]}"
        data = r.json()
        assert "event_id" in data
        assert PREFIX in data.get("title", "")

    def test_list_events(self, free_client):
        r = free_client.get("/events")
        assert r.status_code == 200
        body = r.json()
        events = body if isinstance(body, list) else body.get("events", [])
        assert isinstance(events, list)

    def test_get_event(self, premium_client, event_id):
        r = premium_client.get(f"/events/{event_id}")
        assert r.status_code == 200
        assert r.json()["event_id"] == event_id

    def test_rsvp_to_event(self, free_client, event_id):
        r = free_client.post(f"/events/{event_id}/rsvp", json={"status": "going"})
        assert r.status_code in (200, 201), f"RSVP failed: {r.text[:200]}"

    def test_change_rsvp(self, free_client, event_id):
        free_client.post(f"/events/{event_id}/rsvp", json={"status": "going"})
        r = free_client.post(f"/events/{event_id}/rsvp", json={"status": "maybe"})
        assert r.status_code in (200, 201)

    def test_cancel_rsvp(self, free_client, event_id):
        free_client.post(f"/events/{event_id}/rsvp", json={"status": "going"})
        r = free_client.post(f"/events/{event_id}/rsvp", json={"status": "not_going"})
        assert r.status_code in (200, 201)

    def test_cannot_edit_others_event(self, premium_client, free_client):
        """Non-owner must not be able to edit an event."""
        r = premium_client.post("/events", json=event_payload())
        if r.status_code not in (200, 201):
            pytest.skip("Event creation not available")
        event_id = r.json()["event_id"]

        r2 = free_client.put(f"/events/{event_id}",
                             json={"title": "Hijacked event!"})
        assert r2.status_code in (401, 403)

    def test_unauthenticated_cannot_rsvp(self, anon_client, event_id):
        r = anon_client.post(f"/events/{event_id}/rsvp", json={"status": "going"})
        assert r.status_code in (401, 403)

    def test_404_for_nonexistent_event(self, free_client):
        r = free_client.get("/events/event_doesnotexist_xyz")
        assert r.status_code == 404
