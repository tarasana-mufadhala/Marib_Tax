# ADR-013: First Request Draft Contract

- **Status:** Accepted
- **Date:** 2026-07-18
- **Decision:** API-03

## Decision

The first taxpayer request service is `activity_address_change` (إخطار تغيير عنوان النشاط), using immutable schema version `1.0.0`. Semantic-version major releases may break shape or meaning, minor releases may add compatible optional fields, and patch releases may only clarify descriptions or non-contract-changing validation. Unknown versions are rejected and existing drafts are never silently upgraded.

Create accepts one or more unique activity/optional-branch targets and only the approved new-address fields. District and street are required; optional address text normalizes to null. Previous address, move date, trade name, activity type, and unknown fields are prohibited. Patch fully replaces `targets` on an owned draft and cannot change service type, schema version, owner, or status.

Submission is `POST /api/v1/requests/{id}/submit` with no operational body. It requires `request.submit`, ownership, and draft resource state, then creates a server-authored immutable snapshot. Responses expose only the typed published view. Each endpoint declares the exact API-03 permission and predicates; missing actor or ownership fails closed.

## Consequences

- OpenAPI and shared Zod contracts are authoritative and strict.
- Domain/application logic targets a repository port; only an in-memory test adapter is allowed in this slice.
- Controllers are not connected to a production database or real actor adapter.
- Production SQL, migrations, deployment, secrets, and operational data remain outside this decision.
