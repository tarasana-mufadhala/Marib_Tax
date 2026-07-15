# MARIB-TAX-PHYSICAL-IDENTIFIER-DESIGN-01

**Status:** Physical identifier design (documentation only). No executable SQL. Recommendations are **PROPOSED**. Unresolved matters are **يحتاج اعتماد لاحق**.

**Sources:** `MARIB-TAX-IDENTIFIER-AND-REFERENCE-RULES-01`, `MARIB-TAX-LOGICAL-DATA-MODEL-01`, DM-01, DM-02, DM-04, DM-21, DM-23.

## 1. Design principles

| Principle | PROPOSED physical stance |
| --- | --- |
| Internal vs public | Internal stable IDs are never public credentials; public refs identify issued records only. |
| Immutable identity | Once assigned, internal PK and issued public ref are immutable (no reuse). |
| Reference ≠ authorization | Holding a public number or external key does not authorize access or mutation (IR-05). |
| No phone/tax as auth keys | Phone number and Tax Number are **not** authentication keys and are **not** sufficient for Account Link proof (IR-68). |
| Correlation ≠ business ref | Correlation, idempotency, and event IDs are distinct families (IR-06, IR-67). |
| Public numbering | Format, length, sequencing, check digits, issue/display point, and presentation **تبقى يحتاج اعتماد لاحق** (DM-01, DM-02). |

## 2. Identifier-family catalog (IDF-01 … IDF-28)

Exactly **28** individually auditable identifier families. Headline count equals catalog row count.

| IDF | Business object | Physical column / object | PostgreSQL type (PROPOSED) | Generation owner | Uniqueness scope | Mutability | Public exposure | Collision handling | Import behavior | Correction behavior | Security restriction | Open decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IDF-01 | Internal stable identifier | `{table}.id` on application tables | `uuid` PK | Owning NestJS module (generation strategy **يحتاج اعتماد لاحق**) | PK per table | Immutable after create | Internal only | Reject duplicate PK insert | Map/preserve source→target ids in import disposition | Never reassign PK; correct via new row or typed correction | Never an auth credential; server join key only | DM-01 |
| IDF-02 | Authentication Identity | `identity.user_profiles.auth_user_id` → `auth.users.id` | `uuid` | Supabase Auth (managed) | UNIQUE 1:0..1 profile | Immutable link while active | Not a business public ref | One Auth user → at most one profile (**PROPOSED**) | Not imported as business identity | Revoke/relink via Identity workflows; no cascade erase of cases | Session authentication only; not own-data alone | — |
| IDF-03 | User Profile | `identity.user_profiles.id` | `uuid` PK | Identity and Access | PK | Immutable | Internal | PK | Staff/taxpayer profile provisioning | Soft-archive; no PK reuse | Subject of Account Link and report filters | — |
| IDF-04 | Staff Profile | `identity.staff_profiles.id` (+ UNIQUE `user_profile_id`) | `uuid` PK | Identity and Access | PK; UNIQUE profile link | Immutable PK | Internal | UNIQUE `user_profile_id` | Staff roster import if approved | Eligibility end-date; no PK reuse | Assignment / visit eligibility joins | — |
| IDF-05 | Role Identifier | `identity.roles.id` (+ optional `code`) | `uuid` PK; optional `text` code | Identity and Access | PK; optional `code` UNIQUE | PK immutable; code stable if issued | Internal catalogue | Reject duplicate `code` | Catalogue seed/import | Retire role; preserve historic assignments | Authorization mapping only | — |
| IDF-06 | Permission Identifier | `identity.permissions.id` (+ optional `code`) | `uuid` PK; optional `text` code | Identity and Access | PK; optional `code` UNIQUE | PK immutable; code stable if issued | Internal catalogue | Reject duplicate `code` | Catalogue seed/import | Retire permission; preserve mappings | Authorization mapping only | — |
| IDF-07 | Public request number | `requests.service_requests.public_ref` | `text` | Service Requests | UNIQUE when issued (NULLS DISTINCT **PROPOSED**) | Immutable once issued; non-reusable | Restricted public business ref | Reject reuse / collision | Not a silent overwrite target | No reissue of same number | Access-restricted; audited; not an auth key | DM-01, DM-02 — numbering **يحتاج اعتماد لاحق** |
| IDF-08 | Public Balagh number | `balaghat.balaghs.public_ref` (TABLE-037) | `text` | Balaghat | UNIQUE when issued (NULLS DISTINCT **PROPOSED**) | Immutable once issued; non-reusable | Restricted public business ref | Reject reuse / collision | Not a silent overwrite target | No reissue of same number | Does not authorize subject-data mutation | DM-01, DM-02 — numbering **يحتاج اعتماد لاحق** |
| IDF-09 | Taxpayer reference | `registry.taxpayers.id`, `registry.taxpayers.public_ref` | `uuid` PK + `text` public_ref | Taxpayer Registry | PK; public_ref UNIQUE when issued | PK/public_ref immutable when issued | public_ref restricted | Reject public_ref collision | Match by approved keys only | Correct attributes; do not reuse public_ref | Own-data via Account Link path only | DM-01, DM-02 — format **يحتاج اعتماد لاحق** |
| IDF-10 | Account Link reference | `registry.taxpayer_account_links.id` | `uuid` PK (+ optional public_ref) | Taxpayer Registry | PK; effective uniqueness **يحتاج اعتماد لاحق** | PK immutable | Internal | Policy for multi-link **يحتاج اعتماد لاحق** | Link verification evidence | End-date / revoke; retain history | Own-data basis; not phone/tax alone | DM-21 |
| IDF-11 | Tax Number | `legal.tax_numbers.id`, `tax_number_value` | `uuid` PK + `text` value | Legal Entities | Uniqueness scope **يحتاج اعتماد لاحق** | Value immutable while valid; replace via lineage | Restricted display | Scope collision policy open | Evidence-backed import | Invalidate/replace retains lineage | Display/match only; **never** auth key | DM-04, DM-23 |
| IDF-12 | Taxpayer–Legal-Entity Association | `registry.taxpayer_legal_entity_associations.id` | `uuid` PK | Taxpayer Registry | PK; effective-dated pair | PK immutable | Internal | Effective-dating uniqueness **PROPOSED** | Evidence-backed | End-date; retain history | Evidence-backed relation only | — |
| IDF-13 | Activity reference | `masterdata.commercial_activities.id` (+ optional `public_ref`) | `uuid` PK + optional `text` | Activities and Branches | PK; public_ref UNIQUE when issued | Immutable when issued | Restricted | Reject public_ref collision | Selection snapshot target | Status history; no PK reuse | Selection snapshot; not mutation grant | DM-01 |
| IDF-14 | Branch reference | `masterdata.branches.id` (+ optional `public_ref`) | `uuid` PK + optional `text` | Activities and Branches | PK; public_ref UNIQUE when issued | Immutable when issued | Restricted | Reject public_ref collision | Branch-scoped import | Soft-archive via `archived_at` | Branch-scoped effects only (IR-72) | DM-01 |
| IDF-15 | Property Identifier | `masterdata.properties.id` (+ optional `public_ref`) | `uuid` PK + optional `text` | Activities and Branches | PK; public_ref UNIQUE when issued | Immutable when issued | Restricted | Reject public_ref collision | Property master import | Soft-archive; ownership via records | Not direct Taxpayer FK authority | DM-24 |
| IDF-16 | Property Unit Identifier | `masterdata.property_units.id` (+ optional `public_ref`) | `uuid` PK + optional `text` | Activities and Branches | PK; public_ref UNIQUE when issued | Immutable when issued | Restricted | Reject public_ref collision | Unit master import | Soft-archive; unit scope under property | Unit association conditional (TABLE-021) | DM-24; PHY-08 |
| IDF-17 | Property Ownership Record | `masterdata.property_ownership_records.id` | `uuid` PK | Activities and Branches | PK | Immutable | Internal (HS) | PK | Ownership evidence import | Append history; never overwrite prior | Authoritative taxpayer↔property path | DM-24 |
| IDF-18 | Due reference | `dues.payment_dues.id`, `public_ref` | `uuid` PK + `text` public_ref | Dues and Payment Evidence | Immutable issued record | Immutable when issued | Restricted | Reject public_ref collision | Evidence-backed assessment | Corrections additive (prior/new amounts) | Not final case approval | DM-01, DM-09 |
| IDF-19 | Receipt reference | `dues.payment_receipts.id`, `public_ref` | `uuid` PK + `text` public_ref | Dues and Payment Evidence | Immutable; replacement preserves lineage | Immutable when issued | Restricted | Reject public_ref collision | Receipt evidence upload | Replacement retains prior receipt id; no public_ref reuse | Confirmation requires accepted receipt; Due–Receipt open | DM-01, DM-22 |
| IDF-20 | Visit reference | `visits.field_visits.id`, `public_ref` | `uuid` PK + `text` public_ref | Field Visits | Immutable lifecycle reference | Immutable when issued | Restricted | Reject public_ref collision | Not case-number substitute | Exactly one case context (request XOR balagh) | Visit evidence private | DM-01, DMOD-08 |
| IDF-21 | Import batch / row reference | `imports.import_batches.id`; row `imports.import_row_results.id` | `uuid` PK (+ optional batch public_ref) | Imports and Data Quality | Batch and row traceable | Immutable | Internal / restricted ops | Idempotency disposition separate | Source file restricted | Commit disposition retains outcomes | No full rejected-row dumps in events | DM-01, DM-12 |
| IDF-22 | Content / attachment reference | `files.attachments.id`; content item ids in `content` schema | `uuid` PK | Attachments / Content Management | PK | Immutable | Attachment id not a download grant | PK | Import attachments private | Soft-delete pending retention | Short-lived authorized access only | DM-10 |
| IDF-23 | Correlation identifier | `correlation_id` on commands, audit, outbox | `uuid` (**PROPOSED** when system-issued) | Producing workflow / Audit | Immutable operation-chain trace | Immutable when set | Internal | Distinct from business refs | May accompany import ops | Never rewritten | Trace only; not a business reference | DM-20 |
| IDF-24 | Idempotency / deduplication identifier | `idempotency_key` (scoped by actor/workflow) | `text` or `uuid` | Receiving workflow / worker | Scoped uniqueness **PROPOSED** | Immutable for outcome retention | Internal | Retain prior disposition on collision | Import batch keys | Never a public business number | Never a business reference | DM-20 |
| IDF-25 | Domain / audit event identifier | `audit.audit_events.id`; `audit.domain_event_outbox.event_id` (TABLE-094 UNIQUE); reporting TABLE-090 history ids | `uuid` | Audit / Reporting / worker | UNIQUE `event_id` on TABLE-094 | Append-only | Internal | Reject duplicate `event_id` | Not business import keys | No overwrite of prior events | Supporting evidence only; outbox ≠ correlation/causation/idempotency | DM-13 |
| IDF-26 | Notification message reference | `notify.notification_messages.id` | `uuid` PK | Notification Delivery | PK | Immutable | Internal | PK | Delivery queue may reference message | Delivery never decides case outcome | Read state is per recipient | DM-25 |
| IDF-27 | Report export record | `reporting.report_export_records.id` | `uuid` PK | Reporting and Analytics | PK | Immutable | Internal | PK | Export artifacts private | Retain export attempt evidence | Captures requesting User Profile; `report.export` separate | DM-16 |
| IDF-28 | Storage object path / id | `files.attachments.storage_object_path`, `storage_object_id` | `text` path and/or `text`/`uuid` object id | Attachments and Private Files | Storage locator uniqueness per bucket path **PROPOSED** | Path immutable while object retained | Not a public business ref | Collision = storage error | Import files remain private | Soft-delete / legal hold | Does not grant access alone; transactional buckets private | DM-26 |

**Catalog row count: 28** (IDF-01 … IDF-28). Matches summary headline.

## 3. Type and column conventions (**PROPOSED**)

| Concern | Convention |
| --- | --- |
| Internal PK | `id uuid NOT NULL` PRIMARY KEY; default generation strategy **يحتاج اعتماد لاحق** (app-generated vs DB `gen_random_uuid()`). |
| Foreign keys | Target column is the target table `id uuid` unless noted (e.g. `auth_user_id` → `auth.users`). |
| Public refs | `text NOT NULL` (or NULL until issue point — DM-02) with UNIQUE where issued; format **يحتاج اعتماد لاحق**. |
| Timestamps | `timestamptz` consistently for all temporal columns. |
| Effective dating | `effective_from timestamptz`, `effective_to timestamptz NULL` where history requires. |
| Actor refs | `created_by` / `updated_by` / approval actors as `uuid` → `identity.user_profiles.id` or `staff_profiles.id` as appropriate; exact actor model **يحتاج اعتماد لاحق** (DM-13). |

## 4. Forbidden and restricted identifier uses

| Forbidden / restricted | Rule |
| --- | --- |
| Phone as auth key | Must not be UNIQUE login credential or Account Link sole proof. |
| Tax Number as auth key | Must not authenticate users or alone prove own-data access. |
| Public request/Balagh number as secret | Access-restricted; audited disclosure; not a bearer token. |
| Attachment id as download grant | Access via authorized NestJS short-lived mechanism only. |
| Idempotency key as public business number | Distinct storage and lifecycle from `public_ref`. |
| Correlation id as case number | Distinct from request/Balagh/due/receipt public refs. |

## 5. Account Link path identifiers

Own-data authorization path (logical → physical refs):

1. Authentication Identity (`auth.users.id`) — IDF-02
2. → `identity.user_profiles.auth_user_id` / `user_profiles.id` — IDF-03
3. → `registry.taxpayer_account_links.user_profile_id` (active, verified) — IDF-10
4. → `registry.taxpayer_account_links.taxpayer_id`
5. → `registry.taxpayers.id` — IDF-09

Multiplicity (one profile ↔ many taxpayers; delegated representation) **يحتاج اعتماد لاحق** (DM-21).

## 6. Due–Receipt identifiers

- Each Due (IDF-18) and each Receipt (IDF-19) has its own `uuid` PK and optional/issued `text` public_ref.
- No fixed FK cardinality between Due and Receipt is asserted physically pending DM-22 (REL-069 application-only).
- Replacement receipts retain lineage to prior receipt id; they do not reuse public_ref of the original.

## 7. Issuance, correction, and audit

All issuance, correction, use in sensitive context, exceptional disclosure, and idempotency outcome remains auditable (logical identifier rules). Physical columns such as `correlation_id`, actor ids, and before/after sensitive details support that requirement without defining retention durations (**يحتاج اعتماد لاحق**, DM-17).

## 8. Summary counts

| Category | Count |
| --- | ---: |
| Identifier families catalogued (IDF-01…IDF-28) | **28** |
| Catalog data rows (section 2) | **28** |
| PROPOSED `uuid` PK family | Primary for all internal business tables |
| PROPOSED `text` public ref family | Request, Balagh (`balaghat.balaghs`), Taxpayer, Activity/Branch/Property/Unit (optional), Due, Receipt, Visit, Import batch |
| Distinct non-business ID families | Correlation, idempotency, domain/audit event, storage object locator |
| Public numbering format decisions | **يحتاج اعتماد لاحق** (remain open) |
