from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import bcrypt
import jwt

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
    gender: Optional[str] = None  # female, male, non-binary, prefer-not-say
    connect_with: Optional[str] = "all"  # all, mums, dads, single-parents, same
    is_single_parent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProfileUpdate(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    parenting_stage: Optional[str] = None
    child_age_ranges: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    location: Optional[str] = None
    gender: Optional[str] = None
    connect_with: Optional[str] = None
    is_single_parent: Optional[bool] = None

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
    title: str
    content: str
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

class ForumReply(BaseModel):
    model_config = ConfigDict(extra="ignore")
    reply_id: str = Field(default_factory=lambda: f"reply_{uuid.uuid4().hex[:12]}")
    post_id: str
    author_id: str
    author_name: str
    author_picture: Optional[str] = None
    is_anonymous: bool = False
    content: str
    like_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumReplyCreate(BaseModel):
    content: str
    is_anonymous: bool = False

class ChatRoom(BaseModel):
    model_config = ConfigDict(extra="ignore")
    room_id: str = Field(default_factory=lambda: f"room_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    icon: str
    is_active: bool = True
    member_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    return categories

@api_router.get("/forums/categories/{category_id}")
async def get_category(category_id: str):
    category = await db.forum_categories.find_one({"category_id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@api_router.get("/forums/posts")
async def get_posts(category_id: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {"category_id": category_id} if category_id else {}
    posts = await db.forum_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Mask anonymous posts
    for post in posts:
        if post.get("is_anonymous"):
            post["author_name"] = "Anonymous Parent"
            post["author_picture"] = None
            post["author_id"] = "anonymous"
    
    return posts

@api_router.get("/forums/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.forum_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Increment views
    await db.forum_posts.update_one({"post_id": post_id}, {"$inc": {"views": 1}})
    
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
        content=post_data.content
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

@api_router.get("/forums/posts/{post_id}/replies")
async def get_replies(post_id: str):
    replies = await db.forum_replies.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    for reply in replies:
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
    
    reply = ForumReply(
        post_id=post_id,
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
    
    result = reply.model_dump()
    if reply.is_anonymous:
        result["author_name"] = "Anonymous Parent"
        result["author_picture"] = None
        result["author_id"] = "anonymous"
    
    return result

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
        return {"liked": True}

# ==================== CHAT ROOM ENDPOINTS ====================

@api_router.get("/chat/rooms")
async def get_chat_rooms():
    rooms = await db.chat_rooms.find({"is_active": True}, {"_id": 0}).to_list(50)
    return rooms

@api_router.get("/chat/rooms/{room_id}")
async def get_chat_room(room_id: str):
    room = await db.chat_rooms.find_one({"room_id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    return room

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
    
    return message.model_dump()

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
    
    # Chat rooms
    chat_rooms = [
        {"name": "3am Club", "description": "For those late-night feeds and sleepless nights. You're not alone!", "icon": "🌙"},
        {"name": "Morning Coffee", "description": "Start your day with fellow parents", "icon": "☕"},
        {"name": "New Parents Welcome", "description": "A friendly space for first-time parents", "icon": "👋"},
        {"name": "Single Parents Lounge", "description": "A supportive space for single mums and dads. You're doing amazing!", "icon": "💪"},
        {"name": "Vent Room", "description": "Sometimes you just need to let it out", "icon": "💨"},
        {"name": "Wins & Celebrations", "description": "Share your parenting victories, big or small!", "icon": "🎉"},
    ]
    
    for room in chat_rooms:
        existing = await db.chat_rooms.find_one({"name": room["name"]})
        if not existing:
            room["room_id"] = f"room_{uuid.uuid4().hex[:12]}"
            room["is_active"] = True
            room["member_count"] = 0
            room["created_at"] = datetime.now(timezone.utc).isoformat()
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
