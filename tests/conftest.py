"""
pytest fixtures — session-scoped clients so we only log in once per test run.
"""
import os
import pytest
from dotenv import load_dotenv

# Load .env.test before anything else
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.test"), override=False)

from tests.utils.api_client import fresh_client, BASE_URL
from tests.utils.test_users import (
    login_as, admin_client, ensure_user, setup_all_test_users, get_first_category
)
from tests.utils.test_data import TEST_USERS


def pytest_configure(config):
    print(f"\n[CONFIG] Target backend: {BASE_URL}")


# ── Session-scoped clients (login once, reuse across all tests) ──────────────

@pytest.fixture(scope="session")
def admin():
    return admin_client()


@pytest.fixture(scope="session")
def free_client():
    return login_as("free")


@pytest.fixture(scope="session")
def premium_client():
    return login_as("premium")


@pytest.fixture(scope="session")
def mod_client():
    return login_as("moderator")


@pytest.fixture(scope="session")
def anon_client():
    """Unauthenticated client — no cookies."""
    return fresh_client()


# ── First available forum category ───────────────────────────────────────────

@pytest.fixture(scope="session")
def category_id(free_client):
    return get_first_category(free_client)


# ── Setup marker — run setup once before entire suite ────────────────────────

@pytest.fixture(scope="session", autouse=True)
def setup_test_users(admin):
    """Ensure all TEST_AUTOMATION_ users exist with correct roles before any test runs."""
    setup_all_test_users()
    yield
