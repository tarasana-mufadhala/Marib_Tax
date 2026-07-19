# ADR-015: Approved Business Data Boundaries (Tax Number, Account, Payment, Visits, Attachments, Notifications, Reports)

- **Status:** Accepted
- **Date:** 2026-07-19
- **Decision:** DM-04 / DM-23 / DM-21 (v1) / DM-22 / DM-08 (entry) / DM-10 (classification+archive) / DM-11 (provider) / DM-16 (fields+authz) and related PHY-06 / PHY-09 / PHY-10

## Context

Batch 04 and later persistence/source work were blocked on open business decisions for tax numbers, account linkage, payment evidence, field visits, attachments, notifications, and report fields. The project owner supplied explicit approved boundaries on 2026-07-19. This ADR records only those approved boundaries; unresolved sub-questions remain open and must not be guessed.

## Decision

### Tax number (DM-04 / DM-23 / PHY-06)

- Digits only.
- Issued by the Tax Authority in Aden; the system never generates tax numbers.
- The system stores the issued value as entered.
- Storage type is numeric text so leading zeros are preserved.
- Uniqueness: an active taxpayer must not share a tax number with another active taxpayer (global unique among active taxpayers).
- Correction is additive: previous value, reason, and actor are retained; prior values are not erased.

### Account linkage (DM-21 — v1 scope)

- One account represents exactly one taxpayer.
- First release has no multi-taxpayer representation / delegated multi-link UX.
- Deferred (still open if needed later): whether one taxpayer may hold multiple accounts; future delegated representation, approval, and revocation beyond the single-account rule.

### Payment / dues evidence (DM-22 / PHY-09 / PHY-10)

- Payment is manual only; no payment gateway or settlement provider.
- The taxpayer (or payer) delivers the receipt to the admin; payer identity is not a required business attribute for confirmation.
- Partial payment is allowed.
- One due may be associated with multiple receipts (1 due : N receipts).
- Admin records and confirms payment.
- Confirmed receipts are never deleted; corrections/replacements remain additive lineage.

### Field visits (DM-08 — data entry)

- Visit location, result, and related operational data come only from admin or authorized staff entry.
- The system does not auto-generate visit location or visit result.
- Deferred: team masking and full result-structure catalogue details not covered by this entry rule.

### Attachments (DM-10 / archive posture)

- Attachments are classified by type.
- Attachments are retained in archive; correction issues a new version and does not delete the previous version.
- Deferred: timed destruction periods, legal-hold destruction overrides, and storage-metrics accounting (DM-17 / DM-26) remain open where not implied by permanent archive retention of versions.

### Notifications (DM-11 provider boundary)

- During build and experimentation, the intended SMS provider is Twilio, reached only through a provider port.
- The provider port must allow a later local provider or WhatsApp API without rewriting domain/outbox contracts.
- No real external send is authorized now; adapters remain disconnected / disabled until a separate production communication approval.

### Reports (DM-16)

- Persistence and contracts must supply the fields required by the approved analytical report catalog (reports 4–29).
- Canonical field coverage is recorded in `docs/reports/MARIB-TAX-REPORT-TO-FIELD-MATRIX-01.md`.
- `report.view` and `report.export` remain separate permissions; view never implies export.

## Consequences

- Batch 04 source authoring may encode tax-number digit-only numeric-text storage, active uniqueness, correction lineage, and one-account-to-one-taxpayer link constraints consistent with this ADR.
- Dues/payment migrations must stay manual-evidence oriented, allow partial payment via multiple receipts per due, and forbid hard-delete of confirmed receipts.
- Worker notification delivery remains port-based; Twilio is documentation/build intent only until sending is separately approved.
- Report projections and export audit trails must honor the field matrix and separate view/export authorization.
- This ADR does not itself authorize any production migration, deployment, secret change, or real SMS/WhatsApp delivery. `PROD-DB-03` remains a separate production gate.
