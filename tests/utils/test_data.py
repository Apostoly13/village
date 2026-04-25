"""
Test data generators.  All test data is prefixed TEST_AUTOMATION_ so it can
be identified and cleaned up without touching real user content.
"""
import os
import uuid
import time

# Short run-ID suffix so parallel runs don't collide on unique fields
_RUN_ID = os.environ.get("TEST_RUN_ID") or uuid.uuid4().hex[:6]

PREFIX = "TEST_AUTOMATION"


def run_id() -> str:
    return _RUN_ID


def ta_email(role: str) -> str:
    """Deterministic email for a test role — same every run so we can re-use existing accounts."""
    return f"{PREFIX.lower()}_{role}@test.village"


def ta_name(role: str) -> str:
    return f"{PREFIX}_{role}"


def unique_email(label: str = "user") -> str:
    """Unique email for tests that need a fresh account each run."""
    return f"{PREFIX.lower()}_{label}_{_RUN_ID}@test.village"


def post_payload(suffix: str = "") -> dict:
    return {
        "title": f"[{PREFIX}] Test post {suffix or _RUN_ID}",
        "content": f"This is automated test content created by the {PREFIX} suite. Run ID: {_RUN_ID}. Safe to delete.",
        "category_id": None,  # filled by test
        "is_anonymous": False,
    }


def anon_post_payload(suffix: str = "") -> dict:
    p = post_payload(suffix)
    p["is_anonymous"] = True
    return p


def reply_payload(content: str = "") -> dict:
    return {
        "content": content or f"[{PREFIX}] Test reply. Run ID: {_RUN_ID}.",
    }


def event_payload() -> dict:
    return {
        "title": f"[{PREFIX}] Test Event {_RUN_ID}",
        "description": "Automated test event — safe to delete.",
        "date": "2027-12-15",
        "time": "10:00",
        "location": "Test Location, Sydney NSW",
        "suburb": "Sydney",
        "state": "NSW",
        "max_attendees": 20,
        "is_online": False,
    }


def listing_payload(listing_type: str = "give_away") -> dict:
    base = {
        "title": f"[{PREFIX}] Test Listing {_RUN_ID}",
        "description": "Automated test listing — safe to delete.",
        "listing_type": listing_type,
        "category": "toys",
        "age_group": "1–2 years",
        "suburb": "Sydney",
        "postcode": "2000",
        "state": "NSW",
        "latitude": -33.8688,
        "longitude": 151.2093,
        "postage_available": False,
        "images": [],
    }
    if listing_type == "sell":
        base["price"] = 10.00
        base["condition"] = "good"
    elif listing_type == "swap":
        base["swap_for"] = "Baby books or puzzles"
        base["condition"] = "good"
    elif listing_type == "give_away":
        base["condition"] = "good"
    return base


def donation_group_payload() -> dict:
    return {
        "name": f"[{PREFIX}] Test Donation Group {_RUN_ID}",
        "description": "Automated test donation group — safe to delete. Created by test suite.",
        "suburb": "Sydney",
        "end_date": "2027-12-31",
    }


def message_payload(content: str = "") -> dict:
    return {
        "content": content or f"[{PREFIX}] Test message. Run ID: {_RUN_ID}.",
    }


def stall_message_payload(listing_id: str, receiver_id: str, content: str = "") -> dict:
    return {
        "listing_id": listing_id,
        "receiver_id": receiver_id,
        "content": content or f"[{PREFIX}] Test enquiry. Run ID: {_RUN_ID}.",
    }


# Test user definitions — stable across runs
TEST_USERS = {
    "free": {
        "email": ta_email("free_parent"),
        "first_name": "Free",
        "last_name": "Parent",
        "password": os.environ.get("TEST_USER_PASSWORD", "TestVillage2024!"),
        "role": "free",
        "nickname": f"{PREFIX}_free_parent",
    },
    "premium": {
        "email": ta_email("premium_parent"),
        "first_name": "Premium",
        "last_name": "Parent",
        "password": os.environ.get("TEST_USER_PASSWORD", "TestVillage2024!"),
        "role": "premium",
        "nickname": f"{PREFIX}_premium_parent",
    },
    "professional": {
        "email": ta_email("professional"),
        "first_name": "Professional",
        "last_name": "Tester",
        "password": os.environ.get("TEST_USER_PASSWORD", "TestVillage2024!"),
        "role": "free",
        "nickname": f"{PREFIX}_professional",
    },
    "moderator": {
        "email": ta_email("moderator"),
        "first_name": "Mod",
        "last_name": "Tester",
        "password": os.environ.get("TEST_USER_PASSWORD", "TestVillage2024!"),
        "role": "moderator",
        "nickname": f"{PREFIX}_moderator",
    },
}
