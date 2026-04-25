"""
The Village - Safe Load Test Runner
Simulates concurrent users against the DEV backend only.
Uses threading (no external tools required).

Usage:
  python tests/load/load_runner.py --users 5 --duration 60
  python tests/load/load_runner.py --users 10 --duration 120
  python tests/load/load_runner.py --users 25 --duration 120

Do NOT run 50+ users without explicit approval.
"""
import os
import sys
import time
import json
import random
import threading
import argparse
import statistics
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.test"), override=False)

import requests

BASE_URL = os.environ.get("DEV_BACKEND_URL",
                          "https://api-dev.ourlittlevillage.com.au/api").rstrip("/")
ADMIN_EMAIL    = os.environ.get("TEST_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "")
TEST_PASSWORD  = os.environ.get("TEST_USER_PASSWORD", "TestVillage2024!")

# -- Colours ------------------------------------------------------------------
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"

# -- Shared results ------------------------------------------------------------
_lock = threading.Lock()
results = {
    "requests": 0,
    "errors": 0,
    "timings": [],
    "slow": [],
    "by_endpoint": {},
}

SLOW_THRESHOLD = 2.0  # seconds


def record(endpoint: str, elapsed: float, ok: bool):
    with _lock:
        results["requests"] += 1
        if not ok:
            results["errors"] += 1
        results["timings"].append(elapsed)
        if elapsed > SLOW_THRESHOLD:
            results["slow"].append({"endpoint": endpoint, "elapsed": round(elapsed, 3)})
        ep = results["by_endpoint"].setdefault(endpoint, {"count": 0, "errors": 0, "timings": []})
        ep["count"] += 1
        if not ok:
            ep["errors"] += 1
        ep["timings"].append(elapsed)


def timed_get(session: requests.Session, path: str) -> float:
    url = f"{BASE_URL}{path}"
    start = time.monotonic()
    try:
        r = session.get(url, timeout=10)
        elapsed = time.monotonic() - start
        record(path, elapsed, r.status_code < 500)
        return elapsed
    except Exception as e:
        elapsed = time.monotonic() - start
        record(path, elapsed, False)
        return elapsed


def timed_post(session: requests.Session, path: str, payload: dict) -> float:
    url = f"{BASE_URL}{path}"
    start = time.monotonic()
    try:
        r = session.post(url, json=payload, timeout=10)
        elapsed = time.monotonic() - start
        record(path, elapsed, r.status_code < 500)
        return elapsed
    except Exception as e:
        elapsed = time.monotonic() - start
        record(path, elapsed, False)
        return elapsed


def get_or_login(email: str, password: str) -> requests.Session:
    """Login and return a requests.Session with auth cookie."""
    session = requests.Session()
    r = session.post(f"{BASE_URL}/auth/login",
                     json={"email": email, "password": password}, timeout=10)
    if r.status_code != 200:
        return None
    return session


def worker(user_email: str, user_password: str, duration: int, worker_id: int):
    """Single virtual user - runs mixed read/write workload for `duration` seconds."""
    session = get_or_login(user_email, user_password)
    if not session:
        print(f"  {RED}[Worker {worker_id}] Login failed{RESET}")
        return

    stop_at = time.monotonic() + duration
    category_id = None

    # Get categories once
    r = session.get(f"{BASE_URL}/forums/categories", timeout=10)
    if r.status_code == 200 and r.json():
        cats = r.json()
        category_id = random.choice(cats)["category_id"] if cats else None

    ops = 0
    while time.monotonic() < stop_at:
        action = random.choices(
            ["browse_listings", "browse_posts", "browse_events",
             "get_notifications", "get_me"],
            weights=[30, 30, 15, 15, 10],
            k=1
        )[0]

        if action == "browse_listings":
            timed_get(session, "/stall/listings?limit=20")
        elif action == "browse_posts" and category_id:
            timed_get(session, f"/forums/posts?category_id={category_id}&limit=20")
        elif action == "browse_events":
            timed_get(session, "/events?limit=20")
        elif action == "get_notifications":
            timed_get(session, "/notifications?limit=10")
        elif action == "get_me":
            timed_get(session, "/auth/me")

        ops += 1
        time.sleep(random.uniform(0.3, 1.0))  # realistic think time

    print(f"  {GREEN}[Worker {worker_id}] Done - {ops} ops{RESET}")


def run_load_test(n_users: int, duration: int, test_emails: list):
    """Run n_users concurrent workers for duration seconds."""
    print(f"\n{CYAN}[LOAD] Starting {n_users} virtual users for {duration}s against {BASE_URL}{RESET}")
    print(f"       Slow threshold: {SLOW_THRESHOLD}s\n")

    threads = []
    start = time.monotonic()

    for i, email in enumerate(test_emails[:n_users]):
        t = threading.Thread(
            target=worker,
            args=(email, TEST_PASSWORD, duration, i + 1),
            daemon=True,
        )
        threads.append(t)
        t.start()
        time.sleep(0.2)  # stagger starts to avoid thundering herd

    for t in threads:
        t.join(timeout=duration + 30)

    elapsed = time.monotonic() - start
    return elapsed


def print_report(elapsed: float):
    print(f"\n{'-'*60}")
    print(f"{CYAN}LOAD TEST RESULTS{RESET}")
    print(f"{'-'*60}")
    print(f"  Total requests : {results['requests']}")
    print(f"  Errors         : {results['errors']}")
    print(f"  Error rate     : {results['errors']/max(results['requests'],1)*100:.1f}%")
    print(f"  Duration       : {elapsed:.1f}s")
    print(f"  Req/s          : {results['requests']/max(elapsed,1):.1f}")

    if results["timings"]:
        ts = sorted(results["timings"])
        print(f"\n  Response times:")
        print(f"    Avg  : {statistics.mean(ts)*1000:.0f}ms")
        print(f"    p50  : {ts[len(ts)//2]*1000:.0f}ms")
        print(f"    p95  : {ts[int(len(ts)*0.95)]*1000:.0f}ms")
        print(f"    Max  : {ts[-1]*1000:.0f}ms")

    if results["slow"]:
        print(f"\n  {YELLOW}Slow requests (>{SLOW_THRESHOLD}s):{RESET}")
        for s in results["slow"][:10]:
            print(f"    {s['endpoint']} - {s['elapsed']}s")

    print(f"\n  By endpoint:")
    for ep, data in sorted(results["by_endpoint"].items(),
                            key=lambda x: -x[1]["count"]):
        ts = sorted(data["timings"])
        avg = statistics.mean(ts) * 1000
        p95 = ts[int(len(ts) * 0.95)] * 1000 if len(ts) > 1 else avg
        err_pct = data["errors"] / max(data["count"], 1) * 100
        print(f"    {ep}")
        print(f"      count={data['count']}  avg={avg:.0f}ms  p95={p95:.0f}ms  errors={err_pct:.0f}%")

    # Save report
    report_dir = os.path.join(os.path.dirname(__file__), "../../test-results")
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, "performance-summary.json")
    with open(report_path, "w") as f:
        json.dump({
            "timestamp": datetime.utcnow().isoformat(),
            "backend_url": BASE_URL,
            "total_requests": results["requests"],
            "errors": results["errors"],
            "error_rate_pct": results["errors"]/max(results["requests"],1)*100,
            "duration_s": elapsed,
            "avg_ms": statistics.mean(results["timings"])*1000 if results["timings"] else 0,
            "p95_ms": sorted(results["timings"])[int(len(results["timings"])*0.95)]*1000 if results["timings"] else 0,
            "slow_endpoints": results["slow"][:20],
            "by_endpoint": {k: {
                "count": v["count"],
                "errors": v["errors"],
                "avg_ms": statistics.mean(v["timings"])*1000,
            } for k, v in results["by_endpoint"].items()},
        }, f, indent=2)
    print(f"\n  Report saved: {report_path}")


if __name__ == "__main__":
    # Ensure project root is on sys.path so tests.utils imports work
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

    parser = argparse.ArgumentParser(description="The Village - Safe Load Test")
    parser.add_argument("--users", type=int, default=5, help="Virtual users (max 25 safe)")
    parser.add_argument("--duration", type=int, default=60, help="Test duration in seconds")
    args = parser.parse_args()

    if args.users > 50:
        print(f"{RED}ERROR: Max 50 users without explicit approval. Refusing to run.{RESET}")
        sys.exit(1)

    if args.users > 25:
        print(f"{YELLOW}WARNING: Running {args.users} users - monitor Railway metrics.{RESET}")

    # Build list of test user emails to use as virtual users
    from tests.utils.test_data import TEST_USERS
    test_emails = [u["email"] for u in TEST_USERS.values()]

    # Pad with index variants if we need more than 4 users
    if args.users > len(test_emails):
        base = test_emails[:]
        while len(test_emails) < args.users:
            test_emails.extend(base)
        test_emails = test_emails[:args.users]

    elapsed = run_load_test(args.users, args.duration, test_emails)
    print_report(elapsed)
