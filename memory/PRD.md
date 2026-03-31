# The Village - Product Requirements Document

## Original Problem Statement
Build a website called "The Village" that allows parents to connect during difficult times. The platform serves as a support community where parents can get advice, vent, and share experiences with the tagline: "It takes a village to raise a child."

## User Personas
1. **Night Owl Parents** - Parents up at 2am for feeds needing real-time support
2. **Advice Seekers** - Parents with specific questions about parenting topics
3. **Support Givers** - Experienced parents wanting to help others
4. **Anonymous Venters** - Parents needing to share struggles without judgment
5. **Single Parents** - Solo parents seeking dedicated support and connection

## Core Requirements (All Complete ✅)
- ✅ User authentication (Email/Password + Google OAuth)
- ✅ Discussion forums organized by topic and child's age
- ✅ Real-time chat rooms (Global + Local by region)
- ✅ Anonymous posting option for sensitive topics
- ✅ Direct messaging between parents
- ✅ User profiles with parenting stage info
- ✅ Light/Dark mode ("Night Light" theme)
- ✅ Single parent features (badge, dedicated rooms, discovery)
- ✅ Friends system with requests and management
- ✅ Universal DM access (clickable profiles everywhere)
- ✅ Enhanced forum system (14 features)
- ✅ Image uploads (posts + profile pictures)
- ✅ Email notifications (replies, DMs, friend requests, weekly digest)
- ✅ Location-based chat rooms (Local + Global)

---

## What's Been Implemented

### Authentication & Users
- Complete auth system (JWT + Google OAuth via Emergent)
- User profiles with bio, location, region, gender, connection preferences
- Profile picture uploads (base64)
- Single parent toggle and badge
- Night Owl badge (10pm-4am activity)
- Email notification preferences

### Forums (14 Features)
1. ✅ Sorting & Filtering (newest, oldest, popular, most_replies, unanswered)
2. ✅ Edit/Delete Posts (by author)
3. ✅ Bookmark/Save Posts (/bookmarks page)
4. ✅ Nested/Threaded Replies (visual differentiation by depth)
5. ✅ Trending Posts Section (sidebar)
6. ✅ Unanswered Posts Filter ("Needs Reply" badge)
7. ✅ Like Replies
8. ✅ Post Notifications (bell icon with unread count)
9. ✅ Enhanced Category Cards (post count, active users, last activity)
10. ✅ Character Count (5000 max)
11. ✅ Pagination
12. ✅ Report Posts/Replies
13. ✅ Community Guidelines Modal
14. ✅ Image Attachments on Posts

### Chat Rooms (New: Location-Based)
**Global Rooms** (open to all):
- 🌙 3am Club
- ☕ Morning Coffee
- 👋 New Parents Welcome
- 💪 Single Parents Lounge
- 💨 Vent Room
- 🎉 Wins & Celebrations

**Local Rooms** (by region):
- 📍 Local Parents - [Region]
- 🤝 Local Meetups - [Region]
- Regions: UK, US, Australia, Europe, Asia

**Features:**
- Local/Global tabs
- Region selector
- Active user count
- Capacity-based overflow (auto-creates Room 2, Room 3... when capacity > 50)

### Direct Messaging
- Private conversations with unread counts
- Initiate DM from profiles, forums, chat, dashboard
- Email notifications for new DMs

### Friends System
- Send/Accept/Decline requests
- Friends page with 3 tabs
- Notification badge
- Email notifications for requests

### Email Notifications (New)
- New replies to your posts
- New direct messages
- Friend requests
- Weekly digest
- Toggle preferences in profile settings
- Powered by Resend (requires RESEND_API_KEY)

### Image Uploads (New)
- Profile pictures (camera icon when editing)
- Forum post attachments
- Max 5MB, supports JPEG/PNG/GIF/WebP
- Stored as base64 data URLs

---

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor, Resend (email)
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Auth**: JWT + Emergent Google OAuth
- **Fonts**: @fontsource/nunito, @fontsource/dm-sans

---

## API Endpoints

### Auth
- POST /api/auth/register, login, logout
- POST /api/auth/session (Google OAuth)
- GET /api/auth/me

### Users
- GET /api/users/{id}
- PUT /api/users/profile (includes region, picture, email_preferences)
- GET /api/users/single-parents

### Forums
- GET /api/forums/categories
- GET /api/forums/posts?sort=&filter_type=&skip=&limit=
- GET /api/forums/posts/trending
- POST /api/forums/posts (with image support)
- PUT/DELETE /api/forums/posts/{id}
- POST /api/forums/posts/{id}/like
- POST /api/forums/posts/{id}/bookmark
- GET /api/bookmarks
- GET/POST /api/forums/posts/{id}/replies
- PUT/DELETE /api/forums/replies/{id}
- POST /api/forums/replies/{id}/like

### Chat
- GET /api/chat/rooms (returns {local_rooms, global_rooms, user_region, available_regions})
- GET /api/chat/rooms/all (public, global only)
- POST /api/chat/rooms/{id}/join
- POST /api/chat/rooms/{id}/leave
- GET/POST /api/chat/rooms/{id}/messages

### Messages
- GET /api/messages/conversations
- GET/POST /api/messages/{user_id}

### Friends
- POST /api/friends/request
- GET /api/friends/requests, /api/friends/sent, /api/friends
- POST /api/friends/request/{id}/accept, decline
- DELETE /api/friends/{id}
- GET /api/friends/status/{user_id}

### Notifications
- GET /api/notifications
- GET /api/notifications/unread-count
- POST /api/notifications/mark-read
- POST /api/notifications/{id}/read

### Uploads
- POST /api/upload/image (returns base64 data URL)

### Reports
- POST /api/reports

---

## Prioritized Backlog

### P1 - High Priority
- Real-time WebSocket for chat (replace 3s polling)
- Moderation dashboard for admins
- User blocking functionality

### P2 - Medium Priority
- Push notifications (mobile)
- Advanced search with filters
- Chat room activity indicators

### P3 - Nice to Have
- Mobile app (React Native)
- Audio voice notes
- AI content moderation
- Revenue model exploration

---

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://...
DB_NAME=...
JWT_SECRET=...
RESEND_API_KEY=... (optional, for email notifications)
SENDER_EMAIL=onboarding@resend.dev
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://...
```

---

## Test Credentials
- Email: forumtester@test.com
- Password: TestPass123!

## Last Updated
February 2026

## Recent Changes (This Session)
1. Implemented image uploads for posts and profile pictures
2. Added email notification system with Resend integration
3. Created location-based chat rooms (Local + Global)
4. Added region selection to profiles
5. Added email preference toggles to profile settings
6. Chat rooms now show active user counts and capacity indicators
