# The Village — Claude Code Project Guide

## Product Summary

The Village is a warm, judgment-free digital parenting community for Australian parents.

It sits between the anonymity of Reddit and the warmth of a local parents' group.

The platform helps parents find support, ask questions, join age/topic-based communities, use Chat Rooms, attend local events, connect with professionals, access The Village Stall marketplace, and use premium Village+ features.

The product should feel:
- warm
- calm
- safe
- simple
- refined
- parent-first
- privacy-led
- Australian-first

It should not feel:
- like a generic social media app
- childish
- cluttered
- overly corporate
- aggressive with upsells
- unsafe for families

## Brand Principles

- Simple before clever.
- Trust and privacy are core product features.
- Parent safety matters more than engagement.
- The UI should feel calm and refined.
- Use Australian spelling, language, and assumptions.
- Avoid fear-based, guilt-based, or pushy messaging.
- Make parents feel supported, not judged.
- Preserve the warmth of a local community while protecting users online.

## Core Product Areas

The Village includes:

- Authentication using email and Google OAuth.
- Parent profiles.
- Parenting stage and family context.
- Suburb/location-based discovery.
- Kids' ages.
- Interests.
- Badges such as Night Owl, Single Parent, and Premium Crown.
- Profile photos.
- Forums and support spaces.
- Topic-based and age-based discussions.
- Anonymous posting.
- Moderation tools.
- Chat Rooms / group chats.
- Local Chat Rooms.
- Direct messaging.
- Local chat sessions.
- Events and RSVP.
- Local business connections.
- Professional Hub.
- Blog/content.
- Village+ premium tier.
- Village+ Communities.
- The Village Stall marketplace.

## Village+ Direction

Village+ is the premium tier.

Village+ should feel helpful and valuable, not exclusionary or pushy.

Village+ may include:
- Premium Communities.
- The Village Stall marketplace access or enhanced marketplace features.
- Direct messaging capabilities.
- Enhanced local features.
- More advanced parent/community tools.
- Premium badges or status indicators.
- Additional discovery or connection features.
- Higher or unlimited Chat Room usage where free users have limits.

The freemium model needs careful review.

Do not assume every social connection feature should be locked behind Village+.

When reviewing free vs Village+ access, consider:

1. Does the free product still feel useful?
2. Does Village+ unlock convenience, depth, or safety-enhanced features rather than basic connection?
3. Does locking direct messaging reduce the chance users form meaningful connections?
4. Should friend-to-friend messaging be free?
5. Should non-friend direct messaging be Village+?
6. Should marketplace messaging be available because The Village Stall is in release scope?
7. Are limits better than hard locks for some features?
8. Does the model protect against spam, abuse, and unwanted contact?

Regular users should understand the value of Village+ without seeing private premium content they should not access.

## Communities Direction

Communities are Village+ discussion spaces created around topics, stages, interests, locations, and parenting needs.

They should support:
- member-led discussion
- community creation where permitted
- moderation
- joining/leaving
- privacy boundaries
- safe discovery

Regular users should not be able to view private premium community content unless the product decision explicitly allows a preview.

It is okay to show free users a teaser or explanation of Communities, but not private premium posts or member-only content.

## Chat Rooms and Messaging Direction

The Village includes group chat experiences housed in **Chat Rooms**.

Chat Rooms are different from direct messaging.

Current intended model:

- Group chats / Chat Rooms are available to all users.
- Free users may have daily usage limits.
- Village+ may receive higher or unlimited usage.
- Direct messaging between friends and platform users who are not friends yet is currently locked to Village+.
- This direct messaging model needs to be reviewed to confirm whether it makes sense for the freemium strategy.

Claude should not assume the current messaging model is final.

When reviewing messaging, consider:

1. Does locking direct messaging to Village+ hurt community formation?
2. Should messaging between confirmed friends be free?
3. Should messaging non-friends be Village+ only?
4. Should initiating DMs be premium but replying be free?
5. Should marketplace-related messages be allowed because The Village Stall is in release scope?
6. Should safety/moderation concerns affect what is free vs premium?
7. Does the model encourage healthy community connection without creating spam or safety risks?

Chat Rooms should be reviewed as a core social feature.

They should support:
- general group discussion
- topic-based rooms
- stage-based rooms
- local rooms
- potentially postcode or area-based local rooms
- moderation
- reporting
- usage limits for free users if required
- Village+ value without making the free product feel broken

Local Chat Rooms need product review before building.

Do not assume postcode-based rooms are the right model. Compare postcode, suburb, area/council, radius, and parent-created approaches across privacy, safety, room population, moderation burden, and local relevance before implementing. See the village-product-manager skill for the full comparison.

## The Village Stall Direction

The Marketplace is called **The Village Stall**.

The Village Stall is already in scope for release.

It is a Village+ feature area, but the exact access model should be reviewed carefully so it supports the freemium strategy without blocking core community value.

Sections:
- Swap
- Buy & Sell
- Donate

The Village Stall is user-to-user.

The platform should not process marketplace payments.

Marketplace messaging should connect to the existing messaging system where appropriate, ideally with a dedicated Marketplace thread or inbox type.

Donation groups should be community-led and self-organised by users.

The Village Stall must be designed for release readiness, not treated as a later/future feature.

Marketplace safety matters because parents, families, local meetups, and household items are involved.

The Village Stall design should prioritise:
- fast listing creation
- clear item details
- location safety
- reporting
- user trust
- no payment confusion
- moderation
- simple browsing
- clear free vs Village+ boundaries
- local relevance

## Current Stack

Frontend: Vercel
Backend: Railway
Database: MongoDB Atlas
DNS/CDN: Cloudflare
Source Control: GitHub

If the repo shows a different stack, inspect the repo and tell me before changing this section.

## Development Rules

Default development branch is `dev`. Do not work on `main` directly.

Before making changes:
1. Inspect the existing repo structure.
2. Understand the current implementation.
3. Check related files before editing.
4. Prefer small, safe, reviewable changes.
5. Do not rewrite large areas unless explicitly asked.
6. Preserve existing design direction unless improving it deliberately.
7. Keep dev and production concerns separate.
8. Prioritise privacy, moderation, security, and permission boundaries.
9. Do not introduce paid services, new infrastructure, or major dependencies without explaining why.
10. Avoid overengineering.

When implementing:
1. Make a short plan first.
2. Identify files likely to change.
3. Make targeted edits.
4. Run available tests, lint, typecheck, or build commands where possible.
5. Explain what changed.
6. Explain risks or follow-up work.
7. Do not claim something was tested if it was not.

## UI/UX Rules

The Village should be:
- mobile-first
- calm
- clear
- refined
- warm
- accessible
- easy for tired parents to use

Design expectations:
- Clear hierarchy.
- Soft spacing.
- Friendly but not childish.
- Minimal clutter.
- Useful empty states.
- Clear CTAs.
- Gentle Village+ promotion.
- Strong privacy and safety cues.
- Day mode should feel warm and welcoming.
- Dark mode should feel like a soft night light, not harsh black.

Do not randomly redesign the whole app.

Improve what exists unless I explicitly ask for a new direction.

## Security, Privacy, and Moderation Rules

The Village handles sensitive family and parenting context.

Always consider:
- child/family privacy
- anonymous posting protection
- private messaging safety
- Chat Room safety
- local Chat Room privacy
- marketplace safety
- community moderation
- report/block flows
- admin permissions
- role-based access
- Village+ access boundaries
- file/image upload safety
- API validation
- database access controls
- rate limiting
- production secrets

Anonymous posting is sacred.

Do not expose anonymous user identity through:
- UI
- API responses
- logs
- notifications
- admin views, unless intentionally designed for a tightly controlled moderation use case

Chat Rooms and messaging require safety controls because they can involve direct or semi-direct parent interaction.

Local Chat Rooms require extra care because overly specific geography can increase privacy and identification risks.

The Village Stall requires safety controls because it may involve local pickup, item exchange, messaging, and parent-to-parent trust.

## Testing Expectations

When testing The Village, include realistic parent journeys.

Test scenarios should include:
- New parent signup.
- Profile setup.
- Free user journey.
- Village+ user journey.
- Creating posts.
- Replying to posts.
- Anonymous posting.
- Using Chat Rooms / group chats.
- Free-tier Chat Room usage limits.
- Local Chat Room discovery.
- Postcode or area-based chat access, if implemented.
- Direct messaging as a Village+ user.
- Direct messaging as a free user.
- Friend-to-friend messaging rules.
- Non-friend messaging rules.
- Marketplace listing creation in The Village Stall.
- Marketplace enquiry/message flow.
- Joining communities.
- Creating Village+ communities where allowed.
- Donation group creation.
- Event creation and RSVP.
- Reporting content.
- Moderator/admin review.
- Mobile responsiveness.
- Free vs Village+ permission boundaries.
- Security and abuse cases.
- Performance under repeated activity.

Testing should simulate real platform behaviour, not just inspect files.

## Release Approach

Prefer staged delivery:

1. Private dev
2. Internal testing
3. Closed beta
4. Soft launch
5. Public launch
6. Village+ expansion
7. Marketplace/professional/community growth

A safe, useful, low-cost launch is better than a feature-heavy launch.

Day-one launch should prioritise:
- trust
- safety
- clear onboarding
- core community value
- moderation readiness
- stability
- mobile usability
- Chat Room clarity
- The Village Stall release readiness

The Village Stall is in scope for release.

It should not launch publicly until:
- listing creation works
- browsing/filtering works
- reporting works
- messaging boundaries are clear
- listing moderation exists
- payment responsibility is clear
- safety copy exists
- location privacy has been considered
- user-to-user expectations are clear
- free vs Village+ access is clear

Chat Rooms are also part of the core product experience and should be included in release planning.

Before launch, decide:
- Are Chat Rooms open to all users?
- What are the daily limits for free users?
- What does Village+ unlock?
- Are local rooms based on postcode, suburb, area, radius, or parent-created groups?
- Are postcode-level rooms too narrow or too sensitive for launch?
- Should area-based rooms be used first?
- What moderation tools exist for Chat Rooms?
- Can users report messages?
- Can users block other users?
- What happens when a free user reaches the daily limit?

Direct messaging needs freemium review before launch.

Review:
- Should friend-to-friend DMs be free?
- Should non-friend DMs be Village+?
- Should marketplace messages be allowed for users interacting through The Village Stall?
- Should replying to a DM be free even if initiating is premium?
- Does the model protect users from spam and unwanted contact?
- Does the model still let free users form meaningful community connections?

## Claude Behaviour

When asked to think:
- Be product-led.
- Be practical.
- Recommend simple first versions.
- Separate MVP/release from later versions.
- Explain assumptions.

When asked to code:
- Inspect first.
- Plan briefly.
- Make targeted changes.
- Avoid broad rewrites.
- Run checks where possible.
- Report clearly.

When unsure:
- Make a sensible product-led assumption if risk is low.
- Document the assumption.
- Ask when the risk is high or the decision is genuinely blocking.

Always ask before:
- Changing what is free vs Village+ for any feature.
- Changing anonymous posting behaviour or identity handling.
- Adding new routes, endpoints, or data collections.
- Changing who can see whose content or messages.
- Anything that affects payment, subscription, or access control logic.

Commit and push rules:
- Never create a git commit unless the user explicitly asks.
- Never run git push unless the user explicitly says to push.
- Do not suggest or prompt either — wait for the user.
- Before every commit, update `frontend/src/pages/Changelog.jsx` with a new version entry covering everything in that commit. Update the ROADMAP section if upcoming plans have changed. Do this before creating the commit, not after.
