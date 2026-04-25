"""
Test user lifecycle: register → login → promote.
All accounts use the TEST_AUTOMATION_ prefix and deterministic emails
so they survive between runs without creating duplicates.
"""
import os
from dotenv import load_dotenv
from .api_client import APIClient, fresh_client, BASE_URL
from .test_data import TEST_USERS

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.test"), override=False)

ADMIN_EMAIL    = os.environ.get("TEST_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "")
TEST_PASSWORD  = os.environ.get("TEST_USER_PASSWORD", "TestVillage2024!")


def ensure_user(client: APIClient, user_def: dict) -> bool:
    """
    Register the user if they don't exist.
    If email is already taken, the account already exists — that's fine.
    Returns True when the user definitely exists.
    """
    r = client.register(
        email=user_def["email"],
        password=user_def["password"],
        first_name=user_def["first_name"],
        last_name=user_def["last_name"],
    )
    if r.status_code in (200, 201):
        return True
    if r.status_code == 400 and "taken" in r.text.lower():
        return True  # Already exists — fine
    if r.status_code == 400 and "already" in r.text.lower():
        return True
    print(f"  [WARN] Could not register {user_def['email']}: {r.status_code} {r.text[:120]}")
    return False


def login_as(user_key: str) -> APIClient:
    """Return an authenticated APIClient for the given test user key."""
    user_def = TEST_USERS[user_key]
    client = fresh_client()
    ensure_user(client, user_def)
    r = client.login(user_def["email"], user_def["password"])
    if r.status_code != 200:
        raise RuntimeError(
            f"Could not login as {user_key} ({user_def['email']}): "
            f"{r.status_code} {r.text[:200]}"
        )
    return client


def admin_client() -> APIClient:
    """Return an authenticated APIClient for the admin account."""
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        raise RuntimeError(
            "TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set in .env.test"
        )
    client = fresh_client()
    r = client.login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if r.status_code != 200:
        raise RuntimeError(
            f"Admin login failed ({ADMIN_EMAIL}): {r.status_code} {r.text[:200]}"
        )
    return client


def setup_all_test_users() -> dict:
    """
    Ensure all TEST_AUTOMATION_ users exist and have correct roles/tiers.
    Returns dict of {key: APIClient}.
    """
    print("\n[SETUP] Preparing test users…")
    admin = admin_client()

    clients = {}
    for key, user_def in TEST_USERS.items():
        # 1. Ensure account exists
        tmp = fresh_client()
        ensure_user(tmp, user_def)

        # 2. Login
        tmp2 = fresh_client()
        r = tmp2.login(user_def["email"], user_def["password"])
        if r.status_code != 200:
            print(f"  [WARN] Could not login {key}: {r.status_code}")
            continue

        user_id = r.json().get("user_id")
        if not user_id:
            print(f"  [WARN] No user_id returned for {key}")
            continue

        # 3. Set nickname if not set
        me = tmp2.me().json()
        if not me.get("nickname"):
            tmp2.put("/users/me", json={"nickname": user_def["nickname"]})

        # 4. Grant premium if needed
        if user_def["role"] == "premium":
            admin.post(f"/admin/users/{user_id}/subscription", json={"tier": "premium"})
            print(f"  [OK] Granted premium to {key}")

        # 5. Grant moderator if needed
        if user_def["role"] == "moderator":
            admin.post(f"/admin/users/{user_id}/role", json={"role": "moderator"})
            print(f"  [OK] Granted moderator to {key}")

        clients[key] = tmp2
        print(f"  [OK] {key} ({user_def['email']}) ready")

    return clients


def get_first_category(client: APIClient) -> str:
    """Return the first available forum category_id."""
    r = client.get("/forums/categories")
    cats = r.json() if r.status_code == 200 else []
    if not cats:
        raise RuntimeError("No forum categories found")
    return cats[0]["category_id"]
