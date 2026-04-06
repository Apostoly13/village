"""
Interactive environment test: spin up 10 test users and exercise all features.
Uses Bearer token auth (avoids secure-cookie issues over plain HTTP).
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE = "http://localhost:8000/api"
RESULTS = []

USERS = [
    {
        "name": "Sarah Mitchell", "email": "sarah.mitchell@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "Sarah M", "bio": "FTM to a gorgeous 4-month-old. Still figuring it all out!",
            "parenting_stage": "newborn", "child_age_ranges": ["newborn", "infant"],
            "suburb": "Bondi", "postcode": "2026", "state": "NSW",
            "latitude": -33.8915, "longitude": 151.2767,
            "interests": ["Breastfeeding", "Sleep Training", "Mental Health"]
        },
        "role": "First-time mum, newborn",
    },
    {
        "name": "James Nguyen", "email": "james.nguyen@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "JamesN", "bio": "Dad of two boys. Rugby dad on weekends, sleep-deprived on weekdays.",
            "parenting_stage": "school_age", "child_age_ranges": ["school_age", "toddler"],
            "suburb": "Manly", "postcode": "2095", "state": "NSW",
            "latitude": -33.7972, "longitude": 151.2863,
            "interests": ["Dad Talk", "School Age", "Local Events"]
        },
        "role": "Dad, school-age kids",
    },
    {
        "name": "Priya Sharma", "email": "priya.sharma@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "Priya", "bio": "34 weeks pregnant with my first! Nervous and excited.",
            "parenting_stage": "expecting", "child_age_ranges": [],
            "suburb": "Carlton", "postcode": "3053", "state": "VIC",
            "latitude": -37.8036, "longitude": 144.9665,
            "interests": ["Breastfeeding", "Mental Health", "Toddler Activities"]
        },
        "role": "Expecting mum",
    },
    {
        "name": "Tom Walker", "email": "tom.walker@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "TomW", "bio": "Single dad to a 3yo. We're a team of two and we're doing great.",
            "parenting_stage": "toddler", "child_age_ranges": ["toddler"],
            "suburb": "Fitzroy", "postcode": "3065", "state": "VIC",
            "latitude": -37.7985, "longitude": 144.9775,
            "interests": ["Dad Talk", "Toddler Activities", "Mental Health"]
        },
        "role": "Single dad, toddler",
    },
    {
        "name": "Emma Clarke", "email": "emma.clarke@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "EmmaC", "bio": "Mum of 3 (7, 5, 2). Veteran parent here to share what I've learned!",
            "parenting_stage": "school_age", "child_age_ranges": ["school_age", "toddler"],
            "suburb": "New Farm", "postcode": "4005", "state": "QLD",
            "latitude": -27.4665, "longitude": 153.0485,
            "interests": ["School Age", "Development Milestones", "Local Events"]
        },
        "role": "Experienced mum, 3 kids",
    },
    {
        "name": "Liam O'Brien", "email": "liam.obrien@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "LiamO", "bio": "Stay-at-home dad while my wife works. Best gig I've ever had.",
            "parenting_stage": "newborn", "child_age_ranges": ["newborn"],
            "suburb": "Paddington", "postcode": "4064", "state": "QLD",
            "latitude": -27.4604, "longitude": 153.0136,
            "interests": ["Dad Talk", "Breastfeeding", "Sleep Training"]
        },
        "role": "Stay-at-home dad, newborn",
    },
    {
        "name": "Aisha Patel", "email": "aisha.patel@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "Aisha", "bio": "Midwife and mum to a 1yo. Happy to help with any birth/postpartum questions!",
            "parenting_stage": "infant", "child_age_ranges": ["infant"],
            "suburb": "Fremantle", "postcode": "6160", "state": "WA",
            "latitude": -32.0569, "longitude": 115.7439,
            "interests": ["Breastfeeding", "Mental Health", "Development Milestones"],
        },
        "role": "Midwife + mum, infant",
    },
    {
        "name": "Rachel Thompson", "email": "rachel.thompson@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "RachelT", "bio": "Single mum, solo parenting since day one. It's hard but we're thriving.",
            "parenting_stage": "toddler", "child_age_ranges": ["toddler", "infant"],
            "suburb": "Glenelg", "postcode": "5045", "state": "SA",
            "latitude": -34.9825, "longitude": 138.5165,
            "interests": ["Mental Health", "Sleep Training", "Toddler Activities"]
        },
        "role": "Single mum, toddler + infant",
    },
    {
        "name": "Marcus Hill", "email": "marcus.hill@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "MarcusH", "bio": "Dad-to-be in 6 weeks. Terrified and reading everything I can!",
            "parenting_stage": "expecting", "child_age_ranges": [],
            "suburb": "Kingston", "postcode": "2604", "state": "ACT",
            "latitude": -35.3228, "longitude": 149.1395,
            "interests": ["Dad Talk", "Breastfeeding", "Mental Health"]
        },
        "role": "Expecting dad",
    },
    {
        "name": "Mei Chen", "email": "mei.chen@test.village", "password": "Test1234!",
        "profile": {
            "nickname": "MeiC", "bio": "Mum to a teenager and a toddler - opposite ends of the spectrum!",
            "parenting_stage": "mixed", "child_age_ranges": ["school_age", "toddler"],
            "suburb": "Hobart", "postcode": "7000", "state": "TAS",
            "latitude": -42.8821, "longitude": 147.3272,
            "interests": ["School Age", "Mental Health", "Relationships"]
        },
        "role": "Mum, teen + toddler",
    },
]

FORUM_POSTS = [
    {
        "user_idx": 0,
        "title": "4am feed club - anyone else awake right now?",
        "content": "Baby just won't settle after feeds. Tried everything. Send help (and coffee).",
        "category_name": "Feeding Circle",
        "is_anonymous": False,
    },
    {
        "user_idx": 2,
        "title": "What to pack in your hospital bag? First time mum here",
        "content": "I keep seeing different lists online. What did you actually USE vs what stayed in the bag?",
        "category_name": "Mental Health Circle",
        "is_anonymous": False,
    },
    {
        "user_idx": 3,
        "title": "Single dad checking in - anyone else flying solo?",
        "content": "It's just me and my little one. Some days are amazing, some days I cry in the car. Both are valid.",
        "category_name": "Single Parent Circle",
        "is_anonymous": False,
    },
    {
        "user_idx": 1,
        "title": "Boys and emotions - how do you teach them it's ok to cry?",
        "content": "My 7yo got teased at school for crying. I want him to know it's totally fine but don't want to make it worse.",
        "category_name": "Dad Circle",
        "is_anonymous": False,
    },
    {
        "user_idx": 7,
        "title": "Struggling with PND but scared to tell anyone IRL",
        "content": "It's been 6 months and I still don't feel like myself. Does this ever get better?",
        "category_name": "Mental Health Circle",
        "is_anonymous": True,
    },
    {
        "user_idx": 8,
        "title": "Dads at birth - what's your role actually?",
        "content": "6 weeks out and genuinely don't know what I'm supposed to do in that room. Any dads been through this?",
        "category_name": "Dad Circle",
        "is_anonymous": False,
    },
    {
        "user_idx": 9,
        "title": "Managing a teen AND a toddler - anyone else?",
        "content": "One needs independence, the other needs me every 5 minutes. My house is chaos but I love it.",
        "category_name": "Relationships",
        "is_anonymous": False,
    },
]

CHAT_MESSAGES = [
    {"user_idx": 0, "room_name": "3am Club", "content": "Anyone else up? 3:47am feed number 4 tonight"},
    {"user_idx": 1, "room_name": "3am Club", "content": "Used to be me 2 years ago. Hang in there, it does get better!"},
    {"user_idx": 4, "room_name": "3am Club", "content": "Still remember those nights. You've got this!"},
    {"user_idx": 5, "room_name": "Dad Chat", "content": "Morning crew! Any other stay-at-home dads here?"},
    {"user_idx": 3, "room_name": "Dad Chat", "content": "Right here mate. Single dad gang!"},
    {"user_idx": 8, "room_name": "Dad Chat", "content": "Expecting dad here, lurking and learning"},
    {"user_idx": 1, "room_name": "Dad Chat", "content": "Welcome Marcus! We were all terrified once."},
    {"user_idx": 2, "room_name": "Morning Coffee", "content": "34 weeks and can't sleep. Good morning everyone"},
    {"user_idx": 4, "room_name": "Morning Coffee", "content": "Good morning! Enjoy that last sleep while you can haha"},
    {"user_idx": 6, "room_name": "New Parents Welcome", "content": "Hi everyone! Midwife here - happy to answer any birth/newborn questions"},
]


def ok(label):   RESULTS.append(("PASS", label))
def fail(label, detail=""): RESULTS.append(("FAIL", label + (f" -- {detail}" if detail else "")))
def warn(label, detail=""): RESULTS.append(("WARN", label + (f" -- {detail}" if detail else "")))
def info(label): RESULTS.append(("INFO", label))


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def register_user(token_client: httpx.AsyncClient, user_def: dict):
    """Register or login, return JWT token."""
    reg = await token_client.post(f"{BASE}/auth/register", json={
        "email": user_def["email"],
        "name": user_def["name"],
        "password": user_def["password"],
    })
    if reg.status_code == 200:
        return reg.json().get("token")
    elif reg.status_code == 400 and "already registered" in reg.text:
        login = await token_client.post(f"{BASE}/auth/login", json={
            "email": user_def["email"],
            "password": user_def["password"],
        })
        if login.status_code == 200:
            return login.json().get("token")
    return None


async def setup_profile(client: httpx.AsyncClient, token: str, user_def: dict):
    prof = await client.put(f"{BASE}/users/profile",
                            json=user_def["profile"],
                            headers=auth_headers(token))
    return prof.status_code == 200


async def main():
    print("=" * 62)
    print("THE VILLAGE -- INTERACTIVE ENVIRONMENT TEST")
    print(f"Started: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 62)

    plain = httpx.AsyncClient(timeout=20)
    sessions = []  # list of (user_def, token, user_info)

    # ── PHASE 1: Register all 10 users ──────────────────────────
    print("\n[1/7] Registering & profiling 10 users...")
    for user_def in USERS:
        token = await register_user(plain, user_def)
        if not token:
            fail(f"Auth failed: {user_def['name']}")
            sessions.append((user_def, None, None))
            continue

        # Get user info
        me = await plain.get(f"{BASE}/auth/me", headers=auth_headers(token))
        if me.status_code != 200:
            fail(f"auth/me failed: {user_def['name']}", me.text[:60])
            sessions.append((user_def, None, None))
            continue
        user_info = me.json()

        # Set profile
        profiled = await setup_profile(plain, token, user_def)
        if profiled:
            ok(f"Registered + profiled: {user_def['name']} ({user_def['role']})")
        else:
            warn(f"Registered but profile partial: {user_def['name']}")

        sessions.append((user_def, token, user_info))
        await asyncio.sleep(0.15)

    active = [(u, t, i) for u, t, i in sessions if t and i]
    print(f"  -> {len(active)}/10 users active with tokens")

    # ── PHASE 2: Verify profiles ─────────────────────────────────
    print("\n[2/7] Verifying stored profiles...")
    profile_fields_ok = 0
    for user_def, token, user_info in active:
        me = await plain.get(f"{BASE}/auth/me", headers=auth_headers(token))
        if me.status_code == 200:
            d = me.json()
            has_suburb = bool(d.get("suburb"))
            has_stage = bool(d.get("parenting_stage"))
            has_interests = len(d.get("interests") or []) > 0
            if has_suburb and has_stage:
                profile_fields_ok += 1
                ok(f"Profile complete: {user_def['name']} | suburb={d.get('suburb')} stage={d.get('parenting_stage')} interests={len(d.get('interests') or [])}")
            else:
                warn(f"Profile incomplete: {user_def['name']} | suburb={has_suburb} stage={has_stage} interests={has_interests}")
        else:
            fail(f"Profile fetch failed: {user_def['name']}")
    info(f"{profile_fields_ok}/{len(active)} users have complete profiles (suburb + stage)")

    # ── PHASE 3: Forum categories + posts ───────────────────────
    print("\n[3/7] Forum posts...")
    first_token = active[0][1] if active else None
    cat_res = await plain.get(f"{BASE}/forums/categories", headers=auth_headers(first_token))
    cat_map = {}
    if cat_res.status_code == 200:
        cats = cat_res.json()
        cat_map = {c["name"]: c["category_id"] for c in cats}
        info(f"Forum categories ({len(cat_map)}): {', '.join(cat_map.keys())}")
        for expected in ["Dad Circle", "Single Parent Circle", "Mental Health Circle", "Feeding Circle"]:
            if expected in cat_map:
                ok(f"Category exists: {expected}")
            else:
                fail(f"Category MISSING: {expected}")
    else:
        fail("Forum categories endpoint returned error", cat_res.text[:80])

    post_ids = []
    for post_def in FORUM_POSTS:
        idx = post_def["user_idx"]
        if idx >= len(sessions): continue
        user_def, token, user_info = sessions[idx]
        if not token: continue
        cat_id = cat_map.get(post_def["category_name"])
        if not cat_id:
            warn(f"Category not found for post: {post_def['category_name']}")
            continue
        res = await plain.post(f"{BASE}/forums/posts",
            json={
                "title": post_def["title"],
                "content": post_def["content"],
                "category_id": cat_id,
                "is_anonymous": post_def.get("is_anonymous", False),
                "tags": [],
            },
            headers=auth_headers(token)
        )
        if res.status_code == 200:
            pid = res.json().get("post_id")
            anon = " [anon]" if post_def.get("is_anonymous") else ""
            ok(f"Post created{anon} by {user_def['name']}: \"{post_def['title'][:50]}\"")
            post_ids.append((pid, user_def, token))
        else:
            fail(f"Post failed for {user_def['name']}", res.text[:100])
        await asyncio.sleep(0.1)

    # ── PHASE 4: Replies + Likes ─────────────────────────────────
    print("\n[4/7] Replies and likes...")
    if post_ids:
        target_id, _, _ = post_ids[0]

        for user_def, token, user_info in active[1:5]:
            reply = await plain.post(f"{BASE}/forums/posts/{target_id}/replies",
                json={"content": f"Sending love! Hang in there -- {user_def['name'].split()[0]}",
                      "is_anonymous": False},
                headers=auth_headers(token)
            )
            if reply.status_code == 200:
                ok(f"Reply by {user_def['name']}")
            else:
                fail(f"Reply by {user_def['name']}", reply.text[:80])

            like = await plain.post(f"{BASE}/forums/posts/{target_id}/like",
                                    headers=auth_headers(token))
            if like.status_code == 200:
                ok(f"Like by {user_def['name']}")
            else:
                warn(f"Like by {user_def['name']}", like.text[:60])
            await asyncio.sleep(0.1)

        # Reply to the anonymous PND post
        if len(post_ids) >= 5:
            pnd_id, _, _ = post_ids[4]
            midwife_def, midwife_token, _ = sessions[6]  # Aisha the midwife
            if midwife_token:
                r = await plain.post(f"{BASE}/forums/posts/{pnd_id}/replies",
                    json={"content": "You are not alone. PND is real and treatable -- please reach out to your GP or call PANDA 1300 726 306.",
                          "is_anonymous": False},
                    headers=auth_headers(midwife_token)
                )
                if r.status_code == 200:
                    ok("Midwife replied to anonymous PND post (sensitive topic flow working)")
                else:
                    fail("Midwife reply to anon post", r.text[:80])

    # Check bookmarking
    if post_ids and active:
        bm_def, bm_token, _ = active[2]
        pid, _, _ = post_ids[0]
        bm = await plain.post(f"{BASE}/forums/posts/{pid}/bookmark",
                              headers=auth_headers(bm_token))
        if bm.status_code == 200:
            ok(f"Bookmark working: {bm_def['name']} bookmarked a post")
        else:
            warn("Bookmark endpoint", bm.text[:60])

    # ── PHASE 5: Chat rooms ─────────────────────────────────────
    print("\n[5/7] Chat rooms...")
    room_res = await plain.get(f"{BASE}/chat/rooms", headers=auth_headers(first_token))
    room_map = {}
    if room_res.status_code == 200:
        data = room_res.json()
        rooms = data.get("all_australia_rooms", [])
        room_map = {r["name"]: r["room_id"] for r in rooms}
        info(f"All-Australia rooms ({len(room_map)}): {', '.join(room_map.keys())}")
        for expected in ["3am Club", "Morning Coffee", "Dad Chat", "New Parents Welcome"]:
            if expected in room_map:
                ok(f"Chat room exists: {expected}")
            else:
                fail(f"Chat room MISSING: {expected}")
    else:
        fail("Chat rooms endpoint", room_res.text[:80])

    chat_ok = 0
    for msg_def in CHAT_MESSAGES:
        idx = msg_def["user_idx"]
        room_id = room_map.get(msg_def["room_name"])
        if not room_id:
            warn(f"Room not found: {msg_def['room_name']}")
            continue
        if idx >= len(sessions): continue
        user_def, token, user_info = sessions[idx]
        if not token: continue
        res = await plain.post(f"{BASE}/chat/rooms/{room_id}/messages",
            json={"content": msg_def["content"]},
            headers=auth_headers(token)
        )
        if res.status_code == 200:
            ok(f"Chat message: {user_def['name']} -> {msg_def['room_name']}: \"{msg_def['content'][:45]}\"")
            chat_ok += 1
        else:
            fail(f"Chat by {user_def['name']}", res.text[:100])
        await asyncio.sleep(0.1)

    # Read back messages
    if "3am Club" in room_map:
        msgs = await plain.get(f"{BASE}/chat/rooms/{room_map['3am Club']}/messages?limit=10",
                               headers=auth_headers(first_token))
        if msgs.status_code == 200 and msgs.json():
            ok(f"Read chat messages: {len(msgs.json())} messages in 3am Club")
        else:
            warn("3am Club message read returned empty")

    # ── PHASE 6: Friends + DM ───────────────────────────────────
    print("\n[6/7] Friend requests and private DM...")
    if len(active) >= 2:
        u1_def, u1_token, u1_info = active[0]  # Sarah
        u2_def, u2_token, u2_info = active[1]  # James

        fr = await plain.post(f"{BASE}/friends/request",
                              json={"to_user_id": u2_info["user_id"]},
                              headers=auth_headers(u1_token))
        if fr.status_code == 200:
            ok(f"Friend request sent: {u1_def['name']} -> {u2_def['name']}")
        else:
            warn("Friend request", fr.text[:80])

        reqs = await plain.get(f"{BASE}/friends/requests", headers=auth_headers(u2_token))
        if reqs.status_code == 200 and reqs.json():
            req_id = reqs.json()[0].get("request_id")
            acc = await plain.post(f"{BASE}/friends/request/{req_id}/accept", headers=auth_headers(u2_token))
            if acc.status_code == 200:
                ok(f"Friend request accepted: {u2_def['name']} accepted {u1_def['name']}")
            else:
                warn("Accept friend request", acc.text[:80])

            # Private DM
            dm = await plain.post(f"{BASE}/chat/rooms/friends",
                                  json={"friend_id": u2_info["user_id"]},
                                  headers=auth_headers(u1_token))
            if dm.status_code == 200:
                dm_room = dm.json()
                ok(f"Private DM room created: {u1_def['name']} <-> {u2_def['name']}")
                msg = await plain.post(f"{BASE}/chat/rooms/{dm_room['room_id']}/messages",
                    json={"content": "Hey! Saw your post about your boys. You're doing amazing!"},
                    headers=auth_headers(u1_token)
                )
                if msg.status_code == 200:
                    ok("Private DM message sent")
                else:
                    fail("Private DM message", msg.text[:80])

                # Test that u2 can also send (bidirectional)
                msg2 = await plain.post(f"{BASE}/chat/rooms/{dm_room['room_id']}/messages",
                    json={"content": "Thanks! Always love connecting with other mums. How old is your little one?"},
                    headers=auth_headers(u2_token)
                )
                if msg2.status_code == 200:
                    ok("DM reply from other user working (bidirectional)")
                else:
                    fail("DM bidirectional", msg2.text[:80])
            else:
                fail("Private DM room creation", dm.text[:80])
        else:
            warn("No friend requests visible for recipient")

        # Also test: send another friend request pair
        u3_def, u3_token, u3_info = active[2]  # Priya
        u4_def, u4_token, u4_info = active[3]  # Tom
        fr2 = await plain.post(f"{BASE}/friends/request",
                               json={"to_user_id": u4_info["user_id"]},
                               headers=auth_headers(u3_token))
        if fr2.status_code == 200:
            reqs2 = await plain.get(f"{BASE}/friends/requests", headers=auth_headers(u4_token))
            if reqs2.status_code == 200 and reqs2.json():
                req_id2 = reqs2.json()[0].get("request_id")
                acc2 = await plain.post(f"{BASE}/friends/request/{req_id2}/accept", headers=auth_headers(u4_token))
                if acc2.status_code == 200:
                    ok(f"Second friend pair: {u3_def['name']} <-> {u4_def['name']}")

    # ── PHASE 7: System features ────────────────────────────────
    print("\n[7/7] Notifications, trending, recommended circles, badges...")
    u_def, u_token, u_info = active[0]

    notifs = await plain.get(f"{BASE}/notifications?limit=10", headers=auth_headers(u_token))
    if notifs.status_code == 200:
        n = notifs.json()
        if n:
            ok(f"Notifications: {len(n)} notification(s) for {u_def['name']} (e.g. '{n[0].get('title','?')}')")
        else:
            warn(f"No notifications generated for {u_def['name']} -- check notification triggers")
    else:
        fail("Notifications endpoint", notifs.text[:60])

    unread = await plain.get(f"{BASE}/notifications/unread-count", headers=auth_headers(u_token))
    if unread.status_code == 200:
        ok(f"Unread count endpoint: {unread.json().get('count', 0)} unread")
    else:
        fail("Unread count endpoint")

    trending = await plain.get(f"{BASE}/forums/posts/trending?limit=5", headers=auth_headers(u_token))
    if trending.status_code == 200:
        posts = trending.json()
        if posts:
            ok(f"Trending posts: {len(posts)} posts returned (top: '{posts[0].get('title','?')[:40]}')")
        else:
            warn("Trending posts returned empty (posts too new?)")
    else:
        fail("Trending posts endpoint")

    recs = await plain.get(f"{BASE}/users/recommended-circles", headers=auth_headers(u_token))
    if recs.status_code == 200:
        circles = recs.json()
        if circles:
            ok(f"Recommended circles: {[c.get('name') for c in circles]}")
        else:
            warn("Recommended circles empty -- may need matching category names in DB")
    else:
        fail("Recommended circles", recs.text[:60])

    badges = await plain.post(f"{BASE}/users/compute-badges", headers=auth_headers(u_token))
    if badges.status_code == 200:
        b = badges.json()
        ok(f"Compute badges: {b}")
    else:
        fail("Compute badges", badges.text[:60])

    # Check suburb room creation
    suburb_res = await plain.post(f"{BASE}/chat/rooms/suburb",
        json={"postcode": "2026", "suburb": "Bondi"},
        headers=auth_headers(u_token)
    )
    if suburb_res.status_code == 200:
        ok("Suburb room creation/fetch: Bondi 2026")
    else:
        warn("Suburb room creation", suburb_res.text[:80])

    # Search for rooms
    search = await plain.get(f"{BASE}/chat/rooms/search?q=2026", headers=auth_headers(u_token))
    if search.status_code == 200:
        data = search.json()
        ok(f"Room search: found {len(data.get('rooms',[]))} rooms for postcode 2026")
    else:
        warn("Room search endpoint", search.text[:60])

    # Check feed / dashboard posts
    feed = await plain.get(f"{BASE}/forums/posts?limit=5", headers=auth_headers(u_token))
    if feed.status_code == 200:
        posts = feed.json()
        ok(f"Feed endpoint: {len(posts)} posts returned")
    else:
        fail("Feed endpoint", feed.text[:60])

    # Bookmarks check
    bookmarks = await plain.get(f"{BASE}/bookmarks", headers=auth_headers(active[2][1]))
    if bookmarks.status_code == 200:
        bm_list = bookmarks.json()
        if bm_list:
            ok(f"Bookmarks: {len(bm_list)} bookmark(s) saved")
        else:
            warn("Bookmarks returned empty")
    else:
        fail("Bookmarks endpoint", bookmarks.text[:60])

    await plain.aclose()

    # ── Final Report ─────────────────────────────────────────────
    print()
    print("=" * 62)
    print("FULL TEST REPORT")
    print("=" * 62)
    pass_list = [(i, l) for i, l in RESULTS if i == "PASS"]
    fail_list = [(i, l) for i, l in RESULTS if i == "FAIL"]
    warn_list = [(i, l) for i, l in RESULTS if i == "WARN"]
    info_list = [(i, l) for i, l in RESULTS if i == "INFO"]

    for icon, label in RESULTS:
        sym = {"PASS": "[PASS]", "FAIL": "[FAIL]", "WARN": "[WARN]", "INFO": "[INFO]"}[icon]
        print(f"  {sym} {label}")

    print()
    print(f"  PASSED : {len(pass_list)}")
    print(f"  FAILED : {len(fail_list)}")
    print(f"  WARNINGS: {len(warn_list)}")
    print("=" * 62)

if __name__ == "__main__":
    asyncio.run(main())
