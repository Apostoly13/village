---
name: village-test-scenarios
description: Use this when creating or running realistic test scenarios for The Village dev environment, including user journeys, load testing, posting, replying, The Village Stall, Chat Rooms, direct messaging, communities, moderation, and security testing.
---

Create realistic test scenarios for The Village.

Tests must simulate actual platform use.

Do not only inspect the code.

Test with realistic personas such as:

- new parent
- expecting parent
- parent of toddler
- parent using anonymous posting
- free user
- Village+ user
- Chat Room participant
- local Chat Room participant
- direct messaging user
- community creator
- marketplace seller using The Village Stall
- marketplace buyer using The Village Stall
- donation group organiser
- moderator
- admin
- professional user, if Professional Hub exists

Core journeys to test:

- account creation
- login
- logout
- profile setup
- free user browsing
- Village+ access
- creating posts
- replying to posts
- anonymous posting
- editing or deleting own content
- reporting content
- moderation review
- joining a community
- creating a community where allowed
- using Chat Rooms / group chats
- free-tier Chat Room usage limits
- local Chat Room discovery
- postcode or area-based chat access, if implemented
- direct messaging as a Village+ user
- direct messaging as a free user
- friend-to-friend messaging rules
- non-friend messaging rules
- marketplace listing creation in The Village Stall
- marketplace enquiry/message flow
- donation group creation
- event creation
- RSVP
- notification behaviour
- mobile responsiveness
- dark mode
- day mode

Permission tests:

- free user attempting premium actions
- free user hitting Chat Room daily limits
- free user attempting direct messaging
- Village+ user using direct messaging
- friend messaging vs non-friend messaging
- marketplace messaging permissions
- non-member attempting private community access
- normal user attempting admin/moderator actions
- anonymous post identity protection
- local Chat Room access boundaries
- postcode/area locked chat behaviour
- marketplace access boundaries
- deleted/suspended user behaviour

Security and abuse tests:

- spam posting
- repeated replies
- Chat Room spam
- direct message spam
- local Chat Room location overexposure
- offensive content report
- anonymous misuse report
- marketplace suspicious listing
- unsafe marketplace pickup wording
- invalid API inputs
- unauthorised route access
- direct API access without UI permissions
- rate-limit-like behaviour

For each test plan, include:

1. Persona.
2. Starting state.
3. Steps.
4. Expected result.
5. Pass/fail criteria.
6. Data created.
7. Cleanup required.
8. Whether the test was actually executed or only planned.

If asked to execute tests, confirm exactly what was run.

Never say tests passed unless they actually ran.
