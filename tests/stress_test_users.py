"""
The Village - Comprehensive API Stress Test
Tests all major features with 20 realistic Australian parent personas.
"""

import requests
import time
import json
import random
import string
from datetime import datetime, timedelta
from typing import Optional

# ==================== CONFIG ====================

BASE_URL = "https://api-dev.ourlittlevillage.com.au/api"
ADMIN_EMAIL = "admin@ourlittlevillage.com.au"
ADMIN_PASSWORD = "VillageAdmin2024!"  # Will attempt; if wrong we skip admin ops

SLOW_THRESHOLD_SECONDS = 2.0
INTER_REQUEST_DELAY = 0.3  # seconds between requests

# ==================== RESULTS TRACKING ====================

results = {
    "successes": [],
    "errors": [],
    "slow_endpoints": [],
    "feature_status": {},
    "timing": {}
}


def record_success(feature: str, endpoint: str, status_code: int, note: str = ""):
    results["successes"].append({
        "feature": feature,
        "endpoint": endpoint,
        "status_code": status_code,
        "note": note,
        "timestamp": datetime.now().isoformat()
    })
    results["feature_status"][feature] = "OK"


def record_error(feature: str, endpoint: str, status_code: int, response_body: str, note: str = ""):
    results["errors"].append({
        "feature": feature,
        "endpoint": endpoint,
        "status_code": status_code,
        "response_body": response_body[:500] if response_body else "",
        "note": note,
        "timestamp": datetime.now().isoformat()
    })
    if feature not in results["feature_status"]:
        results["feature_status"][feature] = "ERROR"


def timed_request(session: requests.Session, method: str, path: str, feature: str, **kwargs):
    """Make a timed HTTP request and track results."""
    url = f"{BASE_URL}{path}"
    start = time.time()
    try:
        resp = getattr(session, method)(url, timeout=30, **kwargs)
        elapsed = time.time() - start

        # Track slow endpoints
        if elapsed > SLOW_THRESHOLD_SECONDS:
            results["slow_endpoints"].append({
                "endpoint": f"{method.upper()} {path}",
                "feature": feature,
                "elapsed_seconds": round(elapsed, 2)
            })

        # Track timing stats
        key = f"{method.upper()} {path}"
        if key not in results["timing"]:
            results["timing"][key] = []
        results["timing"][key].append(round(elapsed, 2))

        return resp
    except requests.exceptions.RequestException as e:
        record_error(feature, f"{method.upper()} {path}", 0, str(e), "Request failed (network/timeout)")
        return None


def req(session: requests.Session, method: str, path: str, feature: str, expect_2xx: bool = True, **kwargs):
    """Make a request, record success/error, return response."""
    resp = timed_request(session, method, path, feature, **kwargs)
    time.sleep(INTER_REQUEST_DELAY)
    if resp is None:
        return None

    try:
        body = resp.json()
    except Exception:
        body = resp.text

    if expect_2xx and not (200 <= resp.status_code < 300):
        body_str = json.dumps(body) if isinstance(body, dict) else str(body)
        record_error(feature, f"{method.upper()} {path}", resp.status_code, body_str)
    elif 200 <= resp.status_code < 300:
        note = ""
        if isinstance(body, dict):
            note = body.get("message", "")[:100]
        record_success(feature, f"{method.upper()} {path}", resp.status_code, note)

    return resp

# ==================== AUSTRALIAN PERSONAS ====================

PERSONAS = [
    {
        "name": "Sarah Mitchell",
        "email": "sarah.mitchell.village1@example.com",
        "password": "Village2024!",
        "bio": "Mum of two littles in Bondi. Sleep-deprived but loving every moment!",
        "parenting_stage": "toddler",
        "suburb": "Bondi",
        "state": "NSW",
        "postcode": "2026",
        "latitude": -33.8915,
        "longitude": 151.2767,
        "interests": ["sleep training", "breastfeeding", "outdoor activities", "playgroups"],
        "gender": "female",
        "number_of_kids": 2,
        "preferred_reach": "10km"
    },
    {
        "name": "James Nguyen",
        "email": "james.nguyen.village2@example.com",
        "password": "Village2024!",
        "bio": "First-time dad from Fitzroy. Navigating fatherhood one nappy at a time.",
        "parenting_stage": "newborn",
        "suburb": "Fitzroy",
        "state": "VIC",
        "postcode": "3065",
        "latitude": -37.7973,
        "longitude": 144.9784,
        "interests": ["newborn care", "paternity leave", "babywearing", "local playgrounds"],
        "gender": "male",
        "number_of_kids": 1,
        "preferred_reach": "5km"
    },
    {
        "name": "Emma Thompson",
        "email": "emma.thompson.village3@example.com",
        "password": "Village2024!",
        "bio": "Expecting my first bub in July! Living in Paddington, slightly terrified but excited.",
        "parenting_stage": "expecting",
        "suburb": "Paddington",
        "state": "QLD",
        "postcode": "4064",
        "latitude": -27.4607,
        "longitude": 153.0218,
        "interests": ["pregnancy", "birth preparation", "hypnobirthing", "antenatal classes"],
        "gender": "female",
        "number_of_kids": 0,
        "preferred_reach": "10km"
    },
    {
        "name": "Michael O'Brien",
        "email": "michael.obrien.village4@example.com",
        "password": "Village2024!",
        "bio": "Single dad raising my 7-year-old daughter in Subiaco. Proud and loving every challenge.",
        "parenting_stage": "school-age",
        "suburb": "Subiaco",
        "state": "WA",
        "postcode": "6008",
        "latitude": -31.9480,
        "longitude": 115.8270,
        "interests": ["single parenting", "school readiness", "weekend activities", "meal prep"],
        "gender": "male",
        "number_of_kids": 1,
        "is_single_parent": True,
        "preferred_reach": "25km"
    },
    {
        "name": "Priya Sharma",
        "email": "priya.sharma.village5@example.com",
        "password": "Village2024!",
        "bio": "Mum of twins in Glenelg! Double the love, double the chaos. SA mums unite!",
        "parenting_stage": "toddler",
        "suburb": "Glenelg",
        "state": "SA",
        "postcode": "5045",
        "latitude": -34.9810,
        "longitude": 138.5166,
        "interests": ["twins", "sleep training", "toddler tantrums", "playgroups"],
        "gender": "female",
        "number_of_kids": 2,
        "is_multiple_birth": True,
        "preferred_reach": "10km"
    },
    {
        "name": "Daniel Walsh",
        "email": "daniel.walsh.village6@example.com",
        "password": "Village2024!",
        "bio": "Stay-at-home dad in Hobart. Making the most of Tassie life with my preschooler.",
        "parenting_stage": "preschool",
        "suburb": "Sandy Bay",
        "state": "TAS",
        "postcode": "7005",
        "latitude": -42.9017,
        "longitude": 147.3257,
        "interests": ["stay-at-home parenting", "outdoor play", "nature activities", "cooking with kids"],
        "gender": "male",
        "number_of_kids": 1,
        "preferred_reach": "25km"
    },
    {
        "name": "Chloe Anderson",
        "email": "chloe.anderson.village7@example.com",
        "password": "Village2024!",
        "bio": "Newborn mum in Manly, running on coffee and cuddles. Love connecting with other mums!",
        "parenting_stage": "newborn",
        "suburb": "Manly",
        "state": "NSW",
        "postcode": "2095",
        "latitude": -33.7971,
        "longitude": 151.2842,
        "interests": ["newborn care", "breastfeeding", "mother's groups", "baby massage"],
        "gender": "female",
        "number_of_kids": 1,
        "preferred_reach": "5km"
    },
    {
        "name": "Ryan Patel",
        "email": "ryan.patel.village8@example.com",
        "password": "Village2024!",
        "bio": "Dad of three in Essendon. School runs, sports, and surviving the juggle.",
        "parenting_stage": "school-age",
        "suburb": "Essendon",
        "state": "VIC",
        "postcode": "3040",
        "latitude": -37.7490,
        "longitude": 144.9175,
        "interests": ["school activities", "sport", "family budgeting", "cooking"],
        "gender": "male",
        "number_of_kids": 3,
        "preferred_reach": "10km"
    },
    {
        "name": "Grace Kim",
        "email": "grace.kim.village9@example.com",
        "password": "Village2024!",
        "bio": "Mum to a spirited 3yo in New Farm. Looking for fellow toddler-wrangling parents!",
        "parenting_stage": "toddler",
        "suburb": "New Farm",
        "state": "QLD",
        "postcode": "4005",
        "latitude": -27.4651,
        "longitude": 153.0461,
        "interests": ["toddler development", "sensory play", "gentle parenting", "reading"],
        "gender": "female",
        "number_of_kids": 1,
        "preferred_reach": "5km"
    },
    {
        "name": "Tom Bennett",
        "email": "tom.bennett.village10@example.com",
        "password": "Village2024!",
        "bio": "Expecting our second in Fremantle. Partner and I trying to prep our toddler for a sibling!",
        "parenting_stage": "expecting",
        "suburb": "Fremantle",
        "state": "WA",
        "postcode": "6160",
        "latitude": -32.0569,
        "longitude": 115.7472,
        "interests": ["pregnancy", "sibling preparation", "second baby", "birth preferences"],
        "gender": "male",
        "number_of_kids": 1,
        "preferred_reach": "10km"
    },
    {
        "name": "Natalie Russo",
        "email": "natalie.russo.village11@example.com",
        "password": "Village2024!",
        "bio": "Italian-Aussie mum in Leichhardt. Raising multilingual kids and loving it!",
        "parenting_stage": "preschool",
        "suburb": "Leichhardt",
        "state": "NSW",
        "postcode": "2040",
        "latitude": -33.8826,
        "longitude": 151.1568,
        "interests": ["multilingual parenting", "cultural activities", "preschool prep", "foodie family"],
        "gender": "female",
        "number_of_kids": 2,
        "preferred_reach": "10km"
    },
    {
        "name": "Aaron Clarke",
        "email": "aaron.clarke.village12@example.com",
        "password": "Village2024!",
        "bio": "Dad living in Canberra's inner north. Two school-age kids and one on the way!",
        "parenting_stage": "mixed",
        "suburb": "Braddon",
        "state": "ACT",
        "postcode": "2612",
        "latitude": -35.2777,
        "longitude": 149.1329,
        "interests": ["family finances", "school activities", "gardening with kids", "bike riding"],
        "gender": "male",
        "number_of_kids": 3,
        "preferred_reach": "25km"
    },
    {
        "name": "Lily Chan",
        "email": "lily.chan.village13@example.com",
        "password": "Village2024!",
        "bio": "NT mum in Darwin doing it solo. Resilient, resourceful and always looking for support.",
        "parenting_stage": "toddler",
        "suburb": "Fannie Bay",
        "state": "NT",
        "postcode": "0820",
        "latitude": -12.4263,
        "longitude": 130.8399,
        "interests": ["single parenting", "tropical family life", "community support", "beach life"],
        "gender": "female",
        "number_of_kids": 1,
        "is_single_parent": True,
        "preferred_reach": "all"
    },
    {
        "name": "Ben Foster",
        "email": "ben.foster.village14@example.com",
        "password": "Village2024!",
        "bio": "Newborn dad in Byron Bay. Going with the flow with our little one.",
        "parenting_stage": "newborn",
        "suburb": "Byron Bay",
        "state": "NSW",
        "postcode": "2481",
        "latitude": -28.6474,
        "longitude": 153.6120,
        "interests": ["newborn care", "alternative parenting", "attachment parenting", "ocean lifestyle"],
        "gender": "male",
        "number_of_kids": 1,
        "preferred_reach": "25km"
    },
    {
        "name": "Amanda Green",
        "email": "amanda.green.village15@example.com",
        "password": "Village2024!",
        "bio": "Mum in Sunshine Coast juggling work and two kids under 5. Always looking for balance!",
        "parenting_stage": "toddler",
        "suburb": "Noosa Heads",
        "state": "QLD",
        "postcode": "4567",
        "latitude": -26.3881,
        "longitude": 153.0986,
        "interests": ["work-life balance", "childcare", "toddler activities", "fitness"],
        "gender": "female",
        "number_of_kids": 2,
        "preferred_reach": "10km"
    },
    {
        "name": "Chris Martin",
        "email": "chris.martin.village16@example.com",
        "password": "Village2024!",
        "bio": "School dad in Geelong helping out with P&C. Two kids, love sport and community.",
        "parenting_stage": "school-age",
        "suburb": "Geelong",
        "state": "VIC",
        "postcode": "3220",
        "latitude": -38.1480,
        "longitude": 144.3611,
        "interests": ["school community", "sports coaching", "father groups", "family camping"],
        "gender": "male",
        "number_of_kids": 2,
        "preferred_reach": "10km"
    },
    {
        "name": "Sophie Lambert",
        "email": "sophie.lambert.village17@example.com",
        "password": "Village2024!",
        "bio": "Mum of a 6-month-old in Adelaide Hills. In awe of nature and new motherhood.",
        "parenting_stage": "newborn",
        "suburb": "Stirling",
        "state": "SA",
        "postcode": "5152",
        "latitude": -34.9714,
        "longitude": 138.7196,
        "interests": ["newborn sleep", "babywearing", "nature play", "women's health"],
        "gender": "female",
        "number_of_kids": 1,
        "preferred_reach": "25km"
    },
    {
        "name": "Kevin Tran",
        "email": "kevin.tran.village18@example.com",
        "password": "Village2024!",
        "bio": "Vietnamese-Aussie dad in Cabramatta, raising bilingual kids with love.",
        "parenting_stage": "school-age",
        "suburb": "Cabramatta",
        "state": "NSW",
        "postcode": "2166",
        "latitude": -33.8943,
        "longitude": 150.9397,
        "interests": ["multicultural parenting", "language development", "homework help", "Asian cooking"],
        "gender": "male",
        "number_of_kids": 2,
        "preferred_reach": "10km"
    },
    {
        "name": "Rachel Hughes",
        "email": "rachel.hughes.village19@example.com",
        "password": "Village2024!",
        "bio": "First-time mum in Perth's south. Overwhelmed, overjoyed, and googling everything!",
        "parenting_stage": "newborn",
        "suburb": "Applecross",
        "state": "WA",
        "postcode": "6153",
        "latitude": -31.9897,
        "longitude": 115.8480,
        "interests": ["first-time mum", "breastfeeding support", "postpartum recovery", "baby sleep"],
        "gender": "female",
        "number_of_kids": 1,
        "preferred_reach": "10km"
    },
    {
        "name": "David Kowalski",
        "email": "david.kowalski.village20@example.com",
        "password": "Village2024!",
        "bio": "Dad of a preschooler in Townsville. FIFO worker home for the good bits.",
        "parenting_stage": "preschool",
        "suburb": "Townsville",
        "state": "QLD",
        "postcode": "4810",
        "latitude": -19.2590,
        "longitude": 146.8169,
        "interests": ["FIFO parenting", "long-distance parenting", "preschool activities", "quality time"],
        "gender": "male",
        "number_of_kids": 1,
        "preferred_reach": "all"
    },
]

# First 5 users will be marked as premium (via admin endpoint)
PREMIUM_USER_INDICES = [0, 1, 2, 3, 4]

FORUM_CATEGORIES = []  # populated after fetching from API

FORUM_POST_TEMPLATES = [
    {
        "title": "Sleep regression at 4 months - anyone else going through this?",
        "content": "My little one was sleeping 6 hour stretches and now we're back to every 2 hours. Is this the 4-month sleep regression everyone warns about? How long did it last for your bub?",
    },
    {
        "title": "Best playgrounds in the area for toddlers?",
        "content": "We just moved to the area and I'm looking for great playgrounds for my 2-year-old. Bonus points if there's shade and a coffee spot nearby for the parents!",
    },
    {
        "title": "Breastfeeding struggles - when does it get easier?",
        "content": "Currently 6 weeks postpartum and breastfeeding is really hard. Latch issues, supply worries, cracked nipples. I'm determined to continue but I need reassurance it gets better!",
    },
    {
        "title": "Returning to work after mat leave - tips?",
        "content": "Going back to work in 3 weeks after 12 months maternity leave. Feeling so anxious about the transition - for me and my 12 month old. How did you all manage the first few weeks back?",
    },
    {
        "title": "Which childcare centres do you recommend?",
        "content": "We're starting to look at childcare for our toddler. Completely overwhelmed by the options and wait lists. Anyone have recommendations or tips on what to look for during centre tours?",
    },
    {
        "title": "Toddler refusing all vegetables - help!",
        "content": "My 2.5 year old has suddenly become a vegetable hater. She used to eat everything and now it's just pasta and chicken. Trying not to stress but worried about nutrition. Anyone been through this phase?",
    },
    {
        "title": "Partner not pulling his weight - am I being unreasonable?",
        "content": "I do probably 90% of the night wakings, 80% of the household tasks while also managing my part-time job. My partner works full-time and says he's too tired. I love him but I'm running on empty. Any advice?",
    },
    {
        "title": "Preparing a toddler for a new sibling - what actually worked?",
        "content": "We're expecting our second in 4 months and our 3 year old doesn't fully understand what's coming. Looking for books, activities, or approaches that helped your toddler adjust to becoming a big sib.",
    },
    {
        "title": "Local mums coffee group - anyone interested?",
        "content": "Looking to start a casual weekly coffee catch-up for parents in the area. Fridays at 10am somewhere local. Babies and toddlers welcome. DM me if you're keen!",
    },
    {
        "title": "School readiness - is my kid behind?",
        "content": "My 4.5 year old starts kindy next year and everyone around me seems to have kids who can already write their names, count to 50, etc. My kid loves playing but isn't into 'learning stuff' yet. Should I be worried?",
    },
    {
        "title": "Postpartum anxiety - has anyone else experienced this?",
        "content": "I never had anxiety before but since having my baby 3 months ago I'm constantly catastrophising, checking on her breathing at night, scared to drive. Has anyone else experienced this and what helped?",
    },
    {
        "title": "Formula feeding judgement - so over it",
        "content": "I formula feed by choice (tried breastfeeding, wasn't for us) and the amount of unsolicited opinions I get is exhausting. Fed is best, right? Would love to hear from other formula-feeding parents who've dealt with this.",
    },
    {
        "title": "Best family-friendly hikes in the area?",
        "content": "Looking for good walks/hikes that are manageable with a 3yo and a baby in a carrier. Not too long, some shade, ideally some wildlife to spot. What are your favourites?",
    },
    {
        "title": "FIFO parenting - how do you manage?",
        "content": "My partner works FIFO (3 weeks on, 1 week off) and I'm essentially a solo parent most of the time with our 2 kids. Looking for practical tips and mostly just other FIFO families who get it.",
    },
    {
        "title": "Screen time - are we all just making it up as we go?",
        "content": "The guidelines say under 2 = no screens, 2-5 = max 1 hour. But honestly? My 18 month old watches about 45 minutes a day and everyone is happier and saner for it. Anyone else quietly ignoring the guidelines?",
    },
]

REPLY_TEMPLATES = [
    "We went through exactly the same thing! It lasted about 3-4 weeks for us but then things improved dramatically. Hang in there!",
    "Have you tried talking to your maternal health nurse? They were a lifesaver for us when we had similar struggles.",
    "Yes! This is so normal and you're definitely not alone. Every parent I know has been through something similar.",
    "The thing that helped us most was establishing a consistent routine. It took about 2 weeks to kick in but made such a difference.",
    "I feel you! We're going through this right now too. It's exhausting but also kind of reassuring to know others are in the same boat.",
    "Solidarity from Bondi! My second one was so different from my first - totally threw me. You've got this!",
    "My maternal health nurse recommended a book called 'The Wonder Weeks' which really helped us understand what was going on developmentally.",
    "The Tresillian helpline was brilliant for us - free phone support and they really know their stuff.",
    "Have you connected with any local mothers groups? The friendships I made through mine got me through those early months.",
    "Don't be too hard on yourself. Parenting is hard work and there's no perfect answer - just what works for your family!",
    "We found that white noise and a consistent sleep environment made the biggest difference for our bub.",
    "100% recommend getting a referral to a child health nurse if you haven't already. They're fantastic resources.",
    "It gets so much better, I promise. Month 3-4 is often the hardest and then something just clicks.",
    "We tried the PAUSE method (wait 2 minutes before responding to cries) and it genuinely helped without feeling cruel.",
    "Thanks for sharing this - so helpful to hear from someone who's been through it!",
    "Great question, I've been wondering the same thing! Following this thread for tips.",
    "My partner and I had the exact same dynamic early on. We had a really honest conversation about fair share and things slowly improved.",
    "I found a local parents' group on Facebook that has been an amazing support network. Worth searching in your area!",
    "The Raising Children Network website is brilliant for evidence-based info without the judgment.",
    "Totally relate to this! My kid went through a veggie strike for about 8 months. Smoothies saved us - sneak them in!",
]

EVENT_TEMPLATES = [
    {
        "title": "Bondi Mums Morning Tea",
        "description": "Casual morning tea for mums and bubs in Bondi. Bring your little ones and come for a chat over coffee. All parenting stages welcome!",
        "venue_name": "Bondi Beach Cafe",
        "suburb": "Bondi",
        "state": "NSW",
        "postcode": "2026",
        "category": "meetup",
        "time_start": "10:00",
        "time_end": "12:00",
    },
    {
        "title": "Dads Playgroup - Fitzroy",
        "description": "Monthly catch-up for dads and their kids in Fitzroy. Indoor play space, coffee, good conversation. First Sunday of each month.",
        "venue_name": "Fitzroy Community Hall",
        "suburb": "Fitzroy",
        "state": "VIC",
        "postcode": "3065",
        "category": "playgroup",
        "time_start": "09:00",
        "time_end": "11:00",
    },
    {
        "title": "Gentle Parenting Workshop",
        "description": "Learn evidence-based gentle parenting techniques from a qualified early childhood educator. Small group, practical strategies, Q&A included.",
        "venue_name": "Community Learning Centre",
        "suburb": "New Farm",
        "state": "QLD",
        "postcode": "4005",
        "category": "workshop",
        "time_start": "13:00",
        "time_end": "15:30",
    },
    {
        "title": "Baby Sensory & Play Session",
        "description": "Weekly sensory play for babies 0-12 months. Lights, textures, sounds and social time for parents too. $5 donation appreciated.",
        "venue_name": "Subiaco Library",
        "suburb": "Subiaco",
        "state": "WA",
        "postcode": "6008",
        "category": "playgroup",
        "time_start": "10:30",
        "time_end": "11:30",
    },
    {
        "title": "Postpartum Support Circle",
        "description": "Safe, confidential space for new parents experiencing postpartum anxiety or depression. Peer support, no judgement. Facilitated by a registered midwife.",
        "venue_name": "Glenelg Community Health",
        "suburb": "Glenelg",
        "state": "SA",
        "postcode": "5045",
        "category": "support",
        "time_start": "14:00",
        "time_end": "15:30",
    },
]


# ==================== MAIN TEST FUNCTIONS ====================

def print_header(text: str):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")


def print_step(text: str):
    print(f"\n  >> {text}")


def print_ok(text: str):
    print(f"     [OK] {text}")


def print_fail(text: str):
    print(f"     [FAIL] {text}")


def step1_register_users() -> list:
    """Register all 20 personas and return list of (session, user_data, token) tuples."""
    print_header("STEP 1: Registering 20 Users")
    registered_users = []

    for i, persona in enumerate(PERSONAS):
        print_step(f"Registering {persona['name']} ({i+1}/20)")
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})

        resp = req(
            session, "post", "/auth/register", "user_registration",
            json={
                "email": persona["email"],
                "password": persona["password"],
                "name": persona["name"]
            }
        )

        if resp is not None and 200 <= resp.status_code < 300:
            data = resp.json()
            token = data.get("token")
            user_id = data.get("user_id")
            if token:
                session.headers.update({"Authorization": f"Bearer {token}"})
            print_ok(f"Registered: {persona['name']} (id={user_id})")
            registered_users.append({
                "session": session,
                "persona": persona,
                "user_id": user_id,
                "token": token,
                "posts": [],
                "index": i
            })
        elif resp is not None and resp.status_code == 400 and "already registered" in resp.text.lower():
            # User exists - try login
            print_step(f"  User exists, logging in...")
            login_resp = req(
                session, "post", "/auth/login", "user_login",
                json={"email": persona["email"], "password": persona["password"]}
            )
            if login_resp is not None and 200 <= login_resp.status_code < 300:
                data = login_resp.json()
                token = data.get("token")
                user_id = data.get("user_id")
                if token:
                    session.headers.update({"Authorization": f"Bearer {token}"})
                print_ok(f"Logged in: {persona['name']} (id={user_id})")
                registered_users.append({
                    "session": session,
                    "persona": persona,
                    "user_id": user_id,
                    "token": token,
                    "posts": [],
                    "index": i
                })
            else:
                print_fail(f"Failed to login {persona['name']}")
        else:
            print_fail(f"Failed to register {persona['name']}")

    print(f"\n  Registered/Logged in: {len(registered_users)}/20 users")
    return registered_users


def step2_update_profiles(users: list):
    """Update each user's profile with bio, location, interests etc."""
    print_header("STEP 2: Updating User Profiles")

    for user in users:
        persona = user["persona"]
        session = user["session"]
        print_step(f"Updating profile for {persona['name']}")

        profile_data = {
            "bio": persona.get("bio"),
            "parenting_stage": persona.get("parenting_stage"),
            "suburb": persona.get("suburb"),
            "state": persona.get("state"),
            "postcode": persona.get("postcode"),
            "latitude": persona.get("latitude"),
            "longitude": persona.get("longitude"),
            "interests": persona.get("interests", []),
            "gender": persona.get("gender"),
            "number_of_kids": persona.get("number_of_kids"),
            "preferred_reach": persona.get("preferred_reach", "all"),
            "onboarding_complete": True,
        }
        if persona.get("is_single_parent"):
            profile_data["is_single_parent"] = True
        if persona.get("is_multiple_birth"):
            profile_data["is_multiple_birth"] = True

        resp = req(session, "put", "/users/profile", "profile_update", json=profile_data)
        if resp is not None and 200 <= resp.status_code < 300:
            print_ok(f"Profile updated for {persona['name']}")
        else:
            print_fail(f"Profile update failed for {persona['name']}: {resp.status_code if resp is not None else 'no response'}")


def step3_set_premium(users: list, admin_session: Optional[requests.Session]):
    """Set 5 users as Village+ (premium) via admin endpoint."""
    print_header("STEP 3: Setting 5 Users as Village+ (Premium)")

    if not admin_session:
        print_step("No admin session available - skipping premium upgrade via admin")
        record_error("premium_upgrade", "POST /admin/users/{id}/subscription", 0,
                     "No admin credentials available", "Skipped - no admin session")
        return

    for idx in PREMIUM_USER_INDICES:
        if idx >= len(users):
            continue
        user = users[idx]
        user_id = user["user_id"]
        name = user["persona"]["name"]
        print_step(f"Setting {name} as premium (user_id={user_id})")

        resp = req(
            admin_session, "post", f"/admin/users/{user_id}/subscription",
            "premium_upgrade",
            json={"tier": "premium"}
        )
        if resp is not None and 200 <= resp.status_code < 300:
            print_ok(f"{name} is now Village+")
        else:
            body = resp.text if resp is not None else "no response"
            print_fail(f"Failed to upgrade {name}: {body[:200]}")


def step4_get_forum_categories(users: list) -> list:
    """Fetch forum categories for use in post creation."""
    print_header("STEP 4: Fetching Forum Categories")
    if not users:
        return []

    session = users[0]["session"]
    resp = req(session, "get", "/forums/categories", "forum_categories")
    categories = []
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        if isinstance(data, list):
            categories = [c for c in data if c.get("category_id")]
            print_ok(f"Found {len(categories)} categories")
            for c in categories[:5]:
                print(f"       - [{c.get('category_id')}] {c.get('name', 'unknown')} ({c.get('category_type')})")
            if len(categories) > 5:
                print(f"       - ... and {len(categories) - 5} more")
        else:
            print_fail(f"Unexpected response type: {type(data)}")
    else:
        print_fail("Failed to fetch categories")

    return categories


def step5_create_forum_posts(users: list, categories: list) -> list:
    """Have each user create at least 3 posts across different categories."""
    print_header("STEP 5: Creating Forum Posts (3+ per user)")

    all_posts = []
    if not categories:
        print_step("No categories available - creating posts without category filter")
        # Use a fallback if no categories; won't work if categories are required
        return all_posts

    # Filter to only non-community, non-private categories where available
    public_cats = [c for c in categories if not c.get("is_private") and not c.get("invite_only")]
    if not public_cats:
        public_cats = categories  # fallback to all

    for user_idx, user in enumerate(users):
        session = user["session"]
        persona = user["persona"]
        user_posts = []

        # Each user creates 3 posts
        for post_num in range(3):
            # Rotate through categories
            category = public_cats[(user_idx * 3 + post_num) % len(public_cats)]
            template = FORUM_POST_TEMPLATES[(user_idx * 3 + post_num) % len(FORUM_POST_TEMPLATES)]

            post_data = {
                "category_id": category["category_id"],
                "title": template["title"],
                "content": template["content"],
                "suburb": persona.get("suburb"),
                "state": persona.get("state"),
                "postcode": persona.get("postcode"),
            }

            print_step(f"User {persona['name']} creating post {post_num+1}/3: '{template['title'][:40]}...'")
            resp = req(session, "post", "/forums/posts", "forum_post_create", json=post_data)

            if resp is not None and 200 <= resp.status_code < 300:
                post = resp.json()
                post_id = post.get("post_id")
                if post_id:
                    user_posts.append(post)
                    all_posts.append(post)
                    print_ok(f"Post created: {post_id}")
            elif resp is not None and resp.status_code == 429:
                print_fail(f"Rate limited (monthly post limit) for {persona['name']}: {resp.text[:200]}")
                break
            else:
                body = resp.text if resp is not None else "no response"
                print_fail(f"Post creation failed: {resp.status_code if resp is not None else 'N/A'} - {body[:200]}")

        user["posts"] = user_posts

    print(f"\n  Total posts created: {len(all_posts)}")
    return all_posts


def step6_reply_to_posts(users: list, posts: list):
    """Have users reply to each other's posts - every post gets at least 2 replies."""
    print_header("STEP 6: Replying to Posts (2+ replies per post)")

    all_reply_ids = []
    reply_count = 0

    # For each post, have 2 different users (not the author) reply
    for post in posts:
        post_id = post.get("post_id")
        post_author_id = post.get("author_id")
        if not post_id:
            continue

        # Find 2 users who didn't author this post
        repliers = [u for u in users if u.get("user_id") != post_author_id]
        random.shuffle(repliers)
        repliers_to_use = repliers[:2]

        for replier in repliers_to_use:
            reply_content = REPLY_TEMPLATES[reply_count % len(REPLY_TEMPLATES)]
            print_step(f"{replier['persona']['name']} replying to post {post_id}")

            resp = req(
                replier["session"], "post", f"/forums/posts/{post_id}/replies",
                "forum_reply_create",
                json={"content": reply_content}
            )
            if resp is not None and 200 <= resp.status_code < 300:
                reply_data = resp.json()
                reply_id = reply_data.get("reply_id")
                if reply_id:
                    all_reply_ids.append((reply_id, post_id, replier))
                    reply_count += 1
                    print_ok(f"Reply created: {reply_id}")
            elif resp is not None and resp.status_code == 429:
                print_fail(f"Reply limit hit for {replier['persona']['name']}: {resp.text[:200]}")
            else:
                body = resp.text if resp is not None else "no response"
                print_fail(f"Reply failed: {resp.status_code if resp is not None else 'N/A'} - {body[:150]}")

    print(f"\n  Total replies created: {reply_count}")
    return all_reply_ids


def step7_like_posts_and_replies(users: list, posts: list, reply_data: list):
    """Have users like posts and replies."""
    print_header("STEP 7: Liking Posts and Replies")

    like_count = 0

    # Each user likes a random subset of posts (not their own)
    for user in users:
        session = user["session"]
        user_id = user.get("user_id")
        persona = user["persona"]

        # Like 3 random posts (not own)
        other_posts = [p for p in posts if p.get("author_id") != user_id]
        posts_to_like = random.sample(other_posts, min(3, len(other_posts)))

        for post in posts_to_like:
            post_id = post.get("post_id")
            resp = req(session, "post", f"/forums/posts/{post_id}/like", "post_like")
            if resp is not None and 200 <= resp.status_code < 300:
                like_count += 1
                print_ok(f"{persona['name']} liked post {post_id}")
            else:
                body = resp.text if resp is not None else "no response"
                print_fail(f"Like failed: {resp.status_code if resp is not None else 'N/A'} - {body[:100]}")

    # Each user likes a random subset of replies
    for user in users:
        session = user["session"]
        user_id = user.get("user_id")
        persona = user["persona"]

        # Like 2 random replies (not own)
        other_replies = [(rid, pid, ru) for rid, pid, ru in reply_data if ru.get("user_id") != user_id]
        replies_to_like = random.sample(other_replies, min(2, len(other_replies)))

        for reply_id, post_id, _ in replies_to_like:
            resp = req(session, "post", f"/forums/replies/{reply_id}/like", "reply_like")
            if resp is not None and 200 <= resp.status_code < 300:
                like_count += 1
                print_ok(f"{persona['name']} liked reply {reply_id}")
            else:
                body = resp.text if resp is not None else "no response"
                print_fail(f"Reply like failed: {resp.status_code if resp is not None else 'N/A'} - {body[:100]}")

    print(f"\n  Total likes: {like_count}")


def step8_friend_requests(users: list) -> list:
    """Have users send and accept friend requests."""
    print_header("STEP 8: Friend Requests and Acceptances")

    # Create a ring of friendships: each user sends to the next
    # Also a few cross-friendships
    friendship_pairs = []
    request_ids = []  # (request_id, sender_idx, receiver_idx)

    # Ring friendships: 0->1, 1->2, 2->3, ... 19->0
    pairs = [(i, (i + 1) % len(users)) for i in range(len(users))]
    # Extra cross-friendships
    pairs += [(0, 5), (3, 8), (7, 12), (10, 15)]

    for sender_idx, receiver_idx in pairs:
        if sender_idx >= len(users) or receiver_idx >= len(users):
            continue
        sender = users[sender_idx]
        receiver = users[receiver_idx]
        if sender.get("user_id") == receiver.get("user_id"):
            continue

        print_step(f"{sender['persona']['name']} -> friend request -> {receiver['persona']['name']}")
        resp = req(
            sender["session"], "post", "/friends/request", "friend_request_send",
            json={"to_user_id": receiver["user_id"]}
        )

        if resp is not None and 200 <= resp.status_code < 300:
            data = resp.json()
            req_id = data.get("request_id")
            if req_id:
                request_ids.append((req_id, sender_idx, receiver_idx))
                print_ok(f"Request sent: {req_id}")
        elif resp is not None and resp.status_code == 400:
            print_fail(f"Friend request failed (likely duplicate): {resp.text[:150]}")
        else:
            body = resp.text if resp is not None else "no response"
            print_fail(f"Friend request failed: {resp.status_code if resp is not None else 'N/A'} - {body[:150]}")

    # Accept all pending requests from the receiver side
    accepted_count = 0
    for req_id, sender_idx, receiver_idx in request_ids:
        receiver = users[receiver_idx]
        print_step(f"{receiver['persona']['name']} accepting request {req_id}")
        resp = req(
            receiver["session"], "post", f"/friends/request/{req_id}/accept",
            "friend_request_accept"
        )
        if resp is not None and 200 <= resp.status_code < 300:
            accepted_count += 1
            friendship_pairs.append((sender_idx, receiver_idx))
            print_ok(f"Accepted: {req_id}")
        else:
            body = resp.text if resp is not None else "no response"
            print_fail(f"Accept failed: {resp.status_code if resp is not None else 'N/A'} - {body[:150]}")

    print(f"\n  Friend requests sent: {len(request_ids)}, accepted: {accepted_count}")
    return friendship_pairs


def step9_chat_rooms(users: list, friendship_pairs: list):
    """Have users join chat rooms and send messages."""
    print_header("STEP 9: Chat Rooms - Join and Send Messages")

    # First, get all available rooms
    if not users:
        return

    session = users[0]["session"]
    resp = req(session, "get", "/chat/rooms/all", "chat_rooms_list")
    rooms = []
    if resp is not None and 200 <= resp.status_code < 300:
        rooms = resp.json()
        print_ok(f"Found {len(rooms)} all-Australia chat rooms")
    else:
        print_fail("Failed to fetch chat rooms")
        record_error("chat_rooms_list", "GET /chat/rooms/all", resp.status_code if resp is not None else 0,
                     resp.text[:200] if resp is not None else "no response")

    if not rooms:
        print_step("No rooms available - attempting to get rooms with auth")
        resp2 = req(users[0]["session"], "get", "/chat/rooms", "chat_rooms_list_auth")
        if resp2 and 200 <= resp2.status_code < 300:
            data = resp2.json()
            rooms = data.get("all_australia_rooms", [])
            rooms += data.get("nearby_rooms", [])
            if data.get("my_suburb_room"):
                rooms.append(data["my_suburb_room"])
            print_ok(f"Found {len(rooms)} rooms via auth endpoint")

    messages_sent = 0

    # Have first 10 users join and send messages to available rooms
    for user_idx, user in enumerate(users[:10]):
        session = user["session"]
        persona = user["persona"]

        if rooms:
            # Join a room (rotate through rooms)
            room = rooms[user_idx % len(rooms)]
            room_id = room.get("room_id")

            print_step(f"{persona['name']} joining room {room.get('name', room_id)}")
            join_resp = req(session, "post", f"/chat/rooms/{room_id}/join", "chat_room_join")
            if join_resp is not None and 200 <= join_resp.status_code < 300:
                print_ok("Joined room")

                # Send a message
                msg_content = f"Hey everyone! {persona['name']} from {persona.get('suburb', 'Australia')} checking in. {persona.get('bio', '')[:80]}"
                msg_resp = req(
                    session, "post", f"/chat/rooms/{room_id}/messages", "chat_message_send",
                    json={"content": msg_content}
                )
                if msg_resp is not None and 200 <= msg_resp.status_code < 300:
                    messages_sent += 1
                    print_ok(f"Message sent in room {room_id}")
                elif msg_resp is not None and msg_resp.status_code == 429:
                    print_fail(f"Daily chat limit reached for {persona['name']}: {msg_resp.text[:200]}")
                else:
                    body = msg_resp.text if msg_resp is not None else "no response"
                    print_fail(f"Message failed: {msg_resp.status_code if msg_resp is not None else 'N/A'} - {body[:150]}")
            else:
                body = join_resp.text if join_resp is not None else "no response"
                print_fail(f"Join failed: {join_resp.status_code if join_resp is not None else 'N/A'} - {body[:150]}")

    # Test friends-only DM room (requires actual friendship)
    if friendship_pairs and len(friendship_pairs) > 0:
        pair = friendship_pairs[0]
        sender = users[pair[0]]
        friend = users[pair[1]]
        print_step(f"Creating friends DM room between {sender['persona']['name']} and {friend['persona']['name']}")
        dm_resp = req(
            sender["session"], "post", "/chat/rooms/friends", "chat_friends_room",
            json={"friend_id": friend["user_id"]}
        )
        if dm_resp is not None and 200 <= dm_resp.status_code < 300:
            dm_room = dm_resp.json()
            dm_room_id = dm_room.get("room_id")
            if dm_room_id:
                print_ok(f"Friends room created/found: {dm_room_id}")
                # Send a message
                dm_msg = req(
                    sender["session"], "post", f"/chat/rooms/{dm_room_id}/messages", "chat_friends_message",
                    json={"content": "Hey! Great connecting with you on The Village 😊"}
                )
                if dm_msg is not None and 200 <= dm_msg.status_code < 300:
                    messages_sent += 1
                    print_ok("Friends DM sent successfully")
                else:
                    body = dm_msg.text if dm_msg is not None else "no response"
                    print_fail(f"Friends DM failed: {dm_msg.status_code if dm_msg is not None else 'N/A'} - {body[:150]}")
        else:
            body = dm_resp.text if dm_resp is not None else "no response"
            print_fail(f"Friends room creation failed: {dm_resp.status_code if dm_resp is not None else 'N/A'} - {body[:200]}")

    print(f"\n  Chat messages sent: {messages_sent}")


def step10_create_events(users: list):
    """Have users create events."""
    print_header("STEP 10: Creating Events")

    events_created = 0
    today = datetime.now()

    for i, template in enumerate(EVENT_TEMPLATES):
        user = users[i % len(users)]
        session = user["session"]
        persona = user["persona"]

        # Set event date to ~2 weeks from now
        event_date = (today + timedelta(days=14 + i * 3)).strftime("%Y-%m-%d")

        event_data = {
            **template,
            "date": event_date,
            "latitude": persona.get("latitude"),
            "longitude": persona.get("longitude"),
        }

        print_step(f"{persona['name']} creating event: '{template['title']}'")
        resp = req(session, "post", "/events", "event_create", json=event_data)

        if resp is not None and 200 <= resp.status_code < 300:
            event = resp.json()
            events_created += 1
            print_ok(f"Event created: {event.get('event_id')}")
        else:
            body = resp.text if resp is not None else "no response"
            print_fail(f"Event creation failed: {resp.status_code if resp is not None else 'N/A'} - {body[:200]}")

    # Test RSVP to events
    print_step("Testing RSVP to events...")
    event_list_resp = req(users[0]["session"], "get", "/events", "event_list")
    if event_list_resp is not None and 200 <= event_list_resp.status_code < 300:
        event_list = event_list_resp.json()
        events = event_list if isinstance(event_list, list) else event_list.get("events", [])
        for i, event in enumerate(events[:3]):
            event_id = event.get("event_id")
            user = users[(i + 2) % len(users)]
            rsvp_resp = req(user["session"], "post", f"/events/{event_id}/rsvp", "event_rsvp")
            if rsvp_resp is not None and 200 <= rsvp_resp.status_code < 300:
                print_ok(f"{user['persona']['name']} RSVP'd to event {event_id}")
            else:
                body = rsvp_resp.text if rsvp_resp is not None else "no response"
                print_fail(f"RSVP failed: {rsvp_resp.status_code if rsvp_resp is not None else 'N/A'} - {body[:150]}")

    print(f"\n  Events created: {events_created}")


def step11_bookmarks(users: list, posts: list):
    """Have users bookmark/save posts."""
    print_header("STEP 11: Bookmarking Posts")

    bookmark_count = 0

    for user in users[:10]:
        session = user["session"]
        persona = user["persona"]
        user_id = user.get("user_id")

        # Bookmark 2 posts (not own)
        other_posts = [p for p in posts if p.get("author_id") != user_id]
        to_bookmark = random.sample(other_posts, min(2, len(other_posts)))

        for post in to_bookmark:
            post_id = post.get("post_id")
            resp = req(session, "post", f"/forums/posts/{post_id}/bookmark", "post_bookmark")
            if resp is not None and 200 <= resp.status_code < 300:
                bookmark_count += 1
                print_ok(f"{persona['name']} bookmarked post {post_id}")
            else:
                body = resp.text if resp is not None else "no response"
                print_fail(f"Bookmark failed: {resp.status_code if resp is not None else 'N/A'} - {body[:100]}")

    # Test fetching bookmarks
    print_step("Fetching bookmark list for user[0]...")
    resp = req(users[0]["session"], "get", "/bookmarks", "bookmarks_list")
    if resp is not None and 200 <= resp.status_code < 300:
        bookmarks = resp.json()
        print_ok(f"Fetched {len(bookmarks)} bookmarks")
    else:
        print_fail(f"Bookmark list failed: {resp.status_code if resp is not None else 'N/A'}")

    print(f"\n  Total bookmarks: {bookmark_count}")


def step12_search(users: list):
    """Test search functionality."""
    print_header("STEP 12: Search Functionality")

    session = users[0]["session"]
    search_terms = ["sleep", "breastfeeding", "toddler", "playground", "parenting"]

    for term in search_terms:
        print_step(f"Searching for: '{term}'")
        resp = req(session, "get", f"/search?q={term}", "search")
        if resp is not None and 200 <= resp.status_code < 300:
            results_data = resp.json()
            count = len(results_data) if isinstance(results_data, list) else 0
            print_ok(f"Search '{term}' returned {count} results")
        else:
            body = resp.text if resp is not None else "no response"
            print_fail(f"Search failed: {resp.status_code if resp is not None else 'N/A'} - {body[:100]}")

    # Test user search
    print_step("Searching users...")
    resp = req(session, "get", "/users/search?q=Sarah", "user_search")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        users_found = len(data) if isinstance(data, list) else data.get("total", 0)
        print_ok(f"User search returned {users_found} results")
    else:
        body = resp.text if resp is not None else "no response"
        print_fail(f"User search failed: {resp.status_code if resp is not None else 'N/A'} - {body[:100]}")


def step13_notifications(users: list):
    """Test notification generation and retrieval."""
    print_header("STEP 13: Notifications Check")

    for user in users[:5]:
        session = user["session"]
        persona = user["persona"]
        print_step(f"Checking notifications for {persona['name']}")

        # Get all notifications
        resp = req(session, "get", "/notifications", "notifications_list")
        if resp is not None and 200 <= resp.status_code < 300:
            data = resp.json()
            notifs = data if isinstance(data, list) else data.get("notifications", [])
            print_ok(f"{persona['name']} has {len(notifs)} notifications")

            # Check unread count
            count_resp = req(session, "get", "/notifications/unread-count", "notifications_unread_count")
            if count_resp is not None and 200 <= count_resp.status_code < 300:
                count_data = count_resp.json()
                unread = count_data.get("count", count_data.get("unread_count", "unknown"))
                print_ok(f"Unread count: {unread}")

            # Mark all as read
            if notifs:
                mark_resp = req(session, "post", "/notifications/mark-read", "notifications_mark_read", json={})
                if mark_resp is not None and 200 <= mark_resp.status_code < 300:
                    print_ok("Marked all notifications as read")
                else:
                    body = mark_resp.text if mark_resp is not None else "no response"
                    print_fail(f"Mark read failed: {mark_resp.status_code if mark_resp is not None else 'N/A'} - {body[:100]}")
        else:
            body = resp.text if resp is not None else "no response"
            print_fail(f"Notifications failed: {resp.status_code if resp is not None else 'N/A'} - {body[:100]}")


def step14_misc_endpoints(users: list):
    """Test miscellaneous endpoints: feed, subscription status, trending posts."""
    print_header("STEP 14: Miscellaneous Endpoint Tests")

    if not users:
        return

    session = users[0]["session"]
    persona = users[0]["persona"]

    # Test feed
    print_step("Testing /feed endpoint")
    resp = req(session, "get", "/feed", "feed")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        count = len(data) if isinstance(data, list) else data.get("total", 0)
        print_ok(f"Feed returned {count} items")
    else:
        print_fail(f"Feed failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test subscription status
    print_step("Testing /subscription/status endpoint")
    resp = req(session, "get", "/subscription/status", "subscription_status")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        print_ok(f"Subscription: tier={data.get('tier')}, is_premium={data.get('is_premium')}")
    else:
        print_fail(f"Subscription status failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test trending posts
    print_step("Testing /forums/posts/trending endpoint")
    resp = req(session, "get", "/forums/posts/trending", "trending_posts")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        count = len(data) if isinstance(data, list) else data.get("total", 0)
        print_ok(f"Trending posts: {count} results")
    else:
        print_fail(f"Trending posts failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test /auth/me
    print_step("Testing /auth/me endpoint")
    resp = req(session, "get", "/auth/me", "auth_me")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        print_ok(f"/auth/me returned user: {data.get('name', 'unknown')}")
    else:
        print_fail(f"/auth/me failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test location search
    print_step("Testing /location/search endpoint")
    resp = req(session, "get", "/location/search?q=Bondi", "location_search")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        count = len(data.get("results", []))
        print_ok(f"Location search returned {count} results")
    else:
        print_fail(f"Location search failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test friends list
    print_step("Testing /friends endpoint")
    resp = req(session, "get", "/friends", "friends_list")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        count = len(data) if isinstance(data, list) else data.get("total", 0)
        print_ok(f"Friends list: {count} friends")
    else:
        print_fail(f"Friends list failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test messages/conversations
    print_step("Testing /messages/conversations endpoint")
    resp = req(session, "get", "/messages/conversations", "messages_conversations")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        count = len(data) if isinstance(data, list) else data.get("total", 0)
        print_ok(f"Conversations: {count}")
    else:
        print_fail(f"Conversations failed: {resp.status_code if resp is not None else 'N/A'}")

    # Test DM to another user
    if len(users) > 1:
        print_step("Testing direct messages /messages endpoint")
        other_user = users[1]
        dm_resp = req(
            session, "post", "/messages", "direct_message_send",
            json={"receiver_id": other_user["user_id"], "content": "Hi! Great to connect on The Village!"}
        )
        if dm_resp is not None and 200 <= dm_resp.status_code < 300:
            print_ok("Direct message sent successfully")
        else:
            body = dm_resp.text if dm_resp is not None else "no response"
            print_fail(f"DM failed: {dm_resp.status_code if dm_resp is not None else 'N/A'} - {body[:200]}")

    # Test recommended circles
    print_step("Testing /users/recommended-circles endpoint")
    resp = req(session, "get", "/users/recommended-circles", "recommended_circles")
    if resp is not None and 200 <= resp.status_code < 300:
        data = resp.json()
        print_ok(f"Recommended circles returned: {type(data).__name__}")
    else:
        print_fail(f"Recommended circles failed: {resp.status_code if resp is not None else 'N/A'}")


def step15_cleanup_logout(users: list):
    """Log out all users."""
    print_header("STEP 15: Logging Out All Users")
    for user in users:
        session = user["session"]
        persona = user["persona"]
        resp = req(session, "post", "/auth/logout", "logout", expect_2xx=False)
        if resp is not None and 200 <= resp.status_code < 300:
            print_ok(f"Logged out: {persona['name']}")


def get_admin_session() -> Optional[requests.Session]:
    """Attempt to create an admin session."""
    print_header("ADMIN: Attempting Admin Login")
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    # Try register as admin (may fail if exists)
    resp = session.post(
        f"{BASE_URL}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=15
    )
    time.sleep(INTER_REQUEST_DELAY)

    if resp is not None and hasattr(resp, 'status_code') and 200 <= resp.status_code < 300:
        data = resp.json()
        token = data.get("token")
        if token:
            session.headers.update({"Authorization": f"Bearer {token}"})
            print_ok(f"Admin logged in successfully (user_id={data.get('user_id')})")
            # Verify admin access
            verify = session.get(f"{BASE_URL}/admin/analytics", timeout=15)
            if 200 <= verify.status_code < 300:
                print_ok("Admin analytics access confirmed")
                return session
            else:
                print_fail(f"Admin analytics denied ({verify.status_code}) - user may not have admin role")
                record_error("admin_access", "GET /admin/analytics", verify.status_code,
                             verify.text[:200], "Logged in but not admin role")
                return None
    else:
        sc = getattr(resp, 'status_code', 'no response') if resp is not None else 'no response'
        body = resp.text[:200] if resp is not None else ''
        print_fail(f"Admin login failed: {sc} - {body}")
        return None


def generate_report():
    """Generate and print the final report."""
    print_header("FINAL REPORT")

    total_success = len(results["successes"])
    total_errors = len(results["errors"])
    total_slow = len(results["slow_endpoints"])

    print(f"\nSUMMARY")
    print(f"  Total successful requests: {total_success}")
    print(f"  Total errors: {total_errors}")
    print(f"  Slow endpoints (>{SLOW_THRESHOLD_SECONDS}s): {total_slow}")

    # Feature status
    print(f"\nFEATURE STATUS")
    for feature, status in sorted(results["feature_status"].items()):
        icon = "[OK]   " if status == "OK" else "[ERROR]"
        print(f"  {icon} {feature}")

    # Errors breakdown
    if results["errors"]:
        print(f"\nERRORS DETAIL ({total_errors} total)")
        # Group by endpoint
        error_groups = {}
        for err in results["errors"]:
            key = err["endpoint"]
            if key not in error_groups:
                error_groups[key] = []
            error_groups[key].append(err)

        for endpoint, errs in error_groups.items():
            codes = set(e["status_code"] for e in errs)
            sample = errs[0]
            print(f"\n  Endpoint: {endpoint}")
            print(f"    Status codes: {codes}")
            print(f"    Feature: {sample.get('feature')}")
            print(f"    Sample response: {sample.get('response_body', '')[:300]}")
            if sample.get("note"):
                print(f"    Note: {sample.get('note')}")

    # Slow endpoints
    if results["slow_endpoints"]:
        print(f"\nSLOW ENDPOINTS (>{SLOW_THRESHOLD_SECONDS}s)")
        for slow in sorted(results["slow_endpoints"], key=lambda x: x["elapsed_seconds"], reverse=True):
            print(f"  {slow['elapsed_seconds']}s - {slow['endpoint']} ({slow['feature']})")

    # Timing stats
    print(f"\nENDPOINT TIMING STATS (avg seconds)")
    timing_avgs = []
    for endpoint, times in results["timing"].items():
        avg = sum(times) / len(times)
        timing_avgs.append((avg, endpoint, len(times)))
    timing_avgs.sort(reverse=True)
    for avg, endpoint, count in timing_avgs[:20]:
        print(f"  {avg:.2f}s (n={count}) - {endpoint}")

    # Successes by feature
    print(f"\nSUCCESSFUL FEATURES")
    feature_counts = {}
    for s in results["successes"]:
        feat = s["feature"]
        feature_counts[feat] = feature_counts.get(feat, 0) + 1
    for feat, count in sorted(feature_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {count:3d} requests - {feat}")

    # Recommendations
    print(f"\nRECOMMENDATIONS")
    error_features = [f for f, s in results["feature_status"].items() if s == "ERROR"]
    if not error_features:
        print("  All tested features appear functional!")
    else:
        for feat in error_features:
            print(f"  - Investigate {feat}: check API docs and server logs")

    if results["slow_endpoints"]:
        print(f"  - Optimize slow endpoints (see above) - consider DB indexes, query optimisation")

    if total_errors == 0:
        print("\n  OVERALL: API appears healthy - all tested endpoints responded correctly.")
    else:
        pct = round(total_errors / (total_success + total_errors) * 100, 1)
        print(f"\n  OVERALL: {pct}% error rate ({total_errors} errors out of {total_success + total_errors} requests)")

    # Save raw results to JSON
    output_path = "C:/Dev/The Village/village/test_reports/stress_test_results.json"
    try:
        import os
        os.makedirs("C:/Dev/The Village/village/test_reports", exist_ok=True)
        with open(output_path, "w") as f:
            # Remove non-serialisable session objects before dumping
            clean_results = {
                "successes": results["successes"],
                "errors": results["errors"],
                "slow_endpoints": results["slow_endpoints"],
                "feature_status": results["feature_status"],
                "timing": results["timing"],
                "summary": {
                    "total_success": total_success,
                    "total_errors": total_errors,
                    "total_slow": total_slow,
                    "run_at": datetime.now().isoformat()
                }
            }
            json.dump(clean_results, f, indent=2, default=str)
        print(f"\n  Raw results saved to: {output_path}")
    except Exception as e:
        print(f"\n  Could not save results: {e}")


# ==================== MAIN ====================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  THE VILLAGE - COMPREHENSIVE API STRESS TEST")
    print(f"  Target: {BASE_URL}")
    print(f"  Users: {len(PERSONAS)}")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # Attempt admin login for premium upgrades
    admin_session = get_admin_session()

    # Run all test steps
    users = step1_register_users()

    if not users:
        print("\nNo users registered/logged in. Aborting.")
        exit(1)

    step2_update_profiles(users)
    step3_set_premium(users, admin_session)
    categories = step4_get_forum_categories(users)
    posts = step5_create_forum_posts(users, categories)
    reply_data = step6_reply_to_posts(users, posts)
    step7_like_posts_and_replies(users, posts, reply_data)
    friendship_pairs = step8_friend_requests(users)
    step9_chat_rooms(users, friendship_pairs)
    step10_create_events(users)
    step11_bookmarks(users, posts)
    step12_search(users)
    step13_notifications(users)
    step14_misc_endpoints(users)
    step15_cleanup_logout(users)

    generate_report()

    print("\n  Stress test complete!")
