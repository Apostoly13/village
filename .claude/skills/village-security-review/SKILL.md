---
name: village-security-review
description: Use this when reviewing authentication, privacy, permissions, moderation, anonymous posting, Chat Rooms, direct messaging, marketplace safety, user data, admin tools, APIs, database access, deployment security, or abuse risks for The Village.
---

Review security, privacy, and trust for The Village.

The Village involves parents, children, families, local communities, private messages, group Chat Rooms, anonymous posts, marketplace interactions, and premium access.

Security focus areas:

- authentication
- session handling
- role-based access control
- free vs Village+ permissions
- admin permissions
- moderator permissions
- anonymous post protection
- anonymous identity leakage
- private messaging safety
- Chat Room safety
- local Chat Room privacy
- marketplace safety
- location privacy
- file/image upload safety
- API validation
- database access controls
- rate limiting
- report/block flows
- audit logging
- production secrets
- environment variables
- deployment settings
- abuse prevention

Anonymous posting is sacred.

Check that anonymous identity is not leaked through:

- UI
- API payloads
- database joins
- logs
- notifications
- email templates
- admin screens, unless intentionally designed and protected

Marketplace safety checks:

- The Village Stall is in release scope.
- no platform-processed payments unless explicitly added later
- clear user-to-user responsibility
- reporting flow
- unsafe meetup prevention
- suspicious listing handling
- messaging boundaries
- location privacy
- moderation visibility

Chat and messaging safety checks:

- Chat Rooms are group chat spaces and may be open to all users.
- Free users may have daily usage limits.
- Direct messaging is currently Village+ locked, but this model needs review.
- Friend-to-friend messaging may require different rules from non-friend messaging.
- Marketplace messaging may require different rules because The Village Stall is in release scope.
- Local Chat Rooms may create privacy risks if they are too geographically specific.
- Postcode-level rooms may increase the risk of identifying families in small communities.
- Area-based rooms may be safer and more useful at launch.
- All chat models need reporting, blocking, moderation, and abuse controls.

Check for:
- unwanted contact
- spam
- harassment
- grooming or unsafe behaviour
- anonymous identity leakage
- location overexposure
- moderation visibility
- rate limits
- user blocking
- report workflows

For every review, provide:

1. Risk found.
2. Severity: low, medium, high, or critical.
3. Why it matters.
4. Practical fix.
5. How to test the fix.
6. Whether it blocks launch.

Avoid theoretical overengineering.

Prioritise fixes that protect families, children, privacy, location, messaging safety, payments confusion, and anonymous users.
