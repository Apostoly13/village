from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import base64
import math
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt
import jwt
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'nightowl-parents-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Resend Email Config
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Image upload config
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

# Australia location config
AUSTRALIAN_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]
DISTANCE_OPTIONS = [
    {"id": "2km", "label": "Super Local", "km": 2},
    {"id": "5km", "label": "Local", "km": 5},
    {"id": "10km", "label": "Nearby", "km": 10},
    {"id": "25km", "label": "25km", "km": 25},
    {"id": "50km", "label": "50km", "km": 50},
    {"id": "100km", "label": "100km", "km": 100},
    {"id": "state", "label": "My State", "km": None},
    {"id": "all", "label": "All Australia", "km": None},
]

# Create the main app
app = FastAPI(title="NightOwl Parents API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str
    picture: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    nickname: Optional[str] = None
    bio: Optional[str] = None
    parenting_stage: Optional[str] = None  # expecting, newborn, toddler, preschool, school-age
    child_age_ranges: List[str] = []  # newborn, infant, toddler, preschool, school-age
    interests: List[str] = []
    location: Optional[str] = None
    gender: Optional[str] = None  # female, male, prefer-not-say
    connect_with: Optional[str] = "all"  # all, mums, dads, single-parents, same
    is_single_parent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    parenting_stage: Optional[str] = None
    child_age_ranges: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    location: Optional[str] = None  # Suburb/area name
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    state: Optional[str] = None  # NSW, VIC, QLD, WA, SA, TAS, ACT, NT
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferred_reach: Optional[str] = None  # 2km, 5km, 10km, 25km, 50km, 100km, state, all
    gender: Optional[str] = None
    connect_with: Optional[str] = None
    is_single_parent: Optional[bool] = None
    picture: Optional[str] = None
    email_preferences: Optional[dict] = None
    onboarding_complete: Optional[bool] = None
    number_of_kids: Optional[int] = None
    kids_ages: Optional[List[str]] = None

class ForumCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    icon: str
    category_type: str  # topic or age_group
    post_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str = Field(default_factory=lambda: f"post_{uuid.uuid4().hex[:12]}")
    category_id: str
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    is_anonymous: bool = False
    is_pinned: bool = False
    is_edited: bool = False
    title: str
    content: str
    image: Optional[str] = None  # Base64 encoded image or URL
    reply_count: int = 0
    like_count: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumPostCreate(BaseModel):
    category_id: str
    title: str
    content: str
    is_anonymous: bool = False
    image: Optional[str] = None  # Base64 encoded image

class ForumReply(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reply_id: str = Field(default_factory=lambda: f"reply_{uuid.uuid4().hex[:12]}")
    post_id: str
    parent_reply_id: Optional[str] = None  # For nested replies
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    is_anonymous: bool = False
    content: str
    like_count: int = 0
    is_edited: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumReplyCreate(BaseModel):
    content: str
    is_anonymous: bool = False
    parent_reply_id: Optional[str] = None  # For nested replies

class ForumPostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class ForumReplyUpdate(BaseModel):
    content: str

class ReportCreate(BaseModel):
    content_type: str  # "post" or "reply"
    content_id: str
    reason: str
    details: Optional[str] = None

class Bookmark(BaseModel):
    model_config = ConfigDict(extra="ignore")
    bookmark_id: str = Field(default_factory=lambda: f"bm_{uuid.uuid4().hex[:12]}")
    user_id: str
    post_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str = Field(default_factory=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user_id: str
    type: str  # "reply", "like", "friend_request", "friend_accepted", "dm"
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    room_id: str = Field(default_factory=lambda: f"room_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    icon: str
    room_type: str = "global"  # global, local, overflow
    region: Optional[str] = None  # UK, US, Australia, Europe, Asia, Other
    parent_room_id: Optional[str] = None  # For overflow rooms
    is_active: bool = True
    active_users: int = 0
    max_capacity: int = 50
    member_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailPreferences(BaseModel):
    notify_replies: bool = True
    notify_dms: bool = True
    notify_friend_requests: bool = True
    weekly_digest: bool = True

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    room_id: str
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    content: str

class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"dm_{uuid.uuid4().hex[:12]}")
    sender_id: str
    receiver_id: str

class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str = Field(default_factory=lambda: f"freq_{uuid.uuid4().hex[:12]}")
    from_user_id: str
    to_user_id: str
    status: str = "pending"  # pending, accepted, declined
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FriendRequestCreate(BaseModel):
    to_user_id: str
    sender_name: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DirectMessageCreate(BaseModel):
    receiver_id: str
    content: str

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conversation_id: str
    other_user_id: str
    other_user_name: str
    other_user_picture: Optional[str] = None
    last_message: str
    last_message_time: datetime
    unread_count: int = 0

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Then check Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (Google OAuth)
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    
    # Try JWT token
    try:
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== EMAIL HELPERS ====================

async def send_email_notification(to_email: str, subject: str, html_content: str):
    """Send email notification using Resend (non-blocking)"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return None
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {result.get('id')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return None

def get_email_template(template_type: str, data: dict) -> tuple:
    """Generate email subject and HTML content based on template type"""
    base_style = """
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background-color: #FDF8F3; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #F5C542 0%, #E5A832 100%); padding: 30px; text-align: center; }
            .header h1 { color: #1A1A2E; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .content h2 { color: #1A1A2E; margin-top: 0; }
            .content p { color: #4A4A4A; line-height: 1.6; }
            .button { display: inline-block; background: #F5C542; color: #1A1A2E; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background: #F5F5F5; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        </style>
    """
    
    if template_type == "reply":
        subject = f"💬 New reply to your post: {data.get('post_title', 'Your post')[:50]}"
        html = f"""
        <html><head>{base_style}</head><body>
        <div class="container">
            <div class="header"><h1>🏡 The Village</h1></div>
            <div class="content">
                <h2>Someone replied to your post!</h2>
                <p><strong>{data.get('replier_name', 'A community member')}</strong> replied to your post "<em>{data.get('post_title', '')}</em>":</p>
                <p style="background: #F5F5F5; padding: 15px; border-radius: 8px; border-left: 4px solid #F5C542;">
                    {data.get('reply_preview', '')[:200]}...
                </p>
                <a href="{data.get('link', '#')}" class="button">View Reply</a>
            </div>
            <div class="footer">You're receiving this because you have email notifications enabled.<br/>The Village - You're not alone on this journey.</div>
        </div>
        </body></html>
        """
    elif template_type == "dm":
        subject = f"📨 New message from {data.get('sender_name', 'Someone')}"
        html = f"""
        <html><head>{base_style}</head><body>
        <div class="container">
            <div class="header"><h1>🏡 The Village</h1></div>
            <div class="content">
                <h2>You have a new message!</h2>
                <p><strong>{data.get('sender_name', 'A community member')}</strong> sent you a direct message:</p>
                <p style="background: #F5F5F5; padding: 15px; border-radius: 8px; border-left: 4px solid #F5C542;">
                    {data.get('message_preview', '')[:200]}...
                </p>
                <a href="{data.get('link', '#')}" class="button">Read Message</a>
            </div>
            <div class="footer">You're receiving this because you have email notifications enabled.<br/>The Village - You're not alone on this journey.</div>
        </div>
        </body></html>
        """
    elif template_type == "friend_request":
        subject = f"👋 {data.get('sender_name', 'Someone')} wants to connect!"
        html = f"""
        <html><head>{base_style}</head><body>
        <div class="container">
            <div class="header"><h1>🏡 The Village</h1></div>
            <div class="content">
                <h2>New friend request!</h2>
                <p><strong>{data.get('sender_name', 'A community member')}</strong> would like to connect with you on The Village.</p>
                <a href="{data.get('link', '#')}" class="button">View Request</a>
            </div>
            <div class="footer">You're receiving this because you have email notifications enabled.<br/>The Village - You're not alone on this journey.</div>
        </div>
        </body></html>
        """
    elif template_type == "weekly_digest":
        subject = "🏡 Your Weekly Village Digest"
        html = f"""
        <html><head>{base_style}</head><body>
        <div class="container">
            <div class="header"><h1>🏡 The Village</h1></div>
            <div class="content">
                <h2>Your Week in The Village</h2>
                <p>Here's what's been happening in your community this week:</p>
                <ul style="color: #4A4A4A; line-height: 2;">
                    <li>📝 <strong>{data.get('new_posts', 0)}</strong> new posts in your favorite categories</li>
                    <li>💬 <strong>{data.get('new_replies', 0)}</strong> replies to discussions</li>
                    <li>🔥 <strong>{data.get('trending_topic', 'Community support')}</strong> is trending</li>
                </ul>
                <a href="{data.get('link', '#')}" class="button">Visit The Village</a>
            </div>
            <div class="footer">You're receiving this weekly digest because you're subscribed.<br/>The Village - You're not alone on this journey.</div>
        </div>
        </body></html>
        """
    else:
        subject = "🏡 Notification from The Village"
        html = f"""
        <html><head>{base_style}</head><body>
        <div class="container">
            <div class="header"><h1>🏡 The Village</h1></div>
            <div class="content">
                <p>{data.get('message', 'You have a new notification.')}</p>
                <a href="{data.get('link', '#')}" class="button">View Details</a>
            </div>
            <div class="footer">The Village - You're not alone on this journey.</div>
        </div>
        </body></html>
        """
    
    return subject, html

# ==================== LOCATION HELPERS ====================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula (returns km)"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

async def geocode_address(address: str, state: str = None) -> dict:
    """Geocode an address using OpenStreetMap Nominatim (free)"""
    try:
        search_query = f"{address}, {state}, Australia" if state else f"{address}, Australia"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": search_query,
                    "format": "json",
                    "limit": 5,
                    "countrycodes": "au",
                    "addressdetails": 1
                },
                headers={"User-Agent": "TheVillage/1.0"}
            )
            if response.status_code == 200:
                results = response.json()
                if results:
                    return {
                        "results": [
                            {
                                "display_name": r.get("display_name"),
                                "lat": float(r.get("lat", 0)),
                                "lon": float(r.get("lon", 0)),
                                "suburb": r.get("address", {}).get("suburb") or r.get("address", {}).get("city") or r.get("address", {}).get("town"),
                                "state": r.get("address", {}).get("state"),
                                "postcode": r.get("address", {}).get("postcode")
                            }
                            for r in results
                        ]
                    }
        return {"results": []}
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return {"results": []}

async def get_users_within_distance(user_lat: float, user_lon: float, distance_km: float, exclude_user_id: str = None) -> List[dict]:
    """Get users within a certain distance"""
    users = await db.users.find(
        {"latitude": {"$exists": True}, "longitude": {"$exists": True}},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    
    nearby_users = []
    for u in users:
        if exclude_user_id and u.get("user_id") == exclude_user_id:
            continue
        if u.get("latitude") and u.get("longitude"):
            dist = calculate_distance(user_lat, user_lon, u["latitude"], u["longitude"])
            if dist <= distance_km:
                u["distance_km"] = round(dist, 1)
                nearby_users.append(u)
    
    return sorted(nearby_users, key=lambda x: x.get("distance_km", 9999))

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "nickname": user_data.name,
        "bio": None,
        "parenting_stage": None,
        "child_age_ranges": [],
        "interests": [],
        "location": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create JWT token
    token = create_jwt_token(user_id)
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "token": token
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"])
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRATION_DAYS * 24 * 60 * 60
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "token": token
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Google OAuth session_id for session data"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id with Emergent Auth
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = resp.json()
    
    # Check if user exists, create if not
    user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if user:
        user_id = user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture")
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "nickname": auth_data["name"],
            "bio": None,
            "parenting_stage": None,
            "child_age_ranges": [],
            "interests": [],
            "location": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Store session
    session_token = auth_data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": auth_data["email"],
        "name": auth_data["name"],
        "picture": auth_data.get("picture"),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "nickname": user.get("nickname"),
        "bio": user.get("bio"),
        "parenting_stage": user.get("parenting_stage"),
        "child_age_ranges": user.get("child_age_ranges", []),
        "interests": user.get("interests", []),
        "location": user.get("location")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== USER PROFILE ENDPOINTS ====================

@api_router.get("/users/single-parents")
async def get_single_parents(user: dict = Depends(get_current_user)):
    """Get list of single parents for connection suggestions"""
    single_parents = await db.users.find(
        {"is_single_parent": True, "user_id": {"$ne": user["user_id"]}},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).limit(20).to_list(20)
    return single_parents

@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/profile")
async def update_profile(profile_data: UserProfileUpdate, user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_fields:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
    
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated

# ==================== FORUM ENDPOINTS ====================

@api_router.get("/forums/categories")
async def get_categories():
    categories = await db.forum_categories.find({}, {"_id": 0}).to_list(100)
    
    # Enhance with additional stats
    for cat in categories:
        # Get recent activity
        recent_post = await db.forum_posts.find_one(
            {"category_id": cat["category_id"]},
            {"_id": 0, "created_at": 1}
        )
        cat["last_activity"] = recent_post["created_at"] if recent_post else None
        
        # Count unique authors in last 7 days
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        pipeline = [
            {"$match": {"category_id": cat["category_id"], "created_at": {"$gte": seven_days_ago}}},
            {"$group": {"_id": "$author_id"}},
            {"$count": "active_users"}
        ]
        result = await db.forum_posts.aggregate(pipeline).to_list(1)
        cat["active_users"] = result[0]["active_users"] if result else 0
    
    return categories

@api_router.get("/forums/categories/{category_id}")
async def get_category(category_id: str):
    category = await db.forum_categories.find_one({"category_id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.get("/forums/posts")
async def get_posts(
    category_id: Optional[str] = None, 
    limit: int = 20, 
    skip: int = 0,
    sort: str = "newest",  # newest, oldest, popular, most_replies, unanswered
    filter_type: Optional[str] = None  # unanswered, trending
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    
    # Apply filters
    if filter_type == "unanswered":
        query["reply_count"] = 0
    elif filter_type == "trending":
        # Trending = posts from last 7 days with high engagement
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query["created_at"] = {"$gte": seven_days_ago}
    
    # Determine sort order
    sort_field = "created_at"
    sort_order = -1  # descending
    
    if sort == "oldest":
        sort_order = 1
    elif sort == "popular":
        sort_field = "like_count"
    elif sort == "most_replies":
        sort_field = "reply_count"
    elif sort == "unanswered":
        query["reply_count"] = 0
        sort_field = "created_at"
    
    posts = await db.forum_posts.find(query, {"_id": 0}).sort(sort_field, sort_order).skip(skip).limit(limit).to_list(limit)
    
    # Get total count for pagination
    total = await db.forum_posts.count_documents(query)
    
    # Mask anonymous posts
    for post in posts:
        if post.get("is_anonymous"):
            post["author_name"] = "Anonymous Parent"
            post["author_picture"] = None
            post["author_id"] = "anonymous"
    
    return {"posts": posts, "total": total, "limit": limit, "skip": skip}

@api_router.get("/forums/posts/trending")
async def get_trending_posts(limit: int = 5):
    """Get trending posts based on recent engagement"""
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    # Calculate trending score: likes + (replies * 2) + (views / 10)
    pipeline = [
        {"$match": {"created_at": {"$gte": seven_days_ago}}},
        {"$addFields": {
            "trending_score": {
                "$add": [
                    {"$ifNull": ["$like_count", 0]},
                    {"$multiply": [{"$ifNull": ["$reply_count", 0]}, 2]},
                    {"$divide": [{"$ifNull": ["$views", 0]}, 10]}
                ]
            }
        }},
        {"$sort": {"trending_score": -1}},
        {"$limit": limit},
        {"$project": {"_id": 0}}
    ]
    
    posts = await db.forum_posts.aggregate(pipeline).to_list(limit)
    
    # Add category info and mask anonymous
    for post in posts:
        category = await db.forum_categories.find_one({"category_id": post["category_id"]}, {"_id": 0})
        post["category_name"] = category["name"] if category else "General"
        post["category_icon"] = category["icon"] if category else "💬"
        
        if post.get("is_anonymous"):
            post["author_name"] = "Anonymous Parent"
            post["author_picture"] = None
            post["author_id"] = "anonymous"
    
    return posts

@api_router.get("/forums/posts/{post_id}")
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment views
    await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"views": 1}})
    
    # Check if user has liked/bookmarked
    user_liked = await db.post_likes.find_one({"post_id": post_id, "user_id": user["user_id"]})
    user_bookmarked = await db.bookmarks.find_one({"post_id": post_id, "user_id": user["user_id"]})
    
    post["user_liked"] = bool(user_liked)
    post["user_bookmarked"] = bool(user_bookmarked)
    
    # Store original author_id for edit/delete check
    original_author_id = post["author_id"]
    post["is_own_post"] = original_author_id == user["user_id"]
    
    if post.get("is_anonymous"):
        post["author_name"] = "Anonymous Parent"
        post["author_picture"] = None
        post["author_id"] = "anonymous"
    
    return post

@api_router.post("/forums/posts")
async def create_post(post_data: ForumPostCreate, user: dict = Depends(get_current_user)):
    post = ForumPost(
        category_id=post_data.category_id,
        author_id=user["user_id"],
        author_name=user.get("nickname") or user["name"],
        author_picture=user.get("picture"),
        is_anonymous=post_data.is_anonymous,
        title=post_data.title,
        content=post_data.content,
        image=post_data.image  # Include image if provided
    )
    
    doc = post.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    await db.forum_posts.insert_one(doc)
    await db.forum_categories.update_one({"category_id": post_data.category_id}, {"$inc": {"post_count": 1}})
    
    result = post.model_dump()
    if post.is_anonymous:
        result["author_name"] = "Anonymous Parent"
        result["author_picture"] = None
        result["author_id"] = "anonymous"
    
    return result

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload an image and return base64 encoded string"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}")
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {MAX_IMAGE_SIZE // (1024*1024)}MB")
    
    # Convert to base64
    base64_image = base64.b64encode(content).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{base64_image}"
    
    return {"image_url": data_url, "filename": file.filename, "size": len(content)}

@api_router.put("/forums/posts/{post_id}")
async def update_post(post_id: str, post_data: ForumPostUpdate, user: dict = Depends(get_current_user)):
    """Update a post (only by author)"""
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["author_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
    
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat(), "is_edited": True}
    if post_data.title:
        update_fields["title"] = post_data.title
    if post_data.content:
        update_fields["content"] = post_data.content
    
    await db.forum_posts.update_one({"post_id": post_id}, {"$set": update_fields})
    
    updated = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    return updated

@api_router.delete("/forums/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete a post (only by author)"""
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post["author_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    # Delete post, its replies, likes, and bookmarks
    await db.forum_posts.delete_one({"post_id": post_id})
    await db.forum_replies.delete_many({"post_id": post_id})
    await db.post_likes.delete_many({"post_id": post_id})
    await db.bookmarks.delete_many({"post_id": post_id})
    
    # Update category post count
    await db.forum_categories.update_one(
        {"category_id": post["category_id"]}, 
        {"$inc": {"post_count": -1}}
    )
    
    return {"message": "Post deleted successfully"}

@api_router.get("/forums/posts/{post_id}/replies")
async def get_replies(post_id: str, user: dict = Depends(get_current_user)):
    replies = await db.forum_replies.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    for reply in replies:
        # Check if user liked this reply
        user_liked = await db.reply_likes.find_one({"reply_id": reply["reply_id"], "user_id": user["user_id"]})
        reply["user_liked"] = bool(user_liked)
        
        # Store original author for edit check
        original_author_id = reply["author_id"]
        reply["is_own_reply"] = original_author_id == user["user_id"]
        
        if reply.get("is_anonymous"):
            reply["author_name"] = "Anonymous Parent"
            reply["author_picture"] = None
            reply["author_id"] = "anonymous"
    
    return replies

@api_router.post("/forums/posts/{post_id}/replies")
async def create_reply(post_id: str, reply_data: ForumReplyCreate, user: dict = Depends(get_current_user)):
    # Check post exists
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # If replying to another reply, verify it exists
    if reply_data.parent_reply_id:
        parent_reply = await db.forum_replies.find_one({"reply_id": reply_data.parent_reply_id})
        if not parent_reply:
            raise HTTPException(status_code=404, detail="Parent reply not found")
    
    reply = ForumReply(
        post_id=post_id,
        parent_reply_id=reply_data.parent_reply_id,
        author_id=user["user_id"],
        author_name=user.get("nickname") or user["name"],
        author_picture=user.get("picture"),
        is_anonymous=reply_data.is_anonymous,
        content=reply_data.content
    )
    
    doc = reply.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.forum_replies.insert_one(doc)
    await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"reply_count": 1}})
    
    # Create notification for post author (if not replying to own post and not anonymous)
    if post["author_id"] != user["user_id"] and not reply_data.is_anonymous:
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": post["author_id"],
            "type": "reply",
            "title": "New reply to your post",
            "message": f"{user.get('nickname') or user['name']} replied to your post: \"{post['title'][:50]}...\"",
            "link": f"/forums/post/{post_id}",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
        # Send email notification if enabled
        post_author = await db.users.find_one({"user_id": post["author_id"]}, {"_id": 0})
        if post_author:
            email_prefs = post_author.get("email_preferences", {})
            if email_prefs.get("notify_replies", True) and post_author.get("email"):
                subject, html = get_email_template("reply", {
                    "replier_name": user.get("nickname") or user["name"],
                    "post_title": post["title"],
                    "reply_preview": reply_data.content,
                    "link": f"https://family-support-17.preview.emergentagent.com/forums/post/{post_id}"
                })
                asyncio.create_task(send_email_notification(post_author["email"], subject, html))
    
    result = reply.model_dump()
    if reply.is_anonymous:
        result["author_name"] = "Anonymous Parent"
        result["author_picture"] = None
        result["author_id"] = "anonymous"
    
    return result

@api_router.put("/forums/replies/{reply_id}")
async def update_reply(reply_id: str, reply_data: ForumReplyUpdate, user: dict = Depends(get_current_user)):
    """Update a reply (only by author)"""
    reply = await db.forum_replies.find_one({"reply_id": reply_id}, {"_id": 0})
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    if reply["author_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this reply")
    
    await db.forum_replies.update_one(
        {"reply_id": reply_id}, 
        {"$set": {"content": reply_data.content, "is_edited": True}}
    )
    
    updated = await db.forum_replies.find_one({"reply_id": reply_id}, {"_id": 0})
    return updated

@api_router.delete("/forums/replies/{reply_id}")
async def delete_reply(reply_id: str, user: dict = Depends(get_current_user)):
    """Delete a reply (only by author)"""
    reply = await db.forum_replies.find_one({"reply_id": reply_id}, {"_id": 0})
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    if reply["author_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reply")
    
    # Delete reply and its likes
    await db.forum_replies.delete_one({"reply_id": reply_id})
    await db.reply_likes.delete_many({"reply_id": reply_id})
    
    # Also delete any nested replies
    await db.forum_replies.delete_many({"parent_reply_id": reply_id})
    
    # Update post reply count
    await db.forum_posts.update_one(
        {"post_id": reply["post_id"]}, 
        {"$inc": {"reply_count": -1}}
    )
    
    return {"message": "Reply deleted successfully"}

@api_router.post("/forums/posts/{post_id}/like")
async def like_post(post_id: str, user: dict = Depends(get_current_user)):
    # Toggle like
    existing = await db.post_likes.find_one({"post_id": post_id, "user_id": user["user_id"]})
    if existing:
        await db.post_likes.delete_one({"post_id": post_id, "user_id": user["user_id"]})
        await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"like_count": -1}})
        return {"liked": False}
    else:
        await db.post_likes.insert_one({"post_id": post_id, "user_id": user["user_id"]})
        await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"like_count": 1}})
        
        # Create notification for post author
        post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
        if post and post["author_id"] != user["user_id"] and not post.get("is_anonymous"):
            notification = {
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": post["author_id"],
                "type": "like",
                "title": "Someone liked your post",
                "message": f"{user.get('nickname') or user['name']} liked your post: \"{post['title'][:50]}\"",
                "link": f"/forums/post/{post_id}",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
        
        return {"liked": True}

@api_router.post("/forums/replies/{reply_id}/like")
async def like_reply(reply_id: str, user: dict = Depends(get_current_user)):
    """Toggle like on a reply"""
    reply = await db.forum_replies.find_one({"reply_id": reply_id}, {"_id": 0})
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    existing = await db.reply_likes.find_one({"reply_id": reply_id, "user_id": user["user_id"]})
    if existing:
        await db.reply_likes.delete_one({"reply_id": reply_id, "user_id": user["user_id"]})
        await db.forum_replies.update_one({"reply_id": reply_id}, {"$inc": {"like_count": -1}})
        return {"liked": False}
    else:
        await db.reply_likes.insert_one({"reply_id": reply_id, "user_id": user["user_id"]})
        await db.forum_replies.update_one({"reply_id": reply_id}, {"$inc": {"like_count": 1}})
        return {"liked": True}

# ==================== BOOKMARKS ENDPOINTS ====================

@api_router.post("/forums/posts/{post_id}/bookmark")
async def toggle_bookmark(post_id: str, user: dict = Depends(get_current_user)):
    """Toggle bookmark on a post"""
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing = await db.bookmarks.find_one({"post_id": post_id, "user_id": user["user_id"]})
    if existing:
        await db.bookmarks.delete_one({"post_id": post_id, "user_id": user["user_id"]})
        return {"bookmarked": False}
    else:
        bookmark = {
            "bookmark_id": f"bm_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "post_id": post_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bookmarks.insert_one(bookmark)
        return {"bookmarked": True}

@api_router.get("/bookmarks")
async def get_bookmarks(user: dict = Depends(get_current_user), limit: int = 20, skip: int = 0):
    """Get user's bookmarked posts"""
    bookmarks = await db.bookmarks.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Fetch full post details
    posts = []
    for bm in bookmarks:
        post = await db.forum_posts.find_one({"post_id": bm["post_id"]}, {"_id": 0})
        if post:
            # Add category info
            category = await db.forum_categories.find_one({"category_id": post["category_id"]}, {"_id": 0})
            post["category_name"] = category["name"] if category else "General"
            post["category_icon"] = category["icon"] if category else "💬"
            post["bookmarked_at"] = bm["created_at"]
            
            if post.get("is_anonymous"):
                post["author_name"] = "Anonymous Parent"
                post["author_picture"] = None
                post["author_id"] = "anonymous"
            
            posts.append(post)
    
    return posts

# ==================== NOTIFICATIONS ENDPOINTS ====================

@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user), limit: int = 20):
    """Get user's notifications"""
    notifications = await db.notifications.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications

@api_router.get("/notifications/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({"user_id": user["user_id"], "is_read": False})
    return {"count": count}

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All notifications marked as read"}

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a single notification as read"""
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "Notification marked as read"}

# ==================== REPORT ENDPOINTS ====================

@api_router.post("/reports")
async def create_report(report_data: ReportCreate, user: dict = Depends(get_current_user)):
    """Report a post or reply"""
    # Verify content exists
    if report_data.content_type == "post":
        content = await db.forum_posts.find_one({"post_id": report_data.content_id})
    elif report_data.content_type == "reply":
        content = await db.forum_replies.find_one({"reply_id": report_data.content_id})
    else:
        raise HTTPException(status_code=400, detail="Invalid content type")
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check if already reported by this user
    existing = await db.reports.find_one({
        "reporter_id": user["user_id"],
        "content_type": report_data.content_type,
        "content_id": report_data.content_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reported this content")
    
    report = {
        "report_id": f"report_{uuid.uuid4().hex[:12]}",
        "reporter_id": user["user_id"],
        "content_type": report_data.content_type,
        "content_id": report_data.content_id,
        "reason": report_data.reason,
        "details": report_data.details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report)
    
    return {"message": "Report submitted successfully", "report_id": report["report_id"]}

# ==================== CHAT ROOM ENDPOINTS ====================

REGIONS = ["UK", "US", "Australia", "Europe", "Asia", "Other"]
ROOM_MAX_CAPACITY = 50

@api_router.get("/chat/rooms")
async def get_chat_rooms(user: dict = Depends(get_current_user), region: Optional[str] = None):
    """Get chat rooms - prioritizes user's local rooms, then global"""
    user_region = user.get("region") or region
    
    # Get all active rooms
    all_rooms = await db.chat_rooms.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    # Categorize rooms
    local_rooms = []
    global_rooms = []
    
    for room in all_rooms:
        room_type = room.get("room_type", "global")
        room_region = room.get("region")
        
        if room_type == "local" and room_region == user_region:
            local_rooms.append(room)
        elif room_type == "global" or room_type == "overflow":
            global_rooms.append(room)
    
    return {
        "local_rooms": local_rooms,
        "global_rooms": global_rooms,
        "user_region": user_region,
        "available_regions": REGIONS
    }

@api_router.get("/chat/rooms/all")
async def get_all_chat_rooms():
    """Get all chat rooms without authentication (for display purposes)"""
    rooms = await db.chat_rooms.find({"is_active": True, "room_type": "global"}, {"_id": 0}).to_list(50)
    return rooms

@api_router.get("/chat/rooms/{room_id}")
async def get_chat_room(room_id: str):
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    return room

@api_router.post("/chat/rooms/{room_id}/join")
async def join_chat_room(room_id: str, user: dict = Depends(get_current_user)):
    """Join a chat room and track active users"""
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    # Update active users count
    await db.chat_rooms.update_one(
        {"room_id": room_id},
        {"$inc": {"active_users": 1}}
    )
    
    # Check if room needs overflow
    updated_room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if updated_room.get("active_users", 0) > ROOM_MAX_CAPACITY:
        # Create overflow room if needed
        overflow_count = await db.chat_rooms.count_documents({
            "parent_room_id": room_id,
            "room_type": "overflow"
        })
        
        if overflow_count < 5:  # Max 5 overflow rooms
            overflow_room = {
                "room_id": f"room_{uuid.uuid4().hex[:12]}",
                "name": f"{room['name']} (Room {overflow_count + 2})",
                "description": room["description"],
                "icon": room["icon"],
                "room_type": "overflow",
                "region": room.get("region"),
                "parent_room_id": room_id,
                "is_active": True,
                "active_users": 0,
                "max_capacity": ROOM_MAX_CAPACITY,
                "member_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.chat_rooms.insert_one(overflow_room)
            return {"message": "Joined room", "overflow_created": True, "overflow_room": overflow_room}
    
    return {"message": "Joined room", "room": updated_room}

@api_router.post("/chat/rooms/{room_id}/leave")
async def leave_chat_room(room_id: str, user: dict = Depends(get_current_user)):
    """Leave a chat room"""
    await db.chat_rooms.update_one(
        {"room_id": room_id, "active_users": {"$gt": 0}},
        {"$inc": {"active_users": -1}}
    )
    return {"message": "Left room"}

@api_router.get("/chat/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, limit: int = 50, before: Optional[str] = None):
    query = {"room_id": room_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return list(reversed(messages))

@api_router.post("/chat/rooms/{room_id}/messages")
async def send_room_message(room_id: str, message_data: ChatMessageCreate, user: dict = Depends(get_current_user)):
    # Verify room exists
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    message = ChatMessage(
        room_id=room_id,
        author_id=user["user_id"],
        author_name=user.get("nickname") or user["name"],
        author_picture=user.get("picture"),
        content=message_data.content
    )
    
    doc = message.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.chat_messages.insert_one(doc)
    
    return message.model_dump()

# ==================== DIRECT MESSAGE ENDPOINTS ====================

@api_router.get("/messages/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    
    # Get all messages involving this user
    pipeline = [
        {"$match": {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {
                "$cond": [
                    {"$eq": ["$sender_id", user_id]},
                    "$receiver_id",
                    "$sender_id"
                ]
            },
            "last_message": {"$first": "$content"},
            "last_message_time": {"$first": "$created_at"},
            "unread_count": {
                "$sum": {
                    "$cond": [
                        {"$and": [{"$eq": ["$receiver_id", user_id]}, {"$eq": ["$is_read", False]}]},
                        1,
                        0
                    ]
                }
            }
        }}
    ]
    
    conversations_raw = await db.direct_messages.aggregate(pipeline).to_list(50)
    
    # Get user info for each conversation
    conversations = []
    for conv in conversations_raw:
        other_user_id = conv["_id"]
        other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0})
        if other_user:
            conversations.append({
                "conversation_id": f"{min(user_id, other_user_id)}_{max(user_id, other_user_id)}",
                "other_user_id": other_user_id,
                "other_user_name": other_user.get("nickname") or other_user["name"],
                "other_user_picture": other_user.get("picture"),
                "last_message": conv["last_message"],
                "last_message_time": conv["last_message_time"],
                "unread_count": conv["unread_count"]
            })
    
    return sorted(conversations, key=lambda x: x["last_message_time"], reverse=True)

@api_router.get("/messages/{other_user_id}")
async def get_direct_messages(other_user_id: str, user: dict = Depends(get_current_user)):
    user_id = user["user_id"]
    
    messages = await db.direct_messages.find({
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    # Mark messages as read
    await db.direct_messages.update_many(
        {"sender_id": other_user_id, "receiver_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return messages

@api_router.post("/messages")
async def send_direct_message(message_data: DirectMessageCreate, user: dict = Depends(get_current_user)):
    # Verify receiver exists
    receiver = await db.users.find_one({"user_id": message_data.receiver_id}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    message = DirectMessage(
        sender_id=user["user_id"],
        receiver_id=message_data.receiver_id,
        sender_name=user.get("nickname") or user["name"],
        content=message_data.content
    )
    
    doc = message.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.direct_messages.insert_one(doc)
    
    # Create notification for receiver
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": message_data.receiver_id,
        "type": "dm",
        "title": "New message",
        "message": f"{user.get('nickname') or user['name']} sent you a message",
        "link": f"/messages/{user['user_id']}",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Send email notification if enabled
    email_prefs = receiver.get("email_preferences", {})
    if email_prefs.get("notify_dms", True) and receiver.get("email"):
        subject, html = get_email_template("dm", {
            "sender_name": user.get("nickname") or user["name"],
            "message_preview": message_data.content,
            "link": f"https://family-support-17.preview.emergentagent.com/messages/{user['user_id']}"
        })
        asyncio.create_task(send_email_notification(receiver["email"], subject, html))
    
    return message.model_dump()

# ==================== FRIENDS ENDPOINTS ====================

@api_router.post("/friends/request")
async def send_friend_request(request_data: FriendRequestCreate, user: dict = Depends(get_current_user)):
    """Send a friend request to another user"""
    to_user_id = request_data.to_user_id
    from_user_id = user["user_id"]
    
    # Can't friend yourself
    if to_user_id == from_user_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if target user exists
    target = await db.users.find_one({"user_id": to_user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already friends
    existing_friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": from_user_id, "user2_id": to_user_id},
            {"user1_id": to_user_id, "user2_id": from_user_id}
        ]
    })
    if existing_friendship:
        raise HTTPException(status_code=400, detail="Already friends with this user")
    
    # Check if request already exists
    existing_request = await db.friend_requests.find_one({
        "$or": [
            {"from_user_id": from_user_id, "to_user_id": to_user_id, "status": "pending"},
            {"from_user_id": to_user_id, "to_user_id": from_user_id, "status": "pending"}
        ]
    })
    if existing_request:
        raise HTTPException(status_code=400, detail="Friend request already pending")
    
    # Create friend request
    request = FriendRequest(
        from_user_id=from_user_id,
        to_user_id=to_user_id
    )
    doc = request.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.friend_requests.insert_one(doc)
    
    # Create notification for target user
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": to_user_id,
        "type": "friend_request",
        "title": "New friend request",
        "message": f"{user.get('nickname') or user['name']} wants to connect with you",
        "link": "/friends",
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    # Send email notification if enabled
    email_prefs = target.get("email_preferences", {})
    if email_prefs.get("notify_friend_requests", True) and target.get("email"):
        subject, html = get_email_template("friend_request", {
            "sender_name": user.get("nickname") or user["name"],
            "link": "https://family-support-17.preview.emergentagent.com/friends"
        })
        asyncio.create_task(send_email_notification(target["email"], subject, html))
    
    return {"message": "Friend request sent", "request_id": request.request_id}

@api_router.get("/friends/requests")
async def get_friend_requests(user: dict = Depends(get_current_user)):
    """Get pending friend requests for current user"""
    requests = await db.friend_requests.find(
        {"to_user_id": user["user_id"], "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    # Add sender info
    for req in requests:
        sender = await db.users.find_one({"user_id": req["from_user_id"]}, {"_id": 0, "password_hash": 0, "email": 0})
        req["from_user"] = sender
    
    return requests

@api_router.get("/friends/sent")
async def get_sent_requests(user: dict = Depends(get_current_user)):
    """Get friend requests sent by current user"""
    requests = await db.friend_requests.find(
        {"from_user_id": user["user_id"], "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    return requests

@api_router.post("/friends/request/{request_id}/accept")
async def accept_friend_request(request_id: str, user: dict = Depends(get_current_user)):
    """Accept a friend request"""
    request = await db.friend_requests.find_one(
        {"request_id": request_id, "to_user_id": user["user_id"], "status": "pending"},
        {"_id": 0}
    )
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Update request status
    await db.friend_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Create friendship
    await db.friendships.insert_one({
        "user1_id": request["from_user_id"],
        "user2_id": request["to_user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Friend request accepted"}

@api_router.post("/friends/request/{request_id}/decline")
async def decline_friend_request(request_id: str, user: dict = Depends(get_current_user)):
    """Decline a friend request"""
    request = await db.friend_requests.find_one(
        {"request_id": request_id, "to_user_id": user["user_id"], "status": "pending"},
        {"_id": 0}
    )
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friend_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "declined"}}
    )
    
    return {"message": "Friend request declined"}

@api_router.get("/friends")
async def get_friends(user: dict = Depends(get_current_user)):
    """Get list of friends for current user"""
    friendships = await db.friendships.find({
        "$or": [
            {"user1_id": user["user_id"]},
            {"user2_id": user["user_id"]}
        ]
    }, {"_id": 0}).to_list(100)
    
    friends = []
    for friendship in friendships:
        friend_id = friendship["user2_id"] if friendship["user1_id"] == user["user_id"] else friendship["user1_id"]
        friend = await db.users.find_one({"user_id": friend_id}, {"_id": 0, "password_hash": 0, "email": 0})
        if friend:
            friend["friendship_date"] = friendship["created_at"]
            friends.append(friend)
    
    return friends

@api_router.get("/friends/status/{other_user_id}")
async def get_friendship_status(other_user_id: str, user: dict = Depends(get_current_user)):
    """Check friendship status with another user"""
    user_id = user["user_id"]
    
    # Check if already friends
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user_id, "user2_id": other_user_id},
            {"user1_id": other_user_id, "user2_id": user_id}
        ]
    })
    if friendship:
        return {"status": "friends"}
    
    # Check for pending request from current user
    sent_request = await db.friend_requests.find_one({
        "from_user_id": user_id, "to_user_id": other_user_id, "status": "pending"
    })
    if sent_request:
        return {"status": "request_sent", "request_id": sent_request["request_id"]}
    
    # Check for pending request to current user
    received_request = await db.friend_requests.find_one({
        "from_user_id": other_user_id, "to_user_id": user_id, "status": "pending"
    })
    if received_request:
        return {"status": "request_received", "request_id": received_request["request_id"]}
    
    return {"status": "none"}

@api_router.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, user: dict = Depends(get_current_user)):
    """Remove a friend"""
    result = await db.friendships.delete_one({
        "$or": [
            {"user1_id": user["user_id"], "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user["user_id"]}
        ]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}

# ==================== FEED/HOME ENDPOINTS ====================

@api_router.get("/feed")
async def get_feed(limit: int = 20, skip: int = 0):
    """Get recent posts for the home feed"""
    posts = await db.forum_posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Add category info and mask anonymous
    for post in posts:
        category = await db.forum_categories.find_one({"category_id": post["category_id"]}, {"_id": 0})
        post["category_name"] = category["name"] if category else "General"
        post["category_icon"] = category["icon"] if category else "💬"
        
        if post.get("is_anonymous"):
            post["author_name"] = "Anonymous Parent"
            post["author_picture"] = None
            post["author_id"] = "anonymous"
    
    return posts

@api_router.get("/search")
async def search_posts(q: str, limit: int = 20):
    """Search posts by title or content"""
    posts = await db.forum_posts.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    for post in posts:
        if post.get("is_anonymous"):
            post["author_name"] = "Anonymous Parent"
            post["author_picture"] = None
            post["author_id"] = "anonymous"
    
    return posts

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial forum categories and chat rooms"""
    
    # Topic-based categories
    topic_categories = [
        {"name": "Breastfeeding & Feeding", "description": "Support for nursing, pumping, and feeding challenges", "icon": "🍼", "category_type": "topic"},
        {"name": "Sleep & Routines", "description": "Tips and support for sleep training and schedules", "icon": "🌙", "category_type": "topic"},
        {"name": "Mental Health", "description": "A safe space to discuss postpartum emotions and self-care", "icon": "💚", "category_type": "topic"},
        {"name": "Single Parenting", "description": "Support, tips, and connection for single mums and dads", "icon": "💪", "category_type": "topic"},
        {"name": "Relationships", "description": "Navigating partner, family, and friend dynamics", "icon": "💕", "category_type": "topic"},
        {"name": "Development & Milestones", "description": "Tracking growth and celebrating achievements", "icon": "⭐", "category_type": "topic"},
        {"name": "Health & Wellness", "description": "Baby and parent health questions and advice", "icon": "🏥", "category_type": "topic"},
        {"name": "Just Venting", "description": "Sometimes you just need to get it off your chest", "icon": "💨", "category_type": "topic"},
    ]
    
    # Age-based categories
    age_categories = [
        {"name": "Newborn (0-3 months)", "description": "For parents of brand new babies", "icon": "👶", "category_type": "age_group"},
        {"name": "Infant (3-12 months)", "description": "First year adventures and challenges", "icon": "🧒", "category_type": "age_group"},
        {"name": "Toddler (1-3 years)", "description": "The wild toddler years", "icon": "🚶", "category_type": "age_group"},
        {"name": "Preschool (3-5 years)", "description": "Preparing for the big school years", "icon": "🎒", "category_type": "age_group"},
        {"name": "Expecting Parents", "description": "Pregnancy support and preparation", "icon": "🤰", "category_type": "age_group"},
    ]
    
    all_categories = topic_categories + age_categories
    
    for cat in all_categories:
        existing = await db.forum_categories.find_one({"name": cat["name"]})
        if not existing:
            cat["category_id"] = f"cat_{uuid.uuid4().hex[:12]}"
            cat["post_count"] = 0
            cat["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.forum_categories.insert_one(cat)
    
    # Chat rooms - Global
    global_chat_rooms = [
        {"name": "3am Club", "description": "For those late-night feeds and sleepless nights. You're not alone!", "icon": "🌙", "room_type": "global"},
        {"name": "Morning Coffee", "description": "Start your day with fellow parents", "icon": "☕", "room_type": "global"},
        {"name": "New Parents Welcome", "description": "A friendly space for first-time parents", "icon": "👋", "room_type": "global"},
        {"name": "Single Parents Lounge", "description": "A supportive space for single mums and dads. You're doing amazing!", "icon": "💪", "room_type": "global"},
        {"name": "Vent Room", "description": "Sometimes you just need to let it out", "icon": "💨", "room_type": "global"},
        {"name": "Wins & Celebrations", "description": "Share your parenting victories, big or small!", "icon": "🎉", "room_type": "global"},
    ]
    
    for room in global_chat_rooms:
        existing = await db.chat_rooms.find_one({"name": room["name"], "room_type": "global"})
        if not existing:
            room["room_id"] = f"room_{uuid.uuid4().hex[:12]}"
            room["is_active"] = True
            room["active_users"] = 0
            room["max_capacity"] = 50
            room["member_count"] = 0
            room["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.chat_rooms.insert_one(room)
    
    # Chat rooms - Local (by region)
    regions = ["UK", "US", "Australia", "Europe", "Asia"]
    local_room_templates = [
        {"name": "Local Parents", "description": "Connect with parents in your area", "icon": "📍"},
        {"name": "Local Meetups", "description": "Organize and find local parent meetups", "icon": "🤝"},
    ]
    
    for region in regions:
        for template in local_room_templates:
            room_name = f"{template['name']} - {region}"
            existing = await db.chat_rooms.find_one({"name": room_name})
            if not existing:
                room = {
                    "room_id": f"room_{uuid.uuid4().hex[:12]}",
                    "name": room_name,
                    "description": f"{template['description']} ({region})",
                    "icon": template["icon"],
                    "room_type": "local",
                    "region": region,
                    "is_active": True,
                    "active_users": 0,
                    "max_capacity": 50,
                    "member_count": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.chat_rooms.insert_one(room)
    
    return {"message": "Data seeded successfully"}

@api_router.get("/")
async def root():
    return {"message": "NightOwl Parents API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
