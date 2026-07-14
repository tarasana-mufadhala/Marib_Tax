# ADR-003: Next.js Web and Admin

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

The system needs public informational pages and a protected administrative dashboard. Maintaining two separate web frameworks would increase cost without MVP benefit.

## Decision

Use **one Next.js TypeScript codebase** (`apps/web`) containing public pages and protected admin routes.

## Consequences

- Shared design system and deployment unit for web surfaces.
- Clear separation of public vs admin experiences inside the same app is required.
- Authorization must not rely on hidden UI alone.

## Guardrails

- Arabic RTL first.
- No server secrets in client bundles.
- Admin routes remain protected by server-side authorization via the API.
- Do not split into separate Next.js apps without change control.
