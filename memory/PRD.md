# NightOwl Parents - Product Requirements Document

## Original Problem Statement
Build a website that allows mums and dads to connect during difficult times. Whether it be in the middle of the night whilst a mother is breastfeeding and is scrolling on her phone or when a parent is struggling with an issue and needs advice or to vent.

## User Personas
1. **Night Owl Parents** - Parents up at 2am for feeds needing real-time support
2. **Advice Seekers** - Parents with specific questions about parenting topics
3. **Support Givers** - Experienced parents wanting to help others
4. **Anonymous Venters** - Parents needing to share struggles without judgment

## Core Requirements (Static)
- ✅ User authentication (Email/Password + Google OAuth)
- ✅ Discussion forums organized by topic and child's age
- ✅ Real-time chat rooms for instant connection
- ✅ Anonymous posting option for sensitive topics
- ✅ Direct messaging between parents
- ✅ User profiles with parenting stage info
- ✅ Dark mode for late-night browsing

## What's Been Implemented (Feb 2026)

### Backend (FastAPI + MongoDB)
- Complete auth system (JWT + Google OAuth via Emergent)
- User registration, login, logout, session management
- Forum categories (7 topic-based + 5 age-based)
- Posts with anonymous option, likes, replies
- Chat rooms (5 rooms: Night Owl, Morning Coffee, etc.)
- Direct messaging with conversation threading
- User profile management
- Feed and search endpoints

### Frontend (React + Tailwind + Shadcn/UI)
- Landing page with "Night Light" dark theme
- Auth pages (Login, Register with Google OAuth)
- Dashboard with recent posts feed
- Forums browsable by topic or age group
- Chat rooms with real-time polling
- Direct messages UI
- Profile page with edit functionality
- Responsive design with mobile bottom nav

### Design System
- Theme: "Night Light" (warm dark mode)
- Primary: Amber/Gold (#F5C542)
- Typography: Nunito (headings), DM Sans (body)
- Warm glows and glassmorphism effects

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- None - core functionality complete

### P1 - High Priority
- Real-time WebSocket for chat (currently polling)
- Push notifications for new messages
- Image uploads for posts/profiles
- Email notifications (new replies, DMs)

### P2 - Medium Priority
- Post bookmarking/saving
- User blocking/reporting
- Forum moderation tools
- Search filters (by date, category)

### P3 - Nice to Have
- Mobile app (React Native)
- Audio voice notes in chat
- AI-powered content moderation
- Weekly digest emails

## Tech Stack
- **Backend**: FastAPI, MongoDB, Motor (async)
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Auth**: JWT + Emergent Google OAuth
- **Deployment**: Kubernetes (Emergent Platform)

## Next Action Items
1. Add WebSocket support for real-time chat
2. Implement image upload for posts
3. Add email notifications for engagement
4. Build moderation dashboard
