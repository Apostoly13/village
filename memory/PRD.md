# The Village - Product Requirements Document

## Original Problem Statement
Build a website called "The Village" that allows parents to connect during difficult times. Whether it be in the middle of the night whilst a mother is breastfeeding and is scrolling on her phone or when a parent is struggling with an issue and needs advice or to vent. The platform should serve as a support community with the tagline: "It takes a village to raise a child."

## User Personas
1. **Night Owl Parents** - Parents up at 2am for feeds needing real-time support
2. **Advice Seekers** - Parents with specific questions about parenting topics
3. **Support Givers** - Experienced parents wanting to help others
4. **Anonymous Venters** - Parents needing to share struggles without judgment
5. **Single Parents** - Solo parents seeking dedicated support and connection

## Core Requirements (Status)
- ✅ User authentication (Email/Password + Google OAuth)
- ✅ Discussion forums organized by topic and child's age
- ✅ Real-time chat rooms for instant connection
- ✅ Anonymous posting option for sensitive topics
- ✅ Direct messaging between parents
- ✅ User profiles with parenting stage info
- ✅ Light/Dark mode ("Night Light" theme)
- ✅ Single parent features (badge, dedicated rooms, discovery)
- ✅ Friends system with requests and management
- ✅ Universal DM access (clickable profiles everywhere)
- ✅ Enhanced forum system (see below)

---

## What's Been Implemented

### Authentication & Users
- Complete auth system (JWT + Google OAuth via Emergent)
- User registration, login, logout, session management
- User profiles with bio, location, gender, connection preferences
- Single parent toggle and badge
- Night Owl badge (10pm-4am activity)

### Forums (Enhanced - Feb 2026)
**14 Forum Features Implemented:**
1. ✅ **Sorting & Filtering** - Sort by: newest, oldest, popular, most_replies. Filter by: all, unanswered, trending
2. ✅ **Edit/Delete Posts** - Authors can edit or delete their own posts
3. ✅ **Bookmark/Save Posts** - Save posts to read later, dedicated /bookmarks page
4. ✅ **Nested/Threaded Replies** - Reply to replies with visual threading
5. ✅ **Trending Posts Section** - Sidebar shows top 5 trending posts (7-day engagement score)
6. ✅ **Unanswered Posts Filter** - Find posts needing responses, "Needs Reply" badge
7. ✅ **Like Replies** - Like individual replies (not just posts)
8. ✅ **Post Notifications** - Bell icon with unread count, notification on new replies/likes
9. ✅ **Enhanced Category Cards** - Show post count, active users, last activity
10. ✅ **Character Count** - Visible character limits on all text inputs (5000 max)
11. ✅ **Pagination** - Navigate through pages of posts
12. ✅ **Report Posts/Replies** - Flag inappropriate content with reason selection
13. ✅ **Community Guidelines** - Modal explaining rules and expectations
14. ✅ **Bookmarks Page** - View and manage saved posts at /bookmarks

**Forum Categories:**
- Topics: Breastfeeding, Sleep, Mental Health, Single Parenting, Relationships, Development, Health, Just Venting
- Age Groups: Newborn, Infant, Toddler, Preschool, Expecting

### Chat Rooms
- 6 themed rooms: 3am Club, Morning Coffee, New Parents, Single Parents Lounge, Vent Room, Wins & Celebrations
- Real-time messaging (3-second polling)
- Clickable user profiles in messages

### Direct Messaging
- Private one-on-one conversations
- Unread message counts
- Initiate DM from any user profile, forum post, chat room, or dashboard

### Friends System
- Send/Accept/Decline friend requests
- Friends page with 3 tabs (Friends, Requests, Sent)
- Friends list on profile page
- Notification badge in navigation
- Friend status on profiles

### Navigation & Notifications
- Desktop: Top nav with icons and dropdowns
- Mobile: Bottom navigation bar
- Notifications bell with unread count
- Friends icon with request badge
- Theme toggle (sun/moon)

### Design System
- **Light Theme (Default)**: Warm cream (#FDF8F3), golden primary (#F5C542)
- **Dark Theme ("Night Light")**: Deep navy (#1A1A2E), maintained gold accents
- Typography: Nunito (headings), DM Sans (body)
- Rounded corners (2xl), glassmorphism effects
- Smooth transitions and hover states

---

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor (async driver)
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Auth**: JWT + Emergent Google OAuth
- **Fonts**: @fontsource/nunito, @fontsource/dm-sans
- **Deployment**: Kubernetes (Emergent Platform)

---

## Prioritized Backlog

### P0 - Critical
- None - all core functionality complete

### P1 - High Priority
- Real-time WebSocket for chat (currently polling every 3s)
- Push notifications for new messages
- Image uploads for posts/profiles
- Email notifications (new replies, DMs)

### P2 - Medium Priority
- User blocking
- Moderation dashboard for admins
- Search with advanced filters
- Chat room scalability (threading, sub-rooms)

### P3 - Nice to Have
- Mobile app (React Native)
- Audio voice notes in chat
- AI-powered content moderation
- Weekly digest emails
- Revenue model (Freemium tier, expert consultations)

---

## API Endpoints Reference

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/session (Google OAuth)
- GET /api/auth/me
- POST /api/auth/logout

### Users
- GET /api/users/{user_id}
- PUT /api/users/profile
- GET /api/users/single-parents

### Forums
- GET /api/forums/categories
- GET /api/forums/posts?category_id=&sort=&filter_type=&skip=&limit=
- GET /api/forums/posts/trending
- GET/POST /api/forums/posts/{post_id}
- PUT/DELETE /api/forums/posts/{post_id}
- GET/POST /api/forums/posts/{post_id}/replies
- PUT/DELETE /api/forums/replies/{reply_id}
- POST /api/forums/posts/{post_id}/like
- POST /api/forums/replies/{reply_id}/like
- POST /api/forums/posts/{post_id}/bookmark
- GET /api/bookmarks

### Chat
- GET /api/chat/rooms
- GET/POST /api/chat/rooms/{room_id}/messages

### Messages (DM)
- GET /api/messages/conversations
- GET/POST /api/messages/{user_id}

### Friends
- POST /api/friends/request
- GET /api/friends/requests
- GET /api/friends/sent
- POST /api/friends/request/{id}/accept
- POST /api/friends/request/{id}/decline
- GET /api/friends
- GET /api/friends/status/{user_id}
- DELETE /api/friends/{friend_id}

### Notifications
- GET /api/notifications
- GET /api/notifications/unread-count
- POST /api/notifications/mark-read
- POST /api/notifications/{id}/read

### Reports
- POST /api/reports

---

## File Structure
```
/app/
├── backend/
│   ├── server.py          # All API endpoints
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.jsx
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Forums.jsx
│   │   │   ├── ForumCategory.jsx
│   │   │   ├── ForumPost.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── ChatRooms.jsx
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Conversation.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Friends.jsx
│   │   │   └── Bookmarks.jsx
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
└── memory/
    └── PRD.md
```

---

## Test Credentials
- Email: forumtester@test.com
- Password: TestPass123!

## Last Updated
February 2026
