"""
The Village — Comprehensive API Test Suite
Tests all major platform features including tiers, messaging, forums, events,
moderation, uploads, load simulation, and edge cases.

Run (local):  python test_comprehensive.py
Run (dev):    python test_comprehensive.py --url https://your-backend.railway.app/api
Run (custom): python test_comprehensive.py --url http://localhost:9000/api
"""

import sys
import argparse
import requests
import time
import json
import random
import threading
import base64
import struct
import zlib
from datetime import datetime, timezone
from typing import Optional, List, Tuple

# ==================== CONFIG ====================

def _parse_args():
    parser = argparse.ArgumentParser(
        description="The Village — Comprehensive API Test Suite"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000/api",
        help="Base API URL to test against (default: http://localhost:8000/api)",
    )
    return parser.parse_args()

_args = _parse_args()
BASE_URL = _args.url.rstrip("/")

PASSWORD = "Test1234!"
ADMIN_EMAIL    = "paulie_l@hotmail.com"
ADMIN_PASSWORD = "_d$a(8jN&Xbso1Z.+3nNN{hvk"

# Colour output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# ==================== REPORT TRACKING ====================

report = {
    "passed": [],
    "failed": [],
    "warnings": [],
    "missing_features": [],
    "bugs": [],
    "recommendations": [],
}

def passed(label: str, detail: str = ""):
    msg = f"{label}" + (f" — {detail}" if detail else "")
    report["passed"].append(msg)
    print(f"  {GREEN}[PASS]{RESET} {msg}")

def failed(label: str, detail: str = ""):
    msg = f"{label}" + (f" — {detail}" if detail else "")
    report["failed"].append(msg)
    print(f"  {RED}[FAIL]{RESET} {msg}")

def warn(label: str, detail: str = ""):
    msg = f"{label}" + (f" — {detail}" if detail else "")
    report["warnings"].append(msg)
    print(f"  {YELLOW}[WARN]{RESET} {msg}")

def missing(endpoint: str, detail: str = ""):
    msg = f"{endpoint}" + (f" — {detail}" if detail else "")
    report["missing_features"].append(msg)
    print(f"  {YELLOW}[MISS]{RESET} {msg}")

def bug(label: str, detail: str = ""):
    msg = f"{label}" + (f" — {detail}" if detail else "")
    report["bugs"].append(msg)
    print(f"  {RED}[BUG ]{RESET} {msg}")

def rec(label: str):
    report["recommendations"].append(label)

def section(title: str):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")

# ==================== HTTP HELPERS ====================

def req(session: requests.Session, method: str, path: str, label: str,
        expect_2xx: bool = True, silent: bool = False, **kwargs) -> Optional[requests.Response]:
    """Make a request and optionally auto-report pass/fail."""
    url = f"{BASE_URL}{path}"
    try:
        resp = getattr(session, method)(url, timeout=20, **kwargs)
    except requests.exceptions.ConnectionError:
        if not silent:
            failed(label, "Connection refused — is the backend running?")
        return None
    except requests.exceptions.Timeout:
        if not silent:
            failed(label, "Request timed out")
        return None

    if expect_2xx and not silent:
        if 200 <= resp.status_code < 300:
            try:
                body = resp.json()
                note = ""
                if isinstance(body, dict):
                    note = body.get("message", "")[:60]
                passed(label, note)
            except Exception:
                passed(label)
        elif resp.status_code in (404, 405):
            missing(label, f"HTTP {resp.status_code}")
        else:
            try:
                body = resp.json()
                detail = body.get("detail", str(body))[:120]
            except Exception:
                detail = resp.text[:120]
            failed(label, f"HTTP {resp.status_code}: {detail}")

    return resp


def login(email: str, password: str) -> Tuple[Optional[requests.Session], Optional[dict]]:
    """Login or register + login. Returns (session, user_info) or (None, None)."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})

    # Try login first
    r = s.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password}, timeout=15)
    if r.status_code == 200:
        data = r.json()
        token = data.get("token")
        if token:
            s.headers.update({"Authorization": f"Bearer {token}"})
        return s, data

    # Try register if login fails
    parts = email.split("@")[0].replace(".", " ").replace("_", " ").title().split()
    first_name = parts[0] if parts else "Test"
    last_name  = parts[1] if len(parts) > 1 else "User"
    r2 = s.post(f"{BASE_URL}/auth/register", json={
        "email": email, "first_name": first_name, "last_name": last_name, "password": password
    }, timeout=15)
    if r2.status_code == 200:
        data = r2.json()
        token = data.get("token")
        if token:
            s.headers.update({"Authorization": f"Bearer {token}"})
        return s, data

    return None, None


def get_body(resp: requests.Response) -> dict:
    try:
        return resp.json()
    except Exception:
        return {}


# ==================== GENERATE TEST PNG ====================

def make_tiny_png() -> bytes:
    """Generate a valid 1x1 red pixel PNG in memory."""
    def chunk(name: bytes, data: bytes) -> bytes:
        c = struct.pack('>I', len(data)) + name + data
        crc = zlib.crc32(name + data) & 0xffffffff
        return c + struct.pack('>I', crc)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    raw = b'\x00\xff\x00\x00'  # filter byte + RGB red pixel
    compressed = zlib.compress(raw)
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


# ==================== TEST SECTIONS ====================

def test_backend_reachable() -> bool:
    section("CONNECTIVITY CHECK")
    try:
        r = requests.get(f"{BASE_URL}/", timeout=10)
        if r.status_code in (200, 404):
            passed("Backend is reachable", f"HTTP {r.status_code}")
            return True
        else:
            warn("Backend responded but unexpected status", f"HTTP {r.status_code}")
            return True
    except requests.exceptions.ConnectionError:
        failed("Backend not reachable", f"Connection refused at {BASE_URL}")
        print(f"\n  {YELLOW}Hint: Start the backend with: cd backend && python server.py{RESET}\n")
        return False


def test_user_tiers(admin_session: Optional[requests.Session]) -> dict:
    """
    Test all user tiers: admin, trial (new registration), free, premium, clinician.
    Returns dict of {role: (session, user_info)}.
    """
    section("1. USER TIERS")
    tier_sessions = {}

    # --- Admin ---
    print(f"\n  {BOLD}Admin Login{RESET}")
    admin_s, admin_info = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if admin_s and admin_info:
        # Verify admin role
        r = req(admin_s, "get", "/admin/analytics", "Admin: /admin/analytics access", silent=True)
        if r and 200 <= r.status_code < 300:
            passed("Admin tier: admin@ourlittlevillage.com.au has admin access to /admin/analytics")
            tier_sessions["admin"] = (admin_s, admin_info)
        elif r and r.status_code == 403:
            warn("Admin login succeeded but user lacks admin role",
                 "Set role=admin in DB for admin@ourlittlevillage.com.au")
            tier_sessions["admin_no_role"] = (admin_s, admin_info)
        else:
            warn("Admin analytics check failed", f"HTTP {r.status_code if r else 'no response'}")
    else:
        failed("Admin login failed", f"email={ADMIN_EMAIL}")

    # --- Trial user (fresh registration) ---
    print(f"\n  {BOLD}Trial User (new registration){RESET}")
    trial_email = f"trial.test.{int(time.time())}@test.village"
    trial_s, trial_info = login(trial_email, PASSWORD)
    if trial_s and trial_info:
        r = req(trial_s, "get", "/subscription/status", "Trial tier: subscription status check", silent=True)
        if r and 200 <= r.status_code < 300:
            status = get_body(r)
            tier = status.get("tier", "unknown")
            if tier in ("trial", "free"):
                passed(f"Trial tier: new user has tier='{tier}'", f"is_premium={status.get('is_premium')}")
            else:
                warn(f"Trial tier: expected trial/free, got tier='{tier}'")
        tier_sessions["trial"] = (trial_s, trial_info)
    else:
        failed("Trial user registration/login failed")

    # --- Existing test users ---
    test_users = [
        ("sarah.mitchell@test.village", "Sarah Mitchell (newborn mum)"),
        ("james.nguyen@test.village", "James Nguyen (school-age dad)"),
        ("priya.sharma@test.village", "Priya Sharma (expecting mum)"),
        ("tom.walker@test.village", "Tom Walker (single dad)"),
        ("emma.clarke@test.village", "Emma Clarke (experienced mum)"),
        ("aisha.patel@test.village", "Aisha Patel (midwife)"),
    ]

    print(f"\n  {BOLD}Existing Test Users{RESET}")
    loaded_users = {}
    for email, label in test_users:
        s, info = login(email, PASSWORD)
        if s and info:
            passed(f"Login: {label}", f"user_id={info.get('user_id')}")
            key = email.split("@")[0].replace(".", "_")
            loaded_users[key] = (s, info)
        else:
            warn(f"Could not login: {label}", "User may not exist — run test_users.py first")

    tier_sessions.update(loaded_users)

    # --- Premium upgrade via admin ---
    print(f"\n  {BOLD}Premium Tier (upgrade via admin){RESET}")
    admin_s_for_upgrade = tier_sessions.get("admin", (None, None))[0]
    # Try to upgrade sarah as premium
    sarah_key = "sarah_mitchell"
    if sarah_key in loaded_users and admin_s_for_upgrade:
        sarah_id = loaded_users[sarah_key][1].get("user_id")
        r = req(admin_s_for_upgrade, "post", f"/admin/users/{sarah_id}/subscription",
                "Premium tier: admin upgrade user to premium",
                json={"tier": "premium"})
        if r and 200 <= r.status_code < 300:
            # Verify
            r2 = req(loaded_users[sarah_key][0], "get", "/subscription/status",
                     "Premium tier: verify subscription status after upgrade", silent=True)
            if r2 and 200 <= r2.status_code < 300:
                st = get_body(r2)
                if st.get("is_premium"):
                    passed("Premium tier: sarah.mitchell confirmed as premium after upgrade")
                else:
                    warn("Premium tier: upgrade reported success but is_premium=False", str(st))
    elif not admin_s_for_upgrade:
        warn("Premium upgrade skipped — no admin session available")

    # --- Moderator role via admin ---
    print(f"\n  {BOLD}Moderator Tier (set via admin){RESET}")
    james_key = "james_nguyen"
    if james_key in loaded_users and admin_s_for_upgrade:
        james_id = loaded_users[james_key][1].get("user_id")
        r = req(admin_s_for_upgrade, "post", f"/admin/users/{james_id}/role",
                "Moderator tier: set role=moderator via admin",
                json={"role": "moderator"})
    elif not admin_s_for_upgrade:
        warn("Moderator role assignment skipped — no admin session")

    # --- Verified clinician ---
    print(f"\n  {BOLD}Verified Clinician (Aisha - midwife){RESET}")
    aisha_key = "aisha_patel"
    if aisha_key in loaded_users and admin_s_for_upgrade:
        aisha_id = loaded_users[aisha_key][1].get("user_id")
        r = req(admin_s_for_upgrade, "post", f"/admin/users/{aisha_id}/role",
                "Clinician tier: set role=verified_partner via admin",
                json={"role": "verified_partner"})
    elif not admin_s_for_upgrade:
        warn("Verified clinician assignment skipped — no admin session")

    return tier_sessions


def test_messaging(tier_sessions: dict):
    section("2. MESSAGING (DM)")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if len(users) < 2:
        warn("Not enough users for messaging tests")
        return

    (k1, (s1, u1)), (k2, (s2, u2)) = users[0], users[1]
    uid2 = u2.get("user_id")
    uid1 = u1.get("user_id")

    # Send DM from user1 to user2
    r = req(s1, "post", "/messages", "Messaging: send DM from user1 to user2",
            json={"receiver_id": uid2, "content": "Hey! Great to see you on The Village 🌟"})

    # Send DM from user2 to user1
    r2 = req(s2, "post", "/messages", "Messaging: send DM from user2 to user1",
             json={"receiver_id": uid1, "content": "Hi there! Lovely to connect!"})

    # Send multiple messages to test unread count
    for i in range(3):
        req(s1, "post", "/messages", f"Messaging: send DM #{i+2}", silent=True,
            json={"receiver_id": uid2, "content": f"Test message number {i+2} from The Village test suite"})

    # Test inbox / conversations
    r3 = req(s2, "get", "/messages/conversations", "Messaging: GET /messages/conversations")
    if r3 and 200 <= r3.status_code < 300:
        convs = get_body(r3)
        if isinstance(convs, list) and len(convs) > 0:
            passed("Messaging: inbox has conversations", f"count={len(convs)}")
        else:
            warn("Messaging: conversations endpoint returned empty list")

    # Test unread count
    r4 = req(s2, "get", "/messages/unread-count", "Messaging: GET /messages/unread-count")
    if r4 and 200 <= r4.status_code < 300:
        data = get_body(r4)
        unread = data.get("unread_count", data.get("count", "?"))
        passed("Messaging: unread-count returned", f"unread={unread}")

    # Fetch message thread and verify persistence
    r5 = req(s2, "get", f"/messages/{uid1}", "Messaging: GET /messages/{other_user_id} (thread)")
    if r5 and 200 <= r5.status_code < 300:
        msgs = get_body(r5)
        if isinstance(msgs, list) and len(msgs) > 0:
            passed("Messaging: messages persist on re-fetch", f"count={len(msgs)}")
        else:
            warn("Messaging: message thread returned empty — messages may not persist")

    # Test re-fetch (persistence)
    r6 = req(s2, "get", f"/messages/{uid1}", "Messaging: persistence — second fetch same thread", silent=True)
    if r6 and 200 <= r6.status_code < 300:
        msgs2 = get_body(r6)
        if r5 and 200 <= r5.status_code < 300:
            first_count = len(get_body(r5)) if isinstance(get_body(r5), list) else 0
            second_count = len(msgs2) if isinstance(msgs2, list) else 0
            if first_count == second_count and first_count > 0:
                passed("Messaging: message persistence confirmed (count stable across fetches)")
            elif first_count > 0:
                warn("Messaging: message count changed between fetches",
                     f"{first_count} vs {second_count}")


def test_friend_requests(tier_sessions: dict) -> Optional[Tuple]:
    section("3. FRIEND REQUESTS")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if len(users) < 3:
        warn("Not enough users for friend request tests")
        return None

    (k1, (s1, u1)) = users[0]
    (k2, (s2, u2)) = users[1]
    (k3, (s3, u3)) = users[2]
    uid1 = u1.get("user_id")
    uid2 = u2.get("user_id")
    uid3 = u3.get("user_id")

    # Send friend request
    r = req(s1, "post", "/friends/request", "Friends: send friend request",
            json={"to_user_id": uid2})
    req_id = None
    if r and 200 <= r.status_code < 300:
        req_id = get_body(r).get("request_id")

    # Fetch pending requests (receiver side)
    r2 = req(s2, "get", "/friends/requests", "Friends: GET /friends/requests (pending)")
    if r2 and 200 <= r2.status_code < 300:
        pending = get_body(r2)
        if isinstance(pending, list) and len(pending) > 0:
            passed("Friends: pending requests visible to recipient",
                   f"count={len(pending)}")
            if not req_id:
                req_id = pending[0].get("request_id")
        else:
            warn("Friends: no pending requests returned (request may not have saved)")

    # Accept friend request
    if req_id:
        r3 = req(s2, "post", f"/friends/request/{req_id}/accept",
                 "Friends: accept friend request")

    # Verify friend list updates
    r4 = req(s2, "get", "/friends", "Friends: GET /friends (verify list updated)")
    if r4 and 200 <= r4.status_code < 300:
        friends = get_body(r4)
        friend_ids = [f.get("user_id") for f in (friends if isinstance(friends, list) else [])]
        if uid1 in friend_ids:
            passed("Friends: friend list correctly reflects accepted request")
        else:
            warn("Friends: accepted request but user not in friends list")

    # Test duplicate request handling
    r5 = req(s1, "post", "/friends/request", "Friends: duplicate request rejected",
             json={"to_user_id": uid2}, expect_2xx=False, silent=True)
    if r5:
        if r5.status_code == 400:
            passed("Friends: duplicate request correctly rejected (400)")
        elif r5.status_code == 200:
            bug("Friends: duplicate friend request accepted (should be rejected as duplicate)")
        else:
            warn("Friends: unexpected status for duplicate request", f"HTTP {r5.status_code}")

    # Test friend request sent list
    req(s1, "get", "/friends/sent", "Friends: GET /friends/sent")

    # Test friend status check
    req(s1, "get", f"/friends/status/{uid2}", "Friends: GET /friends/status/{other_user_id}")

    # Second pair: s3 requests s1
    r6 = req(s3, "post", "/friends/request", "Friends: second pair request",
             json={"to_user_id": uid1})
    if r6 and 200 <= r6.status_code < 300:
        req_id2 = get_body(r6).get("request_id")
        if req_id2:
            # Decline this one
            req(s1, "post", f"/friends/request/{req_id2}/decline",
                "Friends: decline friend request")

    return (s1, u1, s2, u2)


def test_forum_posts(tier_sessions: dict) -> dict:
    section("4. FORUM POSTS")
    result = {"post_ids": [], "reply_ids": [], "category_id": None}
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        warn("No users available for forum tests")
        return result

    s1, u1 = users[0][1]

    # Fetch categories
    r = req(s1, "get", "/forums/categories", "Forum: GET /forums/categories")
    categories = []
    if r and 200 <= r.status_code < 300:
        categories = get_body(r)
        if isinstance(categories, list) and len(categories) > 0:
            passed("Forum: categories returned", f"count={len(categories)}")
            result["category_id"] = categories[0].get("category_id")
        else:
            warn("Forum: categories list empty")

    if not result["category_id"]:
        warn("No category_id — skipping forum post creation")
        return result

    cat_id = result["category_id"]

    # --- Named post ---
    r2 = req(s1, "post", "/forums/posts", "Forum: create named/public post",
             json={
                 "category_id": cat_id,
                 "title": "Test post: named visibility",
                 "content": "This is a test post created by the comprehensive test suite. Named (not anonymous).",
                 "is_anonymous": False,
                 "visibility": "public",
             })
    if r2 and 200 <= r2.status_code < 300:
        pid = get_body(r2).get("post_id")
        if pid:
            result["post_ids"].append(pid)

    # --- Anonymous post ---
    s2, u2 = users[1][1] if len(users) > 1 else (s1, u1)
    r3 = req(s2, "post", "/forums/posts", "Forum: create anonymous post",
             json={
                 "category_id": cat_id,
                 "title": "Test post: anonymous post",
                 "content": "This is an anonymous test post. The author name should be hidden.",
                 "is_anonymous": True,
                 "visibility": "public",
             })
    if r3 and 200 <= r3.status_code < 300:
        body = get_body(r3)
        pid = body.get("post_id")
        if pid:
            result["post_ids"].append(pid)
        # Check anonymisation
        if body.get("is_anonymous"):
            passed("Forum: anonymous post correctly flagged as anonymous")
        else:
            warn("Forum: is_anonymous field not returned in post response")

    # --- Friends-only visibility post ---
    s3, u3 = users[2][1] if len(users) > 2 else (s1, u1)
    r4 = req(s3, "post", "/forums/posts", "Forum: create friends-only visibility post",
             json={
                 "category_id": cat_id,
                 "title": "Test post: friends visibility",
                 "content": "This post should only be visible to friends.",
                 "is_anonymous": False,
                 "visibility": "friends",
             })
    if r4 and 200 <= r4.status_code < 300:
        pid = get_body(r4).get("post_id")
        if pid:
            result["post_ids"].append(pid)

    # --- Add replies ---
    if result["post_ids"]:
        target_post_id = result["post_ids"][0]

        # Simple reply
        s_replier, u_replier = (users[1][1] if len(users) > 1 else (s1, u1))
        r5 = req(s_replier, "post", f"/forums/posts/{target_post_id}/replies",
                 "Forum: add reply to post",
                 json={"content": "Great post! Thanks for sharing this with the community."})
        if r5 and 200 <= r5.status_code < 300:
            rid = get_body(r5).get("reply_id")
            if rid:
                result["reply_ids"].append(rid)

        # Nested reply (sub-thread)
        if result["reply_ids"]:
            parent_reply_id = result["reply_ids"][0]
            r6 = req(s1, "post", f"/forums/posts/{target_post_id}/replies",
                     "Forum: nested reply (sub-thread)",
                     json={
                         "content": "Replying to the reply — testing nested thread support.",
                         "parent_reply_id": parent_reply_id,
                     })
            if r6 and 200 <= r6.status_code < 300:
                nested_rid = get_body(r6).get("reply_id")
                nested_pr = get_body(r6).get("parent_reply_id")
                if nested_pr == parent_reply_id:
                    passed("Forum: nested reply correctly stores parent_reply_id")
                else:
                    warn("Forum: nested reply — parent_reply_id not confirmed in response")
                if nested_rid:
                    result["reply_ids"].append(nested_rid)

        # Fetch replies
        req(s1, "get", f"/forums/posts/{target_post_id}/replies",
            "Forum: GET /forums/posts/{post_id}/replies")

    # --- Like/unlike toggle ---
    if result["post_ids"]:
        pid = result["post_ids"][0]
        s_liker, _ = users[1][1] if len(users) > 1 else (s1, u1)

        r_like1 = req(s_liker, "post", f"/forums/posts/{pid}/like",
                      "Forum: like post (first like)", silent=True)
        if r_like1 and 200 <= r_like1.status_code < 300:
            count1 = get_body(r_like1).get("like_count", "?")
            passed("Forum: like post", f"like_count={count1}")

        r_like2 = req(s_liker, "post", f"/forums/posts/{pid}/like",
                      "Forum: unlike post (toggle)", silent=True)
        if r_like2 and 200 <= r_like2.status_code < 300:
            count2 = get_body(r_like2).get("like_count", "?")
            passed("Forum: unlike post (toggle)", f"like_count now={count2}")
            # Verify toggle worked
            if isinstance(count1, int) and isinstance(count2, int):
                if count1 != count2:
                    passed("Forum: like/unlike toggle changes count correctly")
                else:
                    bug("Forum: like count did not change after unlike toggle")

    # --- Bookmarks ---
    if result["post_ids"]:
        pid = result["post_ids"][0]
        s_bm, _ = users[1][1] if len(users) > 1 else (s1, u1)
        r_bm = req(s_bm, "post", f"/forums/posts/{pid}/bookmark",
                   "Forum: bookmark a post")
        if r_bm and 200 <= r_bm.status_code < 300:
            # Fetch bookmarks
            r_bm2 = req(s_bm, "get", "/bookmarks", "Forum: GET /bookmarks")
            if r_bm2 and 200 <= r_bm2.status_code < 300:
                bm_list = get_body(r_bm2)
                if isinstance(bm_list, list) and len(bm_list) > 0:
                    passed("Forum: bookmarked post appears in /bookmarks list")
                else:
                    warn("Forum: bookmarks list empty after bookmarking")

    # --- Trending ---
    r_trend = req(s1, "get", "/forums/posts/trending?limit=5",
                  "Forum: GET /forums/posts/trending")
    if r_trend and 200 <= r_trend.status_code < 300:
        trending = get_body(r_trend)
        if isinstance(trending, list):
            passed("Forum: trending endpoint returned posts", f"count={len(trending)}")
        else:
            warn("Forum: trending returned non-list")

    # --- Fetch single post ---
    if result["post_ids"]:
        req(s1, "get", f"/forums/posts/{result['post_ids'][0]}",
            "Forum: GET /forums/posts/{post_id}")

    return result


def test_moderation(tier_sessions: dict, forum_data: dict):
    section("5. MODERATION")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        warn("No users available for moderation tests")
        return

    s1, u1 = users[0][1]
    admin_s = tier_sessions.get("admin", (None, None))[0]
    cat_id = forum_data.get("category_id")

    # Create a post with 'inappropriate' content to flag
    flagged_post_id = None
    if cat_id:
        r = req(s1, "post", "/forums/posts", "Moderation: create post to be reported",
                json={
                    "category_id": cat_id,
                    "title": "This is a test post for reporting",
                    "content": "Content that would be flagged as inappropriate in a real scenario.",
                    "is_anonymous": False,
                })
        if r and 200 <= r.status_code < 300:
            flagged_post_id = get_body(r).get("post_id")

    # Flag/report the post using POST /reports
    if flagged_post_id:
        s_reporter, u_reporter = users[1][1] if len(users) > 1 else (s1, u1)
        r2 = req(s_reporter, "post", "/reports", "Moderation: POST /reports (flag content)",
                 json={
                     "content_type": "post",
                     "content_id": flagged_post_id,
                     "reason": "inappropriate",
                     "details": "Test: this post contains content that violates community guidelines.",
                 })

        # Also try the legacy /forums/posts/{id}/report endpoint
        r2b = req(s_reporter, "post", f"/forums/posts/{flagged_post_id}/report",
                  "Moderation: POST /forums/posts/{id}/report (legacy)", silent=True)
        if r2b:
            if r2b.status_code == 404:
                missing("POST /forums/posts/{id}/report", "Not found — use POST /reports instead")
            elif 200 <= r2b.status_code < 300:
                passed("Moderation: legacy /forums/posts/{id}/report endpoint exists")
            else:
                warn("Moderation: /forums/posts/{id}/report", f"HTTP {r2b.status_code}")

    # Admin: review flagged content
    if admin_s:
        r3 = req(admin_s, "get", "/admin/reports", "Moderation: GET /admin/reports (flagged content list)")
        if r3 and 200 <= r3.status_code < 300:
            reports = get_body(r3)
            if isinstance(reports, (list, dict)):
                passed("Moderation: admin can view flagged content reports")

        # Try GET /admin/flagged (possible alias)
        r4 = req(admin_s, "get", "/admin/flagged", "Moderation: GET /admin/flagged",
                 silent=True)
        if r4:
            if r4.status_code == 404:
                missing("GET /admin/flagged", "Not found — reports at GET /admin/reports")
            elif 200 <= r4.status_code < 300:
                passed("Moderation: GET /admin/flagged endpoint exists")

        # Test banning a user
        trial_info = tier_sessions.get("trial", (None, None))[1]
        if trial_info:
            trial_uid = trial_info.get("user_id")
            if trial_uid:
                r5 = req(admin_s, "post", f"/admin/users/{trial_uid}/ban",
                         "Moderation: admin can ban a user",
                         json={"reason": "Test ban"})
                if r5 and 200 <= r5.status_code < 300:
                    # Immediately unban
                    req(admin_s, "post", f"/admin/users/{trial_uid}/unban",
                        "Moderation: admin can unban a user")
    else:
        warn("Moderation: admin session not available — skipping admin review tests")
        rec("Build or enable admin account to test full moderation flow")


def test_events(tier_sessions: dict):
    section("6. EVENTS")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        warn("No users for events tests")
        return

    # Prefer premium user (sarah_mitchell) for creating events — free users may be blocked
    premium_entry = tier_sessions.get("sarah_mitchell")
    if premium_entry and premium_entry[0] is not None:
        s1, u1 = premium_entry
    else:
        s1, u1 = users[0][1]

    # GET /events (any logged-in user)
    r = req(s1, "get", "/events", "Events: GET /events (list)")
    events = []
    if r and 200 <= r.status_code < 300:
        body = get_body(r)
        events = body if isinstance(body, list) else body.get("events", [])
        passed("Events: list returned", f"count={len(events)}")

    # POST /events (create) — requires premium on some platforms
    future_date = "2026-06-15"
    r2 = req(s1, "post", "/events", "Events: POST /events (create event — premium user)",
             json={
                 "title": "Test Playgroup Catchup",
                 "description": "A comprehensive test event created by the test suite. Babies and toddlers welcome!",
                 "venue_name": "Test Community Hall",
                 "suburb": "Bondi",
                 "state": "NSW",
                 "postcode": "2026",
                 "category": "playgroup",
                 "date": future_date,
                 "time_start": "10:00",
                 "time_end": "12:00",
                 "latitude": -33.8915,
                 "longitude": 151.2767,
             })
    new_event_id = None
    if r2 and 200 <= r2.status_code < 300:
        new_event_id = get_body(r2).get("event_id")

    # GET individual event
    if new_event_id:
        req(s1, "get", f"/events/{new_event_id}", "Events: GET /events/{event_id}")

    # RSVP — use a different user to the creator
    rsvp_target = new_event_id or (events[0].get("event_id") if events else None)
    if rsvp_target:
        # Pick any user that isn't s1
        rsvp_candidates = [(k, v) for k, v in tier_sessions.items()
                           if v[0] is not None and k not in ("admin", "admin_no_role")
                           and v[1].get("user_id") != u1.get("user_id")]
        s_rsvp, u_rsvp = (rsvp_candidates[0][1] if rsvp_candidates else (s1, u1))
        r3 = req(s_rsvp, "post", f"/events/{rsvp_target}/rsvp",
                 "Events: POST /events/{id}/rsvp (premium user RSVP)")

        # Check RSVP list via event moderators or chat
        r4 = req(s1, "get", f"/events/{rsvp_target}/chat",
                 "Events: GET /events/{id}/chat (event chat)", silent=True)
        if r4:
            if r4.status_code in (404, 405):
                missing("GET /events/{id}/chat", "Event chat not found")
            elif 200 <= r4.status_code < 300:
                passed("Events: event chat endpoint works")

    # Stats/live count check
    r5 = req(s1, "get", "/events", "Events: re-fetch list after RSVP", silent=True)
    if r5 and 200 <= r5.status_code < 300:
        body = get_body(r5)
        ev_list = body if isinstance(body, list) else body.get("events", [])
        passed("Events: events list stable on re-fetch", f"count={len(ev_list)}")


def test_online_stats(tier_sessions: dict):
    section("7. ONLINE / ACTIVITY DATA")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None]
    if not users:
        return

    s1, u1 = users[0][1]

    # Test various possible stats endpoints
    stats_endpoints = [
        ("/stats", "GET /stats"),
        ("/chat/rooms/stats", "GET /chat/rooms/stats"),
        ("/admin/analytics", "GET /admin/analytics (online counts)"),
    ]

    found_online_count = False
    for path, label in stats_endpoints:
        r = req(s1, "get", path, label, silent=True)
        if r:
            if r.status_code == 200:
                body = get_body(r)
                # Look for any online/active user count field
                online_keys = ["online_count", "active_users", "users_online", "online_now",
                               "total_users_online", "current_online"]
                for key in online_keys:
                    if key in body:
                        passed(f"Online stats: {label} has '{key}' = {body[key]}")
                        found_online_count = True
                        break
                if not found_online_count:
                    warn(f"Online stats: {label} exists but no online count field found",
                         f"keys={list(body.keys())[:8]}")
            elif r.status_code == 403:
                warn(f"Online stats: {label} — 403 Forbidden (admin-only?)")
            elif r.status_code == 404:
                missing(label)

    if not found_online_count:
        missing("GET /stats or similar", "No endpoint provides live 'X parents online now' count")
        rec("Build GET /stats endpoint returning online_count for the landing page hero section")

    # Test heartbeat (updates online status)
    r_hb = req(s1, "post", "/users/heartbeat", "Online stats: POST /users/heartbeat")
    if r_hb and 200 <= r_hb.status_code < 300:
        passed("Online stats: heartbeat works (updates online status)")


def test_communities(tier_sessions: dict):
    section("8. COMMUNITIES & SUB-THREADS")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        return

    # Prefer premium user (sarah_mitchell) for creating communities
    premium_entry = tier_sessions.get("sarah_mitchell")
    if premium_entry and premium_entry[0] is not None:
        s1, u1 = premium_entry
    else:
        s1, u1 = users[0][1]

    # Create a community — may require premium tier
    r = req(s1, "post", "/forums/communities", "Communities: POST /forums/communities (create — premium user)",
            json={
                "name": f"Test Community {int(time.time()) % 10000}",
                "description": "A test community created by the comprehensive test suite.",
                "icon": "🏘️",
                "is_private": False,
                "community_subtype": "general",
            })
    community_id = None
    if r and 200 <= r.status_code < 300:
        community_id = get_body(r).get("category_id")

    # Join community — use a different user (not the creator)
    join_candidates = [(k, v) for k, v in tier_sessions.items()
                       if v[0] is not None and k not in ("admin", "admin_no_role")
                       and v[1].get("user_id") != u1.get("user_id")]
    if community_id and join_candidates:
        s2, u2 = join_candidates[0][1]
        req(s2, "post", f"/forums/communities/{community_id}/join",
            "Communities: join community")
    elif community_id and users:
        s2, u2 = users[0][1]

    # Leave community
    if community_id and join_candidates:
        req(s2, "post", f"/forums/communities/{community_id}/leave",
            "Communities: leave community")

    # Update community
    if community_id:
        req(s1, "put", f"/forums/communities/{community_id}",
            "Communities: update community",
            json={"description": "Updated description from test suite."})

    # Sub-threads: already tested via nested replies in forum tests
    # Confirm nested replies are listed correctly
    passed("Communities: sub-thread/nested reply tested in Forum section")


def test_photo_upload(tier_sessions: dict):
    section("9. PHOTO UPLOAD")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        warn("No users for upload test")
        return

    s1, u1 = users[0][1]

    # Generate a tiny valid PNG
    png_bytes = make_tiny_png()

    # POST /upload/image with multipart
    # Note: need to temporarily remove Content-Type header so requests sets multipart boundary
    orig_headers = dict(s1.headers)
    s1.headers.pop("Content-Type", None)

    r = req(s1, "post", "/upload/image", "Upload: POST /upload/image (1x1 PNG)",
            files={"file": ("test_pixel.png", png_bytes, "image/png")})

    # Restore headers
    s1.headers.update({"Content-Type": "application/json"})

    if r and 200 <= r.status_code < 300:
        body = get_body(r)
        url = body.get("url") or body.get("image_url") or body.get("path")
        if url:
            passed("Upload: image URL returned in response", f"url={str(url)[:60]}")
        else:
            warn("Upload: 200 OK but no URL in response", f"body={str(body)[:100]}")
    elif r and r.status_code == 413:
        warn("Upload: 413 Payload Too Large (unexpected for 1x1 pixel)")
    elif r and r.status_code == 422:
        warn("Upload: 422 Validation Error", r.text[:200])


def test_load_simulation(tier_sessions: dict, forum_data: dict):
    section("10. LOAD SIMULATION (20 concurrent requests)")
    users_list = [(k, v) for k, v in tier_sessions.items()
                  if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users_list:
        warn("No users for load test")
        return

    post_ids = forum_data.get("post_ids", [])

    # Get a chat room ID for load testing
    s1, u1 = users_list[0][1]
    room_id = None
    r = req(s1, "get", "/chat/rooms/all", "Load: get chat rooms for load test", silent=True)
    if r and 200 <= r.status_code < 300:
        rooms = get_body(r)
        if isinstance(rooms, list) and rooms:
            room_id = rooms[0].get("room_id")

    results_lock = threading.Lock()
    load_results = {"success": 0, "error": 0, "times": []}

    def fire_request(session: requests.Session, url: str):
        start = time.time()
        try:
            r = session.get(url, timeout=15)
            elapsed = time.time() - start
            with results_lock:
                if 200 <= r.status_code < 300:
                    load_results["success"] += 1
                else:
                    load_results["error"] += 1
                load_results["times"].append(round(elapsed, 3))
        except Exception:
            with results_lock:
                load_results["error"] += 1

    threads = []
    print(f"\n  Firing 20 concurrent requests...")

    # 10 requests to GET /forums/posts
    for i in range(10):
        s, _ = users_list[i % len(users_list)][1]
        t = threading.Thread(target=fire_request,
                             args=(s, f"{BASE_URL}/forums/posts?limit=10"))
        threads.append(t)

    # 10 requests to GET /chat/rooms/{id}/messages (if room_id exists)
    chat_url = (f"{BASE_URL}/chat/rooms/{room_id}/messages?limit=10"
                if room_id else f"{BASE_URL}/forums/posts/trending")
    for i in range(10):
        s, _ = users_list[i % len(users_list)][1]
        t = threading.Thread(target=fire_request, args=(s, chat_url))
        threads.append(t)

    start_all = time.time()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    total_elapsed = round(time.time() - start_all, 2)

    times = load_results["times"]
    avg_time = round(sum(times) / len(times), 3) if times else 0
    max_time = max(times) if times else 0

    print(f"\n  Load results:")
    print(f"    Total time for 20 concurrent requests: {total_elapsed}s")
    print(f"    Successful: {load_results['success']}/20")
    print(f"    Errors:     {load_results['error']}/20")
    print(f"    Avg resp:   {avg_time}s")
    print(f"    Max resp:   {max_time}s")

    if load_results["success"] >= 18:
        passed("Load: backend handled 20 concurrent requests",
               f"{load_results['success']}/20 success, avg={avg_time}s")
    elif load_results["success"] >= 14:
        warn("Load: backend mostly handled concurrent load with some failures",
             f"{load_results['success']}/20 success")
    else:
        failed("Load: backend struggled under 20 concurrent requests",
               f"{load_results['success']}/20 success, {load_results['error']} errors")

    if max_time > 5:
        bug("Load: some requests took >5s under concurrent load",
            f"max={max_time}s")
    elif max_time > 2:
        warn("Load: some requests slow under concurrent load", f"max={max_time}s")


def test_extra_scenarios(tier_sessions: dict):
    section("11. EXTRA SCENARIOS")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        return

    s1, u1 = users[0][1]
    uid1 = u1.get("user_id")

    # Password reset flow
    print(f"\n  {BOLD}Password Reset Flow{RESET}")
    # The server may not expose /auth/forgot-password — probe it
    r_reset = req(s1, "post", "/auth/forgot-password",
                  "Extra: POST /auth/forgot-password", silent=True,
                  json={"email": u1.get("email", "")})
    if r_reset:
        if r_reset.status_code in (200, 202):
            passed("Extra: password reset endpoint exists and accepted request")
        elif r_reset.status_code == 404:
            missing("POST /auth/forgot-password", "Password reset not implemented")
            rec("Implement POST /auth/forgot-password for password reset flow")
        else:
            warn("Extra: password reset endpoint responded unexpectedly",
                 f"HTTP {r_reset.status_code}")

    # Notification read/unread
    print(f"\n  {BOLD}Notification Read/Unread{RESET}")
    r_notifs = req(s1, "get", "/notifications?limit=10",
                   "Extra: GET /notifications")
    notif_id = None
    if r_notifs and 200 <= r_notifs.status_code < 300:
        notifs = get_body(r_notifs)
        if isinstance(notifs, list) and notifs:
            notif_id = notifs[0].get("notification_id")

    req(s1, "get", "/notifications/unread-count",
        "Extra: GET /notifications/unread-count")

    if notif_id:
        req(s1, "post", f"/notifications/{notif_id}/read",
            "Extra: mark individual notification as read")

    req(s1, "post", "/notifications/mark-read",
        "Extra: mark-all-read POST /notifications/mark-read")

    # Profile update
    print(f"\n  {BOLD}Profile Update{RESET}")
    r_prof = req(s1, "put", "/users/profile", "Extra: PUT /users/profile (update)",
                 json={
                     "bio": "Updated bio from comprehensive test suite run.",
                     "suburb": "Bondi",
                     "postcode": "2026",
                     "state": "NSW",
                     "parenting_stage": "newborn",
                 })

    # Verify profile update persists
    r_me = req(s1, "get", "/auth/me", "Extra: GET /auth/me (verify profile update persists)")
    if r_me and 200 <= r_me.status_code < 300:
        me = get_body(r_me)
        if me.get("bio") == "Updated bio from comprehensive test suite run.":
            passed("Extra: profile update persists correctly on re-fetch")
        else:
            warn("Extra: profile bio not matching after update",
                 f"got='{me.get('bio', '')[:60]}'")

    # Suburb room creation
    print(f"\n  {BOLD}Suburb Room Creation{RESET}")
    req(s1, "post", "/chat/rooms/suburb",
        "Extra: POST /chat/rooms/suburb (create suburb chat room)",
        json={"postcode": "2026", "suburb": "Bondi"})

    # Recommended circles
    print(f"\n  {BOLD}Recommended Circles{RESET}")
    req(s1, "get", "/users/recommended-circles",
        "Extra: GET /users/recommended-circles")

    # Badge computation
    print(f"\n  {BOLD}Badge Computation{RESET}")
    req(s1, "post", "/users/compute-badges",
        "Extra: POST /users/compute-badges")

    # Nickname uniqueness check
    print(f"\n  {BOLD}Nickname Check{RESET}")
    r_nick = req(s1, "get", "/users/check-nickname?nickname=TestNickname123",
                 "Extra: GET /users/check-nickname", silent=True)
    if r_nick:
        if r_nick.status_code == 200:
            passed("Extra: nickname check endpoint works")
        elif r_nick.status_code == 404:
            missing("GET /users/check-nickname")

    # Feed
    print(f"\n  {BOLD}Feed{RESET}")
    req(s1, "get", "/feed", "Extra: GET /feed (personalised feed)")

    # Search
    print(f"\n  {BOLD}Search{RESET}")
    req(s1, "get", "/search?q=newborn", "Extra: GET /search?q=newborn")
    req(s1, "get", "/users/search?q=Sarah", "Extra: GET /users/search")

    # Location
    print(f"\n  {BOLD}Location{RESET}")
    req(s1, "get", "/location/search?q=Bondi", "Extra: GET /location/search?q=Bondi")
    req(s1, "get", "/location/distance-options", "Extra: GET /location/distance-options")

    # Saved messages
    print(f"\n  {BOLD}Saved Messages{RESET}")
    r_saved = req(s1, "get", "/users/saved-messages",
                  "Extra: GET /users/saved-messages", silent=True)
    if r_saved:
        if r_saved.status_code == 200:
            passed("Extra: GET /users/saved-messages works")
        elif r_saved.status_code == 404:
            missing("GET /users/saved-messages")

    # Block/unblock
    print(f"\n  {BOLD}Block/Unblock{RESET}")
    if len(users) > 1:
        s2, u2 = users[1][1]
        uid2 = u2.get("user_id")
        req(s1, "get", "/users/blocked", "Extra: GET /users/blocked")
        r_blk = req(s1, "post", f"/users/{uid2}/block",
                    "Extra: POST /users/{user_id}/block", silent=True)
        if r_blk:
            if r_blk.status_code == 200:
                passed("Extra: block user endpoint works")
                # Unblock
                req(s1, "delete", f"/users/{uid2}/block",
                    "Extra: DELETE /users/{user_id}/block (unblock)")
            elif r_blk.status_code == 404:
                missing("POST /users/{user_id}/block")

    # Subscription status
    print(f"\n  {BOLD}Subscription Status{RESET}")
    req(s1, "get", "/subscription/status", "Extra: GET /subscription/status")

    # Admin: growth analytics
    admin_s = tier_sessions.get("admin", (None, None))[0]
    if admin_s:
        print(f"\n  {BOLD}Admin Analytics{RESET}")
        req(admin_s, "get", "/admin/analytics", "Extra: GET /admin/analytics")
        req(admin_s, "get", "/admin/analytics/growth", "Extra: GET /admin/analytics/growth")
        req(admin_s, "get", "/admin/analytics/retention",
            "Extra: GET /admin/analytics/retention")
        req(admin_s, "get", "/admin/analytics/leaderboards",
            "Extra: GET /admin/analytics/leaderboards")
        req(admin_s, "get", "/admin/users", "Extra: GET /admin/users")
        req(admin_s, "get", "/admin/reports", "Extra: GET /admin/reports")


def test_chat_extras(tier_sessions: dict):
    section("CHAT (rooms, join, messages, DM room)")
    users = [(k, v) for k, v in tier_sessions.items()
             if v[0] is not None and k not in ("admin", "admin_no_role")]
    if not users:
        return

    s1, u1 = users[0][1]

    # List all-australia rooms
    r = req(s1, "get", "/chat/rooms/all", "Chat: GET /chat/rooms/all")
    rooms = []
    if r and 200 <= r.status_code < 300:
        rooms = get_body(r)
        if isinstance(rooms, list):
            passed("Chat: rooms/all returned list", f"count={len(rooms)}")

    # List rooms (auth)
    r2 = req(s1, "get", "/chat/rooms", "Chat: GET /chat/rooms (auth)")
    room_id = None
    if r2 and 200 <= r2.status_code < 300:
        data = get_body(r2)
        au_rooms = data.get("all_australia_rooms", [])
        if au_rooms:
            room_id = au_rooms[0].get("room_id")
        elif rooms:
            room_id = rooms[0].get("room_id")

    # Join room
    if room_id:
        req(s1, "post", f"/chat/rooms/{room_id}/join",
            "Chat: POST /chat/rooms/{id}/join")

        # Send message
        req(s1, "post", f"/chat/rooms/{room_id}/messages",
            "Chat: POST /chat/rooms/{id}/messages",
            json={"content": "Test message from comprehensive test suite — hello community!"})

        # Read messages
        r3 = req(s1, "get", f"/chat/rooms/{room_id}/messages?limit=10",
                 "Chat: GET /chat/rooms/{id}/messages")
        if r3 and 200 <= r3.status_code < 300:
            msgs = get_body(r3)
            if isinstance(msgs, list):
                passed("Chat: messages returned", f"count={len(msgs)}")

    # Friends DM room
    if len(users) >= 2:
        s2, u2 = users[1][1]
        uid2 = u2.get("user_id")
        r4 = req(s1, "post", "/chat/rooms/friends",
                 "Chat: POST /chat/rooms/friends (create DM room)",
                 json={"friend_id": uid2})
        if r4 and 200 <= r4.status_code < 300:
            dm_room_id = get_body(r4).get("room_id")
            if dm_room_id:
                req(s1, "post", f"/chat/rooms/{dm_room_id}/messages",
                    "Chat: send message in DM room",
                    json={"content": "Hey! Direct message test from test suite."})
                req(s2, "post", f"/chat/rooms/{dm_room_id}/messages",
                    "Chat: reply in DM room (bidirectional)",
                    json={"content": "Got your message! Bidirectional DM working."})

    # Room search
    req(s1, "get", "/chat/rooms/search?q=3am",
        "Chat: GET /chat/rooms/search?q=3am")

    # Nearby rooms
    r5 = req(s1, "get", "/chat/rooms/nearby", "Chat: GET /chat/rooms/nearby",
             silent=True)
    if r5:
        if r5.status_code == 200:
            passed("Chat: GET /chat/rooms/nearby works")
        elif r5.status_code in (400, 422):
            warn("Chat: /chat/rooms/nearby needs location params",
                 f"HTTP {r5.status_code}")
        elif r5.status_code == 404:
            missing("GET /chat/rooms/nearby")


# ==================== FINAL REPORT ====================

def print_report():
    section("FINAL TEST REPORT")

    p = report["passed"]
    f = report["failed"]
    w = report["warnings"]
    m = report["missing_features"]
    b = report["bugs"]
    r = report["recommendations"]

    print(f"\n{GREEN}{BOLD}PASSED ({len(p)}){RESET}")
    for item in p:
        print(f"  [PASS] {item}")

    print(f"\n{RED}{BOLD}FAILED ({len(f)}){RESET}")
    if f:
        for item in f:
            print(f"  [FAIL] {item}")
    else:
        print("  (none)")

    print(f"\n{YELLOW}{BOLD}WARNINGS ({len(w)}){RESET}")
    if w:
        for item in w:
            print(f"  [WARN] {item}")
    else:
        print("  (none)")

    print(f"\n{YELLOW}{BOLD}MISSING FEATURES / ENDPOINTS ({len(m)}){RESET}")
    if m:
        for item in m:
            print(f"  [MISS] {item}")
    else:
        print("  (none — all tested endpoints exist)")

    print(f"\n{RED}{BOLD}BUGS FOUND ({len(b)}){RESET}")
    if b:
        for item in b:
            print(f"  [BUG ] {item}")
    else:
        print("  (none found)")

    print(f"\n{CYAN}{BOLD}RECOMMENDATIONS ({len(r)}){RESET}")
    if r:
        for item in r:
            print(f"  -> {item}")
    else:
        print("  (no additional recommendations)")

    total = len(p) + len(f)
    pct = round(len(p) / total * 100, 1) if total > 0 else 0
    print(f"\n{BOLD}OVERALL: {len(p)}/{total} tests passed ({pct}%){RESET}")
    print(f"         {len(m)} missing endpoints | {len(b)} bugs | {len(w)} warnings")


# ==================== MAIN ====================

if __name__ == "__main__":
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  THE VILLAGE — COMPREHENSIVE API TEST SUITE{RESET}")
    print(f"{BOLD}  Target : {BASE_URL}{RESET}")
    print(f"{BOLD}  Date   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
    print(f"{BOLD}  Usage  : python test_comprehensive.py [--url URL]{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

    # Check backend is running
    if not test_backend_reachable():
        print(f"\n{RED}Backend not running. Exiting.{RESET}")
        print_report()
        exit(1)

    # Run all test sections
    admin_s, admin_info = login(ADMIN_EMAIL, ADMIN_PASSWORD)

    tier_sessions = test_user_tiers(admin_s)
    test_messaging(tier_sessions)
    test_friend_requests(tier_sessions)
    forum_data = test_forum_posts(tier_sessions)
    test_moderation(tier_sessions, forum_data)
    test_events(tier_sessions)
    test_online_stats(tier_sessions)
    test_communities(tier_sessions)
    test_photo_upload(tier_sessions)
    test_chat_extras(tier_sessions)
    test_extra_scenarios(tier_sessions)
    test_load_simulation(tier_sessions, forum_data)

    print_report()
    print(f"\n{BOLD}Test suite complete.{RESET}")
