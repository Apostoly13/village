# Full-platform simulation sweep — run against local dev (backend :8000).
# Bree = free user, Marco = premium. Prints PASS/FAIL scorecard.
import requests, json, sys, time

API = "http://localhost:8000/api"
results = []

def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))

def login(email, pw):
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": email, "password": pw})
    r.raise_for_status()
    return s, r.json()

bree, bree_u = login("bree.flowtest@example.com", "FlowTest2026x")
marco, marco_u = login("marco.flowtest@example.com", "FlowTest2026x")
BREE, MARCO = bree_u["user_id"], marco_u["user_id"]
print(f"Bree={BREE} Marco={MARCO}\n")

# -- 1. Premium event creation + free RSVP -----------------------------
r = marco.post(f"{API}/events", json={
    "title": "Sweep Test Playgroup", "description": "Simulation sweep event — please ignore.",
    "suburb": "Newtown", "state": "NSW", "date": "2026-07-01", "time_start": "10:00",
    "category": "playgroup"})
check("Premium can create event", r.status_code == 200, f"{r.status_code} {r.text[:120]}")
event_id = r.json().get("event_id") if r.status_code == 200 else None

r = bree.post(f"{API}/events", json={"title": "Free event try", "description": "x", "date": "2026-07-01"})
check("Free event create blocked (403)", r.status_code == 403, str(r.status_code))

if event_id:
    r = bree.post(f"{API}/events/{event_id}/rsvp")
    check("Free user can RSVP", r.status_code == 200, f"{r.status_code} {r.text[:100]}")

# -- 2. Stall: premium listing, free blocked, enquiry flow -------------
r = marco.post(f"{API}/stall/listings", json={
    "title": "Sweep test pram", "description": "Simulation sweep listing — ignore.",
    "listing_type": "sell", "price": 50, "category": "prams", "condition": "good",
    "suburb": "Marrickville", "state": "NSW"})
check("Premium can create stall listing", r.status_code == 200, f"{r.status_code} {r.text[:150]}")
listing_id = (r.json().get("listing_id") or r.json().get("id")) if r.status_code == 200 else None

r = bree.post(f"{API}/stall/listings", json={
    "title": "Free listing try", "listing_type": "sell", "category": "prams"})
check("Free stall listing blocked (403)", r.status_code == 403, str(r.status_code))

r = bree.get(f"{API}/stall/listings")
check("Free can browse stall listings", r.status_code == 200, str(r.status_code))

if listing_id:
    r = bree.post(f"{API}/stall/messages", json={"listing_id": listing_id, "receiver_id": MARCO, "content": "Is this still available?"})
    check("Stall enquiry message (free buyer)", r.status_code in (200, 403), f"{r.status_code} {r.text[:150]}")
    print(f"   -> stall enquiry status={r.status_code} (200=open to all, 403=premium-gated)")

    # Report the listing
    r = bree.post(f"{API}/reports", json={"content_type": "listing", "content_id": listing_id,
                                          "reason": "other", "details": "Sweep test report — please disregard."})
    check("Can report a stall listing", r.status_code == 200, f"{r.status_code} {r.text[:120]}")

# -- 3. Communities: premium create + join/leave, free blocked ---------
r = marco.post(f"{API}/forums/communities", json={
    "name": "Sweep Test Community", "description": "Simulation sweep community — ignore it.", "icon": "🧪"})
check("Premium can create community", r.status_code == 200, f"{r.status_code} {r.text[:150]}")
comm_id = (r.json().get("category_id") or r.json().get("community_id")) if r.status_code == 200 else None

r = bree.post(f"{API}/forums/communities", json={"name": "Free community", "description": "should not be allowed", "icon": "🚫"})
check("Free community create blocked (403)", r.status_code == 403, str(r.status_code))

# -- 4. Block flow ------------------------------------------------------
r = bree.post(f"{API}/users/{MARCO}/block")
check("Bree can block Marco", r.status_code == 200, f"{r.status_code} {r.text[:100]}")
r = marco.post(f"{API}/messages", json={"receiver_id": BREE, "content": "Should be blocked"})
check("Blocked user's DM rejected", r.status_code in (403, 400), f"{r.status_code} {r.text[:120]}")
r = bree.delete(f"{API}/users/{MARCO}/block")
if r.status_code == 405:
    r = bree.post(f"{API}/users/{MARCO}/unblock")
check("Unblock works", r.status_code == 200, f"{r.status_code} {r.text[:100]}")
r = marco.post(f"{API}/messages", json={"receiver_id": BREE, "content": "Unblocked — sweep test"})
check("DM works again after unblock", r.status_code == 200, f"{r.status_code} {r.text[:120]}")

# -- 5. Free weekly post/reply limits visible & enforced ---------------
r = bree.get(f"{API}/subscription/status")
ok = r.status_code == 200
usage = r.json().get("usage", {}) if ok else {}
check("Subscription status shows usage", ok and "forum_posts" in json.dumps(r.json()), f"{r.status_code} {r.text[:200]}")
print("   -> Bree usage:", json.dumps(r.json().get("usage", r.json()))[:300])

# Exhaust Bree's weekly post cap (5) — respects 5/300s rate limit window only if needed
cat = bree.get(f"{API}/forums/categories").json()
cat_id = cat[0]["category_id"] if isinstance(cat, list) and cat else None
made, blocked_at = 0, None
for i in range(7):
    r = bree.post(f"{API}/forums/posts", json={"category_id": cat_id, "title": f"Sweep cap test {i}",
                                               "content": "Testing weekly cap — ignore.", "is_anonymous": False})
    if r.status_code == 200:
        made += 1
    else:
        blocked_at = (i, r.status_code, r.text[:160]); break
    time.sleep(0.3)
check("Weekly post cap enforced", blocked_at is not None and blocked_at[1] in (403, 429),
      f"made={made} blocked={blocked_at}")
print(f"   -> posts created this run: {made}, then {blocked_at[1] if blocked_at else 'never blocked'}")

# -- 6. Chat daily limit telemetry -------------------------------------
rooms_resp = bree.get(f"{API}/chat/rooms").json()
room_list = []
for v in rooms_resp.values():
    if isinstance(v, list): room_list += [x for x in v if isinstance(x, dict)]
    elif isinstance(v, dict) and v.get("room_id"): room_list.append(v)
room = next((x for x in room_list if "3am" not in x.get("name", "").lower()), None)
if room:
    r = bree.post(f"{API}/chat/rooms/{room['room_id']}/messages", json={"content": "Sweep test message"})
    check("Free user can chat in rooms", r.status_code == 200, f"{r.status_code} {r.text[:120]}")
r = bree.get(f"{API}/subscription/status")
chat_used = json.dumps(r.json())
check("Chat usage tracked", "chat_messages" in chat_used, chat_used[:200])

# -- 7. Security & abuse -----------------------------------------------
anon = requests.Session()
r = anon.get(f"{API}/auth/me")
check("Unauthenticated /me rejected", r.status_code == 401, str(r.status_code))
r = anon.get(f"{API}/admin/stats")
check("Unauthenticated admin stats rejected", r.status_code in (401, 403), str(r.status_code))
r = bree.get(f"{API}/admin/stats")
check("Free user admin stats rejected", r.status_code in (401, 403), str(r.status_code))

if listing_id:
    r = bree.delete(f"{API}/stall/listings/{listing_id}")
    check("Cannot delete someone else's listing", r.status_code in (403, 404), str(r.status_code))

# Login brute-force rate limit (fake account so no lockout side effects)
codes = []
for i in range(8):
    r = anon.post(f"{API}/auth/login", json={"email": "bruteforce@example.com", "password": f"wrong{i}"})
    codes.append(r.status_code)
check("Login brute-force rate limited", 429 in codes, str(codes))

# XSS payload stored escaped (render-side check happened in browser earlier)
r = marco.post(f"{API}/forums/posts", json={"category_id": cat_id, "title": "<script>alert(1)</script>",
                                            "content": "<img src=x onerror=alert(1)>", "is_anonymous": False})
xss_id = r.json().get("post_id") if r.status_code == 200 else None
if xss_id:
    r = marco.get(f"{API}/forums/posts/{xss_id}")
    body = r.text
    check("XSS payload neutralised in API response", "<script>" not in body or "&lt;" in body, body[:200])

# -- 8. Anonymous mask still holds -------------------------------------
r = marco.post(f"{API}/forums/posts", json={"category_id": cat_id, "title": "Anon sweep check",
                                            "content": "Anonymous mask verification.", "is_anonymous": True})
if r.status_code == 200:
    pid = r.json()["post_id"]
    r2 = bree.get(f"{API}/forums/posts/{pid}")
    d = r2.json()
    check("Anonymous post hides author from others",
          d.get("author_id") in ("anonymous", None) and MARCO not in json.dumps(d), json.dumps(d)[:200])

print("\n-------- SCORECARD --------")
passed = sum(1 for _, ok, _ in results if ok)
print(f"{passed}/{len(results)} passed")
for name, ok, detail in results:
    if not ok:
        print(f"  x {name}: {detail}")
