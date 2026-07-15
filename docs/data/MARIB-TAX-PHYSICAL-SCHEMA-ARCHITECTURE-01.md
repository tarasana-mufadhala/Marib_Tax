# MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01

**Document ID:** MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01
**Status:** PROPOSED physical PostgreSQL/Supabase schema architecture (documentation only)
**Branch context:** `docs/physical-schema-design-01`
**Baseline:** Logical data model (92 entities), module boundaries, ADR-005 / ADR-010 / ADR-007 / ADR-009

> This document proposes application schemas and hard ownership rules. It is **not** executable SQL, **not** an approved migration pack, and contains **no** secrets or credentials. Unresolved items are marked **يحتاج اعتماد لاحق**. Technical recommendations are **PROPOSED** only.

## Hard rules (non-negotiable for this design)

1. **Clients never mutate business tables.** Flutter and Next.js do not write operational/business data directly to PostgreSQL or via privileged Supabase client APIs (ADR-010).
2. **NestJS only for application mutations.** All transactional writes to application-owned schemas go through NestJS application services using a **server-only** database role (service role / privileged API role).
3. **No service-role in Flutter/Next.** Supabase service-role keys and equivalent privileged credentials never ship in client bundles.
4. **Storage is private by default.** Operational files use private buckets; access is authorized short-lived URL or NestJS-mediated download only (ADR-009).
5. **Module ownership must be visible.** Each application schema maps to one primary NestJS owning module; cross-module mutation of owned aggregates is forbidden.
6. **Default exposure:** application transactional schemas are **not** PostgREST-exposed for client CRUD. Any read-model exposure requires an explicit approved pattern and cannot bypass NestJS authorization.
7. **Managed platforms:** `auth` and `storage` remain Supabase-managed; application code references them, does not redefine password stores or raw object blobs as app tables.

## Proposed schema inventory

| Schema | Kind | Primary NestJS owner | Default PostgREST exposure |
| --- | --- | --- | --- |
| `auth` | Supabase-managed | Identity and Access (consume) | Platform-managed |
| `storage` | Supabase-managed | Attachments and Private Files (consume) | Platform-managed; private buckets |
| `identity` | Application-owned | Identity and Access | Not exposed for transactional CRUD |
| `registry` | Application-owned | Taxpayer Registry | Not exposed for transactional CRUD |
| `legal` | Application-owned | Legal Entities | Not exposed for transactional CRUD |
| `masterdata` | Application-owned | Activities and Branches | Not exposed for transactional CRUD |
| `requests` | Application-owned | Service Requests | Not exposed for transactional CRUD |
| `balaghat` | Application-owned | Business Notifications / Balaghat | Not exposed for transactional CRUD |
| `visits` | Application-owned | Field Visits | Not exposed for transactional CRUD |
| `dues` | Application-owned | Dues and Payment Evidence | Not exposed for transactional CRUD |
| `files` | Application-owned | Attachments and Private Files | Not exposed for transactional CRUD |
| `notify` | Application-owned | Notification Delivery | Not exposed for transactional CRUD |
| `imports` | Application-owned | Imports and Data Quality | Not exposed for transactional CRUD |
| `content` | Application-owned | Content Management | Not exposed for transactional CRUD |
| `audit` | Application-owned | Audit and Security | Not exposed for transactional CRUD |
| `reporting` | Application-owned | Reporting and Analytics | Not exposed for transactional CRUD |

**Schema count (proposed):** 16 (2 managed + 14 application-owned).
**Catalogued application TABLE IDs (proposed):** 94 (TABLE-001…TABLE-094).

**Dual outbox (binding, PROPOSED):** `audit.domain_event_outbox` (TABLE-094) stores committed **domain events** for reliable async publication. `notify.notification_outbox_messages` (TABLE-072) is the **notification delivery** outbox only. The two objects are separate and must not be conflated.

---

## Schema: `auth` (Supabase-managed)

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Platform authentication identities, sessions/tokens, and credential material managed by Supabase Auth. Logical **Authentication Identity** maps here (`auth.users` reference), not to an application password table. |
| **Owner** | Supabase Auth platform; NestJS Identity and Access consumes identity identifiers. |
| **Exposure** | Platform Auth APIs only. Application business tables must not be PostgREST-writable via anon/authenticated roles. |
| **Permitted writers** | Supabase Auth service paths only. Application NestJS must not invent a parallel password/credential store. |
| **Readers** | NestJS Identity services (server-side); constrained Auth client flows for sign-in only. |
| **NestJS relationship** | Identity module links `auth.users.id` to `identity.user_profiles`. Authorization for business data remains NestJS server-side. |
| **Auth/Storage relationship** | Auth identity is the root subject for session; Storage policies must not grant broad business-table access by Auth alone. |
| **Migration ownership** | Platform/Supabase Auth migrations and project config; application migrations must not recreate `auth.users`. |
| **Backup/retention concern** | Auth backup follows environment strategy; retention/PII minimization **يحتاج اعتماد لاحق** (DM-17, DM-18). |
| **Open decisions** | Session lifetime, MFA/OTP minimization, lockout policy linkage to app profiles — **يحتاج اعتماد لاحق**. |

---

## Schema: `storage` (Supabase-managed)

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Private object storage for operational attachments and controlled public publication assets when Content Management explicitly publishes. |
| **Owner** | Supabase Storage platform; NestJS Attachments module owns business metadata in `files` and mediates access. |
| **Exposure** | Private buckets by default. No anonymous public listing of operational files. |
| **Permitted writers** | NestJS (service role / signed upload path) only for operational objects. Clients never hold service-role. |
| **Readers** | NestJS-mediated short-lived signed URLs for authorized actors; Content Management may expose approved public objects only under publication rules. |
| **NestJS relationship** | `files.attachments` stores logical metadata and storage object keys; Storage holds blobs only. |
| **Auth/Storage relationship** | Auth identity alone does not authorize file read; NestJS checks purpose, classification, and linkage. |
| **Migration ownership** | Bucket/policy configuration owned with Attachments + ops; not application table DDL. |
| **Backup/retention concern** | Object retention, legal hold, replaced-version treatment — **يحتاج اعتماد لاحق** (DM-09/DM-10/DM-17/DM-26). |
| **Open decisions** | Bucket topology, virus-scan placement, accounting metrics source — **يحتاج اعتماد لاحق**. |

---

## Schema: `identity`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Application user profiles, staff profiles, roles, permissions, grants, and sensitive permission-change evidence. |
| **Owner** | NestJS **Identity and Access** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Identity; other modules read via NestJS contracts (actor, permissions, staff eligibility). Audit/Reporting may read authorized projections. |
| **NestJS relationship** | Owns mutations for profiles, roles, grants; emits audit events; may enroll security notifications via Notification Delivery outbox. |
| **Auth/Storage relationship** | References `auth.users`; does not store passwords; does not own Storage objects. |
| **Migration ownership** | Application migrations under Identity ownership for `identity.*` objects. |
| **Backup/retention concern** | Effective authorization history retained; destruction periods **يحتاج اعتماد لاحق** (DM-17). |
| **Open decisions** | Representation attributes, staff purpose fields, sensitive-threshold catalogue — **يحتاج اعتماد لاحق** (DM-13, DM-14). |

---

## Schema: `registry`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Taxpayer registry: taxpayers, contacts, account links (ربط حساب المستخدم بملف المكلّف), and taxpayer–legal-entity associations. |
| **Owner** | NestJS **Taxpayer Registry** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Registry; Service Requests / Balaghat / Visits / Dues read via contracts; own-data path requires Account Link. |
| **NestJS relationship** | Own-data authorization path: Authentication Identity → User Profile → Account Link → Taxpayer. Does not mutate Legal Entities master rows. |
| **Auth/Storage relationship** | No direct Auth write; profile docs via Attachments/Storage when linked. |
| **Migration ownership** | Application migrations under Taxpayer Registry for `registry.*`. |
| **Backup/retention concern** | Account Link grant/revoke history retained; merge/split/correction policy **يحتاج اعتماد لاحق** (DM-03, DM-21). |
| **Open decisions** | Multiple-taxpayer linkage, delegated representation — **يحتاج اعتماد لاحق** (DM-21). |

---

## Schema: `legal`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Legal entity master data and Tax Number ownership (Tax Number is not owned by Taxpayer Registry). |
| **Owner** | NestJS **Legal Entities** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Legal Entities; Registry association readers; Requests/Balaghat/Imports via contracts. |
| **NestJS relationship** | Issues/verifies/replaces/invalidates tax numbers; Registry may display/read but not redefine ownership. |
| **Auth/Storage relationship** | Evidence attachments via `files` + private Storage when required. |
| **Migration ownership** | Application migrations under Legal Entities for `legal.*`. |
| **Backup/retention concern** | Issuance/evidence lineage retained; uniqueness/duplicate procedure **يحتاج اعتماد لاحق** (DM-04, DM-23). |
| **Open decisions** | Tax Number format, uniqueness scope, versioning — **يحتاج اعتماد لاحق**. |

---

## Schema: `masterdata`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Commercial activities, branches, addresses, status history, properties, property units, ownership records/history, and optional unit-level ownership association. |
| **Owner** | NestJS **Activities and Branches** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. Derived Taxpayer↔Property navigation is a **view**, not an authoritative table. |
| **Permitted writers** | NestJS service role only (Activities and Branches applies approved effects). |
| **Readers** | NestJS masterdata; Requests/Balaghat read subjects but must not mutate; Reporting projections. |
| **NestJS relationship** | Validates and applies Activity/Branch/Property effects after authorized Request/Balagh checkpoints (IR-72). Does not import Balaghat module. |
| **Auth/Storage relationship** | No Auth credential store; ownership evidence files via Attachments. |
| **Migration ownership** | Application migrations under Activities and Branches for `masterdata.*`. |
| **Backup/retention concern** | Ownership history append-only; effective-dating policy **يحتاج اعتماد لاحق** (DM-05, DM-24). |
| **Open decisions** | Property ownership unit association alternatives (property-only vs unit-only vs both) — **يحتاج اعتماد لاحق**; geographical structure OD-05 — **يحتاج اعتماد لاحق**. |

---

## Schema: `requests`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Service types and full طلب lifecycle aggregates (selections, hybrid form snapshots, status/assignment history, completion, decisions, close/archive, reopen). |
| **Owner** | NestJS **Service Requests** module (owns request-flow orchestration). |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Service Requests; related modules via contracts; Reporting derived history. |
| **NestJS relationship** | Coordinates visits, dues, attachments, notify, audit; requests masterdata effects without mutating `masterdata` directly. |
| **Auth/Storage relationship** | Actor via Identity/Auth; request attachments via private Storage + `files`. |
| **Migration ownership** | Application migrations under Service Requests for `requests.*`. Naming prefix `request_*` (never a table named `cases`). |
| **Backup/retention concern** | Snapshots and decision lineage retained; draft deletion policy **يحتاج اعتماد لاحق** (DMOD-06, DM-06, DM-07). |
| **Open decisions** | Snapshot JSONB shape versioning, reopen authority, reason catalogs — **يحتاج اعتماد لاحق**. |

---

## Schema: `balaghat`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | بلاغ lifecycle aggregates distinct from requests (`balagh_*` naming). Multiple activities allowed; no direct Activity/Branch/Property mutation from this schema. |
| **Owner** | NestJS **Business Notifications / Balaghat** module (owns Balagh-flow orchestration). |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Balaghat; related modules via contracts; subject references do not authorize masterdata mutation. |
| **NestJS relationship** | Coordinates visits/dues/attachments/notify/audit; emits effect requests to Activities and Branches after approval. |
| **Auth/Storage relationship** | Actor via Identity/Auth; Balagh attachments via private Storage + `files`. |
| **Migration ownership** | Application migrations under Balaghat for `balaghat.*`. |
| **Backup/retention concern** | Snapshots and decision lineage retained; reopen authority **يحتاج اعتماد لاحق** (DMOD-11). |
| **Open decisions** | Multi-activity constraints, decision visibility — **يحتاج اعتماد لاحق** (DM-06, DM-07). |

---

## Schema: `visits`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Field visits, schedules, team membership, results, corrections, and visit evidence links. |
| **Owner** | NestJS **Field Visits** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Field Visits; Service Requests/Balaghat via contracts; masked team visibility per policy. |
| **NestJS relationship** | References eligible Staff Profile; does not finalize Request/Balagh decisions. |
| **Auth/Storage relationship** | Evidence binaries in private Storage; metadata/links in `files` / visit evidence rows. |
| **Migration ownership** | Application migrations under Field Visits for `visits.*`. |
| **Backup/retention concern** | Result/correction lineage retained; visibility/masking **يحتاج اعتماد لاحق** (DM-08, DMOD-15). |
| **Open decisions** | Result structure, correction authority, service-specific triggers — **يحتاج اعتماد لاحق**. |

---

## Schema: `dues`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Payment dues, basis references, corrections, payment notices, receipts, receipt replacement lineage, and payment confirmations. Manual model only (no gateway settlement tables in this design). |
| **Owner** | NestJS **Dues and Payment Evidence** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Dues; Requests/Balaghat/Notify via contracts; Highly Sensitive handling. |
| **NestJS relationship** | Confirmation requires accepted receipt; payment does not grant final Request/Balagh approval. |
| **Auth/Storage relationship** | Receipt/basis documents via private Storage + `files`. |
| **Migration ownership** | Application migrations under Dues for `dues.*`. |
| **Backup/retention concern** | Receipt replacement lineage retained; Due–Receipt cardinality **يحتاج اعتماد لاحق** (DM-22). |
| **Open decisions** | **DM-22:** no approved allocation table/FK cardinality. **PROPOSED stance:** no independent Due–Receipt allocation physical object until DM-22 is resolved. Optional future `due_receipt_links` remains non-approved. |

---

## Schema: `files`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Attachment metadata, polymorphic attachment links, version/replacement history. Access classification is a **column** on attachments (not a separate table). |
| **Owner** | NestJS **Attachments and Private Files** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Attachments; owning business modules via contracts; reports get aggregate/status only. |
| **NestJS relationship** | Owns metadata and access mediation; does not own business approval decisions. |
| **Auth/Storage relationship** | Maps to `storage.objects` keys; Auth does not bypass NestJS checks. |
| **Migration ownership** | Application migrations under Attachments for `files.*`. |
| **Backup/retention concern** | Logical size, classification, storage accounting, retention/deletion status — **يحتاج اعتماد لاحق** (DM-10, DM-26). |
| **Open decisions** | Classification taxonomy, legal holds, replacement evidence — **يحتاج اعتماد لاحق**. |

---

## Schema: `notify`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Notification messages, delivery attempts/retries, templates/types, channel configuration, recipient read state, and **notification delivery** outbox (`notify.notification_outbox_messages`, TABLE-072) for the delivery worker (ADR-007). |
| **Owner** | NestJS **Notification Delivery** module (+ worker consumption of the **delivery** outbox). |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only (and worker role for TABLE-072 claim/update as designed). |
| **Readers** | NestJS Notify; authorized recipient for own read-state; operational readers purpose-limited. |
| **NestJS relationship** | Delivers messages; does not decide business outcomes; does **not** own domain-event enrollment (that is TABLE-094 in `audit`). Optional Payment Notice context. |
| **Auth/Storage relationship** | Recipient tied to profile/identity; no Storage ownership. |
| **Migration ownership** | Application migrations under Notification Delivery for `notify.*`. |
| **Backup/retention concern** | Append-only delivery/read history; OTP minimization and retention — **يحتاج اعتماد لاحق** (DM-11, DM-25). |
| **Open decisions** | Read vs acknowledged semantics, channel capabilities — **يحتاج اعتماد لاحق** (DM-25). |

---

## Schema: `imports`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Import batches and retained lifecycle records: preview, validation, row results, errors, approval, rejection, failure, commit (separate retained outcomes). |
| **Owner** | NestJS **Imports and Data Quality** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Imports; Audit Restricted evidence readers; target modules receive applied results via contracts after commit. |
| **NestJS relationship** | Idempotency/deduplication disposition retained; two-person approval policy **يحتاج اعتماد لاحق**. |
| **Auth/Storage relationship** | Source/error files via private Storage + `files`; never Public by admin label alone. |
| **Migration ownership** | Application migrations under Imports for `imports.*`. |
| **Backup/retention concern** | Full lifecycle outcome retention; remediation taxonomy **يحتاج اعتماد لاحق** (DM-12, DMOD-13). |
| **Open decisions** | Source taxonomy, approval exceptions — **يحتاج اعتماد لاحق**. |

---

## Schema: `content`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Content items, revisions, publication/withdrawal records, announcement validity periods. Public attachment context only with approved publication and no sensitive data. |
| **Owner** | NestJS **Content Management** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. Approved public read models may be published via controlled channels — **يحتاج اعتماد لاحق** for exact pattern. |
| **Permitted writers** | NestJS service role only. |
| **Readers** | NestJS Content; public surfaces only for approved published content. |
| **NestJS relationship** | Publication approval workflow; does not publish taxpayer/case/payment/visit/audit/import evidence as Public. |
| **Auth/Storage relationship** | May reference Storage objects that are explicitly publishable; transaction attachments remain private. |
| **Migration ownership** | Application migrations under Content Management for `content.*`. |
| **Backup/retention concern** | Revision/publication lineage retained; approval policy **يحتاج اعتماد لاحق** (DMOD-10). |
| **Open decisions** | Publication approval chain, validity rules — **يحتاج اعتماد لاحق**. |

---

## Schema: `audit`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Append-only audit events, sensitive change details, access/security events, and the **domain-event outbox** (`audit.domain_event_outbox`, TABLE-094) for all catalogued domain events. Supporting evidence / infrastructure only — never decision owner. |
| **Owner** | NestJS **Audit and Security** module (+ worker claim/publish on TABLE-094). |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. |
| **Permitted writers** | NestJS service role only (append-oriented enroll for TABLE-094; append for audit evidence). |
| **Readers** | Narrowly authorized Audit Restricted roles via NestJS; worker/ops limited for outbox processing. |
| **NestJS relationship** | Receives audit evidence from all modules; enrolls domain events in TABLE-094; does not mutate business aggregates; does not own notification delivery (TABLE-072). |
| **Auth/Storage relationship** | Actor Context embedded on audit events (see mapping); may reference Auth subject id without storing credentials. |
| **Migration ownership** | Application migrations under Audit for `audit.*` (including TABLE-094). |
| **Backup/retention concern** | Append-only; hard-delete forbidden by design; outbox retention **يحتاج اعتماد لاحق** (DM-17, DM-18). |
| **Open decisions** | Audit catalogue, sensitive threshold, actor-context shape — **يحتاج اعتماد لاحق** (DM-13). |

---

## Schema: `reporting`

| Aspect | PROPOSED content |
| --- | --- |
| **Purpose** | Domain event history records for analytics, projection definitions, saved report filters, and report export records. Derived/read-oriented; does not own transactional truth. |
| **Owner** | NestJS **Reporting and Analytics** module. |
| **Exposure** | Default **not** PostgREST-exposed for transactional CRUD. Projection rebuild jobs are server-side only. |
| **Permitted writers** | NestJS service role / reporting worker only for derived projection maintenance and export metadata. |
| **Readers** | NestJS Reporting under `report.view` / `report.export` permissions; exports retain requesting User Profile. |
| **NestJS relationship** | Reads approved projections/history; never mutates Request/Balagh/Due/masterdata authoritative rows. |
| **Auth/Storage relationship** | Export artifacts may use private Storage; Authz remains NestJS. |
| **Migration ownership** | Application migrations under Reporting for `reporting.*`. |
| **Backup/retention concern** | Projection freshness/rebuild/reconciliation — **يحتاج اعتماد لاحق** (DM-15, DM-16, DMOD-12). |
| **Open decisions** | Masking, aggregation, scheduling, consent/analytics scope — **يحتاج اعتماد لاحق** (DM-16, DM-19). |

---

## Cross-cutting physical conventions (PROPOSED)

| Convention | PROPOSED rule |
| --- | --- |
| Table naming | `lowercase_snake_case`, **plural** table names |
| Request vs Balagh | Distinct schemas and `request_*` / `balagh_*` prefixes; **no** table named `cases` |
| Writers | NestJS privileged DB role only for application schemas |
| Clients | No direct business mutation; no service-role in clients |
| PostgREST | Transactional application schemas not exposed for client CRUD by default |
| Migrations | Owned per schema/module; canonical path `supabase/migrations/` via Supabase CLI (former `database/migrations/` path superseded before remote apply) |
| Secrets | Never stored in schema docs or client config samples here |

## Related documents

- `MARIB-TAX-LOGICAL-TO-PHYSICAL-MAPPING-01.md` — entity-to-object mapping (92 rows)
- `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01.md` — application-owned table catalogue
- `docs/governance/MARIB-TAX-DATA-MODEL-OPEN-DECISIONS-01.md` — open decision register
- `docs/architecture/adr/ADR-005-POSTGRES-SUPABASE.md`, `ADR-010-NO-DIRECT-CLIENT-DATABASE-WRITES.md`
