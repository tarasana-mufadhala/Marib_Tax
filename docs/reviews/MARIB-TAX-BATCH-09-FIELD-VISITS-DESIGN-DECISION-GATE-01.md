# MARIB-TAX-BATCH-09-FIELD-VISITS-DESIGN-DECISION-GATE-01

## Decision

**PASS — BATCH_09_FIELD_VISITS_DESIGN_APPROVED_FOR_SOURCE**

## Scope

- Repository: `tarasana-mufadhala/Marib_Tax`
- Baseline: `origin/main` `7fe71ea1d63381450b834f8f3803bac783f4df10`
- Production: Batches 01A–08 APPLIED / VERIFIED PASS; Batch 09 NOT_STARTED; `PROD-DB-09 = CLOSED`
- This gate authorizes design review and source authoring only
- Forbidden by this gate: production preflight, dry-run, `db push`, Storage, deploy, real data, notifications, Batch 10

## Reviewed sources

| Source | Role |
| --- | --- |
| ADR-015 field-visit entry boundary | Staff/admin entry only; no auto-generated location/result |
| IR-29 / IR-31 | Exactly one authorized request or Balagh context; schedule history retained |
| REL-056…063 / CK-T01 | Dual nullable parents + XOR; RESTRICT FKs; additive corrections; evidence → attachments |
| TABLE-050…055 column catalog | Intended six-table physical scope |
| Physical migration sequence Batch 9 | Dependencies Batches 6–8; stop on silent trigger defaults |
| OD-08 / DMOD-08 | Open: service-specific visit **triggers** (not parent XOR shape) |
| OD-15 / DMOD-15 | Open: who may correct results (authority), not correction table shape |
| DM-08 | Partial: staff entry approved; masking / full result catalogue open |
| State machine §3 Field Visit | schedule / reschedule / complete / cancelVisit(PROPOSED) / correctResult |
| Batch 08 post-apply evidence | Attachment metadata available; bytes/buckets remain outside Batch 09 |
| Batches 06–08 source pattern | RLS default-deny, revoke grants, no policies/seeds, NestJS UUIDs |

## Compatibility matrix

| Topic | Result | Design adoption |
| --- | --- | --- |
| 1. Visit parent context | **PASS** | `service_request_id` and `balagh_id` individually nullable; `CHECK` requires exactly one non-null (CK-T01); FKs `RESTRICT`; no `cases` table; neither both nor neither. Grounded in approved **IR-29**. DMOD-08 remains open for **triggers only** and is not closed by this XOR. |
| 2. Initiation / authorization | **PASS** | `created_by_staff_profile_id` NOT NULL → `identity.staff_profiles`; taxpayer cannot create visits in DB foundation; no admin-bypass policy; NestJS enforces authz below UI; RLS enabled, no `CREATE POLICY`, no positive grants. |
| 3. Scheduling | **PASS** | `visit_schedules` holds scheduled start/end, status, revision history (reschedule = new/retained revision rows per IR-31). Actual start/end and opaque location/notes live on `field_visits` so schedule ≠ execution. Visit need not be scheduled before root creation. Cancellation via status/archive retention; no hard delete. `cancelVisit` authority remains PROPOSED/open and is not hardcoded. |
| 4. Team members | **PASS** | Multiple rows per visit; `staff_profile_id` + `role_on_visit` (lead/member via application codes); `effective_from` / `effective_to`; partial unique active membership; historical rows retained. Masking / taxpayer visibility deferred (DM-08 open). |
| 5. Results | **PASS** | Flexible `result_code` / `result_summary`; `recorded_by_staff_profile_id` + `recorded_at` required; one result row per visit (`UNIQUE field_visit_id`); no fixed form schema; original row not silently replaced. |
| 6. Corrections | **PASS** | Append-only `visit_result_corrections`; FK to result; `reason` NOT NULL non-blank; `corrected_by_staff_profile_id` NOT NULL; `corrected_at` NOT NULL. Who may correct (OD-15) remains NestJS/policy-open. |
| 7. Evidence / attachments | **PASS** | `visit_evidences.attachment_id` → `files.attachments` only; no Postgres bytes; no Storage path exposure; no bucket/policy; reference ≠ access grant; evidence anchored to visit (role code may distinguish result/correction context without inventing extra FKs). |
| 8. Lifecycle / deletion | **PASS** | No hard-delete/purge path; `archived_at` / status retention; no seed/backfill; no service-specific trigger defaults. |

## Unresolved decisions (explicitly deferred; not encoded as silent defaults)

| ID | Remains open | Source posture |
| --- | --- | --- |
| OD-08 / DMOD-08 | Which services auto-trigger visits | No trigger tables, defaults, or silent create rules in Batch 09 |
| OD-15 / DMOD-15 | Exact correction authority roster | Correction structure present; authz deferred to NestJS |
| DM-08 | Team masking / full result catalogue | Opaque codes/text only; no masking rules in SQL |
| cancelVisit | Exact cancel authority / catalogue | Nullable cancellation reason support only; no forced codeset seed |
| Evidence sub-link to result/correction | Optional future FK specificity | `evidence_role_code` + visit FK for Batch 09 |

## Exact table scope

Schema `visits` (already created in Batch 01A):

1. `visits.field_visits` (TABLE-050)
2. `visits.visit_schedules` (TABLE-051)
3. `visits.visit_team_members` (TABLE-052)
4. `visits.visit_results` (TABLE-053)
5. `visits.visit_result_corrections` (TABLE-054)
6. `visits.visit_evidences` (TABLE-055)

## Relationship design

- `field_visits.service_request_id` → `requests.service_requests.id` (NULL able, RESTRICT)
- `field_visits.balagh_id` → `balaghat.balaghs.id` (NULL able, RESTRICT)
- XOR CHECK: exactly one parent non-null
- Children FK → `field_visits` / `visit_results` / `files.attachments` with RESTRICT
- Team → `identity.staff_profiles`
- No generic `cases` relation

## Authorization boundaries

- DB: RLS enabled on all six tables; `REVOKE ALL` from `PUBLIC`, `anon`, `authenticated`, `service_role`; zero policies in this batch
- App: NestJS Field Visits module owns create/schedule/complete/correct; UI hiding is not authorization
- Taxpayer profiles have no create/approve path in this foundation

## Correction lineage

- Original `visit_results` row retained
- Corrections append only and reference `visit_result_id`
- Mandatory non-blank reason + correcting staff + timestamp
- No `UPDATE` of the original summary/code in the correction path

## Attachment / evidence integration

- Depends on Batch 08 `files.attachments` metadata
- No Storage schema mutation, bucket, policy, or `storage.objects` FK
- Attachment id never grants download

## Stop conditions

Stop source/apply work if any of the following appears:

- Silent service-specific visit trigger defaults (contradicts open DMOD-08)
- Generic `cases` table or dual-parent / no-parent rows allowed
- Hard delete / purge / seed / backfill
- `CREATE POLICY` or positive client grants
- Storage bytes, buckets, or Storage policies in Batch 09
- Production preflight / `db push` without a separate PROD-DB-09 approval

## Accepted source artifacts

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| Migration | `supabase/migrations/20260724120000_create_field_visits_family.sql` | `5F6964D3116A77D1744CDB6B4A7D504339E5A64FA3DA25742170C903F624B33D` |
| Verifier | `scripts/db/verify/verify_batch_09_field_visits_family.sql` | `81151A673FD794F383094DA6A86FEB38CCFB6ED58F046178FD89CB9FA6F57C77` |
| Source report | `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-FIELD-VISITS-REPORT.md` | — |

Static scope: 6 CREATE TABLE; 6 ENABLE RLS; 0 CREATE POLICY; 0 INSERT/seed; XOR parent CHECK present; active-team partial unique present.

## Follow-on

- Design gate PASS authorized Batch 09 **source authoring and review PR only** (PR #70 MERGED).
- A later fresh preflight recorded `PROD-DB-09 = REQUIRES_USER_APPROVAL` with apply still closed; see `docs/preflight/MARIB-TAX-DB-FOUNDATION-BATCH-09-PRODUCTION-APPLY-PREFLIGHT-01-REPORT.md`.
- This design PASS still does not authorize apply, Storage operations, Batch 10, or deployment.
