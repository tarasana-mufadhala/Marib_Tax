# MARIB-TAX-BATCH-10-DUES-PAYMENTS-DESIGN-DECISION-GATE-01

## Decision

**PASS — BATCH_10_DUES_PAYMENTS_DESIGN_APPROVED_FOR_SOURCE**

## Scope

- Repository: `tarasana-mufadhala/Marib_Tax`
- Baseline: `origin/main` `5d267c3f28f011f2463f246f9b419cf74ac52e57`
- Production: Batches 01A–09 APPLIED / VERIFIED PASS; Batch 10 NOT_STARTED; `PROD-DB-10 = CLOSED`
- This gate authorizes design review and source authoring only
- Forbidden by this gate: production preflight, linked dry-run, `db push`, Storage, deploy, real data, notifications, Batch 11

## Reviewed sources

| Source | Role |
| --- | --- |
| ADR-015 payment / dues evidence | Manual only; no gateway; 1 due : N receipts; partial allowed; confirmed receipts never hard-deleted; additive corrections/replacements |
| DM-22 / PHY-09 / PHY-10 | Cardinality and partial-payment model **Accepted**; physical join shape remains open |
| IR-34…37 / IR-64 / IR-65 | Basis ≥1 (app); correction retained with reason; receipt lineage; confirmation→receipt; confirmation ≠ final approval |
| REL-064…071 / REL-069 | Due→request/balagh FKs; children→due; confirmation/replacement→receipt; **REL-069 UNRESOLVED_NO_FK** (no Due–Receipt FK / no `due_receipt_links`) |
| CK-T02 | Case XOR: not both `service_request_id` and `balagh_id` (DM-09 PROPOSED) |
| TABLE-056…062 column catalog | Seven-table physical scope in schema `dues` |
| Physical migration sequence Batch 10 | Dependencies Batches 6–9; stop on gateway columns / 1:1-only encoding / hard-delete of confirmed receipts |
| Batch 08 attachment metadata | Basis optional `attachment_id` → `files.attachments`; receipt bytes via polymorphic `files.attachment_links` (REL-072), not a Batch 10 Storage mutation |
| DM-09 / OD-15 / PHY-35 | Open / partial: status catalogues, correction authority roster, formal money-type acceptance |
| Batches 06–09 source pattern | RLS default-deny, revoke grants, no policies/seeds, NestJS UUIDs, `numeric` money not float |

## Compatibility matrix

| Topic | Result | Design adoption |
| --- | --- | --- |
| 1. Due parent context | **PASS** | Dual nullable FKs to `requests.service_requests` and `balaghat.balaghs` with `ON DELETE RESTRICT`; CK-T02 forbids both set; no `cases` / `case_id`. NestJS must not attach dues to unrelated aggregates. Exact-one (Batch 09 CK-T01 style) is **not** silently encoded — catalog CK-T02 remains “not both” under open DM-09. |
| 2. Amount / currency | **PASS** | `numeric(18,2)` + non-blank `currency_code`; `amount >= 0`; no float; no gateway/provider/settlement columns; no automatic tax engine. PHY-35 recommended A adopted for source; formal PHY-35 closure remains open. Optional due-date column absent from catalog — not invented. |
| 3. Basis references | **PASS** | `due_basis_document_references` child rows; `basis_type_code` required non-blank; optional `document_reference` + optional `attachment_id` → `files.attachments`; no Postgres bytes. IR-34 (≥1 basis) enforced in NestJS, not by seed/trigger. |
| 4. Due corrections | **PASS** | Append-only `due_corrections` with `prior_amount` / `new_amount` / `currency_code`; `reason` NOT NULL non-blank; `corrected_by_staff_profile_id` NOT NULL; `corrected_at` NOT NULL; original due row retained (no destructive financial history erase in this path). |
| 5. Notices | **PASS** | `payment_notices` metadata only (type/status, issued_at, amounts, due FK). No SMS/WhatsApp/email/push delivery; Batch 11 owns delivery outbox. |
| 6. Receipts | **PASS** | `payment_receipts` without `payment_due_id` and without `due_receipt_links` (REL-069). Multiple receipts allowed by absence of 1:1 encoding. Attachment evidence via Batch 08 `files.attachment_links` owner association; no Storage path/URL columns; no payer-identity requirement (ADR-015). |
| 7. Partial payments | **PASS** | ADR-015 / PHY-10: partial via multiple receipts. Due is **not** auto-marked fully paid in SQL. **Overpayment** is not encoded (reject / allow / flag) — left for NestJS validation pending explicit governance (HOLD question recorded below, not invented). |
| 8. Receipt replacement | **PASS** | `receipt_correction_replacements` append-only + optional `replaces_receipt_id` self-FK on receipts; mandatory non-blank reason + acting staff + timestamp; originals retained. |
| 9. Payment confirmation | **PASS** | `payment_confirmations` FK → receipt; NestJS requires acceptable/accepted receipt state before confirm; confirmation ≠ request/balagh final approval (IR-65); no hard-delete path; no admin-bypass policy in SQL. |
| 10. Attachments | **PASS** | Basis may reference `files.attachments`; receipt binaries via polymorphic links only; no bytes/base64; no bucket/policy; reference ≠ access; NestJS remains authorization authority. |

## Unresolved decisions (explicitly deferred; not encoded as silent defaults)

| ID | Remains open | Source posture |
| --- | --- | --- |
| REL-069 join shape | FK on receipt vs allocation table vs NestJS-only | Catalog / relational integrity: **no** Due–Receipt FK and **no** `due_receipt_links` in Batch 10 |
| Overpayment / close rules | Reject, allow+flag, or app-only validation | No SQL auto-close / overpay rule; NestJS validates until governance decides |
| DM-09 | Status / acceptance / outcome catalogues; rounding ownership | Opaque `*_code` text only; no enum seed |
| CK-T02 vs exact-one parent | Whether orphan dues (neither parent) are allowed | Catalog “not both” retained; NestJS should set an authorized parent |
| OD-15 / DMOD-15 | Who may correct payment receipts | Structure present; authz deferred to NestJS |
| PHY-35 formal acceptance | Money type register still Open | Source uses recommended `numeric(18,2)` + currency text |
| DM-01 / DM-13 / DM-20 | `public_ref` format; actor/correlation conventions | Nullable `public_ref` / profile / correlation columns only |

### Minimum HOLD questions (deferred — do not block this PASS)

1. Should Due–Receipt association become a physical `payment_due_id` FK, an allocation link table, or remain NestJS-only beyond Batch 10?
2. Should overpayment be rejected, allowed and flagged, or validated only in application logic when confirmed receipt totals exceed the due?
3. Should CK-T02 be upgraded to exact-one parent (Batch 09 style) under DM-09?

## Exact table scope

Schema `dues` (already created in Batch 01A):

1. `dues.payment_dues` (TABLE-056)
2. `dues.due_basis_document_references` (TABLE-057)
3. `dues.due_corrections` (TABLE-058)
4. `dues.payment_notices` (TABLE-059)
5. `dues.payment_receipts` (TABLE-060)
6. `dues.receipt_correction_replacements` (TABLE-061)
7. `dues.payment_confirmations` (TABLE-062)

Naming follows the physical table/column catalogs (not informal synonyms).

## Relationship design

- `payment_dues.service_request_id` → `requests.service_requests.id` (nullable, RESTRICT)
- `payment_dues.balagh_id` → `balaghat.balaghs.id` (nullable, RESTRICT)
- CK-T02: not both parents set
- Basis / corrections / notices → `payment_dues` (RESTRICT)
- Basis optional `attachment_id` → `files.attachments` (RESTRICT)
- Replacements / confirmations → `payment_receipts` (RESTRICT)
- Receipt self-FK `replaces_receipt_id` (RESTRICT)
- **No** Due–Receipt FK; **no** `due_receipt_links`; **no** `cases`

## Authorization boundaries

- DB: RLS enabled on all seven tables; `REVOKE ALL` from `PUBLIC`, `anon`, `authenticated`, `service_role`; zero policies in this batch
- App: NestJS Dues / Payment Evidence module owns assess/correct/notice/receipt/confirm; UI hiding is not authorization
- Confirmation authority does not grant final request/balagh approval
- No general admin-bypass policy objects

## Correction / replacement / confirmation lineage

- Original due amount retained on `payment_dues`; corrections append with prior/new amounts
- Original receipts retained; replacements append with mandatory reason + staff
- Confirmations append against receipts; no hard-delete/purge path

## Attachment integration

- Depends on Batch 08 `files.attachments` (+ polymorphic `attachment_links` for receipt evidence)
- No Storage schema mutation, bucket, policy, or `storage.objects` FK in Batch 10
- Attachment id never grants download

## Stop conditions

Stop source/apply work if any of the following appears:

- Payment gateway / provider / settlement / checkout columns
- Encoding 1:1-only Due–Receipt contrary to ADR-015
- Invented `cases` table / `case_id` / unapproved `due_receipt_links`
- Hard delete / purge / seed / backfill
- `CREATE POLICY` or positive client grants
- Storage bytes, buckets, or Storage policies in Batch 10
- Real notification delivery (SMS/WhatsApp/email/push)
- Production preflight / `db push` without a separate PROD-DB-10 approval
- Silent finalization of overpayment or REL-069 join shape

## Accepted source artifacts

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| Migration | `supabase/migrations/20260725120000_create_dues_payment_evidence_family.sql` | `F19835DA998891736F45073D9300DD1C565D26A5FA052E0ED4998E4B60391DF6` |
| Verifier | `scripts/db/verify/verify_batch_10_dues_payment_evidence.sql` | `6D310C91DC1F128E983D44A36E3F7BB7974D23F119DBD64B3427A7DB704A56B1` |
| Source report | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-10-DUES-PAYMENTS-REPORT.md` | — |

## Follow-on

- Design gate PASS authorizes Batch 10 **source authoring and review PR only**
- `PROD-DB-10` remains **CLOSED** until a separate explicit production approval
- Batch 11 must not start from this gate
