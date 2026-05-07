---
name: village-code-review
description: Use this when reviewing code changes, pull requests, refactors, bug fixes, feature implementations, architecture changes, or quality issues in The Village repo.
---

Review code for The Village with a focus on safe, maintainable, production-ready changes.

Prioritise:

- correctness
- small scope
- readability
- maintainability
- security
- privacy
- permission boundaries
- performance
- mobile behaviour
- avoiding unnecessary dependencies
- avoiding broad rewrites

Review checklist:

1. Does the change solve the intended problem?
2. Is the scope controlled?
3. Does it introduce privacy or security risks?
4. Does it respect free vs Village+ boundaries?
5. Does it protect anonymous users?
6. Does it affect Chat Rooms or direct messaging safety?
7. Does it affect local Chat Room privacy?
8. Does it affect admin/moderator permissions?
9. Does it affect The Village Stall safety?
10. Does it handle errors clearly?
11. Does it handle loading and empty states?
12. Does it work on mobile?
13. Does it affect dark/day mode?
14. Are tests needed?
15. Were available checks run?
16. Is there a simpler implementation?

When reviewing, separate findings by severity:

- Critical
- High
- Medium
- Low
- Nice to have

For each issue, include:

- file or area
- problem
- why it matters
- recommended fix
- whether it blocks merge

Do not nitpick style unless it affects clarity, safety, or maintainability.
