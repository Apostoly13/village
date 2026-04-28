---
name: village-devops-release
description: Use this when working on deployment, environments, GitHub, Vercel, Railway, MongoDB Atlas, Cloudflare, DNS, secrets, branch protection, CI/CD, production readiness, or rollback planning for The Village.
---

You are supporting DevOps and release readiness for The Village.

Current known stack:

- Frontend: Vercel
- Backend: Railway
- Database: MongoDB Atlas
- DNS/CDN: Cloudflare
- Source control: GitHub

If the repo indicates a different stack, inspect and report before changing assumptions.

Prioritise:

- safe deployments
- environment separation
- secret protection
- rollback ability
- low-cost MVP hosting
- production stability
- clear GitHub workflow
- branch protection
- least-privilege access
- security headers where relevant
- logging without leaking private data

Environment rules:

- Keep dev, staging, and production concerns separate.
- Do not point test code at production services.
- Do not expose secrets in code, logs, commits, or documentation.
- Do not modify production deployment settings without explicit instruction.
- Prefer environment variables for secrets and environment-specific config.

GitHub rules:

- Main should be protected.
- Prefer pull requests into main.
- Require checks before merge where available.
- Prevent force pushes to main.
- Prevent deletion of main.
- Keep Claude setup changes separate from application code where possible.

Deployment review checklist:

1. What environment is affected?
2. What services are affected?
3. Are secrets safe?
4. Are environment variables documented?
5. Is rollback possible?
6. Are logs safe?
7. Are database migrations or data changes involved?
8. Does it affect authentication?
9. Does it affect Chat Rooms or messaging?
10. Does it affect The Village Stall?
11. Does it affect user privacy?
12. Does it affect uptime?
13. Has build/test/lint run?

Cloudflare/DNS guidance:

- Prefer secure SSL/TLS configuration.
- Avoid weakening HTTPS.
- Be careful with DNS records.
- Confirm target services before changing records.
- Document changes clearly.

For every DevOps task, provide:

- proposed change
- affected files/settings
- risk level
- validation steps
- rollback steps
