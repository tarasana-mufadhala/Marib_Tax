# MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01

**Document ID:** MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01
**Status:** PROPOSED future migration batch sequence (documentation only)
**Companions:** `MARIB-TAX-PHYSICAL-SCHEMA-ARCHITECTURE-01`, `MARIB-TAX-PHYSICAL-TABLE-CATALOG-01`, `MARIB-TAX-PHYSICAL-RELATIONAL-INTEGRITY-01`, `MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01`, `MARIB-TAX-RLS-DATABASE-ACCESS-REQUIREMENTS-01`, `MARIB-TAX-SUPABASE-STORAGE-PHYSICAL-DESIGN-01`

> Unresolved items are **يحتاج اعتماد لاحق**. Recommendations are **PROPOSED** only.
> **No migration files**, no executable SQL, no secrets in this document.
> This is a **future** apply-order plan for when migrations are authorized — not an instruction to run DDL now.

## 1. Global operating rules (non-negotiable)

1. **One batch at a time.** Do not start batch *N+1* until batch *N* is applied, validated, and accepted.
2. **Validate after each batch.** Structural checks, privilege checks, and smoke reads/writes through NestJS (never Flutter/Next privileged DB roles).
3. **Stop on failure.** On any apply/validation failure: stop the sequence, preserve evidence, do not “skip ahead.”
4. **No destructive cleanup without approval.** Dropping schemas/tables, truncating evidence, or irreversible data cleanup requires explicit Change Control / security approval.
5. **Clients never mutate business tables** (ADR-010). Service-role credentials never ship in Flutter/Next.
6. **Forward-only preference.** Prefer additive corrective migrations over destructive rollback of production data.
7. **Open decisions gate.** Batches that encode unresolved PHY/DM choices must not invent silent defaults that contradict **يحتاج اعتماد لاحق** registers.

### Shared fields used in every batch

| Field | Meaning |
| --- | --- |
| Dependencies | Prior batches / platform prerequisites that must already be green |
| Objects | Schemas / tables / supporting objects in scope (by catalogue) |
| Constraints | PK/FK/UNIQUE/CHECK/code-table posture introduced in this batch |
| Backfill | Data movement / seed / historical rebuild expectations |
| Later verification | Checks to run after apply (and again before go-live if deferred) |
| Rollback | Non-destructive preferred path; destructive only with approval |
| Data-loss risks | What can be lost or corrupted if mishandled |
| Security gate | Authz/RLS/secrets conditions that must hold |
| Stop conditions | Explicit reasons to halt the sequence |

---

## 2. Batch catalogue (1–18)

### Batch 1 — Extensions and application schemas

| Field | Content |
| --- | --- |
| **Dependencies** | Target PostgreSQL/Supabase project available; environment strategy approved; no app DDL yet required |
| **Objects** | Required extensions (**PROPOSED** inventory only — exact extension set **يحتاج اعتماد لاحق**); create empty application schemas: `identity`, `registry`, `legal`, `masterdata`, `requests`, `balaghat`, `visits`, `dues`, `files`, `notify`, `imports`, `content`, `audit`, `reporting`. Do **not** recreate managed `auth` / `storage`. |
| **Constraints** | Schema ownership/privileges baseline for migration role only; no business FKs yet |
| **Backfill** | None |
| **Later verification** | Schemas exist; search_path policy documented; managed schemas untouched |
| **Rollback** | Drop empty application schemas only if unused and approved; never drop `auth`/`storage` |
| **Data-loss risks** | Low if schemas empty; high if wrongly dropping managed schemas |
| **Security gate** | Migration credentials server-side only; no client exposure |
| **Stop conditions** | Cannot create schemas; extension conflict; accidental touch of managed Auth/Storage DDL |

### Batch 2 — Identity profiles

| Field | Content |
| --- | --- |
| **Dependencies** | Batch 1; Supabase Auth usable (`auth.users` exists as managed reference) |
| **Objects** | TABLE-001 `identity.user_profiles`; TABLE-002 `identity.staff_profiles` |
| **Constraints** | PKs; UNIQUE `auth_user_id` → `auth.users`; staff↔user linkage UNIQUE **PROPOSED**; soft-archive columns |
| **Backfill** | Optional controlled bootstrap of initial operator profiles (**يحتاج اعتماد لاحق** for bootstrap process) |
| **Later verification** | Profile↔Auth join works server-side; no password columns in app tables |
| **Rollback** | Soft-disable new tables if unused; do not delete Auth users as “rollback” |
| **Data-loss risks** | Orphan profiles if Auth users removed externally; staff eligibility loss if hard-deleted |
| **Security gate** | No PostgREST CRUD exposure; NestJS-only writes |
| **Stop conditions** | Auth FK/reference failure; profile uniqueness violation; discovery of credential columns |

### Batch 3 — Roles and permissions

| Field | Content |
| --- | --- |
| **Dependencies** | Batch 2 |
| **Objects** | TABLE-003 `roles`; TABLE-004 `permissions`; TABLE-005 `role_assignments`; TABLE-006 `role_permissions`; TABLE-007 `sensitive_permission_changes` |
| **Constraints** | Catalogue PKs; assignment effective dating; append-only posture for sensitive permission changes |
| **Backfill** | Seed baseline role/permission catalogues from permissions baseline (**PROPOSED** codes; final identifier names **يحتاج اعتماد لاحق**) |
| **Later verification** | Grant/revoke audited; cannot assign unknown permission codes |
| **Rollback** | End-date assignments; avoid hard-delete of grant history |
| **Data-loss risks** | Loss of authorization evidence if hard-deleted; privilege escalation if seed wrong |
| **Security gate** | Sensitive permission changes readable only Audit Restricted paths |
| **Stop conditions** | Seed mismatch with authz matrix; missing SoD markers for later import rules |

### Batch 4 — Taxpayer registry and legal entities

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 2–3 (actors exist for audited creates) |
| **Objects** | TABLE-008…011 (`taxpayers`, `taxpayer_contacts`, `taxpayer_account_links`, `taxpayer_legal_entity_associations`); TABLE-012…013 (`legal_entities`, `tax_numbers`) |
| **Constraints** | Registry owns associations; Legal owns tax numbers; Account Link path constraints; tax-number uniqueness **not** silently fixed (DM-04/DM-23 **يحتاج اعتماد لاحق**) |
| **Backfill** | None unless approved legacy import (then via Imports module later — do not bypass) |
| **Later verification** | Own-data path Identity→Profile→Link→Taxpayer; phone/tax not usable as sole auth proof |
| **Rollback** | Soft-archive preferred; retain link grant/revoke evidence |
| **Data-loss risks** | Contact/tax PII loss; broken own-data authorization if links purged |
| **Security gate** | Highly Sensitive masking posture; no client writes |
| **Stop conditions** | Attempt to place tax numbers under registry ownership; multiplicity rules contradict DM-21 without approval |

### Batch 5 — Master data (activities, property, ownership)

| Field | Content |
| --- | --- |
| **Dependencies** | Batch 4 (taxpayer/legal parties exist for ownership parties) |
| **Objects** | TABLE-014…022 (`commercial_activities`, `branches`, `activity_addresses`, `activity_status_histories`, `properties`, `property_units`, `property_ownership_records`, optional `property_ownership_units`, `property_ownership_histories`); derived VIEW `masterdata.v_taxpayer_properties` (**PROPOSED**, non-authoritative) |
| **Constraints** | No second authoritative Taxpayer↔Property FK (DM-24); TABLE-021 adoption remains **PROPOSED/open** — do not treat as final business rule |
| **Backfill** | None for greenfield; ownership history must be append-only if seeded |
| **Later verification** | Derived view matches active ownership only; unit association present only if approved |
| **Rollback** | Drop derived view safely; do not erase ownership histories |
| **Data-loss risks** | Permanent loss of ownership lineage if history truncated |
| **Security gate** | Highly Sensitive ownership; NestJS-only mutations after authorized case effects |
| **Stop conditions** | Introducing direct authoritative taxpayer_id on properties; closing ownership grain without office approval |

### Batch 6 — Service requests family

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 3–5 (service types, taxpayers, activities selectable) |
| **Objects** | TABLE-023…036 (service types through reopen records, including form snapshot header/payload hybrid) |
| **Constraints** | Selected branch under selected activity (REL-028); append-only status/assignment/decision revision histories; draft-delete policy **يحتاج اعتماد لاحق** (DMOD-06) |
| **Backfill** | Seed `service_types` for FR-201…206; no silent rewrite of snapshot payloads |
| **Later verification** | Public ref uniqueness when issued; decision VO embedded columns present; no table named `cases` |
| **Rollback** | Prefer soft-close; never delete status history to “undo” |
| **Data-loss risks** | Loss of workflow evidence; irreversible draft purge if policy wrong |
| **Security gate** | Highly Sensitive snapshots; NestJS-only writes |
| **Stop conditions** | Form JSONB vs typed split contradicts approved hybrid mapping; missing history tables |

### Batch 7 — Balaghat family

| Field | Content |
| --- | --- |
| **Dependencies** | Batch 6 patterns aligned; batches 4–5 for subjects/selections |
| **Objects** | TABLE-037…049 (parallel balagh family including snapshots, decisions, close/reopen) |
| **Constraints** | Parallel to requests; selected branch under selected activity (REL-044); no subject master mutation from balagh module |
| **Backfill** | None greenfield |
| **Later verification** | Request vs balagh isolation; multi-activity selection works; decision revisions append-only |
| **Rollback** | Soft-close; retain histories |
| **Data-loss risks** | Same class as requests — workflow evidence loss |
| **Security gate** | Same NestJS-only / no client DB writes |
| **Stop conditions** | Merging balagh into requests schema; circular write dependency into masterdata |

### Batch 8 — Attachments metadata (files schema)

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 6–7 (linkable parents exist); Storage project available as managed platform |
| **Objects** | TABLE-063…065 (`attachments`, `attachment_links`, `attachment_version_histories`) |
| **Constraints** | Access classification as **columns** (not separate table); polymorphic `owner_type` constrained by app; reference ≠ authorization |
| **Backfill** | None; do not invent orphan storage objects without metadata |
| **Later verification** | Links resolve to known owner families; version lineage append-only; no public ACL assumed |
| **Rollback** | Soft deletion/retention status; no silent purge of version lineage |
| **Data-loss risks** | Orphan blobs vs orphan metadata; legal-hold violations if deleted early |
| **Security gate** | Private by default; NestJS mediates access; no service-role in clients |
| **Stop conditions** | Storing bytes in Postgres as substitute for Storage; public buckets for operational files |

### Batch 9 — Field visits

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 6–8 (case parents + evidence attachments) |
| **Objects** | TABLE-050…055 (`field_visits`, `visit_schedules`, `visit_team_members`, `visit_results`, `visit_result_corrections`, `visit_evidences`) |
| **Constraints** | Exactly one case context (request XOR balagh) **PROPOSED** app+check; corrections additive; team masking policy open (DM-08) |
| **Backfill** | None |
| **Later verification** | Visit cannot reference both or neither case parents; evidence links to files |
| **Rollback** | Archive visits; do not hard-delete corrections |
| **Data-loss risks** | Loss of inspection evidence / correction lineage |
| **Security gate** | Highly Sensitive results; staff eligibility via staff_profiles |
| **Stop conditions** | Visit triggers encoded as hard-coded silent defaults contradicting DMOD-08 without approval |

### Batch 10 — Dues and payment evidence

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 6–9 (case + attachment basis docs) |
| **Objects** | TABLE-056…062 (`payment_dues`, basis refs, corrections, notices, receipts, receipt replacements, confirmations) |
| **Constraints** | **No** `due_receipt_links` (or fixed Due–Receipt FK cardinality) until DM-22 resolved; no payment-gateway columns; confirmation requires accepted receipt; confirmation ≠ final case approval |
| **Backfill** | None |
| **Later verification** | Manual model only; partial-payment behavior not silently assumed; replacement lineage intact |
| **Rollback** | Archive dues; retain correction/replacement evidence |
| **Data-loss risks** | Financial evidence loss; false “paid/approved” if confirmation misused as final decision |
| **Security gate** | Highly Sensitive amounts/receipts; NestJS-only |
| **Stop conditions** | Adding checkout/provider settlement columns; fixing Due–Receipt cardinality without DM-22 approval |

### Batch 11 — Notify and notification delivery outbox

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 2–3 (recipients/actors); case modules for caseRef; ADR-007 delivery alignment |
| **Objects** | TABLE-066…072 (messages, attempts, retries, templates, channel configs, read states, `notify.notification_outbox_messages`) — TABLE-072 is the **notification delivery outbox only** (SMS/push/WhatsApp-compatible delivery queue). It is **not** the domain-event outbox (see TABLE-094 in Batch 14). |
| **Constraints** | Delivery ≠ read; OTP minimization; secrets for providers **out-of-band** (not in channel config values committed to docs/repo); no domain-event enrollment into TABLE-072 |
| **Backfill** | Seed templates/channels without secrets |
| **Later verification** | Delivery worker can claim TABLE-072 rows; read-state independent of delivery; idempotent enroll; domain events are absent from this batch |
| **Rollback** | Pause delivery worker; retain outbox/attempt evidence per retention policy (**يحتاج اعتماد لاحق**) |
| **Data-loss risks** | Lost notifications if delivery outbox purged early; PII leakage in payloads |
| **Security gate** | No client direct outbox writes; worker uses server credentials |
| **Stop conditions** | Embedding OTP codes or raw phones in reportable cleartext columns beyond policy; treating TABLE-072 as domain-event store |

### Batch 12 — Imports and data quality

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 4–5 (target masters); batch 3 (SoD actors); batch 8 (import files) |
| **Objects** | TABLE-073…081 (batches through commits) |
| **Constraints** | Distinct preview/validation/approval/rejection/failure/commit records; approving actor ≠ committing actor unless audited exception (DMOD-13 **يحتاج اعتماد لاحق**); idempotent commit disposition |
| **Backfill** | Staging retention policy **يحتاج اعتماد لاحق** — do not auto-destroy row evidence |
| **Later verification** | Commit cannot bypass validation evidence; idempotency key disposition retained |
| **Rollback** | Reject/fail batch; never silently delete approval/commit evidence |
| **Data-loss risks** | Irreversible master changes if commit rolled back incorrectly; staging PII retention mishandled |
| **Security gate** | Audit Restricted imports; no client DB import writes |
| **Stop conditions** | Single-actor approve+commit enabled globally without approved exception process |

### Batch 13 — Content management

| Field | Content |
| --- | --- |
| **Dependencies** | Batch 8 (optional public assets); batch 3 (publish authority) |
| **Objects** | TABLE-082…086 (content items, revisions, publication, withdrawal, announcement validity) |
| **Constraints** | Public attachment eligibility only after publication rules; withdrawal retained |
| **Backfill** | None |
| **Later verification** | Drafts not publicly readable; validity windows enforced in app |
| **Rollback** | Withdraw publication; retain revision lineage |
| **Data-loss risks** | Accidental public exposure of drafts; loss of publication evidence |
| **Security gate** | Only `mt-content-public` (or approved public bucket) for published assets |
| **Stop conditions** | Publishing without publication_records evidence; approval flow contradicting DMOD-10 without decision |

### Batch 14 — Audit, security evidence, and domain-event outbox

| Field | Content |
| --- | --- |
| **Dependencies** | Identity + all mutating modules ideally emitting events; Batch 11 delivery outbox may already exist but is **independent**. May scaffold early; **full** verification after producers exist |
| **Objects** | TABLE-087…089 (`audit_events` with embedded Actor Context, `sensitive_change_details`, `access_security_events`); TABLE-094 `audit.domain_event_outbox` (domain-event outbox for all **56** catalogued domain events — **not** notification delivery) |
| **Constraints** | Audit append-only; no hard-delete; before/after masking columns **PROPOSED**; actor shape **يحتاج اعتماد لاحق** (DM-13); TABLE-094 append-oriented Pending→published/dead; `event_id` UNIQUE; dual-outbox separation from TABLE-072 mandatory |
| **Backfill** | None required; do not fabricate historical audits or domain events |
| **Later verification** | Correlation ids join across modules; sensitive details child of audit_events; all 56 events enroll only in TABLE-094; TABLE-072 remains delivery-only |
| **Rollback** | **No** destructive rollback of audit/outbox rows without legal/security approval |
| **Data-loss risks** | Catastrophic compliance loss if truncated; lost async publication if TABLE-094 purged early |
| **Security gate** | Audit Restricted readers only; NestJS append/enroll paths; worker claim on TABLE-094 under server credentials |
| **Stop conditions** | UPDATE-in-place of audit rows; missing append-only controls; merging domain events into TABLE-072 |

### Batch 15 — Reporting support objects

| Field | Content |
| --- | --- |
| **Dependencies** | Batches 6–14 producers available for rebuildability; reporting design accepted as non-authoritative |
| **Objects** | TABLE-090…093 (`domain_event_history_records`, `reporting_projection_definitions`, `saved_report_filters`, `report_export_records`); optional thin VIEWs/matviews per reporting design (**PROPOSED**, justified only) |
| **Constraints** | Reporting cannot mutate business aggregates; export evidence required for exports; Report 29 has no invented analytics tables |
| **Backfill** | Optional rebuild of projections from authoritative histories; freshness **يحتاج اعتماد لاحق** (DM-15) |
| **Later verification** | Rebuild job reproduces projections; `report.view` vs `report.export` separated |
| **Rollback** | Drop/rebuild derived objects only; never roll back business data via reporting |
| **Data-loss risks** | Stale projections misread as SoT if labeled wrong; export evidence loss |
| **Security gate** | Masking on report readers; restricted reports 18/25–27 |
| **Stop conditions** | Writing business corrections from report rebuilds; inventing Report 29 provider schema |

### Batch 16 — Late / secondary indexes

| Field | Content |
| --- | --- |
| **Dependencies** | Tables from batches 2–15 exist; 66 index candidates catalogued |
| **Objects** | Non-blocking / secondary indexes from `MARIB-TAX-INDEX-QUERY-ACCESS-PLAN-01` not required for initial FK integrity (queue, history, report, audit, notify, import paths). Exact column order/INCLUDE **يحتاج اعتماد لاحق**. |
| **Constraints** | Do not index phone/tax as authorization hot paths; do not assume Due–Receipt 1:1 shapes |
| **Backfill** | Index builds only (no business data rewrite) |
| **Later verification** | Explain critical NestJS queries; watch bloat; consolidate duplicates **يحتاج اعتماد لاحق** |
| **Rollback** | Drop added secondary indexes if harmful (non-data-destructive) |
| **Data-loss risks** | Low for data; risk is write amplification / lock issues during build |
| **Security gate** | Avoid indexes that force storing clear PII predicates unnecessarily |
| **Stop conditions** | Long blocking builds on production without approved window; uniqueness indexes that enforce open DM decisions prematurely |

### Batch 17 — RLS policies and grants

| Field | Content |
| --- | --- |
| **Dependencies** | Tables exist; NestJS server role model defined; RLS requirements doc accepted as requirements (mechanism still **يحتاج اعتماد لاحق**) |
| **Objects** | Defense-in-depth RLS policies on application tables; GRANT/REVOKE to API/worker/migrator roles; **no** broad anon/authenticated CRUD on transactional schemas |
| **Constraints** | NestJS remains authorization authority; RLS is defense-in-depth, not UI hiding |
| **Backfill** | None |
| **Later verification** | Client roles cannot mutate business tables; own-data path still enforced in NestJS; service-role absent from clients |
| **Rollback** | Tighten policies forward; disabling RLS in production requires security approval |
| **Data-loss risks** | Low direct; high breach risk if grants too broad |
| **Security gate** | Explicit checklist: no PostgREST writable business tables; least privilege DB roles |
| **Stop conditions** | Any grant that enables Flutter/Next privileged writes; RLS expressions that replace NestJS authz without approval |

### Batch 18 — Storage buckets and storage policies

| Field | Content |
| --- | --- |
| **Dependencies** | Batch 8 metadata model; ADR-009; content publication rules for public exception |
| **Objects** | **PROPOSED** private buckets (`mt-case-attachments`, `mt-visit-evidence`, `mt-payment-evidence`, `mt-import-files`, `mt-audit-evidence`) + publication-gated `mt-content-public`; storage policies; signed URL issuance path via NestJS. Signed URL expiry **يحتاج اعتماد لاحق**. |
| **Constraints** | Private by default; path knowledge ≠ authorization; public only for approved content |
| **Backfill** | None; do not migrate blobs without metadata linkage plan |
| **Later verification** | Unauthorized signed URL denied; operational buckets non-public; publication gate works |
| **Rollback** | Revoke policies / rotate; object deletion only with retention approval |
| **Data-loss risks** | Irreversible object delete; public exposure if mis-bucketed |
| **Security gate** | No long-lived privileged storage credentials in clients; audit package bucket restricted |
| **Stop conditions** | Public ACL on operational buckets; service-role in mobile/web; missing NestJS mediation |

---

## 3. Sequence diagram (logical)

```text
1 extensions/schemas
  → 2 identity profiles
    → 3 roles/permissions
      → 4 registry + legal
        → 5 masterdata/ownership
          → 6 requests
            → 7 balaghat
              → 8 files metadata
                → 9 visits
                  → 10 dues
                    → 11 notify + delivery outbox (TABLE-072)
                      → 12 imports
                        → 13 content
                          → 14 audit + domain-event outbox (TABLE-094)
                            → 15 reporting
                              → 16 late indexes
                                → 17 RLS/grants
                                  → 18 storage policies
```

## 4. Cross-batch validation checklist (**PROPOSED**)

After **each** batch:

1. Migration apply status recorded (success/failure, operator, timestamp).
2. Object inventory matches this document’s batch scope (no extras silently added).
3. NestJS smoke test path using server-only DB role.
4. Confirm Flutter/Next still cannot write business tables.
5. No secrets committed; channel/storage credentials remain out-of-band.
6. If failure: **stop**, ticket, preserve logs — do not continue to next batch.

Before production cutover (after batch 18):

1. Rebuildability spot-check for reporting projections.
2. RLS/grants adversarial check (client roles).
3. Storage private-by-default check.
4. Confirm open decisions that were temporarily deferred remain labeled **يحتاج اعتماد لاحق** (especially DM-22 Due–Receipt, TABLE-021 ownership units, DM-15 freshness).

## 5. Counts

| Metric | Count |
| --- | ---: |
| Migration batches specified | **18** |
| Application schemas created in batch 1 | **14** |
| Managed schemas referenced (not recreated) | **2** (`auth`, `storage`) |
| Catalogued application tables in scope (TABLE-001…094) | **94** |
| Dual outbox tables | **2** (TABLE-072 delivery; TABLE-094 domain events) |
| Index candidates deferred primarily to batch 16 | **66** |

**End of MARIB-TAX-PHYSICAL-MIGRATION-SEQUENCE-01**
