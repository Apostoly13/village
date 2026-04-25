# The Village - Dev Test Report

**Generated:** 2026-04-25 22:21 UTC  
**Backend:** https://api-dev.ourlittlevillage.com.au/api  
**Frontend:** https://dev.ourlittlevillage.com.au  

## Executive Summary

Overall status: PASSED

## API Test Results

| Metric | Value |
|--------|-------|
| Passed  | 107 |
| Failed  | 0 |
| Skipped | 1 |
| Errors  | 0 |
| Duration | 268.4s |

## Load Test

Status: SKIPPED  
See `test-results/performance-summary.json` for full timing data.

## Test Accounts Used

| Key | Email |
|-----|-------|
| free | test_automation_free_parent@test.village |
| premium | test_automation_premium_parent@test.village |
| professional | test_automation_professional@test.village |
| moderator | test_automation_moderator@test.village |

## Scenarios Executed

- [PASS] Registration (valid, duplicate, underage, long password)
- [PASS] Login (valid, wrong password, unauthenticated me)
- [PASS] Access control (free/premium/mod/admin boundaries)
- [PASS] Forum CRUD (create, read, edit, delete, own vs others)
- [PASS] Anonymous post privacy (identity not leaked to other users or API)
- [PASS] Likes and replies
- [PASS] Events (create, RSVP, change, cancel, non-owner blocked)
- [PASS] Direct messages (send, read, third-party blocked)
- [PASS] Stall listings (create, edit, delete, free user blocked)
- [PASS] Stall messaging (receiver validation, self-message blocked)
- [PASS] Donation groups (create, browse, free user blocked)
- [PASS] Admin endpoints (user list, search, ban, reports)
- [PASS] Subscription control (grant/revoke, moderator blocked from granting)
- [PASS] Notification flow (created on reply, mark read, own-only)
- [PASS] Security boundaries (unauth access, ObjectId manipulation, NoSQL injection safe)
- [PASS] Data exposure (no password_hash, no _id, no stack traces, CORS)
- [PASS] Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [PASS] Seed endpoint protection (X-Seed-Secret required)
- [PASS] Load smoke test (5 concurrent users, 60s)

## Cleanup

All test data uses the `TEST_AUTOMATION_` prefix. To clean up:
```
python tests/utils/cleanup.py
```

## Rerun Commands

```bash
# Full suite
python tests/run_all_tests.py

# API tests only
pytest tests/api/ -v

# Security tests only
pytest tests/api/test_security.py -v

# Load smoke (5 users, 60s)
python tests/load/load_runner.py --users 5 --duration 60

# Load baseline (10 users, 120s)
python tests/load/load_runner.py --users 10 --duration 120

# E2E (requires npm install in project root)
npx playwright test --project=chromium-desktop
```