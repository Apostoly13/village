# The Village — Release Checklist

Living document. Check items off as they are implemented. Reviewed before each release stage.

---

## Closed Beta (Internal + invited testers)

### Must have before closed beta

- [x] Email + Google OAuth authentication
- [x] Parent profiles (name, bio, suburb/postcode, kids' ages, interests)
- [x] Forums — topic-based posts, replies, anonymous posting
- [x] Events — creation, browsing, RSVP
- [x] Chat Rooms — group chat, area-based local rooms, free-tier daily limits
- [x] Local area rooms (SA3-based, postcode-range blurbs, join/leave additional areas)
- [x] Direct messaging (Village+)
- [x] The Village Stall — create, browse, filter, save listings; message seller
- [x] Village+ subscription (Stripe) — trial, premium tiers
- [x] Report flow — forum posts and replies
- [x] Report flow — chat messages
- [x] Report flow — Stall listings
- [x] Report flow — direct messages ✅ *implemented this session*
- [x] Report flow — Stall messages ✅ *implemented this session*
- [x] Admin dashboard — review reports, dismiss / remove / warn / ban
- [x] Admin report action — handles all 6 content types ✅ *confirmed*
- [x] Moderation dashboard — enriched for all 6 content types ✅ *implemented this session*
- [x] User blocking — enforced on forum feed, chat rooms, DM send ✅ *chat+DM enforced this session*
- [x] Basic notifications (replies, likes, friend requests, DMs)
- [x] MongoDB indexes — notifications, direct messages, chat messages, forum, stall ✅ *confirmed*
- [x] Stall payment responsibility copy — listing detail + create listing
- [x] Anonymous post identity protection (author_id stripped from API responses)
- [x] Gender-restricted rooms (Mum Chat / Dad Chat)
- [x] Free-tier chat usage limits (10 messages/day)
- [x] Self-report prevention ✅ *implemented this session*
- [x] Auto-ban threshold raised (10 reports, 3+ distinct reporters) ✅ *implemented this session*
- [x] Rate limits — forum post create (5/5min), forum reply (10/5min), chat send (60/min), DM send (30/min), listing create (5/hr) ✅ *implemented this session*
- [x] Stall listing field length validation ✅ *implemented this session*
- [x] Stall listing lat/lon stripped from API responses ✅ *implemented this session*
- [x] Startup env var validation — logs missing Stripe/secret keys ✅ *implemented this session*
- [x] Password reset token index ✅ *confirmed present*
- [x] Block check on direct post URL access ✅ *implemented this session*
- [ ] Content moderation for The Village Stall — moderator can see and action reported listings
- [ ] Mobile responsiveness audit — test all core flows on iOS Safari and Android Chrome
- [ ] Rate limiting on report submission endpoint (prevent report flooding)
- [ ] Terms of Service and Privacy Policy pages linked from onboarding

### Should have before closed beta exits

- [x] Messages scroll lock — don't yank user to bottom when polling arrives new messages
- [x] Messages loading spinner when switching conversations
- [x] Faster polling — 1.5s for messages, 20s for nav
- [x] Ding sound on new DM
- [x] Unread message badge on nav Messages icon
- [x] Friend accept marks notification read
- [x] Events double-X button fix
- [x] Report flow — direct messages UI ✅ *implemented this session*
- [x] Report flow — stall messages UI ✅ *implemented this session*

---

## Day-One Public Launch

### Must have before public launch

**Moderation readiness**
- [ ] Moderation team briefed on report queue workflow
- [x] Admin can view full report queue with all content types (chat, stall, DM) ✅ *implemented this session*
- [x] Auto-suspend threshold reviewed (raised to 10 reports from 3+ distinct reporters) ✅ *implemented this session*
- [ ] Community guidelines page live and linked from onboarding, footer, and report flows
- [ ] Moderator role assigned to at least 2 trusted people

**Chat Rooms**
- [x] Local area rooms working (SA3-based)
- [x] Free-tier daily message limit enforced
- [x] Village+ unlimited chat
- [x] Report button on chat messages
- [x] Block enforced on chat room message reads ✅ *implemented this session*
- [ ] Block user flow accessible from within a Chat Room (UI button)
- [ ] Chat Room message history limited / paginated (no infinite scroll performance issues)

**The Village Stall**
- [x] Listing creation works (all listing types)
- [x] Browsing and filtering works
- [x] Report on listing works
- [x] User-to-user payment disclaimer on listing detail and create flow
- [x] Seller messaging (Village+)
- [x] Report on Stall messages ✅ *implemented this session*
- [x] Location privacy — lat/lon stripped from API responses ✅ *implemented this session*
- [x] Content length validation on listing fields ✅ *implemented this session*
- [ ] Listing moderation visible in admin/moderator dashboard
- [ ] Stall access model confirmed — Village+ to create and message; free to browse
- [ ] Postage available flag works correctly

**Direct Messaging**
- [x] DM works for Village+ users
- [x] DM indexes on MongoDB
- [x] Block enforced on DM send ✅ *implemented this session*
- [x] Report button on DM messages ✅ *implemented this session*
- [ ] DM freemium model confirmed — current: Village+ only; review: should friend DMs be free?

**Anonymous Posting**
- [x] author_id stripped from API response for anonymous posts
- [x] Anonymous author stored in DB for moderation only
- [x] Admin reports endpoint flags anonymous posts with `_admin_anonymous` marker ✅ *implemented this session*
- [ ] Verify anonymous identity not leaked in: notifications, logs
- [ ] Confirm moderators can see real author on reported anonymous content (check admin UI display)

**Security**
- [x] .env files not in git repo ✅ *confirmed*
- [x] Self-report prevention ✅ *implemented this session*
- [x] Rate limits on post create, reply create, chat send, DM send, listing create ✅ *implemented this session*
- [x] Startup warning for missing required env vars ✅ *implemented this session*
- [ ] CORS origin locked to production frontend domain
- [ ] File upload validation — type and size limits enforced on all image uploads
- [ ] Rate limiting on report submission endpoint
- [ ] Session cookie security — HttpOnly, Secure, SameSite=Lax confirmed for prod

**Mobile**
- [ ] All core flows tested on iOS Safari (iPhone SE and iPhone 14 sizes)
- [ ] All core flows tested on Android Chrome
- [ ] Bottom nav items all tappable with thumb (min 44px touch target)
- [ ] Chat message input doesn't get hidden by keyboard on mobile

**Onboarding**
- [ ] New user onboarding flow tested end-to-end
- [ ] Profile setup (suburb, kids' ages) drives correct local area room assignment
- [ ] Village+ upgrade flow works end-to-end (Stripe test → production keys)
- [ ] Email verification or welcome email confirmed

**Legal / trust**
- [ ] Terms of Service live
- [ ] Privacy Policy live
- [ ] Community Guidelines live
- [x] Stall payment responsibility copy live
- [ ] Cookie / analytics consent if analytics are running

---

## First Village+ Expansion (post-launch)

- [ ] Village+ Communities — member-led discussion spaces
- [ ] Community creation for Village+ members
- [ ] Enhanced local discovery features
- [ ] Higher (or unlimited) chat message limits for Village+ (current: already unlimited)
- [ ] Village+ badge / Crown visible in profile and chat
- [ ] DM freemium review — consider friend-to-friend DMs as free tier
- [ ] Stall: saved listings management page
- [ ] Stall: mark listing as sold/swapped/given
- [ ] Suburb-level or postcode-level local rooms (once SA3 rooms have population)
- [ ] Notification preferences (email / push opt-in)
- [ ] Replace in-memory rate limiter with Redis-backed persistent limiter

---

## Later Roadmap

- [ ] Professional Hub — verified professional profiles (GP, midwife, sleep consultant, etc.)
- [ ] Push notifications (mobile web or native app)
- [ ] Blog / content section
- [ ] Donation groups (community-led, self-organised)
- [ ] Radius-based local chat (requires GPS — privacy review needed)
- [ ] Parent-created local groups (moderation burden review before enabling)
- [ ] Saved message UI improvements
- [ ] Event reminders
- [ ] MongoDB Atlas Search for forum and stall
- [ ] Analytics and retention dashboards (admin)
- [ ] Email verification on registration
- [ ] Dark mode — audit and fix hardcoded hex colours
- [ ] Block user flow accessible from within a Chat Room

---

## Do Not Build Yet

- [ ] In-app payment processing (user-to-user payments stay off-platform)
- [ ] Native iOS / Android app (web-first until user base validated)
- [ ] AI moderation / content filtering (manual + report-based is sufficient at launch scale)
- [ ] Verified professional hub (liability and verification complexity — post-launch)
- [ ] Postcode-level rooms (privacy risk in small communities — use SA3 areas first)
- [ ] Radius-based rooms (GPS privacy risk, complex UX)

---

## Content Type Report Coverage

| Content Type     | Backend `/reports` | Admin action | Report UI |
|------------------|--------------------|--------------|-----------|
| `post`           | ✅                  | ✅            | ✅ ForumPost.jsx |
| `reply`          | ✅                  | ✅            | ✅ ForumPost.jsx |
| `chat_message`   | ✅                  | ✅            | ✅ ChatRoom.jsx |
| `listing`        | ✅                  | ✅            | ✅ StallListingDetail.jsx |
| `direct_message` | ✅                  | ✅            | ✅ Messages.jsx ✅ *implemented this session* |
| `stall_message`  | ✅                  | ✅            | ✅ StallChatPanel ✅ *implemented this session* |
