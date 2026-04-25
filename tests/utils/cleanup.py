"""
Safe test data cleanup.
Only deletes content owned by TEST_AUTOMATION_ accounts.
Never touches real user data.
"""
import os
from .api_client import APIClient, fresh_client
from .test_users import admin_client, TEST_USERS

PREFIX = "TEST_AUTOMATION"


def cleanup_test_data(verbose: bool = True) -> dict:
    """
    Walk through test accounts and delete their generated content.
    Returns summary dict.
    """
    if os.environ.get("ALLOW_TEST_CLEANUP", "true").lower() != "true":
        print("[CLEANUP] Skipped — ALLOW_TEST_CLEANUP is not true")
        return {}

    summary = {"deleted": [], "failed": [], "skipped": []}

    try:
        admin = admin_client()
    except Exception as e:
        print(f"[CLEANUP] Cannot get admin client: {e}")
        return summary

    for key, user_def in TEST_USERS.items():
        client = fresh_client()
        r = client.login(user_def["email"], user_def["password"])
        if r.status_code != 200:
            summary["skipped"].append(f"{key} (login failed)")
            continue

        if verbose:
            print(f"[CLEANUP] Cleaning up {key} ({user_def['email']})…")

        # Delete own stall listings
        r = client.get("/stall/listings/my")
        if r.status_code == 200:
            for listing in r.json():
                if PREFIX in (listing.get("title") or ""):
                    rd = client.delete(f"/stall/listings/{listing['listing_id']}")
                    if rd.status_code in (200, 204):
                        summary["deleted"].append(f"stall_listing:{listing['listing_id']}")
                    else:
                        summary["failed"].append(f"stall_listing:{listing['listing_id']}")

        # Delete own forum posts (those with TEST_AUTOMATION in title)
        # We can't easily filter by title from the API, so we skip post deletion
        # to be safe — posts are identifiable by the [TEST_AUTOMATION] prefix in title.
        summary["skipped"].append(f"{key}:forum_posts (identifiable by [{PREFIX}] title prefix)")

    if verbose:
        print(f"\n[CLEANUP] Done. Deleted: {len(summary['deleted'])}, "
              f"Failed: {len(summary['failed'])}, Skipped: {len(summary['skipped'])}")

    return summary


def print_cleanup_report(summary: dict):
    print("\n── Cleanup Report ──────────────────────")
    for item in summary.get("deleted", []):
        print(f"  ✓ Deleted: {item}")
    for item in summary.get("failed", []):
        print(f"  ✗ Failed:  {item}")
    for item in summary.get("skipped", []):
        print(f"  ○ Skipped: {item}")
    print("────────────────────────────────────────")
