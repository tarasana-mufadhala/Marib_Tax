# Definition of Done — Marib Tax System

A feature (or significant change) is **complete** only when all of the following are true:

1. **Acceptance criteria pass** — criteria from the approved task or CR are verified.
2. **Authorization is tested** — positive and negative permission cases are covered.
3. **Audit behavior is present** — sensitive state changes produce required audit evidence.
4. **Arabic RTL is verified where relevant** — UI flows render and behave correctly in Arabic RTL.
5. **API documentation is updated** — OpenAPI/contract docs reflect the change.
6. **Migration exists where applicable** — schema changes are versioned; applied migrations are not edited.
7. **Automated tests pass** — including business rules, permissions, state transitions, and failure paths (not happy-path only).
8. **Failure cases are handled** — external provider failures, validation errors, and unauthorized access are handled safely.
9. **No secret or sensitive data is logged** — logs exclude tokens, keys, and unnecessary PII.
10. **QA approval is recorded** — sign-off is captured in the agreed acceptance process.

Incomplete items mean the work is **not done**, regardless of UI appearance or happy-path demos.
