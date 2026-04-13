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
import json
import re
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
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set. Set a strong random secret before starting the server.")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

# Resend Email Config
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Admin Config
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@thevillage.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')

# Freemium Limits
MONTHLY_POST_LIMIT_FREE = 5
DAILY_REPLY_LIMIT_FREE = 10
DAILY_CHAT_LIMIT_FREE = 10

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
    show_online: Optional[bool] = None
    allow_friend_requests: Optional[bool] = None
    onboarding_complete: Optional[bool] = None
    number_of_kids: Optional[int] = None
    kids_ages: Optional[List[str]] = None
    # NOTE: trust badges (trusted_parent_badge, night_owl_badge, etc.) are NOT
    # in this model — they are computed server-side only via /users/compute-badges.
    # Never allow clients to self-assign badges.
    is_multiple_birth: Optional[bool] = None  # twins, triplets, etc.
    mixed_age_groups: Optional[List[str]] = None  # used when parenting_stage == "mixed"

class ForumCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    icon: str
    icon_url: Optional[str] = None           # uploaded image icon (overrides emoji)
    category_type: str  # topic, age_group, or community
    is_location_aware: bool = False
    is_user_created: bool = False
    created_by: Optional[str] = None         # user_id of community creator
    created_by_name: Optional[str] = None    # denormalised display name
    post_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Community-specific fields
    is_private: bool = False
    invite_only: bool = False
    is_anonymous_owner: bool = False
    community_subtype: str = "general"       # "general" or "local"
    postcodes: List[str] = []
    member_ids: List[str] = []
    member_count: int = 0

class ForumCommunityCreate(BaseModel):
    name: str                                # 3-60 chars
    description: str                         # 10-200 chars
    icon: str = "🌟"                         # emoji (max 4 chars)
    icon_url: Optional[str] = None           # uploaded image (overrides emoji)
    is_private: bool = False
    invite_only: bool = False
    is_anonymous_owner: bool = False
    community_subtype: str = "general"       # "general" or "local"
    postcodes: List[str] = []

class ForumCommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    icon_url: Optional[str] = None
    is_private: Optional[bool] = None
    invite_only: Optional[bool] = None
    is_anonymous_owner: Optional[bool] = None
    postcodes: Optional[List[str]] = None

class ForumPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str = Field(default_factory=lambda: f"post_{uuid.uuid4().hex[:12]}")
    category_id: str
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    author_subscription_tier: str = "free"
    is_anonymous: bool = False
    is_pinned: bool = False
    is_edited: bool = False
    title: str
    content: str
    image: Optional[str] = None  # Base64 encoded image or URL
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    state: Optional[str] = None
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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    state: Optional[str] = None
    visibility: Optional[str] = None  # "public", "friends", "only_me" — defaults to public

class ForumReply(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reply_id: str = Field(default_factory=lambda: f"reply_{uuid.uuid4().hex[:12]}")
    post_id: str
    parent_reply_id: Optional[str] = None  # For nested replies
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    author_subscription_tier: str = "free"
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
    room_type: str = "all_australia"  # all_australia, suburb, overflow, friends_only
    region: Optional[str] = None
    parent_room_id: Optional[str] = None  # For overflow rooms
    participant_ids: List[str] = []        # For friends_only rooms
    is_active: bool = True
    active_users: int = 0
    max_capacity: int = 50
    member_count: int = 0
    postcode: Optional[str] = None
    suburb: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    last_activity_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SuburbRoomCreate(BaseModel):
    postcode: str
    suburb: Optional[str] = None

class FriendsRoomCreate(BaseModel):
    friend_id: str

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
    author_subscription_tier: str = "free"
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    content: str

class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"dm_{uuid.uuid4().hex[:12]}")
    sender_id: str
    receiver_id: str
    sender_name: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    request_id: str = Field(default_factory=lambda: f"freq_{uuid.uuid4().hex[:12]}")
    from_user_id: str
    to_user_id: str
    status: str = "pending"  # pending, accepted, declined
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FriendRequestCreate(BaseModel):
    to_user_id: str

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
        if user.get("is_banned"):
            raise HTTPException(status_code=403, detail="Account suspended")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_premium_user(request: Request) -> dict:
    user = await get_current_user(request)
    sub = await get_user_subscription_status(user)
    if not sub["is_premium"] and user.get("role") not in ("admin",):
        raise HTTPException(status_code=403, detail="Premium subscription required")
    return user

# ==================== FREEMIUM HELPERS ====================

async def get_user_subscription_status(user: dict) -> dict:
    tier = user.get("subscription_tier", "free")
    trial_ends_at = user.get("trial_ends_at")

    if tier == "premium":
        return {"tier": "premium", "is_trial_active": False, "is_premium": True, "limits_apply": False}

    if tier == "trial" and trial_ends_at:
        trial_end = datetime.fromisoformat(trial_ends_at) if isinstance(trial_ends_at, str) else trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < trial_end:
            return {"tier": "trial", "is_trial_active": True, "is_premium": False, "limits_apply": False}

    return {"tier": "free", "is_trial_active": False, "is_premium": False, "limits_apply": True}

async def check_forum_post_limit(user_id: str) -> dict:
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    count = await db.usage_tracking.aggregate([
        {"$match": {"user_id": user_id, "date": {"$gte": month_ago}}},
        {"$group": {"_id": None, "total": {"$sum": "$forum_posts"}}}
    ]).to_list(1)
    used = count[0]["total"] if count else 0
    return {"allowed": used < MONTHLY_POST_LIMIT_FREE, "used": used, "limit": MONTHLY_POST_LIMIT_FREE}

async def check_forum_reply_limit(user_id: str) -> dict:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc = await db.usage_tracking.find_one({"user_id": user_id, "date": today})
    used = doc.get("forum_replies", 0) if doc else 0
    return {"allowed": used < DAILY_REPLY_LIMIT_FREE, "used": used, "limit": DAILY_REPLY_LIMIT_FREE}

async def check_chat_message_limit(user_id: str) -> dict:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc = await db.usage_tracking.find_one({"user_id": user_id, "date": today})
    used = doc.get("chat_messages", 0) if doc else 0
    return {"allowed": used < DAILY_CHAT_LIMIT_FREE, "used": used, "limit": DAILY_CHAT_LIMIT_FREE}

async def increment_usage(user_id: str, field: str, amount: int = 1):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.usage_tracking.update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {field: amount}, "$setOnInsert": {"user_id": user_id, "date": today}},
        upsert=True
    )

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
    now = datetime.now(timezone.utc)
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
        "role": "user",
        "subscription_tier": "trial",
        "trial_ends_at": (now + timedelta(days=7)).isoformat(),
        "premium_since": None,
        "is_banned": False,
        "ban_reason": None,
        "created_at": now.isoformat()
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
    
    # TODO: Implement local Google OAuth session exchange
    raise HTTPException(status_code=501, detail="Google OAuth not yet configured for local development")
    
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
        "location": user.get("location"),
        "role": user.get("role", "user"),
        "subscription_tier": user.get("subscription_tier", "free"),
        "trial_ends_at": user.get("trial_ends_at"),
        "is_banned": user.get("is_banned", False),
        "state": user.get("state"),
        "onboarding_complete": user.get("onboarding_complete", False),
        "preferred_reach": user.get("preferred_reach"),
        "is_single_parent": user.get("is_single_parent", False),
        "gender": user.get("gender"),
        "suburb": user.get("suburb"),
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== USER PROFILE ENDPOINTS ====================

@api_router.post("/users/heartbeat")
async def heartbeat(user: dict = Depends(get_current_user)):
    """Update user's last_seen_at timestamp for online presence tracking"""
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"last_seen_at": now}}
    )
    return {"ok": True}

@api_router.post("/users/compute-badges")
async def compute_badges(user: dict = Depends(get_current_user)):
    """Compute and persist trust badges for the current user"""
    user_id = user["user_id"]
    badges = {}

    # --- Trusted Parent: 10+ replies each liked ≥3 times ---
    helpful_replies = await db.forum_replies.count_documents({
        "author_id": user_id,
        "like_count": {"$gte": 3}
    })
    badges["trusted_parent_badge"] = helpful_replies >= 10

    # --- Night Owl: posted/replied between 22:00–03:00 on 5+ separate nights ---
    all_times = await db.forum_posts.find(
        {"author_id": user_id}, {"_id": 0, "created_at": 1}
    ).to_list(500)
    all_times += await db.forum_replies.find(
        {"author_id": user_id}, {"_id": 0, "created_at": 1}
    ).to_list(500)
    night_dates = set()
    for item in all_times:
        try:
            dt = datetime.fromisoformat(str(item["created_at"]).replace("Z", "+00:00"))
            hour = dt.hour
            if hour >= 22 or hour < 3:
                night_dates.add(dt.strftime("%Y-%m-%d"))
        except Exception:
            pass
    badges["night_owl_badge"] = len(night_dates) >= 5

    # --- Local Parent: active in suburb circle for 30+ days ---
    first_chat = await db.chat_messages.find_one(
        {"author_id": user_id}, sort=[("created_at", 1)]
    )
    if first_chat:
        try:
            first_dt = datetime.fromisoformat(str(first_chat["created_at"]).replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - first_dt).days
            badges["local_parent_badge"] = age_days >= 30
        except Exception:
            badges["local_parent_badge"] = False
    else:
        badges["local_parent_badge"] = False

    # verified_professional is admin-granted only — never auto-computed
    # Preserve existing value
    badges["verified_professional"] = user.get("verified_professional", False)

    await db.users.update_one({"user_id": user_id}, {"$set": badges})
    return badges

@api_router.get("/users/recommended-circles")
async def get_recommended_circles(user: dict = Depends(get_current_user)):
    """Return up to 3 personalised forum circle recommendations"""
    # Parenting stage → relevant circle names
    stage_map = {
        "expecting": ["Expecting Circle", "Feeding Circle", "Mental Health Circle"],
        "newborn": ["Newborn Circle", "Feeding Circle", "Sleep Circle"],
        "infant": ["Infant Circle", "Feeding Circle", "Sleep Circle"],
        "baby": ["Newborn Circle", "Feeding Circle", "Sleep Circle"],
        "toddler": ["Toddler Circle", "Sleep Circle", "Mental Health Circle"],
        "preschool": ["Toddler Circle", "Development & Milestones", "Mental Health Circle"],
        "school_age": ["School Age Circle", "Development & Milestones", "Mental Health Circle"],
        "teenager": ["Teenager Circle", "Mental Health Circle", "Relationships"],
        "mixed": ["Mental Health Circle", "Relationships", "Development & Milestones"],
    }
    # Interest → circle name mapping (must match INTEREST_OPTIONS in Profile.jsx)
    interest_map = {
        "Sleep & Settling": "Sleep Circle",
        "Feeding": "Feeding Circle",
        "Breastfeeding": "Feeding Circle",
        "Sleep Training": "Sleep Circle",
        "Toddler Activities": "Toddler Circle",
        "School Age": "School Age Circle",
        "Mental Health": "Mental Health Circle",
        "Dad Talk": "Dad Circle",
        "Local Events": "Local Meetups",
        "Development Milestones": "Development & Milestones",
        "Buy & Swap": "Local Meetups",
        "Relationships": "Relationships",
        "Single Parenting": "Single Parent Circle",
    }

    stage = user.get("parenting_stage", "")
    user_interests = user.get("interests", [])

    # Build ordered candidate list
    candidates = []
    if stage and stage in stage_map:
        candidates.extend(stage_map[stage])
    for interest in user_interests:
        mapped = interest_map.get(interest)
        if mapped and mapped not in candidates:
            candidates.append(mapped)

    # Remove duplicates, look up categories
    seen = set()
    results = []
    for name in candidates:
        if name in seen:
            continue
        seen.add(name)
        cat = await db.forum_categories.find_one({"name": name}, {"_id": 0})
        if cat:
            results.append(cat)
        if len(results) >= 3:
            break

    # Fallback: most active circles
    if len(results) < 3:
        active = await db.forum_categories.find(
            {"category_type": {"$in": ["topic", "age_group"]}},
            {"_id": 0}
        ).sort("post_count", -1).limit(10).to_list(10)
        for cat in active:
            if len(results) >= 3:
                break
            if cat["category_id"] not in {r["category_id"] for r in results}:
                results.append(cat)

    return results

@api_router.get("/users/single-parents")
async def get_single_parents(user: dict = Depends(get_current_user)):
    """Get list of single parents for connection suggestions"""
    single_parents = await db.users.find(
        {"is_single_parent": True, "user_id": {"$ne": user["user_id"]}},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).limit(20).to_list(20)
    return single_parents

@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Only return email to the profile owner; strip it for all other callers
    try:
        caller = await get_current_user(request)
        if caller.get("user_id") != user_id:
            user.pop("email", None)
    except HTTPException:
        user.pop("email", None)
    return user

@api_router.put("/users/profile")
async def update_profile(profile_data: UserProfileUpdate, user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_fields:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_fields})
    
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.delete("/users/me")
async def delete_account(request: Request, response: Response, user: dict = Depends(get_current_user)):
    """Permanently delete the current user's account and all their content."""
    uid = user["user_id"]
    # Delete user content across all collections
    await db.forum_posts.delete_many({"author_id": uid})
    await db.forum_replies.delete_many({"author_id": uid})
    await db.post_likes.delete_many({"user_id": uid})
    await db.reply_likes.delete_many({"user_id": uid})
    await db.bookmarks.delete_many({"user_id": uid})
    await db.saved_messages.delete_many({"user_id": uid})
    await db.friend_requests.delete_many({"$or": [{"from_user_id": uid}, {"to_user_id": uid}]})
    await db.user_blocks.delete_many({"$or": [{"blocker_id": uid}, {"blocked_id": uid}]})
    await db.event_rsvps.delete_many({"user_id": uid})
    await db.notifications.delete_many({"user_id": uid})
    await db.reports.delete_many({"reporter_id": uid})
    # Clear sessions and delete user record
    await db.user_sessions.delete_many({"user_id": uid})
    await db.users.delete_one({"user_id": uid})
    # Clear auth cookie
    response.delete_cookie("session_token", path="/", samesite="lax")
    return {"message": "Account deleted"}

# ==================== FORUM ENDPOINTS ====================

@api_router.get("/forums/categories")
async def get_categories(request: Request):
    # Optional auth — used to compute is_member
    try:
        current_user = await get_current_user(request)
    except HTTPException:
        current_user = None

    categories = await db.forum_categories.find({}, {"_id": 0}).to_list(500)

    # Enhance with additional stats
    for cat in categories:
        # Get most recent post timestamp
        recent_post = await db.forum_posts.find_one(
            {"category_id": cat["category_id"]},
            {"_id": 0, "created_at": 1},
            sort=[("created_at", -1)]
        )
        cat["last_post_at"] = recent_post["created_at"] if recent_post else None

        # Count unique authors in last 7 days
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        pipeline = [
            {"$match": {"category_id": cat["category_id"], "created_at": {"$gte": seven_days_ago}}},
            {"$group": {"_id": "$author_id"}},
            {"$count": "active_users"}
        ]
        result = await db.forum_posts.aggregate(pipeline).to_list(1)
        cat["active_users"] = result[0]["active_users"] if result else 0

        # Membership flag for communities
        if current_user and cat.get("is_user_created"):
            cat["is_member"] = current_user["user_id"] in cat.get("member_ids", [])
            cat["is_creator"] = cat.get("created_by") == current_user["user_id"]
        else:
            cat["is_member"] = False
            cat["is_creator"] = False

    return categories

@api_router.get("/forums/categories/{category_id}")
async def get_category(category_id: str):
    category = await db.forum_categories.find_one({"category_id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.get("/forums/posts")
async def get_posts(
    request: Request,
    category_id: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    sort: str = "newest",  # newest, oldest, popular, most_replies, unanswered, nearest
    filter_type: Optional[str] = None,  # unanswered, trending
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    distance_km: Optional[int] = None,
):
    # Get blocked user IDs for the current user (if authenticated)
    blocked_ids = []
    current_user_id = None
    try:
        current_user = await get_current_user(request)
        current_user_id = current_user["user_id"]
        blocks = await db.user_blocks.find({"blocker_id": current_user_id}, {"_id": 0, "blocked_id": 1}).to_list(200)
        blocked_ids = [b["blocked_id"] for b in blocks]
    except Exception:
        pass

    # Exclude only_me posts (unless viewer is the author)
    visibility_filter = {"$or": [
        {"visibility": {"$ne": "only_me"}},
        {"visibility": None},
        *([{"visibility": "only_me", "author_id": current_user_id}] if current_user_id else [])
    ]}
    query = {"$and": [visibility_filter]}
    if blocked_ids:
        query["$and"].append({"author_id": {"$nin": blocked_ids}})
    if category_id:
        query["$and"].append({"category_id": category_id})

    # Apply filters
    if filter_type == "unanswered":
        query["reply_count"] = 0
    elif filter_type == "trending":
        # Trending = posts from last 7 days with high engagement
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query["created_at"] = {"$gte": seven_days_ago}

    # Location-based filtering
    if lat is not None and lon is not None and distance_km is not None:
        # Fetch all posts with location, then filter by distance in Python
        query["latitude"] = {"$exists": True, "$ne": None}
        all_posts = await db.forum_posts.find(query, {"_id": 0}).to_list(500)

        filtered_posts = []
        for post in all_posts:
            if post.get("latitude") and post.get("longitude"):
                dist = calculate_distance(lat, lon, post["latitude"], post["longitude"])
                if dist <= distance_km:
                    post["distance_km"] = round(dist, 1)
                    filtered_posts.append(post)

        # Sort by distance (nearest first) by default for location queries
        if sort == "nearest" or sort == "newest":
            filtered_posts.sort(key=lambda x: x.get("distance_km", 9999))
        elif sort == "popular":
            filtered_posts.sort(key=lambda x: x.get("like_count", 0), reverse=True)

        total = len(filtered_posts)
        posts = filtered_posts[skip:skip + limit]

        # Mask anonymous posts
        for post in posts:
            if post.get("is_anonymous"):
                post["author_name"] = "Anonymous Parent"
                post["author_picture"] = None
                post["author_id"] = "anonymous"

        return {"posts": posts, "total": total, "limit": limit, "skip": skip}

    # Standard (non-location) query
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

    # Batch fetch category info
    category_ids = list(set(post["category_id"] for post in posts if "category_id" in post))
    categories_list = await db.forum_categories.find(
        {"category_id": {"$in": category_ids}}, {"_id": 0}
    ).to_list(None)
    categories_map = {c["category_id"]: c for c in categories_list}

    for post in posts:
        category = categories_map.get(post.get("category_id"))
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
    # Check freemium limits
    sub = await get_user_subscription_status(user)
    if sub["limits_apply"]:
        limit_check = await check_forum_post_limit(user["user_id"])
        if not limit_check["allowed"]:
            raise HTTPException(status_code=429, detail={
                "error": "monthly_post_limit",
                "used": limit_check["used"],
                "limit": limit_check["limit"],
                "message": f"You've used all {limit_check['limit']} posts this month. Upgrade to Village+ for unlimited posts."
            })

    # Check if category is location-aware and populate location fields
    post_lat = post_data.latitude
    post_lon = post_data.longitude
    post_suburb = post_data.suburb
    post_postcode = post_data.postcode
    post_state = post_data.state

    category = await db.forum_categories.find_one({"category_id": post_data.category_id}, {"_id": 0})
    if category and category.get("is_location_aware") and not post_lat:
        # Auto-populate from user profile if not provided
        post_lat = user.get("latitude")
        post_lon = user.get("longitude")
        post_suburb = post_suburb or user.get("suburb")
        post_postcode = post_postcode or user.get("postcode")
        post_state = post_state or user.get("state")

    post = ForumPost(
        category_id=post_data.category_id,
        author_id=user["user_id"],
        author_name=user.get("nickname") or user["name"],
        author_picture=user.get("picture"),
        author_subscription_tier=user.get("subscription_tier", "free"),
        is_anonymous=post_data.is_anonymous,
        title=post_data.title,
        content=post_data.content,
        image=post_data.image,
        latitude=post_lat,
        longitude=post_lon,
        suburb=post_suburb,
        postcode=post_postcode,
        state=post_state,
    )

    doc = post.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    # Store visibility field (public/friends/only_me). Defaults to public.
    # only_me posts are excluded from feed/category views; owner can still see and edit them.
    doc["visibility"] = post_data.visibility or "public"

    await db.forum_posts.insert_one(doc)
    await db.forum_categories.update_one({"category_id": post_data.category_id}, {"$inc": {"post_count": 1}})
    await increment_usage(user["user_id"], "forum_posts")

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
    """Delete a post (by author, community creator, or admin/mod)"""
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    is_author = post["author_id"] == user["user_id"]
    is_admin = user.get("role") in ("admin", "moderator")
    is_community_creator = False
    if not is_author and not is_admin:
        community = await db.forum_categories.find_one({"category_id": post["category_id"], "is_user_created": True})
        if community and community.get("created_by") == user["user_id"]:
            is_community_creator = True

    if not (is_author or is_admin or is_community_creator):
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

# ==================== COMMUNITY ENDPOINTS ====================

async def delete_community_cascade(community_id: str):
    """Delete a community and all its posts, replies, likes, and bookmarks"""
    posts = await db.forum_posts.find({"category_id": community_id}, {"_id": 0, "post_id": 1}).to_list(1000)
    post_ids = [p["post_id"] for p in posts]
    if post_ids:
        await db.forum_replies.delete_many({"post_id": {"$in": post_ids}})
        await db.post_likes.delete_many({"post_id": {"$in": post_ids}})
        await db.bookmarks.delete_many({"post_id": {"$in": post_ids}})
    await db.forum_posts.delete_many({"category_id": community_id})
    await db.forum_categories.delete_one({"category_id": community_id})

@api_router.post("/forums/communities")
async def create_community(data: ForumCommunityCreate, user: dict = Depends(get_premium_user)):
    """Create a user community (premium users, max 3)"""
    # Validate input lengths
    if len(data.name.strip()) < 3 or len(data.name.strip()) > 60:
        raise HTTPException(400, "Community name must be 3-60 characters")
    if len(data.description.strip()) < 10 or len(data.description.strip()) > 200:
        raise HTTPException(400, "Description must be 10-200 characters")
    # Only validate emoji if no image uploaded
    if not data.icon_url and len(data.icon.strip()) > 4:
        raise HTTPException(400, "Icon must be a single emoji (max 4 chars)")

    # Enforce 3 community cap (admins bypass)
    if user.get("role") != "admin":
        count = await db.forum_categories.count_documents({"is_user_created": True, "created_by": user["user_id"]})
        if count >= 3:
            raise HTTPException(429, "You can only create up to 3 communities")

    # Check name uniqueness (case-insensitive)
    existing = await db.forum_categories.find_one({"name": {"$regex": f"^{re.escape(data.name.strip())}$", "$options": "i"}})
    if existing:
        raise HTTPException(409, "A community with that name already exists")

    creator_name = None if data.is_anonymous_owner else (user.get("nickname") or user["name"])

    community = ForumCategory(
        name=data.name.strip(),
        description=data.description.strip(),
        icon=data.icon.strip() or "🌟",
        icon_url=data.icon_url,
        category_type="community",
        is_user_created=True,
        created_by=user["user_id"],
        created_by_name=creator_name,
        is_private=data.is_private,
        invite_only=data.invite_only,
        is_anonymous_owner=data.is_anonymous_owner,
        community_subtype=data.community_subtype,
        postcodes=data.postcodes,
        member_ids=[user["user_id"]],
        member_count=1,
    )
    doc = community.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.forum_categories.insert_one(doc)
    result = {k: v for k, v in doc.items() if k != "_id"}
    result["is_member"] = True
    result["is_creator"] = True
    return result

@api_router.put("/forums/communities/{community_id}")
async def update_community(community_id: str, data: ForumCommunityUpdate, user: dict = Depends(get_current_user)):
    """Edit a community (creator or admin/mod)"""
    community = await db.forum_categories.find_one({"category_id": community_id, "is_user_created": True}, {"_id": 0})
    if not community:
        raise HTTPException(404, "Community not found")
    if community.get("created_by") != user["user_id"] and user.get("role") not in ("admin", "moderator"):
        raise HTTPException(403, "Not authorized")

    updates = {}
    if data.name is not None:
        if len(data.name.strip()) < 3 or len(data.name.strip()) > 60:
            raise HTTPException(400, "Community name must be 3-60 characters")
        updates["name"] = data.name.strip()
    if data.description is not None:
        if len(data.description.strip()) < 10 or len(data.description.strip()) > 200:
            raise HTTPException(400, "Description must be 10-200 characters")
        updates["description"] = data.description.strip()
    if data.icon is not None:
        if not data.icon_url and len(data.icon.strip()) > 4:
            raise HTTPException(400, "Icon must be a single emoji (max 4 chars)")
        updates["icon"] = data.icon.strip()
    if data.icon_url is not None:
        updates["icon_url"] = data.icon_url
    if data.is_private is not None:
        updates["is_private"] = data.is_private
    if data.invite_only is not None:
        updates["invite_only"] = data.invite_only
    if data.is_anonymous_owner is not None:
        updates["is_anonymous_owner"] = data.is_anonymous_owner
        updates["created_by_name"] = None if data.is_anonymous_owner else (user.get("nickname") or user["name"])
    if data.postcodes is not None:
        updates["postcodes"] = data.postcodes

    if updates:
        await db.forum_categories.update_one({"category_id": community_id}, {"$set": updates})
    result = await db.forum_categories.find_one({"category_id": community_id}, {"_id": 0})
    return result

@api_router.delete("/forums/communities/{community_id}")
async def delete_community(community_id: str, user: dict = Depends(get_current_user)):
    """Delete a community and all its content (creator or admin/mod)"""
    community = await db.forum_categories.find_one({"category_id": community_id, "is_user_created": True}, {"_id": 0})
    if not community:
        raise HTTPException(404, "Community not found")
    if community.get("created_by") != user["user_id"] and user.get("role") not in ("admin", "moderator"):
        raise HTTPException(403, "Not authorized")

    await delete_community_cascade(community_id)
    return {"message": "Community deleted"}

@api_router.post("/forums/communities/{community_id}/join")
async def join_community(community_id: str, user: dict = Depends(get_current_user)):
    """Join a community"""
    community = await db.forum_categories.find_one({"category_id": community_id, "category_type": "community"}, {"_id": 0})
    if not community:
        raise HTTPException(404, "Community not found")
    if community.get("invite_only") and user["user_id"] not in community.get("member_ids", []):
        raise HTTPException(403, "This community is invite-only")
    user_id = user["user_id"]
    if user_id in community.get("member_ids", []):
        return {"message": "Already a member", "is_member": True, "member_count": community.get("member_count", 0)}
    await db.forum_categories.update_one(
        {"category_id": community_id},
        {"$addToSet": {"member_ids": user_id}, "$inc": {"member_count": 1}}
    )
    return {"message": "Joined community", "is_member": True, "member_count": community.get("member_count", 0) + 1}

@api_router.post("/forums/communities/{community_id}/leave")
async def leave_community(community_id: str, user: dict = Depends(get_current_user)):
    """Leave a community"""
    community = await db.forum_categories.find_one({"category_id": community_id, "category_type": "community"}, {"_id": 0})
    if not community:
        raise HTTPException(404, "Community not found")
    if community.get("created_by") == user["user_id"]:
        raise HTTPException(400, "Community creators cannot leave their own community")
    user_id = user["user_id"]
    if user_id not in community.get("member_ids", []):
        return {"message": "Not a member", "is_member": False, "member_count": community.get("member_count", 0)}
    await db.forum_categories.update_one(
        {"category_id": community_id},
        {"$pull": {"member_ids": user_id}, "$inc": {"member_count": -1}}
    )
    return {"message": "Left community", "is_member": False, "member_count": max(0, community.get("member_count", 1) - 1)}

@api_router.post("/forums/posts/{post_id}/pin")
async def pin_post(post_id: str, user: dict = Depends(get_current_user)):
    """Toggle pin on a post (community creator or admin/mod)"""
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post not found")

    is_admin = user.get("role") in ("admin", "moderator")
    is_community_creator = False
    community = await db.forum_categories.find_one({"category_id": post["category_id"], "is_user_created": True})
    if community and community.get("created_by") == user["user_id"]:
        is_community_creator = True

    if not is_admin and not is_community_creator:
        raise HTTPException(403, "Only community creators and admins can pin posts")

    new_pinned = not post.get("is_pinned", False)
    await db.forum_posts.update_one({"post_id": post_id}, {"$set": {"is_pinned": new_pinned}})
    return {"pinned": new_pinned}

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
    # Check freemium limits
    sub = await get_user_subscription_status(user)
    if sub["limits_apply"]:
        reply_limit = await check_forum_reply_limit(user["user_id"])
        if not reply_limit["allowed"]:
            raise HTTPException(status_code=429, detail={
                "error": "daily_reply_limit",
                "used": reply_limit["used"],
                "limit": reply_limit["limit"],
                "message": f"You've used all {reply_limit['limit']} replies today. Upgrade to Village+ for unlimited replies."
            })

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
        author_subscription_tier=user.get("subscription_tier", "free"),
        is_anonymous=reply_data.is_anonymous,
        content=reply_data.content
    )
    
    doc = reply.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.forum_replies.insert_one(doc)
    await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"reply_count": 1}})
    await increment_usage(user["user_id"], "forum_replies")

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
                    "link": f"http://localhost:3000/forums/post/{post_id}"
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
    
    # Count nested replies before deleting
    child_count = await db.forum_replies.count_documents({"parent_reply_id": reply_id})

    # Delete reply and its likes
    await db.forum_replies.delete_one({"reply_id": reply_id})
    await db.reply_likes.delete_many({"reply_id": reply_id})

    # Delete nested replies and their likes
    if child_count > 0:
        child_replies = await db.forum_replies.find(
            {"parent_reply_id": reply_id}, {"reply_id": 1}
        ).to_list(None)
        child_reply_ids = [cr["reply_id"] for cr in child_replies]
        await db.reply_likes.delete_many({"reply_id": {"$in": child_reply_ids}})
        await db.forum_replies.delete_many({"parent_reply_id": reply_id})

    # Update post reply count by total deleted (parent + children)
    total_deleted = 1 + child_count
    await db.forum_posts.update_one(
        {"post_id": reply["post_id"]},
        {"$inc": {"reply_count": -total_deleted}}
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

# ==================== EVENTS ENDPOINTS ====================

def haversine_distance(lat1, lon1, lat2, lon2):
    from math import radians, sin, cos, sqrt, atan2
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))

class EventCreate(BaseModel):
    title: str
    description: str
    venue_name: Optional[str] = None   # e.g. "Bondi Park", "Newtown Library"
    venue_address: Optional[str] = None  # full address string from Nominatim
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date: str  # ISO date string YYYY-MM-DD
    time_start: Optional[str] = None  # HH:MM
    time_end: Optional[str] = None
    category: str = "general"  # general, playgroup, meetup, workshop, support
    rsvp_limit: Optional[int] = None
    image_url: Optional[str] = None
    is_private: bool = False
    invited_notes: Optional[str] = None

@api_router.post("/events")
async def create_event(event_data: EventCreate, user: dict = Depends(get_current_user)):
    """Create a new event"""
    event = {
        "event_id": str(uuid.uuid4()),
        "title": event_data.title,
        "description": event_data.description,
        "venue_name": event_data.venue_name,
        "venue_address": event_data.venue_address,
        "suburb": event_data.suburb,
        "postcode": event_data.postcode,
        "state": event_data.state,
        "latitude": event_data.latitude,
        "longitude": event_data.longitude,
        "date": event_data.date,
        "time_start": event_data.time_start,
        "time_end": event_data.time_end,
        "category": event_data.category,
        "rsvp_list": [],
        "rsvp_limit": event_data.rsvp_limit,
        "image_url": event_data.image_url,
        "is_private": event_data.is_private,
        "invited_notes": event_data.invited_notes,
        "organiser_user_id": user["user_id"],
        "organiser_name": user.get("name", ""),
        "organiser_picture": user.get("picture"),
        "is_cancelled": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.events.insert_one(event)
    event.pop("_id", None)
    event["rsvp_count"] = 0
    event["user_has_rsvp"] = False
    return event

@api_router.get("/events")
async def get_events(
    request: Request,
    suburb: Optional[str] = None,
    state: Optional[str] = None,
    category: str = "all",
    rsvped_only: bool = False,
    distance_km: Optional[float] = None,
    limit: int = 20,
    skip: int = 0,
):
    """Get upcoming events with optional filters"""
    # Optional auth
    current_user = None
    try:
        current_user = await get_current_user(request)
    except Exception:
        pass

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    query: dict = {
        "is_cancelled": False,
        "date": {"$gte": today},
    }
    if suburb:
        query["suburb"] = {"$regex": suburb, "$options": "i"}
    if state and state != "all":
        query["state"] = state
    if category and category != "all":
        query["category"] = category
    if rsvped_only and current_user:
        query["rsvp_list"] = {"$in": [current_user["user_id"]]}

    events = await db.events.find(query, {"_id": 0}).sort("date", 1).skip(skip).limit(limit * 5).to_list(limit * 5)

    # Filter out private events that the current user doesn't own
    events = [
        e for e in events
        if not e.get("is_private", False) or (
            current_user and current_user["user_id"] == e.get("organiser_user_id")
        )
    ]

    # Distance filter — requires user to have lat/lon on their profile
    if distance_km is not None and current_user:
        user_lat = current_user.get("latitude")
        user_lon = current_user.get("longitude")
        if user_lat is not None and user_lon is not None:
            events = [
                e for e in events
                if e.get("latitude") is not None and e.get("longitude") is not None
                and haversine_distance(user_lat, user_lon, e["latitude"], e["longitude"]) <= distance_km
            ]

    # Apply final limit after in-memory filtering
    events = events[skip:skip + limit]

    for event in events:
        event["rsvp_count"] = len(event.get("rsvp_list", []))
        event["user_has_rsvp"] = (
            current_user is not None and current_user["user_id"] in event.get("rsvp_list", [])
        )

    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str, request: Request):
    """Get a single event by ID"""
    current_user = None
    try:
        current_user = await get_current_user(request)
    except Exception:
        pass

    event = await db.events.find_one({"event_id": event_id, "is_cancelled": False}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event["rsvp_count"] = len(event.get("rsvp_list", []))
    event["user_has_rsvp"] = (
        current_user is not None and current_user["user_id"] in event.get("rsvp_list", [])
    )
    return event

@api_router.post("/events/{event_id}/rsvp")
async def toggle_rsvp(event_id: str, user: dict = Depends(get_current_user)):
    """Toggle RSVP for an event"""
    event = await db.events.find_one({"event_id": event_id, "is_cancelled": False})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    user_id = user["user_id"]
    rsvp_list = event.get("rsvp_list", [])

    if user_id in rsvp_list:
        # Remove RSVP
        await db.events.update_one(
            {"event_id": event_id},
            {"$pull": {"rsvp_list": user_id}}
        )
        rsvp_list.remove(user_id)
        rsvped = False
    else:
        # Add RSVP if limit not reached
        rsvp_limit = event.get("rsvp_limit")
        if rsvp_limit is not None and len(rsvp_list) >= rsvp_limit:
            raise HTTPException(status_code=400, detail="Event is full")
        await db.events.update_one(
            {"event_id": event_id},
            {"$addToSet": {"rsvp_list": user_id}}
        )
        rsvp_list.append(user_id)
        rsvped = True

    return {"rsvped": rsvped, "rsvp_count": len(rsvp_list)}

@api_router.get("/events/{event_id}/ical")
async def get_event_ical(event_id: str):
    """Download event as ICS calendar file"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Build ICS string
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    date_str = event.get("date", "").replace("-", "")  # YYYYMMDD

    if event.get("time_start"):
        time_start = event["time_start"].replace(":", "") + "00"
        dtstart = f"{date_str}T{time_start}"
    else:
        dtstart = f";VALUE=DATE:{date_str}"
        dtstart = f"DTSTART;VALUE=DATE:{date_str}"

    if event.get("time_start"):
        dtstart_line = f"DTSTART:{date_str}T{event['time_start'].replace(':', '')}00"
    else:
        dtstart_line = f"DTSTART;VALUE=DATE:{date_str}"

    if event.get("time_end"):
        dtend_line = f"DTEND:{date_str}T{event['time_end'].replace(':', '')}00"
    elif event.get("time_start"):
        # Default 1 hour duration
        dtend_line = f"DTEND:{date_str}T{event['time_start'].replace(':', '')}00"
    else:
        dtend_line = f"DTEND;VALUE=DATE:{date_str}"

    location_parts = [p for p in [event.get("suburb"), event.get("state")] if p]
    location = ", ".join(location_parts) if location_parts else ""

    description = event.get("description", "").replace("\n", "\\n").replace(",", "\\,")
    summary = event.get("title", "").replace(",", "\\,")

    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//The Village//Events//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{event['event_id']}@thevillage.com",
        f"DTSTAMP:{now_stamp}",
        dtstart_line,
        dtend_line,
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        f"LOCATION:{location}",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    ics_string = "\r\n".join(ics_lines) + "\r\n"

    return Response(
        content=ics_string,
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="event.ics"'},
    )

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    """Cancel/delete an event (organiser or admin only)"""
    event = await db.events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    is_organiser = event.get("organiser_user_id") == user["user_id"]
    is_admin = user.get("role") in ("admin", "moderator")

    if not is_organiser and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorised to delete this event")

    await db.events.update_one({"event_id": event_id}, {"$set": {"is_cancelled": True}})
    return {"message": "Event cancelled"}

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    suburb: Optional[str] = None
    postcode: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date: Optional[str] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    category: Optional[str] = None
    rsvp_limit: Optional[int] = None
    is_private: Optional[bool] = None
    invited_notes: Optional[str] = None

@api_router.put("/events/{event_id}")
async def update_event(event_id: str, event_data: EventUpdate, user: dict = Depends(get_current_user)):
    """Edit an event (organiser, event moderator, or admin only)"""
    event = await db.events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    is_organiser = event.get("organiser_user_id") == user["user_id"]
    is_moderator = user["user_id"] in event.get("moderator_ids", [])
    is_admin = user.get("role") in ("admin", "moderator")

    if not (is_organiser or is_moderator or is_admin):
        raise HTTPException(status_code=403, detail="Not authorised to edit this event")

    updates = {k: v for k, v in event_data.model_dump().items() if v is not None}
    if updates:
        await db.events.update_one({"event_id": event_id}, {"$set": updates})

    updated = await db.events.find_one({"event_id": event_id}, {"_id": 0})
    return updated

@api_router.post("/events/{event_id}/moderators")
async def add_event_moderator(event_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Add or remove a moderator from an event (organiser only)"""
    event = await db.events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("organiser_user_id") != user["user_id"] and user.get("role") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Only the organiser can manage moderators")

    body = await request.json()
    action = body.get("action", "add")  # "add" or "remove"
    target_user_id = body.get("user_id")

    if not target_user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    target = await db.users.find_one({"user_id": target_user_id}, {"_id": 0, "user_id": 1, "name": 1, "nickname": 1})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    current_mods = event.get("moderator_ids", [])
    if action == "add":
        if target_user_id not in current_mods:
            current_mods.append(target_user_id)
    elif action == "remove":
        current_mods = [m for m in current_mods if m != target_user_id]

    await db.events.update_one({"event_id": event_id}, {"$set": {"moderator_ids": current_mods}})
    return {"message": f"Moderator {action}ed", "moderator_ids": current_mods}

@api_router.get("/events/{event_id}/moderators")
async def get_event_moderators(event_id: str, user: dict = Depends(get_current_user)):
    """Get the moderators for an event"""
    event = await db.events.find_one({"event_id": event_id}, {"_id": 0, "moderator_ids": 1, "organiser_user_id": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("organiser_user_id") != user["user_id"] and user.get("role") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not authorised")
    mod_ids = event.get("moderator_ids", [])
    if not mod_ids:
        return []
    mods = await db.users.find(
        {"user_id": {"$in": mod_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "nickname": 1, "picture": 1}
    ).to_list(50)
    return mods

# ==================== SAVED MESSAGES ENDPOINTS ====================

@api_router.post("/chat/messages/{message_id}/save")
async def save_chat_message(message_id: str, user: dict = Depends(get_current_user)):
    """Save a chat message for later"""
    # Check if already saved
    existing = await db.saved_messages.find_one({"message_id": message_id, "user_id": user["user_id"]})
    if existing:
        return {"saved": True}

    # Find message
    message = await db.chat_messages.find_one({"message_id": message_id})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Get room name
    room = await db.chat_rooms.find_one({"room_id": message.get("room_id")})
    room_name = room.get("name", "Unknown Room") if room else "Unknown Room"

    saved = {
        "id": str(uuid.uuid4()),
        "message_id": message_id,
        "user_id": user["user_id"],
        "message_content": message.get("content", ""),
        "author_name": message.get("author_name", ""),
        "room_id": message.get("room_id", ""),
        "room_name": room_name,
        "saved_at": datetime.now(timezone.utc),
    }
    await db.saved_messages.insert_one(saved)
    return {"saved": True}

@api_router.delete("/chat/messages/{message_id}/save")
async def unsave_chat_message(message_id: str, user: dict = Depends(get_current_user)):
    """Remove a saved chat message"""
    result = await db.saved_messages.delete_one({"message_id": message_id, "user_id": user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved message not found")
    return {"saved": False}

@api_router.get("/users/saved-messages")
async def get_saved_messages(user: dict = Depends(get_current_user)):
    """Get user's saved chat messages"""
    saved = await db.saved_messages.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("saved_at", -1).to_list(100)
    return saved

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

# ==================== USER BLOCKING ====================

@api_router.post("/users/{user_id}/block")
async def block_user(user_id: str, user: dict = Depends(get_current_user)):
    """Block a user — their posts will be hidden from your feed"""
    if user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = await db.user_blocks.find_one({"blocker_id": user["user_id"], "blocked_id": user_id})
    if existing:
        return {"message": "Already blocked"}
    await db.user_blocks.insert_one({
        "blocker_id": user["user_id"],
        "blocked_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "User blocked"}

@api_router.delete("/users/{user_id}/block")
async def unblock_user(user_id: str, user: dict = Depends(get_current_user)):
    """Unblock a user"""
    await db.user_blocks.delete_one({"blocker_id": user["user_id"], "blocked_id": user_id})
    return {"message": "User unblocked"}

@api_router.get("/users/blocked")
async def get_blocked_users(user: dict = Depends(get_current_user)):
    """Get list of users blocked by the current user"""
    blocks = await db.user_blocks.find({"blocker_id": user["user_id"]}, {"_id": 0}).to_list(200)
    blocked_ids = [b["blocked_id"] for b in blocks]
    if not blocked_ids:
        return []
    users = await db.users.find(
        {"user_id": {"$in": blocked_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "nickname": 1, "picture": 1}
    ).to_list(200)
    return users

@api_router.get("/users/{user_id}/block-status")
async def get_block_status(user_id: str, user: dict = Depends(get_current_user)):
    """Check if the current user has blocked another user"""
    block = await db.user_blocks.find_one({"blocker_id": user["user_id"], "blocked_id": user_id})
    return {"is_blocked": block is not None}

@api_router.get("/users/search")
async def search_users(q: str = "", user: dict = Depends(get_current_user)):
    """Search users by name, nickname, or email (for moderator/friend lookup)"""
    if not q or len(q) < 2:
        return []
    users = await db.users.find(
        {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"nickname": {"$regex": q, "$options": "i"}},
        ]},
        {"_id": 0, "user_id": 1, "name": 1, "nickname": 1, "picture": 1, "is_online": 1}
    ).limit(10).to_list(10)
    return users

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
    
    # Get the content author for auto-ban tracking
    reported_user_id = content.get("author_id")

    report = {
        "report_id": f"report_{uuid.uuid4().hex[:12]}",
        "reporter_id": user["user_id"],
        "reported_user_id": reported_user_id,
        "content_type": report_data.content_type,
        "content_id": report_data.content_id,
        "reason": report_data.reason,
        "details": report_data.details,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report)

    # Auto-suspend after 5 reports against the same user in 30 days
    AUTO_BAN_THRESHOLD = 5
    if reported_user_id:
        thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        report_count = await db.reports.count_documents({
            "reported_user_id": reported_user_id,
            "created_at": {"$gte": thirty_days_ago}
        })
        if report_count >= AUTO_BAN_THRESHOLD:
            target = await db.users.find_one({"user_id": reported_user_id})
            if target and not target.get("is_banned"):
                await db.users.update_one(
                    {"user_id": reported_user_id},
                    {"$set": {
                        "is_banned": True,
                        "ban_reason": "Auto-suspended pending review",
                        "auto_suspended": True
                    }}
                )
                await db.notifications.insert_one({
                    "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                    "user_id": reported_user_id,
                    "type": "moderation",
                    "title": "Account Temporarily Suspended",
                    "message": "Your account has been temporarily suspended pending a review. Our moderation team will be in touch.",
                    "link": None,
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

    return {"message": "Report submitted successfully", "report_id": report["report_id"]}

# ==================== CHAT ROOM ENDPOINTS ====================

ROOM_MAX_CAPACITY = 50

@api_router.get("/chat/rooms")
async def get_chat_rooms(
    user: dict = Depends(get_current_user),
    preferred_reach: Optional[str] = None
):
    """Get chat rooms: suburb rooms near user + all australia themed rooms"""
    user_lat = user.get("latitude")
    user_lon = user.get("longitude")
    user_postcode = user.get("postcode")
    reach = preferred_reach or user.get("preferred_reach", "25km")

    # Get all active rooms
    all_rooms = await db.chat_rooms.find({"is_active": True}, {"_id": 0}).to_list(500)

    my_suburb_room = None
    nearby_rooms = []
    all_australia_rooms = []

    # 30-day archival threshold
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    for room in all_rooms:
        room_type = room.get("room_type", "all_australia")

        if room_type == "all_australia":
            all_australia_rooms.append(room)
        elif room_type == "suburb":
            # Lazy archival: skip stale suburb rooms with no active users
            last_activity = room.get("last_activity_at")
            if last_activity and last_activity < thirty_days_ago and room.get("active_users", 0) == 0:
                continue

            # Check if this is the user's own suburb room
            if user_postcode and room.get("postcode") == user_postcode:
                my_suburb_room = room
            elif user_lat and user_lon and room.get("latitude") and room.get("longitude"):
                dist = calculate_distance(user_lat, user_lon, room["latitude"], room["longitude"])
                reach_km = next((d["km"] for d in DISTANCE_OPTIONS if d["id"] == reach), 100)
                if reach_km and dist <= reach_km:
                    room["distance_km"] = round(dist, 1)
                    nearby_rooms.append(room)

    # Sort nearby rooms by distance
    nearby_rooms.sort(key=lambda x: x.get("distance_km", 9999))

    return {
        "my_suburb_room": my_suburb_room,
        "nearby_rooms": nearby_rooms,
        "all_australia_rooms": all_australia_rooms,
        "user_suburb": user.get("suburb"),
        "user_postcode": user_postcode,
        "preferred_reach": reach,
        "distance_options": DISTANCE_OPTIONS,
        "has_location": bool(user_lat and user_lon)
    }

@api_router.get("/chat/rooms/nearby")
async def get_nearby_chat_rooms(
    user: dict = Depends(get_current_user),
    distance_km: int = 25
):
    """Get chat rooms within a specific distance"""
    user_lat = user.get("latitude")
    user_lon = user.get("longitude")
    
    if not user_lat or not user_lon:
        return {"rooms": [], "message": "Please set your location to see nearby rooms"}
    
    all_rooms = await db.chat_rooms.find(
        {"is_active": True, "latitude": {"$exists": True}},
        {"_id": 0}
    ).to_list(200)
    
    nearby_rooms = []
    for room in all_rooms:
        if room.get("latitude") and room.get("longitude"):
            dist = calculate_distance(user_lat, user_lon, room["latitude"], room["longitude"])
            if dist <= distance_km:
                room["distance_km"] = round(dist, 1)
                nearby_rooms.append(room)
    
    nearby_rooms.sort(key=lambda x: x.get("distance_km", 9999))
    return {"rooms": nearby_rooms, "search_radius_km": distance_km}

@api_router.get("/chat/rooms/all")
async def get_all_chat_rooms():
    """Get main chat rooms without authentication (for landing page)"""
    rooms = await db.chat_rooms.find(
        {"is_active": True, "room_type": "all_australia"},
        {"_id": 0}
    ).to_list(50)
    return rooms

@api_router.post("/chat/rooms/friends")
async def get_or_create_friends_room(room_data: FriendsRoomCreate, user: dict = Depends(get_current_user)):
    """Get or create a private 1-on-1 friends chat room"""
    friend_id = room_data.friend_id

    # Verify they are actually friends
    friendship = await db.friendships.find_one({
        "$or": [
            {"user1_id": user["user_id"], "user2_id": friend_id},
            {"user1_id": friend_id, "user2_id": user["user_id"]}
        ]
    })
    if not friendship:
        raise HTTPException(status_code=403, detail="You must be friends to start a private chat")

    # Deterministic lookup: sort IDs so order doesn't matter
    pair = sorted([user["user_id"], friend_id])

    existing = await db.chat_rooms.find_one({
        "room_type": "friends_only",
        "participant_ids": pair
    }, {"_id": 0})
    if existing:
        return existing

    # Fetch friend's display name for the room name
    friend_doc = await db.users.find_one({"user_id": friend_id}, {"_id": 0, "name": 1, "nickname": 1})
    if not friend_doc:
        raise HTTPException(status_code=404, detail="Friend not found")

    friend_name = friend_doc.get("nickname") or friend_doc["name"]
    my_name = user.get("nickname") or user["name"]

    room = ChatRoom(
        name=f"{my_name} & {friend_name}",
        description="Private friends chat",
        icon="💬",
        room_type="friends_only",
        participant_ids=pair,
        max_capacity=2,
    )
    doc = room.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.chat_rooms.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.post("/chat/rooms/suburb")
async def create_suburb_room(room_data: SuburbRoomCreate, user: dict = Depends(get_current_user)):
    """Create a suburb chat room on-demand, keyed by postcode"""
    postcode = room_data.postcode.strip()

    # Check if active room for this postcode already exists
    existing = await db.chat_rooms.find_one(
        {"postcode": postcode, "room_type": "suburb", "is_active": True},
        {"_id": 0}
    )
    if existing:
        return existing

    # Geocode to get suburb name, lat/lon, state
    suburb_name = room_data.suburb
    lat, lon, state_code = None, None, None
    geo_result = await geocode_address(postcode)
    if geo_result.get("results"):
        loc = geo_result["results"][0]
        if not suburb_name:
            suburb_name = loc.get("suburb") or loc.get("display_name", "").split(",")[0]
        lat = loc.get("lat")
        lon = loc.get("lon")
        raw_state = loc.get("state", "")
        state_map = {
            "New South Wales": "NSW", "Victoria": "VIC", "Queensland": "QLD",
            "Western Australia": "WA", "South Australia": "SA", "Tasmania": "TAS",
            "Australian Capital Territory": "ACT", "Northern Territory": "NT"
        }
        state_code = state_map.get(raw_state, raw_state)

    if not suburb_name:
        suburb_name = postcode

    room = ChatRoom(
        name=f"{suburb_name} Parents ({postcode})",
        description=f"Connect with parents in {suburb_name} and nearby areas",
        icon="📍",
        room_type="suburb",
        postcode=postcode,
        suburb=suburb_name,
        state=state_code,
        latitude=lat,
        longitude=lon,
        last_activity_at=datetime.now(timezone.utc).isoformat(),
    )

    doc = room.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.chat_rooms.insert_one(doc)

    doc.pop("_id", None)
    return doc

@api_router.get("/chat/rooms/search")
async def search_suburb_rooms(
    q: str,
    user: dict = Depends(get_current_user)
):
    """Search for suburb chat rooms by postcode or suburb name"""
    q = q.strip()
    if len(q) < 2:
        return {"rooms": [], "can_create": False, "search_postcode": None}

    user_lat = user.get("latitude")
    user_lon = user.get("longitude")

    # Search by postcode (exact) or suburb name (contains)
    import re
    query = {
        "room_type": "suburb",
        "is_active": True,
        "$or": [
            {"postcode": q},
            {"suburb": {"$regex": re.escape(q), "$options": "i"}}
        ]
    }
    rooms = await db.chat_rooms.find(query, {"_id": 0}).to_list(20)

    # Add distance if user has location
    for room in rooms:
        if user_lat and user_lon and room.get("latitude") and room.get("longitude"):
            room["distance_km"] = round(
                calculate_distance(user_lat, user_lon, room["latitude"], room["longitude"]), 1
            )

    rooms.sort(key=lambda x: x.get("distance_km", 9999))

    # Check if the searched postcode has a room (for "create" CTA)
    search_postcode = q if q.isdigit() and len(q) == 4 else None
    can_create = False
    if search_postcode:
        has_room = any(r.get("postcode") == search_postcode for r in rooms)
        can_create = not has_room

    return {"rooms": rooms, "can_create": can_create, "search_postcode": search_postcode}

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
                "state": room.get("state"),
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
async def get_room_messages(room_id: str, limit: int = 50, before: Optional[str] = None, user: dict = Depends(get_current_user)):
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    # Friends-only rooms are restricted to participants
    if room.get("room_type") == "friends_only":
        if user["user_id"] not in room.get("participant_ids", []):
            raise HTTPException(status_code=403, detail="Access denied")

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

    is_friends_room = room.get("room_type") == "friends_only"

    # Friends-only rooms: check participant access, exempt from daily limit
    if is_friends_room:
        if user["user_id"] not in room.get("participant_ids", []):
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Check freemium limits for non-friends rooms
        sub = await get_user_subscription_status(user)
        if sub["limits_apply"]:
            limit_check = await check_chat_message_limit(user["user_id"])
            if not limit_check["allowed"]:
                raise HTTPException(status_code=429, detail={
                    "error": "daily_chat_limit",
                    "used": limit_check["used"],
                    "limit": limit_check["limit"],
                    "message": f"You've used all {limit_check['limit']} messages today. Upgrade to premium for unlimited chat."
                })

    message = ChatMessage(
        room_id=room_id,
        author_id=user["user_id"],
        author_name=user.get("nickname") or user["name"],
        author_picture=user.get("picture"),
        author_subscription_tier=user.get("subscription_tier", "free"),
        content=message_data.content
    )
    
    doc = message.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.chat_messages.insert_one(doc)
    if not is_friends_room:
        await increment_usage(user["user_id"], "chat_messages")

    # Update room last_activity_at and re-activate if archived
    await db.chat_rooms.update_one(
        {"room_id": room_id},
        {"$set": {"last_activity_at": datetime.now(timezone.utc).isoformat(), "is_active": True}}
    )

    return message.model_dump()

# ==================== LOCATION ENDPOINTS ====================

@api_router.get("/location/search")
async def search_location(q: str, state: Optional[str] = None):
    """Search for Australian locations using OpenStreetMap"""
    if len(q) < 2:
        return {"results": []}
    
    result = await geocode_address(q, state)
    return result

@api_router.get("/location/nearby-users")
async def get_nearby_users(
    user: dict = Depends(get_current_user),
    distance_km: int = 25,
    limit: int = 20
):
    """Get users within a certain distance"""
    user_lat = user.get("latitude")
    user_lon = user.get("longitude")
    
    if not user_lat or not user_lon:
        return {"users": [], "message": "Please set your location first"}
    
    nearby = await get_users_within_distance(user_lat, user_lon, distance_km, user["user_id"])
    
    # Remove sensitive info
    for u in nearby[:limit]:
        u.pop("email", None)
        u.pop("password_hash", None)
    
    return {"users": nearby[:limit], "search_radius_km": distance_km}

@api_router.get("/location/distance-options")
async def get_distance_options():
    """Get available distance options for filtering"""
    return {"options": DISTANCE_OPTIONS, "states": AUSTRALIAN_STATES}

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
    # Check freemium limits
    sub = await get_user_subscription_status(user)
    if sub["limits_apply"]:
        limit_check = await check_chat_message_limit(user["user_id"])
        if not limit_check["allowed"]:
            raise HTTPException(status_code=429, detail={
                "error": "daily_chat_limit",
                "used": limit_check["used"],
                "limit": limit_check["limit"],
                "message": f"You've used all {limit_check['limit']} messages today. Upgrade to premium for unlimited messaging."
            })

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
    await increment_usage(user["user_id"], "chat_messages")

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
            "link": f"http://localhost:3000/messages/{user['user_id']}"
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
            "link": "http://localhost:3000/friends"
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
    
    # Batch fetch all friend user docs instead of N+1 queries
    friend_id_map = {}
    for friendship in friendships:
        friend_id = friendship["user2_id"] if friendship["user1_id"] == user["user_id"] else friendship["user1_id"]
        friend_id_map[friend_id] = friendship

    friend_ids = list(friend_id_map.keys())
    friend_docs = await db.users.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).to_list(None)

    online_threshold = datetime.now(timezone.utc) - timedelta(minutes=3)

    friends = []
    for friend in friend_docs:
        friendship = friend_id_map.get(friend["user_id"])
        if friendship:
            friend["friendship_date"] = friendship["created_at"]
        # Compute online status
        last_seen = friend.get("last_seen_at")
        if last_seen:
            try:
                ls_dt = datetime.fromisoformat(last_seen)
                if ls_dt.tzinfo is None:
                    ls_dt = ls_dt.replace(tzinfo=timezone.utc)
                friend["is_online"] = ls_dt >= online_threshold
            except Exception:
                friend["is_online"] = False
        else:
            friend["is_online"] = False
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
async def get_feed(request: Request, limit: int = 20, skip: int = 0):
    """Get recent posts for the home feed"""
    # Exclude only_me posts unless the viewer is the author
    current_user_id = None
    try:
        cu = await get_current_user(request)
        current_user_id = cu["user_id"]
    except Exception:
        pass
    query = {"$or": [{"visibility": {"$ne": "only_me"}}, {"visibility": None}]}
    if current_user_id:
        query = {"$or": [
            {"visibility": {"$ne": "only_me"}},
            {"visibility": None},
            {"visibility": "only_me", "author_id": current_user_id}
        ]}
    posts = await db.forum_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    # Batch fetch category info
    category_ids = list(set(post["category_id"] for post in posts if "category_id" in post))
    categories_list = await db.forum_categories.find(
        {"category_id": {"$in": category_ids}}, {"_id": 0}
    ).to_list(None)
    categories_map = {c["category_id"]: c for c in categories_list}

    for post in posts:
        category = categories_map.get(post.get("category_id"))
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

# ==================== SUBSCRIPTION ENDPOINT ====================

@api_router.get("/subscription/status")
async def get_subscription_status(user: dict = Depends(get_current_user)):
    status = await get_user_subscription_status(user)
    result = {**status}
    if status["limits_apply"]:
        result["forum_posts"] = await check_forum_post_limit(user["user_id"])
        result["forum_replies"] = await check_forum_reply_limit(user["user_id"])
        result["chat_messages"] = await check_chat_message_limit(user["user_id"])
    result["trial_ends_at"] = user.get("trial_ends_at")
    return result

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/analytics")
async def admin_get_analytics(admin: dict = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")

    total_users = await db.users.count_documents({})
    new_today = await db.users.count_documents({"created_at": {"$gte": today}})
    new_this_week = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    new_this_month = await db.users.count_documents({"created_at": {"$gte": month_ago}})

    premium_users = await db.users.count_documents({"subscription_tier": "premium"})
    trial_users = await db.users.count_documents({"subscription_tier": "trial"})
    free_users = await db.users.count_documents({"subscription_tier": {"$in": ["free", None]}})
    banned_users = await db.users.count_documents({"is_banned": True})

    total_posts = await db.forum_posts.count_documents({})
    total_replies = await db.forum_replies.count_documents({})
    total_chat_messages = await db.chat_messages.count_documents({})
    total_dms = await db.direct_messages.count_documents({})
    pending_reports = await db.reports.count_documents({"status": "pending"})

    dau = await db.usage_tracking.distinct("user_id", {"date": today})
    wau_dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    wau = await db.usage_tracking.distinct("user_id", {"date": {"$in": wau_dates}})
    mau_dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
    mau = await db.usage_tracking.distinct("user_id", {"date": {"$in": mau_dates}})

    categories = await db.forum_categories.find({}, {"_id": 0}).sort("post_count", -1).to_list(20)
    rooms = await db.chat_rooms.find({}, {"_id": 0}).sort("member_count", -1).limit(10).to_list(10)

    # Kindness Health: % of posts NOT reported in the last 7 days
    seven_days_ago_iso = (now - timedelta(days=7)).isoformat()
    reported_last_7d = await db.reports.count_documents({
        "status": "pending",
        "created_at": {"$gte": seven_days_ago_iso}
    })
    posts_last_7d = await db.forum_posts.count_documents({
        "created_at": {"$gte": seven_days_ago_iso}
    })
    if posts_last_7d > 0:
        kindness_health = round(max(0, (posts_last_7d - reported_last_7d) / posts_last_7d * 100))
    else:
        kindness_health = 100

    # Unanswered support posts: posts with 0 replies created in last 24h
    yesterday_iso = (now - timedelta(hours=24)).isoformat()
    unanswered_tonight = await db.forum_posts.count_documents({
        "reply_count": 0,
        "created_at": {"$gte": yesterday_iso}
    })

    # Circle growth: new users this week
    circle_growth = new_this_week

    return {
        "users": {
            "total": total_users, "new_today": new_today,
            "new_this_week": new_this_week, "new_this_month": new_this_month,
            "premium": premium_users, "trial": trial_users, "free": free_users,
            "banned": banned_users
        },
        "active_users": {"dau": len(dau), "wau": len(wau), "mau": len(mau)},
        "content": {
            "total_posts": total_posts, "total_replies": total_replies,
            "total_chat_messages": total_chat_messages, "total_dms": total_dms,
            "pending_reports": pending_reports
        },
        "moderation": {
            "kindness_health": kindness_health,
            "unanswered_tonight": unanswered_tonight,
            "reported_issues": pending_reports,
            "circle_growth": circle_growth
        },
        "categories": categories,
        "top_chat_rooms": rooms
    }

@api_router.get("/admin/analytics/growth")
async def admin_get_growth(days: int = 30, admin: dict = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    result = []
    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        date_str = day.strftime("%Y-%m-%d")
        next_str = (day + timedelta(days=1)).strftime("%Y-%m-%d")
        count = await db.users.count_documents({
            "created_at": {"$gte": date_str, "$lt": next_str}
        })
        result.append({"date": date_str, "signups": count})
    return result

@api_router.get("/admin/users")
async def admin_get_users(
    page: int = 1, limit: int = 20, search: Optional[str] = None,
    filter: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"nickname": {"$regex": search, "$options": "i"}}
        ]
    if filter == "auto_suspended":
        query["auto_suspended"] = True
        query["is_banned"] = True
    elif filter == "banned":
        query["is_banned"] = True
        query["auto_suspended"] = {"$ne": True}
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    return {"users": users, "total": total, "page": page, "pages": math.ceil(total / limit) if total > 0 else 1}

@api_router.post("/admin/users/{user_id}/ban")
async def admin_ban_user(user_id: str, request: Request, admin: dict = Depends(get_admin_user)):
    body = await request.json()
    reason = body.get("reason", "Violation of community guidelines")
    target = await db.users.find_one({"user_id": user_id})
    if not target:
        raise HTTPException(404, "User not found")
    if target.get("role") == "admin":
        raise HTTPException(403, "Cannot ban admin users")
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_banned": True, "ban_reason": reason}})
    return {"message": "User banned"}

@api_router.post("/admin/users/{user_id}/unban")
async def admin_unban_user(user_id: str, admin: dict = Depends(get_admin_user)):
    await db.users.update_one({"user_id": user_id}, {"$set": {"is_banned": False, "ban_reason": None}})
    return {"message": "User unbanned"}

@api_router.post("/admin/users/{user_id}/role")
async def admin_set_role(user_id: str, request: Request, admin: dict = Depends(get_admin_user)):
    body = await request.json()
    role = body.get("role")
    if role not in ("user", "moderator", "admin"):
        raise HTTPException(400, "Invalid role")
    if admin.get("role") != "admin" and role == "admin":
        raise HTTPException(403, "Only admins can promote to admin")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": role}})
    return {"message": f"Role updated to {role}"}

@api_router.post("/admin/users/{user_id}/subscription")
async def admin_set_subscription(user_id: str, request: Request, admin: dict = Depends(get_admin_user)):
    body = await request.json()
    tier = body.get("tier")
    if tier not in ("free", "trial", "premium"):
        raise HTTPException(400, "Invalid tier")
    update = {"subscription_tier": tier}
    if tier == "premium":
        update["premium_since"] = datetime.now(timezone.utc).isoformat()
    elif tier == "trial":
        update["trial_ends_at"] = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.users.update_one({"user_id": user_id}, {"$set": update})
    return {"message": f"Subscription updated to {tier}"}

@api_router.get("/admin/reports")
async def admin_get_reports(
    status: str = "pending", page: int = 1, limit: int = 20,
    admin: dict = Depends(get_admin_user)
):
    query = {"status": status}
    skip = (page - 1) * limit
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    for report in reports:
        if report.get("content_type") == "post":
            content = await db.forum_posts.find_one({"post_id": report.get("content_id")}, {"_id": 0})
        else:
            content = await db.forum_replies.find_one({"reply_id": report.get("content_id")}, {"_id": 0})
        report["content"] = content
        reporter = await db.users.find_one({"user_id": report.get("reporter_id")}, {"_id": 0, "password_hash": 0})
        report["reporter"] = reporter

    total = await db.reports.count_documents(query)
    return {"reports": reports, "total": total, "page": page, "pages": math.ceil(total / limit) if total > 0 else 1}

@api_router.post("/admin/reports/{report_id}/action")
async def admin_report_action(report_id: str, request: Request, admin: dict = Depends(get_admin_user)):
    body = await request.json()
    action = body.get("action")
    report = await db.reports.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(404, "Report not found")

    if action == "dismiss":
        await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "dismissed"}})
    elif action == "remove_content":
        content_author_id = None
        if report.get("content_type") == "post":
            post = await db.forum_posts.find_one({"post_id": report["content_id"]})
            if post:
                content_author_id = post.get("author_id")
                await db.forum_posts.delete_one({"post_id": report["content_id"]})
                # Decrement the category post count
                await db.forum_categories.update_one(
                    {"category_id": post.get("category_id")},
                    {"$inc": {"post_count": -1}}
                )
        else:
            reply = await db.forum_replies.find_one({"reply_id": report["content_id"]})
            if reply:
                content_author_id = reply.get("author_id")
                await db.forum_replies.delete_one({"reply_id": report["content_id"]})
                # Decrement the post reply count
                await db.forum_posts.update_one(
                    {"post_id": reply.get("post_id")},
                    {"$inc": {"reply_count": -1}}
                )
        # Notify the content author
        if content_author_id:
            notification = {
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": content_author_id,
                "type": "moderation",
                "title": "Content Removed",
                "message": "Your post was removed by a moderator for violating community guidelines.",
                "link": "/forums",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
        await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "resolved"}})
    elif action == "ban_user":
        if report.get("content_type") == "post":
            content = await db.forum_posts.find_one({"post_id": report["content_id"]})
        else:
            content = await db.forum_replies.find_one({"reply_id": report["content_id"]})
        if content:
            await db.users.update_one(
                {"user_id": content["author_id"]},
                {"$set": {"is_banned": True, "ban_reason": "Content violation"}}
            )
            # Notify the banned user
            notification = {
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": content["author_id"],
                "type": "moderation",
                "title": "Account Suspended",
                "message": "Your account has been suspended for violating community guidelines.",
                "link": None,
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification)
        await db.reports.update_one({"report_id": report_id}, {"$set": {"status": "resolved"}})
    else:
        raise HTTPException(400, "Invalid action")

    return {"message": f"Action '{action}' taken on report"}

@api_router.get("/admin/analytics/retention")
async def admin_get_retention(admin: dict = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    this_week = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    last_week = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7, 14)]
    this_month = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
    last_month = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30, 60)]

    yesterday_users = set(await db.usage_tracking.distinct("user_id", {"date": yesterday}))
    today_users = set(await db.usage_tracking.distinct("user_id", {"date": today}))
    this_week_users = set(await db.usage_tracking.distinct("user_id", {"date": {"$in": this_week}}))
    last_week_users = set(await db.usage_tracking.distinct("user_id", {"date": {"$in": last_week}}))
    this_month_users = set(await db.usage_tracking.distinct("user_id", {"date": {"$in": this_month}}))
    last_month_users = set(await db.usage_tracking.distinct("user_id", {"date": {"$in": last_month}}))

    daily_ret = round(len(yesterday_users & today_users) / len(yesterday_users) * 100) if yesterday_users else 0
    weekly_ret = round(len(last_week_users & this_week_users) / len(last_week_users) * 100) if last_week_users else 0
    monthly_ret = round(len(last_month_users & this_month_users) / len(last_month_users) * 100) if last_month_users else 0

    # Daily active users chart for last 30 days
    daily_activity = []
    for i in range(29, -1, -1):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        count = len(await db.usage_tracking.distinct("user_id", {"date": day}))
        daily_activity.append({"date": day, "active_users": count})

    return {
        "daily_retention": daily_ret,
        "weekly_retention": weekly_ret,
        "monthly_retention": monthly_ret,
        "daily_activity": daily_activity,
        "counts": {
            "dau": len(today_users),
            "wau": len(this_week_users),
            "mau": len(this_month_users),
        }
    }

@api_router.get("/admin/analytics/leaderboards")
async def admin_get_leaderboards(admin: dict = Depends(get_admin_user)):
    async def enrich(raw_list, id_field="_id"):
        result = []
        for item in raw_list:
            uid = item.get(id_field) or item.get("_id")
            u = await db.users.find_one({"user_id": uid}, {"_id": 0, "name": 1, "nickname": 1, "email": 1, "picture": 1, "subscription_tier": 1, "user_id": 1})
            result.append({"count": item["count"], "user": u or {"name": "Deleted User", "user_id": uid}})
        return result

    top_posters = await db.forum_posts.aggregate([
        {"$match": {"author_id": {"$ne": "anonymous"}}},
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10}
    ]).to_list(10)

    top_repliers = await db.forum_replies.aggregate([
        {"$match": {"author_id": {"$ne": "anonymous"}}},
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10}
    ]).to_list(10)

    top_chatters = await db.chat_messages.aggregate([
        {"$group": {"_id": "$author_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10}
    ]).to_list(10)

    top_community_creators = await db.chat_rooms.aggregate([
        {"$match": {"room_type": {"$ne": "friends_only"}, "created_by": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$created_by", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 10}
    ]).to_list(10)

    top_liked = await db.forum_posts.aggregate([
        {"$match": {"like_count": {"$gt": 0}}},
        {"$sort": {"like_count": -1}}, {"$limit": 10},
        {"$project": {"_id": 0, "post_id": 1, "title": 1, "like_count": 1, "reply_count": 1, "author_name": 1, "author_id": 1, "created_at": 1}}
    ]).to_list(10)

    top_replied = await db.forum_posts.aggregate([
        {"$match": {"reply_count": {"$gt": 0}}},
        {"$sort": {"reply_count": -1}}, {"$limit": 10},
        {"$project": {"_id": 0, "post_id": 1, "title": 1, "reply_count": 1, "like_count": 1, "author_name": 1, "author_id": 1, "created_at": 1}}
    ]).to_list(10)

    return {
        "top_posters": await enrich(top_posters),
        "top_repliers": await enrich(top_repliers),
        "top_chatters": await enrich(top_chatters),
        "top_community_creators": await enrich(top_community_creators),
        "top_liked_posts": top_liked,
        "top_replied_posts": top_replied,
    }

@api_router.get("/admin/drilldown")
async def admin_drilldown(type: str, admin: dict = Depends(get_admin_user)):
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    fields = {"_id": 0, "password_hash": 0}

    if type == "dau":
        ids = await db.usage_tracking.distinct("user_id", {"date": today})
        users = await db.users.find({"user_id": {"$in": ids}}, fields).to_list(500)
        return {"label": "Active Today (DAU)", "users": users}
    elif type == "wau":
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
        ids = await db.usage_tracking.distinct("user_id", {"date": {"$in": dates}})
        users = await db.users.find({"user_id": {"$in": ids}}, fields).to_list(500)
        return {"label": "Active This Week (WAU)", "users": users}
    elif type == "mau":
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
        ids = await db.usage_tracking.distinct("user_id", {"date": {"$in": dates}})
        users = await db.users.find({"user_id": {"$in": ids}}, fields).to_list(500)
        return {"label": "Active This Month (MAU)", "users": users}
    elif type == "new_today":
        users = await db.users.find({"created_at": {"$gte": today}}, fields).sort("created_at", -1).to_list(500)
        return {"label": "New Users Today", "users": users}
    elif type == "new_week":
        users = await db.users.find({"created_at": {"$gte": week_ago}}, fields).sort("created_at", -1).to_list(500)
        return {"label": "New Users This Week", "users": users}
    elif type == "new_month":
        users = await db.users.find({"created_at": {"$gte": month_ago}}, fields).sort("created_at", -1).to_list(500)
        return {"label": "New Users This Month", "users": users}
    elif type == "premium":
        users = await db.users.find({"subscription_tier": "premium"}, fields).sort("premium_since", -1).to_list(500)
        return {"label": "Village+ Members", "users": users}
    elif type == "trial":
        users = await db.users.find({"subscription_tier": "trial"}, fields).to_list(500)
        return {"label": "Trial Users", "users": users}
    elif type == "free":
        users = await db.users.find({"subscription_tier": {"$in": ["free", None]}}, fields).sort("created_at", -1).to_list(500)
        return {"label": "Free Users", "users": users}
    elif type == "banned":
        users = await db.users.find({"is_banned": True}, fields).to_list(500)
        return {"label": "Banned Users", "users": users}
    elif type == "posts":
        posts = await db.forum_posts.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
        return {"label": "Recent Forum Posts", "posts": posts}
    elif type == "replies":
        items = await db.forum_replies.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
        return {"label": "Recent Replies", "items": items}
    elif type == "chat_messages":
        items = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
        return {"label": "Recent Chat Messages", "items": items}
    elif type == "dms":
        items = await db.direct_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
        return {"label": "Recent Direct Messages", "items": items}
    elif type == "unanswered":
        yesterday_iso = (now - timedelta(hours=24)).isoformat()
        posts = await db.forum_posts.find({"reply_count": 0, "created_at": {"$gte": yesterday_iso}}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"label": "Unanswered Posts (last 24h)", "posts": posts}
    elif type == "reported":
        reports = await db.reports.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"label": "Pending Reports", "items": reports}
    else:
        raise HTTPException(400, "Invalid drilldown type")

# ==================== BLOG ====================

class BlogSubmit(BaseModel):
    title: str
    content: str
    excerpt: str = ""
    tags: List[str] = []

@api_router.get("/blog")
async def list_blog_posts(request: Request, include_own: bool = False):
    """List published blog posts. If include_own=true and user authenticated, also return their own drafts."""
    current_user = None
    try:
        current_user = await get_current_user(request)
    except Exception:
        pass

    query: dict = {"is_published": True}
    posts = await db.blog_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)

    if include_own and current_user:
        own_drafts = await db.blog_posts.find(
            {"author_user_id": current_user["user_id"], "is_published": False},
            {"_id": 0}
        ).sort("created_at", -1).to_list(20)
        posts = posts + own_drafts

    return posts

@api_router.post("/blog/submit")
async def submit_blog_post(post_data: BlogSubmit, user: dict = Depends(get_current_user)):
    """Any authenticated user can submit a blog post for review"""
    raw_slug = re.sub(r"[^a-z0-9\s-]", "", post_data.title.lower())
    slug = re.sub(r"\s+", "-", raw_slug.strip())[:60] + "-" + uuid.uuid4().hex[:6]

    post = {
        "blog_id": f"blog_{uuid.uuid4().hex[:12]}",
        "title": post_data.title,
        "slug": slug,
        "summary": post_data.excerpt,
        "content": post_data.content,
        "tags": post_data.tags,
        "is_published": False,
        "is_ai_generated": False,
        "status": "pending_review",
        "author_user_id": user["user_id"],
        "author_name": user.get("nickname") or user["name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "view_count": 0,
    }
    await db.blog_posts.insert_one({**post, "_id": post["blog_id"]})
    return {k: v for k, v in post.items() if k != "_id"}

@api_router.get("/blog/pending")
async def get_pending_blog_posts(current_user: dict = Depends(get_current_user)):
    """Admin/moderator: get posts awaiting review"""
    if current_user.get("role") not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin only")
    posts = await db.blog_posts.find(
        {"is_published": False, "status": "pending_review"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return posts

@api_router.post("/blog/{blog_id}/approve")
async def approve_blog_post(blog_id: str, current_user: dict = Depends(get_current_user)):
    """Admin/moderator: approve and publish a submitted blog post"""
    if current_user.get("role") not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.blog_posts.update_one(
        {"blog_id": blog_id},
        {"$set": {"is_published": True, "status": "published", "published_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Published"}

@api_router.post("/blog/{blog_id}/reject")
async def reject_blog_post(blog_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Admin/moderator: reject a submitted blog post"""
    if current_user.get("role") not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin only")
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    update = {"status": "rejected"}
    if body.get("reason"):
        update["reject_reason"] = body["reason"]
    result = await db.blog_posts.update_one({"blog_id": blog_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Rejected"}

@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    """Get a single blog post by slug"""
    post = await db.blog_posts.find_one({"slug": slug, "is_published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.blog_posts.update_one({"slug": slug}, {"$inc": {"view_count": 1}})
    return post

@api_router.post("/blog/generate")
async def generate_blog_post(current_user: dict = Depends(get_current_user)):
    """Admin: generate an AI blog post based on hot forum topics"""
    if current_user.get("role") not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin only")

    openai_key = os.environ.get("OPENAI_API_KEY", "")
    if not openai_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    # Gather hot forum topics from the last 7 days
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    hot_posts = await db.forum_posts.find(
        {"created_at": {"$gte": week_ago}},
        {"_id": 0, "title": 1, "reply_count": 1, "like_count": 1}
    ).sort("reply_count", -1).to_list(10)

    hot_topics = [p["title"] for p in hot_posts if p.get("title")]
    topics_text = "\n".join(f"- {t}" for t in hot_topics[:6]) if hot_topics else "- General parenting support\n- Sleep challenges\n- Newborn care"

    prompt = f"""You are a warm, expert parenting writer for The Village — an Australian parenting support community.

This week's trending topics in our community:
{topics_text}

Write a helpful, evidence-based blog post inspired by one of these themes. Use real facts from credible research (e.g. AIHW, WHO, peer-reviewed studies — no made-up citations, just state facts naturally). The tone is warm, supportive, non-judgmental, Australian.

Respond with a JSON object with these exact fields:
- "title": a compelling headline (string)
- "summary": 1–2 sentence overview (string)
- "content": full article in markdown, 450–600 words (string)
- "tags": 3–5 topic tags (array of strings)
"""

    try:
        from openai import AsyncOpenAI
        ai_client = AsyncOpenAI(api_key=openai_key)
        response = await ai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            max_tokens=1600
        )
        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Build slug from title
    raw_slug = re.sub(r"[^a-z0-9\s-]", "", result.get("title", "blog").lower())
    slug = re.sub(r"\s+", "-", raw_slug.strip())[:60] + "-" + uuid.uuid4().hex[:6]

    post = {
        "blog_id": f"blog_{uuid.uuid4().hex[:12]}",
        "title": result.get("title", "Untitled"),
        "slug": slug,
        "summary": result.get("summary", ""),
        "content": result.get("content", ""),
        "tags": result.get("tags", []),
        "source_topics": hot_topics[:6],
        "is_published": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "view_count": 0,
    }

    await db.blog_posts.insert_one({**post, "_id": post["blog_id"]})
    return {k: v for k, v in post.items() if k != "_id"}

@api_router.delete("/blog/{blog_id}")
async def delete_blog_post(blog_id: str, current_user: dict = Depends(get_current_user)):
    """Admin: delete a blog post"""
    if current_user.get("role") not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.blog_posts.delete_one({"blog_id": blog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Deleted"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial forum categories and chat rooms"""

    # Auto-create admin account if not exists
    if ADMIN_PASSWORD:
        admin_exists = await db.users.find_one({"email": ADMIN_EMAIL})
        if not admin_exists:
            admin_user = {
                "user_id": f"admin_{uuid.uuid4().hex[:12]}",
                "email": ADMIN_EMAIL,
                "name": "Admin",
                "password_hash": hash_password(ADMIN_PASSWORD),
                "picture": None,
                "nickname": "Village Admin",
                "bio": "Platform administrator",
                "role": "admin",
                "subscription_tier": "premium",
                "trial_ends_at": None,
                "premium_since": datetime.now(timezone.utc).isoformat(),
                "is_banned": False,
                "ban_reason": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(admin_user)
            logging.info(f"Admin account created: {ADMIN_EMAIL}")

    # Create database indexes
    await db.usage_tracking.create_index([("user_id", 1), ("date", 1)], unique=True)
    await db.users.create_index("role")
    await db.users.create_index("subscription_tier")
    await db.users.create_index("created_at")
    await db.reports.create_index("status")
    await db.chat_rooms.create_index("postcode")
    await db.chat_rooms.create_index([("room_type", 1), ("is_active", 1)])
    await db.chat_rooms.create_index("last_activity_at")
    await db.forum_posts.create_index([("category_id", 1), ("state", 1)])
    await db.forum_categories.create_index([("is_user_created", 1), ("created_by", 1)])
    await db.forum_categories.create_index("category_type")
    await db.chat_rooms.create_index([("room_type", 1), ("participant_ids", 1)])
    await db.users.create_index("last_seen_at")

    # Remove legacy category names that have been renamed to Circles
    LEGACY_CATEGORY_NAMES = [
        "Breastfeeding & Feeding", "Sleep & Routines", "Mental Health",
        "Single Parenting", "Newborn (0-3 months)", "Infant (3-12 months)",
        "Toddler (1-3 years)", "Preschool (3-5 years)", "Expecting Parents",
    ]
    CIRCLE_MIGRATION = {
        "Breastfeeding & Feeding": "Feeding Circle",
        "Sleep & Routines": "Sleep Circle",
        "Mental Health": "Mental Health Circle",
        "Single Parenting": "Single Parent Circle",
        "Newborn (0-3 months)": "Newborn Circle",
        "Infant (3-12 months)": "Infant Circle",
        "Toddler (1-3 years)": "Toddler Circle",
        "Preschool (3-5 years)": "Toddler Circle",
        "Expecting Parents": "Expecting Circle",
    }
    for old_name, new_name in CIRCLE_MIGRATION.items():
        old_cat = await db.forum_categories.find_one({"name": old_name})
        if old_cat:
            new_cat = await db.forum_categories.find_one({"name": new_name})
            if new_cat:
                await db.forum_posts.update_many(
                    {"category_id": old_cat["category_id"]},
                    {"$set": {"category_id": new_cat["category_id"]}}
                )
            await db.forum_categories.delete_one({"_id": old_cat["_id"]})

    # Topic-based categories (Circles)
    topic_categories = [
        {"name": "Feeding Circle", "description": "Support for breastfeeding, pumping, formula, and feeding challenges", "icon": "🍼", "category_type": "topic"},
        {"name": "Sleep Circle", "description": "Sleep training, routines, leaps, regressions, and those sleepless nights — share tips and support", "icon": "🌙", "category_type": "topic"},
        {"name": "Mental Health Circle", "description": "A safe space to discuss postpartum emotions and self-care", "icon": "💚", "category_type": "topic"},
        {"name": "Dad Circle", "description": "A space just for dads — no judgment, just real talk", "icon": "👨", "category_type": "topic"},
        {"name": "Single Parent Circle", "description": "Support, tips, and connection for single mums and dads", "icon": "💪", "category_type": "topic"},
        {"name": "Relationships", "description": "Navigating partner, family, and friend dynamics", "icon": "💕", "category_type": "topic"},
        {"name": "Development & Milestones", "description": "Tracking growth and celebrating achievements", "icon": "⭐", "category_type": "topic"},
        {"name": "Health & Wellness", "description": "Baby and parent health questions and advice", "icon": "🏥", "category_type": "topic"},
        {"name": "Just Venting", "description": "Sometimes you just need to get it off your chest", "icon": "💨", "category_type": "topic"},
        {"name": "Local Meetups", "description": "Organise and find parent meetups in your area", "icon": "📍", "category_type": "topic", "is_location_aware": True},
        {"name": "Raising Multiples", "description": "For parents of twins, triplets, and beyond — twice (or more!) the love and chaos", "icon": "👶", "category_type": "topic"},
    ]
    
    # Age-based categories (Circles)
    age_categories = [
        {"name": "Newborn Circle", "description": "For parents of brand new babies (0–3 months)", "icon": "👶", "category_type": "age_group"},
        {"name": "Infant Circle", "description": "First year adventures and challenges (3–12 months)", "icon": "🧒", "category_type": "age_group"},
        {"name": "Toddler Circle", "description": "The wild toddler years (1–3 years)", "icon": "🚶", "category_type": "age_group"},
        {"name": "School Age Circle", "description": "For parents of school-age kids (5–12 years)", "icon": "🎒", "category_type": "age_group"},
        {"name": "Teenager Circle", "description": "Navigating the teen years (13+)", "icon": "🧑", "category_type": "age_group"},
        {"name": "Expecting Circle", "description": "Pregnancy support and preparation", "icon": "🤰", "category_type": "age_group"},
    ]
    
    all_categories = topic_categories + age_categories
    
    # Clean up duplicate categories
    for cat in all_categories:
        dupes = await db.forum_categories.find({"name": cat["name"]}).to_list(100)
        if len(dupes) > 1:
            # Keep the first, delete the rest
            for dup in dupes[1:]:
                await db.forum_categories.delete_one({"_id": dup["_id"]})

    for cat in all_categories:
        existing = await db.forum_categories.find_one({"name": cat["name"]})
        if not existing:
            cat["category_id"] = f"cat_{uuid.uuid4().hex[:12]}"
            cat["post_count"] = 0
            cat["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.forum_categories.insert_one(cat)
        else:
            # Always sync description so updates in seed are reflected
            update_fields = {"description": cat["description"]}
            if "is_location_aware" in cat:
                update_fields["is_location_aware"] = cat["is_location_aware"]
            await db.forum_categories.update_one(
                {"name": cat["name"]},
                {"$set": update_fields}
            )
    
    # Clear old global/region/state chat rooms (suburb rooms are now on-demand)
    await db.chat_rooms.delete_many({"room_type": {"$in": ["global", "local", "state"]}})
    
    # Chat rooms - All Australia (main themed rooms)
    all_australia_rooms = [
        {"name": "3am Club", "description": "For those late-night feeds and sleepless nights. You're not alone!", "icon": "🌙"},
        {"name": "Morning Coffee", "description": "Start your day with fellow Aussie parents", "icon": "☕"},
        {"name": "New Parents Welcome", "description": "A friendly space for first-time parents", "icon": "👋"},
        {"name": "Dad Chat", "description": "A place for dads to talk openly — no judgment, just real conversations", "icon": "👨"},
        {"name": "Single Parents Lounge", "description": "A supportive space for single mums and dads. You're doing amazing!", "icon": "💪"},
        {"name": "Vent Room", "description": "Sometimes you just need to let it out", "icon": "💨"},
        {"name": "Wins & Celebrations", "description": "Share your parenting victories, big or small!", "icon": "🎉"},
    ]
    
    for room in all_australia_rooms:
        existing = await db.chat_rooms.find_one({"name": room["name"], "room_type": "all_australia"})
        if not existing:
            room["room_id"] = f"room_{uuid.uuid4().hex[:12]}"
            room["room_type"] = "all_australia"
            room["is_active"] = True
            room["active_users"] = 0
            room["max_capacity"] = 50
            room["member_count"] = 0
            room["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.chat_rooms.insert_one(room)
    
    return {"message": "Data seeded successfully"}

@api_router.get("/")
async def root():
    return {"message": "NightOwl Parents API"}

# Root health check (supports GET and HEAD)
@app.get("/")
async def health_check():
    return {"status": "ok", "message": "The Village API is running"}

_cors_env = os.environ.get('CORS_ORIGINS', '')
_cors_origins = [o.strip() for o in _cors_env.split(',') if o.strip()] if _cors_env else ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router in the main app (after middleware so CORS applies correctly)
app.include_router(api_router)

@app.on_event("startup")
async def seed_required_rooms():
    """Ensure Mum Chat, Dad Chat, and Mum Circle exist on startup."""
    # Mum Chat — all_australia chat room
    existing = await db.chat_rooms.find_one({"name": "Mum Chat", "room_type": "all_australia"})
    if not existing:
        await db.chat_rooms.insert_one({
            "room_id": f"room_mum_chat",
            "name": "Mum Chat",
            "description": "A space for mums — honest, warm, and judgment-free. Share the highs, the lows, and everything in between.",
            "icon": "👩",
            "room_type": "all_australia",
            "is_active": True,
            "active_users": 0,
            "participant_ids": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Dad Chat — all_australia chat room (seed if missing)
    existing_dad = await db.chat_rooms.find_one({"name": "Dad Chat", "room_type": "all_australia"})
    if not existing_dad:
        await db.chat_rooms.insert_one({
            "room_id": f"room_dad_chat",
            "name": "Dad Chat",
            "description": "A space for dads — no judgment, just real talk.",
            "icon": "👨",
            "room_type": "all_australia",
            "is_active": True,
            "active_users": 0,
            "participant_ids": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Mum Circle — forum category
    existing_cat = await db.forum_categories.find_one({"name": "Mum Circle"})
    if not existing_cat:
        await db.forum_categories.insert_one({
            "category_id": "mum-circle",
            "name": "Mum Circle",
            "description": "A dedicated space for mums. Share your experience, ask questions, and support each other through the journey of motherhood.",
            "icon": "👩",
            "category_type": "topic",
            "post_count": 0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Dad Circle — forum category (seed if missing)
    existing_dad_cat = await db.forum_categories.find_one({"name": "Dad Circle"})
    if not existing_dad_cat:
        await db.forum_categories.insert_one({
            "category_id": "dad-circle",
            "name": "Dad Circle",
            "description": "A space for dads — no judgment, just real talk about fatherhood.",
            "icon": "👨",
            "category_type": "topic",
            "post_count": 0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
