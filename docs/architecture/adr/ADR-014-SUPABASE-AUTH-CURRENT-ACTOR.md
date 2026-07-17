# ADR-014: Supabase Auth and Current Actor Boundary

- **Status:** Accepted
- **Date:** 2026-07-18
- **Decision:** API-04

## Decision

Supabase Auth is the user identity authority. NestJS accepts only a bearer access token, verifies its asymmetric signature through the project JWKS, and validates the exact issuer, `authenticated` audience, expiration, and non-empty `sub` before trusting identity. Supported source algorithms are explicitly limited to RS256 and ES256. JWKS caching is bounded to ten minutes to support key rotation; no symmetric signing secret or service-role credential belongs in this user-authentication path.

Verified `sub` is an Auth user identifier, not an application actor, taxpayer, or staff identifier. A server-side repository port maps it to an active `identity.user_profiles` record and obtains effective application permissions/assignments. JWT `user_metadata`, roles, and caller-provided identity headers never grant application permission. Missing or invalid authentication and unknown/inactive profiles return a safe 401; inactive, expired, or revoked authorization assignments return 403 through the fail-closed authorization guard.

The immutable current-actor context is attached to the request only after verification and server-side mapping. The request-draft controller may be registered only in an isolated non-production test runtime until a production repository adapter and deployment are separately authorized.

## Evidence and consequences

- Supabase documents JWKS verification and bounded cache/key-rotation behavior: <https://supabase.com/docs/guides/auth/jwts>.
- Supabase requires signature, issuer, audience, expiration, and claim validation: <https://supabase.com/docs/guides/auth/jwt-fields>.
- `jose` provides the reviewed remote-JWKS and JWT verification primitives; custom cryptography is prohibited.
- Authentication, profile lookup, and current-actor access are ports with mock/in-memory test adapters.
- Production persistence, SQL, deployment, secrets, and real operational data remain excluded.
