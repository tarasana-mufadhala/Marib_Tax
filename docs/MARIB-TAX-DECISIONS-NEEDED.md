# Marib Tax Decisions Needed

Only decisions that require an authorized human are listed here. Source work must remain conservative and fail closed until each applicable decision is recorded in the canonical governance documents.

## Immediate production approval

### PROD-DB-03 — Apply Batch 03 authorization model

- **State:** COMPLETE — APPLIED / VERIFIED PASS on 2026-07-19
- **Source migration:** `supabase/migrations/20260717120000_create_identity_authorization_model.sql`
- **SHA-256:** `BF15774686744A86D641D7B0B212F7B25E53D2AE6A8E4445662CA84475A00A86`
- **Project:** `sjmtiwzddztxfrncwkpx`
- **CLI:** Supabase `2.109.1`
- **Evidence:** `docs/post-apply/MARIB-TAX-DB-FOUNDATION-BATCH-03-PRODUCTION-APPLY-POST-VERIFY-01-REPORT.md`
- **Still forbidden without a new approval:** any later migration (including Batch 04), `--include-all`, migration repair, `db reset --linked`, dashboard SQL, direct `psql`, or blind retry.

### PROD-DB-04 — Apply Batch 04 taxpayer registry / legal entities

- **State:** REQUIRES_USER_APPROVAL (source authoring may proceed; production apply closed)
- **Until approved:** do not run `db push` for Batch 04 or any later batch.

## Business/data decisions — approved 2026-07-19

Canonical record: ADR-015. Open-decision registers updated in the same change set.

### DM-04 / DM-23 — Tax number

- **State:** APPROVED on 2026-07-19 (PHY-06 aligned)
- Digits only; issued by the Tax Authority in Aden; system stores as entered and never generates.
- Stored as numeric text to preserve leading zeros.
- Unique among active taxpayers.
- Corrections retain previous value, reason, and actor.

### DM-21 — Account linkage (v1)

- **State:** APPROVED on 2026-07-19 for first-release multiplicity
- One account represents exactly one taxpayer; no multi-taxpayer representation in v1.
- **Still deferred:** multi-account-per-taxpayer and future delegated representation beyond that rule.

### DM-22 — Due–Receipt and payment behavior

- **State:** APPROVED on 2026-07-19 (PHY-09 / PHY-10 aligned)
- Manual payment; receipt delivered to admin; payer identity not required.
- Partial payment allowed; one due may link to multiple receipts.
- Admin records and confirms; confirmed receipts are never deleted.

### DM-08 — Field-visit data entry

- **State:** APPROVED on 2026-07-19 for entry source
- Location and result come only from admin/authorized staff entry; no auto-generation.
- **Still deferred:** team masking and full result-structure catalogue details.

### DM-10 — Attachments (classification and archive)

- **State:** APPROVED on 2026-07-19 for classification/version archive
- Classified by type; always archived; correction issues a new version without deleting the previous.
- **Still deferred:** timed destruction / legal-hold destruction periods (DM-17) and storage-metrics accounting (DM-26).

### DM-11 — Notification provider boundary

- **State:** APPROVED on 2026-07-19 for build/test provider intent
- Twilio during build/experimentation via a provider port that can later host a local provider or WhatsApp API.
- **No real send now.** Production delivery remains a separate approval.
- **Still deferred:** read/ack semantics and retention detail (DM-25) where not already constrained.

### DM-16 — Report fields and export separation

- **State:** APPROVED on 2026-07-19
- Required fields for approved reports 4–29 are recorded in `docs/reports/MARIB-TAX-REPORT-TO-FIELD-MATRIX-01.md`.
- `report.view` and `report.export` remain separate.

## Remaining open business/data decisions

Carried and data-specific opens not closed by ADR-015 remain in `docs/governance/MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01.md` (including DM-01…DM-03, DM-05…DM-07, DM-09, DM-12…DM-15, DM-17…DM-20, DM-24…DM-26, and deferred slices of DM-08/DM-21/DM-25).

## API contract decisions

### API-01 — Initial OpenAPI routing and compatibility boundary

- **State:** APPROVED on 2026-07-17
- **Canonical record:** ADR-011.

### API-02 — Stable endpoint permission identifiers

- **State:** APPROVED on 2026-07-18
- **Canonical record:** ADR-012.

### API-03 — Request draft form contract and schema versioning

- **State:** APPROVED on 2026-07-18
- **Canonical record:** ADR-013.

### API-04 — Authentication and current-actor runtime boundary

- **State:** APPROVED on 2026-07-18
- **Canonical record:** ADR-014.

The canonical open-decision registers remain under `docs/governance/`; this file is an execution-facing summary and does not replace them.
