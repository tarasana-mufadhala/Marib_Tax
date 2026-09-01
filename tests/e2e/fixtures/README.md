# Synthetic E2E fixtures

Every test run creates a unique `TEST_ONLY_<run-id>` fixture set and records
the exact generated IDs for cleanup. Fixtures must not reuse real taxpayer,
employee, phone, identity, payment, or attachment data.

Required logical actors:

- `taxpayer_a` — owns requests and private attachments.
- `taxpayer_b` — proves cross-taxpayer denial and IDOR protection.
- `reviewer` — reviews, requests completion, and schedules permitted visits.
- `manager` — performs manager-only decisions and archive/reopen actions.
- `content_editor` — proves that content permissions do not grant transaction access.

Cleanup is limited to IDs created by the current run. Broad deletes, disabled
triggers, RLS bypass, and `session_replication_role` changes are prohibited.
