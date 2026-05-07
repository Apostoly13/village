"""
Reusable API client for The Village test suite.
Uses requests.Session so cookies (httpOnly JWT) persist across calls.
"""
import os
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.test"), override=False)

BASE_URL = os.environ.get("DEV_BACKEND_URL", "https://api-dev.ourlittlevillage.com.au/api").rstrip("/")
TIMEOUT = 15  # seconds


class APIClient:
    """Thin wrapper around requests.Session that tracks the logged-in user."""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.current_user: Optional[dict] = None

    # ── Auth ────────────────────────────────────────────────────────────────

    def register(self, email: str, password: str, first_name: str,
                 last_name: str, dob: str = "1990-01-15") -> requests.Response:
        return self.session.post(f"{self.base_url}/auth/register", json={
            "email": email, "password": password,
            "first_name": first_name, "last_name": last_name,
            "date_of_birth": dob,
        }, timeout=TIMEOUT)

    def login(self, email: str, password: str) -> requests.Response:
        r = self.session.post(f"{self.base_url}/auth/login",
                              json={"email": email, "password": password},
                              timeout=TIMEOUT)
        if r.status_code == 200:
            self.current_user = r.json()
        return r

    def logout(self) -> requests.Response:
        r = self.session.post(f"{self.base_url}/auth/logout", timeout=TIMEOUT)
        self.current_user = None
        self.session.cookies.clear()
        return r

    def me(self) -> requests.Response:
        return self.session.get(f"{self.base_url}/auth/me", timeout=TIMEOUT)

    # ── Generic HTTP verbs ───────────────────────────────────────────────────

    def get(self, path: str, **kwargs) -> requests.Response:
        return self.session.get(f"{self.base_url}{path}", timeout=TIMEOUT, **kwargs)

    def post(self, path: str, json=None, **kwargs) -> requests.Response:
        return self.session.post(f"{self.base_url}{path}", json=json, timeout=TIMEOUT, **kwargs)

    def put(self, path: str, json=None, **kwargs) -> requests.Response:
        return self.session.put(f"{self.base_url}{path}", json=json, timeout=TIMEOUT, **kwargs)

    def patch(self, path: str, json=None, **kwargs) -> requests.Response:
        return self.session.patch(f"{self.base_url}{path}", json=json, timeout=TIMEOUT, **kwargs)

    def delete(self, path: str, **kwargs) -> requests.Response:
        return self.session.delete(f"{self.base_url}{path}", timeout=TIMEOUT, **kwargs)

    # ── Convenience: assert status ───────────────────────────────────────────

    def assert_ok(self, r: requests.Response, msg: str = "") -> dict:
        assert r.status_code in (200, 201), (
            f"{msg} — expected 200/201, got {r.status_code}: {r.text[:300]}"
        )
        return r.json()

    def assert_status(self, r: requests.Response, status: int, msg: str = "") -> dict:
        assert r.status_code == status, (
            f"{msg} — expected {status}, got {r.status_code}: {r.text[:300]}"
        )
        try:
            return r.json()
        except Exception:
            return {}


def fresh_client(base_url: str = BASE_URL) -> APIClient:
    """Return a new unauthenticated client (new session = new cookies)."""
    return APIClient(base_url)
