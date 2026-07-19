# ADR-016: Service Request Lifecycle Boundaries (Draft, Close/Archive, Reopen, Versioning)

- **Status:** Accepted
- **Date:** 2026-07-20
- **Decision:** DMOD-01 / DMOD-06 / DMOD-11 and ADR-008 operational binding for Batch 06

## Context

Batch 06 source for TABLE-023…036 was complete while draft-delete, close-versus-archive, reopen authority, and form versioning detail remained open. The project owner supplied explicit lifecycle boundaries on 2026-07-20 before any PROD-DB-06 preflight or apply.

## Decision

### Draft cancellation (DMOD-06)

- No hard delete of service requests.
- The applicant may cancel a draft only before submission.
- Cancellation records actor, time, and reason.
- After submission, hard delete and direct cancel are forbidden.

### Close versus archive (DMOD-01)

- **Close** ends processing with a final decision.
- **Archive** is a later administrative action that retains the request as a historical record.
- Close and archive are recorded as independent actions.

### Reopen (DMOD-11)

- The taxpayer cannot reopen a request directly.
- Only authorized staff with an explicit permission may reopen.
- Reopen reason is mandatory.
- Prior statuses and decisions remain retained; reopen does not erase history.

### Versioning (ADR-008 binding)

- Each request binds to a fixed `schema_version` via its submitted form snapshot.
- The submitted snapshot is immutable.
- Changing a service form creates a new schema/service version.
- Existing requests remain linked to their original version.

## Consequences

- Batch 06 persistence must support soft/status-driven draft cancel, independent close/archive events, staff-only reopen with mandatory reason, and versioned immutable snapshots.
- NestJS owns transition authorization and append-only history mutation rules beyond foundation RLS default-deny.
- Corrected Batch 06 source was design-accepted PASS on 2026-07-20. PROD-DB-06 apply remains closed until a separate explicit production approval after preflight.

## Guardrails

- Do not introduce hard-delete paths for operational request or history rows.
- Do not allow taxpayer-initiated reopen.
- Do not overwrite submitted snapshots or historical schema bindings in place.
- Do not treat close and archive as a single indistinguishable event.
