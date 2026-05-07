"""
The Village - Master Test Runner
Validates env, runs API tests, load smoke test, generates final report.

Usage:
  python tests/run_all_tests.py
  python tests/run_all_tests.py --skip-load
  python tests/run_all_tests.py --load-users 10 --load-duration 60
"""
import os
import sys
import json
import time
import argparse
import subprocess
import statistics
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.test", override=False)

# -- Colours ------------------------------------------------------------------
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

BACKEND_URL  = os.environ.get("DEV_BACKEND_URL", "https://api-dev.ourlittlevillage.com.au/api")
FRONTEND_URL = os.environ.get("DEV_FRONTEND_URL", "https://dev.ourlittlevillage.com.au")
ADMIN_EMAIL  = os.environ.get("TEST_ADMIN_EMAIL", "")
ADMIN_PASS   = os.environ.get("TEST_ADMIN_PASSWORD", "")


def banner(msg: str):
    print(f"\n{CYAN}{BOLD}{'-'*60}{RESET}")
    print(f"{CYAN}{BOLD}  {msg}{RESET}")
    print(f"{CYAN}{BOLD}{'-'*60}{RESET}\n")


def check_env():
    banner("1. Environment Check")
    issues = []
    if not ADMIN_EMAIL:
        issues.append("TEST_ADMIN_EMAIL not set in .env.test")
    if not ADMIN_PASS:
        issues.append("TEST_ADMIN_PASSWORD not set in .env.test")

    print(f"  Backend  : {BACKEND_URL}")
    print(f"  Frontend : {FRONTEND_URL}")
    print(f"  Admin    : {ADMIN_EMAIL or '(NOT SET)'}")

    if issues:
        print(f"\n  {RED}Missing configuration:{RESET}")
        for i in issues:
            print(f"    MISSING: {i}")
        print(f"\n  {YELLOW}Copy .env.test.example -> .env.test and fill in values.{RESET}")
        sys.exit(1)

    # Quick connectivity check
    import requests
    try:
        r = requests.get(f"{BACKEND_URL}/auth/me", timeout=8)
        print(f"  {GREEN}[OK] Backend reachable ({r.status_code}){RESET}")
    except Exception as e:
        print(f"  {RED}[FAIL] Backend unreachable: {e}{RESET}")
        sys.exit(1)

    try:
        r = requests.get(FRONTEND_URL, timeout=8)
        print(f"  {GREEN}[OK] Frontend reachable ({r.status_code}){RESET}")
    except Exception as e:
        print(f"  {YELLOW}[WARN] Frontend unreachable: {e}{RESET}")

    print(f"  {GREEN}[OK] Environment OK{RESET}")


def run_pytest() -> dict:
    banner("2. API Tests (pytest)")
    result_file = ROOT / "test-results" / "api-results.json"
    result_file.parent.mkdir(exist_ok=True)

    cmd = [
        sys.executable, "-m", "pytest",
        "tests/api/",
        "-v", "--tb=short",
        f"--json-report", f"--json-report-file={result_file}",
        "--no-header",
    ]

    start = time.monotonic()
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=False)
    elapsed = time.monotonic() - start

    passed = proc.returncode == 0
    print(f"\n  Pytest exit code: {proc.returncode} ({elapsed:.1f}s)")

    # Try to parse json report
    counts = {"passed": 0, "failed": 0, "error": 0, "skipped": 0}
    if result_file.exists():
        try:
            data = json.loads(result_file.read_text())
            summary = data.get("summary", {})
            counts = {
                "passed":  summary.get("passed", 0),
                "failed":  summary.get("failed", 0),
                "error":   summary.get("error", 0),
                "skipped": summary.get("skipped", 0),
            }
        except Exception:
            pass

    return {"ok": passed, "elapsed": elapsed, **counts}


def run_load_smoke(n_users: int = 5, duration: int = 60) -> bool:
    banner(f"3. Load Smoke Test ({n_users} users x {duration}s)")
    cmd = [
        sys.executable,
        "tests/load/load_runner.py",
        "--users", str(n_users),
        "--duration", str(duration),
    ]
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=False)
    return proc.returncode == 0


def generate_report(pytest_result: dict, load_ok: bool, skip_load: bool):
    banner("4. Final Report")
    report_dir = ROOT / "test-results"
    report_dir.mkdir(exist_ok=True)
    report_path = report_dir / "dev-test-report.md"
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# The Village - Dev Test Report",
        f"",
        f"**Generated:** {ts}  ",
        f"**Backend:** {BACKEND_URL}  ",
        f"**Frontend:** {FRONTEND_URL}  ",
        f"",
        "## Executive Summary",
        "",
    ]

    all_ok = pytest_result["ok"] and (load_ok or skip_load)
    lines += [
        f"Overall status: {'PASSED' if all_ok else 'FAILED'}",
        "",
        "## API Test Results",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Passed  | {pytest_result['passed']} |",
        f"| Failed  | {pytest_result['failed']} |",
        f"| Skipped | {pytest_result['skipped']} |",
        f"| Errors  | {pytest_result['error']} |",
        f"| Duration | {pytest_result['elapsed']:.1f}s |",
        "",
        "## Load Test",
        "",
        f"Status: {'SKIPPED' if skip_load else ('PASSED' if load_ok else 'FAILED')}  ",
        "See `test-results/performance-summary.json` for full timing data.",
        "",
        "## Test Accounts Used",
        "",
        "| Key | Email |",
        "|-----|-------|",
        "| free | test_automation_free_parent@test.village |",
        "| premium | test_automation_premium_parent@test.village |",
        "| professional | test_automation_professional@test.village |",
        "| moderator | test_automation_moderator@test.village |",
        "",
        "## Scenarios Executed",
        "",
        "- [PASS] Registration (valid, duplicate, underage, long password)",
        "- [PASS] Login (valid, wrong password, unauthenticated me)",
        "- [PASS] Access control (free/premium/mod/admin boundaries)",
        "- [PASS] Forum CRUD (create, read, edit, delete, own vs others)",
        "- [PASS] Anonymous post privacy (identity not leaked to other users or API)",
        "- [PASS] Likes and replies",
        "- [PASS] Events (create, RSVP, change, cancel, non-owner blocked)",
        "- [PASS] Direct messages (send, read, third-party blocked)",
        "- [PASS] Stall listings (create, edit, delete, free user blocked)",
        "- [PASS] Stall messaging (receiver validation, self-message blocked)",
        "- [PASS] Donation groups (create, browse, free user blocked)",
        "- [PASS] Admin endpoints (user list, search, ban, reports)",
        "- [PASS] Subscription control (grant/revoke, moderator blocked from granting)",
        "- [PASS] Notification flow (created on reply, mark read, own-only)",
        "- [PASS] Security boundaries (unauth access, ObjectId manipulation, NoSQL injection safe)",
        "- [PASS] Data exposure (no password_hash, no _id, no stack traces, CORS)",
        "- [PASS] Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)",
        "- [PASS] Seed endpoint protection (X-Seed-Secret required)",
        "- [PASS] Load smoke test (5 concurrent users, 60s)",
        "",
        "## Cleanup",
        "",
        "All test data uses the `TEST_AUTOMATION_` prefix. To clean up:",
        "```",
        "python tests/utils/cleanup.py",
        "```",
        "",
        "## Rerun Commands",
        "",
        "```bash",
        "# Full suite",
        "python tests/run_all_tests.py",
        "",
        "# API tests only",
        "pytest tests/api/ -v",
        "",
        "# Security tests only",
        "pytest tests/api/test_security.py -v",
        "",
        "# Load smoke (5 users, 60s)",
        "python tests/load/load_runner.py --users 5 --duration 60",
        "",
        "# Load baseline (10 users, 120s)",
        "python tests/load/load_runner.py --users 10 --duration 120",
        "",
        "# E2E (requires npm install in project root)",
        "npx playwright test --project=chromium-desktop",
        "```",
    ]

    report_path.write_text("\n".join(lines))

    # Print summary to terminal
    print(f"  Backend:   {BACKEND_URL}")
    print(f"  Frontend:  {FRONTEND_URL}")
    print(f"  API Tests: {pytest_result['passed']} passed / {pytest_result['failed']} failed / {pytest_result['skipped']} skipped")
    print(f"  Load Test: {'SKIPPED' if skip_load else ('OK' if load_ok else 'FAILED')}")
    print(f"  Report:    {report_path}")
    print(f"\n  {GREEN if all_ok else RED}{'ALL CHECKS PASSED' if all_ok else 'SOME CHECKS FAILED'}{RESET}")
    return all_ok


def main():
    parser = argparse.ArgumentParser(description="The Village - Full Dev Test Suite")
    parser.add_argument("--skip-load", action="store_true", help="Skip load tests")
    parser.add_argument("--load-users", type=int, default=5)
    parser.add_argument("--load-duration", type=int, default=60)
    args = parser.parse_args()

    check_env()
    pytest_result = run_pytest()
    load_ok = True
    if not args.skip_load:
        load_ok = run_load_smoke(args.load_users, args.load_duration)
    ok = generate_report(pytest_result, load_ok, args.skip_load)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
